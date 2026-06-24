from services.hotel_service import get_hotel_options


class HotelAgent:
    """Fetches a shortlist of hotels matched to budget and preferences."""

    def run(self, destination: str, days: int, budget: float, preferences: list[str],
            additional_requirements: str = "", max_results: int = 5) -> dict:
        hotels = get_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
        return {"hotels": hotels, "top_choice": hotels[0] if hotels else None}

