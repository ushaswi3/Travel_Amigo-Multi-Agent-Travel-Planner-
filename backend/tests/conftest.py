"""
Shared pytest fixtures. Critically, this redirects the app's database engine
to an isolated temp-file SQLite database BEFORE main.py / config.settings are
ever imported, so running the test suite NEVER touches your real
travel_planner.db, and every test function gets a clean slate.
"""
import atexit
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Must happen before any import of config.settings / database.connection / main,
# since pydantic-settings reads DATABASE_URL from the environment at import time.
_tmp_fd, _tmp_path = tempfile.mkstemp(suffix=".db")
os.close(_tmp_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_path}"

# Clear external API keys during testing so tests run in mock/offline mode
os.environ["GEOAPIFY_API_KEY"] = ""
os.environ["OPENWEATHER_API_KEY"] = ""
os.environ["AMADEUS_API_KEY"] = ""
os.environ["AMADEUS_API_SECRET"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""

atexit.register(lambda: os.path.exists(_tmp_path) and os.remove(_tmp_path))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from database.connection import Base, engine  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def client():
    """A TestClient backed by a freshly-wiped isolated database for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
