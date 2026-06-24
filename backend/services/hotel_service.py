"""
Hotel service: Integration point for Geoapify Places API to fetch real hotel data.
"""
import requests
from config.settings import settings


from utils.logger import get_logger

logger = get_logger(__name__)


def _get_mock_hotel_options(destination: str, days: int, budget: float, preferences: list[str],
                             additional_requirements: str = "", max_results: int = 5) -> list[dict]:
    nights = max(days - 1, 1)
    base_price = max(1200, min(6000, budget / max(nights, 1) * 0.45))
    
    mock_hotel_names = [
        f"Grand {destination.title()} Hotel",
        f"{destination.title()} Central Suites",
        f"Heritage Residency {destination.title()}",
        f"Comfort Inn {destination.title()}",
        f"Luxury Haven {destination.title()}"
    ]
    
    hotels = []
    FEATURE_POOL = ["Near Beach", "Free Breakfast", "Swimming Pool", "Free WiFi", "Family Rooms",
                    "Airport Pickup", "Rooftop Restaurant", "Spa", "Pet Friendly"]
                    
    near_beach_wanted = "beach" in (additional_requirements or "").lower() or "Beaches" in preferences
    family_friendly_wanted = "family" in (additional_requirements or "").lower()
    
    for i, name in enumerate(mock_hotel_names[:max_results]):
        seed = sum(ord(c) for c in name)
        rating = round(3.8 + (seed % 11) / 10, 1)  # 3.8 to 4.8
        price = round(base_price + (seed % 1000) - 500 + i * 150, -1)
        
        # Select features
        hotel_features = []
        temp_pool = list(FEATURE_POOL)
        for idx in range(4):
            feat_idx = (seed + idx) % len(temp_pool)
            hotel_features.append(temp_pool.pop(feat_idx))
            
        if near_beach_wanted and "Near Beach" not in hotel_features:
            hotel_features[0] = "Near Beach"
        if family_friendly_wanted and "Family Rooms" not in hotel_features:
            hotel_features[1] = "Family Rooms"
            
        hotels.append({
            "name": name,
            "rating": rating,
            "location": f"{name}, Near Center, {destination.title()}",
            "cost_per_night": price,
            "total_cost": round(price * nights, -1),
            "features": hotel_features,
        })
    return sorted(hotels, key=lambda h: h["total_cost"])


def get_hotel_options(destination: str, days: int, budget: float, preferences: list[str],
                       additional_requirements: str = "", max_results: int = 5) -> list[dict]:
    """Fetches hotels. Falls back to mock data if API key is missing or request fails."""
    
    if not settings.GEOAPIFY_API_KEY:
        logger.warning(f"Geoapify API key is not configured. Falling back to mock hotels for '{destination}'.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
        
    # Step 1: Geocoding the destination to get lat/lon
    try:
        geocode_url = "https://api.geoapify.com/v1/geocode/search"
        geocode_params = {"text": destination, "apiKey": settings.GEOAPIFY_API_KEY}
        
        geo_resp = requests.get(geocode_url, params=geocode_params, timeout=5)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
    except Exception as e:
        logger.warning(f"Geoapify Geocoding API request failed during hotel search: {e}. Falling back to mock data.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
    
    if not geo_data.get("features"):
        logger.warning(f"Destination '{destination}' could not be geocoded for hotel search. Falling back to mock data.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
        
    properties = geo_data["features"][0].get("properties", {})
    lat = properties.get("lat")
    lon = properties.get("lon")
    
    # Step 2: Query places with category accommodation.hotel
    try:
        places_url = "https://api.geoapify.com/v2/places"
        places_params = {
            "categories": "accommodation.hotel",
            "filter": f"circle:{lon},{lat},20000",
            "limit": max_results * 3,
            "apiKey": settings.GEOAPIFY_API_KEY
        }
        
        places_resp = requests.get(places_url, params=places_params, timeout=5)
        places_resp.raise_for_status()
        places_data = places_resp.json()
    except Exception as e:
        logger.warning(f"Geoapify Places API request failed during hotel search: {e}. Falling back to mock data.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
    
    features = places_data.get("features", [])
    if not features:
        logger.warning(f"No hotels found in '{destination}' from Geoapify API. Falling back to mock data.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
        
    nights = max(days - 1, 1)
    base_price = max(1200, min(6000, budget / max(nights, 1) * 0.45))
    
    hotels = []
    FEATURE_POOL = ["Near Beach", "Free Breakfast", "Swimming Pool", "Free WiFi", "Family Rooms",
                    "Airport Pickup", "Rooftop Restaurant", "Spa", "Pet Friendly"]
                    
    near_beach_wanted = "beach" in (additional_requirements or "").lower() or "Beaches" in preferences
    family_friendly_wanted = "family" in (additional_requirements or "").lower()
    
    for i, feat in enumerate(features):
        props = feat.get("properties", {})
        name = props.get("name")
        if not name:
            continue
            
        location = props.get("formatted") or f"{destination.title()} - Near Center"
        
        # Deterministic rating and price based on hotel name to keep it consistent
        seed = sum(ord(c) for c in name)
        rating = round(3.8 + (seed % 11) / 10, 1)  # 3.8 to 4.8
        price = round(base_price + (seed % 1000) - 500 + i * 150, -1)
        
        # Select features
        hotel_features = []
        temp_pool = list(FEATURE_POOL)
        for idx in range(4):
            feat_idx = (seed + idx) % len(temp_pool)
            hotel_features.append(temp_pool.pop(feat_idx))
            
        if near_beach_wanted and "Near Beach" not in hotel_features:
            hotel_features[0] = "Near Beach"
        if family_friendly_wanted and "Family Rooms" not in hotel_features:
            hotel_features[1] = "Family Rooms"
            
        hotels.append({
            "name": name,
            "rating": rating,
            "location": location,
            "cost_per_night": price,
            "total_cost": round(price * nights, -1),
            "features": hotel_features,
        })
        
        if len(hotels) >= max_results:
            break
            
    if not hotels:
        logger.warning(f"No valid named hotels found in '{destination}' from Geoapify API. Falling back to mock data.")
        return _get_mock_hotel_options(destination, days, budget, preferences, additional_requirements, max_results)
        
    return sorted(hotels, key=lambda h: h["total_cost"])
