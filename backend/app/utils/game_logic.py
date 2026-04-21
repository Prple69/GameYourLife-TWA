"""Phase 4: stat math + category mapping. Phase 5: boost helpers. Pure functions, no DB access."""
from datetime import datetime
from typing import Literal

QuestCategory = Literal["work", "fitness", "learning", "social"]
StatName = Literal["strength", "wisdom", "endurance", "charisma"]

# Locked 1:1 mapping from CONTEXT.md — do not change.
CATEGORY_TO_STAT: dict[QuestCategory, StatName] = {
    "work": "endurance",
    "fitness": "strength",
    "learning": "wisdom",
    "social": "charisma",
}

# Difficulty → stat XP awarded on completion.
STAT_GROWTH: dict[str, int] = {
    "easy": 1,
    "medium": 2,
    "hard": 4,
    "epic": 8,
}

# Phase 5: max number of simultaneously active quests per user.
MAX_ACTIVE_QUESTS = 5

# Phase 5: all multiplier boost types tracked on the User model.
BOOST_MULT_TYPES = ("xp", "gold", "strength_xp", "wisdom_xp", "endurance_xp", "charisma_xp")


def max_xp_for_level(level: int) -> int:
    """Threshold for next stat level-up. Mirrors user lvl curve (x1.2 per level, start 10)."""
    if level < 1:
        return 10
    return max(1, round(10 * (1.2 ** (level - 1))))


def apply_stat_xp(user, stat_name: StatName, gain: int) -> dict:
    """
    Mutates `user` in place — adds `gain` XP to the given stat and levels up while possible.
    Returns {"name": stat_name, "xp_gained": gain, "leveled_up": bool, "new_level": int}.
    Caller is responsible for `await db.commit()` afterwards.
    """
    level_attr = f"stat_{stat_name}_level"
    xp_attr = f"stat_{stat_name}_xp"

    new_xp = getattr(user, xp_attr) + gain
    new_level = getattr(user, level_attr)
    leveled_up = False

    # Safety counter against pathological inputs (never expect more than ~100 level-ups in one call)
    for _ in range(100):
        threshold = max_xp_for_level(new_level)
        if new_xp < threshold:
            break
        new_xp -= threshold
        new_level += 1
        leveled_up = True

    setattr(user, xp_attr, new_xp)
    setattr(user, level_attr, new_level)

    return {
        "name": stat_name,
        "xp_gained": gain,
        "leveled_up": leveled_up,
        "new_level": new_level,
    }


def effective_multipliers(user, now: datetime) -> dict:
    """
    Returns dict of active boost multipliers for the given user at `now`.
    Keys: xp, gold, strength_xp, wisdom_xp, endurance_xp, charisma_xp.
    A boost is active iff its expires_at is strictly greater than `now`.
    Falls back to 1.0 for any inactive/missing boost.
    """
    result = {}
    for btype in BOOST_MULT_TYPES:
        mult = getattr(user, f"active_{btype}_mult", None)
        exp = getattr(user, f"active_{btype}_expires_at", None)
        result[btype] = (mult if (mult is not None and exp is not None and exp > now) else 1.0)
    return result


def effective_max_hp(user, now: datetime) -> int:
    """
    Returns user's effective max HP at `now`.
    Adds active_hp_max_bonus when the boost has not expired, else returns user.max_hp.
    """
    bonus = getattr(user, "active_hp_max_bonus", None)
    exp = getattr(user, "active_hp_max_expires_at", None)
    if bonus is not None and exp is not None and exp > now:
        return user.max_hp + bonus
    return user.max_hp
