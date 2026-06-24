import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User
from middleware.auth_middleware import get_current_user
from schemas.trip_schema import TripCreateRequest, TripPlanResponse
from agents.coordinator_agent import CoordinatorAgent
from repositories import trip_repository

router = APIRouter(prefix="/trip", tags=["Trip"])
coordinator = CoordinatorAgent()


@router.post("/create", response_model=TripPlanResponse)
def create_trip(
    payload: TripCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = coordinator.run(payload)

    saved_trip = trip_repository.save_trip(db, current_user.id, payload, plan)

    return TripPlanResponse(
        trip_id=saved_trip.id,
        source=payload.source,
        travel_date=payload.travel_date,
        days=payload.days,
        budget=payload.budget,
        preferences=payload.preferences,
        **plan,
    )


@router.get("/{trip_id}", response_model=TripPlanResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = trip_repository.get_trip(db, trip_id)
    if not trip or trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    plan = json.loads(trip.result_json)

    # Standardize destination_highlights for backward compatibility
    highlights_raw = plan.get("destination_highlights") or []
    destination_highlights = []
    from services.destination_service import _enrich_attraction
    for hl in highlights_raw:
        enriched = _enrich_attraction(hl, trip.destination, plan.get("theme", "Sightseeing"))
        destination_highlights.append(enriched)
    plan["destination_highlights"] = destination_highlights

    return TripPlanResponse(
        trip_id=trip.id,
        source=trip.source,
        travel_date=trip.travel_date,
        days=trip.days,
        budget=trip.budget,
        preferences=trip.preferences.split(",") if trip.preferences else [],
        **plan,
    )


@router.get("/")
def list_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trips = trip_repository.list_trips_for_user(db, current_user.id)
    return [
        {
            "trip_id": t.id,
            "source": t.source,
            "destination": t.destination,
            "travel_date": t.travel_date,
            "days": t.days,
            "budget": t.budget,
            "created_at": t.created_at,
        }
        for t in trips
    ]


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = trip_repository.get_trip(db, trip_id)
    if not trip or trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
    trip_repository.delete_trip(db, trip_id)
    return

