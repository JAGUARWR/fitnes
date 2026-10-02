from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    gender: Optional[str] = "male"
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    
    # Body circumference measurements (cm)
    biceps_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None

    experience_level: Optional[str] = "beginner"
    goal: Optional[str] = "hypertrophy"
    is_onboarded: bool = False


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    biceps_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    experience_level: Optional[str] = None
    goal: Optional[str] = None
    is_onboarded: Optional[bool] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
