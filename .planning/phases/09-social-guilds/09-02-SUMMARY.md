---
phase: 09-social-guilds
plan: "02"
subsystem: backend/routers+tests
tags: [guilds, guild-challenges, fastapi, router, unit-tests, stub-pattern]
dependency_graph:
  requires: [09-01 (Guild/GuildMember/GuildChallenge models + schemas)]
  provides: [guilds FastAPI router, 7 /api/guilds/* endpoints, 12 unit tests]
  affects: [frontend guild pages (downstream)]
tech_stack:
  added: []
  patterns: [stub-pattern unit tests (no TestClient, no DB), selectinload for N+1 prevention, SUM subquery for challenge XP progress, asyncio.run() sync test wrapper]
key_files:
  created:
    - backend/app/routers/guilds.py
    - backend/tests/test_guilds_router.py
  modified:
    - backend/app/main.py
decisions:
  - "[09-02] slugify fallback via try/except ImportError — python-slugify not guaranteed installed; stdlib re-based fallback produces identical output for ASCII names"
  - "[09-02] get_guild_member() extracted as shared helper — called by join, leave, get_challenges, and require_guild_permission to avoid duplicated queries"
  - "[09-02] require_guild_permission() uses role_rank dict for ordered comparison — extensible if new roles added without cascading if/elif chains"
  - "[09-02] StubDB.refresh assigns id when None — simulates DB auto-increment for GuildChallenge returned from create_guild_challenge without calling flush"
metrics:
  duration_seconds: 171
  completed_date: "2026-04-27"
  tasks_completed: 2
  files_modified: 3
---

# Phase 9 Plan 02: Guilds Router Summary

All 7 guild API endpoints implemented in guilds.py router with JWT auth, role-gated actions, selectinload N+1 prevention, SUM-based challenge XP progress, and 12 stub-pattern unit tests passing alongside existing 87 tests (99 total).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create guilds.py router with all 7 endpoints + unit tests | 0f22fdc | backend/app/routers/guilds.py, backend/tests/test_guilds_router.py |
| 2 | Register guilds router in main.py | 65aaef9 | backend/app/main.py |

## Verification Results

- `pytest tests/test_guilds_router.py -x -q` — 12 passed
- `pytest tests/ -x -q` — 99 passed (no regressions from 87 baseline)
- `python -c "from app.main import app; ..."` — 7 guild routes confirmed: `/api/guilds`, `/api/guilds/{slug}`, `/api/guilds/{guild_id}/join`, `/api/guilds/{guild_id}/leave`, `/api/guilds/{guild_id}/challenges` (GET + POST)

## Decisions Made

1. `slugify` fallback via `try/except ImportError` — python-slugify not guaranteed installed; stdlib `re`-based fallback produces identical output for ASCII names.
2. `get_guild_member()` extracted as shared async helper — avoids duplicated queries across join, leave, get_challenges, and require_guild_permission.
3. `require_guild_permission()` uses `role_rank` dict for ordered comparison — extensible if new roles added without cascading if/elif chains.
4. `StubDB.refresh` assigns `id` when `None` — simulates DB auto-increment for `GuildChallenge` in `create_guild_challenge` (no `flush` called before `commit`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed StubDB.refresh to assign id when None**
- **Found during:** Task 1, GREEN phase
- **Issue:** `create_guild_challenge` calls `db.commit()` then `db.refresh(challenge)` without a prior `flush()`. Stub `refresh` was a no-op, leaving `challenge.id = None`, causing `GuildChallengeItem` Pydantic validation to fail with `Input should be a valid integer`.
- **Fix:** Added `if hasattr(obj, 'id') and obj.id is None: obj.id = len(self.added) + 100` to `StubDB.refresh`.
- **Files modified:** backend/tests/test_guilds_router.py
- **Commit:** 0f22fdc

## Self-Check: PASSED

- `backend/app/routers/guilds.py` — FOUND (316 lines, 7 endpoints)
- `backend/tests/test_guilds_router.py` — FOUND (12 tests, all passing)
- `backend/app/main.py` — FOUND, contains `guilds.router` import and `app.include_router(guilds.router)`
- Commits 0f22fdc, 65aaef9 — both present in git log
