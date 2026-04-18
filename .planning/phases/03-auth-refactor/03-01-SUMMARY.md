---
phase: 03-auth-refactor
plan: "01"
subsystem: backend
tags: [fastapi, alembic, jwt, bcrypt, telegram-widget]

requires:
  - phase: 02-web-foundation (frontend ready to accept JWT flow)

provides:
  - "backend/app/auth.py — JWT issue/verify, bcrypt hashing, Telegram Login Widget HMAC"
  - "Extended User model: email, password_hash, email_verified_at, display_name, gems; telegram_id nullable"
  - "5 new auth schemas: Token, RegisterRequest, LoginRequest, TelegramLoginRequest, RefreshRequest"
  - "5 new CRUD functions: get_user_by_id, get_user_by_email, create_user_email, create_user_telegram, update_user_email_verified"
  - "get_current_user FastAPI dependency (reads Bearer JWT, returns User)"
  - "Alembic environment: baseline stamped + add_auth_fields applied"
  - "Empty /api/auth router registered in main.py (Plan 03-02 fills it)"

affects:
  - "03-02 — will implement auth endpoints on the registered /api/auth router"
  - "03-02 — will migrate /api/user/me, /api/quests/* from verify_telegram_init_data to Depends(get_current_user)"
  - "03-03 — frontend will call new endpoints"

tech-stack:
  added:
    - "PyJWT==2.8.0"
    - "passlib==1.7.4 + bcrypt==4.0.1 (bcrypt pinned for passlib compat)"
    - "python-multipart==0.0.9, itsdangerous==2.2.0, email-validator==2.1.0"
  patterns:
    - "Alembic env.py swaps postgresql+asyncpg:// -> postgresql:// for sync migration driver (psycopg2 reused)"
    - "Alembic baseline stamped (not applied) — empty upgrade/downgrade for existing-DB case"
    - "get_current_user uses verify_token(expected_type='access') to reject refresh tokens on protected routes"
    - "User.gems has NOT NULL server_default='0' — safe for existing rows"

key-files:
  created:
    - backend/app/auth.py
    - backend/alembic.ini
    - backend/migrations/env.py
    - backend/migrations/script.py.mako
    - backend/migrations/versions/fa4573e2e0b9_baseline.py
    - backend/migrations/versions/b74c083b2140_add_auth_fields.py
  modified:
    - backend/requirements.txt
    - backend/.env.example (JWT_SECRET_KEY + JWT_ALGORITHM)
    - backend/.env (real JWT_SECRET_KEY generated locally)
    - backend/app/config.py
    - backend/app/models.py
    - backend/app/schemas.py
    - backend/app/crud.py
    - backend/app/dependencies.py
    - backend/app/main.py

key-decisions:
  - "Use package-style imports (from app.X import Y) — consistent with Phase 1 pattern. Rejected uncommitted working-copy changes that had stripped the `app.` prefix (would break `uvicorn app.main:app`)."
  - "Pin bcrypt to 4.0.1 — passlib 1.7.4 crashes on bcrypt >=4.1 with `module bcrypt has no attribute __about__`. Pin silences the warning and keeps hash output identical."
  - "verify_token takes optional expected_type — makes refresh tokens unusable on access-only routes without a second key."
  - "Alembic baseline uses `alembic stamp head` not `alembic upgrade` — DB already has Phase 1 tables, re-creation would fail."
  - "gems column NOT NULL server_default='0' so existing rows auto-populate — avoids a separate UPDATE backfill step."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-06]
# AUTH-05 (email verification) covered by create_email_verification_token / verify_email_token utilities; Phase 11 adds real SMTP.

duration: ~30min
completed: 2026-04-18
---

# Phase 3 Plan 01: Backend Auth Foundation

**Shipped the backend primitives that Plan 03-02 will compose into real /api/auth endpoints and JWT-protected routes. No user-visible change yet — existing Telegram-initData flow still works.**

## Task Commits

1. `16df9f4` — feat(03-01): add JWT/bcrypt/Telegram-Widget auth utilities
2. `0726c3e` — feat(03-01): extend User model, schemas, CRUD for email/password auth
3. (current) — feat(03-01): init Alembic, apply auth-fields migration, add get_current_user

## Verification

- `python -c "from app.auth import create_access_token, verify_token; ..."` — access/refresh round-trip + type-check mismatch rejection ✓
- `hash_password / verify_password` round-trip (bcrypt 12 rounds, no warning) ✓
- `User.email / password_hash / email_verified_at / display_name / gems` importable; `telegram_id` nullable in DB ✓
- `from app import crud; crud.get_user_by_id / get_user_by_email / create_user_email / create_user_telegram / update_user_email_verified` ✓
- `alembic current` → `b74c083b2140 (head)` ✓
- `information_schema.columns` for `users` — all 5 new columns present, `gems` NOT NULL default 0 ✓
- Backend boots cleanly, `GET /api/health` → `{"status":"ok","phase":"03"}` 200 ✓
- Legacy `/api/user/me` still returns 401 without `X-Telegram-Init-Data` header ✓

## Deviations from Plan

- Plan Step B suggested a 2-step Alembic flow (generate baseline, manually empty upgrade body, stamp, generate add_auth_fields). Actual execution:
  1. First `alembic revision --autogenerate -m baseline` produced the full delta (because models already diverged from DB).
  2. Deleted that file, hand-wrote an empty `fa4573e2e0b9_baseline.py`, `alembic stamp head`.
  3. `alembic revision --autogenerate -m add_auth_fields` then produced the right delta.
  4. `alembic upgrade head` applied it.
  Outcome matches plan intent: baseline is no-op, add_auth_fields is the delta.
- Added `bcrypt==4.0.1` explicit pin (plan didn't mention it) — needed because passlib[bcrypt] pulls latest bcrypt which is incompatible with passlib 1.7.4.
- `verify_token` gained optional `expected_type` parameter — lets protected routes reject refresh tokens without duplicating JWT secrets.

## Production TODO

- Generate a real 32-byte-hex JWT_SECRET_KEY for prod env (local .env has one already).
- Rotate JWT_SECRET_KEY by key-kid support before first production rotation event (Phase 11).

## Next Plan Readiness

- `/api/auth` router is registered (empty). Plan 03-02 must add: register, login, refresh, logout, telegram-login, verify-email.
- `get_current_user` is ready. Plan 03-02 will swap `verify_telegram_init_data` → `get_current_user` on all existing protected endpoints and delete the legacy dep.
- No blockers.

---
*Phase: 03-auth-refactor*
*Completed: 2026-04-18*
