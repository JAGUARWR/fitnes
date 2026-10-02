from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    program_day_id = Column(Integer, ForeignKey("program_days.id"), nullable=True)
    name = Column(String, default="Тренировка в зале")
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    total_volume_kg = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)

    user = relationship("User", backref="workout_sessions")
    program_day = relationship("ProgramDay")
    sets = relationship("WorkoutSet", back_populates="session", cascade="all, delete-orphan", order_by="WorkoutSet.id")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    set_number = Column(Integer, default=1)
    weight_kg = Column(Float, default=0.0)
    reps = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    rpe = Column(Float, nullable=True)  # Rate of Perceived Exertion (1-10)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("WorkoutSession", back_populates="sets")
    exercise = relationship("Exercise")
