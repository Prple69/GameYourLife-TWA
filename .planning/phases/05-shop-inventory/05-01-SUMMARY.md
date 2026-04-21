---
phase: 05-shop-inventory
plan: "01"
subsystem: backend-schema
tags: [models, migrations, schemas, shop, inventory]
dependency_graph:
  requires: []
  provides:
    - "backend/app/models.py::ShopItem"
    - "backend/app/models.py::InventoryItem"
    - "backend/app/models.py::IdempotencyKey"
    - "backend/app/models.py::User (14 active boost columns)"
    - "backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py"
    - "backend/app/schemas.py::ShopItemSchema"
    - "backend/app/schemas.py::InventoryItemSchema"
    - "backend/app/schemas.py::PurchaseRequest"
    - "backend/app/schemas.py::ActivateRequest"
    - "backend/app/schemas.py::EquipRequest"
  affects:
    - "backend/app/schemas.py::UserSchema (14 boost fields added)"
tech_stack:
  added: []
  patterns:
    - "Hand-written Alembic migration (no autogenerate) — avoids spurious drop_index calls, per Phase 4 precedent"
    - "Denormalized active boost columns on User — one slot per boost type, nullable"
    - "UniqueConstraint on (user_id, shop_item_id) for inventory; (user_id, key) for idempotency"
    - "ON CONFLICT DO NOTHING seed inserts — idempotent re-runs"
key_files:
  created:
    - backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py
  modified:
    - backend/app/models.py
    - backend/app/schemas.py
    - .planning/REQUIREMENTS.md
decisions:
  - "Hand-wrote migration with UUID c203bdcc4819 instead of using autogenerate — consistent with Phase 4 pattern (avoids spurious drop_index calls)"
  - "SHOP-04 permanently removed: quest slots are a hard cap (5), not purchasable"
  - "Seed 24 shop items inline in migration upgrade() with ON CONFLICT DO NOTHING for idempotency"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-21"
  tasks_completed: 3
  files_modified: 4
---

# Phase 05 Plan 01: Shop & Inventory DB Schema Foundation Summary

**One-liner:** SQLAlchemy ORM models (ShopItem, InventoryItem, IdempotencyKey) + 14 User active boost columns + Alembic migration c203bdcc4819 with 24 seeded shop items + Pydantic request/response schemas for shop and inventory.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Move SHOP-04 to Out of Scope in REQUIREMENTS.md | 7414b4c | .planning/REQUIREMENTS.md |
| 2 | Add SQLAlchemy models + 14 User boost columns | 8ab6172 | backend/app/models.py |
| 3 | Add Pydantic schemas + Alembic migration | 9fcecd6 | backend/app/schemas.py, backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py |

## What Was Built

### Database Schema (migration c203bdcc4819)

Three new tables created:
- `shop_items` — catalog of purchasable items with 11 columns covering all item types
- `inventory_items` — user-owned items with `uq_user_shop_item` uniqueness constraint
- `idempotency_keys` — purchase deduplication with `uq_user_idem_key` uniqueness constraint

14 nullable boost columns added to `users`:
- 6 pairs of `active_{type}_mult` + `active_{type}_expires_at` (xp, gold, strength_xp, wisdom_xp, endurance_xp, charisma_xp)
- 1 pair of `active_hp_max_bonus` + `active_hp_max_expires_at`

24 shop items seeded across categories: XP boosters (3), gold boosters (3), stat XP boosters (8), HP max boosters (2), healing potions (3), skins (5).

### ORM Models (backend/app/models.py)

- `ShopItem` — full item catalog model with `is_active` flag
- `InventoryItem` — bidirectional relationships to User and ShopItem
- `IdempotencyKey` — purchase deduplication store
- `User.inventory_items` back-reference added

### Pydantic Schemas (backend/app/schemas.py)

- `ShopItemSchema` — full item read schema with `from_attributes=True`
- `InventoryItemSchema` — nested `shop_item: ShopItemSchema` for rich inventory reads
- `PurchaseRequest`, `ActivateRequest`, `EquipRequest` — all carry `idempotency_key: str`
- `UserSchema` extended with 14 `Optional` boost fields

### Requirements Update (.planning/REQUIREMENTS.md)

- SHOP-04 removed from active requirements
- SHOP-04 added to Out of Scope table with permanent rationale
- Traceability row updated to `Out of Scope`
- Phase 5 mapping corrected to `SHOP-01..03, SHOP-05, INV-01..03`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- backend/app/models.py — FOUND
- backend/app/schemas.py — FOUND
- backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py — FOUND
- .planning/REQUIREMENTS.md — FOUND

Commits verified:
- 7414b4c — FOUND (SHOP-04 Out of Scope)
- 8ab6172 — FOUND (models)
- 9fcecd6 — FOUND (schemas + migration)

Alembic: c203bdcc4819 (head) confirmed.
Imports: `ShopItem, InventoryItem, IdempotencyKey` and all 5 schemas import cleanly.
