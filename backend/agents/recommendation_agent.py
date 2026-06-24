from services.llm_service import generate_recommendations
from utils.logger import get_logger

logger = get_logger(__name__)


class RecommendationAgent:
    """Generates final human-readable travel tips via LLM."""

    def run(self, context: dict) -> list[str]:
        try:
            return generate_recommendations(context)
        except Exception as e:
            logger.warning(f"Recommendation generation failed: {e}")
            return [
                f"AI recommendations could not be loaded: {e}. Please check that one of the LLM API keys (GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY) is configured correctly in settings."
            ]
