import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.destination_agent import DestinationAgent
from agents.transport_agent import TransportAgent
from agents.hotel_agent import HotelAgent
from agents.weather_agent import WeatherAgent
from agents.budget_agent import BudgetAgent
from agents.itinerary_agent import ItineraryAgent
from agents.recommendation_agent import RecommendationAgent
from config.settings import settings


class MockResponse:
    def __init__(self, json_data, status_code=200):
        self.json_data = json_data
        self.status_code = status_code
    def json(self):
        return self.json_data
    def raise_for_status(self):
        if self.status_code != 200:
            raise Exception("HTTP Error")


# Mock pools
MOCK_PLACES_DATA = {
    "features": [
        {
            "properties": {
                "name": "Baga Beach",
                "categories": ["tourism", "tourism.attraction"]
            }
        },
        {
            "properties": {
                "name": "Basilica of Bom Jesus",
                "categories": ["entertainment", "entertainment.culture"]
            }
        },
        {
            "properties": {
                "name": "Bhagwan Mahavir Sanctuary",
                "categories": ["natural", "natural.forest_reserve"]
            }
        },
        {
            "properties": {
                "name": "Britto's Restaurant",
                "categories": ["catering", "catering.restaurant"]
            }
        },
        {
            "properties": {
                "name": "Parasailing Baga",
                "categories": ["activity", "activity.sport"]
            }
        }
    ]
}

MOCK_HOTEL_PLACES_DATA = {
    "features": [
        {
            "properties": {
                "name": "Taj Exotica Resort & Spa, Goa",
                "formatted": "Calwaddo, Benaulim, Goa 403716"
            }
        },
        {
            "properties": {
                "name": "Sea Breeze Resort",
                "formatted": "Baga beach, Calangute, Goa 403516"
            }
        }
    ]
}

MOCK_FLIGHT_DATA = {
    "data": [
        {
            "airline": {"name": "IndiGo"},
            "departure": {"scheduled": "2026-07-20T06:00:00+00:00"},
            "arrival": {"scheduled": "2026-07-20T08:30:00+00:00"}
        },
        {
            "airline": {"name": "Air India"},
            "departure": {"scheduled": "2026-07-20T14:30:00+00:00"},
            "arrival": {"scheduled": "2026-07-20T17:00:00+00:00"}
        }
    ]
}

MOCK_WEATHER_DATA = {
    "main": {"temp": 28.5},
    "weather": [{"main": "Sunny"}]
}


def mock_agent_request_router(url, *args, **kwargs):
    url_lower = url.lower()
    if "geocode" in url_lower:
        params = kwargs.get("params", {})
        text = params.get("text", "Goa").title()
        return MockResponse({
            "features": [{
                "properties": {
                    "lat": 15.2993,
                    "lon": 74.1240,
                    "formatted": text
                }
            }]
        })
    elif "places" in url_lower:
        params = kwargs.get("params", {})
        categories = params.get("categories", "")
        if "accommodation.hotel" in categories:
            return MockResponse(MOCK_HOTEL_PLACES_DATA)
        else:
            return MockResponse(MOCK_PLACES_DATA)
    elif "aviationstack" in url_lower:
        return MockResponse(MOCK_FLIGHT_DATA)
    elif "openweathermap" in url_lower:
        return MockResponse(MOCK_WEATHER_DATA)
    return MockResponse({}, 404)


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_geoapify_key")
@patch("services.destination_service.requests.get", side_effect=mock_agent_request_router)
def test_destination_agent_known_destination(mock_get):
    result = DestinationAgent().run("Goa")
    assert result["destination"] == "Goa"
    assert len(result["top_places"]) > 0
    assert any(place["name"] == "Baga Beach" for place in result["top_places"])


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_geoapify_key")
@patch("services.destination_service.requests.get", side_effect=mock_agent_request_router)
def test_destination_agent_unknown_destination_fallback(mock_get):
    result = DestinationAgent().run("Atlantis")
    assert result["destination"] == "Atlantis"
    assert len(result["top_places"]) > 0


@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_aviation_key")
@patch("services.transport_service.requests.get", side_effect=mock_agent_request_router)
def test_transport_agent_returns_all_modes(mock_get):
    result = TransportAgent().run("Hyderabad", "Goa", "20-07-2026")
    
    modes = {opt["mode"] for opt in result["options"]}
    # Only flight option is now returned and required
    assert "Flight" in modes
    assert "Train" not in modes
    assert "Bus" not in modes
    assert result["recommended_cost"] == min(o["cost"] for o in result["options"])
    assert result["recommended_mode"] == "Flight"


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_geoapify_key")
@patch("services.hotel_service.requests.get", side_effect=mock_agent_request_router)
def test_hotel_agent_respects_max_results(mock_get):
    result = HotelAgent().run("Goa", days=4, budget=20000, preferences=["Beaches"], max_results=2)
    assert len(result["hotels"]) <= 2
    assert result["top_choice"] is not None
    assert "Taj Exotica" in result["top_choice"]["name"] or "Sea Breeze" in result["top_choice"]["name"]


@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_weather_key")
@patch("services.weather_service.requests.get", side_effect=mock_agent_request_router)
def test_weather_agent_returns_correct_day_count(mock_get):
    result = WeatherAgent().run("Goa", "20-07-2026", days=5, avg_temp_c=30)
    assert len(result["forecast"]) == 5
    assert result["forecast"][0]["temperature"] == "28.5°C"


def test_budget_agent_calculates_remaining_correctly():
    itinerary = [{"estimated_spend": 1000}, {"estimated_spend": 1500}]
    result = BudgetAgent().run(budget=10000, transport_cost=1200, hotel_cost=3000, itinerary=itinerary)
    assert result["remaining_budget"] == 10000 - result["total_spent"]
    assert result["status"] in ("Within Budget", "Over Budget")


def test_itinerary_agent_day_count_matches_request():
    # Pass a valid mock destination info directly
    info = {
        "display_name": "Goa, India",
        "attractions": ["Baga Beach", "Calangute Beach"],
        "adventure_activities": ["Parasailing"],
        "culture_spots": ["Basilica of Bom Jesus"],
        "wildlife_spots": ["Bhagwan Mahavir Sanctuary"],
        "food_spots": ["Britto's Restaurant"],
        "best_time": "Year-round",
        "avg_temp_c": 28,
        "theme": "Sightseeing"
    }
    itinerary = ItineraryAgent().run(info, days=4, preferences=["Beaches", "Adventure"])
    assert len(itinerary) == 4
    assert itinerary[0]["day"] == 1


@patch.object(settings, "ANTHROPIC_API_KEY", "dummy_anthropic_key")
@patch("services.llm_service.requests.post")
def test_recommendation_agent_rule_based_fallback(mock_post):
    # Since rule-based fallback is removed, we mock LLM to return valid recommendations
    mock_post.return_value = MockResponse({
        "content": [{"text": "- Tip 1\n- Tip 2\n- Tip 3"}]
    })
    
    context = {
        "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026", "days": 4,
        "budget": 20000, "preferences": ["Beaches", "Adventure"], "weather_summary": "Sunny",
        "recommended_mode": "Flight", "recommended_cost": 4500,
        "hotel_name": "Sea Breeze Resort", "hotel_price": 2200,
    }
    tips = RecommendationAgent().run(context)
    assert len(tips) > 0
    assert len(tips) <= 5
    assert tips[0] == "Tip 1"


@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_weather_key")
@patch("services.weather_service.requests.get", side_effect=mock_agent_request_router)
def test_weather_service_real_api_mock(mock_get):
    from services.weather_service import get_weather_forecast
    result = get_weather_forecast("Goa", "20-07-2026", days=3)
    
    forecast = result["forecast"]
    assert len(forecast) == 3
    assert forecast[0]["date"] == "20-07-2026"
    assert forecast[0]["condition"] == "Sunny"
    assert forecast[0]["temperature"] == "28.5°C"


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_geoapify_key")
@patch("services.destination_service.fetch_wikipedia_image", return_value=None)
@patch("services.destination_service.requests.get", side_effect=mock_agent_request_router)
def test_destination_service_geoapify_mock(mock_get, mock_wiki):
    from services.destination_service import get_destination_info
    result = get_destination_info("Paris")
    
    assert mock_get.call_count == 3
    assert result["display_name"] == "Paris"
    assert any(place["name"] == "Baga Beach" for place in result["attractions"])
    assert "Basilica of Bom Jesus" in result["culture_spots"]
    assert "Bhagwan Mahavir Sanctuary" in result["wildlife_spots"]
    assert "Britto's Restaurant" in result["food_spots"]
    assert result["avg_temp_c"] == 15
