import hmac
import hashlib
import json
import urllib.parse
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User


def validate_telegram_data(init_data: str, bot_token: str) -> Optional[dict]:
    """Validates Telegram WebApp initData string using HMAC-SHA256."""
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in parsed_data:
            return None
        received_hash = parsed_data.pop("hash")
        
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash == received_hash:
            if "user" in parsed_data:
                return json.loads(parsed_data["user"])
            return parsed_data
        return None
    except Exception:
        return None


async def get_current_user(
    x_telegram_init_data: Optional[str] = Header(None),
    x_telegram_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Returns the current user.
    If valid Telegram initData is present and BOT_TOKEN is set, validates it.
    If in DEV_MODE or running in dev browser, allows header or defaults to default test user.
    """
    tg_user = None

    if x_telegram_init_data and settings.BOT_TOKEN:
        tg_user = validate_telegram_data(x_telegram_init_data, settings.BOT_TOKEN)

    tg_id = None
    first_name = "Атлет"
    username = None

    if tg_user and isinstance(tg_user, dict):
        tg_id = tg_user.get("id")
        first_name = tg_user.get("first_name", "Атлет")
        username = tg_user.get("username")
    elif x_telegram_user_id:
        try:
            tg_id = int(x_telegram_user_id)
        except ValueError:
            tg_id = 999999999
    elif settings.DEV_MODE:
        # Default mock user for testing in desktop browser
        tg_id = 999999999
        first_name = "Тестовый Атлет"
        username = "gym_hero"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация Telegram"
        )

    # Fetch or create user in DB
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalars().first()

    if not user:
        user = User(
            telegram_id=tg_id,
            first_name=first_name,
            username=username,
            weight_kg=75.0,
            height_cm=178.0,
            experience_level="beginner",
            goal="hypertrophy"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
