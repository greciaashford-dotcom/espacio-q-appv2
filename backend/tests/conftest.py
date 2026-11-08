# Shared fixtures: reset public rate-limit counters (booking/contact/newsletter) before each test
import pytest
from pymongo import MongoClient


@pytest.fixture(autouse=True)
def _reset_public_rate_limits():
    db = MongoClient("mongodb://localhost:27017")["espacio_q"]
    db.rateLimitHit.delete_many({"key": {"$regex": "^(booking_create|contact|newsletter):"}})
    yield
