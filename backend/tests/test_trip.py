import pytest
from unittest.mock import patch

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


def mock_request_router(url, *args, **kwargs):
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
            return MockResponse({
                "features": [
                    {"properties": {"name": "Mock Hotel 1", "formatted": "Location 1"}},
                    {"properties": {"name": "Mock Hotel 2", "formatted": "Location 2"}},
                    {"properties": {"name": "Mock Hotel 3", "formatted": "Location 3"}},
                    {"properties": {"name": "Mock Hotel 4", "formatted": "Location 4"}},
                    {"properties": {"name": "Mock Hotel 5", "formatted": "Location 5"}}
                ]
            })
        else:
            return MockResponse({
                "features": [
                    {"properties": {"name": "Attraction 1", "categories": ["tourism.attraction"]}},
                    {"properties": {"name": "Attraction 2", "categories": ["tourism.attraction"]}},
                    {"properties": {"name": "Culture Spot", "categories": ["entertainment.culture"]}},
                    {"properties": {"name": "Natural Park", "categories": ["natural"]}},
                    {"properties": {"name": "Restaurant", "categories": ["catering.restaurant"]}}
                ]
            })
    elif "aviationstack" in url_lower:
        return MockResponse({
            "data": [
                {
                    "airline": {"name": "Mock Airline 1"},
                    "departure": {"scheduled": "2026-07-20T08:00:00+00:00"},
                    "arrival": {"scheduled": "2026-07-20T10:00:00+00:00"}
                },
                {
                    "airline": {"name": "Mock Airline 2"},
                    "departure": {"scheduled": "2026-07-20T13:00:00+00:00"},
                    "arrival": {"scheduled": "2026-07-20T15:00:00+00:00"}
                },
                {
                    "airline": {"name": "Mock Airline 3"},
                    "departure": {"scheduled": "2026-07-20T18:00:00+00:00"},
                    "arrival": {"scheduled": "2026-07-20T20:00:00+00:00"}
                }
            ]
        })
    elif "openweathermap" in url_lower:
        return MockResponse({
            "main": {"temp": 26.0},
            "weather": [{"main": "Sunny"}]
        })
    elif "anthropic" in url_lower or "openai" in url_lower:
        return MockResponse({
            "choices": [{"message": {"content": "- Tip 1\n- Tip 2\n- Tip 3"}}],
            "content": [{"text": "- Tip 1\n- Tip 2\n- Tip 3"}]
        })
    return MockResponse({}, 404)


@pytest.fixture()
def auth_token(client):
    client.post("/auth/register", json={
        "username": "tripuser", "email": "tripuser@example.com", "password": "password123"
    })
    resp = client.post("/auth/login", json={"username": "tripuser", "password": "password123"})
    return resp.json()["token"]


def test_create_trip_requires_auth(client):
    resp = client.post("/trip/create", json={
        "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026",
        "days": 4, "budget": 20000, "preferences": ["Beaches", "Adventure"],
    })
    assert resp.status_code == 401


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_key")
@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_key")
@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_key")
@patch.object(settings, "OPENAI_API_KEY", "dummy_key")
@patch("requests.get", side_effect=mock_request_router)
@patch("requests.post", side_effect=mock_request_router)
def test_create_trip_success(mock_post, mock_get, client, auth_token):
    resp = client.post(
        "/trip/create",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026",
            "days": 4, "budget": 20000, "preferences": ["Beaches", "Adventure"],
            "additional_requirements": "Near beach hotel, family friendly",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["destination"] == "Goa"
    assert len(data["transport"]["available_options"]) >= 3   # only flights now
    assert len(data["hotels"]) <= 5
    assert len(data["weather"]["forecast"]) == 4
    assert len(data["itinerary"]) == 4
    assert "remaining_budget" in data["budget_analysis"]
    assert len(data["ai_recommendations"]) > 0


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_key")
@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_key")
@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_key")
@patch.object(settings, "OPENAI_API_KEY", "dummy_key")
@patch("requests.get", side_effect=mock_request_router)
@patch("requests.post", side_effect=mock_request_router)
def test_get_trip_by_id(mock_post, mock_get, client, auth_token):
    create_resp = client.post(
        "/trip/create",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "source": "Hyderabad", "destination": "Manali", "travel_date": "01-12-2026",
            "days": 3, "budget": 15000, "preferences": ["Adventure"],
        },
    )
    trip_id = create_resp.json()["trip_id"]

    get_resp = client.get(f"/trip/{trip_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert get_resp.status_code == 200
    assert get_resp.json()["destination"] == "Manali"


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_key")
@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_key")
@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_key")
@patch.object(settings, "OPENAI_API_KEY", "dummy_key")
@patch("requests.get", side_effect=mock_request_router)
@patch("requests.post", side_effect=mock_request_router)
def test_list_trips(mock_post, mock_get, client, auth_token):
    client.post(
        "/trip/create",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026",
            "days": 2, "budget": 8000, "preferences": ["Beaches"],
        },
    )
    resp = client.get("/trip/", headers={"Authorization": f"Bearer {auth_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_key")
@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_key")
@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_key")
@patch.object(settings, "OPENAI_API_KEY", "dummy_key")
@patch("requests.get", side_effect=mock_request_router)
@patch("requests.post", side_effect=mock_request_router)
def test_delete_trip_success(mock_post, mock_get, client, auth_token):
    # Create trip
    create_resp = client.post(
        "/trip/create",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026",
            "days": 2, "budget": 8000, "preferences": ["Beaches"],
        },
    )
    trip_id = create_resp.json()["trip_id"]

    # Delete trip
    delete_resp = client.delete(f"/trip/{trip_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert delete_resp.status_code == 204

    # Verify deleted
    get_resp = client.get(f"/trip/{trip_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert get_resp.status_code == 404


@patch.object(settings, "GEOAPIFY_API_KEY", "dummy_key")
@patch.object(settings, "OPENWEATHER_API_KEY", "dummy_key")
@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_key")
@patch.object(settings, "OPENAI_API_KEY", "dummy_key")
@patch("requests.get", side_effect=mock_request_router)
@patch("requests.post", side_effect=mock_request_router)
def test_delete_trip_unauthorized(mock_post, mock_get, client, auth_token):
    # Create trip
    create_resp = client.post(
        "/trip/create",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026",
            "days": 2, "budget": 8000, "preferences": ["Beaches"],
        },
    )
    trip_id = create_resp.json()["trip_id"]

    # Delete without auth
    delete_no_auth = client.delete(f"/trip/{trip_id}")
    assert delete_no_auth.status_code == 401

    # Create another user and login
    client.post("/auth/register", json={
        "username": "otheruser", "email": "otheruser@example.com", "password": "password123"
    })
    other_login = client.post("/auth/login", json={"username": "otheruser", "password": "password123"})
    other_token = other_login.json()["token"]

    # Delete with other user token
    delete_other_user = client.delete(f"/trip/{trip_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert delete_other_user.status_code == 404
