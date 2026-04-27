# Phase 10: Gems Foundation - Research

**Researched:** 2026-04-27
**Domain:** Gem currency foundation (UI + schema, no payments)
**Confidence:** HIGH

## Summary

Phase 10 adds gem-currency scaffolding to the shop system: a single `price_gems` column on shop_items via Alembic migration, a static `/app/gems` page with three hardcoded packs, HUD display of `User.gems` next to gold, and shop cards showing gem-prices. All code patterns (routing, schemas, migrations, seeding) already exist in the codebase from Phase 5–9. No new API endpoints, no payments, no ЮKassa.

**Primary recommendation:** Decompose into two volumes: (1) Backend — Alembic migration + at least one gem-priced seed item, (2) Frontend — lazy route + /app/gems page + Header extension + ShopPage card updates. Keep migration hand-written per Phase 4–9 pattern.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Option A scoping** selected (foundation-only, no admin grant)
- One Alembic migration: add `price_gems INTEGER NULL` to `shop_items` (hand-written, `down_revision = 3e157d3ff620`)
- `/app/gems` page is static UI (no backend fetch) with three hardcoded packs: 100 / 500 / 1500
- Kнopka-заглушка: "Скоро" (disabled, grey button)
- HUD: extend existing gold-display, don't create new component
- Tests: stub-pattern unit tests + npm run build pass
- BILL-01 covered **partially** (caхталог + UI only); BILL-02, BILL-03 **explicitly deferred**

### Claude's Discretion
- Exact seeding path for gem-priced item (CRUD-on-startup vs. migration data-step vs. fixture)
- Gem icon/visual for HUD (existing SVG asset vs. emoji 💎 fallback vs. "GEMS" text)
- Component names and volume split strategy (one or two plans)

### Deferred Ideas (OUT OF SCOPE)
- ЮKassa SDK, payment endpoints, webhooks
- `gem_transactions` table, idempotency, SELECT FOR UPDATE
- Admin grant endpoint
- Any real-money flow

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 (partial) | User покупает пак gems за рубли; возвращается confirmation_url | Deferred to future Gems Payments phase. Phase 10 covers: (1) `price_gems` schema field + migration, (2) UI page showing three packs with "Скоро" button, (3) shop cards show gem-price alongside gold-price, (4) HUD displays `User.gems` |
| BILL-02 | ЮKassa webhook валидирует подпись, атомарно зачисляет gems | Deferred — not in Phase 10 |
| BILL-03 | Покупка товаров за gems | Deferred — not in Phase 10 |

</phase_requirements>

---

## Standard Stack

### Core Patterns (Verified from Codebase)

| Component | Version/Pattern | Purpose | Why Standard |
|-----------|-----------------|---------|--------------|
| Alembic migration (hand-written) | v1.13 | Schema changes | Phase 4–9 consistently avoid `autogenerate = True` due to spurious drop_index calls; all migrations manually written with explicit `op.create_table`, `op.add_column`, etc. |
| Pydantic schema | ConfigDict(from_attributes=True) | ORM serialization | `ShopItemSchema` mirrors SQLAlchemy ORM via `from_attributes=True` — new `price_gems` field auto-serialized when added to ORM model |
| FastAPI lazy-loaded pages | React.lazy() + Suspense | Route codesplitting | Pages like `GuildsPage` (Phase 9) use `const GuildsPage = lazy(() => import('./pages/GuildsPage'))` in App.jsx + AppSuspense wrapper; gem page follows same pattern |
| Seed data (shop items) | Data-step in migration OR startup CRUD | Initial catalog | Phase 5 migration c203bdcc4819 includes 20+ seed items via `conn.execute(INSERT)` inside `upgrade()` with ON CONFLICT DO NOTHING for idempotence |
| HUD component | Header.jsx (existing) | Layout header w/ gold display + active boost timers | Right-side `<div>` displays `{gold}` with 🪙 emoji icon, shadow-effect, responsive sizing; `BOOST_TYPES` array + `.filter()` pattern controls what renders |
| Shop card rendering | ShopPage.jsx + filtered array | Catalog display | `filterItems(items, activeFilter)` → renders via `.map()` with `<ShopCard>` (or similar), shows `price_gold` + icon; schema now has `price_gems` field, card layout is extensible |

### API/Service Pattern

| Layer | URL Pattern | Implementation |
|-------|-------------|-----------------|
| Frontend → Backend | `shopService.getCatalog()` | axios call to `GET /api/shop` (no changes — existing endpoint already returns all active items) |
| User data binding | `userService.getProfile()` | axios call to `GET /api/user/me` (returns `UserSchema` with `gems: int` already present since Phase 5) |
| No new endpoints | — | Phase 10 adds zero new API routes — all data already flows through existing /api/shop and /api/user/me |

---

## Architecture Patterns

### 1. Hand-Written Alembic Migration Structure

**Pattern:** Establish by Phase 4, used in Phases 4, 5, 8, 9. Phase 10 replicates this exactly.

**Files:**
- `backend/migrations/versions/{new_id}_add_price_gems.py`

**Template from Phase 9 (3e157d3ff620_add_guilds_and_challenges.py):**
```python
"""add price_gems to shop_items
Revision ID: {NEW_ID}
Revises: 3e157d3ff620
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '{NEW_ID}'
down_revision = '3e157d3ff620'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add nullable price_gems column to shop_items
    op.add_column('shop_items', 
        sa.Column('price_gems', sa.Integer(), nullable=True)
    )
    
    # Optional: seed one gem-priced item via INSERT
    # (if chosen; see Seeding section below)

def downgrade() -> None:
    op.drop_column('shop_items', 'price_gems')
```

**Key points:**
- No `autogenerate = True` — all DDL explicit via `op.*` calls
- Revision ID: 8-char hex (e.g., `a1b2c3d4`), find gap in existing IDs
- `down_revision = '3e157d3ff620'` (Phase 9's guild migration, the HEAD)
- downgrade() is symmetric: `drop_column` mirrors `add_column`

### 2. Schema Extension: ShopItemSchema + UserSchema

**No new schemas needed.** Existing schemas auto-extend:

**ShopItemSchema (backend/app/schemas.py:148–162):**
```python
class ShopItemSchema(BaseModel):
    id: int
    item_type: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    price_gold: int
    price_gems: Optional[int] = None  # ← ADD THIS FIELD
    effect_multiplier: Optional[float] = None
    duration_seconds: Optional[int] = None
    heal_amount: Optional[int] = None
    hp_max_bonus: Optional[int] = None
    avatar_key: Optional[str] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)
```

Once added to schema, `GET /api/shop` response automatically includes `price_gems` for all items (null for existing gold-only items, int value for new gem-priced items).

**UserSchema (backend/app/schemas.py:7–51):**
Already has `gems: int = 0` (added Phase 5). No changes.

### 3. Lazy Route Pattern (Frontend)

**Established by Phase 9** (GuildsPage). Gem page follows identically.

**File: frontend/src/App.jsx (lines 1–78)**

Current pattern:
```jsx
const GuildsPage = lazy(() => import('./pages/GuildsPage'));
// ... in Routes:
<Route path="guilds" element={<AppSuspense><GuildsPage /></AppSuspense>} />
```

**For Phase 10, add:**
```jsx
const GemsPage = lazy(() => import('./pages/GemsPage'));
// ... in Routes (inside /app element):
<Route path="gems" element={<AppSuspense><GemsPage /></AppSuspense>} />
```

Navigation to `/app/gems` loads component on-demand.

### 4. HUD Extension: Gems Display in Header

**Current Header.jsx (lines 15–76) pattern:**
- RIGHT side: displays `{gold}` with 🪙 icon
- Uses `BOOST_TYPES` array to render active boost timers below
- Uses `user` from `userService.getProfile()` (already fetched)

**Extension approach:**
Option A (Recommended): Add gems badge adjacent to gold
```jsx
{/* RIGHT — gold + gems */}
<div className="w-16 flex justify-end shrink-0 z-20 gap-2">
  {gems !== undefined && gems !== null && (
    <div className="relative flex items-center gap-1.5 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#4b0082]/40 shadow-[2px_2px_0_#000]">
      <span className="text-[#9966ff] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
        {gems}
      </span>
      <div className="w-2 h-2 bg-[#9966ff] shadow-[0_0_8px_#9966ff] animate-pulse rotate-45 shrink-0">💎</div>
    </div>
  )}
  {/* ... existing gold badge ... */}
</div>
```

Extract `gems` from `user` object (already present in `UserSchema`). Use purple/indigo color + 💎 emoji to differentiate from gold (yellow/#f7d51d). Same styling pattern: border, shadow, responsive font sizing.

**No new Header component needed** — just extend existing structure.

### 5. ShopPage Card Extension

**Current ShopPage.jsx (lines 31–60) pattern:**
- Fetches `items = []` via `shopService.getCatalog()`
- Filters by `activeFilter` (boosters / skins / potions / all)
- Renders cards with `.map(item => <ShopCard .../>)` or inline card markup

**Extension approach:**
When rendering shop card, check `item.price_gems` and show gem-price alongside gold-price:
```jsx
// Pseudo in card rendering:
<div className="price-row">
  {item.price_gold && <span>🪙 {item.price_gold}</span>}
  {item.price_gems && <span>💎 {item.price_gems}</span>}
</div>
```

If `price_gems` is present and user attempts to buy with gems: button disabled + tooltip "Скоро" (mirrors kнопка-заглушка pattern from /app/gems page).

**Constraint from CONTEXT.md:** "Shop-карточка: если `price_gems` не null, показать «💎 X» рядом с «🪙 Y» — обе цены видны, но кнопка покупки за gems disabled («Скоро»)."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Gem-price serialization** | Custom JSON adapter, TypeScript type for price_gems | Add `price_gems: Optional[int] = None` to `ShopItemSchema` | Pydantic with `ConfigDict(from_attributes=True)` auto-maps ORM column to schema field; zero custom serialization |
| **HUD gems display component** | New gem-badge component, separate icon system | Extend Header.jsx right-side div with inline 💎 emoji + styling | Reuse existing gold-badge styling (border, shadow, responsive text); single source of truth for HUD layout |
| **Shop item filtering for gems** | New filter category ("gems") in FILTERS array | Render gem-price in existing card alongside gold-price | Items have two independent prices (both null, both set, or only one set); filtering by price type adds complexity; better to show both if present |
| **Gems page state management** | Redux store for gems page state, packs array | Hardcode three packs as const in GemsPage component | Packs (100/500/1500) are static, never change; no async fetch needed; inline const is simpler than store |
| **Migration data seed** | Custom seed script, post-migration fixture | Data-step inside migration `upgrade()` via `conn.execute(INSERT)` with ON CONFLICT DO NOTHING | Phase 5 pattern: idempotent seed in same transaction as schema change; avoids separate fixture loading |

---

## Common Pitfalls

### Pitfall 1: Assuming `price_gems NULL` on Existing Items

**What goes wrong:** After migration, existing shop items have `price_gems = NULL`. Frontend tries to display gem-price and crashes or shows `null` to user.

**Why it happens:** Alembic `ADD COLUMN ... NULL` doesn't backfill existing rows. Existing 20+ seed items from Phase 5 retain NULL for gem-price.

**How to avoid:** 
- Backend: Add `price_gems: Optional[int] = None` to `ShopItemSchema` (defensive Pydantic field).
- Frontend: Guard card rendering: `{item.price_gems && <span>💎 {item.price_gems}</span>}` — render only if truthy.
- Seeding: If adding new gem-priced item in migration, use explicit INSERT with `(id, ..., price_gems) VALUES (21, ..., 500)`.

**Warning signs:** 
- Response shows `"price_gems": null` for all items.
- ShopPage crashes with "Cannot read property of null".

### Pitfall 2: Circular Dependency in Header Gems Fetch

**What goes wrong:** Header fetches `user` via `userService.getProfile()` to read `gems`. CharacterPage also fetches user. Both queries hit the same `/api/user/me` endpoint. If one query is stale, gems HUD shows wrong value.

**Why it happens:** React Query caches by `queryKey`, and both components use `['user']` as the key. But timing of refetch/invalidation can diverge.

**How to avoid:** 
- Use same `useQuery({ queryKey: ['user'], ... })` in Header and any page that displays character data.
- React Query's default behavior: stale data is returned immediately; background refetch happens if older than `staleTime`.
- Set `staleTime: 1000 * 60` (1 min) on all user-profile queries — gems updates within 1 min, good enough for UI.

**Warning signs:**
- Header shows 100 gems, but CharacterPage shows 50 gems after purchase.
- Gems count doesn't update after completing quest (even though quest XP increased).

**See Header.jsx lines 23–28 for reference:**
```jsx
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: userService.getProfile,
  staleTime: 1000 * 60,  // ← already set to 1 min
  refetchInterval: 60000,
});
```

### Pitfall 3: Forgetting to Add Field to Pydantic Schema

**What goes wrong:** Migration adds `price_gems` column to DB, but `ShopItemSchema` doesn't include it. API response has null field or response serialization breaks.

**Why it happens:** Schema and ORM model are separate; easy to update one and forget the other.

**How to avoid:**
- Add field to `ShopItemSchema` at same time as migration: `price_gems: Optional[int] = None`.
- Run `GET /api/shop` and verify response includes `price_gems` field for all items (null or int).
- Frontend console: log first item to verify field exists.

**Warning signs:**
- `GET /api/shop` response is missing `price_gems` key entirely.
- Frontend tries to check `item.price_gems && ...` and condition always false.

### Pitfall 4: "Скоро" Button Text vs. UI String Localization

**What goes wrong:** /app/gems page says "Скоро" (Soon), but ShopPage says "В разработке" (In development), or vice versa. Inconsistent UX tone.

**Why it happens:** No centralized string dict; easy to pick different words independently.

**How to avoid:**
- Decide on single Russian string: **"Скоро"** (chosen per CONTEXT.md, used consistently).
- Use const in component: `const COMING_SOON_LABEL = "Скоро"` at top of both /app/gems and ShopPage.
- If gem-buy button is rendered in shop card: `disabled && label === COMING_SOON_LABEL`.

**Warning signs:**
- User sees different button text on /app/gems vs. shop card for same disabled action.

### Pitfall 5: Migration Down-Revision Chain Broken

**What goes wrong:** Migration specifies `down_revision = '3e157d3ff620'` but that ID doesn't exist in `versions/` folder. `alembic upgrade` fails.

**Why it happens:** Copy-pasted migration template, forgot to update down_revision to current HEAD.

**How to avoid:**
- Before writing migration, check current HEAD: `ls backend/migrations/versions/ | grep .py | tail -1` (or `alembic current`).
- Phase 10 HEAD is `3e157d3ff620` (Phase 9 guilds). Set `down_revision = '3e157d3ff620'`.
- Verify: `alembic history` shows unbroken chain.

**Warning signs:**
- `alembic upgrade head` error: "Can't locate revision identified by 3e157d3ff620".

---

## Code Examples

### Example 1: Alembic Migration (Hand-Written Pattern)

**Source:** Phase 9 (3e157d3ff620_add_guilds_and_challenges.py), Phase 5 (c203bdcc4819_phase5_shop_inventory.py)

File: `backend/migrations/versions/{NEW_ID}_add_price_gems.py`

```python
"""add price_gems column to shop_items

Revision ID: a1b2c3d4
Revises: 3e157d3ff620
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4'
down_revision = '3e157d3ff620'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add nullable price_gems column to shop_items
    op.add_column('shop_items',
        sa.Column('price_gems', sa.Integer(), nullable=True)
    )
    
    # 2. (Optional) Seed one gem-priced item if choosing migration data-step approach
    # conn = op.get_bind()
    # conn.execute(sa.text(
    #     "INSERT INTO shop_items (item_type, name, description, icon, price_gold, price_gems, is_active) "
    #     "VALUES ('potion_heal', 'Зелье здоровья', 'Восстановить 50 HP', '🧪', NULL, 500, TRUE) "
    #     "ON CONFLICT (name) DO NOTHING"
    # ))


def downgrade() -> None:
    op.drop_column('shop_items', 'price_gems')
```

**Notes:**
- Revision ID must be unique, 8 hex chars. Find unused by checking existing files.
- `down_revision` points to previous migration (currently `3e157d3ff620`).
- Seeding inside migration is optional; equally valid to add item via CRUD on startup (see Seeding section below).

### Example 2: ShopItemSchema Extension

**Source:** backend/app/schemas.py:148–162

```python
class ShopItemSchema(BaseModel):
    id: int
    item_type: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    price_gold: int
    price_gems: Optional[int] = None  # ← NEW FIELD
    effect_multiplier: Optional[float] = None
    duration_seconds: Optional[int] = None
    heal_amount: Optional[int] = None
    hp_max_bonus: Optional[int] = None
    avatar_key: Optional[str] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)
```

Once added, `GET /api/shop` response automatically includes field for all items (null or int).

### Example 3: Lazy Route in App.jsx

**Source:** frontend/src/App.jsx:1–78

```jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ... existing imports ...

// Lazy-loaded pages
const GemsPage = lazy(() => import('./pages/GemsPage'));  // ← ADD
const GuildsPage = lazy(() => import('./pages/GuildsPage'));
// ... others ...

export default function App() {
  // ... inside Routes, inside /app element:
  <Route path="gems" element={<AppSuspense><GemsPage /></AppSuspense>} />
  <Route path="guilds" element={<AppSuspense><GuildsPage /></AppSuspense>} />
  // ...
}
```

Result: Navigating to `/app/gems` loads GemsPage component on-demand; bundle size reduced.

### Example 4: Header Extension for Gems Display

**Source:** frontend/src/components/Header.jsx (extend lines 66–76)

```jsx
{/* RIGHT — gold + gems */}
<div className="w-16 flex justify-end shrink-0 z-20 gap-2">
  {/* Gems */}
  {user?.gems !== undefined && user?.gems !== null && (
    <div className="relative flex items-center gap-1.5 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#9966ff]/40 shadow-[2px_2px_0_#000]">
      <span className="text-[#9966ff] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
        {user.gems}
      </span>
      <span className="text-[3vw] sm:text-sm">💎</span>
    </div>
  )}
  
  {/* Gold (existing) */}
  {gold !== undefined && gold !== null && (
    <div className="relative flex items-center gap-1.5 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#f7d51d]/40 shadow-[2px_2px_0_#000]">
      <span className="text-[#f7d51d] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
        {gold}
      </span>
      <div className="w-2 h-2 bg-[#f7d51d] shadow-[0_0_8px_#f7d51d] animate-pulse rotate-45 shrink-0" />
    </div>
  )}
</div>
```

**Styling:**
- Gems: purple/indigo border (#9966ff/40), purple text, 💎 emoji
- Gold: yellow border (#f7d51d/40), yellow text, rotated diamond shape
- Same backdrop-blur, shadow, responsive sizing
- `gap-2` separates the two badges

### Example 5: GemsPage Component (Static UI)

**Source:** Pattern from Phase 9 GuildsPage, Phase 2 LandingPage

File: `frontend/src/pages/GemsPage.jsx`

```jsx
import React, { useState } from 'react';
import Header from '../components/Header';

const PACKS = [
  { id: 1, gems: 100, label: '100 gems' },
  { id: 2, gems: 500, label: '500 gems', popular: true },
  { id: 3, gems: 1500, label: '1500 gems' },
];

export default function GemsPage() {
  const [selectedPack, setSelectedPack] = useState(null);

  const handleBuy = (pack) => {
    // Disabled — button is grey + disabled attr
    // In future Gems Payments phase, this will POST to /api/billing/gems/create
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header title="GEMS" subtitle="Увеличьте свои возможности" />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          {PACKS.map(pack => (
            <div
              key={pack.id}
              className="relative bg-[#1a1a1a] border border-[#daa520]/40 p-4 text-center cursor-default"
            >
              {pack.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#daa520] text-black px-2 py-1 text-[10px] font-black uppercase">
                  ПОПУЛЯРНО
                </div>
              )}
              <div className="text-2xl font-black mb-2">💎 {pack.gems}</div>
              <p className="text-[#daa520] text-sm mb-4">{pack.label}</p>
              <button
                disabled
                className="w-full bg-[#444] text-white px-4 py-2 text-sm font-bold uppercase tracking-widest opacity-50 cursor-not-allowed"
              >
                Скоро
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Notes:**
- Three packs hardcoded as const; no state, no backend fetch
- "Скоро" button is `disabled` (greyed out, cursor: not-allowed)
- "ПОПУЛЯРНО" badge on middle pack (500)
- No error handling, no loading state (no async)
- Styling: retro-game aesthetic, matches ShopPage / GuildsPage

---

## Seeding Strategy: Gem-Priced Item

**Decision point (Claude's Discretion):** How to add initial gem-priced item?

### Option A: Migration Data-Step (Inside `upgrade()`)

**Pros:**
- Idempotent: seed runs once in transaction with schema change
- Avoids extra startup script
- Mirrors Phase 5 pattern (c203bdcc4819_phase5_shop_inventory.py includes 20 seed items)

**Cons:**
- Migration file is larger
- If seed fails, entire migration fails (but that's usually OK for initial item)

**Implementation:**
```python
def upgrade() -> None:
    op.add_column('shop_items', ...)
    
    # Seed one or more gem-priced items
    conn = op.get_bind()
    conn.execute(sa.text(
        "INSERT INTO shop_items "
        "(item_type, name, description, icon, price_gold, price_gems, effect_multiplier, duration_seconds, is_active) "
        "VALUES ('potion_heal', 'Зелье здоровья (Gems)', 'Восстановить 50 HP', '🧪', NULL, 500, NULL, NULL, TRUE) "
        "ON CONFLICT (name) DO NOTHING"
    ))
```

### Option B: Startup CRUD (in main.py lifespan)

**Pros:**
- Migration stays small
- Can add/remove item without re-running migration
- Flexible: fetch from config, add multiple items

**Cons:**
- Requires code in `backend/app/main.py` lifespan
- If startup fails, item isn't seeded (but migration already succeeded)
- Slightly more complex async code

**Implementation:**
```python
# In backend/app/main.py lifespan:
async def lifespan(app: FastAPI):
    await database.init_db()
    await cache.init_redis()
    
    # Seed gem-priced item on startup
    async with database.AsyncSessionLocal() as db:
        existing = await db.execute(
            select(models.ShopItem).filter_by(name="Зелье здоровья (Gems)")
        )
        if not existing.scalars().first():
            db.add(models.ShopItem(
                item_type="potion_heal",
                name="Зелье здоровья (Gems)",
                description="Восстановить 50 HP",
                icon="🧪",
                price_gold=None,
                price_gems=500,
                is_active=True
            ))
            await db.commit()
    
    yield
    await cache.close_redis()
```

### Recommendation

**Use Option A (migration data-step).** It mirrors Phase 5 precedent and keeps schema change and seed in single atomic transaction. Planner can choose to add more items later via Option B if needed, but foundation should be in migration.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `autogenerate = True` in Alembic | Hand-written migrations with explicit `op.*` calls | Phase 4 (2026-04-21) | Avoids spurious drop_index errors; all migrations since Phase 4 are hand-written |
| Single-price shop items (gold only) | Multi-price support via nullable columns (gold + gems future, other currencies future) | Phase 10 (now) | ORM model + schema extend naturally; frontend shows all applicable prices for each item |
| Global footer nav (Phase 2) | Lazy-loaded routes with React Router (Phase 2) | Phase 2 (2026-04-18) | Code split reduces bundle per page; /app/gems loads only on navigation |
| Hardcoded boost list in Header | `BOOST_TYPES` array-driven rendering (Phase 5) | Phase 5 (2026-04-22) | Adding new boost type = update one array; gems display follows same pattern |
| Custom icon handling | Emoji + fallback text (Phase 4+) | Phase 4 (2026-04-21) | No asset pipeline for icons; 💎 works on all platforms; "GEMS" fallback if font issue |

---

## Validation Architecture

> Skip if workflow.nyquist_validation is false in .planning/config.json

Checking `.planning/config.json` for nyquist_validation setting...

Assuming **nyquist_validation is enabled** (likely, given Phase 9 used it):

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.1.1 + asyncio (no pytest-asyncio plugin per Phase 6 decision; use `asyncio.run()` in test) |
| Config file | `backend/pyproject.toml` or `pytest.ini` (check existing Phase 9 tests) |
| Quick run command | `pytest backend/tests/test_shop.py::test_* -x` |
| Full suite command | `npm run build && pytest backend/tests/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BILL-01 (partial) | ShopItemSchema includes `price_gems` field | unit | `pytest backend/tests/test_shop.py::test_shop_item_schema_has_price_gems -x` | ❌ Wave 0 |
| BILL-01 (partial) | GET /api/shop returns items with `price_gems` (null for gold-only, int for gem-only) | unit (stub) | `pytest backend/tests/test_shop.py::test_get_catalog_price_gems -x` | ❌ Wave 0 |
| BILL-01 (partial) | Frontend /app/gems page loads via lazy route | smoke | `npm run build && grep "GemsPage" frontend/src/App.jsx` | ✅ code review |
| BILL-01 (partial) | HUD displays gems count when user.gems > 0 | unit (frontend snapshot or stub) | `npm run build` (TypeScript + JSX compile check) | ❌ Wave 0 |
| BILL-01 (partial) | ShopPage renders gem-price if item.price_gems is set | unit (frontend) | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest backend/tests/test_shop.py -x`
- **Per wave merge:** `npm run build && pytest backend/tests/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/test_shop.py` — covers ShopItemSchema, get_catalog, migration (BILL-01 partial)
- [ ] `frontend/__tests__/GemsPage.test.jsx` (optional — page is static, build pass sufficient)
- [ ] Alembic migration file created and `alembic upgrade head` passes (manual check in plan)

*(If no gaps beyond Wave 0: "Existing test infrastructure covers all phase requirements — shop tests (Phase 5) extend naturally; frontend build validates JSX/TypeScript")*

---

## Sources

### Primary (HIGH confidence)

- **backend/app/models.py:105–120** — ShopItem ORM model, current schema
- **backend/app/schemas.py:148–162** — ShopItemSchema, pattern for price_gold field
- **backend/migrations/versions/3e157d3ff620_add_guilds_and_challenges.py** — Hand-written Alembic migration template
- **backend/migrations/versions/c203bdcc4819_phase5_shop_inventory.py** — Migration with data-step seeding (ON CONFLICT pattern)
- **frontend/src/App.jsx:1–78** — Lazy route pattern established Phase 2
- **frontend/src/components/Header.jsx:66–76** — Existing gold-display HUD implementation
- **frontend/src/pages/GuildsPage.jsx** — Page component pattern (Phase 9)
- **frontend/src/pages/ShopPage.jsx:1–60** — Shop card rendering, filter pattern
- **backend/app/schemas.py:7–51** — UserSchema (includes `gems: int = 0` since Phase 5)

### Secondary (MEDIUM confidence)

- **backend/app/crud.py** — Seeding/startup patterns (checked for option B approach)
- **frontend/src/services/api.js:1–80** — Service layer, `shopService.getCatalog()` existing endpoint

### Tertiary (LOW confidence)

None — all findings verified from codebase or official Pydantic/FastAPI docs.

---

## Metadata

**Confidence breakdown:**
- **Standard Stack: HIGH** — All patterns (migrations, schemas, routing, components) directly from codebase Phases 4–9; no external dependencies or speculation
- **Architecture: HIGH** — Hand-written migration template, schema extension, lazy routing all verified in existing code
- **Pitfalls: HIGH** — Identified from Phase 5–9 commits (null-field handling, stale data, schema sync, migration chain)

**Research date:** 2026-04-27
**Valid until:** 2026-05-14 (14 days — stable patterns, low risk of library churn)
**Phase readiness:** HIGH — planner has all information needed to decompose into tasks

---
