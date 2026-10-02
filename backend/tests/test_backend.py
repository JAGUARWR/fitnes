import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db, AsyncSessionLocal
from app.services.seed_data import seed_database
from app.api.analytics import calculate_epley_1rm


@pytest.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_get_exercises():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/exercises")
        assert resp.status_code == 200
        exercises = resp.json()
        assert len(exercises) > 0
        assert any(e["name"] == "Жим штанги лежа" for e in exercises)
        assert any(e["category"] == "chest" for e in exercises)


@pytest.mark.asyncio
async def test_generate_program_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "weight_kg": 82.5,
            "height_cm": 180.0,
            "gender": "male",
            "experience_level": "intermediate",
            "goal": "hypertrophy",
            "split_type": "ppl",
            "days_per_week": 3
        }
        resp = await client.post("/api/programs/generate", json=payload)
        assert resp.status_code == 200
        program = resp.json()
        assert "Push / Pull / Legs" in program["title"]
        assert len(program["days"]) == 3
        assert any("Push" in d["name"] for d in program["days"])

        # Check that user profile was updated and is_onboarded set to True
        me_resp = await client.get("/api/auth/me")
        assert me_resp.status_code == 200
        me = me_resp.json()
        assert me["is_onboarded"] is True
        assert me["weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_epley_1rm_calculation():
    # Epley: weight * (1 + reps / 30)
    # 100kg x 10 reps -> 100 * (1 + 10/30) = 133.3 kg
    calc = calculate_epley_1rm(100.0, 10)
    assert calc == 133.3

    # 1 rep: exactly weight
    assert calculate_epley_1rm(120.0, 1) == 120.0

    # 0 weight or reps
    assert calculate_epley_1rm(0, 5) == 0.0


@pytest.mark.asyncio
async def test_workout_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Start workout
        start_resp = await client.post("/api/workouts/start", json={"name": "Тестовая тренировка"})
        assert start_resp.status_code == 200
        session_data = start_resp.json()
        session_id = session_data["id"]

        # 2. Get exercise list to pick one
        ex_resp = await client.get("/api/exercises?category=chest")
        bench = ex_resp.json()[0]

        # 3. Log 2 sets
        set1 = await client.post(f"/api/workouts/{session_id}/sets", json={
            "exercise_id": bench["id"],
            "set_number": 1,
            "weight_kg": 80.0,
            "reps": 10,
            "is_completed": True
        })
        assert set1.status_code == 200

        set2 = await client.post(f"/api/workouts/{session_id}/sets", json={
            "exercise_id": bench["id"],
            "set_number": 2,
            "weight_kg": 85.0,
            "reps": 8,
            "is_completed": True
        })
        assert set2.status_code == 200

        # 4. Finish workout
        finish_resp = await client.post(f"/api/workouts/{session_id}/finish", json={
            "duration_seconds": 2400,
            "total_volume_kg": 0,  # Auto-calculate
            "notes": "Отличная тренировка!"
        })
        assert finish_resp.status_code == 200
        finished = finish_resp.json()
        assert finished["is_completed"] is True
        # Expected volume: 80 * 10 + 85 * 8 = 800 + 680 = 1480 kg
        assert finished["total_volume_kg"] == 1480.0

        # 5. Check analytics
        analytics_resp = await client.get("/api/analytics")
        assert analytics_resp.status_code == 200
        stats = analytics_resp.json()
        assert stats["total_workouts"] >= 1
        assert stats["total_volume_kg"] >= 1480.0
