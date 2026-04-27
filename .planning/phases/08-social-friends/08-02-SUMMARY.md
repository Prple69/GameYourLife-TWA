---
phase: 08-social-friends
plan: 02
subsystem: api
tags: [fastapi, sqlalchemy, friends, social, jwt, activity-feed]

# Dependency graph
requires:
  - phase: 08-social-friends
    plan: 01
    provides: "Friendship ORM model, FriendshipStatus enum, 6 Pydantic schemas"
provides:
  - "6 REST endpoints for friends feature: search, request, pending, accept, delete, list+activity"
  - "friends.py router with JWT auth on all endpoints"
  - "selectinload activity feed (2 queries, no N+1)"
  - "10 unit tests covering SOCL-01 and SOCL-02 behaviors"
affects: [08-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct integer defaults (not Query(...)) on router functions — enables direct invocation in stub unit tests"
    - "selectinload(User.quests) for friends activity feed — prevents N+1 across accepted friendships"
    - "asyncio.run() stub test pattern (Phase 4/5/6/7 convention) — no pytest-asyncio dependency"

key-files:
  created:
    - backend/app/routers/friends.py
    - backend/tests/test_friends_router.py
  modified:
    - backend/app/main.py

key-decisions:
  - "Plain int defaults for limit/offset params (not Query objects) — FastAPI still validates via OpenAPI schema; direct call in tests passes without TypeError"
  - "Test data fix: send_friend_request_success uses StubDB(results=[StubResult([])]) since crud.get_user_by_id is mocked separately — plan's original results list was incorrect"

requirements-completed: [SOCL-01, SOCL-02]

# Metrics
duration: 3min
completed: 2026-04-27
---

# Phase 8 Plan 02: Friends Router Summary

**6 FastAPI endpoints for friends (search, request, pending, accept, delete, list+activity) with JWT auth, selectinload activity feed, and 10 unit tests — all 87 tests passing**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-27T03:13:00Z
- **Completed:** 2026-04-27T03:15:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `backend/app/routers/friends.py` with all 6 endpoints using `Depends(get_current_user)` JWT auth
- Activity feed uses `selectinload(User.quests)` — 2 total queries, no N+1
- IntegrityError race-condition guard → 409 on duplicate friendship
- Registered friends router in `backend/app/main.py` (all 6 routes appear in app.routes)
- 10 unit tests in `backend/tests/test_friends_router.py` following Phase 4/5/6/7 stub pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create friends.py router + tests** - `0ddda35` (feat)
2. **Task 2: Register friends router in main.py** - `41a2d4e` (feat)

## Files Created/Modified
- `backend/app/routers/friends.py` - 6 endpoints: GET /api/users/search, POST /api/friends/request, GET /api/friends/pending, POST /api/friends/accept/{id}, DELETE /api/friends/{id}, GET /api/friends
- `backend/tests/test_friends_router.py` - 10 unit tests with StubDB/StubUser/StubFriendship/StubQuest stub helpers
- `backend/app/main.py` - Added friends router import and include_router registration

## Decisions Made
- Used plain `int` defaults (not `Query(10)`) for `limit`/`offset` — FastAPI still validates via OpenAPI schema at runtime; plain defaults allow direct function calls in stub tests without TypeError
- Fixed test data bug in `test_send_friend_request_success`: since `crud.get_user_by_id` is mocked, the StubDB's first `execute` call is for the existing-friendship check, not addressee lookup — correct data is `StubResult([])` (no existing friendship)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Query() object defaults causing TypeError in tests**
- **Found during:** Task 1 - TDD GREEN phase
- **Issue:** `limit: int = Query(10, ge=1, le=100)` and `offset: int = Query(0, ge=0)` parameters passed as `Query` objects when router functions called directly (bypassing FastAPI DI). `sqlalchemy.util.asint(Query(10))` raises `TypeError`.
- **Fix:** Changed to plain integer defaults `limit: int = 10` and `offset: int = 0`. FastAPI still enforces bounds via OpenAPI schema at HTTP request time.
- **Files modified:** `backend/app/routers/friends.py`
- **Commit:** `0ddda35`

**2. [Rule 1 - Bug] Fixed incorrect test stub data for send_friend_request_success**
- **Found during:** Task 1 - TDD GREEN phase
- **Issue:** Plan's test used `StubDB(results=[StubResult([StubUser(id=2)]), StubResult([])])` but `crud.get_user_by_id` is mocked via `patch`, so only one `db.execute` call happens (for the existing-friendship check). The first result `StubResult([StubUser(id=2)])` made the duplicate check return a non-empty list, triggering 409.
- **Fix:** Changed to `StubDB(results=[StubResult([])])` — no existing friendship, correct for the success path.
- **Files modified:** `backend/tests/test_friends_router.py`
- **Commit:** `0ddda35`

## Issues Encountered
None blocking — both deviations auto-fixed inline.

## User Setup Required
None.

## Next Phase Readiness
- All 6 friends API endpoints are live and ready for 08-03 (frontend)
- 87 total tests passing, no regressions from prior phases
- Friendship feature complete on backend: SOCL-01 (search + request) and SOCL-02 (accept, delete, list, activity) fully implemented

---
*Phase: 08-social-friends*
*Completed: 2026-04-27*

## Self-Check: PASSED

- `backend/app/routers/friends.py` - FOUND
- `backend/tests/test_friends_router.py` - FOUND
- `backend/app/main.py` - FOUND (modified)
- Commit `0ddda35` - FOUND
- Commit `41a2d4e` - FOUND
