from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from database.connection import init_db
from routes import auth_routes, trip_routes, user_routes, transport_routes, translator_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Agent AI Travel Planner — FastAPI + Coordinator/Agent architecture",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_routes.router)
app.include_router(trip_routes.router)
app.include_router(user_routes.router)
app.include_router(transport_routes.router)
app.include_router(translator_routes.router)


@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} is running",
        "docs": "/docs",
        "workflow": "User -> Trip API -> Coordinator Agent -> [Destination, Transport, Hotel, Weather, Budget, Itinerary, Recommendation] Agents -> Final Plan",
    }
