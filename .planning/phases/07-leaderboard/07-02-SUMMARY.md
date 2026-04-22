---
phase: 07-leaderboard
plan: "02"
subsystem: api
tags: [leaderboard, fastapi, router, lifespan, crud, redis]

# Dependency graph
requires:
  - phase: 07-01
    provides: leaderboard.py domain module (get_top, get_me, update, seed_if_empty); LeaderboardResponse/MeResponse/EntryResponse schemas
  - phase: 06-ai-daily-quests
    provides: daily.py router pattern; cache._redis_client module-level client; AsyncSessionLocal in database.py
provides:
  - backend/app/routers/leaderboard.py: HTTP endpoints GET /api/leaderboard and GET /api/leaderboard/me
  - backend/app/main.py: router mount + lifespan seed_if_empty hook
  - backend/app/crud.py: add_reward extended with leaderboard.update call after db.commit()
affects: [07-03-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy local import in crud.add_reward (from app import cache as _cache, leaderboard as _leaderboard) avoids circular import"
    - "leaderboard_router alias: import router module as leaderboard_router to avoid shadowing leaderboard domain module"
    - "Graceful degradation in add_reward: skip update if _redis_client is None, log warning on exception"
    - "Lifespan try/except around seed_if_empty: extra safety in case AsyncSessionLocal itself fails"

key-files:
  created:
    - backend/app/routers/leaderboard.py
  modified:
    - backend/app/main.py
    - backend/app/crud.py

key-decisions:
  - "Lazy local import inside try block in crud.add_reward — avoids circular import (crud -> leaderboard -> crud) without restructuring module graph"
  - "leaderboard_router alias in main.py — allows both the domain module (leaderboard) and router module (leaderboard_router) to coexist without name collision"
  - "Extra try/except around seed_if_empty lifespan call — seed_if_empty is itself graceful but AsyncSessionLocal construction could fail in extreme cases"

# Metrics
duration: ~2min
completed: 2026-04-22
---

# Phase 7 Plan 02: Leaderboard Router Wiring Summary

**FastAPI router with GET /api/leaderboard and GET /api/leaderboard/me mounted in main.py; crud.add_reward extended to sync Redis ZSET after every XP change**

## Performance

- **Duration:** ~2 min
- **Completed:** 2026-04-22
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments

- Created `backend/app/routers/leaderboard.py` with two JWT-protected endpoints following the daily.py exemplar pattern
- GET /api/leaderboard: offset/limit pagination with Query validation (ge=0 / ge=1 le=100), returns LeaderboardResponse
- GET /api/leaderboard/me: returns user rank + +-5 neighbors as LeaderboardMeResponse
- Updated `main.py` to import and mount the router and call leaderboard.seed_if_empty in the lifespan startup hook
- Extended `crud.add_reward` with leaderboard ZSET sync after every XP/level change (graceful: skips if Redis not initialized)
- Added `logging` import and module-level logger to `crud.py`
- All 77 backend tests pass, no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create leaderboard router** - `6bff751` (feat)
2. **Task 2: Wire router into main.py and extend crud.add_reward** - `cd3fccc` (feat)

## Files Created/Modified

- `backend/app/routers/leaderboard.py` - Two leaderboard endpoints with JWT auth and Redis/DB dependencies
- `backend/app/main.py` - Import leaderboard module + router, mount router, seed_if_empty in lifespan
- `backend/app/crud.py` - Added logger; leaderboard.update call after db.commit() in add_reward

## Decisions Made

- Lazy local import (`from app import cache as _cache, leaderboard as _leaderboard`) inside try block in crud.add_reward — avoids circular dependency without changing the module structure.
- `leaderboard_router` alias in main.py — allows `leaderboard` to refer to the domain module (for seed_if_empty) and `leaderboard_router` to the router subpackage (for router mount).
- Extra try/except wrapping seed_if_empty in lifespan — seed_if_empty never raises internally, but AsyncSessionLocal construction could fail in extreme startup conditions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Both leaderboard endpoints are live and JWT-protected — ready for Plan 03 (frontend integration)
- ZSET stays in sync via add_reward hook — data will be fresh for frontend display
- seed_if_empty runs on startup — no manual Redis population needed
- No blockers

---
*Phase: 07-leaderboard*
*Completed: 2026-04-22*
