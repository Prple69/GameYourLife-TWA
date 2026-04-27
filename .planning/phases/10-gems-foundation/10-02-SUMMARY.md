---
phase: 10-gems-foundation
plan: "02"
subsystem: frontend
tags: [gems, frontend, navigation, hud, shop]
dependency_graph:
  requires: [10-01]
  provides: [GemsPage, gems-hud-badge, shop-gem-price-display]
  affects: [App.jsx, Header.jsx, ShopPage.jsx, Navigation.jsx, Sidebar.jsx]
tech_stack:
  added: []
  patterns: [lazy-route, useQuery-user-reuse, retro-pixel-aesthetic]
key_files:
  created:
    - frontend/src/pages/GemsPage.jsx
  modified:
    - frontend/src/App.jsx
    - frontend/src/components/Header.jsx
    - frontend/src/pages/ShopPage.jsx
    - frontend/src/components/Navigation.jsx
    - frontend/src/components/layout/Sidebar.jsx
decisions:
  - GemsPage uses hardcoded PACKS const — no backend fetch needed; packs are static until billing is implemented
  - user?.gems != null guard (not !== undefined) handles both undefined and null, gems=0 still renders
  - price_gems truthy check drives both badge and disabled button — items with price_gold=0 and price_gems>0 render Скоро correctly
  - Navigation and Sidebar both get Gems entry — both use static arrays, plan requires nav link addition
metrics:
  duration_minutes: 15
  completed_date: "2026-04-28"
  tasks_completed: 3
  files_changed: 5
---

# Phase 10 Plan 02: Gems Frontend Summary

Gem-currency frontend: GemsPage with three static packs (100/500/1500), lazy route at /app/gems, purple gems badge in Header HUD, and gem-price badge + disabled Скоро button on gem-priced shop items.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create GemsPage and add lazy route to App.jsx | 790de58 | GemsPage.jsx (new), App.jsx |
| 2 | Extend Header HUD with gems badge + ShopPage gem-price | 32ae31c | Header.jsx, ShopPage.jsx |
| 3 | Verify build passes + add nav items | 6cf97a6 | Navigation.jsx, Sidebar.jsx |

## What Was Built

### GemsPage (`frontend/src/pages/GemsPage.jsx`)

Static gem packs page. Three packs (100/500/1500 gems) rendered from a `PACKS` const array. Middle pack has "ПОПУЛЯРНО" badge. All three buttons are `disabled` with "Скоро" label and `cursor-not-allowed` styling. Purple `#9966ff` accent color throughout, consistent with gem currency theming.

### Route (`frontend/src/App.jsx`)

Lazy import and `<Route path="gems" ...>` added after the guilds route inside the `/app` protected block. Follows the same `AppSuspense` + lazy pattern as GuildsPage.

### Header HUD Gems Badge (`frontend/src/components/Header.jsx`)

The RIGHT side HUD div now shows a gems badge before the gold badge. Uses `user?.gems != null` guard (reuses the existing `useQuery(['user'])` — no new fetch). Purple `border-[#9966ff]/40` border, `text-[#9966ff]` value, 💎 icon. Gems=0 renders (intentional: shows user has 0 gems).

### ShopPage Gem-Price Display (`frontend/src/pages/ShopPage.jsx`)

The BUY BUTTON section is wrapped in a `flex flex-col` container. When `item.price_gems` is truthy: renders a `💎 {price_gems}` badge above a disabled "Скоро" button. When falsy: renders the existing gold buy button (unchanged logic). `handleBuyClick`, `handleConfirmBuy`, and gold-path logic are untouched.

### Navigation Links (`frontend/src/components/Navigation.jsx`, `frontend/src/components/layout/Sidebar.jsx`)

Both static nav arrays received a `/app/gems` entry labeled "GEMS". Both files use the leaderIcon placeholder (no gems-specific icon exists in assets).

## Deviations from Plan

### Auto-added: Navigation entries in Navigation.jsx and Sidebar.jsx

- **Found during:** Task 3 (build verification step)
- **Issue:** Plan's Task 3 explicitly says to add nav items if navigation is a static list — both Navigation.jsx and Sidebar.jsx confirmed to use static arrays
- **Fix:** Added `{ to: '/app/gems', label: 'GEMS', icon: leaderIcon }` to both files
- **Files modified:** Navigation.jsx, Sidebar.jsx
- **Commit:** 6cf97a6

No other deviations — plan executed as written.

## Verification

All success criteria met:

- [x] `/app/gems` route exists in App.jsx (lazy import + Route element) — confirmed line 24 + 72
- [x] GemsPage.jsx renders 3 hardcoded packs (100/500/1500); all buttons disabled + show "Скоро"
- [x] Header.jsx shows gems count in purple badge (`border-[#9966ff]/40`); renders only when `user?.gems != null`
- [x] ShopPage.jsx: `item.price_gems` truthy → 💎 badge + disabled "Скоро" button; falsy → normal gold button
- [x] `npm run build` exits 0 — `GemsPage-BwWevylr.js` chunk in dist
- [x] No references to /api/billing, ЮKassa, or gem_transactions in new code

## Self-Check: PASSED
