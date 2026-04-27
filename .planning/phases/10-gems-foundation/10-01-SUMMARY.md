---
phase: 10-gems-foundation
plan: "01"
subsystem: backend
tags: [gems, shop, migration, schema, alembic, pydantic]
dependency_graph:
  requires: [09-03]
  provides: [price_gems-api-field]
  affects: [backend/app/models.py, backend/app/schemas.py, backend/migrations/versions/7f3f7a1cafc5_add_price_gems.py, backend/tests/test_shop_router.py]
tech_stack:
  added: []
  patterns: [hand-written-alembic-migration, nullable-column-extension, optional-pydantic-field, stub-unit-tests]
key_files:
  created:
    - backend/migrations/versions/7f3f7a1cafc5_add_price_gems.py
  modified:
    - backend/app/models.py
    - backend/app/schemas.py
    - backend/tests/test_shop_router.py
decisions:
  - "[10-01] Revision ID 7f3f7a1cafc5; hand-wrote migration (no autogenerate) — avoids spurious drop_index calls per Phase 4/5/8/9 pattern"
  - "[10-01] price_gold=0 on gem-priced seed item — NOT NULL column requires placeholder; item is not purchasable with gold"
  - "[10-01] ON CONFLICT DO NOTHING idempotency for seed INSERT — re-runnable migration, consistent with Phase 5 pattern"
  - "[10-01] price_gems: Optional[int] = None in ShopItemSchema — nullable column means existing rows return NULL; Pydantic must accept None"
metrics:
  duration_seconds: 94
  completed_date: "2026-04-27"
  tasks_completed: 3
  files_modified: 4
---

# Phase 10 Plan 01: Gems Foundation - Backend Schema Summary

**One-liner:** Added nullable price_gems INTEGER column to shop_items via Alembic migration 7f3f7a1cafc5, extended ShopItem ORM and ShopItemSchema with Optional[int] price_gems field, and seeded one gem-priced potion item.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add price_gems to ShopItem ORM model and ShopItemSchema | a424668 | backend/app/models.py, backend/app/schemas.py |
| 2 | Write hand-written Alembic migration with gem-item seed | 8f8c824 | backend/migrations/versions/7f3f7a1cafc5_add_price_gems.py |
| 3 | Add price_gems unit tests to test_shop_router.py | a5ff13a | backend/tests/test_shop_router.py |

## What Was Built

- **ORM Model extension:** `ShopItem.price_gems = Column(Integer, nullable=True)` inserted after `price_gold` in `backend/app/models.py`
- **Pydantic Schema extension:** `price_gems: Optional[int] = None` in `ShopItemSchema` in `backend/app/schemas.py`; auto-serialized via `from_attributes=True`
- **Alembic Migration 7f3f7a1cafc5:** Hand-written (no autogenerate), `down_revision='3e157d3ff620'` (Phase 9 guilds); `upgrade()` adds nullable column + seeds `Зелье здоровья (Gems)` with `price_gems=500, price_gold=0` via ON CONFLICT DO NOTHING; `downgrade()` drops the column
- **Unit Tests:** 3 new Phase 10 tests appended to `test_shop_router.py` — schema null guard, truthy-guard for badge rendering, price_gold=0 validity for gem-only items; 102/102 tests pass

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Hand-wrote migration (no autogenerate) | Avoids spurious drop_index calls — consistent with Phases 4/5/8/9 pattern |
| price_gold=0 for gem-priced seed item | NOT NULL column constraint; item is not purchasable with gold; 0 is explicit placeholder |
| ON CONFLICT DO NOTHING seed | Idempotent re-runs; consistent with Phase 5 (c203bdcc4819) data-step pattern |
| price_gems: Optional[int] = None | Nullable column; existing rows have NULL; Pydantic must gracefully accept None |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `python -c "from app.models import ShopItem; assert hasattr(ShopItem, 'price_gems')"` → OK
- `python -c "from app.schemas import ShopItemSchema; assert 'price_gems' in ShopItemSchema.model_fields"` → OK
- Alembic revision chain: `['7f3f7a1cafc5', '3e157d3ff620', '49ecd4b23ffe']` — new migration at head
- `python -m pytest tests/test_shop_router.py -x -q` → 8/8 passed
- `python -m pytest tests/ -x -q` → 102/102 passed, no regressions

## Self-Check: PASSED

Files created/modified:
- FOUND: backend/migrations/versions/7f3f7a1cafc5_add_price_gems.py
- FOUND: backend/app/models.py (price_gems column)
- FOUND: backend/app/schemas.py (price_gems field)
- FOUND: backend/tests/test_shop_router.py (3 new tests)

Commits:
- FOUND: a424668 (Task 1)
- FOUND: 8f8c824 (Task 2)
- FOUND: a5ff13a (Task 3)
