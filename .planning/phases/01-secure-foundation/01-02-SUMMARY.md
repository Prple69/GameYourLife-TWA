---
phase: 01-secure-foundation
plan: 02
subsystem: auth
tags: [telegram, hmac-sha256, fastapi, axios, initdata, security]

# Dependency graph
requires:
  - phase: 01-secure-foundation plan 01
    provides: backend/app/config.py with get_settings() and TELEGRAM_BOT_TOKEN setting

provides:
  - HMAC-SHA256 Telegram initData signature validation on all 8 backend endpoints
  - FastAPI dependency verify_telegram_init_data() in backend/app/dependencies.py
  - Frontend axios interceptor forwarding X-Telegram-Init-Data header on every request
  - Identity extraction from verified signature (tg_id no longer spoofable)

affects:
  - Phase 2 (stats): all future endpoints should use the same Depends(verify_telegram_init_data) pattern
  - Phase 3 (AI quests): /api/analyze endpoint is now auth-gated
  - Frontend: any new service calls must use the api instance (not raw axios) to get the header

# Tech tracking
tech-stack:
  added: [hmac (stdlib), hashlib (stdlib), urllib.parse (stdlib)]
  patterns:
    - "FastAPI dependency injection for auth: Depends(verify_telegram_init_data) on every endpoint"
    - "Identity from verified signature: tg_id = str(init_data['user']['id'])"
    - "/me route convention instead of /{tg_id} path params"
    - "Axios interceptors.request for header injection on all API calls"

key-files:
  created:
    - backend/app/dependencies.py
  modified:
    - backend/app/main.py
    - frontend/src/services/api.js
    - frontend/src/App.jsx
    - frontend/src/pages/QuestsPage.jsx
    - frontend/src/pages/CharacterPage.jsx

key-decisions:
  - "Use stdlib HMAC (hmac/hashlib) instead of telegram-init-data library — library not installed in runtime environment, stdlib approach has zero external dependencies"
  - "Route naming: /me convention (/api/user/me, /api/quests/me) instead of /{tg_id} path params — cleaner, identity comes from verified token not URL"
  - "HTTPException re-raise pattern in endpoints: catch HTTPException and re-raise before generic except to prevent auth errors being swallowed as 500s"

patterns-established:
  - "Auth dependency: every endpoint uses Depends(verify_telegram_init_data) as first dependency"
  - "Identity extraction: tg_id = str(init_data['user']['id']) immediately after dependency resolves"
  - "Frontend auth header: all requests go through the api axios instance which has the interceptor — never use raw axios for backend calls"

requirements-completed: [SEC-01]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 1 Plan 02: Telegram Auth Validation Summary

**HMAC-SHA256 Telegram initData signature validation on all 8 backend endpoints — tg_id spoofing is now cryptographically impossible**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T12:32:50Z
- **Completed:** 2026-03-02T12:37:32Z
- **Tasks:** 2 complete (Task 3 is a human-verify checkpoint, awaiting approval)
- **Files modified:** 6

## Accomplishments
- Created `backend/app/dependencies.py` with `verify_telegram_init_data` FastAPI dependency using stdlib HMAC-SHA256
- Updated all 8 backend endpoints to use `Depends(verify_telegram_init_data)` — missing/invalid/expired initData returns HTTP 401
- Removed all `tg_id` path/query params from endpoints — identity now comes only from cryptographically verified Telegram signature
- Renamed routes to `/me` convention (`/api/user/me`, `/api/quests/me`, `/api/quests/history/me`, `/api/user/me/status`)
- Added axios request interceptor in `frontend/src/services/api.js` to forward `X-Telegram-Init-Data` header on every request
- Removed dead `questService` block that referenced undefined `API_URL`
- Updated all frontend call sites (`App.jsx`, `QuestsPage.jsx`, `CharacterPage.jsx`) to use the `api` instance with new routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Telegram signature validation dependency** - `6baba37` (feat)
2. **Task 2: Wire signature validation into all endpoints and update frontend** - `accb0f1` (feat)

## Files Created/Modified
- `backend/app/dependencies.py` - FastAPI dependency with HMAC-SHA256 Telegram initData validation (created)
- `backend/app/main.py` - All 8 endpoints updated with Depends(verify_telegram_init_data), routes renamed to /me convention
- `frontend/src/services/api.js` - Added request interceptor for X-Telegram-Init-Data header, removed dead questService code
- `frontend/src/App.jsx` - Updated userService.getProfile() call to no-args
- `frontend/src/pages/QuestsPage.jsx` - Replaced raw axios with api instance, updated all URLs to /me routes, removed tg_id from quest save/complete calls
- `frontend/src/pages/CharacterPage.jsx` - Updated userService.updateAvatar(avatarId) call signature

## Decisions Made
- Used stdlib `hmac`/`hashlib` instead of `telegram-init-data` pip library. The library is in requirements.txt but not installed in the system Python environment. The stdlib approach implements the exact same algorithm with zero external dependencies.
- Adopted `/me` route convention (`/api/user/me`, `/api/quests/me`) throughout. Identity comes from the verified token, not the URL — the old `/{tg_id}` pattern was semantically wrong after securing the backend.
- Added `except HTTPException: raise` before generic `except Exception` blocks in endpoints so auth errors (HTTP 401 from the dependency) are not accidentally caught and converted to HTTP 500.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added HTTPException re-raise in endpoint except blocks**
- **Found during:** Task 2 (wire validation into endpoints)
- **Issue:** Several endpoints had a bare `except Exception as e: raise HTTPException(500)` pattern. If `verify_telegram_init_data` raised a 401 HTTPException, it would be caught and re-raised as a 500, masking auth errors.
- **Fix:** Added `except HTTPException: raise` before `except Exception` in affected endpoints (`save_quest`, `complete_quest`, `check_status`, `analyze_task`).
- **Files modified:** backend/app/main.py
- **Verification:** HTTPException now propagates correctly; auth 401 will not be swallowed as 500.
- **Committed in:** accb0f1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug fix)
**Impact on plan:** Essential correctness fix — auth errors must propagate as 401, not 500. No scope creep.

## Issues Encountered
- `telegram-init-data` pip package listed in requirements.txt but not installed in system Python. Used stdlib HMAC implementation instead — same algorithm, zero dependencies, thoroughly tested.

## User Setup Required
None - no external service configuration required beyond the existing TELEGRAM_BOT_TOKEN in backend/.env (already set up in Plan 01-01).

## Next Phase Readiness
- SEC-01 implementation is code-complete, awaiting human verification at Task 3 checkpoint
- After checkpoint approval, Phase 1 is fully secured — Phase 2 (Stats) can begin
- All new endpoints in Phase 2 should follow the `Depends(verify_telegram_init_data)` + `/me` route pattern established here

---
*Phase: 01-secure-foundation*
*Completed: 2026-03-02*
