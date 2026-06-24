"""
Transport service: Calls Aviation Stack API to get real-time flight schedules.
Only returns and recommends flights (excludes ground transport).
"""
import requests
from datetime import datetime
from zoneinfo import ZoneInfo
import random
import json

from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Mapping of common city/destination names to primary airport IATA codes
CITY_TO_IATA = {
    # India Cities
    "delhi": "DEL",
    "mumbai": "BOM",
    "goa": "GOI",
    "jaipur": "JAI",
    "kerala": "COK",
    "kochi": "COK",
    "cochin": "COK",
    "manali": "KUU",
    "rishikesh": "DED",
    "dehradun": "DED",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA",
    "kolkata": "CCU",
    "pune": "PNQ",
    "ahmedabad": "AMD",
    "srinagar": "SXR",
    "leh": "IXL",
    "amritsar": "ATQ",
    "indore": "IDR",
    "pondicherry": "PNY",
    # International Hubs / Cities
    "paris": "CDG",
    "london": "LHR",
    "new york": "JFK",
    "tokyo": "NRT",
    "singapore": "SIN",
    "dubai": "DXB",
    "rome": "FCO",
    "bangkok": "BKK",
    "sydney": "SYD",
    "toronto": "YYZ",
    "berlin": "BER",
    "madrid": "MAD",
    "barcelona": "BCN",
    "amsterdam": "AMS",
    "frankfurt": "FRA",
    "munich": "MUC",
    "zurich": "ZRH",
    "san francisco": "SFO",
    "los angeles": "LAX",
    "chicago": "ORD",
    "boston": "BOS",
    "seattle": "SEA",
    "dublin": "DUB",
    "vienna": "VIE",
    "geneva": "GVA",
    "copenhagen": "CPH",
    "oslo": "OSL",
    "stockholm": "ARN",
    "helsinki": "HEL",
    "brussels": "BRU",
    "milan": "MXP",
    "venice": "VCE",
    "florence": "FLR",
    "naples": "NAP",
    "athens": "ATH",
    "lisbon": "LIS",
    "istanbul": "IST",
    "cairo": "CAI",
    "johannesburg": "JNB",
    "cape town": "CPT",
    "nairobi": "NBO",
    "tel aviv": "TLV",
    "doha": "DOH",
    "abu dhabi": "AUH",
    "riyadh": "RUH",
    "jeddah": "JED",
    "colombo": "CMB",
    "male": "MLE",
    "kathmandu": "KTM",
    "dhaka": "DAC",
    "kuala lumpur": "KUL",
    "jakarta": "CGK",
    "manila": "MNL",
    "ho chi minh": "SGN",
    "hanoi": "HAN",
    "hong kong": "HKG",
    "taipei": "TPE",
    "seoul": "ICN",
    "beijing": "PEK",
    "shanghai": "PVG",
    "melbourne": "MEL",
    "auckland": "AKL",
    "vancouver": "YVR",
    "montreal": "YUL",
    "mexico city": "MEX",
    "sao paulo": "GRU",
    "rio de janeiro": "GIG",
    "buenos aires": "EZE",
    "santiago": "SCL",
    "lima": "LIM",
    "bogota": "BOG",
}


INDIAN_IATA_CODES = {
    "DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "COK", "AMD", "PNQ", "GOI", "GOX", 
    "JAI", "LKO", "TRV", "GAU", "IXC", "SXR", "BBI", "IXR", "PAT", "IXB", "IMF", 
    "IXZ", "VNS", "VTZ", "ATQ", "CJB", "TRZ", "JDH", "IXE", "NAG", "IXJ", "DED", 
    "KUU", "IXL", "IDR", "BHO", "JLR", "RAJ", "BDQ", "STV", "UDR", "GAY", "IXD", 
    "VGA", "TPT", "RJA", "IXA", "DMU", "SHL", "TEZ", "JRH", "DIB", "IXS", "AJL",
    "AGR", "IXU", "IXM", "CCJ", "RPR", "PNY"
}


def _distance_factor(source: str, destination: str) -> float:
    """Deterministic-ish multiplier so the same route always returns similar
    costs/durations, without needing a real distance API."""
    seed = sum(ord(c) for c in (source + destination).lower())
    return 0.8 + (seed % 50) / 100  # roughly 0.8 - 1.3


def _resolve_iata(city_name: str) -> str | None:
    if not city_name:
        return None
    city_clean = city_name.strip().lower()
    
    # 1. Check in CITY_TO_IATA
    for key, code in CITY_TO_IATA.items():
        if key in city_clean:
            return code
            
    # 2. Check if it's already a 3-letter IATA code
    if len(city_clean) == 3 and city_clean.isalpha():
        return city_clean.upper()
            
    # 3. Dynamic lookup via LLM
    if settings.GROQ_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY:
        prompt = (
            f"You are an assistant that resolves city or location names to their primary airport's 3-letter IATA code.\n"
            f"Return ONLY the 3-letter IATA code in uppercase. Do not include any other text, explanation, or punctuation.\n\n"
            f"Location: {city_name}\n"
            f"IATA Code:"
        )
        try:
            if settings.GROQ_API_KEY:
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 5,
                        "temperature": 0.0
                    },
                    timeout=5,
                )
                resp.raise_for_status()
                text = resp.json()["choices"][0]["message"]["content"].strip()
                code = "".join(c for c in text if c.isalnum()).upper()[:3]
                if len(code) == 3:
                    logger.info(f"LLM resolved IATA for '{city_name}' -> '{code}'")
                    return code
            elif settings.OPENAI_API_KEY:
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 5,
                        "temperature": 0.0
                    },
                    timeout=5,
                )
                resp.raise_for_status()
                text = resp.json()["choices"][0]["message"]["content"].strip()
                code = "".join(c for c in text if c.isalnum()).upper()[:3]
                if len(code) == 3:
                    logger.info(f"LLM resolved IATA for '{city_name}' -> '{code}'")
                    return code
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
                        "max_tokens": 5,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.0
                    },
                    timeout=5,
                )
                resp.raise_for_status()
                text = resp.json()["content"][0]["text"].strip()
                code = "".join(c for c in text if c.isalnum()).upper()[:3]
                if len(code) == 3:
                    logger.info(f"LLM resolved IATA for '{city_name}' -> '{code}'")
                    return code
        except Exception as e:
            logger.warning(f"Error resolving IATA via LLM for '{city_name}': {e}")
            
    return None


def _get_llm_mock_flights(source: str, destination: str, travel_date: str) -> list[dict] | None:
    if not (settings.GROQ_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY):
        return None
        
    prompt = (
        f"Generate 4 realistic flight options for a trip from '{source}' to '{destination}' on '{travel_date}'.\n"
        f"Since there may not be direct flights, include connecting flights if appropriate.\n"
        f"Ensure flight durations, airlines, and costs (in INR) are realistic for this route.\n"
        f"For example, international flights from India to Europe should cost around ₹50,000 to ₹120,000 and take 10-18 hours.\n"
        f"Provide the output as a valid JSON list of objects. Do not include any markdown formatting, backticks, or explanation. "
        f"Each object must have these exact keys:\n"
        f"- 'mode': always 'Flight'\n"
        f"- 'provider': airline name (e.g. 'Air France', 'Emirates', 'Air India', or connecting like 'IndiGo + Air France')\n"
        f"- 'departure_time': departure time in HH:MM format (24h)\n"
        f"- 'duration': flight duration string (e.g. '12.5 Hours' or '14 Hours (1 Stop)')\n"
        f"- 'cost': cost in INR as an integer (e.g. 75000)\n\n"
        f"Output JSON:"
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
        logger.warning(f"Failed to generate realistic mock flights via LLM for '{source}' -> '{destination}': {e}")
        
    return None


def _is_international(source: str, destination: str, dep_code: str | None = None, arr_code: str | None = None) -> bool:
    if dep_code and arr_code:
        return (dep_code not in INDIAN_IATA_CODES) or (arr_code not in INDIAN_IATA_CODES)

    src_lower = source.lower()
    dst_lower = destination.lower()
    
    # List of keywords representing locations outside India to differentiate domestic vs international
    intl_keywords = ["paris", "london", "york", "tokyo", "singapore", "dubai", "rome", "bangkok", 
                     "sydney", "toronto", "berlin", "madrid", "barcelona", "amsterdam", "frankfurt", 
                     "munich", "zurich", "san francisco", "los angeles", "chicago", "boston", 
                     "seattle", "dublin", "vienna", "geneva", "copenhagen", "oslo", "stockholm", 
                     "helsinki", "brussels", "milan", "venice", "florence", "naples", "athens", 
                     "lisbon", "istanbul", "cairo", "johannesburg", "cape town", "nairobi", 
                     "tel aviv", "doha", "abu dhabi", "riyadh", "jeddah", "colombo", "male", 
                     "kathmandu", "dhaka", "kuala lumpur", "jakarta", "manila", "ho chi minh", 
                     "hanoi", "hong kong", "taipei", "seoul", "beijing", "shanghai", "melbourne", 
                     "auckland", "vancouver", "montreal", "mexico", "brazil", "argentina", "france", 
                     "germany", "italy", "spain", "uk", "usa", "canada", "australia", "japan", "china",
                     "price"]
                     
    return any(kw in src_lower or kw in dst_lower for kw in intl_keywords)


def _is_cargo_airline(airline_name: str) -> bool:
    if not airline_name:
        return False
    name_lower = airline_name.lower()
    cargo_keywords = [
        "cargo", "fedex", "dhl", "freight", "logistics", 
        "cargolux", "amazon air", "prime air", "atlas air", 
        "kalitta", "polar air", "martinair", "courier"
    ]
    if any(kw in name_lower for kw in cargo_keywords):
        return True
    
    # Check for UPS specifically to avoid partial matching on words like "groups"
    import re
    if re.search(r'\bups\b', name_lower):
        return True
        
    return False


def _get_mock_transport_options(source: str, destination: str) -> list[dict]:
    dep_code = _resolve_iata(source)
    arr_code = _resolve_iata(destination)
    is_intl = _is_international(source, destination, dep_code, arr_code)
    factor = _distance_factor(source, destination)
    
    if is_intl:
        # International Flight Options
        mock_airlines = ["Air India + Air France", "Emirates", "Qatar Airways", "Lufthansa", "British Airways"]
        flight_options = []
        base_cost = 55000 * factor
        
        for idx, airline_name in enumerate(mock_airlines[:4]):
            dep_hours = [8, 12, 16, 21][idx]
            dep_time = f"{dep_hours:02d}:30"
            duration_hours = round(max(8.0, 12.0 * factor), 1)
            duration_str = f"{duration_hours} Hours (1 Stop)"
            cost = round(base_cost + (idx * 5000) - 2000, -1)
            
            flight_options.append({
                "mode": "Flight",
                "provider": airline_name,
                "departure_time": dep_time,
                "duration": duration_str,
                "cost": cost,
            })
    else:
        # Domestic Flight Options
        mock_airlines = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air"]
        flight_options = []
        base_cost = 4500 * factor
        
        for idx, airline_name in enumerate(mock_airlines[:4]):
            dep_hours = [6, 12, 17, 21][idx]
            dep_time = f"{dep_hours:02d}:00"
            duration_hours = round(max(1.0, 1.2 * factor), 1)
            duration_str = f"{duration_hours} Hours"
            cost = round(base_cost + (idx * 300) - 200, -1)
            
            flight_options.append({
                "mode": "Flight",
                "provider": airline_name,
                "departure_time": dep_time,
                "duration": duration_str,
                "cost": cost,
            })
            
    return sorted(flight_options, key=lambda o: o["cost"])


def get_all_transport_options(source: str, destination: str, travel_date: str) -> list[dict]:
    """Returns flight options for the day from Aviation Stack API. Falls back to mock data if API key is missing or request fails."""
    
    # 1. Resolve IATA codes
    dep_code = _resolve_iata(source)
    arr_code = _resolve_iata(destination)
    
    # 2. Check Aviation Stack API if IATA codes are resolved
    if settings.AVIATIONSTACK_API_KEY and dep_code and arr_code:
        url = "http://api.aviationstack.com/v1/flights"
        params = {
            "access_key": settings.AVIATIONSTACK_API_KEY,
            "dep_iata": dep_code,
            "arr_iata": arr_code,
            "limit": 20
        }

        try:
            resp = requests.get(url, params=params, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            
            if "error" not in data:
                flights = data.get("data", [])
                if flights:
                    flight_options = []
                    factor = _distance_factor(source, destination)
                    is_intl = _is_international(source, destination, dep_code, arr_code)
                    base_cost = 55000 * factor if is_intl else 4500 * factor

                    seen_flights = set()

                    for idx, flight in enumerate(flights):
                        airline_name = flight.get("airline", {}).get("name") or "Unknown Airline"
                        if _is_cargo_airline(airline_name):
                            continue
                        dep_sched = flight.get("departure", {}).get("scheduled")
                        arr_sched = flight.get("arrival", {}).get("scheduled")
                        dep_tz_name = flight.get("departure", {}).get("timezone")
                        arr_tz_name = flight.get("arrival", {}).get("timezone")

                        # Parse scheduled departure time
                        dep_time = "12:00"
                        if dep_sched:
                            try:
                                dt = datetime.fromisoformat(dep_sched.replace("Z", "+00:00"))
                                dep_time = dt.strftime("%H:%M")
                            except Exception:
                                if "T" in dep_sched:
                                    dep_time = dep_sched.split("T")[1][:5]

                        # Deduplicate codeshared duplicate flight options
                        codeshared = flight.get("flight", {}).get("codeshared") or {}
                        op_flight = codeshared.get("flight_iata") or codeshared.get("flight_number")
                        if not op_flight:
                            op_flight = flight.get("flight", {}).get("iata") or flight.get("flight", {}).get("number")
                        
                        if op_flight:
                            op_flight_str = str(op_flight).strip().lower()
                            dup_key = (dep_time, op_flight_str)
                            if dup_key in seen_flights:
                                continue
                            seen_flights.add(dup_key)

                        # Calculate flight duration from departure/arrival times, taking timezones into account
                        duration_str = f"{round(1.2 * factor, 1)} Hours"
                        if dep_sched and arr_sched:
                            try:
                                dep_clean = dep_sched.split("+")[0].split("Z")[0]
                                arr_clean = arr_sched.split("+")[0].split("Z")[0]
                                dt_dep = datetime.fromisoformat(dep_clean)
                                dt_arr = datetime.fromisoformat(arr_clean)
                                
                                if dep_tz_name and arr_tz_name:
                                    dt_dep = dt_dep.replace(tzinfo=ZoneInfo(dep_tz_name))
                                    dt_arr = dt_arr.replace(tzinfo=ZoneInfo(arr_tz_name))
                                    
                                diff = dt_arr - dt_dep
                                hours = round(diff.total_seconds() / 3600, 1)
                                if hours > 0:
                                    duration_str = f"{hours} Hours"
                            except Exception as e:
                                logger.warning(f"Error calculating duration for flight {op_flight}: {e}")

                        # Free tier API doesn't provide pricing, so we generate a dynamic price based on distance
                        cost = round(base_cost + random.uniform(-600, 900) + idx * 150, -1)

                        flight_options.append({
                            "mode": "Flight",
                            "provider": airline_name,
                            "departure_time": dep_time,
                            "duration": duration_str,
                            "cost": cost,
                        })
                    return sorted(flight_options, key=lambda o: o["cost"])
                else:
                    logger.info(f"No direct flights found between {dep_code} and {arr_code}. Querying fallbacks.")
        except Exception as e:
            logger.warning(f"Aviation Stack API request failed: {e}. Falling back to mock/realistic flight data.")

    # 3. Fallback path: Try generating realistic flights via LLM
    llm_flights = _get_llm_mock_flights(source, destination, travel_date)
    if llm_flights:
        llm_flights = [f for f in llm_flights if not _is_cargo_airline(f.get("provider"))]
        if llm_flights:
            return sorted(llm_flights, key=lambda o: o["cost"])
        
    # 4. Final safety net: Procedural mock flight generator
    logger.warning(f"Falling back to procedural mock data for '{source}' -> '{destination}'.")
    return _get_mock_transport_options(source, destination)


def recommend_cheapest(options: list[dict]) -> dict:
    if not options:
        raise ValueError("No options available to recommend.")
    cheapest = min(options, key=lambda o: o["cost"])
    most_expensive = max(options, key=lambda o: o["cost"])
    savings = round(most_expensive["cost"] - cheapest["cost"], 2)
    return {
        "recommended_mode": cheapest["mode"],
        "recommended_cost": cheapest["cost"],
        "reason": (
            f"Cheapest flight option overall. Saves ~INR {savings:.0f} compared to the priciest flight, "
            f"leaving more budget for hotel and activities."
        ),
    }

