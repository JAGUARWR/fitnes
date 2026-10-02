from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.exercise import Exercise
from app.models.program import WorkoutProgram, ProgramDay, ProgramExercise

DEFAULT_EXERCISES = [
    # ГРУДЬ (Chest)
    {
        "name": "Жим штанги лежа",
        "category": "chest",
        "equipment": "barbell",
        "target_muscle": "Большая грудная мышца",
        "instructions": "Лягте на скамью, сведите лопатки. Опустите гриф до касания нижней части груди, мощным движением выжмите штангу вверх."
    },
    {
        "name": "Жим гантелей на наклонной скамье (30°)",
        "category": "chest",
        "equipment": "dumbbell",
        "target_muscle": "Верх грудных мышц",
        "instructions": "Установите угол скамьи 30 градусов. Жмите гантели вверх, сохраняя естественную траекторию с легким сведением в верхней точке."
    },
    {
        "name": "Отжимания на брусьях (акцент на грудь)",
        "category": "chest",
        "equipment": "bodyweight",
        "target_muscle": "Нижняя часть грудных",
        "instructions": "Слегка наклоните корпус вперед, разведите локти чуть шире. Опускайтесь до прямого угла в локтях."
    },
    {
        "name": "Сведение рук в кроссовере (на грудь)",
        "category": "chest",
        "equipment": "cable",
        "target_muscle": "Внутренняя и средняя часть груди",
        "instructions": "Наклонитесь немного вперед, сохраняя локти слегка согнутыми. Сводите рукояти перед собой с пиковым сокращением."
    },
    {
        "name": "Жим в тренажере Хаммер на грудь",
        "category": "chest",
        "equipment": "machine",
        "target_muscle": "Грудные мышцы",
        "instructions": "Отрегулируйте высоту сиденья так, чтобы рукоятки были на уровне середины груди. Выжимайте без блокировки локтей."
    },

    # СПИНА (Back)
    {
        "name": "Становая тяга классическая",
        "category": "back",
        "equipment": "barbell",
        "target_muscle": "Разгибатели спины, ягодицы",
        "instructions": "Спина прямая, лопатки приведены. Движение начинается с мощного разгибания в тазобедренном и коленном суставах."
    },
    {
        "name": "Подтягивания широким хватом",
        "category": "back",
        "equipment": "bodyweight",
        "target_muscle": "Широчайшие мышцы спины",
        "instructions": "Тянитесь грудью к перекладине за счет сведения лопаток и опускания локтей вниз."
    },
    {
        "name": "Тяга штанги в наклоне",
        "category": "back",
        "equipment": "barbell",
        "target_muscle": "Широчайшие и ромбовидные мышцы",
        "instructions": "Угол наклона корпуса 45–60 градусов. Тяните гриф к низу живота, сжимая мышцы спины."
    },
    {
        "name": "Тяга верхнего блока к груди",
        "category": "back",
        "equipment": "cable",
        "target_muscle": "Широчайшие мышцы спины",
        "instructions": "Сидя в тренажере, тяните рукоять к верхней части груди, направляя локти вниз и назад."
    },
    {
        "name": "Тяга горизонтального блока к поясу",
        "category": "back",
        "equipment": "cable",
        "target_muscle": "Середина спины, широчайшие",
        "instructions": "Спина зафиксирована, тяните рукоятку к животу, максимально сводя лопатки в конечной фазе."
    },
    {
        "name": "Тяга гантели одной рукой в упоре",
        "category": "back",
        "equipment": "dumbbell",
        "target_muscle": "Широчайшие мышцы",
        "instructions": "Опираясь коленом и рукой о скамью, тяните гантель к тазу, удерживая корпус параллельно полу."
    },

    # НОГИ (Legs)
    {
        "name": "Приседания со штангой на плечах",
        "category": "legs",
        "equipment": "barbell",
        "target_muscle": "Квадрицепсы, ягодицы",
        "instructions": "Стопы на ширине плеч, колени направлены в сторону носков. Опускайтесь до параллели бедра с полом или ниже."
    },
    {
        "name": "Жим ногами в тренажере",
        "category": "legs",
        "equipment": "machine",
        "target_muscle": "Квадрицепсы, ягодицы",
        "instructions": "Поясница плотно прижата к спинке. В верхней точке не вставляйте колени до щелчка."
    },
    {
        "name": "Румынская тяга со штангой / гантелями",
        "category": "legs",
        "equipment": "barbell",
        "target_muscle": "Бицепс бедра, ягодицы",
        "instructions": "Колени чуть согнуты и зафиксированы, движение выполняется за счет отведения таза назад с прямой спиной."
    },
    {
        "name": "Сгибания ног лежа в тренажере",
        "category": "legs",
        "equipment": "machine",
        "target_muscle": "Задняя поверхность бедра",
        "instructions": "Плавное сгибание ног с фиксацией в точке пикового сокращения на 1 секунду."
    },
    {
        "name": "Разгибания ног сидя в тренажере",
        "category": "legs",
        "equipment": "machine",
        "target_muscle": "Изоляция квадрицепса",
        "instructions": "Разгибайте голени под контролем, не бросайте вес в нижней точке."
    },
    {
        "name": "Выпады с гантелями на месте / в шаге",
        "category": "legs",
        "equipment": "dumbbell",
        "target_muscle": "Квадрицепсы, ягодичные мышцы",
        "instructions": "Широкий шаг вперед, угол в переднем и заднем колене 90 градусов. Корпус прямой."
    },
    {
        "name": "Подъемы на носки стоя (икры)",
        "category": "legs",
        "equipment": "machine",
        "target_muscle": "Икроножные мышцы",
        "instructions": "Полная амплитуда: максимальное растяжение внизу и подъем на носки с фиксацией вверху."
    },

    # ПЛЕЧИ (Shoulders)
    {
        "name": "Армейский жим стоя со штангой",
        "category": "shoulders",
        "equipment": "barbell",
        "target_muscle": "Передняя и средняя дельта",
        "instructions": "Пресс и ягодицы напряжены. Выжимайте штангу над головой по вертикальной линии."
    },
    {
        "name": "Жим гантелей сидя",
        "category": "shoulders",
        "equipment": "dumbbell",
        "target_muscle": "Передний и средний пучок дельт",
        "instructions": "Спинка скамьи слегка отклонена (75-80°). Опускайте гантели до уровня ушей и жмите вверх."
    },
    {
        "name": "Махи гантелями в стороны стоя",
        "category": "shoulders",
        "equipment": "dumbbell",
        "target_muscle": "Средняя дельта",
        "instructions": "Локти чуть согнуты и приподняты. Поднимайте руки до уровня параллели с полом без рывков."
    },
    {
        "name": "Махи гантелями в наклоне (задняя дельта)",
        "category": "shoulders",
        "equipment": "dumbbell",
        "target_muscle": "Задняя дельта",
        "instructions": "Наклон корпуса вперед почти до параллели. Разводите локти в стороны, фокусируясь на заднем пучке."
    },
    {
        "name": "Тяга штанги / гантелей к подбородку",
        "category": "shoulders",
        "equipment": "barbell",
        "target_muscle": "Средняя дельта, трапеции",
        "instructions": "Хват на ширине плеч. Тяните гриф вверх вдоль тела, поднимая локти выше кистей."
    },

    # РУКИ (Arms: Biceps & Triceps)
    {
        "name": "Подъем штанги на бицепс стоя",
        "category": "biceps",
        "equipment": "barbell",
        "target_muscle": "Двуглавая мышца плеча",
        "instructions": "Локти прижаты к бокам, спина неподвижна. Сгибайте руки без раскачки корпуса."
    },
    {
        "name": "Молотковые сгибания с гантелями (Молотки)",
        "category": "biceps",
        "equipment": "dumbbell",
        "target_muscle": "Брахиалис, предплечья",
        "instructions": "Нейтральный хват (ладони смотрят друг на друга). Отличное упражнение для визуальной толщины руки."
    },
    {
        "name": "Сгибания на скамье Скотта",
        "category": "biceps",
        "equipment": "barbell",
        "target_muscle": "Пик бицепса",
        "instructions": "Локти зафиксированы на подушке тренажера. Не разгибайте руки до переразгибания сустава."
    },
    {
        "name": "Французский жим со штангой лежа",
        "category": "triceps",
        "equipment": "barbell",
        "target_muscle": "Трехглавая мышца плеча (длинная головка)",
        "instructions": "Опускайте гриф за голову или к макушке, удерживая плечи строго вертикально."
    },
    {
        "name": "Разгибания рук на блоке с канатной рукоятью",
        "category": "triceps",
        "equipment": "cable",
        "target_muscle": "Трицепс (латеральная головка)",
        "instructions": "В нижней точке разводите кисти в стороны для максимального пикового сокращения трицепса."
    },
    {
        "name": "Жим лежа узким хватом",
        "category": "triceps",
        "equipment": "barbell",
        "target_muscle": "Трицепс, передняя дельта",
        "instructions": "Хват на ширине плеч или чуть уже. Локти прижимайте ближе к корпусу во время опускания."
    },

    # ПРЕСС / КОР (Core)
    {
        "name": "Скручивания на полу или римском стуле",
        "category": "core",
        "equipment": "bodyweight",
        "target_muscle": "Прямая мышца живота",
        "instructions": "Скручивайте именно грудную клетку к тазу, округляя спину, а не сгибайтесь в тазобедренном суставе."
    },
    {
        "name": "Подъемы ног в висе на турнике / брусьях",
        "category": "core",
        "equipment": "bodyweight",
        "target_muscle": "Нижняя часть пресса, мышцы кора",
        "instructions": "Поднимайте колени или прямые ноги к уровню пояса, подкручивая таз вверх."
    },
    {
        "name": "Планка классическая",
        "category": "core",
        "equipment": "bodyweight",
        "target_muscle": "Глубокие мышцы кора, стабилизаторы",
        "instructions": "Тело образует прямую линию от макушки до пяток. Таз подкручен, живот втянут."
    }
]


async def seed_database(db: AsyncSession):
    # Check if exercises already exist
    result = await db.execute(select(Exercise).limit(1))
    if result.scalars().first() is not None:
        return  # Already seeded

    # 1. Seed Exercises
    exercise_map = {}
    for ex_data in DEFAULT_EXERCISES:
        exercise = Exercise(**ex_data)
        db.add(exercise)
        await db.flush()
        exercise_map[ex_data["name"]] = exercise.id

    # 2. Seed Default Preset Programs
    # Preset A: Full Body (3 дня в неделю для начинающих)
    full_body = WorkoutProgram(
        title="Full Body для начинающих (3 дня)",
        description="Сбалансированная программа на все группы мышц три раза в неделю. Идеальна для старта, укрепления связок и быстрого прогресса.",
        split_type="full_body",
        days_per_week=3,
        difficulty="beginner",
        is_active=True
    )
    db.add(full_body)
    await db.flush()

    day1 = ProgramDay(program_id=full_body.id, day_number=1, name="День А: Фуллбади (Присед + Жим)")
    day2 = ProgramDay(program_id=full_body.id, day_number=2, name="День B: Фуллбади (Тяга + Плечи)")
    day3 = ProgramDay(program_id=full_body.id, day_number=3, name="День C: Фуллбади (Объемный)")
    db.add_all([day1, day2, day3])
    await db.flush()

    # Day 1 exercises
    fb_d1 = [
        (exercise_map.get("Приседания со штангой на плечах"), 3, "8-10", 120),
        (exercise_map.get("Жим штанги лежа"), 3, "8-10", 90),
        (exercise_map.get("Тяга верхнего блока к груди"), 3, "10-12", 90),
        (exercise_map.get("Махи гантелями в стороны стоя"), 3, "12-15", 60),
        (exercise_map.get("Скручивания на полу или римском стуле"), 3, "15-20", 60),
    ]
    for idx, (ex_id, sets, reps, rest) in enumerate(fb_d1):
        if ex_id:
            db.add(ProgramExercise(program_day_id=day1.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    # Day 2 exercises
    fb_d2 = [
        (exercise_map.get("Румынская тяга со штангой / гантелями"), 3, "8-10", 120),
        (exercise_map.get("Армейский жим стоя со штангой"), 3, "8-10", 90),
        (exercise_map.get("Тяга штанги в наклоне"), 3, "8-10", 90),
        (exercise_map.get("Подъем штанги на бицепс стоя"), 3, "10-12", 60),
        (exercise_map.get("Разгибания рук на блоке с канатной рукоятью"), 3, "10-12", 60),
    ]
    for idx, (ex_id, sets, reps, rest) in enumerate(fb_d2):
        if ex_id:
            db.add(ProgramExercise(program_day_id=day2.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    # Day 3 exercises
    fb_d3 = [
        (exercise_map.get("Жим ногами в тренажере"), 3, "10-12", 90),
        (exercise_map.get("Жим гантелей на наклонной скамье (30°)"), 3, "8-10", 90),
        (exercise_map.get("Тяга горизонтального блока к поясу"), 3, "10-12", 90),
        (exercise_map.get("Сгибания ног лежа в тренажере"), 3, "12-15", 60),
        (exercise_map.get("Подъемы ног в висе на турнике / брусьях"), 3, "12-15", 60),
    ]
    for idx, (ex_id, sets, reps, rest) in enumerate(fb_d3):
        if ex_id:
            db.add(ProgramExercise(program_day_id=day3.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    # Preset B: Push / Pull / Legs (Жим / Тяга / Ноги - 3 дня)
    ppl = WorkoutProgram(
        title="Push / Pull / Legs (3 дня классика)",
        description="Золотой стандарт бодибилдинга. Разделение по векторам движения: Жимовые мышцы, Тяговые мышцы и День ног.",
        split_type="ppl",
        days_per_week=3,
        difficulty="intermediate",
        is_active=False
    )
    db.add(ppl)
    await db.flush()

    ppl_d1 = ProgramDay(program_id=ppl.id, day_number=1, name="День 1: Push (Грудь, Плечи, Трицепс)")
    ppl_d2 = ProgramDay(program_id=ppl.id, day_number=2, name="День 2: Pull (Спина, Задняя дельта, Бицепс)")
    ppl_d3 = ProgramDay(program_id=ppl.id, day_number=3, name="День 3: Legs (Квадрицепсы, Бицепс бедра, Икры, Пресс)")
    db.add_all([ppl_d1, ppl_d2, ppl_d3])
    await db.flush()

    # Push
    for idx, (ex_id, sets, reps, rest) in enumerate([
        (exercise_map.get("Жим штанги лежа"), 4, "6-8", 120),
        (exercise_map.get("Жим гантелей на наклонной скамье (30°)"), 3, "8-10", 90),
        (exercise_map.get("Жим гантелей сидя"), 3, "10-12", 90),
        (exercise_map.get("Махи гантелями в стороны стоя"), 3, "12-15", 60),
        (exercise_map.get("Французский жим со штангой лежа"), 3, "10-12", 60),
    ]):
        if ex_id:
            db.add(ProgramExercise(program_day_id=ppl_d1.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    # Pull
    for idx, (ex_id, sets, reps, rest) in enumerate([
        (exercise_map.get("Подтягивания широким хватом"), 3, "8-10", 120),
        (exercise_map.get("Тяга штанги в наклоне"), 3, "8-10", 90),
        (exercise_map.get("Тяга горизонтального блока к поясу"), 3, "10-12", 90),
        (exercise_map.get("Махи гантелями в наклоне (задняя дельта)"), 3, "12-15", 60),
        (exercise_map.get("Подъем штанги на бицепс стоя"), 3, "8-10", 60),
        (exercise_map.get("Молотковые сгибания с гантелями (Молотки)"), 3, "10-12", 60),
    ]):
        if ex_id:
            db.add(ProgramExercise(program_day_id=ppl_d2.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    # Legs
    for idx, (ex_id, sets, reps, rest) in enumerate([
        (exercise_map.get("Приседания со штангой на плечах"), 4, "6-8", 120),
        (exercise_map.get("Румынская тяга со штангой / гантелями"), 3, "8-10", 90),
        (exercise_map.get("Жим ногами в тренажере"), 3, "10-12", 90),
        (exercise_map.get("Сгибания ног лежа в тренажере"), 3, "12-15", 60),
        (exercise_map.get("Подъемы на носки стоя (икры)"), 3, "15-20", 60),
        (exercise_map.get("Подъемы ног в висе на турнике / брусьях"), 3, "12-15", 60),
    ]):
        if ex_id:
            db.add(ProgramExercise(program_day_id=ppl_d3.id, exercise_id=ex_id, order_index=idx, target_sets=sets, target_reps=reps, rest_seconds=rest))

    await db.commit()
