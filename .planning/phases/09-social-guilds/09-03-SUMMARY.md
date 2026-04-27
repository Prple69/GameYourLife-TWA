---
phase: 09-social-guilds
plan: "03"
subsystem: frontend/components+pages+services
tags: [guilds, react, jsx, tailwind, guildsService, GuildCard, GuildDetailView, GuildCreateForm, ChallengeCard, GuildsPage, routing]

dependency_graph:
  requires:
    - phase: 09-02
      provides: "7 /api/guilds/* FastAPI endpoints (list, get, create, join, leave, get_challenges, create_challenge)"
  provides:
    - guildsService.js with 7 API methods (listGuilds, getGuild, createGuild, joinGuild, leaveGuild, getChallenges, createChallenge)
    - GuildCard component (guild list item with join button)
    - GuildCreateForm component (controlled form with client-side validation)
    - ChallengeCard component (challenge card with XP progress bar)
    - GuildDetailView component (detail panel with members list, role badges, challenges tab, join/leave/owner flow)
    - GuildsPage page (orchestrator: list + detail + create form with state management)
    - /app/guilds route wired in App.jsx with Guilds navigation link
  affects: []

tech-stack:
  added: []
  patterns:
    - guildsService mirrors friendsService pattern (axios instance from api.js, named export)
    - GuildsPage manages all async state (guilds list, selected guild detail, challenges, loading, error) in a single page component
    - Promise.all for parallel detail + challenges fetch on guild open
    - Owner leave button is disabled span with tooltip (not a button) — no accidental leave for owners
    - ChallengeCard computes daysLeft from end_date at render time (no backend field needed)

key-files:
  created:
    - frontend/src/services/guildsService.js
    - frontend/src/components/GuildCard.jsx
    - frontend/src/components/GuildCreateForm.jsx
    - frontend/src/components/ChallengeCard.jsx
    - frontend/src/components/GuildDetailView.jsx
    - frontend/src/pages/GuildsPage.jsx
  modified:
    - frontend/src/App.jsx

key-decisions:
  - "[09-03] guildsService mirrors friendsService pattern — named export, same api.js axios instance, consistent with Phase 8"
  - "[09-03] Promise.all([getGuild, getChallenges]) with catch fallback for challenges — guild detail still opens even if challenges endpoint 403/empty"
  - "[09-03] Owner leave button rendered as disabled <span> with title tooltip — prevents accidental ownership abandonment; consistent with must_haves spec"
  - "[09-03] GuildsPage holds all async state locally — no global store; guilds list + selected detail + challenges co-located for simple join/leave/create refresh"

patterns-established:
  - "Service pattern: all API calls via service module (guildsService), no inline fetch/axios in components"
  - "Detail panel pattern: click card -> parallel fetch detail + related data -> render inline panel with back button"

requirements-completed: [SOCL-03, SOCL-04, GUILD-01, GUILD-02]

duration: ~15min
completed: "2026-04-27"
---

# Phase 9 Plan 03: Guilds Frontend Summary

**5 React components + guildsService + App.jsx routing deliver /app/guilds: paginated guild list, member/role detail panel, join/leave/owner flow, create-guild form with client validation, and challenge progress bars — all wired to live backend API.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-27
- **Completed:** 2026-04-27
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 7

## Accomplishments

- Complete guilds frontend layer: GuildsPage (/app/guilds) renders paginated guild list with GuildCard items and join buttons
- Guild detail view shows member list with role badges (Владелец/Офицер/Участник), join/leave/owner-disabled flows, and active challenges with XP progress bars via ChallengeCard
- Create-guild form with client-side name validation (min 3 chars), API 409 error surfacing, and immediate navigation to created guild detail

## Task Commits

Each task was committed atomically:

1. **Task 1: guildsService + GuildCard + GuildCreateForm + ChallengeCard** - `51ade93` (feat)
2. **Task 2: GuildDetailView + GuildsPage + App.jsx routing** - `8161aaf` (feat)
3. **Task 3: Human verify — guilds list, detail, join-flow, challenges** - checkpoint approved by user

## Files Created/Modified

- `frontend/src/services/guildsService.js` - 7 API methods mirroring friendsService pattern (listGuilds, getGuild, createGuild, joinGuild, leaveGuild, getChallenges, createChallenge)
- `frontend/src/components/GuildCard.jsx` - Guild list card with name, member count, join button (disabled when already member)
- `frontend/src/components/GuildCreateForm.jsx` - Controlled form with name (min 3 chars) + description, API error display
- `frontend/src/components/ChallengeCard.jsx` - Challenge card with XP progress bar (current_xp/target_xp), days-remaining computed at render
- `frontend/src/components/GuildDetailView.jsx` - Detail panel: member list with role badges, join/leave buttons, owner disabled span with tooltip, challenges tab (members-only)
- `frontend/src/pages/GuildsPage.jsx` - Main page: manages guild list + selected detail + challenges + create form; parallel fetch on guild open; refresh list after join/leave/create
- `frontend/src/App.jsx` - Added GuildsPage import, /app/guilds route, Guilds navigation link

## Decisions Made

1. guildsService mirrors friendsService pattern — named export, same api.js axios instance, consistent with Phase 8.
2. Promise.all([getGuild, getChallenges]) with .catch fallback for challenges — guild detail still opens even if challenges endpoint returns 403 or empty.
3. Owner leave button rendered as disabled `<span>` with title tooltip — prevents accidental ownership abandonment; matches must_haves spec requirement.
4. GuildsPage holds all async state locally — no global store; guilds list + selected detail + challenges co-located for simple join/leave/create refresh cycles.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification Results

- Human-verify checkpoint (Task 3) — **approved by user**
- All 6 frontend files exist: guildsService.js, GuildCard.jsx, GuildCreateForm.jsx, ChallengeCard.jsx, GuildDetailView.jsx, GuildsPage.jsx
- App.jsx contains GuildsPage import and /app/guilds route
- Guilds navigation link added to app navigation

## Next Phase Readiness

Phase 09-social-guilds is complete. All 3 plans (DB foundation, backend router, frontend) are delivered:
- 09-01: Guild/GuildMember/GuildChallenge ORM models + Alembic migration + 7 Pydantic schemas
- 09-02: 7 /api/guilds/* FastAPI endpoints + 12 unit tests
- 09-03: Complete frontend layer (this plan)

Requirements SOCL-03, SOCL-04, GUILD-01, GUILD-02 fulfilled.

---
*Phase: 09-social-guilds*
*Completed: 2026-04-27*
