---
phase: 02-web-foundation
plan: "03"
subsystem: ui
tags: [react, react-router, layout, landing, auth-shells, responsive]

# Dependency graph
requires:
  - phase: 02-web-foundation/02-01
    provides: BrowserRouter in main.jsx, useMediaQuery, authStore, ProtectedRoute, LoadingPage, NotFoundPage
  - phase: 02-web-foundation/02-02
    provides: PrivacyPage, TermsPage, OfferPage, CookieConsentBanner

provides:
  - "AppLayout — responsive wrapper with Outlet, Sidebar on ≥1024px, Navigation bottom-tabs below"
  - "Sidebar — desktop navigation (256px fixed left, NavLink-driven active state)"
  - "Navigation — migrated to React Router NavLink (no activeTab/setActiveTab props)"
  - "Landing page at / with 6 sections (Hero, Demo, Features, Pricing, FAQ, Footer)"
  - "LoginPage and RegisterPage shell forms (disabled inputs, dev bypass link to /app/quests)"
  - "App.jsx final route tree replacing 02-01 scaffold"

affects:
  - "Phase 3 auth refactor — will replace shell Login/Register forms with real email + Telegram flows"
  - "Phase 3 data layer — per-page data fetching will replace the current placeholder guards on pages without character prop"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Router v6 Outlet pattern for nested layouts"
    - "useMediaQuery-driven conditional render of Sidebar vs Navigation"
    - "NavLink isActive for active-tab styling (no URL parsing)"
    - "Conditional render of <video> elements guarded by truthy videos?.X source (fixes empty src warning)"

key-files:
  created:
    - frontend/src/components/layout/AppLayout.jsx
    - frontend/src/components/layout/Sidebar.jsx
    - frontend/src/pages/auth/LoginPage.jsx
    - frontend/src/pages/auth/RegisterPage.jsx
    - frontend/src/pages/landing/LandingPage.jsx
    - frontend/src/pages/landing/HeroSection.jsx
    - frontend/src/pages/landing/DemoSection.jsx
    - frontend/src/pages/landing/FeaturesSection.jsx
    - frontend/src/pages/landing/PricingSection.jsx
    - frontend/src/pages/landing/FAQSection.jsx
    - frontend/src/pages/landing/FooterSection.jsx
  modified:
    - frontend/src/App.jsx
    - frontend/src/components/Navigation.jsx
    - frontend/src/pages/CharacterPage.jsx
    - frontend/src/pages/QuestsPage.jsx
    - frontend/src/pages/ShopPage.jsx
    - frontend/src/pages/InventoryPage.jsx
    - frontend/src/pages/LeaderboardPage.jsx

key-decisions:
  - "AppLayout uses useMediaQuery('(min-width: 1024px)') for JS-driven layout switch instead of pure CSS breakpoints — lets us render only one of Sidebar/Navigation (no offscreen DOM)"
  - "Navigation.jsx migrated to NavLink with per-tab render prop ({ isActive }) => ... — preserves full retro styling (yellow glow, scale, underline) while deriving active state from URL"
  - "Existing pages kept `character`/`videos` props as optional; in Phase 2 no props are passed, so each page either renders `данные загружаются...` placeholder (CharacterPage) or simply skips background video (others) — real per-page data fetch belongs in Phase 3"
  - "Dev bypass link on LoginPage (text `[DEV] Войти без auth →`) goes to /app/quests so Phase 2 testing is possible without backend auth"
  - "Auth shell inputs have `disabled` attribute and placeholder-only styling — clearly signals 'coming soon' without confusing users"

patterns-established:
  - "Any background <video> element must be wrapped in `{videos?.key && (<video src={videos.key} ... />)}` — never `src={videos?.key || ''}` because React warns on empty src"
  - "useCallback dependency arrays must use optional chaining on nullable props (`character?.telegram_id`) to avoid crash before null-guard early return"
  - "Lazy-loaded /app/* pages wrapped in `AppSuspense` → `LoadingPage` fallback — consistent loading UX"

requirements-completed: [WEB-01, WEB-02, WEB-03, LEGAL-01, LEGAL-04]

# Metrics
duration: 60min
completed: 2026-04-18
---

# Phase 2 Plan 03: AppLayout + Landing + Auth Shells + Final Routing Summary

**Closed the user-visible part of Phase 2: responsive AppLayout (sidebar/bottom-tabs), landing page with 6 sections, auth shell pages, and final App.jsx route tree. All 5 /app/* pages now render without crashes under the new layout.**

## Performance

- **Duration:** ~60 min (includes 2 runtime bugfixes after verification)
- **Completed:** 2026-04-18T00:37:00Z
- **Tasks:** 2 planned + 2 discovered bugfixes
- **Files created:** 11
- **Files modified:** 7

## Accomplishments

- Built AppLayout with Outlet and conditional Sidebar/Navigation rendering driven by useMediaQuery
- Built Sidebar (256px fixed left) with NavLink-based active state and footer legal links
- Migrated Navigation from activeTab/setActiveTab props to React Router NavLink (full retro styling preserved)
- Built LandingPage assembling Hero, Demo, Features, Pricing, FAQ, Footer sections — all Russian copy, retro palette
- Built LoginPage and RegisterPage shell forms with disabled inputs and [DEV] bypass link
- Replaced App.jsx 02-01 scaffold with final route tree: /, /login, /register, /privacy, /terms, /public-offer, protected /app/* (quests, character, shop, inventory, leaderboard, settings), * → NotFoundPage
- Removed obsolete TWA-era fixed viewport classes from all /app/* pages

## Task Commits

1. **Task 1: AppLayout + Sidebar + Navigation migration + App.jsx final routes** - `8fc180d`
2. **Task 2: Landing page with all 6 sections** - `a576278`

## Files Created/Modified

Created:
- `frontend/src/components/layout/AppLayout.jsx` — responsive wrapper with Outlet, isDesktop branches on Sidebar vs Navigation
- `frontend/src/components/layout/Sidebar.jsx` — fixed left 256px, 5 nav items, footer legal links
- `frontend/src/pages/auth/LoginPage.jsx` — shell login with disabled inputs + dev bypass
- `frontend/src/pages/auth/RegisterPage.jsx` — shell register form
- `frontend/src/pages/landing/LandingPage.jsx` — 6-section assembly
- `frontend/src/pages/landing/HeroSection.jsx` — H1, RPG badge, dual CTA, retro radial gradient + scanlines
- `frontend/src/pages/landing/DemoSection.jsx` — 4-step numbered list + demo quest card
- `frontend/src/pages/landing/FeaturesSection.jsx` — 2×2 grid of 4 features
- `frontend/src/pages/landing/PricingSection.jsx` — 3 gem packs, disabled "СКОРО" buttons
- `frontend/src/pages/landing/FAQSection.jsx` — 6-question accordion with toggle
- `frontend/src/pages/landing/FooterSection.jsx` — brand, legal links, contact email

Modified:
- `frontend/src/App.jsx` — final route tree, lazy-loaded /app/* pages, AppSuspense wrapper
- `frontend/src/components/Navigation.jsx` — migrated to NavLink, removed activeTab/setActiveTab props
- `frontend/src/pages/CharacterPage.jsx` — useCallback deps now use optional chaining (bugfix)
- `frontend/src/pages/QuestsPage.jsx` — background video wrapped in truthy guard (bugfix)
- `frontend/src/pages/ShopPage.jsx` — background video wrapped in truthy guard (bugfix)
- `frontend/src/pages/InventoryPage.jsx` — background video wrapped in truthy guard (bugfix)
- `frontend/src/pages/LeaderboardPage.jsx` — background video wrapped in truthy guard (bugfix)

## Decisions Made

- **AppLayout uses JS viewport check (useMediaQuery), not pure Tailwind `lg:` classes:** gives us exactly one of Sidebar/Navigation in the DOM at a time, which simplifies z-index, event handling, and reduces mobile DOM size.
- **Existing /app/* pages keep character/videos props as optional:** Phase 2 doesn't implement per-page data fetching — that's Phase 3's auth refactor. Minimal fix: CharacterPage renders placeholder when character is null; Quests/Shop/Inventory/Leaderboard skip the background video when videos is undefined. No regression in UI structure.
- **Dev bypass on LoginPage:** one tiny text link `[DEV] Войти без auth →` jumps straight to /app/quests — required for Phase 2 manual testing since ProtectedRoute needs isAuthenticated=true.
- **Video guard uses `{videos?.key && (<video src={videos.key} />)}` not `src={videos?.key || ''}`:** React fires a warning and can trigger a browser re-download on empty src — conditional render avoids the element entirely.

## Deviations from Plan

- **Plan Step F (existing pages audit) discovered runtime bugs after the human-verify checkpoint ran Playwright against all /app/* routes:**
  1. `CharacterPage.jsx:46` — `character.telegram_id` in useCallback dependency array crashes before the `if (!character) return ...` null guard. Fixed by using `character?.telegram_id` / `character?.selected_avatar` in deps.
  2. `QuestsPage`/`ShopPage`/`InventoryPage`/`LeaderboardPage` — plain `<video src={videos?.X || ''} />` fell back to `""` when videos prop was undefined, producing React warning "empty string passed to src attribute". Fixed by wrapping video in `{videos?.X && (...)}`.
- Both fixes are additive to the plan's original Step F guidance ("make each page independently fetch its data OR render placeholder if missing") — they implement the "placeholder if missing" minimal approach.

## Issues Encountered

- **Vite bound only to IPv6 [::1] by default on this Windows host:** `localhost` resolves to IPv4 127.0.0.1 and Chrome/Playwright failed with ERR_CONNECTION_REFUSED. Resolved by starting dev server with `npm run dev -- --host 127.0.0.1`. Not a code issue — affects only local dev command. Document in README for future sessions.
- Two React Router v6 future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) — informational, non-blocking. Can be silenced in Phase 3 by passing `future` options when we replace the BrowserRouter wrapper.

## Verification Results

**Build:** `npm run build` — ✅ 4.5s, 0 errors, 293.90 kB main bundle (gzip: 90.56 kB).

**Routing (all verified via Playwright):**
- `/` — landing renders with all 6 sections (0 console errors)
- `/app/quests` — sidebar + empty content area (0 errors post-fix)
- `/app/character` — sidebar + "данные загружаются..." placeholder (0 errors post-fix)
- `/app/shop`, `/app/inventory`, `/app/leaderboard` — same pattern (0 errors post-fix)
- `/privacy`, `/terms`, `/public-offer` — legal pages render
- `/nonexistent` — 404 page renders with "ВЕРНУТЬСЯ" link

**Responsive:**
- 1280×800 viewport — Sidebar visible (complementary role), no Navigation
- 375×800 viewport — Sidebar gone, Navigation with 5 bottom-tabs visible
- Live resize without page reload works

**Landing CTA:**
- "НАЧАТЬ ИГРУ" click → /register confirmed

**Cookie consent:**
- localStorage cleared, banner reappears
- "ПРИНЯТЬ ВСЁ" click → banner dismissed, `localStorage['cookie-consent'] = {"state":{"cookieConsent":"accepted"},"version":0}`
- Reload → banner stays dismissed

**TWA removal:**
- `grep -r "window.Telegram\|@twa-dev\|X-Telegram-Init-Data" frontend/src` → no matches
- `grep "@twa-dev\|telegram-web-app" frontend/package.json frontend/index.html` → no matches
- `grep "activeTab\|setActiveTab" frontend/src` → no matches

## Phase 2 Success Criteria

All 8 criteria from ROADMAP.md are met:

1. ✅ Site opens without Telegram SDK errors (verified in Playwright; no window.Telegram references)
2. ✅ URL routing works for all /app/* routes and legal pages
3. ✅ Desktop Sidebar (≥1024px), mobile bottom-tabs (<1024px) — verified at 1280px and 375px
4. ✅ Landing at / with 6 sections (Hero, Demo, Features, Pricing, FAQ, Footer)
5. ✅ Legal pages /privacy, /terms, /public-offer with Russian content
6. ✅ Cookie consent banner on first visit, persisted after acceptance
7. ✅ Existing screens work under /app/* (placeholder rendered for missing data; no tab-state regression)
8. ✅ @twa-dev/sdk removed from package.json, telegram-web-app.js removed from index.html

## Production TODO Items

None added in this plan. Open items from 02-02 remain (operator реквизиты, contact email verification, real gem prices).

## User Setup Required

- For local dev on Windows where `localhost` prefers IPv4 but Vite binds IPv6: run `npm run dev -- --host 127.0.0.1` (or add to package.json dev script).

## Next Phase Readiness

- Phase 2 is fully UAT-ready. All user-visible routes render, layout adapts to viewport, cookie consent complies with 152-ФЗ.
- Phase 3 (Auth + Per-Page Data) should:
  - Replace shell Login/Register with real email/Telegram auth
  - Remove the `[DEV] Войти без auth →` bypass link on LoginPage
  - Refactor /app/* pages to fetch their own data (character via /api/user/me, quests via /api/quests/me) instead of receiving props
  - Remove `videos` prop plumbing entirely (load assets per page)
- No blockers.

---
*Phase: 02-web-foundation*
*Completed: 2026-04-18*
