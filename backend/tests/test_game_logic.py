"""Tests for backend/app/utils/game_logic.py — Phase 4 stat math primitives."""
import pytest
from app.utils.game_logic import (
    CATEGORY_TO_STAT,
    STAT_GROWTH,
    QuestCategory,
    StatName,
    max_xp_for_level,
    apply_stat_xp,
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
