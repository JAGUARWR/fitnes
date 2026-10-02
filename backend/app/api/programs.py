from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.program import WorkoutProgram, ProgramDay, ProgramExercise
from app.models.exercise import Exercise as ExerciseModel
from app.schemas.program import WorkoutProgramOut, GenerateProgramRequest
from app.services.program_generator import ProgramGenerator
from pydantic import BaseModel
import re

router = APIRouter(prefix="/programs", tags=["Workout Programs"])


@router.get("", response_model=List[WorkoutProgramOut])
async def list_programs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns available workout programs (both system presets and user generated)."""
    stmt = (
        select(WorkoutProgram)
        .where(
            or_(
                WorkoutProgram.user_id == None,
                WorkoutProgram.user_id == current_user.id
            )
        )
        .options(
            selectinload(WorkoutProgram.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise)
        )
        .order_by(WorkoutProgram.is_active.desc(), WorkoutProgram.id.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


from app.services.program_parser import (
    ParsedWorkoutResponse,
    parse_workout_text,
    save_parsed_program,
)


class ImportProgramRequest(BaseModel):
    text: str


@router.post("/import", response_model=WorkoutProgramOut)
async def import_program_from_text(
    req: ImportProgramRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Parses free-form workout text (from notes / Telegram) into a program using
    universal AI parser with robust fallback.
    """
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Текст не может быть пустым")

    parsed_response: ParsedWorkoutResponse = await parse_workout_text(text)
    if not parsed_response.days or not any(d.exercises for d in parsed_response.days):
        raise HTTPException(
            status_code=400,
            detail="Не удалось распознать упражнения в тексте. Укажите названия упражнений."
        )

    program = await save_parsed_program(
        db=db,
        user_id=current_user.id,
        workout_data=parsed_response,
    )
    return program


@router.get("/{program_id}", response_model=WorkoutProgramOut)
async def get_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns a specific program by ID."""
    stmt = (
        select(WorkoutProgram)
        .where(
            WorkoutProgram.id == program_id,
            or_(
                WorkoutProgram.user_id == None,
                WorkoutProgram.user_id == current_user.id
            )
        )
        .options(
            selectinload(WorkoutProgram.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise)
        )
    )
    result = await db.execute(stmt)
    program = result.scalars().first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")
    return program


@router.post("/generate", response_model=WorkoutProgramOut)
async def generate_program(
    req: GenerateProgramRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a tailored workout program based on user weight, experience,
    desired split and frequency.
    """
    # Also update user profile with latest anthropometry
    current_user.weight_kg = req.weight_kg
    if req.height_cm:
        current_user.height_cm = req.height_cm
    if req.age:
        current_user.age = req.age
    if req.gender:
        current_user.gender = req.gender
    if req.biceps_cm:
        current_user.biceps_cm = req.biceps_cm
    if req.chest_cm:
        current_user.chest_cm = req.chest_cm
    if req.waist_cm:
        current_user.waist_cm = req.waist_cm
    if req.hips_cm:
        current_user.hips_cm = req.hips_cm
    current_user.experience_level = req.experience_level
    current_user.goal = req.goal
    current_user.is_onboarded = True

    # Deactivate existing user programs
    await db.execute(
        update(WorkoutProgram)
        .where(WorkoutProgram.user_id == current_user.id)
        .values(is_active=False)
    )

    # Generate new program
    new_program = await ProgramGenerator.generate_program(
        db=db,
        user_id=current_user.id,
        weight_kg=req.weight_kg,
        experience_level=req.experience_level,
        goal=req.goal,
        split_type=req.split_type,
        days_per_week=req.days_per_week
    )

    # Reload with all relations
    stmt = (
        select(WorkoutProgram)
        .where(WorkoutProgram.id == new_program.id)
        .options(
            selectinload(WorkoutProgram.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise)
        )
    )
    res = await db.execute(stmt)
    return res.scalars().first()


@router.post("/{program_id}/activate")
async def activate_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marks a program as the user's active workout plan."""
    # Deactivate all
    await db.execute(
        update(WorkoutProgram)
        .where(WorkoutProgram.user_id == current_user.id)
        .values(is_active=False)
    )
    # Activate target
    await db.execute(
        update(WorkoutProgram)
        .where(WorkoutProgram.id == program_id)
        .values(is_active=True)
    )
    await db.commit()
    return {"status": "ok", "message": "Программа успешно активирована"}
