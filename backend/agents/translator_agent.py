import json
import requests
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class TranslatorAgent:
    """Agent that translates text or entire trip plan structures using the configured LLM."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY
        self.provider = "groq" if settings.GROQ_API_KEY else ("openai" if settings.OPENAI_API_KEY else ("anthropic" if settings.ANTHROPIC_API_KEY else None))

    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("No LLM API key configured for translation.")

        try:
            if self.provider == "groq":
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1,
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"].strip()

            elif self.provider == "openai":
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_MODEL or "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1,
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"].strip()

            elif self.provider == "anthropic":
                resp = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": settings.ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022",
                        "max_tokens": 1000,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                        "temperature": 0.1,
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                return resp.json()["content"][0]["text"].strip()

        except Exception as e:
            logger.error(f"Translation LLM call failed: {e}")
            raise RuntimeError(f"Translation service failed: {e}")

    def translate_text(self, text: str, target_lang: str) -> str:
        """Translates basic text to the target language."""
        if not text.strip():
            return text

        system_prompt = (
            f"You are a professional multi-lingual translator agent. "
            f"Translate the user's input text into {target_lang}. "
            f"Only respond with the translated text. Do not add explanations, notes, or intros."
        )
        return self._call_llm(system_prompt, text)

    def translate_plan(self, plan_dict: dict, target_lang: str) -> dict:
        """Translates the text fields of a full travel plan JSON dictionary to target_lang."""
        system_prompt = (
            f"You are a translation assistant. Your task is to translate JSON value strings to {target_lang}. "
            f"Maintain all JSON keys exactly. Do not translate proper names of hotels, numeric costs, dates, or IDs. "
            f"Only translate descriptions, activity names, reasons, suggestions, and tips. "
            f"Respond ONLY with the raw translated JSON object. Do not wrap in markdown code blocks like ```json."
        )

        # Prepare a lightweight version of the plan containing only fields that need translation to save tokens & prevent errors
        translatable_data = {
            "destination": plan_dict.get("destination"),
            "destination_highlights": plan_dict.get("destination_highlights", []),
            "transport": {
                "reason": plan_dict.get("transport", {}).get("reason"),
                "recommended_mode": plan_dict.get("transport", {}).get("recommended_mode")
            },
            "itinerary": plan_dict.get("itinerary", []),
            "weather": {
                "suggestions": plan_dict.get("weather", {}).get("suggestions", []),
                "forecast": [
                    {"day_label": f.get("day_label"), "condition": f.get("condition")}
                    for f in plan_dict.get("weather", {}).get("forecast", [])
                ]
            },
            "budget_analysis": {
                "status": plan_dict.get("budget_analysis", {}).get("status")
            },
            "ai_recommendations": plan_dict.get("ai_recommendations", []),
            "final_recommendation": {
                "theme": plan_dict.get("final_recommendation", {}).get("theme")
            }
        }

        try:
            translated_json_str = self._call_llm(system_prompt, json.dumps(translatable_data, ensure_ascii=False))
            translated_data = json.loads(translated_json_str)
        except Exception as e:
            logger.error(f"Failed to translate trip plan JSON structure: {e}")
            # Fallback to returning original plan dict on error
            return plan_dict

        # Merge translated values back into the original plan dict to preserve structures
        merged_plan = plan_dict.copy()

        if "destination" in translated_data:
            merged_plan["destination"] = translated_data["destination"]

        if "destination_highlights" in translated_data:
            merged_highlights = []
            for i, hl in enumerate(plan_dict.get("destination_highlights", [])):
                if i < len(translated_data["destination_highlights"]):
                    trans_hl = translated_data["destination_highlights"][i]
                    if isinstance(hl, dict) and isinstance(trans_hl, dict):
                        hl_copy = hl.copy()
                        hl_copy["name"] = trans_hl.get("name", hl.get("name"))
                        hl_copy["location"] = trans_hl.get("location", hl.get("location"))
                        hl_copy["description"] = trans_hl.get("description", hl.get("description"))
                        merged_highlights.append(hl_copy)
                    else:
                        merged_highlights.append(trans_hl)
                else:
                    merged_highlights.append(hl)
            merged_plan["destination_highlights"] = merged_highlights

        if "transport" in translated_data:
            merged_plan["transport"] = plan_dict.get("transport", {}).copy()
            merged_plan["transport"]["reason"] = translated_data["transport"].get("reason", plan_dict.get("transport", {}).get("reason"))

        if "itinerary" in translated_data:
            merged_itinerary = []
            for i, day in enumerate(plan_dict.get("itinerary", [])):
                if i < len(translated_data["itinerary"]):
                    trans_day = translated_data["itinerary"][i]
                    day_copy = day.copy()
                    day_copy["morning"] = trans_day.get("morning", day.get("morning"))
                    day_copy["afternoon"] = trans_day.get("afternoon", day.get("afternoon"))
                    day_copy["evening"] = trans_day.get("evening", day.get("evening"))
                    day_copy["night"] = trans_day.get("night", day.get("night"))
                    merged_itinerary.append(day_copy)
                else:
                    merged_itinerary.append(day)
            merged_plan["itinerary"] = merged_itinerary

        if "weather" in translated_data:
            merged_plan["weather"] = plan_dict.get("weather", {}).copy()
            merged_plan["weather"]["suggestions"] = translated_data["weather"].get("suggestions", plan_dict.get("weather", {}).get("suggestions", []))
            
            merged_forecast = []
            for i, f in enumerate(plan_dict.get("weather", {}).get("forecast", [])):
                if i < len(translated_data["weather"].get("forecast", [])):
                    trans_f = translated_data["weather"]["forecast"][i]
                    f_copy = f.copy()
                    f_copy["day_label"] = trans_f.get("day_label", f.get("day_label"))
                    f_copy["condition"] = trans_f.get("condition", f.get("condition"))
                    merged_forecast.append(f_copy)
                else:
                    merged_forecast.append(f)
            merged_plan["weather"]["forecast"] = merged_forecast

        if "budget_analysis" in translated_data:
            merged_plan["budget_analysis"] = plan_dict.get("budget_analysis", {}).copy()
            merged_plan["budget_analysis"]["status"] = translated_data["budget_analysis"].get("status", plan_dict.get("budget_analysis", {}).get("status"))

        if "ai_recommendations" in translated_data:
            merged_plan["ai_recommendations"] = translated_data["ai_recommendations"]

        if "final_recommendation" in translated_data:
            merged_plan["final_recommendation"] = plan_dict.get("final_recommendation", {}).copy()
            merged_plan["final_recommendation"]["theme"] = translated_data["final_recommendation"].get("theme", plan_dict.get("final_recommendation", {}).get("theme"))

        return merged_plan
