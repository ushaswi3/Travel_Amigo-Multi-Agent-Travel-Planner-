class BudgetAgent:
    """Combines transport + hotel costs with estimated food/activities/misc
    spend (drawn from the itinerary) to produce a full budget breakdown."""

    def run(self, budget: float, transport_cost: float, hotel_cost: float, itinerary: list[dict]) -> dict:
        activities_spend = sum(day["estimated_spend"] for day in itinerary)
        food_spend = round(len(itinerary) * 750, -1)
        shopping_spend = round(budget * 0.05, -1)
        misc_spend = round(budget * 0.05, -1)

        breakdown = {
            "Transport": round(transport_cost, 2),
            "Hotel": round(hotel_cost, 2),
            "Food": food_spend,
            "Activities": round(activities_spend, 2),
            "Shopping": shopping_spend,
            "Miscellaneous": misc_spend,
        }
        total_spent = round(sum(breakdown.values()), 2)
        remaining = round(budget - total_spent, 2)
        status = "Within Budget" if remaining >= 0 else "Over Budget"

        return {
            "breakdown": breakdown,
            "total_spent": total_spent,
            "remaining_budget": remaining,
            "status": status,
        }

