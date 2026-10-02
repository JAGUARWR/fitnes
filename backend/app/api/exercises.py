from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseOut, ExerciseCreate

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("", response_model=List[ExerciseOut])
async def list_exercises(
    category: Optional[str] = Query(None),
    equipment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns exercise catalog with optional filtering."""
    query = select(Exercise).where(
        or_(
            Exercise.is_custom == False,
            Exercise.created_by_user_id == current_user.id
        )
    )

    if category and category != "all":
        query = query.where(Exercise.category == category)
    if equipment and equipment != "all":
        query = query.where(Exercise.equipment == equipment)
    if search:
        query = query.where(Exercise.name.ilike(f"%{search}%"))

    query = query.order_by(Exercise.category, Exercise.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ExerciseOut)
async def create_custom_exercise(
    exercise_in: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a custom user-defined exercise."""
    exercise = Exercise(
        name=exercise_in.name,
        category=exercise_in.category,
        equipment=exercise_in.equipment or "barbell",
        target_muscle=exercise_in.target_muscle,
        instructions=exercise_in.instructions,
        is_custom=True,
        created_by_user_id=current_user.id
    )
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise
