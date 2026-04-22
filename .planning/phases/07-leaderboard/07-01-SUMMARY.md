---
phase: 07-leaderboard
plan: "01"
subsystem: api
tags: [redis, leaderboard, pydantic, sorted-set, domain-logic, unit-tests]

# Dependency graph
requires:
  - phase: 06-ai-daily-quests
    provides: StubRedis in conftest.py; asyncio.run() test pattern; app.models.User ORM shape
  - phase: 05-shop-inventory
    provides: schemas.py pattern with ConfigDict(from_attributes=True); Phase 5 shop schemas
provides:
  - backend/app/leaderboard.py: domain logic (score_for, update, get_top, get_me, seed_if_empty)
  - backend/app/schemas.py: LeaderboardEntryResponse, LeaderboardResponse, LeaderboardMeResponse
  - backend/tests/conftest.py: StubRedis sorted set ops (zadd, zrevrange, zrevrank, zcard, exists)
  - backend/tests/test_leaderboard.py: 12 unit tests for domain logic
affects: [07-02-router, 07-03-frontend, 07-04-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composite float score encoding: lvl*1e12 + xp*1e6 - id for Redis ZSET rank ordering"
    - "Graceful Redis degradation: all leaderboard functions catch Exception, log warning, never raise"
    - "asyncio.run() test pattern for async domain functions (no pytest-asyncio dependency)"
    - "Monkeypatching crud.get_user_by_id in test module for isolation without DB"

key-files:
  created:
    - backend/app/leaderboard.py
    - backend/tests/test_leaderboard.py
  modified:
    - backend/app/schemas.py
    - backend/tests/conftest.py

key-decisions:
  - "Score formula lvl*1e12 + xp*1e6 - id: float64-safe (15 sig figs covers lvl<1000, xp<1M, id<1M), encodes lvl DESC + xp DESC + id ASC in a single float"
  - "StubRedis sorted set ops added to existing conftest.py rather than a new fixture file — keeps all stubs centralized per project convention"
  - "asyncio.run() test pattern maintained for Phase 7 (no pytest-asyncio) — consistent with Phase 6 decision"
  - "Monkeypatching crud_mod.get_user_by_id in each test with try/finally for isolation — avoids pytest fixtures that could leave module state dirty"

patterns-established:
  - "Domain module pattern: leaderboard.py is self-contained, testable without router or wiring"
  - "Neighbor calculation: start_idx=max(0, rank_idx-5), end_idx=min(total-1, rank_idx+5) — bounds-safe +-5 window"

requirements-completed: [LEAD-01, LEAD-02]

# Metrics
duration: 15min
completed: 2026-04-22
---

# Phase 7 Plan 01: Leaderboard Domain Module Summary

**Redis ZSET leaderboard domain module with float64-safe composite score encoding (lvl*1e12+xp*1e6-id), graceful degradation, and 12 unit tests covering all behaviors**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-22T00:00:00Z
- **Completed:** 2026-04-22T00:15:00Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments

- Created `backend/app/leaderboard.py` with 5 exported functions covering all leaderboard operations
- Added 3 Pydantic response schemas to `schemas.py` with `ConfigDict(from_attributes=True)`
- Extended `StubRedis` in `conftest.py` with 5 sorted set methods (zadd, zrevrange, zrevrank, zcard, exists)
- 12 unit tests pass covering score encoding, graceful Redis errors, rank calculation, neighbor window, and seed logic
- Full test suite: 77 tests pass, 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add leaderboard Pydantic schemas and extend StubRedis** - `a6ef446` (feat)
2. **Task 2: Create backend/app/leaderboard.py domain module with unit tests** - `c388939` (feat)

## Files Created/Modified

- `backend/app/leaderboard.py` - Domain logic: score_for, update, get_top, get_me, seed_if_empty
- `backend/tests/test_leaderboard.py` - 12 unit tests for all domain behaviors
- `backend/app/schemas.py` - Added LeaderboardEntryResponse, LeaderboardResponse, LeaderboardMeResponse
- `backend/tests/conftest.py` - Extended StubRedis with sorted set operations and _zsets internal storage

## Decisions Made

- Score formula `lvl*1e12 + xp*1e6 - id` chosen for float64 safety (15 significant figures, covers realistic game values: lvl<1000, xp<1M, id<1M). Single float encodes three-tier sort in one ZADD call.
- StubRedis extended in existing conftest.py (not a new file) — maintains project convention of centralized stubs.
- asyncio.run() pattern maintained (no pytest-asyncio) — consistent with Phase 6 decision to avoid new test dependencies.
- Monkeypatching crud_mod.get_user_by_id with try/finally blocks in each test — clean isolation without leaving module state dirty between tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Domain module is fully isolated and importable — ready for Plan 02 (router wiring)
- StubRedis sorted set ops enable testing router layer without real Redis
- Schemas are ready for router response serialization
- No blockers

---
*Phase: 07-leaderboard*
*Completed: 2026-04-22*
