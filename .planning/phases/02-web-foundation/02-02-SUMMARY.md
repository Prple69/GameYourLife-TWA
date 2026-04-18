---
phase: 02-web-foundation
plan: "02"
subsystem: ui
tags: [react, legal, 152-fz, cookie-consent, zustand, tailwind]

# Dependency graph
requires:
  - phase: 02-web-foundation/02-01
    provides: cookieConsentStore.js (Zustand persist), BrowserRouter in main.jsx, react-router-dom Link

provides:
  - "Three legal page components: PrivacyPage, TermsPage, OfferPage"
  - "Shared LegalLayout with header/footer navigation and contact email"
  - "CookieConsentBanner — retro pixel-styled, localStorage-persisted, no library"
  - "CookieConsentBanner wired into main.jsx inside BrowserRouter"

affects:
  - "02-03-routing — must add /privacy, /terms, /public-offer routes pointing to these components"
  - "any future analytics integration — check cookieConsent === 'accepted' before loading scripts"

# Tech tracking
tech-stack:
  added: []  # No new libraries — uses existing zustand, react-router-dom, tailwind
  patterns:
    - "LegalLayout shared layout component pattern (header + footer nav reused across 3 pages)"
    - "Zustand persist store for user preference (cookieConsent) in localStorage"
    - "Cookie banner as global component rendered in main.jsx outside page tree"

key-files:
  created:
    - frontend/src/pages/legal/LegalLayout.jsx
    - frontend/src/pages/legal/PrivacyPage.jsx
    - frontend/src/pages/legal/TermsPage.jsx
    - frontend/src/pages/legal/OfferPage.jsx
    - frontend/src/components/CookieConsentBanner.jsx
  modified:
    - frontend/src/main.jsx

key-decisions:
  - "Custom CookieConsentBanner without react-cookie-consent library — avoids extra dependency, gives full retro aesthetic control"
  - "CookieConsentBanner placed in main.jsx inside BrowserRouter (not per-page) — shows on all routes"
  - "LegalLayout extracted to separate file (not inlined per page) — avoids duplication across 3 pages"
  - "z-40 for banner (below modal z-50+, above content) — consistent z-index layering system"
  - "TODO markers for реквизиты throughout — explicit pre-launch checklist items"

patterns-established:
  - "Global UI elements (banners, modals) render in main.jsx alongside App inside providers"
  - "Legal pages use retro palette: #daa520 gold headings, black bg, font-mono body"
  - "Press Start 2P font only on H1/H2 headings — body text uses font-mono"

requirements-completed: [LEGAL-02, LEGAL-03, LEGAL-04]

# Metrics
duration: 15min
completed: 2026-04-18
---

# Phase 2 Plan 02: Legal Pages + Cookie Consent Summary

**Three 152-FZ legal pages (privacy/terms/offer) with shared LegalLayout and retro CookieConsentBanner backed by Zustand localStorage persistence**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-18T10:05:44Z
- **Completed:** 2026-04-18T10:20:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created LegalLayout shared component with header nav, retro gold heading, and footer with links to all three legal pages + contact email
- Created three Russian-language legal pages (152-FZ privacy, user agreement, ЮKassa public offer) with TODO реквизиты markers
- Created CookieConsentBanner (custom ~60 lines, no library) with two actions (ПРИНЯТЬ ВСЁ / ТОЛЬКО НУЖНЫЕ), safe-area-inset padding, z-40 layering
- Wired CookieConsentBanner into main.jsx inside BrowserRouter so it appears on all routes globally

## Task Commits

1. **Task 1: Create LegalLayout + three legal page components** - `66c435d` (feat)
2. **Task 2: Create CookieConsentBanner and wire into main.jsx** - `36e9d28` (feat)

## Files Created/Modified

- `frontend/src/pages/legal/LegalLayout.jsx` - Shared layout: header with back link, content area, footer with legal nav links + email
- `frontend/src/pages/legal/PrivacyPage.jsx` - 152-FZ privacy policy, 10 sections in Russian, TODO markers for operator реквизиты
- `frontend/src/pages/legal/TermsPage.jsx` - User agreement, 8 sections covering virtual currency, conduct rules, liability
- `frontend/src/pages/legal/OfferPage.jsx` - ЮKassa public offer with gem pack table (3 tiers), return policy, TODO prices
- `frontend/src/components/CookieConsentBanner.jsx` - Fixed-bottom banner, reads/writes cookieConsentStore, returns null after consent
- `frontend/src/main.jsx` - Added CookieConsentBanner import + render inside BrowserRouter

## Decisions Made

- **Custom banner vs react-cookie-consent library:** Plan explicitly called for custom component. Saves ~14KB, allows full retro pixel aesthetic control without fighting library's styles.
- **CookieConsentBanner in main.jsx:** Renders once globally rather than per-page — no risk of missing it on any route including legal pages themselves.
- **LegalLayout in separate file:** All three pages import from `./LegalLayout` — single source of truth for footer links and header styling.

## Deviations from Plan

None — plan executed exactly as written. cookieConsentStore.js already existed from Plan 02-01 (parallel wave 1 execution).

## Issues Encountered

None — Plan 02-01 had already set up BrowserRouter in main.jsx, cookieConsentStore, and all required dependencies (zustand, react-router-dom). Integration was straightforward.

## Production TODO Items

The following must be filled before prod launch (search for `[TODO` in the codebase):

1. **PrivacyPage.jsx** — ФИО оператора, ИНН, ОГРН, юридический адрес
2. **TermsPage.jsx** — ФИО/наименование оператора
3. **OfferPage.jsx** — ФИО/наименование оферента, ИНН, ОГРН, shop ID ЮKassa, реальные цены на gems (100/500/1500 кристаллов), юридический адрес
4. **LegalLayout.jsx** — Verify support@gameyourlife.ru is the correct contact email

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three legal page components ready to be plugged into route tree by Plan 02-03
- Plan 02-03 must add routes: `/privacy` → PrivacyPage, `/terms` → TermsPage, `/public-offer` → OfferPage
- CookieConsentBanner is live in main.jsx — will be visible on all pages as soon as dev server runs
- No blockers

---
*Phase: 02-web-foundation*
*Completed: 2026-04-18*
