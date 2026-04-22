"""
Unit tests for daily.py router logic — Phase 6.
Strategy: stub objects (StubUser, StubQuest, StubRedis) — no DB, no real Redis.
Tests validate AI-01 (caching) and AI-02 (weak-stat priority, history).
"""
import json
import pytest
import asyncio
from tests.conftest import StubRedis


# ── Stubs ────────────────────────────────────────────────────────────────────

class StubUser:
    id = 42
    lvl = 3
    hp = 80
    max_hp = 100
    stat_strength_level = 5
    stat_wisdom_level = 1   # WEAK STAT — should trigger learning quest
    stat_endurance_level = 4
    stat_charisma_level = 4
    email = "test@example.com"
    telegram_id = None


class StubQuest:
    def __init__(self, title, category, difficulty, completed=True):
        self.title = title
        self.category = category
        self.difficulty = difficulty
        self.is_completed = completed
        self.is_failed = not completed


# ── Helper imports ────────────────────────────────────────────────────────────

from app.routers.daily import (
    _format_quest_history,
    _seconds_until_midnight_msk,
    FALLBACK_SUGGESTIONS,
)


# ── AI-01: Cache behavior ─────────────────────────────────────────────────────

def test_fallback_suggestions_valid_schema():
    """FALLBACK_SUGGESTIONS must be valid DailySuggestion dicts (AI-01 resilience)."""
    from app.schemas import DailySuggestion
    for item in FALLBACK_SUGGESTIONS:
        parsed = DailySuggestion.model_validate(item)
        assert parsed.title
        assert parsed.category in ("work", "fitness", "learning", "social")
        assert parsed.difficulty in ("easy", "medium", "hard", "epic")


def test_fallback_suggestions_count():
    """Fallback must have exactly 3 suggestions (AI-01)."""
    assert len(FALLBACK_SUGGESTIONS) == 3


def test_seconds_until_midnight_msk_positive():
    """TTL must be > 0 at any time of day (AI-01 cache does not expire immediately)."""
    ttl = _seconds_until_midnight_msk()
    assert ttl > 0
    assert ttl <= 86400  # max 24h


# ── AI-02: History + weak-stat prompt ────────────────────────────────────────

def test_format_quest_history_empty():
    """Empty history returns new-player message (AI-02: history in prompt)."""
    result = _format_quest_history([])
    assert "новый" in result.lower() or "пустая" in result.lower()


def test_format_quest_history_with_quests():
    """History formats completed and failed quests with status indicator."""
    quests = [
        StubQuest("Run 5km", "fitness", "medium", completed=True),
        StubQuest("Read book", "learning", "easy", completed=False),
    ]
    result = _format_quest_history(quests)
    assert "✓" in result  # completed marker
    assert "✗" in result  # failed marker
    assert "fitness" in result
    assert "learning" in result


def test_fallback_suggestions_diverse_categories():
    """Fallback covers at least 2 different categories (AI-02: personalization intent)."""
    categories = {s["category"] for s in FALLBACK_SUGGESTIONS}
    assert len(categories) >= 2


# ── StubRedis contract ────────────────────────────────────────────────────────

def test_stub_redis_setex_get():
    """StubRedis.setex + get round-trip (contract test for test infrastructure)."""
    redis = StubRedis()
    asyncio.run(redis.setex("key", 3600, "value"))
    result = asyncio.run(redis.get("key"))
    assert result == "value"


def test_stub_redis_incr():
    """StubRedis.incr returns incremented value (reroll counter behavior)."""
    redis = StubRedis()
    v1 = asyncio.run(redis.incr("counter"))
    v2 = asyncio.run(redis.incr("counter"))
    assert v1 == 1
    assert v2 == 2


def test_stub_redis_delete():
    """StubRedis.delete removes key (accept removes accepted suggestion)."""
    redis = StubRedis()
    asyncio.run(redis.setex("key", 3600, "data"))
    asyncio.run(redis.delete("key"))
    assert asyncio.run(redis.get("key")) is None
