from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.exercise import ExerciseOut


class ProgramExerciseOut(BaseModel):
    id: int
    exercise_id: int
    order_index: int
    target_sets: int
    target_reps: str
    target_weight_kg: Optional[float] = 0.0
    rest_seconds: int
    exercise: Optional[ExerciseOut] = None
    model_config = ConfigDict(from_attributes=True)


class ProgramDayOut(BaseModel):
    id: int
    day_number: int
    name: str
    exercises: List[ProgramExerciseOut] = []
    model_config = ConfigDict(from_attributes=True)


class WorkoutProgramOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    split_type: str
    days_per_week: int
    difficulty: str
    is_active: bool
    days: List[ProgramDayOut] = []
    model_config = ConfigDict(from_attributes=True)


class GenerateProgramRequest(BaseModel):
    weight_kg: float
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = "male"
    biceps_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    experience_level: str = "beginner"  # beginner, intermediate, advanced
    goal: str = "hypertrophy"  # hypertrophy, strength, fat_loss
    split_type: str = "full_body"  # full_body, upper_lower, ppl
    days_per_week: int = 3
