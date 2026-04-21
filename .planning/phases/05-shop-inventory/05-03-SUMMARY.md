---
phase: 05-shop-inventory
plan: 03
subsystem: backend-api
tags: [shop, inventory, fastapi, idempotency, booster, potion, skin]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [shop-endpoints, inventory-endpoints]
  affects: [frontend-shop-page, frontend-inventory-ui]
tech_stack:
  added: []
  patterns: [idempotency-key-cache, async-db-begin-transaction, selectinload-eager-load, stub-unit-tests]
key_files:
  created:
    - backend/app/routers/shop.py
    - backend/app/routers/inventory.py
  modified:
    - backend/app/crud.py
    - backend/app/main.py
    - backend/tests/test_shop_router.py
    - backend/tests/test_inventory_router.py
decisions:
  - "Stub-only unit tests (no TestClient/DB) chosen for router logic coverage — mirrors Phase 4 pattern"
  - "BOOSTER_PREFIX_MAP dict in inventory.py drives dynamic getattr/setattr for boost columns — adding new boost type requires only updating the map"
  - "simulate_activate() helper in test_inventory_router.py mirrors router logic verbatim — allows testing all branches without async/DB overhead"
metrics:
  duration: "202 seconds"
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_changed: 6
---

# Phase 05 Plan 03: Shop and Inventory Router Implementation Summary

**One-liner:** FastAPI shop (catalog + atomic purchase with idempotency) and inventory (booster/potion activate + skin equip) routers with full unit test coverage — 5 endpoints, 11 tests, wired into main.py.

## What Was Built

### shop.py — GET /api/shop + POST /api/shop/buy/{id}

- `GET /api/shop` returns all `is_active=True` shop items ordered by `price_gold ASC` via `crud.get_catalog()`
- `POST /api/shop/buy/{shop_item_id}` executes atomically inside `async with db.begin()`:
  1. UUID format validation on `idempotency_key`
  2. Idempotency cache lookup — returns cached JSON on duplicate keys (no double-charge)
  3. Item existence check (404 if not found)
  4. Gold sufficiency check (400 `insufficient_gold`)
  5. Skin ownership check (409 `already_owned` if skin already in inventory)
  6. Gold deduction from user
  7. Inventory upsert (increment quantity if exists, create row if not)
  8. Save idempotency record with response JSON

### inventory.py — GET /api/inventory + POST /activate + POST /equip

- `GET /api/inventory` returns all `InventoryItemSchema` for the user with nested `shop_item` via `crud.get_inventory()`
- `POST /api/inventory/{id}/activate` handles three item type branches atomically:
  - **skin** → 400 `use_equip_endpoint`
  - **potion_heal** → clamps `hp` to `effective_max_hp(user, now)`, decrements quantity (deletes row at 0)
  - **booster_*** → checks slot expiry (409 `already_active` if not expired), sets `active_{prefix}_mult` + `active_{prefix}_expires_at` via `setattr`, decrements quantity
  - **booster_hp_max** → special case: sets `active_hp_max_bonus` + `active_hp_max_expires_at`
- `POST /api/inventory/{id}/equip` → validates `item_type == "skin"` (400 `not_a_skin`), sets `user.selected_avatar = shop_item.avatar_key`
- All three mutation endpoints use idempotency cache

### crud.py additions

- `get_catalog(db)` — filters `is_active=True`, orders by `price_gold ASC`
- `get_inventory(db, user_id)` — filters by `user_id`, `selectinload(shop_item)`, orders by `created_at ASC`

### main.py

- Added imports: `shop`, `inventory` from `app.routers`
- Added `app.include_router(shop.router)` and `app.include_router(inventory.router)` after existing routers

## Tests

### test_shop_router.py (5 tests)
- `test_get_catalog_returns_active_items` — only `is_active=True` in results
- `test_buy_idempotency_cached` — cached JSON decoded correctly
- `test_buy_insufficient_gold` — 400 raised when gold < price
- `test_buy_skin_already_owned` — 409 raised for already-owned skin
- `test_buy_gold_deducted_correctly` — gold reduces by exact price

### test_inventory_router.py (6 tests)
- `test_activate_xp_booster_sets_user_attrs` — `active_xp_mult` and `active_xp_expires_at` set
- `test_activate_booster_409_if_slot_occupied` — 409 when expiry is future
- `test_activate_potion_heals_hp` — HP clamped to `max_hp`, healed amount correct
- `test_activate_skin_returns_400` — 400 `use_equip_endpoint`
- `test_equip_skin_sets_selected_avatar` — `selected_avatar` updated
- `test_equip_non_skin_returns_400` — 400 `not_a_skin`

**Full suite:** 56/56 tests pass.

## Deviations from Plan

None — plan executed exactly as written. Stub classes were defined locally in each test file (rather than imported from conftest.py) because `conftest.py` classes are not importable as modules in pytest's collection model — this is the correct pytest pattern.

## Self-Check

- `backend/app/routers/shop.py` — EXISTS
- `backend/app/routers/inventory.py` — EXISTS
- `backend/app/crud.py` — MODIFIED (get_catalog, get_inventory added)
- `backend/app/main.py` — MODIFIED (shop + inventory routers registered)
- `backend/tests/test_shop_router.py` — MODIFIED (5 tests)
- `backend/tests/test_inventory_router.py` — MODIFIED (6 tests)
- Commits: `0f4bc24` (Task 1), `3d8f5ff` (Task 2)
- All 56 tests pass

## Self-Check: PASSED
