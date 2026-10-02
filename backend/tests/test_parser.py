import pytest
from app.services.program_parser import parse_workout_text_fallback, ParsedWorkoutResponse

def test_parse_various_workout_formats():
    raw_text = """
Понедельник
1️⃣ Подъём EZ-штанги стоя — 4х8-10 (40–42.5 кг)
2️⃣ Жим узким хватом в Смите — 4х8-10 (по 22.5–25 кг с каждой стороны)
Жим лежа 4х10 80кг
1. Присед: 3 по 12 (100 кг)
Бицепс с гантелями — 3х8-10 (по 16 кг)
Подтягивания 4хMAX свой вес
Становая 100х5, 120х5, 140х3
"""
    result: ParsedWorkoutResponse = parse_workout_text_fallback(raw_text)

    assert len(result.days) >= 1
    monday = result.days[0]
    exercises = {ex.name: ex for ex in monday.exercises}

    # 1. EZ-штанга: 4 sets, reps 10, weight 42.5
    assert "Подъём EZ-штанги стоя" in exercises
    ez = exercises["Подъём EZ-штанги стоя"]
    assert len(ez.sets) == 4
    assert ez.sets[0].weight == 42.5
    assert ez.sets[0].reps == 10

    # 2. Смит с каждой стороны (22.5-25): doubled weight = 50.0, 4 sets
    assert "Жим узким хватом в Смите" in exercises
    smith = exercises["Жим узким хватом в Смите"]
    assert len(smith.sets) == 4
    assert smith.sets[0].weight == 50.0
    assert smith.sets[0].reps == 10

    # 3. «Жим лежа 4х10 80кг»
    assert "Жим лежа" in exercises
    bench = exercises["Жим лежа"]
    assert len(bench.sets) == 4
    assert bench.sets[0].weight == 80.0
    assert bench.sets[0].reps == 10

    # 4. «1. Присед: 3 по 12 (100 кг)»
    assert "Присед" in exercises
    squat = exercises["Присед"]
    assert len(squat.sets) == 3
    assert squat.sets[0].weight == 100.0
    assert squat.sets[0].reps == 12

    # 5. «Бицепс с гантелями — 3х8-10 (по 16 кг)»
    assert "Бицепс с гантелями" in exercises
    biceps = exercises["Бицепс с гантелями"]
    assert len(biceps.sets) == 3
    assert biceps.sets[0].weight == 16.0
    assert biceps.sets[0].reps == 10

    # 6. «Подтягивания 4хMAX свой вес»
    assert "Подтягивания" in exercises
    pullups = exercises["Подтягивания"]
    assert len(pullups.sets) == 4
    assert pullups.sets[0].weight == 0.0
    assert pullups.sets[0].reps == 12  # MAX reps
    assert pullups.sets[0].comment is not None and "MAX" in pullups.sets[0].comment

    # 7. «Становая 100х5, 120х5, 140х3»
    assert "Становая" in exercises
    deadlift = exercises["Становая"]
    assert len(deadlift.sets) == 3
    assert deadlift.sets[0].weight == 100.0
    assert deadlift.sets[0].reps == 5
    assert deadlift.sets[1].weight == 120.0
    assert deadlift.sets[1].reps == 5
    assert deadlift.sets[2].weight == 140.0
    assert deadlift.sets[2].reps == 3


@pytest.mark.asyncio
async def test_import_program_api_endpoint():
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.core.database import init_db, AsyncSessionLocal
    from app.services.seed_data import seed_database

    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "text": "Понедельник\n1️⃣ Подъём EZ-штанги стоя — 4х8-10 (40–42.5 кг)\n2️⃣ Жим лежа 4х10 80кг"
        }
        resp = await client.post("/api/programs/import", json=payload)
        assert resp.status_code == 200
        prog = resp.json()
        assert len(prog["days"]) >= 1
        day1 = prog["days"][0]
        assert len(day1["exercises"]) == 2
        assert day1["exercises"][0]["target_sets"] == 4
        assert day1["exercises"][0]["target_reps"] == "10"
        assert day1["exercises"][0]["target_weight_kg"] == 42.5
        assert day1["exercises"][1]["target_weight_kg"] == 80.0

