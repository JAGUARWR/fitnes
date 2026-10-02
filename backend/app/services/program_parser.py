import re
import json
import difflib
import logging
from typing import List, Optional
import httpx
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.exercise import Exercise
from app.models.program import WorkoutProgram, ProgramDay, ProgramExercise

logger = logging.getLogger("gym_app")


# ── Pydantic v2 Models ────────────────────────────────────────────────────────

class ParsedSet(BaseModel):
    set_number: int
    weight: float = 0.0
    reps: int = 10
    comment: Optional[str] = None


class ParsedExercise(BaseModel):
    name: str
    target_muscle: str = "Грудь"
    sets: List[ParsedSet] = Field(default_factory=list)


class ParsedDay(BaseModel):
    day_name: str
    exercises: List[ParsedExercise] = Field(default_factory=list)


class ParsedWorkoutResponse(BaseModel):
    program_title: str
    days: List[ParsedDay]


# ── AI Prompt ─────────────────────────────────────────────────────────────────

WORKOUT_PARSER_SYSTEM_PROMPT = """Ты — специализированный парсер фитнес-программ. Твоя задача — извлечь из сырого пользовательского текста (заметки, сообщения) тренировочную программу и вернуть СТРОГО валидный JSON без Markdown-разметки, без ```json, без комментариев и вводных слов.

### Правила нормализации:
1. Дни недели преобразуй в русские названия: "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье". Если день не указан, нумеруй: "День 1", "День 2".
2. Определи фокус мышечных групп: одно из "Грудь", "Спина", "Ноги", "Плечи", "Руки", "Пресс".
3. Очисти названия упражнений от номеров (1️⃣, 1., -), дефисов и весов. Название должно быть чистым: "Подъём EZ-штанги стоя", "Жим узким хватом в Смите", "Приседания со штангой".
4. Разбей параметры подходов:
   - sets: сгенерировать массив объектов с реальным количеством подходов:
     [ { "set_number": 1, "weight": 52.5, "reps": 12, "comment": null }, ... ]
   - Если указан диапазон повторений (8-10) — брать верхнюю планку (10).
   - Если вес не указан (собственный вес / bodyweight / MAX) — ставить weight: 0.0 и пометку в comment.
   - Если указан вес "по 22.5–25 кг с каждой стороны" (например, в Смите) — посчитай суммарный вес дисков (50.0).
   - Если сеты расписаны через запятую (например, "100х5, 120х5, 140х3") — создай каждый подход с его весом и повторениями.

### Схема выходного JSON:
{
  "program_title": "string (краткое название)",
  "days": [
    {
      "day_name": "string (например: Понедельник)",
      "exercises": [
        {
          "name": "string (чистое название упражнения)",
          "target_muscle": "string (Грудь, Спина, Ноги, Плечи, Руки или Пресс)",
          "sets": [
            {
              "set_number": 1,
              "weight": 42.5,
              "reps": 10,
              "comment": null
            }
          ]
        }
      ]
    }
  ]
}
"""


# ── Category & Equipment Helpers ─────────────────────────────────────────────

def infer_muscle_group(name: str) -> str:
    n = name.lower()
    if any(w in n for w in ["груд", "жим лежа", "жим лёжа", "отжимания", "пек-дек", "кроссовер", "бабочк"]):
        return "Грудь"
    if any(w in n for w in ["спин", "тяг", "подтягиван", "становая", "блок", "гиперэкстенз"]):
        return "Спина"
    if any(w in n for w in ["присед", "ног", "выпад", "квадрицепс", "бицепс бедра", "икр", "ягодиц"]):
        return "Ноги"
    if any(w in n for w in ["плеч", "дельт", "махи", "шраги", "арнольд", "армейск", "жим стоя"]):
        return "Плечи"
    if any(w in n for w in ["бицепс", "трицепс", "руки", "молот", "сгибани", "разгибани", "брусь", "француз"]):
        return "Руки"
    if any(w in n for w in ["пресс", "кора", "скручиван", "планк"]):
        return "Пресс"
    return "Грудь"


def map_muscle_to_category(target_muscle: str, name: str = "") -> str:
    tm = target_muscle.lower()
    if "груд" in tm:
        return "chest"
    if "спин" in tm:
        return "back"
    if "ног" in tm:
        return "legs"
    if "плеч" in tm or "дельт" in tm:
        return "shoulders"
    if "рук" in tm or "бицепс" in tm or "трицепс" in tm:
        n = name.lower()
        if any(w in n for w in ["трицепс", "разгибан", "брусь", "узким", "француз"]):
            return "triceps"
        return "biceps"
    if "пресс" in tm or "кор" in tm:
        return "core"
    return "chest"


def infer_equipment(name: str) -> str:
    n = name.lower()
    if any(w in n for w in ["гантел"]):
        return "dumbbell"
    if any(w in n for w in ["штанга", "штанги", "гриф", "ez", "т-гриф"]):
        return "barbell"
    if any(w in n for w in ["смит", "тренажер", "станок", "хаммер"]):
        return "machine"
    if any(w in n for w in ["блок", "кроссовер", "трос"]):
        return "cable"
    if any(w in n for w in ["брусь", "турник", "подтягиван", "свой вес", "планка"]):
        return "bodyweight"
    return "barbell"


# ── Universal Rule-Based Parser (Fallback & Offline) ─────────────────────────

def parse_single_exercise_line(line: str) -> Optional[ParsedExercise]:
    clean = re.sub(r"^[0-9\u20e3\ufe0f\s\.\-\•\*\)\(]+", "", line).strip()
    if not clean or len(clean) < 2:
        return None

    # Check for comma-separated sets: e.g. "Становая 100х5, 120х5, 140х3"
    comma_sets = re.findall(r"(\d+(?:[.,]\d+)?)\s*[xх*×]\s*(\d+)", clean, re.I)
    if len(comma_sets) >= 2:
        first_m = re.search(r"\b\d+(?:[.,]\d+)?\s*[xх*×]\s*\d+", clean, re.I)
        name = clean[:first_m.start()].strip() if first_m else clean
        name = re.sub(r"[\s\-—–:]+$", "", name).strip()
        sets: List[ParsedSet] = []
        for idx, (w_str, r_str) in enumerate(comma_sets, start=1):
            sets.append(ParsedSet(
                set_number=idx,
                weight=float(w_str.replace(",", ".")),
                reps=int(r_str),
                comment=None
            ))
        return ParsedExercise(
            name=name,
            target_muscle=infer_muscle_group(name),
            sets=sets
        )

    # Standard split: name and tail
    sep_m = re.search(r"\s+[-—–:]\s+|\s*[-—–:]\s*(?=\d+\s*[xх*×]|\d+\s*по|\d+\s*подход)", clean)
    if sep_m:
        title_raw = clean[:sep_m.start()].strip()
        params = clean[sep_m.end():].strip()
    else:
        m = re.search(r"(?=\b\d+\s*[xх*×]|\b\d+\s*по|\b\d+\s*подход)", clean)
        if m and m.start() > 0:
            title_raw = clean[:m.start()].strip()
            params = clean[m.start():].strip()
        else:
            title_raw = clean
            params = ""

    name = re.sub(r"[\s\-—–:]+$", "", title_raw).strip()
    if not name or len(name) < 2:
        return None

    target_muscle = infer_muscle_group(name)
    sets_count = 3
    reps_val = 10
    comment = None

    # Sets & Reps
    sets_m = re.search(r"(\d+)\s*(?:[xх*×]|подход[а-я]*\s*(?:по)?|\s*по)\s*([\d\-\–, ]+|макс|max)\b", params, re.I)
    if sets_m:
        sets_count = int(sets_m.group(1))
        reps_raw = sets_m.group(2).strip().lower()
        if "макс" in reps_raw or "max" in reps_raw:
            reps_val = 12
            comment = "до отказа (MAX)"
        else:
            nums = [int(x) for x in re.findall(r"\d+", reps_raw)]
            reps_val = max(nums) if nums else 10

    # Weight
    weight_val = 0.0
    if any(w in params.lower() for w in ["свой вес", "собственный вес", "bodyweight"]):
        weight_val = 0.0
        comment = (comment + ", свой вес") if comment else "свой вес"
    else:
        side_m = re.search(r"по\s*(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*(?:кг)?\s*с\s*каждой\s*стороны", params, re.I)
        if side_m:
            w1 = float(side_m.group(1).replace(",", "."))
            w2 = float(side_m.group(2).replace(",", ".")) if side_m.group(2) else w1
            weight_val = max(w1, w2) * 2
        else:
            bracket_m = re.search(r"\((.*?)\)", params)
            if bracket_m:
                nums = [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:[.,]\d+)?", bracket_m.group(1))]
                if nums:
                    weight_val = max(nums)
            else:
                kw_m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:кг|kg)\b", params, re.I)
                if kw_m:
                    weight_val = float(kw_m.group(1).replace(",", "."))

    sets: List[ParsedSet] = []
    for s_num in range(1, sets_count + 1):
        sets.append(ParsedSet(
            set_number=s_num,
            weight=weight_val,
            reps=reps_val,
            comment=comment
        ))

    return ParsedExercise(
        name=name,
        target_muscle=target_muscle,
        sets=sets
    )


def parse_workout_text_fallback(text: str) -> ParsedWorkoutResponse:
    DAY_PATTERNS = [
        r"^(день\s*\d+[:\-\.]?.*)",
        r"^(day\s*\d+[:\-\.]?.*)",
        r"^(понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)[:\-\.]?.*",
        r"^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[:\-\.]?.*",
        r"^(тренировка\s*[a-zа-я\d]+[:\-\.]?.*)",
        r"^(workout\s*[a-z\d]+[:\-\.]?.*)",
        r"^(сплит\s*\d+[:\-\.]?.*)",
    ]

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    days: List[ParsedDay] = []
    current_day: Optional[ParsedDay] = None

    for line in lines:
        is_day = any(re.match(p, line, re.IGNORECASE) for p in DAY_PATTERNS)
        if is_day:
            if current_day and current_day.exercises:
                days.append(current_day)
            clean_day_name = line.rstrip(":.-").strip()
            # Capitalize day name
            clean_day_name = clean_day_name.capitalize()
            current_day = ParsedDay(day_name=clean_day_name, exercises=[])
        else:
            ex = parse_single_exercise_line(line)
            if ex:
                if current_day is None:
                    current_day = ParsedDay(day_name="День 1", exercises=[])
                current_day.exercises.append(ex)

    if current_day and current_day.exercises:
        days.append(current_day)

    if not days:
        days = [ParsedDay(day_name="День 1", exercises=[])]

    # Compute program title
    muscles = list(dict.fromkeys(
        ex.target_muscle for d in days for ex in d.exercises if ex.target_muscle
    ))
    title_suffix = " / ".join(muscles[:3]) if muscles else "Сплит"
    title = f"{len(days)}-дневный сплит: {title_suffix}"

    return ParsedWorkoutResponse(
        program_title=title,
        days=days
    )


# ── AI LLM Parser ─────────────────────────────────────────────────────────────

async def parse_with_llm(text: str) -> Optional[ParsedWorkoutResponse]:
    """
    Calls OpenAI / DeepSeek / Local LLM with structured JSON output.
    """
    if not settings.OPENAI_API_KEY:
        return None

    url = f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": WORKOUT_PARSER_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed_json = json.loads(content)
                return ParsedWorkoutResponse.model_validate(parsed_json)
            else:
                logger.warning(f"LLM API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Error calling LLM for workout parsing: {e}")

    return None


async def parse_workout_text(text: str) -> ParsedWorkoutResponse:
    """
    Master workout text parser: tries AI LLM first, seamlessly falls back
    to robust offline parsing if no API key or on error.
    """
    if settings.OPENAI_API_KEY:
        ai_result = await parse_with_llm(text)
        if ai_result and ai_result.days and any(d.exercises for d in ai_result.days):
            return ai_result

    return parse_workout_text_fallback(text)


# ── Database Operations ───────────────────────────────────────────────────────

async def find_or_create_exercise(
    db: AsyncSession,
    name: str,
    user_id: int,
    target_muscle_hint: Optional[str] = None,
) -> Exercise:
    cleaned_name = name.strip()

    # 1. Exact match
    stmt = select(Exercise).where(Exercise.name.ilike(cleaned_name))
    res = await db.execute(stmt)
    exact = res.scalars().first()
    if exact:
        return exact

    # 2. Fuzzy match
    stmt_all = select(Exercise).where(
        or_(Exercise.created_by_user_id == None, Exercise.created_by_user_id == user_id)
    )
    res_all = await db.execute(stmt_all)
    all_exercises = res_all.scalars().all()

    best_match: Optional[Exercise] = None
    best_score = 0.0
    cleaned_lower = cleaned_name.lower()

    for ex in all_exercises:
        db_lower = ex.name.lower()
        if len(cleaned_lower) >= 4 and (cleaned_lower in db_lower or db_lower in cleaned_lower):
            ratio = min(len(cleaned_lower), len(db_lower)) / max(len(cleaned_lower), len(db_lower))
            if ratio >= 0.70:
                score = 0.85 + (ratio * 0.15)
                if score > best_score:
                    best_score = score
                    best_match = ex
                    continue

        score = difflib.SequenceMatcher(None, cleaned_lower, db_lower).ratio()
        if score > best_score:
            best_score = score
            best_match = ex

    if best_match and best_score >= 0.70:
        return best_match

    # 3. Create custom dynamic exercise
    category = map_muscle_to_category(target_muscle_hint or "", cleaned_name)
    equipment = infer_equipment(cleaned_name)
    target_muscle_desc = target_muscle_hint or infer_muscle_group(cleaned_name)

    new_ex = Exercise(
        name=cleaned_name,
        category=category,
        equipment=equipment,
        target_muscle=target_muscle_desc,
        instructions="Пользовательское упражнение из импортированной программы.",
        is_custom=True,
        created_by_user_id=user_id,
    )
    db.add(new_ex)
    await db.flush()
    return new_ex


async def save_parsed_program(
    db: AsyncSession,
    user_id: int,
    workout_data: ParsedWorkoutResponse,
) -> WorkoutProgram:
    """
    Saves parsed workout response into DB as active program.
    """
    # Deactivate existing user programs
    await db.execute(
        update(WorkoutProgram)
        .where(WorkoutProgram.user_id == user_id)
        .values(is_active=False)
    )

    days_count = len(workout_data.days)
    program = WorkoutProgram(
        user_id=user_id,
        title=workout_data.program_title or "Импорт из заметок",
        description=f"Импортировано {days_count} дн.",
        split_type="custom",
        days_per_week=days_count,
        difficulty="intermediate",
        is_active=True,
    )
    db.add(program)
    await db.flush()

    for day_num, day_data in enumerate(workout_data.days, start=1):
        day_obj = ProgramDay(
            program_id=program.id,
            day_number=day_num,
            name=day_data.day_name,
        )
        db.add(day_obj)
        await db.flush()

        for order, ex in enumerate(day_data.exercises):
            matched_exercise = await find_or_create_exercise(
                db, ex.name, user_id, ex.target_muscle
            )

            # Extract reps and weight for ProgramExercise
            sets_count = len(ex.sets) if ex.sets else 3
            if ex.sets:
                min_reps = min(s.reps for s in ex.sets)
                max_reps = max(s.reps for s in ex.sets)
                target_reps = f"{min_reps}-{max_reps}" if min_reps != max_reps else str(min_reps)
                target_weight = ex.sets[-1].weight or ex.sets[0].weight
            else:
                target_reps = "10"
                target_weight = 0.0

            pe = ProgramExercise(
                program_day_id=day_obj.id,
                exercise_id=matched_exercise.id,
                order_index=order,
                target_sets=sets_count,
                target_reps=target_reps,
                target_weight_kg=target_weight,
                rest_seconds=90,
            )
            db.add(pe)

    await db.commit()

    # Reload with relations
    stmt = (
        select(WorkoutProgram)
        .where(WorkoutProgram.id == program.id)
        .options(
            selectinload(WorkoutProgram.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise)
        )
    )
    res = await db.execute(stmt)
    return res.scalars().first()
