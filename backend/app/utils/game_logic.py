"""Phase 4: stat math + category mapping. Pure functions, no DB access."""
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
