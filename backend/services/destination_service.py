import requests
import json
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)


def _get_mock_destination_info(destination: str) -> dict:
    formatted_name = destination.title()
    is_cold_region = any(reg in formatted_name for reg in ["Europe", "America", "Canada", "UK", "London", "Paris"])
    avg_temp = 15 if is_cold_region else 28
    
    return {
        "display_name": formatted_name,
        "attractions": [
            f"{formatted_name} City Center",
            f"{formatted_name} Historical Palace",
            f"{formatted_name} National Museum",
            f"{formatted_name} Botanical Garden",
            f"{formatted_name} Local Market"
        ],
        "adventure_activities": ["Walking Tour", "Sightseeing Exploration", "Local Food Tasting", "Hiking Experience", "Biking Tour"],
        "culture_spots": [f"{formatted_name} Heritage Center", f"{formatted_name} Art Gallery"],
        "wildlife_spots": [f"{formatted_name} Nature Park", f"{formatted_name} Wildlife Sanctuary"],
        "food_spots": [f"{formatted_name} Traditional Restaurant", f"{formatted_name} Street Food Alley"],
        "best_time": "Year-round",
        "avg_temp_c": avg_temp,
        "theme": "Sightseeing",
    }


def _get_llm_destination_info(destination: str) -> dict | None:
    if not (settings.GROQ_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY):
        return None
        
    prompt = (
        f"Generate realistic travel guide details for the destination '{destination}'.\n"
        f"Provide the response as a single, valid JSON object with the following exact keys:\n"
        f"- 'display_name': formatted destination name (e.g. 'Chennai, Tamil Nadu, India' or 'Paris, France')\n"
        f"- 'attractions': list of the top 5 most famous tourist attractions/places to visit (e.g. Marina Beach, Kapaleeswarar Temple)\n"
        f"- 'adventure_activities': list of 5 popular activities or tours in the area (e.g. Walking Tour, Surfing)\n"
        f"- 'culture_spots': list of 5 famous museums, temples, or historical spots\n"
        f"- 'wildlife_spots': list of 5 famous parks, zoos, gardens, or natural spots\n"
        f"- 'food_spots': list of 5 famous local restaurants, cafes, or street food hubs\n"
        f"- 'best_time': description of the best time to visit (e.g. 'November to February')\n"
        f"- 'avg_temp_c': average temperature in Celsius as an integer (e.g. 28)\n"
        f"- 'theme': travel theme classification, choose one from: Sightseeing, Beach, Adventure, Culture, Wildlife, Hill Station, History\n\n"
        f"Provide ONLY raw JSON. Do not wrap in markdown or backticks."
    )
    
    try:
        text = None
        if settings.GROQ_API_KEY:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1000,
                    "temperature": 0.2
                },
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
        elif settings.OPENAI_API_KEY:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1000,
                    "temperature": 0.2
                },
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
        elif settings.ANTHROPIC_API_KEY:
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.ANTHROPIC_MODEL,
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                },
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"].strip()
            
        if text:
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1])
            return json.loads(text)
    except Exception as e:
        logger.warning(f"Failed to generate realistic mock destination info via LLM for '{destination}': {e}")
        
    return None


def _get_destination_info_raw(destination: str) -> dict:
    """Returns structured info for a destination, querying Geoapify Geocoding and
    Places API. Falls back to realistic mock data if API key is missing or requests fail."""
    
    # 1. Try querying LLM for real-time famous attractions and guide info
    llm_info = _get_llm_destination_info(destination)
    if llm_info:
        return llm_info
        
    # 2. Fallback to Geoapify
    if not settings.GEOAPIFY_API_KEY:
        logger.warning(f"Geoapify API key is not configured. Falling back to mock data for '{destination}'.")
        return _get_mock_destination_info(destination)

    try:
        # Step 1: Geocoding
        geocode_url = "https://api.geoapify.com/v1/geocode/search"
        geocode_params = {"text": destination, "apiKey": settings.GEOAPIFY_API_KEY}
        
        geo_resp = requests.get(geocode_url, params=geocode_params, timeout=5)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
    except Exception as e:
        logger.warning(f"Geoapify Geocoding API request failed: {e}. Falling back to mock data.")
        return _get_mock_destination_info(destination)
        
    if not geo_data.get("features"):
        logger.warning(f"Destination '{destination}' could not be geocoded by Geoapify. Falling back to mock data.")
        return _get_mock_destination_info(destination)

    properties = geo_data["features"][0].get("properties", {})
    lat = properties.get("lat")
    lon = properties.get("lon")
    formatted_name = properties.get("formatted", destination.title())
    
    # Step 2: Places queries (15km radius)
    places_url = "https://api.geoapify.com/v2/places"
    
    # Query 1: Attractions and Culture Sights
    attraction_cats = "tourism.attraction,tourism.sights,entertainment.culture"
    attraction_params = {
        "categories": attraction_cats,
        "filter": f"circle:{lon},{lat},15000",
        "limit": 30,
        "apiKey": settings.GEOAPIFY_API_KEY
    }
    
    # Query 2: Dining, Parks, and Activities
    other_cats = "natural,catering.restaurant,catering.cafe,leisure.park,sport"
    other_params = {
        "categories": other_cats,
        "filter": f"circle:{lon},{lat},15000",
        "limit": 30,
        "apiKey": settings.GEOAPIFY_API_KEY
    }
    
    features = []
    
    try:
        resp1 = requests.get(places_url, params=attraction_params, timeout=5)
        resp1.raise_for_status()
        features.extend(resp1.json().get("features", []))
    except Exception as e:
        logger.warning(f"Geoapify Places API (Attractions) request failed: {e}")
        
    try:
        resp2 = requests.get(places_url, params=other_params, timeout=5)
        resp2.raise_for_status()
        features.extend(resp2.json().get("features", []))
    except Exception as e:
        logger.warning(f"Geoapify Places API (Other Categories) request failed: {e}")
        
    if not features:
        logger.warning("No features returned from either Geoapify Places API request. Falling back to mock data.")
        return _get_mock_destination_info(destination)
        
    attractions = []
    culture_spots = []
    wildlife_spots = []
    food_spots = []
    adventure_activities = []
    
    for feature in features:
        props = feature.get("properties", {})
        name = props.get("name")
        if not name:
            continue
        
        cats = props.get("categories", [])
        if any(c in cats for c in ["tourism.attraction", "tourism.sights"]):
            if name not in attractions:
                attractions.append(name)
        elif any(c in cats for c in ["entertainment.culture"]):
            if name not in culture_spots:
                culture_spots.append(name)
        elif any(c in cats for c in ["natural", "leisure.park"]):
            if name not in wildlife_spots:
                wildlife_spots.append(name)
        elif any(c in cats for c in ["catering.restaurant", "catering.cafe"]):
            if name not in food_spots:
                food_spots.append(name)
        elif any(c == "sport" or c.startswith("sport.") for c in cats):
            if name not in adventure_activities:
                adventure_activities.append(name)
                
    # Fallback default arrays derived from location to guarantee completeness if specific categories are blank in API results
    if not attractions:
        attractions = [f"{destination.title()} City Center", f"{destination.title()} Main Square"]
    if not culture_spots:
        culture_spots = [f"{destination.title()} Museum"]
    if not wildlife_spots:
        wildlife_spots = [f"{destination.title()} Park"]
    if not food_spots:
        food_spots = [f"{destination.title()} Local Restaurant"]
    if not adventure_activities:
        adventure_activities = ["Walking Tour", "Sightseeing Exploration", "Local Food Tasting"]
    
    # Dynamic temp logic based on location (cold if in Europe/North America, warm otherwise)
    is_cold_region = any(reg in formatted_name for reg in ["Europe", "America", "Canada", "UK", "London", "Paris"])
    avg_temp = 15 if is_cold_region else 28
    
    return {
        "display_name": formatted_name,
        "attractions": attractions[:5],
        "adventure_activities": adventure_activities[:5],
        "culture_spots": culture_spots[:5],
        "wildlife_spots": wildlife_spots[:5],
        "food_spots": food_spots[:5],
        "best_time": "Year-round",
        "avg_temp_c": avg_temp,
        "theme": "Sightseeing",
    }


def fetch_wikipedia_image(name: str, destination: str = "") -> str | None:
    try:
        query = f"{name} {destination}".strip()
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "srlimit": 1
        }
        headers = {
            "User-Agent": "VoyageAITravelPlanner/1.0 (contact: spoor@example.com)"
        }
        res = requests.get(search_url, params=search_params, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            search_results = data.get("query", {}).get("search", [])
            if search_results:
                best_title = search_results[0]["title"]
                
                image_params = {
                    "action": "query",
                    "titles": best_title,
                    "prop": "pageimages",
                    "format": "json",
                    "pithumbsize": 600
                }
                res_img = requests.get(search_url, params=image_params, headers=headers, timeout=5)
                if res_img.status_code == 200:
                    img_data = res_img.json()
                    pages = img_data.get("query", {}).get("pages", {})
                    for page_id, page_info in pages.items():
                        thumbnail = page_info.get("thumbnail", {})
                        source = thumbnail.get("source")
                        if source:
                            return source
    except Exception as e:
        logger.error(f"Error fetching Wikipedia image for {name}: {e}")
    return None


def get_unsplash_image_for_attraction(name: str, theme: str, destination_name: str = "") -> str:
    # Try fetching real image from Wikipedia first
    wiki_img = fetch_wikipedia_image(name, destination_name)
    if wiki_img:
        return wiki_img

    name_lower = name.lower()
    if any(k in name_lower for k in ["beach", "sea", "ocean", "coast", "sand", "palolem", "baga", "calangute", "anjuna", "colva", "morjim", "vagator", "miramar", "sinquerim"]):
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["temple", "church", "cathedral", "mosque", "shrine", "basilica", "heritage", "ruins", "hampi", "bom jesus", "mangueshi"]):
        return "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["fort", "castle", "palace", "museum", "gallery", "monument", "aguada", "chapora", "reis magos"]):
        return "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["waterfall", "falls", "river", "lake", "forest", "nature", "wildlife", "dudhsagar", "backwaters"]):
        return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["market", "street", "bazaar", "shop", "mall", "flea", "panaji"]):
        return "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["restaurant", "food", "cafe", "bistro", "dining", "pub", "bar"]):
        return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&h=400&q=80"
    if "tokyo" in name_lower or "shibuya" in name_lower or "sensoji" in name_lower or "kyoto" in name_lower:
        return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&h=400&q=80"
    if "paris" in name_lower or "eiffel" in name_lower or "louvre" in name_lower:
        return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&h=400&q=80"
    if "london" in name_lower or "bridge" in name_lower or "big ben" in name_lower:
        return "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&h=400&q=80"
    if "new york" in name_lower or "manhattan" in name_lower or "broadway" in name_lower or "times square" in name_lower:
        return "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&h=400&q=80"
    if any(k in name_lower for k in ["mountain", "hill", "peak", "climb", "trek", "valley"]):
        return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=400&q=80"

    theme_lower = theme.lower()
    if "beach" in theme_lower:
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=400&q=80"
    if "culture" in theme_lower or "history" in theme_lower:
        return "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&h=400&q=80"
    if "nature" in theme_lower or "wildlife" in theme_lower or "hill" in theme_lower:
        return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=400&q=80"
    if "adventure" in theme_lower:
        return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&h=400&q=80"
    return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&h=400&q=80"


def _enrich_attraction(name: str | dict, destination_name: str, theme: str) -> dict:
    if isinstance(name, dict):
        name_str = name.get("name", "Local Spot")
        rating = name.get("rating", 4.5)
        location = name.get("location", destination_name)
        image_url = name.get("image_url")
        if not image_url or "photo-1469854523086-cc02fe5d8800" in image_url:
            image_url = get_unsplash_image_for_attraction(name_str, theme, destination_name)
        return {
            "name": name_str,
            "location": location,
            "rating": rating,
            "image_url": image_url
        }

    name_str = str(name).strip()
    h = 0
    for char in name_str:
        h = 31 * h + ord(char)
    rating = round(4.2 + (abs(h) % 9) * 0.1, 1)
    if rating > 5.0:
        rating = 5.0

    dest_clean = destination_name.split(",")[0].strip()
    location = dest_clean
    name_lower = name_str.lower()
    if "beach" in name_lower:
        if "palolem" in name_lower:
            location = f"South Goa, {dest_clean}"
        elif "baga" in name_lower or "calangute" in name_lower or "anjuna" in name_lower:
            location = f"North Goa, {dest_clean}"
        else:
            location = f"Coastal Area, {dest_clean}"
    elif "waterfall" in name_lower or "falls" in name_lower:
        location = f"Nature Reserve, {dest_clean}"
    elif "fort" in name_lower or "castle" in name_lower:
        location = f"Heritage Site, {dest_clean}"

    image_url = get_unsplash_image_for_attraction(name_str, theme, destination_name)
    return {
        "name": name_str,
        "location": location,
        "rating": rating,
        "image_url": image_url
    }


def get_destination_info(destination: str) -> dict:
    """Returns structured info for a destination, querying Geoapify Geocoding and
    Places API. Falls back to realistic mock data if API key is missing or requests fail."""
    info = _get_destination_info_raw(destination)
    theme = info.get("theme", "Sightseeing")
    display_name = info.get("display_name", destination.title())
    
    # Enrich attractions list
    info["attractions"] = [
        _enrich_attraction(hl, display_name, theme)
        for hl in info.get("attractions", [])[:5]
    ]
    return info

