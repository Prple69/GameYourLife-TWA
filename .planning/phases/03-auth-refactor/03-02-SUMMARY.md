---
phase: 03-auth-refactor
plan: "02"
subsystem: backend
tags: [fastapi, jwt, auth-endpoints, telegram-widget, routers]

requires:
  - phase: 03-auth-refactor/03-01 (auth utilities, User schema fields, migration, get_current_user)

provides:
  - "POST /api/auth/register (email+password -> tokens, logs email-verify stub)"
  - "POST /api/auth/login (email+password -> tokens, dummy-hash timing-safe)"
  - "POST /api/auth/refresh (refresh token -> new access, same refresh)"
  - "POST /api/auth/telegram-login (Login Widget HMAC + auth_date freshness + AUTH-06 lookup)"
  - "POST /api/auth/verify-email?token=... (itsdangerous stub decoder)"
  - "All /api/user/* and /api/quests/* endpoints behind Depends(get_current_user)"
  - "verify_telegram_init_data deleted — only get_current_user in dependencies.py"

affects:
  - "03-03 (frontend) — now consumes real /api/auth endpoints"

tech-stack:
  added: []  # All deps already installed in 03-01
  patterns:
    - "Dummy bcrypt hash path in /api/auth/login keeps CPU time constant regardless of whether the email exists"
    - "Pydantic model_dump() copy for HMAC validation (don't pop from the original)"
    - "User profile router uses user.id for all queries — email-only users (no tg_id) work natively"
    - "Stateless refresh endpoint returns same refresh_token (rotation deferred to Phase 11)"

key-files:
  created:
    - backend/app/routers/__init__.py
    - backend/app/routers/auth.py
    - backend/app/routers/quests.py
  modified:
    - backend/app/crud.py (update_user_avatar_by_id added)
    - backend/app/dependencies.py (verify_telegram_init_data deleted)
    - backend/app/main.py (slimmed to CORS + routers + /api/health)
  deleted:
    - backend/routers/__init__.py (stale empty package at wrong layer)

key-decisions:
  - "Kept URL paths identical to Phase 1 (/api/user/me, /api/quests/*, /api/analyze). The auth mechanism swapped but the surface didn't — frontend migration in Plan 03-03 only touches the auth header."
  - "Telegram-login validates auth_date freshness at 300s cutoff. Plan suggested 5 min; Telegram's docs recommend the same."
  - "verify_telegram_init_data import is gone; docstring mentions remain in auth.py/dependencies.py/main.py so future readers understand why get_current_user replaced it."
  - "update_user_avatar_by_id added alongside the legacy tg_id-based version — the old one is still callable but no router uses it any more."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05 (stub), AUTH-06]

duration: ~45min
completed: 2026-04-18
---

# Phase 3 Plan 02: Auth Endpoints + JWT Migration

**Backend is fully JWT-native. Telegram initData is gone; email/password, Telegram Login Widget, and refresh flows all return access+refresh pairs. Every existing endpoint runs through Depends(get_current_user).**

## Task Commits

1. Task 1 (auth router) + Task 2 (quests router) + Task 3 (main.py slim, dep cleanup, smoke) — shipped in single feat commit (backend refactor is atomic).

## Verification (curl against local server)

| Check | Result |
|-------|--------|
| GET /api/health | 200 `{"status":"ok","phase":"03"}` |
| GET /api/user/me without Authorization | 401 `Missing or invalid Authorization header` |
| POST /api/auth/register (fresh email) | 200 + access/refresh tokens |
| POST /api/auth/register (duplicate email) | 400 `Email already registered` |
| POST /api/auth/login (correct creds) | 200 + tokens |
| POST /api/auth/login (wrong password) | 401 `Invalid email or password` |
| GET /api/user/me with Bearer access | 200 + full user profile (telegram_id null, email populated) |
| POST /api/auth/refresh with valid refresh | 200 + new access + same refresh |
| GET /api/user/me using refresh token as Bearer | 401 (type-check rejects refresh on access routes) |

Telegram-login not exercised via curl (requires valid Login Widget signature). Validator unit-tested via the `validate_telegram_login_widget` smoke from Plan 03-01.

## Deviations from Plan

- Plan Task 2 sample code imported `select` inside each function; final version imports once at module top and reuses a shared `_fail_overdue_quests` helper (called from both `/api/quests/me` and `/api/user/me/status`).
- Plan Task 3 sample main.py used `import database` (relative); shipped version uses `from app import database` — consistent with Phase 1 package-style imports and what `uvicorn app.main:app` needs.
- Removed stale `backend/routers/__init__.py` at the wrong package layer (not in app/). Git sees this as a rename into `backend/app/routers/__init__.py`.

## Next Plan Readiness

- Plan 03-03 (frontend) can now:
  - POST /api/auth/register — wire from RegisterPage form
  - POST /api/auth/login — wire from LoginPage form
  - POST /api/auth/refresh — wire from axios interceptor (on 401 with refresh available)
  - POST /api/auth/telegram-login — wire from Login Widget callback
  - Remove the Phase 2 `[DEV] Войти без auth →` bypass link
  - Swap legacy X-Telegram-Init-Data interceptor for Authorization: Bearer

---
*Phase: 03-auth-refactor*
*Completed: 2026-04-18*
