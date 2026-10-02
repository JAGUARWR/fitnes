from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workout_log import WorkoutSession, WorkoutSet
from app.models.exercise import Exercise
from app.schemas.analytics import UserStatsOut, Exercise1RM

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def calculate_epley_1rm(weight: float, reps: int) -> float:
    """Epley Formula for One Rep Max: weight * (1 + reps / 30)."""
    if reps <= 0 or weight <= 0:
        return 0.0
    if reps == 1:
        return weight
    return round(weight * (1.0 + reps / 30.0), 1)


@router.get("", response_model=UserStatsOut)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculates overall workout statistics, volume and estimated 1RM for main lifts."""
    # 1. Total workouts
    sessions_stmt = select(WorkoutSession).where(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.is_completed == True
    )
    sessions = (await db.execute(sessions_stmt)).scalars().all()
    total_workouts = len(sessions)
    total_volume = sum(s.total_volume_kg for s in sessions)

    # 2. Total sets and reps
    sets_stmt = (
        select(WorkoutSet)
        .join(WorkoutSession)
        .where(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.is_completed == True,
            WorkoutSet.is_completed == True
        )
    )
    all_sets = (await db.execute(sets_stmt)).scalars().all()
    total_sets = len(all_sets)
    total_reps = sum(s.reps for s in all_sets)

    # 3. 1RM calculations for exercises performed
    # Group by exercise and compute max estimated 1RM
    exercise_records = {}
    for s in all_sets:
        if s.weight_kg <= 0 or s.reps <= 0:
            continue
        e1rm = calculate_epley_1rm(s.weight_kg, s.reps)
        ex_id = s.exercise_id
        if ex_id not in exercise_records or e1rm > exercise_records[ex_id]["1rm"]:
            exercise_records[ex_id] = {
                "1rm": e1rm,
                "weight": s.weight_kg,
                "reps": s.reps,
                "date": s.created_at.strftime("%d.%m.%Y")
            }

    top_1rms = []
    if exercise_records:
        # Load exercises details
        ex_ids = list(exercise_records.keys())
        ex_stmt = select(Exercise).where(Exercise.id.in_(ex_ids))
        ex_objs = {e.id: e for e in (await db.execute(ex_stmt)).scalars().all()}

        for ex_id, rec in exercise_records.items():
            ex_obj = ex_objs.get(ex_id)
            if ex_obj:
                top_1rms.append(Exercise1RM(
                    exercise_id=ex_id,
                    exercise_name=ex_obj.name,
                    category=ex_obj.category,
                    estimated_1rm=rec["1rm"],
                    best_weight=rec["weight"],
                    best_reps=rec["reps"],
                    last_performed_at=rec["date"]
                ))

        # Sort by estimated 1RM descending
        top_1rms.sort(key=lambda x: x.estimated_1rm, reverse=True)

    # Simple streak calculation (active if at least 1 workout done)
    streak_weeks = 1 if total_workouts > 0 else 0

    return UserStatsOut(
        total_workouts=total_workouts,
        total_volume_kg=round(total_volume, 1),
        total_reps=total_reps,
        total_sets=total_sets,
        streak_weeks=streak_weeks,
        top_exercises_1rm=top_1rms[:8]
    )
