---
phase: 04-character-stats
plan: "01"
subsystem: backend-schema
tags: [alembic, sqlalchemy, pydantic, game-logic, tdd]
dependency_graph:
  requires: []
  provides:
    - stat_columns_in_users_table
    - quest_category_column
    - game_logic_primitives
    - UserSchema_stat_fields
    - QuestCategory_type
  affects:
    - backend/app/routers (04-02 will call apply_stat_xp)
    - frontend stat display (04-03)
tech_stack:
  added:
    - pytest==8.1.1 (test runner, added to requirements.txt)
  patterns:
    - "NOT NULL + server_default migration (same as gems in Phase 3 b74c083b2140)"
    - "TDD RED/GREEN cycle for pure utility functions"
    - "Literal type alias for QuestCategory (not Enum — matches project convention)"
key_files:
  created:
    - backend/migrations/versions/06a41e12f90c_add_character_stats.py
    - backend/app/utils/game_logic.py
    - backend/tests/__init__.py
    - backend/tests/test_game_logic.py
  modified:
    - backend/app/models.py (lines 29-38: 8 stat columns on User; line 66: category on Quest)
    - backend/app/schemas.py (Literal import; QuestCategory alias; UserSchema stat fields; Quest schema category fields)
    - backend/requirements.txt (pytest added)
decisions:
  - "Revision ID 06a41e12f90c chosen (random uuid hex prefix); down_revision = b74c083b2140"
  - "Hand-wrote migration (no autogenerate) to avoid spurious drop_index calls against baseline"
  - "Both default= and server_default= on stat columns — server_default for existing DB rows, default= for ORM inserts"
  - "pytest 8.1.1 pinned (newer versions incompatible with locust already in env)"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-21"
  tasks_completed: 3
  files_created: 4
  files_modified: 3
---

# Phase 4 Plan 01: Character Stats Backend Schema — Summary

**One-liner:** Alembic migration adds 8 NOT-NULL stat columns to users + nullable category to quests; game_logic.py provides pure stat math primitives with full TDD coverage; UserSchema and Quest schemas extended to expose and validate the new fields.

---

## Tasks Completed

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Alembic migration: users +8 stat cols, quests +category | bd33ed3 | Revision 06a41e12f90c applied to dev DB |
| 2 | game_logic.py stat math (TDD RED) | fd859e3 | 17 failing tests committed first |
| 2 | game_logic.py stat math (TDD GREEN) | 3b7b742 | All 17 tests pass |
| 3 | Extend models.py + schemas.py | 14be774 | UserSchema, QuestSave, QuestCreate, QuestSchema updated |

---

## Alembic Migration Details

**Revision ID:** `06a41e12f90c`
**Parent:** `b74c083b2140` (add_auth_fields)
**Applied:** Yes — `alembic upgrade head` ran cleanly; round-trip `downgrade -1 && upgrade head` also verified clean.

**Columns added to `users`:**
```
stat_strength_level   INTEGER NOT NULL DEFAULT 1
stat_strength_xp      INTEGER NOT NULL DEFAULT 0
stat_wisdom_level     INTEGER NOT NULL DEFAULT 1
stat_wisdom_xp        INTEGER NOT NULL DEFAULT 0
stat_endurance_level  INTEGER NOT NULL DEFAULT 1
stat_endurance_xp     INTEGER NOT NULL DEFAULT 0
stat_charisma_level   INTEGER NOT NULL DEFAULT 1
stat_charisma_xp      INTEGER NOT NULL DEFAULT 0
```

**Column added to `quests`:**
```
category  VARCHAR  (nullable, no default — existing rows keep NULL)
```

---

## models.py Stat Column Line Ranges

For Plan 04-02 reference:
- `User.stat_*` columns: lines 30-38 in `backend/app/models.py` (after `gems` on line 29)
- `Quest.category`: line 67 in `backend/app/models.py` (after `hp_penalty`)

---

## GET /api/user/me stat fields

Stat fields served **automatically** via `ConfigDict(from_attributes=True)` in `UserSchema`. No router changes needed — the ORM populates stat_* attrs from DB, Pydantic picks them up. Verified:
```
python -c "from app import schemas; u = schemas.UserSchema(...); print(u.stat_strength_level)"
# prints: 1
```

---

## game_logic.py Exports

| Export | Type | Description |
|--------|------|-------------|
| `QuestCategory` | `Literal[...]` | Type alias for 4 quest categories |
| `StatName` | `Literal[...]` | Type alias for 4 stat names |
| `CATEGORY_TO_STAT` | `dict` | work→endurance, fitness→strength, learning→wisdom, social→charisma |
| `STAT_GROWTH` | `dict` | easy→1, medium→2, hard→4, epic→8 |
| `max_xp_for_level(level)` | function | Returns XP threshold for next level (10 * 1.2^(lvl-1)) |
| `apply_stat_xp(user, stat, gain)` | function | Mutates user in-place, returns result dict |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

All created files confirmed on disk:
- FOUND: backend/migrations/versions/06a41e12f90c_add_character_stats.py
- FOUND: backend/app/utils/game_logic.py
- FOUND: backend/tests/__init__.py
- FOUND: backend/tests/test_game_logic.py

All task commits confirmed in git log:
- bd33ed3: feat(04-01): add_character_stats alembic migration
- fd859e3: test(04-01): add failing tests for game_logic stat math primitives
- 3b7b742: feat(04-01): implement game_logic stat math primitives (GREEN)
- 14be774: feat(04-01): extend User/Quest models and schemas for character stats
