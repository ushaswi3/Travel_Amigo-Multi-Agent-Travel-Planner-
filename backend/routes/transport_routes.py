from fastapi import APIRouter, Depends
from agents.transport_agent import TransportAgent
from middleware.auth_middleware import get_current_user
from database.models import User
from schemas.trip_schema import TransportRecommendation

router = APIRouter(prefix="/transport", tags=["Transport"])
transport_agent = TransportAgent()


@router.get("/options", response_model=TransportRecommendation)
def get_transport_options(
    source: str,
    destination: str,
    travel_date: str,
    current_user: User = Depends(get_current_user),
):
    res = transport_agent.run(source, destination, travel_date)
    return TransportRecommendation(
        available_options=res["options"],
        recommended_mode=res["recommended_mode"],
        recommended_cost=res["recommended_cost"],
        reason=res["reason"],
    )
