"""Tests for backend/app/utils/game_logic.py — Phase 4 stat math primitives + Phase 5 helpers."""
import pytest
from datetime import datetime, timezone, timedelta
from app.utils.game_logic import (
    CATEGORY_TO_STAT,
    STAT_GROWTH,
    QuestCategory,
    StatName,
    max_xp_for_level,
    apply_stat_xp,
    MAX_ACTIVE_QUESTS,
    effective_multipliers,
    effective_max_hp,
)


class StubUser:
    """Minimal in-memory user object — no DB needed."""
    stat_strength_level = 1
    stat_strength_xp = 0
    stat_wisdom_level = 1
    stat_wisdom_xp = 0
    stat_endurance_level = 1
    stat_endurance_xp = 0
    stat_charisma_level = 1
    stat_charisma_xp = 0
    # Phase 5 boost attributes (all None by default = no active boost)
    active_xp_mult = None
    active_xp_expires_at = None
    active_gold_mult = None
    active_gold_expires_at = None
    active_strength_xp_mult = None
    active_strength_xp_expires_at = None
    active_wisdom_xp_mult = None
    active_wisdom_xp_expires_at = None
    active_endurance_xp_mult = None
    active_endurance_xp_expires_at = None
    active_charisma_xp_mult = None
    active_charisma_xp_expires_at = None
    active_hp_max_bonus = None
    active_hp_max_expires_at = None
    max_hp = 100


def make_user():
    return StubUser()


# ---------- max_xp_for_level ----------

def test_max_xp_level_1():
    assert max_xp_for_level(1) == 10


def test_max_xp_level_2():
    assert max_xp_for_level(2) == 12


def test_max_xp_level_5():
    assert max_xp_for_level(5) == 21


def test_max_xp_level_zero_guard():
    assert max_xp_for_level(0) == 10


def test_max_xp_level_negative_guard():
    assert max_xp_for_level(-5) == 10


# ---------- CATEGORY_TO_STAT ----------

def test_category_work_maps_endurance():
    assert CATEGORY_TO_STAT["work"] == "endurance"


def test_category_fitness_maps_strength():
    assert CATEGORY_TO_STAT["fitness"] == "strength"


def test_category_learning_maps_wisdom():
    assert CATEGORY_TO_STAT["learning"] == "wisdom"


def test_category_social_maps_charisma():
    assert CATEGORY_TO_STAT["social"] == "charisma"


# ---------- STAT_GROWTH ----------

def test_stat_growth_easy():
    assert STAT_GROWTH["easy"] == 1


def test_stat_growth_medium():
    assert STAT_GROWTH["medium"] == 2


def test_stat_growth_hard():
    assert STAT_GROWTH["hard"] == 4


def test_stat_growth_epic():
    assert STAT_GROWTH["epic"] == 8


# ---------- apply_stat_xp — no level-up ----------

def test_apply_stat_xp_no_levelup():
    user = make_user()
    result = apply_stat_xp(user, "strength", 2)
    assert user.stat_strength_xp == 2
    assert user.stat_strength_level == 1
    assert result == {"name": "strength", "xp_gained": 2, "leveled_up": False, "new_level": 1}


# ---------- apply_stat_xp — exact threshold → level-up ----------

def test_apply_stat_xp_exact_levelup():
    user = make_user()
    result = apply_stat_xp(user, "endurance", 10)
    assert user.stat_endurance_level == 2
    assert user.stat_endurance_xp == 0
    assert result["leveled_up"] is True
    assert result["new_level"] == 2


# ---------- apply_stat_xp — large gain terminates safely ----------

def test_apply_stat_xp_large_gain_terminates():
    user = make_user()
    result = apply_stat_xp(user, "strength", 100)
    assert result["leveled_up"] is True
    assert result["new_level"] >= 2


# ---------- apply_stat_xp — isolation (no cross-stat mutation) ----------

def test_apply_stat_xp_does_not_mutate_other_stats():
    user = make_user()
    apply_stat_xp(user, "strength", 9)
    # all other stats must remain untouched
    assert user.stat_wisdom_level == 1
    assert user.stat_wisdom_xp == 0
    assert user.stat_endurance_level == 1
    assert user.stat_endurance_xp == 0
    assert user.stat_charisma_level == 1
    assert user.stat_charisma_xp == 0


# ---------- Phase 5: MAX_ACTIVE_QUESTS ----------

def test_max_active_quests_constant():
    assert MAX_ACTIVE_QUESTS == 5


# ---------- Phase 5: effective_multipliers ----------

MSK = timezone(timedelta(hours=3))
NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=MSK)


def test_no_active_boosts():
    """All boost fields None → all multipliers = 1.0."""
    user = make_user()
    result = effective_multipliers(user, NOW)
    assert result == {
        "xp": 1.0,
        "gold": 1.0,
        "strength_xp": 1.0,
        "wisdom_xp": 1.0,
        "endurance_xp": 1.0,
        "charisma_xp": 1.0,
    }


def test_xp_boost_active():
    """active_xp_mult=1.5, expires 60s in future → xp=1.5."""
    user = make_user()
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = NOW + timedelta(seconds=60)
    result = effective_multipliers(user, NOW)
    assert result["xp"] == 1.5
    assert result["gold"] == 1.0


def test_xp_boost_expired():
    """expires_at=1s in past → xp=1.0."""
    user = make_user()
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = NOW - timedelta(seconds=1)
    result = effective_multipliers(user, NOW)
    assert result["xp"] == 1.0


def test_xp_boost_expires_at_exactly_now():
    """expires_at == now → NOT strictly greater → xp=1.0."""
    user = make_user()
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = NOW
    result = effective_multipliers(user, NOW)
    assert result["xp"] == 1.0


def test_multiple_boosts_independent():
    """XP and gold both active → both return their multipliers independently."""
    user = make_user()
    user.active_xp_mult = 1.5
    user.active_xp_expires_at = NOW + timedelta(seconds=300)
    user.active_gold_mult = 2.0
    user.active_gold_expires_at = NOW + timedelta(seconds=300)
    result = effective_multipliers(user, NOW)
    assert result["xp"] == 1.5
    assert result["gold"] == 2.0
    assert result["strength_xp"] == 1.0


def test_stat_boost_active():
    """active_strength_xp_mult=2.0, expires 300s future → strength_xp=2.0, others=1.0."""
    user = make_user()
    user.active_strength_xp_mult = 2.0
    user.active_strength_xp_expires_at = NOW + timedelta(seconds=300)
    result = effective_multipliers(user, NOW)
    assert result["strength_xp"] == 2.0
    assert result["wisdom_xp"] == 1.0
    assert result["endurance_xp"] == 1.0
    assert result["charisma_xp"] == 1.0


# ---------- Phase 5: effective_max_hp ----------

def test_no_hp_boost():
    """No active hp boost → returns user.max_hp (100)."""
    user = make_user()
    assert effective_max_hp(user, NOW) == 100


def test_hp_boost_active():
    """active_hp_max_bonus=50, expires 60s future → 150."""
    user = make_user()
    user.active_hp_max_bonus = 50
    user.active_hp_max_expires_at = NOW + timedelta(seconds=60)
    assert effective_max_hp(user, NOW) == 150


def test_hp_boost_expired():
    """active_hp_max_bonus=50, expires 1s in past → 100."""
    user = make_user()
    user.active_hp_max_bonus = 50
    user.active_hp_max_expires_at = NOW - timedelta(seconds=1)
    assert effective_max_hp(user, NOW) == 100
