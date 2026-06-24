"""
Builds a day-by-day itinerary by distributing the destination's attractions
and activities across the trip length, weighted by the user's preferences.
"""
import random


def _pick(pool: list[str], n: int) -> list[str]:
    if not pool:
        return ["Free time / leisure"]
    return random.sample(pool, k=min(n, len(pool)))


def build_itinerary(destination_info: dict, days: int, preferences: list[str]) -> list[dict]:
    attractions = [a["name"] if isinstance(a, dict) else a for a in destination_info.get("attractions", [])]
    adventure = list(destination_info.get("adventure_activities", []))
    culture = list(destination_info.get("culture_spots", []))
    wildlife = list(destination_info.get("wildlife_spots", []))
    food = list(destination_info.get("food_spots", []))

    prefs_lower = [p.lower() for p in preferences]
    pool = list(attractions)
    if "adventure" in prefs_lower:
        pool += adventure
    if "culture" in prefs_lower:
        pool += culture
    if "wildlife" in prefs_lower:
        pool += wildlife
    if "food" in prefs_lower:
        pool += food
    if not pool:
        pool = attractions

    random.shuffle(pool)
    itinerary = []
    spend_base = 1200

    for day in range(1, days + 1):
        if day == 1:
            morning, afternoon = "Arrival in " + destination_info["display_name"], "Check-in at hotel & rest"
            evening = pool.pop() if pool else "Local sightseeing"
            night = "Dinner + relax at hotel"
            spend = spend_base
        elif day == days:
            morning = pool.pop() if pool else "Last-minute sightseeing"
            afternoon = "Local shopping for souvenirs"
            evening = "Head to airport/station/bus stand"
            night = "Return journey"
            spend = spend_base * 0.7
        else:
            morning = pool.pop() if pool else "Explore local area"
            afternoon = pool.pop() if pool else "Adventure / leisure activity"
            evening = pool.pop() if pool else "Local market visit"
            night = "Local food tour" if food else "Dinner at hotel"
            spend = spend_base * random.uniform(1.4, 2.0)

        itinerary.append({
            "day": day,
            "morning": morning,
            "afternoon": afternoon,
            "evening": evening,
            "night": night,
            "estimated_spend": round(spend, -2) if spend >= 100 else spend,
        })

    return itinerary

