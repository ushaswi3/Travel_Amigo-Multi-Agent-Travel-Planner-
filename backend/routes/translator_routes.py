from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from agents.translator_agent import TranslatorAgent

router = APIRouter(prefix="/translator", tags=["Translator"])
translator = TranslatorAgent()

class TranslateTextRequest(BaseModel):
    text: str
    target_lang: str

class TranslatePlanRequest(BaseModel):
    plan: dict
    target_lang: str

@router.post("/translate")
def translate_text(payload: TranslateTextRequest):
    try:
        translated = translator.translate_text(payload.text, payload.target_lang)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {e}"
        )

@router.post("/translate-plan")
def translate_plan(payload: TranslatePlanRequest):
    try:
        translated_plan = translator.translate_plan(payload.plan, payload.target_lang)
        return translated_plan
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan translation failed: {e}"
        )
