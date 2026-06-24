"""
Low-level, generic CRUD helpers. Domain-specific logic (e.g. "authenticate_user")
lives one layer up, in repositories/, which call these functions.
"""
from sqlalchemy.orm import Session

from database import models


# ---------- User ----------
def create_user(db: Session, username: str, email: str, hashed_password: str) -> models.User:
    user = models.User(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


# ---------- Trip ----------
def create_trip(db: Session, user_id: int, source: str, destination: str, travel_date: str,
                 days: int, budget: float, preferences: str, additional_requirements: str,
                 result_json: str) -> models.Trip:
    trip = models.Trip(
        user_id=user_id,
        source=source,
        destination=destination,
        travel_date=travel_date,
        days=days,
        budget=budget,
        preferences=preferences,
        additional_requirements=additional_requirements,
        result_json=result_json,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def get_trip_by_id(db: Session, trip_id: int) -> models.Trip | None:
    return db.query(models.Trip).filter(models.Trip.id == trip_id).first()


def get_trips_by_user(db: Session, user_id: int):
    return db.query(models.Trip).filter(models.Trip.user_id == user_id).order_by(models.Trip.id.desc()).all()


def delete_trip(db: Session, trip_id: int) -> bool:
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip:
        db.delete(trip)
        db.commit()
        return True
    return False
