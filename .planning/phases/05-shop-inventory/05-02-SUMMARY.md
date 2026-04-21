---
phase: 05-shop-inventory
plan: 02
subsystem: testing
tags: [python, pytest, game-logic, tdd, boosts, multipliers]

# Dependency graph
requires:
  - phase: 04-character-stats
    provides: "game_logic.py with apply_stat_xp, StubUser pattern in test_game_logic.py"
provides:
  - "MAX_ACTIVE_QUESTS = 5 constant in game_logic.py"
  - "effective_multipliers(user, now) pure function with lazy expiry semantics"
  - "effective_max_hp(user, now) pure function"
  - "conftest.py with StubShopItem and StubInventoryItem shared fixtures"
  - "Wave 0 test scaffolds for shop and inventory routers (Plan 03/04 fill in)"
affects:
  - 05-03-PLAN (shop router tests use StubShopItem from conftest)
  - 05-04-PLAN (inventory router tests use StubInventoryItem from conftest)
  - 05-05-PLAN (quest completion router uses effective_multipliers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED-GREEN-REFACTOR: failing import triggers RED; implementation makes GREEN"
    - "Lazy expiry: boost active iff expires_at is strictly greater than now"
    - "Wave 0 scaffolds: pass-only tests as placeholders before actual router tests"
    - "getattr with default None: safe attr access for nullable ORM fields in pure functions"

key-files:
  created:
    - backend/tests/conftest.py
    - backend/tests/test_shop_router.py
    - backend/tests/test_inventory_router.py
  modified:
    - backend/app/utils/game_logic.py
    - backend/tests/test_game_logic.py

key-decisions:
  - "Lazy expiry: exp > now (strictly greater) means expires_at == now is treated as expired — prevents 1-second edge case exploitation"
  - "BOOST_MULT_TYPES tuple drives effective_multipliers generically — adding a new boost type requires only updating this tuple"
  - "StubUser class-level defaults with nullable override per test — clean, no fixture overhead"
  - "Wave 0 scaffold pattern: pass-only tests ensure file structure exists before Plan 03/04 implement actual logic"

patterns-established:
  - "effective_multipliers uses getattr(user, f'active_{btype}_mult', None) for safe ORM field access without import coupling"
  - "StubUser extended with all Phase 5 boost attrs as class-level None defaults"
  - "conftest.py holds cross-plan stub classes; test files hold test functions only"

requirements-completed:
  - SHOP-02
  - SHOP-03
  - INV-02

# Metrics
duration: 12min
completed: 2026-04-21
---

# Phase 05 Plan 02: Phase 5 Game Logic Helpers Summary

**TDD-implemented effective_multipliers, effective_max_hp, and MAX_ACTIVE_QUESTS pure functions with lazy expiry semantics, plus Wave 0 test scaffolds and shared conftest fixtures for shop/inventory**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-21T04:15:39Z
- **Completed:** 2026-04-21T04:27:00Z
- **Tasks:** 3 (RED, GREEN, Wave 0 scaffolds; REFACTOR skipped — no redundancy)
- **Files modified:** 5

## Accomplishments
- Implemented 3 new exports in `game_logic.py`: `MAX_ACTIVE_QUESTS`, `effective_multipliers`, `effective_max_hp`
- 10 new test cases for Phase 5 helpers, all passing; total suite grows from 17 to 40 tests
- Created `conftest.py` with `StubShopItem` and `StubInventoryItem` shared across Plan 03/04
- Created Wave 0 scaffolds `test_shop_router.py` (2 pass stubs) and `test_inventory_router.py` (3 pass stubs)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Failing tests for Phase 5 helpers** - `a511809` (test)
2. **Task 2: GREEN — Implement effective_multipliers, effective_max_hp, MAX_ACTIVE_QUESTS** - `f6dde2c` (feat)
3. **Task 3: Wave 0 scaffolds — conftest + test_shop_router + test_inventory_router** - `91bc495` (test)

_Note: TDD tasks have explicit test (RED) then feat (GREEN) commits. REFACTOR step skipped — implementation was clean._

## Files Created/Modified
- `backend/app/utils/game_logic.py` — Added `MAX_ACTIVE_QUESTS`, `BOOST_MULT_TYPES`, `effective_multipliers`, `effective_max_hp`
- `backend/tests/test_game_logic.py` — Extended `StubUser` with 14 nullable boost attrs; added 10 Phase 5 test cases
- `backend/tests/conftest.py` — New: `StubShopItem` and `StubInventoryItem` shared fixtures
- `backend/tests/test_shop_router.py` — New: Wave 0 scaffold (2 pass stubs for Plan 03)
- `backend/tests/test_inventory_router.py` — New: Wave 0 scaffold (3 pass stubs for Plan 04)

## Decisions Made
- Lazy expiry semantics: `exp > now` (strictly greater than) — `expires_at == now` is treated as expired. Prevents edge-case where a boost at exact expiry moment is still applied.
- `BOOST_MULT_TYPES` tuple drives `effective_multipliers` generically via `getattr` — adding a new boost type in Plan 01's migration only requires adding its key to this tuple.
- Wave 0 scaffold pattern chosen over skipping files — Plans 03/04 reference these files by path; creating them now prevents import errors during parallel development.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (shop router) can import `StubShopItem` from `conftest.py` and fill in `test_shop_router.py`
- Plan 04 (inventory router) can import `StubInventoryItem` from `conftest.py` and fill in `test_inventory_router.py`
- Plan 05 (quest completion) can import `effective_multipliers` from `game_logic.py` — signature: `effective_multipliers(user, now: datetime) -> dict`
- All prior Phase 4 tests continue to pass (40 total tests green)

---
*Phase: 05-shop-inventory*
*Completed: 2026-04-21*

## Self-Check: PASSED
- FOUND: backend/app/utils/game_logic.py
- FOUND: backend/tests/test_game_logic.py
- FOUND: backend/tests/conftest.py
- FOUND: backend/tests/test_shop_router.py
- FOUND: backend/tests/test_inventory_router.py
- FOUND: .planning/phases/05-shop-inventory/05-02-SUMMARY.md
- Commits verified: a511809, f6dde2c, 91bc495
