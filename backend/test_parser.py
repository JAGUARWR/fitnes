import sys, re
sys.stdout.reconfigure(encoding='utf-8')

test_lines = [
    'Жим лежа 4х10 80кг',
    '1. Присед: 3 по 12 (100 кг)',
    'Бицепс с гантелями — 3х8-10 (по 16 кг)',
    'Подтягивания 4хMAX свой вес',
    'Становая 100х5, 120х5, 140х3',
    '1️⃣ Подъём EZ-штанги стоя — 4х8-10 (40–42.5 кг)',
    '2️⃣ Жим узким хватом в Смите — 4х8-10 (по 22.5–25 кг с каждой стороны)'
]

def infer_muscle_group(name: str) -> str:
    n = name.lower()
    if any(w in n for w in ['груд', 'жим лежа', 'жим лёжа', 'отжимания', 'пек-дек', 'кроссовер', 'бабочк']):
        return 'Грудь'
    if any(w in n for w in ['спин', 'тяг', 'подтягиван', 'становая', 'блок', 'гиперэкстенз']):
        return 'Спина'
    if any(w in n for w in ['присед', 'ног', 'выпад', 'квадрицепс', 'бицепс бедра', 'икр', 'ягодиц']):
        return 'Ноги'
    if any(w in n for w in ['плеч', 'дельт', 'махи', 'шраги', 'арнольд', 'армейск', 'жим стоя']):
        return 'Плечи'
    if any(w in n for w in ['бицепс', 'трицепс', 'руки', 'молот', 'сгибани', 'разгибани', 'брусь', 'француз']):
        return 'Руки'
    if any(w in n for w in ['пресс', 'кора', 'скручиван', 'планк']):
        return 'Пресс'
    return 'Грудь'

def parse_single_line(line: str):
    clean = re.sub(r'^[0-9\u20e3\ufe0f\s\.\-\•\*\)\(]+', '', line).strip()
    
    # Comma-separated sets: e.g. 'Становая 100х5, 120х5, 140х3'
    comma_sets = re.findall(r'(\d+(?:[.,]\d+)?)\s*[xх*×]\s*(\d+)', clean, re.I)
    if len(comma_sets) >= 2:
        first_m = re.search(r'\b\d+(?:[.,]\d+)?\s*[xх*×]\s*\d+', clean, re.I)
        name = clean[:first_m.start()].strip()
        name = re.sub(r'[\s\-—–:]+$', '', name).strip()
        sets = []
        for idx, (w_str, r_str) in enumerate(comma_sets, start=1):
            sets.append({
                'set_number': idx,
                'weight': float(w_str.replace(',', '.')),
                'reps': int(r_str),
                'comment': None
            })
        return {
            'name': name,
            'target_muscle': infer_muscle_group(name),
            'sets': sets
        }

    # Split name and tail
    sep_m = re.search(r'\s+[-—–:]\s+|\s*[-—–:]\s*(?=\d+\s*[xх*×]|\d+\s*по|\d+\s*подход)', clean)
    if sep_m:
        title_raw = clean[:sep_m.start()].strip()
        params = clean[sep_m.end():].strip()
    else:
        m = re.search(r'(?=\b\d+\s*[xх*×]|\b\d+\s*по|\b\d+\s*подход)', clean)
        if m and m.start() > 0:
            title_raw = clean[:m.start()].strip()
            params = clean[m.start():].strip()
        else:
            title_raw = clean
            params = ''

    name = re.sub(r'[\s\-—–:]+$', '', title_raw).strip()
    target_muscle = infer_muscle_group(name)

    sets_count = 3
    reps_val = 10
    comment = None

    # Sets & Reps
    sets_m = re.search(r'(\d+)\s*(?:[xх*×]|подход[а-я]*\s*(?:по)?)\s*([\d\-\–, ]+|макс|max)\b', params, re.I)
    if sets_m:
        sets_count = int(sets_m.group(1))
        reps_raw = sets_m.group(2).strip().lower()
        if 'макс' in reps_raw or 'max' in reps_raw:
            reps_val = 12
            comment = 'до отказа (MAX)'
        else:
            nums = [int(x) for x in re.findall(r'\d+', reps_raw)]
            reps_val = max(nums) if nums else 10

    # Weight
    weight_val = 0.0
    if 'свой вес' in params.lower() or 'собственный вес' in params.lower() or 'bodyweight' in params.lower():
        weight_val = 0.0
        comment = (comment + ', свой вес') if comment else 'свой вес'
    else:
        side_m = re.search(r'по\s*(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*(?:кг)?\s*с\s*каждой\s*стороны', params, re.I)
        if side_m:
            w1 = float(side_m.group(1).replace(',', '.'))
            w2 = float(side_m.group(2).replace(',', '.')) if side_m.group(2) else w1
            weight_val = max(w1, w2) * 2
        else:
            bracket_m = re.search(r'\((.*?)\)', params)
            if bracket_m:
                nums = [float(x.replace(',', '.')) for x in re.findall(r'\d+(?:[.,]\d+)?', bracket_m.group(1))]
                if nums:
                    weight_val = max(nums)
            else:
                kw_m = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:кг|kg)\b', params, re.I)
                if kw_m:
                    weight_val = float(kw_m.group(1).replace(',', '.'))

    sets = []
    for s_num in range(1, sets_count + 1):
        sets.append({
            'set_number': s_num,
            'weight': weight_val,
            'reps': reps_val,
            'comment': comment
        })

    return {
        'name': name,
        'target_muscle': target_muscle,
        'sets': sets
    }

for line in test_lines:
    parsed = parse_single_line(line)
    weights = [s['weight'] for s in parsed['sets']]
    reps = [s['reps'] for s in parsed['sets']]
    print(f"{parsed['name']} ({parsed['target_muscle']}): {len(parsed['sets'])} sets | weights: {weights} | reps: {reps}")
