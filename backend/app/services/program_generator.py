from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.exercise import Exercise
from app.models.program import WorkoutProgram, ProgramDay, ProgramExercise


class ProgramGenerator:
    """
    Генератор персональных программ тренировок на основе:
    - Веса тела и пола атлета
    - Опыта тренировок (beginner, intermediate, advanced)
    - Цели (hypertrophy, strength, fat_loss)
    - Желаемого сплита (full_body, upper_lower, ppl)
    - Частоты тренировок (от 2 до 5 дней в неделю)
    """

    @staticmethod
    async def generate_program(
        db: AsyncSession,
        user_id: int,
        weight_kg: float,
        experience_level: str = "beginner",
        goal: str = "hypertrophy",
        split_type: str = "full_body",
        days_per_week: int = 3,
    ) -> WorkoutProgram:
        # Load all exercises grouped by category
        result = await db.execute(select(Exercise))
        exercises = result.scalars().all()
        by_cat: Dict[str, List[Exercise]] = {
            "chest": [],
            "back": [],
            "legs": [],
            "shoulders": [],
            "biceps": [],
            "triceps": [],
            "core": []
        }
        for ex in exercises:
            if ex.category in by_cat:
                by_cat[ex.category].append(ex)

        # Reps and sets based on goal & experience
        if goal == "strength":
            compound_reps = "4-6"
            isolation_reps = "8-10"
            rest_compound = 150
            rest_isolation = 90
            sets_count = 4 if experience_level in ["intermediate", "advanced"] else 3
        elif goal == "fat_loss":
            compound_reps = "10-12"
            isolation_reps = "12-15"
            rest_compound = 60
            rest_isolation = 45
            sets_count = 3
        else:  # hypertrophy (default)
            compound_reps = "8-10"
            isolation_reps = "10-12"
            rest_compound = 90
            rest_isolation = 60
            sets_count = 4 if experience_level == "advanced" else 3

        # Title generator
        goal_titles = {
            "hypertrophy": "Набор массы и гипертрофия",
            "strength": "Развитие силовых показателей",
            "fat_loss": "Рельеф и сжигание жира"
        }
        split_titles = {
            "full_body": "Full Body (Все тело)",
            "upper_lower": "Верх / Низ (Upper / Lower)",
            "ppl": "Push / Pull / Legs (Жим / Тяга / Ноги)"
        }
        exp_titles = {
            "beginner": "для новичка",
            "intermediate": "средний уровень",
            "advanced": "для опытных"
        }

        program_title = f"{split_titles.get(split_type, 'Персональный сплит')} ({days_per_week} дн.) - {exp_titles.get(experience_level, '')}"
        program_desc = (
            f"Индивидуальная программа, рассчитанная под вес {weight_kg} кг. "
            f"Цель: {goal_titles.get(goal, 'Тренировки')}. "
            f"Оптимальный баланс объема и интенсивности с автоподбором времени отдыха."
        )

        program = WorkoutProgram(
            user_id=user_id,
            title=program_title,
            description=program_desc,
            split_type=split_type,
            days_per_week=days_per_week,
            difficulty=experience_level,
            is_active=True
        )
        db.add(program)
        await db.flush()

        # Day templates configuration
        days_config = []

        if split_type == "full_body":
            # 2 to 3 days
            days_config = [
                {
                    "name": "День 1: Квадрицепс + Жим + Тяга",
                    "ex": [
                        ("legs", "Приседания со штангой на плечах", compound_reps, rest_compound, sets_count),
                        ("chest", "Жим штанги лежа", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга верхнего блока к груди", isolation_reps, rest_isolation, sets_count),
                        ("shoulders", "Махи гантелями в стороны стоя", isolation_reps, rest_isolation, 3),
                        ("core", "Скручивания на полу или римском стуле", "15-20", 45, 3),
                    ]
                },
                {
                    "name": "День 2: Задняя поверхность + Плечи + Спина",
                    "ex": [
                        ("legs", "Румынская тяга со штангой / гантелями", compound_reps, rest_compound, sets_count),
                        ("shoulders", "Армейский жим стоя со штангой", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга штанги в наклоне", compound_reps, rest_compound, sets_count),
                        ("biceps", "Подъем штанги на бицепс стоя", isolation_reps, rest_isolation, 3),
                        ("triceps", "Разгибания рук на блоке с канатной рукоятью", isolation_reps, rest_isolation, 3),
                    ]
                },
            ]
            if days_per_week >= 3:
                days_config.append({
                    "name": "День 3: Жим объемный + Ноги + Кор",
                    "ex": [
                        ("legs", "Жим ногами в тренажере", compound_reps, rest_compound, sets_count),
                        ("chest", "Жим гантелей на наклонной скамье (30°)", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга горизонтального блока к поясу", isolation_reps, rest_isolation, sets_count),
                        ("legs", "Сгибания ног лежа в тренажере", isolation_reps, rest_isolation, 3),
                        ("core", "Подъемы ног в висе на турнике / брусьях", "12-15", 45, 3),
                    ]
                })

        elif split_type == "upper_lower":
            # 4 days
            days_config = [
                {
                    "name": "День 1: Верх тела (Силовой / Жимовой)",
                    "ex": [
                        ("chest", "Жим штанги лежа", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга штанги в наклоне", compound_reps, rest_compound, sets_count),
                        ("shoulders", "Армейский жим стоя со штангой", compound_reps, rest_compound, sets_count),
                        ("chest", "Сведение рук в кроссовере (на грудь)", isolation_reps, rest_isolation, 3),
                        ("triceps", "Французский жим со штангой лежа", isolation_reps, rest_isolation, 3),
                    ]
                },
                {
                    "name": "День 2: Низ тела (Квадрицепсы + Кор)",
                    "ex": [
                        ("legs", "Приседания со штангой на плечах", compound_reps, rest_compound, sets_count),
                        ("legs", "Жим ногами в тренажере", isolation_reps, rest_isolation, sets_count),
                        ("legs", "Разгибания ног сидя в тренажере", isolation_reps, rest_isolation, 3),
                        ("legs", "Подъемы на носки стоя (икры)", "15-20", 45, 4),
                        ("core", "Скручивания на полу или римском стуле", "15-20", 45, 3),
                    ]
                },
                {
                    "name": "День 3: Верх тела (Гипертрофия / Тяговый)",
                    "ex": [
                        ("back", "Подтягивания широким хватом", compound_reps, rest_compound, sets_count),
                        ("chest", "Жим гантелей на наклонной скамье (30°)", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга горизонтального блока к поясу", isolation_reps, rest_isolation, sets_count),
                        ("shoulders", "Махи гантелями в стороны стоя", isolation_reps, rest_isolation, 4),
                        ("biceps", "Подъем штанги на бицепс стоя", isolation_reps, rest_isolation, 3),
                    ]
                },
                {
                    "name": "День 4: Низ тела (Задняя цепь + Ягодицы)",
                    "ex": [
                        ("legs", "Румынская тяга со штангой / гантелями", compound_reps, rest_compound, sets_count),
                        ("legs", "Выпады с гантелями на месте / в шаге", isolation_reps, rest_isolation, sets_count),
                        ("legs", "Сгибания ног лежа в тренажере", isolation_reps, rest_isolation, 3),
                        ("core", "Подъемы ног в висе на турнике / брусьях", "12-15", 45, 3),
                        ("core", "Планка классическая", "45-60 сек", 45, 3),
                    ]
                }
            ]

        else:  # PPL (Push / Pull / Legs)
            days_config = [
                {
                    "name": "День 1: Push (Грудь, Передняя дельта, Трицепс)",
                    "ex": [
                        ("chest", "Жим штанги лежа", compound_reps, rest_compound, sets_count),
                        ("chest", "Жим гантелей на наклонной скамье (30°)", compound_reps, rest_compound, sets_count),
                        ("shoulders", "Жим гантелей сидя", isolation_reps, rest_isolation, 3),
                        ("shoulders", "Махи гантелями в стороны стоя", isolation_reps, rest_isolation, 4),
                        ("triceps", "Разгибания рук на блоке с канатной рукоятью", isolation_reps, rest_isolation, 3),
                    ]
                },
                {
                    "name": "День 2: Pull (Спина, Задняя дельта, Бицепс)",
                    "ex": [
                        ("back", "Подтягивания широким хватом", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга штанги в наклоне", compound_reps, rest_compound, sets_count),
                        ("back", "Тяга горизонтального блока к поясу", isolation_reps, rest_isolation, sets_count),
                        ("shoulders", "Махи гантелями в наклоне (задняя дельта)", isolation_reps, rest_isolation, 4),
                        ("biceps", "Подъем штанги на бицепс стоя", isolation_reps, rest_isolation, 3),
                        ("biceps", "Молотковые сгибания с гантелями (Молотки)", isolation_reps, rest_isolation, 3),
                    ]
                },
                {
                    "name": "День 3: Legs (Квадрицепсы, Бицепс бедра, Икры, Пресс)",
                    "ex": [
                        ("legs", "Приседания со штангой на плечах", compound_reps, rest_compound, sets_count),
                        ("legs", "Румынская тяга со штангой / гантелями", compound_reps, rest_compound, sets_count),
                        ("legs", "Жим ногами в тренажере", isolation_reps, rest_isolation, 3),
                        ("legs", "Сгибания ног лежа в тренажере", isolation_reps, rest_isolation, 3),
                        ("legs", "Подъемы на носки стоя (икры)", "15-20", 45, 4),
                        ("core", "Подъемы ног в висе на турнике / брусьях", "12-15", 45, 3),
                    ]
                }
            ]

        # Name to Exercise object lookup
        name_to_ex = {ex.name: ex for ex in exercises}

        # Build database objects
        for day_idx, d_data in enumerate(days_config, start=1):
            p_day = ProgramDay(
                program_id=program.id,
                day_number=day_idx,
                name=d_data["name"]
            )
            db.add(p_day)
            await db.flush()

            for order_idx, (cat, ex_name, reps, rest, sets) in enumerate(d_data["ex"]):
                # Find matching exercise or fallback to first in category
                matched_ex = name_to_ex.get(ex_name)
                if not matched_ex and by_cat.get(cat):
                    matched_ex = by_cat[cat][0]

                if matched_ex:
                    db.add(ProgramExercise(
                        program_day_id=p_day.id,
                        exercise_id=matched_ex.id,
                        order_index=order_idx,
                        target_sets=sets,
                        target_reps=reps,
                        rest_seconds=rest
                    ))

        await db.commit()
        await db.refresh(program)
        return program
