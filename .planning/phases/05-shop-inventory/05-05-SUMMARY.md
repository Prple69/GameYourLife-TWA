---
phase: 05-shop-inventory
plan: 05
subsystem: ui
tags: [react, tanstack-query, uuid, shop, inventory, quests, avatar]

# Dependency graph
requires:
  - phase: 05-03
    provides: backend shop/buy and inventory activate/equip/use endpoints
  - phase: 05-04
    provides: backend quest 5-slot cap enforcement and 409 active_limit_reached response

provides:
  - shopService.getCatalog and shopService.buy in api.js
  - inventoryService.list, activate, equip in api.js
  - ShopPage with filter tabs, afford-check, confirm-buy flow
  - InventoryPage with 4 sections (active effects, boosters, skins, potions) and action buttons
  - Header boost countdown timer row (ticking, refetches user every 60s)
  - QuestsPage 5/5 cap UI with disabled button and 409 toast
  - AvatarSelector grayscale+lock overlay for unowned premium skins with shop navigation

affects: [phase-06-leaderboard, any frontend page that imports api.js services]

# Tech tracking
tech-stack:
  added: [uuid v14 (idempotency keys for buy/activate/equip mutations)]
  patterns:
    - useQuery(['shop-items']) + useQuery(['inventory']) fetched conditionally (enabled: isOpen) in AvatarSelector
    - Idempotency key pattern via uuidv4() on every mutating action to prevent double-spend
    - 4-section inventory layout derived from both user boost fields (active effects) and inventory items
    - Toast pattern in QuestsPage mirrors InventoryPage/ShopPage pattern (fixed bottom, z-[91], click-to-dismiss)

key-files:
  created: []
  modified:
    - frontend/src/services/api.js
    - frontend/src/pages/ShopPage.jsx
    - frontend/src/pages/InventoryPage.jsx
    - frontend/src/pages/QuestsPage.jsx
    - frontend/src/components/Header.jsx
    - frontend/src/components/AvatarSelector.jsx
    - frontend/package.json

key-decisions:
  - "AvatarSelector fetches shop-items and inventory internally (enabled: isOpen) rather than receiving shopSkins prop — avoids prop drilling through CharacterPage"
  - "QuestsPage questToast uses z-[91] (one above statGainToast z-[90]) so cap message is always visible"
  - "activeCount counts both serverTasks (filter !is_completed && !is_failed) and optimisticTasks to block cap at exactly 5 slots even before server confirms"

patterns-established:
  - "Boost slot occupied check: user?.[expAttr] && new Date(user[expAttr]) > now — used in both Header and InventoryPage"
  - "Lock overlay pattern for AvatarSelector: relative wrapper + absolute inset-0 bg-black/60 + grayscale CSS filter on img"
  - "Quest cap enforcement: double-guard at click handler AND inside onAddTask body + 409 response case"

requirements-completed: [SHOP-01, SHOP-02, SHOP-03, SHOP-05, INV-01, INV-02, INV-03]

# Metrics
duration: 45min
completed: 2026-04-21
---

# Phase 05 Plan 05: Frontend Shop/Inventory UX Summary

**Full shop-and-inventory frontend: ShopPage catalog with filter tabs + confirm-buy, InventoryPage 4-section layout with activate/equip/use, Header boost timers, QuestsPage 5-slot cap, AvatarSelector premium skin locks**

## Performance

- **Duration:** ~45 min (continuation after rate-limit interruption)
- **Started:** 2026-04-21T00:00:00Z (original agent)
- **Completed:** 2026-04-21T04:10:00Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- api.js now exports `shopService` (getCatalog, buy) and `inventoryService` (list, activate, equip) using project axios instance with Bearer token interceptor
- ShopPage fully rewritten: 4 filter tabs (Все/Бусты/Скины/Зелья), afford-check with red price button, ConfirmModal buy flow using uuidv4() idempotency keys, cache invalidation
- InventoryPage rewritten with 4 sections: active effects (derived from user boost fields with mm:ss timers), boosters (activate, slot-occupied guard), skins (equip, current-equipped highlight), potions (use, healed HP toast)
- Header renders compact boost icon row with per-boost mm:ss countdown (client-side setInterval), refetches user every 60s
- QuestsPage: new quest button shows {activeCount}/5 subtitle, disabled with `cursor-not-allowed opacity-50` at cap=5, 409 active_limit_reached toast in save error handler
- AvatarSelector: fetches shop-items and inventory internally, renders grayscale img + lock overlay (🔒 + price) for unowned premium skins, click navigates to `/app/shop?filter=skins` via useNavigate

## Task Commits

1. **Task 1: api.js services + ShopPage + Header active boost timers** - `276a67a` (feat)
2. **Task 2: InventoryPage sections + QuestsPage cap + AvatarSelector skin locks** - `321acec` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `frontend/src/services/api.js` - Added shopService and inventoryService exports
- `frontend/src/pages/ShopPage.jsx` - Full rewrite: filter tabs, API-driven catalog, confirm-buy, idempotency keys
- `frontend/src/pages/InventoryPage.jsx` - Full rewrite: 4 sections with all action handlers and item detail modal
- `frontend/src/pages/QuestsPage.jsx` - Added activeCount/5 display, disabled button at cap, 409 toast
- `frontend/src/components/Header.jsx` - Added boost timer row with setInterval tick and 7 boost types
- `frontend/src/components/AvatarSelector.jsx` - Added premium skin lock overlay with shop navigation
- `frontend/package.json` - Added uuid v14 dependency

## Decisions Made

- AvatarSelector fetches shop-items and inventory internally (enabled: isOpen) rather than via props — avoids prop drilling through CharacterPage
- questToast uses z-[91] so cap message renders above existing z-[90] statGainToast
- activeCount includes optimisticTasks so the cap guard fires immediately on click before server confirms the previous save
- AvatarSelector click on locked skin calls `onClose()` before `navigate()` so the modal doesn't linger during navigation

## Deviations from Plan

None - plan executed as specified. InventoryPage was already fully complete by the previous agent (Task 2 Part A done). Task 2 Parts B and C (QuestsPage + AvatarSelector) were the remaining work.

## Issues Encountered

- Previous agent was interrupted by rate limit after completing Task 1 and InventoryPage (Part A of Task 2). Continuation agent verified state and completed QuestsPage and AvatarSelector.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 5 frontend is complete and backend contracts are in place
- Shop, inventory, and quest cap features are production-ready pending real device testing
- Phase 6 (Leaderboard) can begin — no blockers from Phase 5

---
*Phase: 05-shop-inventory*
*Completed: 2026-04-21*
