from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.schemas.exercise import ExerciseOut


class WorkoutSetCreate(BaseModel):
    exercise_id: int
    set_number: int
    weight_kg: float
    reps: int
    is_completed: bool = True
    rpe: Optional[float] = None


class WorkoutSetOut(BaseModel):
    id: int
    session_id: int
    exercise_id: int
    set_number: int
    weight_kg: float
    reps: int
    is_completed: bool
    rpe: Optional[float] = None
    created_at: datetime
    exercise: Optional[ExerciseOut] = None
    model_config = ConfigDict(from_attributes=True)


class StartSessionRequest(BaseModel):
    name: Optional[str] = "Тренировка в зале"
    program_day_id: Optional[int] = None


class FinishSessionRequest(BaseModel):
    duration_seconds: int
    total_volume_kg: float
    notes: Optional[str] = None


class WorkoutSessionOut(BaseModel):
    id: int
    user_id: int
    program_day_id: Optional[int] = None
    name: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_seconds: int
    total_volume_kg: float
    notes: Optional[str] = None
    is_completed: bool
    sets: List[WorkoutSetOut] = []
    model_config = ConfigDict(from_attributes=True)
