"""
Prompt templates used by the recommendation_agent / llm_service.
Keeping prompts in one file makes them easy to tune without touching logic.
"""

RECOMMENDATION_PROMPT = """You are a travel expert assistant.

Trip details:
- Source: {source}
- Destination: {destination}
- Travel date: {travel_date}
- Duration: {days} days
- Budget: INR {budget}
- Preferences: {preferences}
- Weather summary: {weather_summary}
- Recommended transport: {transport_mode} (INR {transport_cost})
- Recommended hotel: {hotel_name} (INR {hotel_price}/night)

Generate exactly 5 short, practical, numbered travel recommendations
(money-saving tips, packing tips, timing tips, local food tips, safety tips)
specific to this trip. Keep each tip under 15 words. Return ONLY the 5 tips,
one per line, no extra commentary.
"""

