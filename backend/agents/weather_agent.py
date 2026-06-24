from services.weather_service import get_weather_forecast


class WeatherAgent:
    """Fetches/generates a day-wise weather forecast and packing suggestions."""

    def run(self, destination: str, travel_date: str, days: int, avg_temp_c: float = 28) -> dict:
        return get_weather_forecast(destination, travel_date, days, avg_temp_c)

