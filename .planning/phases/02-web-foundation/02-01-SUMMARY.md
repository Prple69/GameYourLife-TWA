---
phase: 02-web-foundation
plan: "01"
subsystem: frontend
tags: [react-router, zustand, tanstack-query, twa-removal, routing, stores]
dependency_graph:
  requires: []
  provides:
    - frontend/src/stores/authStore.js
    - frontend/src/stores/userStore.js
    - frontend/src/stores/cookieConsentStore.js
    - frontend/src/hooks/useMediaQuery.js
    - frontend/src/components/layout/ProtectedRoute.jsx
    - frontend/src/App.jsx (routing skeleton)
    - frontend/.env.example
  affects:
    - All downstream plans (02-02, 02-03) that need routing and stores
tech_stack:
  added:
    - react-router-dom@6.30.3
    - zustand@4.5.7
    - "@tanstack/react-query@5.99.0"
  patterns:
    - Zustand persist store with onRehydrateStorage for hydration guard
    - Bearer token interceptor on axios instance
    - Lazy-loaded route pages via React.lazy + Suspense
    - ProtectedRoute HOC with useLocation for returnTo redirect
key_files:
  created:
    - frontend/.env.example
    - frontend/src/stores/authStore.js
    - frontend/src/stores/userStore.js
    - frontend/src/stores/cookieConsentStore.js
    - frontend/src/hooks/useMediaQuery.js
    - frontend/src/components/layout/ProtectedRoute.jsx
    - frontend/src/pages/NotFoundPage.jsx
  modified:
    - frontend/package.json (remove @twa-dev/sdk, add react-router-dom/zustand/react-query)
    - frontend/index.html (remove telegram-web-app.js script tag, update title)
    - frontend/src/services/api.js (Bearer interceptor, VITE_API_BASE_URL)
    - frontend/src/main.jsx (QueryClientProvider + BrowserRouter wrapping)
    - frontend/src/App.jsx (pure Routes tree, _hasHydrated guard, no TWA code)
decisions:
  - Phase 2 mock token (DEV_MOCK_TOKEN) pre-populated in authStore so ProtectedRoute passes without real auth
  - Nested Routes inside /app element is a temporary scaffold; Plan 02-03 replaces with AppLayout + Outlet
  - NotFoundPage used as placeholder for all unimplemented routes (login, register, legal)
  - CookieConsentBanner already existed in src/components/; included in main.jsx render tree
metrics:
  duration: "185 seconds (approx 3 minutes)"
  completed: "2026-04-18"
  tasks: 2
  files: 12
---

# Phase 02 Plan 01: Web Foundation — Stores, Routing, TWA Removal Summary

**One-liner:** Replaced Telegram Mini App SDK with React Router v6 + Zustand v4 + TanStack Query v5, wired routing skeleton with lazy pages and Zustand persist stores.

---

## What Was Built

### Task 1: Dependencies, index.html, api.js, Stores, Hook

- **package.json:** Removed `@twa-dev/sdk@8.0.2`. Added `react-router-dom@^6`, `zustand@^4`, `@tanstack/react-query@^5`.
- **index.html:** Deleted `<script src="https://telegram.org/js/telegram-web-app.js">`. Updated `<title>` to "Game Your Life".
- **frontend/.env.example:** Created with `VITE_API_BASE_URL=http://localhost:8000/api`.
- **src/services/api.js:** Rewrote — Bearer token interceptor reading from `useAuthStore.getState().accessToken`, dynamic `baseURL` from `import.meta.env.VITE_API_BASE_URL`.
- **src/stores/authStore.js:** Zustand persist store with `_hasHydrated` flag, mock token pre-populated for Phase 2, `setTokens`/`clearTokens` actions.
- **src/stores/userStore.js:** Simple Zustand store for `user` object.
- **src/stores/cookieConsentStore.js:** Zustand persist store for cookie consent state (`null | 'accepted' | 'minimal'`).
- **src/hooks/useMediaQuery.js:** Custom hook returning boolean for CSS media query match with event listener cleanup.

### Task 2: main.jsx, App.jsx, ProtectedRoute, NotFoundPage

- **src/main.jsx:** Rewrote to wrap App in `QueryClientProvider` + `BrowserRouter`. CookieConsentBanner (already existing) also rendered at root level.
- **src/App.jsx:** Pure Routes tree with `_hasHydrated` guard (prevents flicker on page reload), lazy-loaded `/app/*` pages, placeholder routes for login/register/legal using `NotFoundPage`.
- **src/components/layout/ProtectedRoute.jsx:** HOC that redirects to `/login?returnTo=` when `isAuthenticated` is false.
- **src/pages/NotFoundPage.jsx:** Retro 404 page with "Press Start 2P" font and "ВЕРНУТЬСЯ" link.

---

## Verification Results

- `npm run build` exits 0 — all 1857 modules transformed successfully
- `grep -r "window.Telegram" frontend/src/` — no results
- `grep -r "X-Telegram-Init-Data" frontend/src/` — no results
- All store files exist with correct default exports
- `npm list react-router-dom zustand @tanstack/react-query` confirms all three versions installed
- `@twa-dev/sdk` not found in package.json

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CookieConsentBanner in main.jsx**
- **Found during:** Task 2 commit
- **Issue:** An external process modified main.jsx to import `CookieConsentBanner` from `./components/CookieConsentBanner`. This component already existed in the project from prior work.
- **Fix:** Accepted the modification — CookieConsentBanner.jsx exists and the build succeeds with it included. This is a forward-compatible change that Plan 02-02 would have added anyway.
- **Files modified:** frontend/src/main.jsx
- **Commit:** 86c695c (included in Task 2 commit)

---

## Self-Check: PASSED

- All 12 files verified present on disk
- Commits c3381a7 and 86c695c confirmed in git log
- Build output: "built in 2.98s" with exit code 0
