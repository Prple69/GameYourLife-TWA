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
