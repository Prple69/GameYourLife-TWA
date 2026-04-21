---
phase: 05-shop-inventory
verified: 2026-04-21T00:00:00Z
status: passed
score: 8/8 must-haves verified
gaps: []
human_verification: []
---

# Phase 5: Shop & Inventory Verification Report

**Phase Goal:** Пользователь тратит gold на каталожные товары, управляет инвентарём, активирует бусты и скины.

**Verified:** 2026-04-21
**Status:** PASSED
**Re-verification:** No — initial verification
**Test Suite:** 56/56 passing (27 game_logic + 18 quests + 6 inventory + 5 shop tests)
**Frontend Build:** Passing

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/shop returns catalog with 24 seed items (boosters/potions/skins) | ✓ VERIFIED | shop.py router + migration seed data: 24 items inserted into shop_items |
| 2 | User can purchase items with POST /api/shop/buy/{id}, atomic gold deduct + inventory insert | ✓ VERIFIED | shop.py implements atomic transaction: check idempotency → validate gold → deduct → upsert inventory → cache response |
| 3 | POST /api/shop/buy/{id} prevents double-charge via idempotency_key UUIDs | ✓ VERIFIED | IdempotencyKey model + table created; shop.py checks cached response before processing |
| 4 | /app/shop renders cards with 4 filter tabs (Все/Бусты/Скины/Зелья) in retro layout | ✓ VERIFIED | ShopPage.jsx implements filterItems function with all 4 filters; retro card styling from Phase 4 pattern |
| 5 | User can activate boosts (POST /api/inventory/{id}/activate) setting active_*_mult + expires_at atomically | ✓ VERIFIED | inventory.py activate_item: checks slot free → sets active_<type>_mult + expires_at → decrements quantity atomically |
| 6 | User can equip skins (POST /api/inventory/{id}/equip) changing user.selected_avatar | ✓ VERIFIED | inventory.py equip_item: validates skin item_type → sets user.selected_avatar = avatar_key atomically |
| 7 | /app/inventory shows 4 sections (Активные эффекты/Бусты/Скины/Зелья) with actions | ✓ VERIFIED | InventoryPage.jsx implements 4 SectionHeader sections with proper filtering and action buttons |
| 8 | Quest cap enforced at 5 active; quest rewards multiplied by active boost multipliers | ✓ VERIFIED | quests.py save_quest: checks active_count >= MAX_ACTIVE_QUESTS (5) returns 409; complete_quest: calls effective_multipliers and applies to xp/gold/stat gains |

**Score:** 8/8 must-haves verified

---

## Required Artifacts

### Database (Backend)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| Migration: c203bdcc4819_phase5_shop_inventory.py | Creates shop_items, inventory_items, idempotency_keys + 14 user boost columns | ✓ VERIFIED | Migration file exists at backend/migrations/versions/; creates all 3 tables with proper constraints and FKs; 14 columns added to users; 24 seed items inserted |
| models.py: ShopItem | ORM model with item_type, name, price_gold, effect_multiplier, duration_seconds, etc. | ✓ VERIFIED | ShopItem class lines 104-119; all fields present; inventory_items relationship defined |
| models.py: InventoryItem | ORM model with user_id FK, shop_item_id FK, quantity, unique constraint | ✓ VERIFIED | InventoryItem class lines 122-133; UniqueConstraint on (user_id, shop_item_id); relationships to User and ShopItem |
| models.py: IdempotencyKey | ORM model with user_id, key, response_json, unique constraint | ✓ VERIFIED | IdempotencyKey class lines 136-144; UniqueConstraint on (user_id, key) |
| models.py: User boost columns | 14 active_*_mult and active_*_expires_at columns (nullable) | ✓ VERIFIED | User class lines 61-75; all 14 columns present with nullable=True |
| schemas.py: ShopItemSchema | Request/response schema with all item fields | ✓ VERIFIED | ShopItemSchema lines 148-162; from_attributes=True for ORM mapping |
| schemas.py: InventoryItemSchema | Request/response schema with shop_item nested | ✓ VERIFIED | InventoryItemSchema lines 165-173; nested ShopItemSchema |
| schemas.py: PurchaseRequest, ActivateRequest, EquipRequest | Request schemas with idempotency_key field | ✓ VERIFIED | Lines 176-185; all three present |
| schemas.py: UserSchema extended | All 14 active boost fields as Optional | ✓ VERIFIED | UserSchema lines 35-49; all fields present and optional |

### Backend Routers

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| shop.py: GET /api/shop | Returns active ShopItemSchema list, ordered by price | ✓ VERIFIED | get_catalog endpoint lines 16-22; calls crud.get_catalog; response_model=list[ShopItemSchema] |
| shop.py: POST /api/shop/buy/{id} | Atomic purchase with idempotency, gold validation, inventory upsert | ✓ VERIFIED | buy_item endpoint lines 25-97; implements all steps in transaction; returns {"success": true, "item_name": ..., "gold_remaining": ...} |
| inventory.py: GET /api/inventory | Returns owned InventoryItemSchema list with shop_item nested | ✓ VERIFIED | get_inventory endpoint lines 30-36; calls crud.get_inventory with selectinload |
| inventory.py: POST /api/inventory/{id}/activate | Activates booster/potion, sets active_*_mult or heals HP atomically | ✓ VERIFIED | activate_item endpoint lines 39-137; handles booster_*, potion_heal, skin validation; uses BOOSTER_PREFIX_MAP |
| inventory.py: POST /api/inventory/{id}/equip | Equips skin, sets user.selected_avatar atomically | ✓ VERIFIED | equip_item endpoint lines 140-188; validates skin item_type; atomic transaction |
| quests.py: POST /api/quests/save | Enforces MAX_ACTIVE_QUESTS = 5, returns 409 if at cap | ✓ VERIFIED | save_quest lines 172-205; counts active quests; checks active_count >= MAX_ACTIVE_QUESTS |
| quests.py: POST /api/quests/complete/{id} | Applies effective_multipliers to XP/gold/stat gains | ✓ VERIFIED | complete_quest lines 208-270; calls effective_multipliers(user, now); multiplies rewards; returns applied_boosts list |
| main.py | Routers registered: shop_router, inventory_router | ✓ VERIFIED | Lines 18, 46-47; import statements and include_router calls present |

### Game Logic Helpers

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| game_logic.py: MAX_ACTIVE_QUESTS | Constant = 5 | ✓ VERIFIED | Line 25; constant defined and imported in quests.py |
| game_logic.py: effective_multipliers() | Returns dict with active multipliers or 1.0 defaults | ✓ VERIFIED | Lines 71-83; checks expires_at > now for each boost type; returns dict with keys: xp, gold, strength_xp, wisdom_xp, endurance_xp, charisma_xp |
| game_logic.py: effective_max_hp() | Returns base_max_hp + bonus when boost active, base_max_hp when expired | ✓ VERIFIED | Lines 86-95; checks active_hp_max_expires_at and active_hp_max_bonus |

### CRUD Functions

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| crud.py: get_catalog() | Returns list of is_active=true ShopItems ordered by price | ✓ VERIFIED | Lines 266-274; filter on is_active==True; order_by price_gold.asc() |
| crud.py: get_inventory() | Returns list of InventoryItems with shop_item eagerly loaded | ✓ VERIFIED | Lines 277-287; uses selectinload for shop_item relationship |

### Frontend Services

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| api.js: shopService | getCatalog(), buy(id, {idempotency_key}) | ✓ VERIFIED | Lines 94-102; both methods present, correct API endpoints |
| api.js: inventoryService | list(), activate(id, {idempotency_key}), equip(id, {idempotency_key}) | ✓ VERIFIED | Lines 105-118; all three methods present, correct endpoints |

### Frontend Pages

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| ShopPage.jsx | Filters, cards, confirm buy modal, insufficient_gold handling | ✓ VERIFIED | 252 lines; FILTERS array (4 tabs); filterItems function; handleBuyClick with gold check; handleConfirmBuy with UUID generation |
| InventoryPage.jsx | 4 sections (effects/boosters/skins/potions), activate/equip/use buttons, quantity badges | ✓ VERIFIED | 382 lines; BOOSTER_TYPES array; SectionHeader component; separate arrays for activeEffects/boosters/skins/potions; action buttons with event handlers |
| QuestsPage.jsx | Quest cap display {count}/5, disabled at 5, 409 toast handling | ✓ VERIFIED | Lines 312 shows {activeCount}/5; line 197 handles active_limit_reached 409 with toast |

### Frontend Components

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| Header.jsx | Active boost countdown timers, multiple boosts in row | ✓ VERIFIED | 96 lines; BOOST_TYPES array (lines 6-7 show xp/gold boosts); activeBoosts mapped with timer calculation and display |
| AvatarSelector.jsx | Premium skin lock overlay with price, shop navigation | ✓ VERIFIED | Uses premiumSkins from shop catalog; isPremium check; grayscale class when locked; lock overlay with price display (lines 104-110); navigates to /app/shop?filter=skins on locked click |

---

## Key Link Verification (Wiring)

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| shop.py::get_catalog | crud.get_catalog | imported function call | ✓ WIRED | Line 22: `await crud.get_catalog(db)` |
| shop.py::buy_item | models.IdempotencyKey | insert in transaction | ✓ WIRED | Lines 91-95: creates and adds IdempotencyKey to transaction |
| shop.py::buy_item | models.InventoryItem | upsert in transaction | ✓ WIRED | Lines 77-87: queries and upserts InventoryItem |
| inventory.py::activate_item | models.IdempotencyKey | cache check and insert | ✓ WIRED | Lines 54-61 check, lines 131-135 insert |
| inventory.py::activate_item | game_logic.effective_max_hp | called for potion healing | ✓ WIRED | Line 84: `max_hp = effective_max_hp(user, now)` |
| inventory.py::equip_item | models.InventoryItem | user_id + id filter | ✓ WIRED | Lines 163-170: fetches inv_item with selectinload |
| quests.py::save_quest | game_logic.MAX_ACTIVE_QUESTS | constant check | ✓ WIRED | Line 187: `if active_count >= MAX_ACTIVE_QUESTS:` |
| quests.py::complete_quest | game_logic.effective_multipliers | called with user and now | ✓ WIRED | Line 230: `mults = effective_multipliers(user, now)` |
| quests.py::complete_quest | applied rewards | multiplier application | ✓ WIRED | Lines 232-235: xp_gained and gold_gained computed with mults |
| quests.py::complete_quest | applied_boosts response | computed from mults | ✓ WIRED | Lines 254-258: builds list of active boosts with mult > 1.0 |
| ShopPage.jsx | shopService.getCatalog | useQuery hook | ✓ WIRED | Line 46: `queryFn: shopService.getCatalog` |
| ShopPage.jsx | shopService.buy | handleConfirmBuy | ✓ WIRED | Line 73: `await shopService.buy(confirmItem.id, { idempotency_key })` |
| InventoryPage.jsx | inventoryService.list | useQuery hook | ✓ WIRED | Line 58: `queryFn: inventoryService.list` |
| InventoryPage.jsx | inventoryService.activate | button click handler | ✓ WIRED | handleActivate calls inventoryService.activate with UUID |
| InventoryPage.jsx | inventoryService.equip | button click handler | ✓ WIRED | handleEquip calls inventoryService.equip with UUID |
| Header.jsx | user.active_xp/gold data | useQuery ['user'] | ✓ WIRED | Reads active_xp_expires_at, active_gold_expires_at from user schema |
| AvatarSelector.jsx | shop catalog data | useQuery hook | ✓ WIRED | Fetches premiumSkins from shop catalog to determine lock state |

---

## Requirements Coverage

### Phase 5 Requirements (From PLAN frontmatter)

All plans declare requirements SHOP-01, SHOP-02, SHOP-03, SHOP-05, INV-01, INV-02, INV-03.

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **SHOP-01**: User can browse shop catalog with items | ✓ SATISFIED | ShopPage.jsx loads GET /api/shop; displays 24 items with name, description, price_gold, item_type; 4 filter tabs group items |
| **SHOP-02**: User can purchase XP/gold multiplier boosts | ✓ SATISFIED | Booster items seeded in migration (booster_xp, booster_gold); POST /api/shop/buy/{id} deducts gold; deducts quantity on activation |
| **SHOP-03**: User can purchase stat XP boosts (strength/wisdom/endurance/charisma) | ✓ SATISFIED | 8 stat boost items seeded (2 each stat); POST /api/inventory/{id}/activate applies stat XP boost |
| **SHOP-05**: User can purchase cosmetic avatar skins | ✓ SATISFIED | 5 skin items seeded with avatar_key (avatar2..6); POST /api/inventory/{id}/equip changes user.selected_avatar |
| **INV-01**: User can view all owned items in inventory | ✓ SATISFIED | GET /api/inventory returns InventoryItemSchema list; InventoryPage.jsx displays all items in sections |
| **INV-02**: User can activate owned boost items | ✓ SATISFIED | POST /api/inventory/{id}/activate sets active_<type>_mult + expires_at; tests verify 409 already_active when slot occupied |
| **INV-03**: User can equip owned avatar skins | ✓ SATISFIED | POST /api/inventory/{id}/equip sets user.selected_avatar; InventoryPage.jsx shows equip button with highlight on current avatar |

### Out of Scope Requirement (SHOP-04)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **SHOP-04**: Quest slot purchase | ✓ OUT OF SCOPE | REQUIREMENTS.md line 128 & 158: moved to Out of Scope table; no purchase endpoint; cap enforced in quests.py (line 187) as hard limit (5), not purchasable |

---

## Anti-Patterns Scan

### Modified Files Analysis

Files from Phase 5 execution (extracted from SUMMARY.md key-files):

1. **backend/app/models.py** — No anti-patterns found
   - ShopItem, InventoryItem, IdempotencyKey fully implemented with all required fields
   - 14 User boost columns present with nullable=True
   - Relationships properly defined with back_populates

2. **backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py** — No anti-patterns found
   - upgrade() creates all 3 tables with proper schema
   - 24 seed items inserted idempotently (ON CONFLICT DO NOTHING)
   - downgrade() reverses cleanly

3. **backend/app/schemas.py** — No anti-patterns found
   - All Phase 5 schemas present and exported
   - UserSchema extended with 14 optional boost fields
   - from_attributes=True enables ORM mapping

4. **backend/app/utils/game_logic.py** — No anti-patterns found
   - effective_multipliers returns correct defaults and active values
   - effective_max_hp handles expired boosts gracefully
   - MAX_ACTIVE_QUESTS constant defined at module level

5. **backend/app/routers/shop.py** — No anti-patterns found
   - Atomic transactions use `async with db.begin()`
   - Idempotency check before processing
   - Gold validation before deduct
   - Error codes match frontend expectations

6. **backend/app/routers/inventory.py** — No anti-patterns found
   - BOOSTER_PREFIX_MAP centralizes item_type → column name mapping
   - Slot availability checked before activation
   - Quantity management (decrement, delete on 0)

7. **backend/app/routers/quests.py** — No anti-patterns found
   - MAX_ACTIVE_QUESTS check before quest insert
   - effective_multipliers called with correct (user, now) args
   - applied_boosts list built from multipliers dict
   - Stat gain includes boost multiplier

8. **frontend/src/pages/ShopPage.jsx** — No anti-patterns found
   - filterItems correctly filters by item_type
   - Gold check before purchase (showToast prevents 400)
   - UUID generated per button click
   - Error codes handled: already_owned, insufficient_gold

9. **frontend/src/pages/InventoryPage.jsx** — No anti-patterns found
   - Section filtering by item_type
   - Active effects calculated with expires_at check and timer
   - Activate button disabled when slot occupied (checked server-side, UI deferred)
   - Equip button highlight logic correct

10. **frontend/src/pages/QuestsPage.jsx** — No anti-patterns found
    - activeCount computed from quests
    - Subtitle shows {count}/5
    - 409 active_limit_reached toast shown
    - Button disabled state managed

11. **frontend/src/components/Header.jsx** — No anti-patterns found
    - Active boosts mapped from user schema
    - Timer computed from expires_at - now
    - Displays multiple boosts in row

12. **frontend/src/components/AvatarSelector.jsx** — No anti-patterns found
    - Premium skin detection from shop catalog
    - Lock overlay with grayscale filter
    - Navigate to shop with filter param on locked click

13. **frontend/src/services/api.js** — No anti-patterns found
    - shopService and inventoryService methods present
    - Correct API endpoints
    - idempotency_key passed in request body

14. **backend/tests/test_*.py** — No anti-patterns found
    - 56 substantive tests covering game_logic, routers
    - StubUser and StubShopItem fixtures for isolation
    - Tests verify idempotency, gold validation, multiplier application

---

## Test Suite Verification

### Test Coverage

| Module | Tests | Focus | Status |
|--------|-------|-------|--------|
| test_game_logic.py | 27 | max_xp_for_level, apply_stat_xp, effective_multipliers, effective_max_hp, MAX_ACTIVE_QUESTS constant | ✓ PASSED |
| test_shop_router.py | 5 | get_catalog, buy_item idempotency, insufficient_gold, already_owned | ✓ PASSED |
| test_inventory_router.py | 6 | get_inventory, activate_item, equip_item | ✓ PASSED |
| test_quests_router.py | 18 | save_quest cap enforcement, complete_quest multiplier application, stat gain | ✓ PASSED |
| **Total** | **56** | Full Phase 5 coverage | ✓ ALL PASSED |

### Test Quality

- Game logic tests use StubUser (no DB) — pure function verification
- Router tests use stub objects and verify atomic transactions
- All tests assert specific outputs (not just "no error")
- Multiplier application verified in complete_quest tests
- Idempotency verified with cached response return

---

## Human Verification Items

**Note:** Plan 06 (Human Verification) reports completion. The following were verified manually by user in browser:

| Test | Expected | Status | Notes |
|------|----------|--------|-------|
| User can browse shop catalog with 24 items | Items displayed in retro card layout with name, price, icon | ✓ VERIFIED | User confirmed in Plan 06 |
| User can buy item and see it in inventory | Item appears in inventory after purchase, gold deducts | ✓ VERIFIED | User confirmed in Plan 06 |
| User can activate boost and see timer in Header | Timer appears and counts down every second | ✓ VERIFIED | User confirmed in Plan 06 |
| User can equip skin and see avatar change | Selected avatar updates immediately | ✓ VERIFIED | User confirmed in Plan 06 |
| User can use healing potion and see HP increase | HP bar updates after potion use | ✓ VERIFIED | User confirmed in Plan 06 |
| Quest add button shows 5/5 cap | Button disabled when 5 active quests | ✓ VERIFIED | User confirmed in Plan 06 |
| Premium skins show lock overlay in AvatarSelector | Grayscale + lock icon + price displayed | ✓ VERIFIED | User confirmed in Plan 06 |

---

## Gaps Summary

**Status: PASSED** — All must-haves verified. No gaps found.

- ✓ Database schema complete: 3 new tables + 14 user columns migrated via Alembic
- ✓ ORM models (ShopItem, InventoryItem, IdempotencyKey) fully implemented
- ✓ Pydantic schemas exported: ShopItemSchema, InventoryItemSchema, PurchaseRequest, ActivateRequest, EquipRequest
- ✓ Backend routers (shop.py, inventory.py) implement all endpoints with atomic transactions and idempotency
- ✓ Game logic helpers (effective_multipliers, effective_max_hp, MAX_ACTIVE_QUESTS) working correctly
- ✓ Quest cap enforced (5 active), multipliers applied to rewards
- ✓ Frontend pages (ShopPage, InventoryPage, QuestsPage) render all UI elements
- ✓ Components (Header, AvatarSelector) display active boosts and premium locks
- ✓ Services (shopService, inventoryService) wire correctly to backend
- ✓ SHOP-04 moved to Out of Scope in REQUIREMENTS.md
- ✓ 56/56 tests passing
- ✓ Frontend build passes

**Goal achieved:** Пользователь тратит gold на каталожные товары, управляет инвентарём, активирует бусты и скины. ✓

---

_Verified: 2026-04-21_
_Verifier: Claude (gsd-verifier)_
