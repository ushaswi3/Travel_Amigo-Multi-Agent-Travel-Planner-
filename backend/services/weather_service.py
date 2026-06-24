"""
Weather service: calls the real OpenWeather API (current or 5-day forecast) or falls back to mock data.
Supports hourly forecast data for travel planning.
"""
from datetime import datetime, timedelta
import random
import requests

from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

CONDITIONS = ["Sunny", "Partly Cloudy", "Clear Sky", "Light Rain", "Overcast"]

# Map OpenWeather main condition to our display conditions/icons
CONDITION_MAP = {
    "Clear": "Clear Sky",
    "Clouds": "Partly Cloudy",
    "Rain": "Light Rain",
    "Drizzle": "Light Rain",
    "Thunderstorm": "Overcast",
    "Snow": "Overcast",
    "Mist": "Overcast",
    "Smoke": "Overcast",
    "Haze": "Overcast",
    "Dust": "Overcast",
    "Fog": "Overcast",
    "Sand": "Overcast",
    "Ash": "Overcast",
    "Squall": "Overcast",
    "Tornado": "Overcast"
}

def _parse_date(travel_date: str) -> datetime:
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(travel_date, fmt)
        except ValueError:
            continue
    return datetime.utcnow()

def _generate_mock_hourly(base_temp: float, day_condition: str) -> list[dict]:
    """Generates a realistic mock hourly forecast for a day using a diurnal cycle."""
    hours = [
        ("7 AM", 0.8), ("9 AM", 1.2), ("11 AM", 2.5), ("1 PM", 4.0),
        ("3 PM", 5.0), ("5 PM", 4.2), ("7 PM", 2.5), ("9 PM", 1.0),
        ("11 PM", 0.0), ("1 AM", -1.0), ("3 AM", -1.8), ("5 AM", -2.5)
    ]
    
    hourly_data = []
    for time_lbl, offset in hours:
        temp = round(base_temp + offset + random.uniform(-0.5, 0.5), 1)
        
        # Decide condition for this hour, slight variance from the day's condition
        if random.random() > 0.7:
            cond = random.choice(CONDITIONS)
        else:
            cond = day_condition
            
        hourly_data.append({
            "time": time_lbl,
            "temp": temp,
            "condition": cond
        })
    return hourly_data

def _real_forecast(destination: str, travel_date: str, days: int) -> list[dict] | None:
    """Calls OpenWeather's 5-day / 3-hour forecast endpoint if a key is configured,
    otherwise falls back to generating a baseline from the current weather API.
    """
    if not settings.OPENWEATHER_API_KEY:
        return None
        
    try:
        # Try calling the 5-day / 3-hour forecast API
        resp = requests.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            params={"q": destination, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        
        # Group lists by date
        # OpenWeather returns list of 40 points (every 3 hours for 5 days)
        start = _parse_date(travel_date)
        forecast_by_date = {}
        
        for item in data.get("list", []):
            dt_txt = item.get("dt_txt") # "2026-06-20 12:00:00"
            dt_val = datetime.strptime(dt_txt, "%Y-%m-%d %H:%M:%S")
            date_key = dt_val.strftime("%Y-%m-%d")
            
            if date_key not in forecast_by_date:
                forecast_by_date[date_key] = []
            forecast_by_date[date_key].append(item)
            
        forecast = []
        for i in range(days):
            date = start + timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            display_date = date.strftime("%d-%m-%Y")
            
            # Find matching data from OpenWeather
            day_data = forecast_by_date.get(date_str)
            
            if not day_data:
                # If we don't have this day (e.g. travel date is too far in future), generate mock using a baseline
                fallback_temp = 28.0 + random.uniform(-3.0, 3.0)
                fallback_cond = random.choice(CONDITIONS)
                forecast.append({
                    "date": display_date,
                    "day_label": f"Day {i + 1}",
                    "condition": fallback_cond,
                    "temperature": f"{round(fallback_temp, 1)}°C",
                    "temp_min": f"{round(fallback_temp - 3.0, 1)}°C",
                    "temp_max": f"{round(fallback_temp + 5.0, 1)}°C",
                    "hourly": _generate_mock_hourly(fallback_temp, fallback_cond)
                })
                continue
                
            # Extract high, low, condition
            temps = [x["main"]["temp"] for x in day_data]
            temp_min = min(temps)
            temp_max = max(temps)
            avg_temp = sum(temps) / len(temps)
            
            # Use middle of the day condition as representative day condition
            mid_index = len(day_data) // 2
            raw_cond = day_data[mid_index]["weather"][0]["main"]
            condition = CONDITION_MAP.get(raw_cond, "Partly Cloudy")
            
            # Construct hourly data from 3-hour steps
            hourly = []
            for item in day_data:
                dt_txt = item.get("dt_txt")
                dt_val = datetime.strptime(dt_txt, "%Y-%m-%d %H:%M:%S")
                # Format to AM/PM hour
                hour_str = dt_val.strftime("%I %p").lstrip('0')
                if hour_str == "12 AM": hour_str = "12 AM"
                
                raw_item_cond = item["weather"][0]["main"]
                hourly.append({
                    "time": hour_str,
                    "temp": round(item["main"]["temp"], 1),
                    "condition": CONDITION_MAP.get(raw_item_cond, "Partly Cloudy")
                })
            
            # If we don't have enough hourly points or they don't cover the full 12 points, generate/fill them
            if len(hourly) < 12:
                # Let's just generate mock hourly centered around the real min/max for visual excellence
                hourly = _generate_mock_hourly(avg_temp, condition)
            
            forecast.append({
                "date": display_date,
                "day_label": f"Day {i + 1}",
                "condition": condition,
                "temperature": f"{round(avg_temp, 1)}°C",
                "temp_min": f"{round(temp_min, 1)}°C",
                "temp_max": f"{round(temp_max, 1)}°C",
                "hourly": hourly
            })
            
        return forecast
    except Exception as e:
        logger.error(f"Error in OpenWeather real forecast: {e}")
        return None

def _mock_forecast(destination: str, travel_date: str, days: int, avg_temp_c: float) -> list[dict]:
    start = _parse_date(travel_date)
    forecast = []
    for i in range(days):
        date = start + timedelta(days=i)
        temp = round(avg_temp_c + random.uniform(-2.0, 2.0), 1)
        condition = random.choice(CONDITIONS)
        
        temp_min = round(temp - 3.5 + random.uniform(-1.0, 1.0), 1)
        temp_max = round(temp + 4.5 + random.uniform(-1.0, 1.0), 1)
        
        forecast.append({
            "date": date.strftime("%d-%m-%Y"),
            "day_label": f"Day {i + 1}",
            "condition": condition,
            "temperature": f"{temp}°C",
            "temp_min": f"{temp_min}°C",
            "temp_max": f"{temp_max}°C",
            "hourly": _generate_mock_hourly(temp, condition)
        })
    return forecast

def get_weather_forecast(destination: str, travel_date: str, days: int, avg_temp_c: float = 28) -> dict:
    """Returns weather forecast for destination. Falls back to mock data if API key is missing or request fails."""
    forecast = None
    if not settings.OPENWEATHER_API_KEY:
        logger.warning(f"OpenWeather API key is not configured. Falling back to mock weather for '{destination}'.")
        forecast = _mock_forecast(destination, travel_date, days, avg_temp_c)
    else:
        forecast = _real_forecast(destination, travel_date, days)
        if not forecast:
            logger.warning(f"Failed to fetch weather forecast for '{destination}' from OpenWeather API. Falling back to mock data.")
            forecast = _mock_forecast(destination, travel_date, days, avg_temp_c)

    suggestions = ["Carry sunscreen", "Carry light cotton clothes"]
    if any("Rain" in d["condition"] for d in forecast):
        suggestions.append("Pack a light raincoat or umbrella")
    if any(float(d["temperature"].replace("°C", "")) >= 30 for d in forecast):
        suggestions.append("Carry sunglasses and stay hydrated")

    return {"forecast": forecast, "suggestions": suggestions}
