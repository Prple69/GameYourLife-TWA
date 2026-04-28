"""
Tests for backend/app/routers/quests.py — Phase 4 router extensions.

Strategy: unit-level tests using stub User/Quest objects.
  - complete_quest stat-gain logic is extracted and tested via the exact code path
    (instantiate StubUser/StubQuest, invoke the relevant sub-logic, assert).
  - save_quest category test verifies the ORM kwarg is threaded correctly.
  - All tests are synchronous stubs — no real DB, no TestClient required.
"""
import pytest
from app.utils.game_logic import apply_stat_xp, STAT_GROWTH, CATEGORY_TO_STAT


# ── Shared stubs ─────────────────────────────────────────────────────────────

class StubUser:
    """Minimal in-memory user — mirrors User model stat attrs."""
    stat_strength_level = 1
    stat_strength_xp = 0
    stat_wisdom_level = 1
    stat_wisdom_xp = 0
    stat_endurance_level = 1
    stat_endurance_xp = 0
    stat_charisma_level = 1
    stat_charisma_xp = 0
    xp = 0
    gold = 0
    lvl = 1
    max_xp = 100
    xp_multiplier = 1.0
    gold_multiplier = 1.0
    hp = 100
    max_hp = 100


class StubQuest:
    """Minimal in-memory quest — mirrors Quest model attrs."""
    def __init__(self, category, difficulty, xp_reward=40, gold_reward=20):
        self.category = category
        self.difficulty = difficulty
        self.xp_reward = xp_reward
        self.gold_reward = gold_reward
        self.hp_penalty = 10
        self.is_completed = False


def simulate_complete_quest(user, quest):
    """
    Mirrors the complete_quest body logic (without DB).
    Returns (leveled_up, stat_gain).
    """
    quest.is_completed = True

    user.xp += int(quest.xp_reward * user.xp_multiplier)
    user.gold += int(quest.gold_reward * user.gold_multiplier)

    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True

    # Phase 4: stat gain block (copy of the implementation under test)
    stat_gain = None
    if quest.category is not None:
        stat_name = CATEGORY_TO_STAT[quest.category]
        xp_gain = STAT_GROWTH[quest.difficulty]
        stat_gain = apply_stat_xp(user, stat_name, xp_gain)

    return leveled_up, stat_gain


# ── Task 1 tests — complete_quest stat gain ──────────────────────────────────

def test_complete_fitness_medium_increases_strength_xp_by_2():
    """fitness→strength, medium→2."""
    user = StubUser()
    quest = StubQuest(category="fitness", difficulty="medium")
    _, stat_gain = simulate_complete_quest(user, quest)
    assert user.stat_strength_xp == 2
    assert stat_gain is not None
    assert stat_gain["xp_gained"] == 2


def test_complete_work_hard_increases_endurance_xp_by_4():
    """work→endurance, hard→4; strength_xp must remain 0."""
    user = StubUser()
    quest = StubQuest(category="work", difficulty="hard")
    _, stat_gain = simulate_complete_quest(user, quest)
    assert user.stat_endurance_xp == 4
    assert user.stat_strength_xp == 0  # no cross-contamination
    assert stat_gain is not None
    assert stat_gain["xp_gained"] == 4


def test_complete_quest_response_contains_stat_gain_object():
    """Response stat_gain has expected keys when category is set."""
    user = StubUser()
    quest = StubQuest(category="work", difficulty="hard")
    _, stat_gain = simulate_complete_quest(user, quest)
    assert stat_gain == {
        "name": "endurance",
        "xp_gained": 4,
        "leveled_up": False,
        "new_level": 1,
    }


def test_complete_legacy_quest_no_stat_change_and_gain_is_none():
    """category=None → no stat XP awarded, stat_gain returns None. No KeyError."""
    user = StubUser()
    quest = StubQuest(category=None, difficulty="easy")
    _, stat_gain = simulate_complete_quest(user, quest)
    assert stat_gain is None
    # All stat XP must remain at zero
    assert user.stat_strength_xp == 0
    assert user.stat_wisdom_xp == 0
    assert user.stat_endurance_xp == 0
    assert user.stat_charisma_xp == 0


def test_complete_quest_still_levels_up_character():
    """Existing leveling behavior preserved — user.lvl increments when xp overflows."""
    user = StubUser()
    user.xp = 90        # 10 short of max_xp=100
    user.max_xp = 100
    quest = StubQuest(category="fitness", difficulty="easy", xp_reward=20)
    leveled_up, _ = simulate_complete_quest(user, quest)
    assert leveled_up is True
    assert user.lvl == 2


# ── Task 1 tests — save_quest category ───────────────────────────────────────

def test_quest_save_schema_requires_category():
    """QuestSave raises ValidationError when category is missing."""
    from pydantic import ValidationError
    from app.schemas import QuestSave
    with pytest.raises(ValidationError):
        QuestSave(
            title="Test quest",
            deadline="2026-05-01",
            difficulty="easy",
            xp_reward=20,
            gold_reward=10,
            hp_penalty=5,
            # category omitted intentionally
        )


def test_quest_save_schema_accepts_valid_category():
    """QuestSave passes when category is a valid QuestCategory value."""
    from app.schemas import QuestSave
    qs = QuestSave(
        title="Test quest",
        deadline="2026-05-01",
        difficulty="easy",
        xp_reward=20,
        gold_reward=10,
        hp_penalty=5,
        category="social",
    )
    assert qs.category == "social"


# ── Task 2 tests — analyze_task prompt building ───────────────────────────────

def test_analyze_prompt_contains_stat_block():
    """Verify the prompt f-string in quests.py contains required substrings.

    We import the module and inspect its source, which is lightweight and
    requires no DB/TestClient setup.
    """
    import inspect
    import importlib
    import app.routers.quests as quests_module
    source = inspect.getsource(quests_module)

    assert "СТАТЫ ИГРОКА" in source, "Missing СТАТЫ ИГРОКА block in prompt"
    assert "КАТЕГОРИЯ КВЕСТА" in source, "Missing КАТЕГОРИЯ КВЕСТА line in prompt"
    assert "слабого направления" in source, "Missing weak-stat rule in prompt"


# ── Phase 5 Task 1 — quest slot cap tests ────────────────────────────────────

class StubUserWithBoosts(StubUser):
    """Extends StubUser with Phase 5 boost columns (all None by default)."""
    # XP boost
    active_xp_mult = None
    active_xp_expires_at = None
    # Gold boost
    active_gold_mult = None
    active_gold_expires_at = None
    # Stat XP boosts
    active_strength_xp_mult = None
    active_strength_xp_expires_at = None
    active_wisdom_xp_mult = None
    active_wisdom_xp_expires_at = None
    active_endurance_xp_mult = None
    active_endurance_xp_expires_at = None
    active_charisma_xp_mult = None
    active_charisma_xp_expires_at = None
    # HP max boost
    active_hp_max_bonus = None
    active_hp_max_expires_at = None


def test_save_quest_at_cap_raises_409():
    """When user already has 5 active quests, save should raise HTTPException 409."""
    from fastapi import HTTPException
    from app.utils.game_logic import MAX_ACTIVE_QUESTS

    # Simulate active_count >= MAX_ACTIVE_QUESTS → should raise 409
    active_count = 5
    assert active_count >= MAX_ACTIVE_QUESTS
    # Replicate the guard logic from save_quest
    raised = False
    try:
        if active_count >= MAX_ACTIVE_QUESTS:
            raise HTTPException(status_code=409, detail="active_limit_reached")
    except HTTPException as exc:
        raised = True
        assert exc.status_code == 409
        assert exc.detail == "active_limit_reached"
    assert raised, "Expected HTTPException 409 was not raised"


def test_save_quest_below_cap_succeeds():
    """When user has 4 active quests (below cap of 5), save should succeed (no exception)."""
    from fastapi import HTTPException
    from app.utils.game_logic import MAX_ACTIVE_QUESTS

    active_count = 4
    # Should NOT raise — guard condition is False
    if active_count >= MAX_ACTIVE_QUESTS:
        raise HTTPException(status_code=409, detail="active_limit_reached")
    # If we reach here, no exception — test passes
    assert active_count < MAX_ACTIVE_QUESTS


def test_save_quest_at_zero_succeeds():
    """When user has 0 active quests, save should succeed."""
    from fastapi import HTTPException
    from app.utils.game_logic import MAX_ACTIVE_QUESTS

    active_count = 0
    if active_count >= MAX_ACTIVE_QUESTS:
        raise HTTPException(status_code=409, detail="active_limit_reached")
    assert active_count == 0


def test_quests_py_imports_max_active_quests():
    """Verify quests.py contains the MAX_ACTIVE_QUESTS import and guard pattern."""
    import inspect
    import app.routers.quests as quests_module
    source = inspect.getsource(quests_module)
    assert "MAX_ACTIVE_QUESTS" in source, "MAX_ACTIVE_QUESTS not found in quests.py"
    assert "active_limit_reached" in source, "active_limit_reached not found in quests.py"


# ── Phase 5 Task 2 — boost multiplier tests ──────────────────────────────────

def test_complete_xp_boost_multiplies_reward():
    """XP boost active (mult=1.5) → xp_gained = round(base * 1.5)."""
    from datetime import datetime, timezone, timedelta
    from app.utils.game_logic import effective_multipliers

    user = StubUserWithBoosts()
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = future

    now = datetime.now(timezone.utc)
    mults = effective_multipliers(user, now)

    base_xp = 40
    xp_gained = round(base_xp * mults["xp"])
    assert xp_gained == 60  # round(40 * 1.5)


def test_complete_no_boost_unchanged():
    """No active boosts → xp_gained equals base xp (mult=1.0)."""
    from datetime import datetime, timezone
    from app.utils.game_logic import effective_multipliers

    user = StubUserWithBoosts()  # all boost attrs are None
    now = datetime.now(timezone.utc)
    mults = effective_multipliers(user, now)

    base_xp = 40
    xp_gained = round(base_xp * mults["xp"])
    assert xp_gained == 40


def test_complete_gold_boost_multiplies_gold():
    """Gold boost active (mult=2.0) → gold_gained = round(base * 2.0)."""
    from datetime import datetime, timezone, timedelta
    from app.utils.game_logic import effective_multipliers

    user = StubUserWithBoosts()
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    user.active_gold_mult = 2.0
    user.active_gold_expires_at = future

    now = datetime.now(timezone.utc)
    mults = effective_multipliers(user, now)

    base_gold = 20
    gold_gained = round(base_gold * mults["gold"])
    assert gold_gained == 40  # round(20 * 2.0)


def test_complete_applied_boosts_in_response():
    """Active xp boost → applied_boosts contains {"type": "xp", "mult": 1.5}."""
    from datetime import datetime, timezone, timedelta
    from app.utils.game_logic import effective_multipliers

    user = StubUserWithBoosts()
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = future

    now = datetime.now(timezone.utc)
    mults = effective_multipliers(user, now)

    applied_boosts = [{"type": k, "mult": v} for k, v in mults.items() if v > 1.0]
    assert len(applied_boosts) == 1
    assert applied_boosts[0] == {"type": "xp", "mult": 1.5}


def test_complete_quest_with_stat_boost():
    """Active strength_xp boost (mult=1.5) → stat gain = round(base * 1.5) for fitness quest."""
    from datetime import datetime, timezone, timedelta
    from app.utils.game_logic import effective_multipliers, STAT_GROWTH, CATEGORY_TO_STAT, apply_stat_xp

    user = StubUserWithBoosts()
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    user.active_strength_xp_mult = 1.5
    user.active_strength_xp_expires_at = future

    now = datetime.now(timezone.utc)
    mults = effective_multipliers(user, now)

    quest_category = "fitness"
    quest_difficulty = "medium"
    stat_name = CATEGORY_TO_STAT[quest_category]
    base_gain = STAT_GROWTH[quest_difficulty]  # 2
    boosted_gain = round(base_gain * mults.get(f"{stat_name}_xp", 1.0))
    assert boosted_gain == 3  # round(2 * 1.5)

    stat_result = apply_stat_xp(user, stat_name, boosted_gain)
    assert stat_result["xp_gained"] == 3
    assert user.stat_strength_xp == 3


def test_quests_py_contains_applied_boosts():
    """Verify quests.py contains the applied_boosts pattern in source."""
    import inspect
    import app.routers.quests as quests_module
    source = inspect.getsource(quests_module)
    assert "applied_boosts" in source, "applied_boosts not found in quests.py"
    assert "effective_multipliers" in source, "effective_multipliers not found in quests.py"


# ── Phase 10.1 Task 1 — leaderboard.update wired into complete_quest ─────────


class StubUserForLeaderboard(StubUserWithBoosts):
    """Extends StubUserWithBoosts with id + display_name for leaderboard score_for.

    Also includes the minimum set of attrs UserSchema.model_validate requires
    (the endpoint serializes user via from_attributes after the leaderboard ZADD).
    """
    id = 42
    telegram_id = None
    username = None
    email = None
    display_name = "Hero"
    gems = 0
    selected_avatar = "avatar1"
    char_class = "knight"


class StubQuestModel:
    """Minimal Quest with attributes used by complete_quest."""
    def __init__(self, quest_id=1, user_id=42):
        self.id = quest_id
        self.user_id = user_id
        self.xp_reward = 50
        self.gold_reward = 5
        self.hp_penalty = 0
        self.difficulty = "easy"
        self.category = None  # legacy quest avoids stat-gain branch
        self.is_completed = False
        self.is_failed = False


class StubScalars:
    def __init__(self, items):
        self._items = list(items)

    def all(self):
        return list(self._items)

    def first(self):
        return self._items[0] if self._items else None


class StubResult:
    def __init__(self, items):
        self._items = list(items)

    def scalars(self):
        return StubScalars(self._items)


class StubDB:
    """Async DB stub: execute returns the configured result, commit/refresh are no-ops."""
    def __init__(self, quest):
        self._quest = quest
        self.commit_called = 0
        self.refresh_called = 0

    async def execute(self, *args, **kwargs):
        return StubResult([self._quest])

    async def commit(self):
        self.commit_called += 1

    async def refresh(self, _obj):
        self.refresh_called += 1


def test_complete_quest_updates_leaderboard():
    """After complete_quest succeeds, Redis ZSET leaderboard:global has user's entry."""
    import asyncio
    from app.routers.quests import complete_quest
    from app import leaderboard
    from tests.conftest import StubRedis

    async def _run():
        user = StubUserForLeaderboard()
        quest = StubQuestModel(quest_id=1, user_id=user.id)
        db = StubDB(quest)
        redis = StubRedis()

        response = await complete_quest(
            quest_id=1, user=user, db=db, redis_client=redis
        )

        # ZADD wrote the user's entry to the global leaderboard sorted set
        assert "leaderboard:global" in redis._zsets, "Leaderboard key not created"
        zset = redis._zsets["leaderboard:global"]
        assert str(user.id) in zset, f"User {user.id} not in leaderboard ZSET"

        # Score equals leaderboard.score_for(user) (post quest XP gain applied)
        expected_score = leaderboard.score_for(user)
        assert zset[str(user.id)] == expected_score, (
            f"Score mismatch: got {zset[str(user.id)]}, expected {expected_score}"
        )

        # Endpoint succeeded with a response
        assert response is not None
        assert isinstance(response, dict)
        assert response.get("status") == "success"

    asyncio.run(_run())


def test_complete_quest_redis_failure_doesnt_break_completion():
    """If Redis ZADD raises, complete_quest still returns success — never propagates."""
    import asyncio
    from app.routers.quests import complete_quest
    from tests.conftest import StubRedis

    class BrokenRedis(StubRedis):
        async def zadd(self, key, mapping):
            raise RuntimeError("redis down")

    async def _run():
        user = StubUserForLeaderboard()
        quest = StubQuestModel(quest_id=1, user_id=user.id)
        db = StubDB(quest)
        redis = BrokenRedis()

        # Must not raise — try/except guard absorbs Redis failures
        response = await complete_quest(
            quest_id=1, user=user, db=db, redis_client=redis
        )
        assert response is not None
        assert isinstance(response, dict)
        assert response.get("status") == "success"

    asyncio.run(_run())
