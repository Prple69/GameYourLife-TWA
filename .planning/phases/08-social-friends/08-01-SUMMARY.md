---
phase: 08-social-friends
plan: 01
subsystem: database
tags: [sqlalchemy, alembic, pydantic, postgres, friendship, social]

# Dependency graph
requires:
  - phase: 05-shop-inventory
    provides: "Alembic migration c203bdcc4819 as down_revision base; InventoryItem/UniqueConstraint patterns"
provides:
  - "Friendship ORM model with UNIQUE(requester_id, addressee_id) and CASCADE deletes"
  - "FriendshipStatus enum (pending/accepted)"
  - "Alembic migration 49ecd4b23ffe creating friendships table"
  - "6 Pydantic schemas: UserSearchResult, FriendListItem, ActivityFeedItem, FriendsResponse, FriendRequestOut, PendingRequestItem"
affects: [08-02-PLAN.md, 08-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-written Alembic migration (no autogenerate) to avoid spurious drop_index calls — Phase 4/5 pattern maintained"
    - "FriendshipStatus as str+enum.Enum for Pydantic serialization compatibility"

key-files:
  created:
    - backend/migrations/versions/49ecd4b23ffe_add_friendships.py
  modified:
    - backend/app/models.py
    - backend/app/schemas.py

key-decisions:
  - "Hand-wrote migration 49ecd4b23ffe (no autogenerate) — avoids spurious drop_index calls per Phase 4/5 pattern"
  - "No SQLAlchemy relationship() backrefs on User model — router queries directly, avoids circular import risk"
  - "FriendshipStatus inherits str+enum.Enum — enables direct Pydantic serialization without custom validator"

patterns-established:
  - "Friendship FK pattern: ForeignKey('users.id', ondelete='CASCADE') on both requester_id and addressee_id"
  - "Migration Enum type name: 'friendshipstatus' (lowercase class name) for PostgreSQL compatibility"

requirements-completed: [SOCL-01, SOCL-02]

# Metrics
duration: 2min
completed: 2026-04-27
---

# Phase 8 Plan 01: Social Friends DB Foundation Summary

**Friendship SQLAlchemy model with UNIQUE(requester_id, addressee_id) + CASCADE, Alembic migration 49ecd4b23ffe, and 6 Pydantic response schemas for the friends API**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-27T02:49:18Z
- **Completed:** 2026-04-27T02:51:42Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added FriendshipStatus enum and Friendship ORM model to models.py with proper constraints and CASCADE deletes
- Created hand-written Alembic migration (49ecd4b23ffe) following existing Phase 4/5 pattern, down_revision points to c203bdcc4819
- Added 6 Pydantic schemas to schemas.py (UserSearchResult, FriendListItem, ActivityFeedItem, FriendsResponse, FriendRequestOut, PendingRequestItem)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Friendship model to models.py** - `a3d5b0f` (feat)
2. **Task 2: Hand-write Alembic migration for friendships table** - `7139ae2` (feat)
3. **Task 3: Add Pydantic schemas for friends API** - `5f7b0bf` (feat)

## Files Created/Modified
- `backend/app/models.py` - Added FriendshipStatus enum + Friendship ORM model; added `import enum` and `Enum` to sqlalchemy imports
- `backend/migrations/versions/49ecd4b23ffe_add_friendships.py` - New Alembic migration creating friendships table with indexes and constraints
- `backend/app/schemas.py` - Added 6 Phase 8 friends schemas at end of file

## Decisions Made
- Hand-wrote migration (no autogenerate) — consistent with Phase 4/5 pattern to avoid spurious drop_index calls
- No SQLAlchemy `relationship()` backrefs added to User model — router will query directly, avoiding circular import risk
- FriendshipStatus inherits `str, enum.Enum` for direct Pydantic serialization compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Friendship ORM model and migration are ready for 08-02 (friends router)
- Pydantic schemas are defined and match expected router response_model annotations
- All 77 existing tests continue to pass — no regressions

---
*Phase: 08-social-friends*
*Completed: 2026-04-27*
