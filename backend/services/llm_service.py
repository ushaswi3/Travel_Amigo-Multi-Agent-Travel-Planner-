"""
Recommendation generation: uses a real LLM (Anthropic Claude or OpenAI).
"""
import requests

from config.settings import settings
from config.prompts import RECOMMENDATION_PROMPT
from utils.logger import get_logger

logger = get_logger(__name__)


def _call_anthropic(prompt: str) -> list[str] | None:
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.ANTHROPIC_MODEL,
                "max_tokens": 300,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=15,
        )
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"]
        return [line.strip("- ").strip() for line in text.strip().split("\n") if line.strip()]
    except Exception as e:
        logger.warning(f"Anthropic call failed: {e}")
        return None


def _call_openai(prompt: str) -> list[str] | None:
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={
                "model": settings.OPENAI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
            },
            timeout=15,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"]
        return [line.strip("- ").strip() for line in text.strip().split("\n") if line.strip()]
    except Exception as e:
        logger.warning(f"OpenAI call failed: {e}")
        return None


def _call_groq(prompt: str) -> list[str] | None:
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            json={
                "model": settings.GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
            },
            timeout=15,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"]
        return [line.strip("- ").strip() for line in text.strip().split("\n") if line.strip()]
    except Exception as e:
        logger.warning(f"Groq call failed: {e}")
        return None


def generate_recommendations(context: dict) -> list[str]:
    """
    context expects keys: source, destination, travel_date, days, budget,
    preferences (list), weather_summary, recommended_mode, recommended_cost,
    hotel_name, hotel_price
    """
    if not settings.ANTHROPIC_API_KEY and not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
        raise ValueError("Neither Anthropic, OpenAI, nor Groq API keys are configured in settings.")

    prompt = RECOMMENDATION_PROMPT.format(
        source=context["source"],
        destination=context["destination"],
        travel_date=context["travel_date"],
        days=context["days"],
        budget=context["budget"],
        preferences=", ".join(context.get("preferences", [])) or "General sightseeing",
        weather_summary=context.get("weather_summary", "N/A"),
        transport_mode=context["recommended_mode"],
        transport_cost=context["recommended_cost"],
        hotel_name=context["hotel_name"],
        hotel_price=context["hotel_price"],
    )

    if settings.GROQ_API_KEY:
        result = _call_groq(prompt)
        if result:
            return result[:5]

    if settings.ANTHROPIC_API_KEY:
        result = _call_anthropic(prompt)
        if result:
            return result[:5]

    if settings.OPENAI_API_KEY:
        result = _call_openai(prompt)
        if result:
            return result[:5]

    raise ValueError("Failed to generate recommendations from real LLM APIs.")
