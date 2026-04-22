---
phase: 06-ai-daily-quests
plan: 02
subsystem: api
tags: [fastapi, redis, openai, pydantic, pytest, caching, daily-quests]

# Dependency graph
requires:
  - phase: 06-01
    provides: cache.py (Redis pool), DailySuggestion/DailySuggestionsResponse schemas in schemas.py, get_quest_history in crud.py
provides:
  - GET /api/daily/suggestions — Redis-cached LLM quest suggestions (3/day)
  - POST /api/daily/accept/{index} — creates Quest from suggestion, removes from cache
  - POST /api/daily/reroll/{index} — replaces one suggestion, enforces 2/day cap
  - StubRedis in conftest.py for in-memory Redis testing
  - 9 unit tests covering AI-01 and AI-02 behaviors
affects: [06-03-frontend, future-leaderboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Redis TTL-scoped daily cache pattern (daily:{user_id}:{YYYY-MM-DD}, TTL = seconds until MSK midnight)
    - INCR-based atomic reroll counter with EXPIRE on first increment
    - TDD with RED (failing import) → GREEN (implement) cycle for router unit tests
    - StubRedis pattern for async Redis method testing without docker

key-files:
  created:
    - backend/app/routers/daily.py
    - backend/tests/test_daily_router.py
  modified:
    - backend/app/main.py
    - backend/tests/conftest.py

key-decisions:
  - "Use asyncio.run() in sync tests for StubRedis instead of pytest-asyncio — avoids new dependency, consistent with existing test suite pattern"
  - "Query quests directly by user.id with sqlalchemy select() rather than crud.get_quest_history() — avoids tg_id legacy dependency for history lookup"
  - "FALLBACK_SUGGESTIONS returns copies of hardcoded dicts (list(FALLBACK_SUGGESTIONS)) to avoid shared mutation between requests"

patterns-established:
  - "Redis daily key pattern: daily:{user_id}:{YYYY-MM-DD} with _seconds_until_midnight_msk() TTL"
  - "Reroll counter: INCR + EXPIRE on first increment, read before increment to check cap"
  - "LLM fallback: return list(FALLBACK_SUGGESTIONS) on any exception, validate with DailySuggestion.model_validate()"

requirements-completed: [AI-01, AI-02]

# Metrics
duration: 2min
completed: 2026-04-22
---

# Phase 06 Plan 02: Daily Suggestions Router Summary

**FastAPI daily quest router with Redis-cached LLM suggestions, atomic reroll counter, and 9 unit tests using in-memory StubRedis**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-22T03:51:40Z
- **Completed:** 2026-04-22T03:53:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `daily.py` router with 3 endpoints covering the full accept/reroll flow
- Wired Redis lifespan (init/close) into `main.py` alongside router registration
- 9 unit tests pass covering AI-01 (caching, fallback, TTL) and AI-02 (history formatting, category diversity)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backend/app/routers/daily.py with 3 endpoints** - `d444989` (feat)
2. **Task 2: Wire daily router into main.py + write unit tests** - `c991d25` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/app/routers/daily.py` - 3 endpoints: GET /api/daily/suggestions, POST /api/daily/accept/{index}, POST /api/daily/reroll/{index}; FALLBACK_SUGGESTIONS constant; _generate_suggestions_llm helper
- `backend/app/main.py` - Added cache import, daily router import, init_redis/close_redis in lifespan
- `backend/tests/test_daily_router.py` - 9 unit tests for AI-01 and AI-02 behaviors using StubRedis
- `backend/tests/conftest.py` - Added StubRedis class with get/setex/delete/incr/expire async methods

## Decisions Made

- Used `asyncio.run()` in sync tests for StubRedis async methods — avoids adding pytest-asyncio dependency; all existing tests are synchronous and this matches the project pattern
- Queried quests directly by `user.id` using `select(models.Quest).filter(models.Quest.user_id == user.id)` instead of `crud.get_quest_history()` — the crud function uses legacy `tg_id` param which Phase 3 users may not have; direct query is cleaner and avoids identity mapping issues
- `list(FALLBACK_SUGGESTIONS)` used in `_generate_suggestions_llm` to return a fresh copy — prevents shared mutation if a caller modifies the returned list

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Redis URL must be set in `.env` as `REDIS_URL` (established in Plan 06-01).

## Next Phase Readiness

- All 3 daily endpoints registered and tested: ready for frontend integration (Plan 06-03)
- Redis lifespan managed in `main.py` — endpoints fail gracefully at request-time if Redis is unavailable
- Full test suite: 65 tests passing, no regressions

---
*Phase: 06-ai-daily-quests*
*Completed: 2026-04-22*
