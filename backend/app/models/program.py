from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkoutProgram(Base):
    __tablename__ = "workout_programs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if system default
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    split_type = Column(String, default="full_body")  # full_body, upper_lower, ppl, custom
    days_per_week = Column(Integer, default=3)
    difficulty = Column(String, default="beginner")  # beginner, intermediate, advanced
    is_active = Column(Boolean, default=False)

    user = relationship("User", backref="programs")
    days = relationship("ProgramDay", back_populates="program", cascade="all, delete-orphan", order_by="ProgramDay.day_number")


class ProgramDay(Base):
    __tablename__ = "program_days"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("workout_programs.id"), nullable=False)
    day_number = Column(Integer, default=1)
    name = Column(String, nullable=False)  # e.g., "День 1: Верх тела"

    program = relationship("WorkoutProgram", back_populates="days")
    exercises = relationship("ProgramExercise", back_populates="day", cascade="all, delete-orphan", order_by="ProgramExercise.order_index")


class ProgramExercise(Base):
    __tablename__ = "program_exercises"

    id = Column(Integer, primary_key=True, index=True)
    program_day_id = Column(Integer, ForeignKey("program_days.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, default=0)
    target_sets = Column(Integer, default=3)
    target_reps = Column(String, default="8-12")  # e.g. "8-10", "10-12", "5"
    target_weight_kg = Column(Float, default=0.0, nullable=True)
    rest_seconds = Column(Integer, default=90)

    day = relationship("ProgramDay", back_populates="exercises")
    exercise = relationship("Exercise")
