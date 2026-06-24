from typing import List, Optional
from pydantic import BaseModel, Field


class TripCreateRequest(BaseModel):
    source: str = Field(..., examples=["Hyderabad"])
    destination: str = Field(..., examples=["Goa"])
    travel_date: str = Field(..., examples=["20-07-2026"], description="DD-MM-YYYY")
    days: int = Field(..., ge=1, le=30)
    budget: float = Field(..., gt=0)
    preferences: List[str] = Field(default_factory=list, examples=[["Beaches", "Adventure"]])
    additional_requirements: Optional[str] = Field(default="", examples=["Near beach hotel, family friendly"])


class DestinationHighlight(BaseModel):
    name: str
    location: str
    rating: float
    image_url: str


# ---- Nested response building blocks ----
class TransportOption(BaseModel):
    mode: str
    provider: Optional[str] = None
    departure_time: Optional[str] = None
    duration: str
    cost: float


class TransportRecommendation(BaseModel):
    available_options: List[TransportOption]
    recommended_mode: str
    recommended_cost: float
    reason: str
    source_code: Optional[str] = None
    destination_code: Optional[str] = None


class HotelOption(BaseModel):
    name: str
    rating: float
    location: str
    cost_per_night: float
    total_cost: float
    features: List[str]


class WeatherDay(BaseModel):
    date: str
    day_label: str
    condition: str
    temperature: str


class WeatherForecast(BaseModel):
    forecast: List[WeatherDay]
    suggestions: List[str]


class ItineraryDay(BaseModel):
    day: int
    morning: str
    afternoon: str
    evening: str
    night: str
    estimated_spend: float


class BudgetAnalysis(BaseModel):
    breakdown: dict
    total_spent: float
    remaining_budget: float
    status: str


class FinalRecommendation(BaseModel):
    transport: str
    hotel: str
    budget_used: float
    budget_total: float
    theme: str
    overall_score: float


class TripPlanResponse(BaseModel):
    trip_id: int
    source: str
    destination: str
    travel_date: str
    days: int
    budget: float
    preferences: List[str]
    destination_highlights: List[DestinationHighlight]
    transport: TransportRecommendation
    hotels: List[HotelOption]
    weather: WeatherForecast
    itinerary: List[ItineraryDay]
    budget_analysis: BudgetAnalysis
    ai_recommendations: List[str]
    final_recommendation: FinalRecommendation
