from services.itinerary_service import build_itinerary


class ItineraryAgent:
    """Builds the day-wise plan from destination info and preferences."""

    def run(self, destination_info: dict, days: int, preferences: list[str]) -> list[dict]:
        return build_itinerary(destination_info, days, preferences)

