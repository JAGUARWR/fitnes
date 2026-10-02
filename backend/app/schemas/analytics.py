from pydantic import BaseModel
from typing import List, Optional


class Exercise1RM(BaseModel):
    exercise_id: int
    exercise_name: str
    category: str
    estimated_1rm: float
    best_weight: float
    best_reps: int
    last_performed_at: Optional[str] = None


class UserStatsOut(BaseModel):
    total_workouts: int
    total_volume_kg: float
    total_reps: int
    total_sets: int
    streak_weeks: int
    top_exercises_1rm: List[Exercise1RM] = []
