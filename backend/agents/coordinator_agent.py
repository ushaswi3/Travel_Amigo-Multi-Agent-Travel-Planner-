"""
Coordinator Agent: the brain of the system. Calls every specialized agent in
the right order, passes outputs between them (e.g. transport+hotel costs into
the budget agent), and assembles everything into one final response.

       User
        |
        v
    Trip API
        |
        v
  Coordinator Agent
        |
        +--> Destination Agent
        +--> Transport Agent
        +--> Hotel Agent
        +--> Weather Agent
        +--> Budget Agent (uses Transport + Hotel output)
        +--> Itinerary Agent
        +--> Recommendation Agent (uses everything else)
        |
        v
  Final Travel Plan
"""
from agents.destination_agent import DestinationAgent
from agents.transport_agent import TransportAgent
from agents.hotel_agent import HotelAgent
from agents.weather_agent import WeatherAgent
from agents.budget_agent import BudgetAgent
from agents.itinerary_agent import ItineraryAgent
from agents.recommendation_agent import RecommendationAgent
from utils.logger import get_logger

logger = get_logger(__name__)


class CoordinatorAgent:
    def __init__(self):
        self.destination_agent = DestinationAgent()
        self.transport_agent = TransportAgent()
        self.hotel_agent = HotelAgent()
        self.weather_agent = WeatherAgent()
        self.budget_agent = BudgetAgent()
        self.itinerary_agent = ItineraryAgent()
        self.recommendation_agent = RecommendationAgent()

    def run(self, trip_request) -> dict:
        source = trip_request.source
        destination = trip_request.destination
        travel_date = trip_request.travel_date
        days = trip_request.days
        budget = trip_request.budget
        preferences = trip_request.preferences
        additional_requirements = trip_request.additional_requirements or ""

        logger.info(f"Coordinator: planning {days}-day trip {source} -> {destination}")

        # Step 1: Destination context (feeds itinerary + weather baseline)
        destination_out = self.destination_agent.run(destination)

        # Step 2 & 3: Transport + Hotel (independent of each other)
        transport_out = self.transport_agent.run(source, destination, travel_date)
        hotel_out = self.hotel_agent.run(
            destination, days, budget, preferences, additional_requirements, max_results=5
        )

        # Step 4: Weather
        weather_out = self.weather_agent.run(
            destination, travel_date, days, avg_temp_c=destination_out["avg_temp_c"]
        )

        # Step 5: Itinerary (needs full destination info + preferences)
        itinerary_out = self.itinerary_agent.run(
            destination_out["_full_info"], days, preferences
        )

        # Step 6: Budget (needs transport + hotel + itinerary spend)
        top_hotel = hotel_out["top_choice"]
        hotel_cost = top_hotel["total_cost"] if top_hotel else 0
        budget_out = self.budget_agent.run(
            budget, transport_out["recommended_cost"], hotel_cost, itinerary_out
        )

        # Step 7: Recommendations (LLM, sees everything else)
        weather_summary = ", ".join(
            f"{d['day_label']}: {d['condition']} {d['temperature']}" for d in weather_out["forecast"]
        )
        rec_context = {
            "source": source,
            "destination": destination_out["destination"],
            "travel_date": travel_date,
            "days": days,
            "budget": budget,
            "preferences": preferences,
            "weather_summary": weather_summary,
            "recommended_mode": transport_out["recommended_mode"],
            "recommended_cost": transport_out["recommended_cost"],
            "hotel_name": top_hotel["name"] if top_hotel else "N/A",
            "hotel_price": top_hotel["cost_per_night"] if top_hotel else 0,
        }
        recommendations = self.recommendation_agent.run(rec_context)

        # Step 8: Final score + summary recommendation
        budget_used_pct = (budget_out["total_spent"] / budget) if budget else 1
        overall_score = round(min(10, max(1, 10 - (budget_used_pct - 0.7) * 10)), 1) if budget_used_pct <= 1 else round(max(1, 7 - (budget_used_pct - 1) * 10), 1)

        final_recommendation = {
            "transport": transport_out["recommended_mode"],
            "hotel": top_hotel["name"] if top_hotel else "N/A",
            "budget_used": budget_out["total_spent"],
            "budget_total": budget,
            "theme": destination_out["theme"],
            "overall_score": overall_score,
        }

        return {
            "destination": destination_out["destination"],
            "destination_highlights": destination_out["top_places"],
            "transport": {
                "available_options": transport_out["options"],
                "recommended_mode": transport_out["recommended_mode"],
                "recommended_cost": transport_out["recommended_cost"],
                "reason": transport_out["reason"],
                "source_code": transport_out.get("source_code"),
                "destination_code": transport_out.get("destination_code"),
            },
            "hotels": hotel_out["hotels"],
            "weather": weather_out,
            "itinerary": itinerary_out,
            "budget_analysis": budget_out,
            "ai_recommendations": recommendations,
            "final_recommendation": final_recommendation,
        }
