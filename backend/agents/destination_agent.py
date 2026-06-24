from services.destination_service import get_destination_info


class DestinationAgent:
    """Fetches destination info: top attractions, theme, climate baseline."""

    def run(self, destination: str) -> dict:
        info = get_destination_info(destination)
        return {
            "destination": info["display_name"],
            "top_places": info["attractions"][:5],
            "theme": info.get("theme", "Sightseeing"),
            "avg_temp_c": info.get("avg_temp_c", 27),
            "_full_info": info,  # passed internally to other agents, not exposed in API response
        }

