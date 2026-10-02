from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)  # chest, back, legs, shoulders, biceps, triceps, core
    equipment = Column(String, default="barbell")  # barbell, dumbbell, machine, cable, bodyweight, other
    target_muscle = Column(String, nullable=True)  # e.g. "Большая грудная", "Широчайшие"
    instructions = Column(Text, nullable=True)
    is_custom = Column(Boolean, default=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", backref="created_exercises")
