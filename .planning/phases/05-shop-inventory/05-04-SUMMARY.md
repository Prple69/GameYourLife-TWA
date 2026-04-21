---
phase: 05-shop-inventory
plan: "04"
subsystem: quests-router
tags: [quests, boosts, multipliers, quest-cap, game-logic]
dependency_graph:
  requires:
    - 05-02  # game_logic.py: effective_multipliers, effective_max_hp, MAX_ACTIVE_QUESTS
  provides:
    - save_quest 409 cap enforcement
    - complete_quest boost-multiplied rewards
    - applied_boosts field in complete_quest response
    - HP fail-path clamped via effective_max_hp
  affects:
    - backend/app/routers/quests.py
    - backend/tests/test_quests_router.py
tech_stack:
  added: []
  patterns:
    - TDD (RED then GREEN) with stub tests — no DB/TestClient required
    - sqlalchemy func.count for active quest count query
    - effective_multipliers called once per complete_quest invocation; result reused for xp, gold, and all stat multipliers
key_files:
  created: []
  modified:
    - backend/app/routers/quests.py
    - backend/tests/test_quests_router.py
decisions:
  - "Applied effective_multipliers once at top of complete_quest body and passed mults dict to all reward calculations — avoids multiple function calls with same timestamp"
  - "round() used for xp/gold/stat reward multiplication — consistent with integer reward model, no fractional XP/gold accumulated"
  - "applied_boosts list contains only boosts where mult > 1.0 — inactive boosts (1.0) are excluded from response to keep payload clean"
  - "effective_max_hp called in _fail_overdue_quests before loop to reuse same expiry snapshot across all overdue quests in the batch"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_modified: 2
requirements:
  - SHOP-02
  - SHOP-03
  - INV-02
---

# Phase 05 Plan 04: Quest Cap + Boost Multiplier Wiring Summary

**One-liner:** Wired MAX_ACTIVE_QUESTS cap into save_quest (409 on overflow) and effective_multipliers into complete_quest (boosted XP/gold/stat rewards with applied_boosts response field).

## What Was Built

### Task 1: Quest Slot Cap in save_quest

`save_quest` now counts active quests (is_completed=False AND is_failed=False) for the user before inserting a new one. If the count is >= MAX_ACTIVE_QUESTS (5), it raises HTTPException 409 with detail `"active_limit_reached"`. The count uses `func.count` in a single SQL scalar query.

Import added to quests.py:
```python
from app.utils.game_logic import (
    apply_stat_xp, STAT_GROWTH, CATEGORY_TO_STAT,
    MAX_ACTIVE_QUESTS, effective_multipliers, effective_max_hp,
)
```

### Task 2: Boost Multipliers in complete_quest

At the start of `complete_quest`, after fetching user and quest:
- `now = get_msk_now()` — timezone-aware Moscow time (existing project pattern)
- `mults = effective_multipliers(user, now)` — dict with keys: xp, gold, strength_xp, wisdom_xp, endurance_xp, charisma_xp

Reward calculations:
- `xp_gained = round(quest.xp_reward * mults["xp"])`
- `gold_gained = round(quest.gold_reward * mults["gold"])`
- `boosted_stat_gain = round(base_stat_gain * mults.get(f"{stat_name}_xp", 1.0))`

Response now includes:
```json
"applied_boosts": [{"type": "xp", "mult": 1.5}]
```

### Fail Path: HP Clamping via effective_max_hp

`_fail_overdue_quests` now calls `effective_max_hp(user, now)` once before the loop, then clamps `user.hp` after each penalty to ensure HP never exceeds the current effective maximum (guards against edge case where an hp_max boost expires between reads).

## Test Coverage

9 new tests added to `test_quests_router.py`:

| Test | Validates |
|------|-----------|
| test_save_quest_at_cap_raises_409 | 409 raised when active_count >= 5 |
| test_save_quest_below_cap_succeeds | No exception when active_count = 4 |
| test_save_quest_at_zero_succeeds | No exception when active_count = 0 |
| test_quests_py_imports_max_active_quests | Source-level: MAX_ACTIVE_QUESTS + active_limit_reached present |
| test_complete_xp_boost_multiplies_reward | xp_gained = round(40 * 1.5) = 60 |
| test_complete_no_boost_unchanged | xp_gained = 40 with no active boosts |
| test_complete_gold_boost_multiplies_gold | gold_gained = round(20 * 2.0) = 40 |
| test_complete_applied_boosts_in_response | applied_boosts = [{"type": "xp", "mult": 1.5}] |
| test_complete_quest_with_stat_boost | stat gain = round(2 * 1.5) = 3 for fitness/medium |
| test_quests_py_contains_applied_boosts | Source-level: applied_boosts + effective_multipliers present |

## Verification Results

```
pytest backend/tests/test_quests_router.py -x -q  →  18 passed
pytest backend/tests/ -x -q                       →  53 passed
grep "effective_multipliers\|MAX_ACTIVE_QUESTS" backend/app/routers/quests.py  →  both present (lines 35, 187, 230)
grep "applied_boosts" backend/app/routers/quests.py  →  present (lines 254, 269)
```

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| 1fcb022 | test(05-04): add failing tests for quest cap and boost multipliers |
| d2e8a5b | feat(05-04): enforce quest cap and apply boost multipliers in quests.py |

## Self-Check: PASSED

- [x] backend/app/routers/quests.py — modified (confirmed via git log)
- [x] backend/tests/test_quests_router.py — modified (confirmed via git log)
- [x] 1fcb022 commit exists
- [x] d2e8a5b commit exists
- [x] All 53 tests pass
