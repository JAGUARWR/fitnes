from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime, Boolean
from datetime import datetime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    
    # User Profile / Anthropometry
    gender = Column(String, default="male")  # male / female
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)

    # Body circumference measurements (cm)
    biceps_cm = Column(Float, nullable=True)
    chest_cm = Column(Float, nullable=True)
    waist_cm = Column(Float, nullable=True)
    hips_cm = Column(Float, nullable=True)

    experience_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    goal = Column(String, default="hypertrophy")  # hypertrophy, strength, fat_loss
    
    # Onboarding status
    is_onboarded = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
