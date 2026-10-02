import re
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workout_log import WorkoutSession, WorkoutSet
from app.models.program import ProgramDay, ProgramExercise
from app.schemas.workout import (
    WorkoutSessionOut,
    WorkoutSetOut,
    WorkoutSetCreate,
    StartSessionRequest,
    FinishSessionRequest
)

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.get("/active", response_model=Optional[WorkoutSessionOut])
async def get_active_workout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns currently ongoing uncompleted workout session if any."""
    stmt = (
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.is_completed == False
        )
        .options(
            selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise)
        )
        .order_by(desc(WorkoutSession.started_at))
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.post("/start", response_model=WorkoutSessionOut)
async def start_workout(
    req: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Starts a new workout session."""
    # Check if there is already an unfinished session
    active_stmt = select(WorkoutSession).where(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.is_completed == False
    )
    existing = (await db.execute(active_stmt)).scalars().first()
    if existing:
        # Return existing active session
        stmt = (
            select(WorkoutSession)
            .where(WorkoutSession.id == existing.id)
            .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
        )
        return (await db.execute(stmt)).scalars().first()

    name = req.name or "Тренировка в зале"
    p_day = None
    if req.program_day_id:
        day_stmt = (
            select(ProgramDay)
            .where(ProgramDay.id == req.program_day_id)
            .options(
                selectinload(ProgramDay.exercises)
                .selectinload(ProgramExercise.exercise)
            )
        )
        p_day = (await db.execute(day_stmt)).scalars().first()
        if p_day:
            name = p_day.name

    new_session = WorkoutSession(
        user_id=current_user.id,
        program_day_id=req.program_day_id,
        name=name,
        started_at=datetime.utcnow(),
        is_completed=False,
    )
    db.add(new_session)
    await db.flush()

    # Pre-populate workout sets according to the program day specification
    if p_day and p_day.exercises:
        for pe in p_day.exercises:
            sets_count = pe.target_sets if pe.target_sets and pe.target_sets > 0 else 3
            reps_m = re.findall(r"\d+", pe.target_reps or "10")
            reps_val = int(reps_m[-1]) if reps_m else 10
            weight_val = pe.target_weight_kg if pe.target_weight_kg is not None else 0.0

            for s_num in range(1, sets_count + 1):
                w_set = WorkoutSet(
                    session_id=new_session.id,
                    exercise_id=pe.exercise_id,
                    set_number=s_num,
                    weight_kg=weight_val,
                    reps=reps_val,
                    is_completed=False,
                )
                db.add(w_set)

    await db.commit()
    await db.refresh(new_session)

    stmt = (
        select(WorkoutSession)
        .where(WorkoutSession.id == new_session.id)
        .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
    )
    return (await db.execute(stmt)).scalars().first()


@router.post("/{session_id}/sets", response_model=WorkoutSetOut)
async def log_set(
    session_id: int,
    set_in: WorkoutSetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Adds a new set to an active workout session."""
    session_stmt = select(WorkoutSession).where(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    )
    session = (await db.execute(session_stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")

    new_set = WorkoutSet(
        session_id=session.id,
        exercise_id=set_in.exercise_id,
        set_number=set_in.set_number,
        weight_kg=set_in.weight_kg,
        reps=set_in.reps,
        is_completed=set_in.is_completed,
        rpe=set_in.rpe
    )
    db.add(new_set)
    await db.commit()
    await db.refresh(new_set)

    stmt = (
        select(WorkoutSet)
        .where(WorkoutSet.id == new_set.id)
        .options(selectinload(WorkoutSet.exercise))
    )
    return (await db.execute(stmt)).scalars().first()


@router.delete("/sets/{set_id}")
async def delete_set(
    set_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a logged set."""
    stmt = (
        select(WorkoutSet)
        .join(WorkoutSession)
        .where(
            WorkoutSet.id == set_id,
            WorkoutSession.user_id == current_user.id
        )
    )
    target_set = (await db.execute(stmt)).scalars().first()
    if not target_set:
        raise HTTPException(status_code=404, detail="Подход не найден")

    await db.delete(target_set)
    await db.commit()
    return {"status": "ok", "deleted_set_id": set_id}


@router.post("/{session_id}/finish", response_model=WorkoutSessionOut)
async def finish_workout(
    session_id: int,
    req: FinishSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Finishes and calculates total statistics for the workout session."""
    stmt = (
        select(WorkoutSession)
        .where(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == current_user.id
        )
        .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
    )
    session = (await db.execute(stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")

    # Compute volume in kg (sum of weight * reps for completed sets)
    total_volume = sum(
        s.weight_kg * s.reps for s in session.sets if s.is_completed and s.weight_kg > 0
    )

    session.is_completed = True
    session.finished_at = datetime.utcnow()
    session.duration_seconds = req.duration_seconds
    session.total_volume_kg = total_volume if req.total_volume_kg == 0 else req.total_volume_kg
    session.notes = req.notes

    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/cancel")
async def cancel_workout(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Discards an incomplete workout session."""
    stmt = select(WorkoutSession).where(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    )
    session = (await db.execute(stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")

    await db.delete(session)
    await db.commit()
    return {"status": "ok", "message": "Тренировка отменена"}


@router.get("/history", response_model=List[WorkoutSessionOut])
async def get_workout_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns completed workout history."""
    stmt = (
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.is_completed == True
        )
        .options(selectinload(WorkoutSession.sets).selectinload(WorkoutSet.exercise))
        .order_by(desc(WorkoutSession.finished_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/last-performance/{exercise_id}", response_model=List[WorkoutSetOut])
async def get_last_performance(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns sets performed for this exercise in the most recent completed workout.
    Used to display 'Last: 80kg x 8' hints during live workouts.
    """
    # Find most recent completed session containing this exercise
    stmt = (
        select(WorkoutSet.session_id)
        .join(WorkoutSession)
        .where(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.is_completed == True,
            WorkoutSet.exercise_id == exercise_id,
            WorkoutSet.is_completed == True
        )
        .order_by(desc(WorkoutSession.finished_at))
        .limit(1)
    )
    last_session_id = (await db.execute(stmt)).scalar()
    if not last_session_id:
        return []

    # Get all sets for this exercise from that session
    sets_stmt = (
        select(WorkoutSet)
        .where(
            WorkoutSet.session_id == last_session_id,
            WorkoutSet.exercise_id == exercise_id,
            WorkoutSet.is_completed == True
        )
        .options(selectinload(WorkoutSet.exercise))
        .order_by(WorkoutSet.set_number)
    )
    result = await db.execute(sets_stmt)
    return result.scalars().all()
