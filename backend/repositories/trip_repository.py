import json

from sqlalchemy.orm import Session

from database import crud, models
from schemas.trip_schema import TripCreateRequest


def save_trip(db: Session, user_id: int, request: TripCreateRequest, result: dict) -> models.Trip:
    return crud.create_trip(
        db,
        user_id=user_id,
        source=request.source,
        destination=request.destination,
        travel_date=request.travel_date,
        days=request.days,
        budget=request.budget,
        preferences=",".join(request.preferences),
        additional_requirements=request.additional_requirements or "",
        result_json=json.dumps(result),
    )


def get_trip(db: Session, trip_id: int) -> models.Trip | None:
    return crud.get_trip_by_id(db, trip_id)


def list_trips_for_user(db: Session, user_id: int):
    return crud.get_trips_by_user(db, user_id)


def delete_trip(db: Session, trip_id: int) -> bool:
    return crud.delete_trip(db, trip_id)

