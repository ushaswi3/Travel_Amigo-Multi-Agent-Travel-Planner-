"""SQLAlchemy ORM models: User and Trip."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    travel_date = Column(String(20), nullable=False)
    days = Column(Integer, nullable=False)
    budget = Column(Float, nullable=False)
    preferences = Column(String(255), default="")          # comma separated
    additional_requirements = Column(String(255), default="")

    result_json = Column(Text, default="{}")                # full generated plan, stored as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="trips")

