---
phase: 03-auth-refactor
plan: "03"
subsystem: frontend
tags: [react, auth, jwt, telegram-widget, react-query, zustand]

requires:
  - phase: 03-auth-refactor/03-02 (real auth endpoints + JWT on all routes)

provides:
  - "authStore without mock token — accessToken null on fresh install"
  - "api.js 401->refresh interceptor with promise queue (race-safe)"
  - "Functional LoginPage with email/password form + Telegram Login Widget"
  - "Functional RegisterPage with display_name/email/password form"
  - "VerifyEmailPage stub wired to /api/auth/verify-email"
  - "CharacterPage + QuestsPage fetch their own data via useQuery (no prop dependency)"

affects:
  - "Phase 4 (Stats): can add stat fields to UserSchema/useQuery ['user'] selectors without touching page structure"
  - "Phase 11 (SMTP): VerifyEmailPage flow is already in place — only backend token delivery changes"

tech-stack:
  added: []
  patterns:
    - "Shared refreshPromise in api.js: concurrent 401s share one /api/auth/refresh call"
    - "React-Query optimistic updates: setQueryData on user avatar change, rollback on error"
    - "Telegram Login Widget loaded dynamically via script tag, callback registered on window before script append"
    - "useQuery / useMutation / queryClient.invalidateQueries for cross-page data consistency"

key-files:
  modified:
    - frontend/src/stores/authStore.js
    - frontend/src/services/api.js
    - frontend/.env.example
    - frontend/src/pages/auth/LoginPage.jsx
    - frontend/src/pages/auth/RegisterPage.jsx
    - frontend/src/App.jsx
    - frontend/src/pages/CharacterPage.jsx
    - frontend/src/pages/QuestsPage.jsx
  created:
    - frontend/src/pages/auth/VerifyEmailPage.jsx

key-decisions:
  - "refreshPromise (plain module-level let) vs axios-auth-refresh library — the native pattern is ~30 lines, zero extra dependency, and easier to debug. Library would add a full package for the same logic."
  - "Register/login/refresh endpoints are SKIPPED by the 401 interceptor — a 401 from /api/auth/login on wrong password must be surfaced to the form, not trigger a refresh loop."
  - "QuestsPage uses local optimisticTasks for the AI-analyzing quest card so users see the 'rolling value' animation before the server responds; on success/failure we invalidate ['quests'] so the final row arrives from the server."
  - "CharacterPage uses useQueryClient.setQueryData for optimistic avatar updates — snappier UI than a full refetch and still rolls back on error."
  - "Telegram Login Widget script loads only when VITE_TELEGRAM_BOT_USERNAME is set — in dev without a bot, the form-only flow still works and we show a hint about the env var."
  - "Removed background videos entirely from QuestsPage/CharacterPage — the `videos` prop was never populated after the web pivot and the video assets were never added; silently dropping keeps the page lightweight."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05 (stub), AUTH-06]

duration: ~45min
completed: 2026-04-18
---

# Phase 3 Plan 03: Frontend Auth Wiring

**Frontend is plugged into the real backend: users can register, log in (email or Telegram), navigate the app with Bearer tokens, and have their session silently refreshed when the access token expires. The Phase 2 DEV bypass is gone.**

## Task Commits

1. `1e58816` — feat(03-03): drop mock token, add 401->refresh interceptor with promise queue
2. `b48370d` — feat(03-03): wire Login/Register forms, Telegram Login Widget, VerifyEmail
3. `228dc82` — feat(03-03): QuestsPage and CharacterPage fetch own data via useQuery

## End-to-End Verification (Playwright + Chromium)

| Test | Result |
|------|--------|
| GET /register form renders (display_name/email/password inputs) | ✅ |
| Submit register (PlaywrightHero / playwright@test.com / playwrightpw123) | 200 redirect to /app/quests |
| localStorage `auth-storage` contains accessToken + refreshToken + isAuthenticated=true | ✅ |
| CharacterPage renders real data: "РЫЦАРЬ СМЕРТИ / LVL 1 / HP 100/100 / XP 0/100" | ✅ |
| QuestsPage renders empty quest list ("СПИСОК КОНТРАКТОВ ПУСТ" + "+ НОВЫЙ КОНТРАКТ") | ✅ |
| Wrong password on /login shows red "Invalid email or password", stays on /login | ✅ |
| Correct password on /login redirects to /app/quests | ✅ |
| Cross-route navigation retains session (tokens in localStorage) | ✅ |
| 0 console errors on authenticated pages (1 expected 401 from deliberate wrong-password test) | ✅ |

## Deviations from Plan

- **No explicit Telegram Login Widget live test** — requires a real bot username. The widget-loading code path is in place but not executed in smoke (env var unset). Manual QA by the user with a real bot is the final validation of Test 8 from the plan.
- Background video block removed from QuestsPage/CharacterPage. Plan said "videos prop can be replaced with hardcoded or removed if not shown" — chose to remove entirely since no assets existed.
- Removed `triggerHaptic` calls in QuestsPage/CharacterPage (was from Telegram WebApp SDK — dead code after the web pivot).

## Phase 3 Success Criteria — All Met

1. ✅ POST /api/auth/register creates user and returns tokens
2. ✅ POST /api/auth/login returns 15-min access + 30-day refresh tokens
3. ✅ POST /api/auth/telegram-login validates Login Widget HMAC and finds/creates user (code path wired; live test requires bot setup)
4. ✅ All protected endpoints (/api/user/me, /api/quests/*, /api/analyze) run through Depends(get_current_user)
5. ✅ verify_telegram_init_data and @twa-dev/sdk are fully removed
6. ✅ Alembic baseline stamped; add_auth_fields migration applied; 5 new columns + nullable telegram_id
7. ✅ Existing telegram_id users flow through get_user_by_tg_id lookup in /api/auth/telegram-login (AUTH-06)

## User Setup Required

- For real Telegram Login in production: add `VITE_TELEGRAM_BOT_USERNAME=GameYourLifeBot` (or actual bot name) to `frontend/.env`, then the widget button on /login will load.
- For dev email flow: works out of the box against the existing DB (bcrypt + PyJWT + itsdangerous all installed, JWT_SECRET_KEY in `backend/.env`).

## Next Phase Readiness

- Phase 3 closes the auth milestone. Phase 4 (Character Stats) can begin.
- Phase 11 (Production Polish) will replace the console log in `routers/auth.py::register` with real SMTP (aiosmtplib + Yandex 360 or equivalent). No other Phase-3 code needs changing.

---
*Phase: 03-auth-refactor*
*Completed: 2026-04-18*
