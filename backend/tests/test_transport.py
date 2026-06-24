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
        },
        {
            "airline": {"name": "SpiceJet"},
            "departure": {"scheduled": "2026-07-20T19:00:00+00:00"},
            "arrival": {"scheduled": "2026-07-20T21:30:00+00:00"}
        }
    ]
}


@pytest.fixture()
def auth_token(client):
    client.post("/auth/register", json={
        "username": "transportuser", "email": "transportuser@example.com", "password": "password123"
    })
    resp = client.post("/auth/login", json={"username": "transportuser", "password": "password123"})
    return resp.json()["token"]


def test_get_transport_options_requires_auth(client):
    resp = client.get("/transport/options", params={
        "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026"
    })
    assert resp.status_code == 401


@patch.object(settings, "AVIATIONSTACK_API_KEY", "dummy_aviation_key")
@patch("services.transport_service.requests.get")
def test_get_transport_options_success(mock_get, client, auth_token):
    mock_get.return_value = MockResponse(MOCK_FLIGHT_DATA)
    resp = client.get(
        "/transport/options",
        headers={"Authorization": f"Bearer {auth_token}"},
        params={
            "source": "Hyderabad", "destination": "Goa", "travel_date": "20-07-2026"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "available_options" in data
    assert "recommended_mode" in data
    assert "recommended_cost" in data
    assert len(data["available_options"]) >= 3


@patch.object(settings, "GROQ_API_KEY", "")
@patch.object(settings, "OPENAI_API_KEY", "")
@patch.object(settings, "ANTHROPIC_API_KEY", "")
def test_resolve_iata():
    from services.transport_service import _resolve_iata
    assert _resolve_iata("Indore") == "IDR"
    assert _resolve_iata("Paris, IDF, France") == "CDG"
    assert _resolve_iata("DEL") == "DEL"
    assert _resolve_iata("London") == "LHR"
    assert _resolve_iata("SomeUnknownRandomPlace") is None



def test_mock_transport_options_intl_vs_domestic():
    from services.transport_service import _get_mock_transport_options
    domestic = _get_mock_transport_options("Indore", "Goa")
    intl = _get_mock_transport_options("Indore", "Paris")
    intl_price = _get_mock_transport_options("mumbai", "price")
    
    assert len(domestic) > 0
    assert len(intl) > 0
    assert len(intl_price) > 0
    
    # Check that domestic costs are cheaper
    assert domestic[0]["cost"] < 15000
    # Check that international costs are higher
    assert intl[0]["cost"] > 30000
    assert intl_price[0]["cost"] > 30000
    
    # Check providers/duration
    assert any("IndiGo" in d["provider"] for d in domestic)
    assert any("Air France" in i["provider"] for i in intl)
    assert "Stop" in intl[0]["duration"]


def test_is_cargo_airline():
    from services.transport_service import _is_cargo_airline
    # Positive cases
    assert _is_cargo_airline("FedEx") is True
    assert _is_cargo_airline("FedEx Express") is True
    assert _is_cargo_airline("DHL Aviation") is True
    assert _is_cargo_airline("UPS Airlines") is True
    assert _is_cargo_airline("UPS") is True
    assert _is_cargo_airline("Emirates SkyCargo") is True
    assert _is_cargo_airline("Cathay Pacific Cargo") is True
    assert _is_cargo_airline("Cargolux Airlines") is True
    # Negative cases
    assert _is_cargo_airline("Air India") is False
    assert _is_cargo_airline("Emirates") is False
    assert _is_cargo_airline("Qatar Airways") is False
    assert _is_cargo_airline("Groups Charter") is False  # check UPS boundary handling
    assert _is_cargo_airline("Unknown Airline") is False


