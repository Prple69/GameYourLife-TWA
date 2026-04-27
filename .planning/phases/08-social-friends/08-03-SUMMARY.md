---
phase: 08-social-friends
plan: 03
subsystem: ui
tags: [react, tailwind, friends, social, axios, debounce]

# Dependency graph
requires:
  - phase: 08-social-friends
    plan: 02
    provides: "6 REST endpoints for friends: search, request, pending, accept, delete, list+activity"
provides:
  - "FriendsPage.jsx: full friends UI with search, tabs, friend list, activity feed"
  - "FriendSearchBar.jsx: debounced search with dropdown results"
  - "FriendCard.jsx: single friend entry with avatar, name, level, delete"
  - "FriendActivityFeed.jsx: quest completion activity feed with relative timestamps"
  - "friendsService.js: axios api wrapper for all 6 friends endpoints"
  - "/app/friends route in App.jsx"
  - "ДРУЗЬЯ nav link in Navigation.jsx bottom tabs"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "friendsService uses ./api import (co-located in src/services/) — same import pattern as dailyService/leaderboardService"
    - "FriendSearchBar uses useRef debounce (300ms) — same pattern as existing search components"
    - "FriendsPage uses useCallback for loadFriends/loadPending — same pattern as LeaderboardPage fetchData"

key-files:
  created:
    - frontend/src/pages/FriendsPage.jsx
    - frontend/src/components/FriendCard.jsx
    - frontend/src/components/FriendActivityFeed.jsx
    - frontend/src/components/FriendSearchBar.jsx
    - frontend/src/services/friendsService.js
  modified:
    - frontend/src/App.jsx
    - frontend/src/components/Navigation.jsx

key-decisions:
  - "Used leaderIcon as placeholder for ДРУЗЬЯ tab — no friends icon in assets; label differentiates it"
  - "friendsService import path is ./api (not ../api) — api.js is co-located in src/services/"

patterns-established:
  - "Service files in src/services/ import api from ./api (same directory) — not ../api"

requirements-completed: [SOCL-01, SOCL-02]

# Metrics
duration: 5min
completed: 2026-04-27
---

# Phase 8 Plan 03: Friends UI Summary

**React Friends page with debounced search, send/accept/reject/delete request flows, friend list with activity feed, and ДРУЗЬЯ nav tab — wired to all 6 backend endpoints via friendsService**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-27T03:17:34Z
- **Completed:** 2026-04-27T03:22:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created `friendsService.js` wrapping all 6 friends API endpoints using the shared axios instance
- Built `FriendSearchBar.jsx` with 300ms debounce and dropdown results list
- Built `FriendCard.jsx` with avatar initial, display_name, level, delete button
- Built `FriendActivityFeed.jsx` showing quest completions with relative timestamps
- Created `FriendsPage.jsx` (143 lines) with search, friends/pending tabs, activity feed, inline error messages
- Added `/app/friends` lazy route to `App.jsx` and `ДРУЗЬЯ` nav tab to `Navigation.jsx`
- `npm run build` passes cleanly (FriendsPage-BMoi0HYK.js, 8.05 kB gzipped 2.62 kB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create friendsService and friend components** - `f80c9a6` (feat)
2. **Task 2: Add FriendsPage, wire routing and navigation** - `c7d7afb` (feat)

## Files Created/Modified
- `frontend/src/services/friendsService.js` - axios wrapper: searchUsers, sendRequest, getPending, acceptRequest, deleteRequest, getFriends
- `frontend/src/components/FriendSearchBar.jsx` - debounced search input with dropdown, calls searchUsers
- `frontend/src/components/FriendCard.jsx` - friend entry with avatar initial, display_name, level, delete button
- `frontend/src/components/FriendActivityFeed.jsx` - activity list with formatTime (just now / Xh ago / Xd ago)
- `frontend/src/pages/FriendsPage.jsx` - main page: search, friends/pending tabs, activity feed, message banner
- `frontend/src/App.jsx` - added lazy FriendsPage + `/app/friends` route
- `frontend/src/components/Navigation.jsx` - added ДРУЗЬЯ tab (leaderIcon placeholder, to: /app/friends)

## Decisions Made
- Used `leaderIcon` as placeholder icon for ДРУЗЬЯ nav tab — no dedicated friends icon exists in `src/assets/icons/`; the text label differentiates it visually
- `friendsService.js` import path is `./api` (not `../api`) — `api.js` is co-located in `src/services/`, not in parent directory

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect import path in friendsService.js**
- **Found during:** Task 2 (npm run build)
- **Issue:** Plan specified `import api from '../api'` but `api.js` lives in `src/services/api.js` (same directory as `friendsService.js`). Rollup build failed: "Could not resolve '../api'".
- **Fix:** Changed import to `import api from './api'` — correct relative path for co-located file
- **Files modified:** `frontend/src/services/friendsService.js`
- **Verification:** `npm run build` completed successfully after fix
- **Committed in:** `c7d7afb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong import path)
**Impact on plan:** Essential fix for build to pass. No scope creep.

## Issues Encountered
- Plan's code sample used `../api` but project convention (confirmed from other services like `dailyService`, `leaderboardService`) has all services in `src/services/` importing from `./api` — auto-fixed inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Friends feature is fully complete: backend (08-01/08-02) + frontend (08-03) all implemented
- SOCL-01 (search + send request) and SOCL-02 (accept, delete, list, activity feed) requirements met
- Phase 08-social-friends complete — ready for next phase

---
*Phase: 08-social-friends*
*Completed: 2026-04-27*
