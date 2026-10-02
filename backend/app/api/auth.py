from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/auth", tags=["Auth & Profile"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates user profile data (weight, height, experience, goal)."""
    if profile_data.gender is not None:
        current_user.gender = profile_data.gender
    if profile_data.age is not None:
        current_user.age = profile_data.age
    if profile_data.weight_kg is not None:
        current_user.weight_kg = profile_data.weight_kg
    if profile_data.height_cm is not None:
        current_user.height_cm = profile_data.height_cm
    if profile_data.experience_level is not None:
        current_user.experience_level = profile_data.experience_level
    if profile_data.goal is not None:
        current_user.goal = profile_data.goal
    if profile_data.biceps_cm is not None:
        current_user.biceps_cm = profile_data.biceps_cm
    if profile_data.chest_cm is not None:
        current_user.chest_cm = profile_data.chest_cm
    if profile_data.waist_cm is not None:
        current_user.waist_cm = profile_data.waist_cm
    if profile_data.hips_cm is not None:
        current_user.hips_cm = profile_data.hips_cm
    if profile_data.is_onboarded is not None:
        current_user.is_onboarded = profile_data.is_onboarded

    await db.commit()
    await db.refresh(current_user)
    return current_user
