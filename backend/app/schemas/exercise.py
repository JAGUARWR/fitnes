from pydantic import BaseModel, ConfigDict
from typing import Optional


class ExerciseBase(BaseModel):
    name: str
    category: str
    equipment: Optional[str] = "barbell"
    target_muscle: Optional[str] = None
    instructions: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseOut(ExerciseBase):
    id: int
    is_custom: bool = False
    created_by_user_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
