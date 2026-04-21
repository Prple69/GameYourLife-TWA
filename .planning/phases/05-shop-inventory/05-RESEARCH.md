# Phase 5: Shop & Inventory - Research

**Researched:** 2026-04-21
**Domain:** E-commerce system with consumables, timers, and cosmetics
**Confidence:** HIGH (user decisions locked, existing patterns verified in codebase)

## Summary

Phase 5 implements a shop and inventory system where users spend earned gold on three categories of items: consumables (multiplier boosts and healing potions), timers (active boosts with expiration), and cosmetics (avatar skins). The architecture is straightforward: seed data in shop_items table, inventory tracking via inventory_items, idempotent purchase/activation endpoints, and lazy expiration (no background scheduler). Multiplier effects are computed at read-time by checking if `active_*_expires_at > now()` on the User model.

**Key insight:** This is not a complex subsystem — it's a straightforward CRUD domain with atomic purchase/activation flows and client-side timer rendering. The main complexity is ensuring atomicity and idempotency, which the project already demonstrates in quest completion logic.

**Primary recommendation:** Use denormalized User columns for active boosts (14 new columns) rather than a normalized table — simpler to implement, matches existing User model density, avoids JOIN on every user read. Seed shop_items via Alembic data migration (preferred over startup hook for reproducibility).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Catalog structure:** 3 major item classes:
   - **Boosters** (item_type = `booster_xp`, `booster_gold`, `booster_strength_xp`, `booster_wisdom_xp`, `booster_endurance_xp`, `booster_charisma_xp`, `booster_hp_max`): activate with one slot per type, `expires_at` timer, lazy-compute `effective_*_mult` in read-path
   - **Potions** (item_type = `potion_heal`): instant consume, no expiration, no slot
   - **Skins** (item_type = `skin`): collection-based (quantity stays 1), equip via separate endpoint

2. **Boost parameters in seed, not code:** Each `booster_*` row carries `effect_multiplier` and `duration_seconds` — enables "Small XP Elixir (1.25× / 15min)" and "Great XP Elixir (2.0× / 60min)" as separate rows of same type with different prices.

3. **One active slot per boost type:** Activating `booster_xp` returns 409 `already_active` if slot is occupied. Different types (XP vs gold, stat-XP boosters) are independent. HP-max boost is a separate slot (does not collide with any other).

4. **Idempotency pattern:** All mutations (`/buy`, `/activate`, `/equip`) accept `idempotency_key: UUID` in body. Frontend generates UUID on click. Backend caches response in `idempotency_keys` table with `UNIQUE(user_id, key)`. Repeats return original response (200, same body).

5. **Lazy expiration (no scheduler):** No cron/background task. `UserSchema` response (and any endpoint reading user) computes effective values on-demand:
   - `effective_xp_mult = active_xp_mult if (active_xp_expires_at AND now < active_xp_expires_at) else 1.0`
   - Applied in `complete_quest` when awarding XP and stat-XP
   - Applied in HP clamping: if `hp > effective_max_hp` after hp-max boost expires → clamp to new max

6. **Purchase flow:** Confirm modal (reuse ConfirmModal.jsx) → UUID generated → `POST /api/shop/buy/{id}` with body `{idempotency_key}` → atomic: check gold ≥ price, check idempotency record, deduct gold, upsert inventory_items (quantity += 1 if exists, else insert), save idempotency.

7. **Activation flow:** `POST /api/inventory/{id}/activate` with idempotency_key. Backend dispatches by item_type:
   - `booster_*`: check slot free, if yes: `quantity -= 1` (delete if 0), set `active_<type>_mult` and `active_<type>_expires_at = now + duration_seconds`
   - `potion_heal`: `hp = min(hp + heal_amount, effective_max_hp)`, `quantity -= 1`
   - `skin`: return 400 "use /equip endpoint"

8. **Equip flow (skins):** `POST /api/inventory/{id}/equip` with idempotency_key. Validates `item_type = 'skin'` → sets `user.selected_avatar = shop_item.avatar_key`. Quantity untouched.

9. **Cannot cancel active boost:** No endpoint to cancel early. Active timer runs to completion. Aligns with RPG logic ("you drank the potion, no getting it back").

10. **Quest slot cap (5):** Hardcoded `MAX_ACTIVE_QUESTS = 5` in `game_logic.py` or env var. `POST /api/quests/save` checks count of active quests; if ≥ 5 → 409 `active_limit_reached`. Frontend disables "+ New quest" button and shows "5/5". No shop upsell link (SHOP-04 Out of Scope).

11. **UI: ShopPage 4 tabs:** «Все» / «Бусты» / «Скины» / «Зелья» chips. Retro card style (black glass, gold border, price button right). Filter "slots" removed (SHOP-04 OOS). Data source: `GET /api/shop` + `useQuery(['shop-items'])`.

12. **UI: InventoryPage sections:** Replace 4×4 grid with:
    - Active effects (only if timer > now) — rows with icon, name, timer mm:ss, no actions
    - Boosters — grid owned `booster_*` with quantity badge, "Activate" button (disabled if slot occupied)
    - Skins — grid owned `skin` with "Equip" button, highlight current `user.selected_avatar`
    - Potions — owned `potion_heal` with quantity, "Use" button

13. **UI: AvatarSelector premium locks:** Premium skins without ownership show grayscale + lock icon + price overlay. Click → navigate `/app/shop?filter=skins` (not inline purchase).

14. **UI: Header active boosts:** Compact row of boost icons + mm:ss timer, ticks on client via `setInterval(1000)`, recomputed from `expires_at`. React-query invalidate `['user']` every 60s to catch server-side expiration.

15. **UI: completion-popup boost info:** If active boost affected reward, add row "⚡ XP-буст ×1.5" under rewards in the completion toast (visual attribution from Phase 4).

16. **Skin migration & catalog:**
   - `avatar1` Knight → free (default for new users)
   - `avatar2` Mage → premium, seed in shop_items
   - `avatar3` Shadow → premium, seed in shop_items
   - +2-3 new premium skins with CSS-filter placeholders (hue-rotate/sepia over avatar1)
   - No migration of existing DB users (DB is test-only, production not launched)

17. **Seed data (~24 items, 100–2000 gold):** Exact prices/multipliers/durations are Claude's Discretion within decided ranges. Examples: booster_xp 3 variants (1.25×/1.5×/2.0×, 15/30/60 min, 100/300/800 gold), booster_<stat>_xp 2 per stat × 4 stats, potion_heal 3 variants (25/50/100 heal, 50/150/400 gold), skins 5 total.

### Claude's Discretion

- **Denormalized user-boost columns vs normalized `user_active_boosts` table:** Decided to use denormalization (14 new User columns).
- **Exact seed prices / multipliers / durations:** Planner may review balance.
- **Emoji/icon choice:** lucide-react icons or emoji for catalog.
- **Placeholder art:** CSS filters (hue-rotate, sepia) on avatar1 for new skins.
- **Toast animations:** Specifics of in/out timing for completion-popup.
- **Seed method:** Alembic data migration vs startup hook — Alembic preferred (idempotent, reproducible).
- **Idempotency store:** Table (chosen) vs Redis (deferred to Phase 11).
- **MAX_ACTIVE_QUESTS location:** Config env var vs hardcoded in game_logic.py.
- **AvatarSelector locked-skin UX:** Inline checkout vs navigate to shop (chosen: navigate).
- **Active boost ordering in Header:** Sorting by expiration time if multiple active.

### Deferred Ideas (OUT OF SCOPE)

- **Equipment/gear with passive bonuses** — Phase 5.5 or later
- **Unique items** (2nd life, respawn, one-time effects) — bundle with equipment
- **SHOP-04 (quest slot purchase)** — moved to Out of Scope in REQUIREMENTS.md forever
- **Background cleanup of expired boosts** — Phase 11 production polish
- **Redis idempotency** — Phase 11 (Redis not in prod until then)
- **User migration/backfill** — production DB not launched yet
- **AvatarSelector inline purchase** — post-Phase 5 UX polish
- **Skin impact on AI prompt / storytelling** — cosmetic only in Phase 5

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHOP-01 | User can browse a shop catalog showing items with name, description, and gold cost | `GET /api/shop` endpoint returns seed shop_items; frontend ShopPage.jsx uses `useQuery(['shop-items'])`; seed data in Alembic migration. |
| SHOP-02 | User can purchase XP multiplier boost items with earned gold | `POST /api/shop/buy/{id}` atomic flow: verify gold, idempotency, deduct gold, upsert inventory_items; booster_xp item_type with effect_multiplier in seed. |
| SHOP-03 | User can purchase gold multiplier boost items with earned gold | Same atomic purchase flow; booster_gold item_type. |
| SHOP-05 | User can purchase cosmetic avatar skins with earned gold | Same atomic purchase flow; skin item_type; equipped via `POST /api/inventory/{id}/equip`. |
| INV-01 | User can view all owned items in their inventory | InventoryPage.jsx queries owned inventory_items grouped by item_type (boosters/skins/potions); display with quantity badges and action buttons. |
| INV-02 | User can activate owned boost items from inventory (applies effect immediately) | `POST /api/inventory/{id}/activate` dispatches by item_type (booster_*/potion); sets active_<type>_expires_at, applies multiplier on next `complete_quest`; lazy-expire via effective_* computed fields. |
| INV-03 | User can equip owned avatar skins from inventory | `POST /api/inventory/{id}/equip` validates skin type, sets `user.selected_avatar`, persists in next user read. |

**Note:** SHOP-04 (quest slot purchase) REMOVED from Phase 5 scope — moved to Out of Scope in REQUIREMENTS.md. Quest slot cap (5) is enforced via `MAX_ACTIVE_QUESTS` constant in game_logic.py, not purchasable.

</phase_requirements>

---

## Standard Stack

### Core Backend

| Component | Library/Pattern | Version | Purpose | Why Standard |
|-----------|-----------------|---------|---------|--------------|
| ORM | SQLAlchemy async | 2.x | Async query execution, relationships | Project baseline since Phase 1; mature async support |
| Migrations | Alembic | 1.x | Schema versioning, data migrations | SQLAlchemy convention; reproducible seed data |
| Database | PostgreSQL | 14+ | Relational storage | Project baseline; UUID/JSON/decimal support mature |
| API Framework | FastAPI | 0.100+ | HTTP endpoints, dependency injection | Project baseline; Depends() pattern used Phase 3+ |
| Async Runtime | asyncio | stdlib | Async/await orchestration | FastAPI native; no external deps |

### Core Frontend

| Component | Library/Version | Purpose | Why Standard |
|-----------|-----------------|---------|--------------|
| State | `@tanstack/react-query` | 4.x+ | Server state, cache invalidation | Project uses Phase 3+; `useQuery`/`setQueryData` patterns established |
| HTTP | axios | 1.x | Request client, interceptors | Project baseline; Bearer auth interceptor in place |
| UI Components | Tailwind CSS | 3.x+ | Retro styling | Existing ShopPage/InventoryPage skeleton uses this |
| Modal/Dialog | Custom (ConfirmModal.jsx) | — | Reusable confirm dialog | Exists; avoids external dependency |
| Icons | lucide-react or emoji | — | Item icons in catalog | Project uses lucide elsewhere; emoji simpler for retro aesthetic |

### Supporting Libraries

| Library | Purpose | When Needed |
|---------|---------|------------|
| `uuid` (Python) | Idempotency key generation | Backend validation of UUIDs in request body |
| `uuid.v4()` (JS) | Client-side UUID generation | Frontend button-click handler, before POST |
| `@tanstack/react-query` QueryClient | Cache invalidation | After mutation, `queryClient.invalidateQueries(['user'], ['inventory'])` |

---

## Architecture Patterns

### Backend: Atomic Mutations (Established in Phase 4)

**Pattern:** All purchase/activation flows follow the quest completion atomic pattern:
```python
async with db.begin():  # transaction
    # 1. Check preconditions (gold, slot, idempotency)
    # 2. Apply mutations (deduct gold, update inventory)
    # 3. Commit (auto on context exit)
```

**Example structure for purchase:**
```python
@router.post("/api/shop/buy/{shop_item_id}")
async def buy_item(
    shop_item_id: int,
    body: PurchaseRequest,  # { idempotency_key: str }
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    async with db.begin():
        # Check idempotency
        idem = await db.execute(select(models.IdempotencyKey).filter(...))
        if idem.scalars().first():
            return cached_response  # 200
        
        # Validate gold
        item = await db.execute(select(models.ShopItem).filter(...))
        if user.gold < item.price_gold:
            raise HTTPException(400, "insufficient_gold")
        
        # Atomic: deduct + upsert inventory
        user.gold -= item.price_gold
        # upsert_inventory_item(db, user.id, item.id, quantity=1)
        
        # Save idempotency
        cache_entry = models.IdempotencyKey(
            user_id=user.id,
            key=body.idempotency_key,
            response_json=json.dumps(result),
        )
        db.add(cache_entry)
    # Commit on exit
    return result
```

**Key:** Same pattern as `complete_quest` in Phase 4 — transaction begin/end automatic, mutations flow within.

### Frontend: Query Invalidation Pattern (Established in Phase 3+)

**Pattern:** After mutation, invalidate affected query keys:
```javascript
const queryClient = useQueryClient();

const handleBuy = async (itemId) => {
  const idempotencyKey = uuidv4();
  const result = await shopService.buy(itemId, { idempotency_key: idempotencyKey });
  
  // Optimistic or full refetch
  queryClient.setQueryData(['user'], prev => ({
    ...prev,
    gold: prev.gold - item.price_gold,
  }));
  // OR
  queryClient.invalidateQueries(['user']);
  queryClient.invalidateQueries(['inventory']);
};
```

**Key:** Matches Phase 4 pattern in `complete_quest` UI flow — familiar to codebase.

### Lazy Expiration on Read

**Pattern:** No scheduler. Effective values computed at read-time in response builder or UserSchema:

```python
@router.get("/api/user/me")
async def get_user(user: models.User = Depends(get_current_user)):
    # Compute effective boosts before returning
    now = get_msk_now()
    resp = UserSchema.from_orm(user)
    
    resp.effective_xp_mult = (
        user.active_xp_mult 
        if user.active_xp_expires_at and user.active_xp_expires_at > now 
        else 1.0
    )
    return resp
```

**Key:** No extra tables, no cron, simple and correct. Expires naturally in subsequent reads.

### Idempotency via Stored Responses

**Pattern:** Request has UUID body field. If UUID exists in idempotency_keys table, return cached response; else execute and cache.

**Advantage:** Works even if POST is sent twice due to network retry — safe, transparent to caller.

**Implementation:** Usually a middleware or early check in route handler (as shown above).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Item state transitions (buy → own → activate) | Custom state machine | SQLAlchemy relationships + UNIQUE constraints | Avoids race conditions; DB guarantees integrity |
| Duplicate purchases (network retry) | Reload logic on client | Idempotency key + cached response | Standard HTTP pattern; survives all retry scenarios |
| Expiring timers without scheduler | Cron cleanup task | Lazy expiration (check at read-time) | Simpler, no operational overhead, correct for this scale |
| Conflicting active boosts | Manual mutex/locking | DB UNIQUE constraint on (user_id, boost_type) + 409 response | Clear semantics, enforced at DB layer |
| Cart/checkout flow | Homemade order system | Atomic transaction (single POST, all-or-nothing) | Avoids cart abandonment, partial payment issues |

**Key insight:** This domain is transactional by nature. Lean on PostgreSQL's ACID guarantees and FastAPI's atomic routes; don't simulate these with app-level locks.

---

## Common Pitfalls

### Pitfall 1: Timezone Mismatch in Expiration Checks

**What goes wrong:** `active_xp_expires_at` stored in UTC, `get_msk_now()` returns MSK (UTC+3), comparison `expires_at > now` fails silently. User thinks boost expired but it hasn't.

**Why it happens:** PostgreSQL stores all DateTime with timezone, but Python datetime comparison needs matching offset. Off by 3 hours locally/on server.

**How to avoid:**
- Always use `get_msk_now()` (from models.py) for current time — it returns `datetime.now(timezone(timedelta(hours=3)))`
- Store `active_*_expires_at` as `DateTime(timezone=True)` in model
- In expiration check: `if active_xp_expires_at and active_xp_expires_at > get_msk_now(): ...`
- Test in test_game_logic.py: mock time, verify boost is active just before expiry and inactive just after

**Warning signs:**
- Boosts appear to expire 3 hours early/late in production
- Header timer showing negative time
- User reports "I bought a 1-hour boost 1 hour ago and it's already gone"

### Pitfall 2: Lost Inventory on Repeated Purchases (Idempotency Fails)

**What goes wrong:** User clicks "Buy" button, network times out, client retries silently. Backend receives POST twice, second request deducts gold again but doesn't re-add inventory (already exists). User loses gold for no item.

**Why it happens:** Missing idempotency check or incorrect UNIQUE constraint on `inventory_items(user_id, shop_item_id)`.

**How to avoid:**
- Add `idempotency_key` to request body — frontend generates UUID on first click
- Query `idempotency_keys(user_id, key)` UNIQUE constraint — cache response if found
- Only on first occurrence: execute purchase, save response to idempotency cache, commit
- Test: send same UUID twice, verify second request returns 200 (same response) not 400/500

**Warning signs:**
- User reports "I was charged twice for one item"
- Inventory shows duplicate entries (shouldn't happen with UNIQUE constraint, but catches logic bugs)

### Pitfall 3: Activating Boost Doesn't Apply to Current Quest Completion

**What goes wrong:** User buys XP boost, immediately completes a quest, expects multiplier applied. Backend fails to multiply reward because `complete_quest` reads old user data before activation updates reach it.

**Why it happens:** `complete_quest` route doesn't refresh user state after activation in separate transaction. Or activation updated DB but `complete_quest` used stale ORM object.

**How to avoid:**
- In `complete_quest`, after fetching user and before reward calc: re-fetch `user = await db.get(models.User, user.id)` or execute fresh SELECT
- Better: compute `effective_xp_mult(user, get_msk_now())` at reward-apply time, not at route entry
- Use lazy expiration pattern: `effective_mult = active_mult if active_expires_at > now else 1.0` at calc time, not in route setup
- Test: activate boost, immediately POST /complete, verify multiplier in response + inventory consumption

**Warning signs:**
- Completion toast shows no multiplier applied when boost is active
- User gold/XP gains don't reflect active boosts in completed quest response
- Boost activation doesn't affect the current quest, only the next one

### Pitfall 4: Skin Already Owned But User Can Buy Twice

**What goes wrong:** User owns `avatar2` skin, clicks "Buy" again → backend executes purchase, duplicate inventory entry is created (no UNIQUE constraint) or quantity becomes 2 (wrong semantic for cosmetics).

**Why it happens:** Missing check for existing skin ownership before purchase, or incorrect UNIQUE constraint definition.

**How to avoid:**
- For skins specifically: check if `(user_id, shop_item_id)` already exists in inventory_items before purchase. If yes → return 409 `already_owned`
- Alternatively: rely on UNIQUE constraint and catch IntegrityError, return 409
- Test: try to buy same skin twice, verify first succeeds (200), second returns 409

**Warning signs:**
- User can own multiple instances of same cosmetic skin
- Inventory shows "×2" or "×3" for a skin (should always be "×1")
- Equip button available for same skin at multiple inventory slots

### Pitfall 5: HP Boost Expires Mid-Quest, HP Goes Negative

**What goes wrong:** User has `active_hp_max` + 50, current HP = 80. Quest fails, penalty = 30 HP → should be clamped to 50. But if hp-max boost expires between quest completion and HP penalty application, effective_max_hp becomes 100, and 80 - 30 = 50 (still fine). But if boost expires in the middle of the penalty calc, effective_max_hp read changes mid-transaction.

**Why it happens:** Non-atomic expiration check. Boost expires after `effective_max_hp` is read but before penalty is applied.

**How to avoid:**
- In `fail_quest`, read `effective_max_hp` ONCE at start of atomic transaction
- Apply penalty within same transaction: `user.hp = max(0, user.hp - penalty) clamped to effective_max_hp`
- Test: set up HP = 100, max_hp = 100, active_hp_max_bonus = 50 (effective = 150), HP = 140. Quest fails, penalty = 50. Clamp to 150 → HP = 90. ✓

**Warning signs:**
- User HP goes negative (< 0) in rare cases
- HP clamping produces wrong value when boost expires during quest fail

### Pitfall 6: Query Doesn't Refresh After Inventory Mutation

**What goes wrong:** User buys item, InventoryPage still shows old inventory. Client-side cache isn't invalidated.

**Why it happens:** Missing `queryClient.invalidateQueries(['inventory'])` after `POST /shop/buy`. React-query returns stale data.

**How to avoid:**
- After any mutation (buy, activate, equip): immediately call `queryClient.invalidateQueries(['inventory'])` and/or `queryClient.invalidateQueries(['user'])`
- Or use optimistic update + refetch: `setQueryData(['inventory'], ...)` then `invalidateQueries`
- Test: buy item, verify InventoryPage updates within 500ms without manual refresh

**Warning signs:**
- "I just bought this, why don't I see it in my inventory?"
- Inventory page shows old state after purchase
- Quit and relaunch fixes the view (server data is correct, client cache stale)

---

## Code Examples

### Backend: Shop Item Seed (Alembic Data Migration)

```python
# File: backend/alembic/versions/{rev}_seed_shop_items.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

def upgrade():
    """Insert seed shop items. Idempotent: uses ON CONFLICT for duplicate names."""
    conn = op.get_bind()
    
    items = [
        # XP Boosters
        ("booster_xp", "Малый эликсир опыта", "XP ×1.25 на 15 мин", 100, 1.25, 900, "⚡"),
        ("booster_xp", "Обычный эликсир опыта", "XP ×1.5 на 30 мин", 300, 1.5, 1800, "⚡"),
        ("booster_xp", "Великий эликсир опыта", "XP ×2.0 на 60 мин", 800, 2.0, 3600, "⚡"),
        # Gold Boosters
        ("booster_gold", "Малая монета удачи", "Gold ×1.25 на 15 мин", 100, 1.25, 900, "🪙"),
        # ... (23 more items)
        # Skins
        ("skin", "Маг", "Примерить облик Мага", 500, None, None, "🧙", "avatar2"),
        ("skin", "Тень", "Примерить облик Тени", 1000, None, None, "🌑", "avatar3"),
    ]
    
    for item_type, name, desc, price, mult, duration, icon, avatar_key in items:
        insert_stmt = text("""
            INSERT INTO shop_items 
              (item_type, name, description, price_gold, effect_multiplier, duration_seconds, icon, avatar_key, is_active)
            VALUES (:type, :name, :desc, :price, :mult, :duration, :icon, :avatar, true)
            ON CONFLICT (name) DO NOTHING
        """)
        conn.execute(insert_stmt, {
            "type": item_type,
            "name": name,
            "desc": desc,
            "price": price,
            "mult": mult,
            "duration": duration,
            "icon": icon,
            "avatar": avatar_key,
        })
    conn.commit()

def downgrade():
    conn = op.get_bind()
    conn.execute(text("DELETE FROM shop_items WHERE item_type IN ('booster_xp', 'booster_gold', ...); "))
    conn.commit()
```

**Pattern:** Seed is idempotent (`ON CONFLICT DO NOTHING`). Safe to run multiple times.

### Backend: Purchase Endpoint with Idempotency

```python
from typing import Optional
import json
import uuid

@router.post("/api/shop/buy/{shop_item_id}")
async def buy_item(
    shop_item_id: int,
    body: dict = Body(...),  # { "idempotency_key": "uuid-string" }
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atomic purchase: verify gold, check idempotency, deduct gold, add to inventory."""
    
    idempotency_key = body.get("idempotency_key")
    if not idempotency_key:
        raise HTTPException(400, "missing_idempotency_key")
    
    try:
        uuid.UUID(idempotency_key)  # Validate UUID format
    except ValueError:
        raise HTTPException(400, "invalid_uuid_format")
    
    async with db.begin():
        # Check idempotency cache
        idem_result = await db.execute(
            select(models.IdempotencyKey).filter(
                models.IdempotencyKey.user_id == user.id,
                models.IdempotencyKey.key == idempotency_key,
            )
        )
        cached_idem = idem_result.scalars().first()
        if cached_idem:
            return json.loads(cached_idem.response_json)
        
        # Fetch item
        item_result = await db.execute(
            select(models.ShopItem).filter(models.ShopItem.id == shop_item_id)
        )
        item = item_result.scalars().first()
        if not item:
            raise HTTPException(404, "item_not_found")
        
        # Validate gold
        if user.gold < item.price_gold:
            raise HTTPException(400, "insufficient_gold")
        
        # Special: skins cannot be repurchased
        if item.item_type == "skin":
            inv_check = await db.execute(
                select(models.InventoryItem).filter(
                    models.InventoryItem.user_id == user.id,
                    models.InventoryItem.shop_item_id == item.id,
                )
            )
            if inv_check.scalars().first():
                raise HTTPException(409, "already_owned")
        
        # Atomic: deduct gold
        user.gold -= item.price_gold
        
        # Upsert inventory
        inv_result = await db.execute(
            select(models.InventoryItem).filter(
                models.InventoryItem.user_id == user.id,
                models.InventoryItem.shop_item_id == item.id,
            )
        )
        inv_item = inv_result.scalars().first()
        if inv_item:
            inv_item.quantity += 1
        else:
            new_inv = models.InventoryItem(
                user_id=user.id,
                shop_item_id=item.id,
                quantity=1 if item.item_type != "skin" else 1,
            )
            db.add(new_inv)
        
        # Build response
        result = {
            "success": True,
            "item_name": item.name,
            "gold_remaining": user.gold,
        }
        
        # Cache idempotency
        idem = models.IdempotencyKey(
            user_id=user.id,
            key=idempotency_key,
            response_json=json.dumps(result),
        )
        db.add(idem)
    
    return result
```

**Key points:**
- Entire operation wrapped in `async with db.begin()` — atomic
- Idempotency checked at start; if found, return cached response
- All mutations (gold deduction, inventory upsert) within transaction
- On exit: auto-commit or rollback on exception

### Backend: Activation Endpoint

```python
@router.post("/api/inventory/{inventory_item_id}/activate")
async def activate_item(
    inventory_item_id: int,
    body: dict = Body(...),  # { "idempotency_key": "uuid-string" }
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate a boost or potion. Dispatch by item_type."""
    
    idempotency_key = body.get("idempotency_key")
    if not idempotency_key:
        raise HTTPException(400, "missing_idempotency_key")
    
    async with db.begin():
        # Check idempotency
        idem_result = await db.execute(
            select(models.IdempotencyKey).filter(
                models.IdempotencyKey.user_id == user.id,
                models.IdempotencyKey.key == idempotency_key,
            )
        )
        if idem_result.scalars().first():
            return {"success": True, "message": "already_activated"}
        
        # Fetch inventory item
        inv_result = await db.execute(
            select(models.InventoryItem)
            .filter(models.InventoryItem.id == inventory_item_id)
            .options(selectinload(models.InventoryItem.shop_item))
        )
        inv_item = inv_result.scalars().first()
        if not inv_item or inv_item.user_id != user.id:
            raise HTTPException(404, "item_not_found")
        
        item = inv_item.shop_item
        now = get_msk_now()
        result = {}
        
        # Dispatch by item_type
        if item.item_type.startswith("booster_"):
            # Booster activation
            boost_type = item.item_type.replace("booster_", "")  # e.g. "xp"
            active_exp_attr = f"active_{boost_type}_expires_at"
            active_mult_attr = f"active_{boost_type}_mult"
            
            # Check if slot is free
            expires_at = getattr(user, active_exp_attr, None)
            if expires_at and expires_at > now:
                raise HTTPException(409, "already_active")
            
            # Activate
            setattr(user, active_mult_attr, item.effect_multiplier)
            setattr(user, active_exp_attr, now + timedelta(seconds=item.duration_seconds))
            inv_item.quantity -= 1
            if inv_item.quantity <= 0:
                await db.delete(inv_item)
            result = {
                "success": True,
                "boost_type": boost_type,
                "multiplier": item.effect_multiplier,
                "expires_at": (now + timedelta(seconds=item.duration_seconds)).isoformat(),
            }
        
        elif item.item_type == "potion_heal":
            # Potion use
            old_hp = user.hp
            effective_max_hp = compute_effective_max_hp(user, now)
            user.hp = min(user.hp + item.heal_amount, effective_max_hp)
            inv_item.quantity -= 1
            if inv_item.quantity <= 0:
                await db.delete(inv_item)
            result = {
                "success": True,
                "item_type": "potion",
                "hp_before": old_hp,
                "hp_after": user.hp,
                "healed": user.hp - old_hp,
            }
        
        elif item.item_type == "skin":
            raise HTTPException(400, "use_equip_endpoint")
        
        else:
            raise HTTPException(400, "unknown_item_type")
        
        # Save idempotency
        idem = models.IdempotencyKey(
            user_id=user.id,
            key=idempotency_key,
            response_json=json.dumps(result),
        )
        db.add(idem)
    
    return result
```

**Key:** Dispatch by `item_type`, apply mutations atomically, save idempotency.

### Frontend: Buy Item with Idempotency

```javascript
// frontend/src/services/shopService.js

const shopService = {
  getCatalog: async () => {
    const response = await api.get('/shop');
    return response.data;
  },
  
  buy: async (shopItemId, { idempotency_key }) => {
    const response = await api.post(`/shop/buy/${shopItemId}`, {
      idempotency_key,
    });
    return response.data;
  },
};

// frontend/src/pages/ShopPage.jsx

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import shopService from '../services/shopService';
import ConfirmModal from '../components/ConfirmModal';

const ShopPage = () => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => shopService.getCatalog(),
  });
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => userService.getProfile(),
  });
  
  const queryClient = useQueryClient();
  const [confirmItem, setConfirmItem] = useState(null);
  
  const handleBuyClick = (item) => {
    setConfirmItem(item);
  };
  
  const handleConfirmBuy = async (item) => {
    const idempotencyKey = uuidv4();
    try {
      const result = await shopService.buy(item.id, { idempotency_key: idempotencyKey });
      
      // Optimistic update
      queryClient.setQueryData(['user'], prev => ({
        ...prev,
        gold: prev.gold - item.price_gold,
      }));
      queryClient.invalidateQueries(['inventory']);
      
      showToast(`Куплено: ${result.item_name}`);
      setConfirmItem(null);
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.detail === "already_owned") {
        showToast("Уже есть этот скин", "error");
      } else if (error.response?.status === 400 && error.response?.data?.detail === "insufficient_gold") {
        showToast(`Не хватает gold (имеешь: ${user.gold}, нужно: ${item.price_gold})`, "error");
      } else {
        showToast("Ошибка покупки", "error");
      }
    }
  };
  
  return (
    <div className="shop-page">
      {/* Shop items grid */}
      {items?.map(item => (
        <ShopCard
          key={item.id}
          item={item}
          canAfford={user?.gold >= item.price_gold}
          onBuy={() => handleBuyClick(item)}
        />
      ))}
      
      {confirmItem && (
        <ConfirmModal
          title="Подтверждение"
          message={`Купить "${confirmItem.name}" за ${confirmItem.price_gold} gold?`}
          onConfirm={() => handleConfirmBuy(confirmItem)}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  );
};

export default ShopPage;
```

**Pattern:** Generate UUID, open confirm modal, pass UUID to POST, invalidate queries on success.

### Frontend: Header with Active Boosts Timer

```javascript
// frontend/src/components/Header.jsx

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/api';

const Header = () => {
  const { data: user, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: userService.getProfile,
    refetchInterval: 60000, // Refetch every 60s to catch server-side expiration
  });
  
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const getActiveBoosts = () => {
    if (!user) return [];
    const now_obj = new Date(now);
    const boosts = [];
    
    const BOOST_TYPES = [
      { key: 'xp', label: '⚡ XP', exp_attr: 'active_xp_expires_at', mult_attr: 'active_xp_mult' },
      { key: 'gold', label: '🪙 Gold', exp_attr: 'active_gold_expires_at', mult_attr: 'active_gold_mult' },
      // ... stat boosts
      { key: 'hp_max', label: '💚 HP+', exp_attr: 'active_hp_max_expires_at' },
    ];
    
    for (const boost of BOOST_TYPES) {
      const expires_at = user[boost.exp_attr];
      if (expires_at && new Date(expires_at) > now_obj) {
        const seconds = Math.max(0, (new Date(expires_at) - now_obj) / 1000);
        const mm = Math.floor(seconds / 60);
        const ss = Math.floor(seconds % 60);
        boosts.push({
          ...boost,
          expires_at,
          timer: `${mm}:${ss.toString().padStart(2, '0')}`,
        });
      }
    }
    
    // Sort by expiration time
    boosts.sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
    return boosts;
  };
  
  const activeBoosts = getActiveBoosts();
  
  return (
    <div className="header bg-black/80 border-b border-[#daa520] p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-[#daa520] font-bold text-xl">{user?.display_name}</h1>
        <div className="flex gap-2 text-sm">
          <span className="text-yellow-400">⭐ Lvl {user?.lvl}</span>
          <span className="text-yellow-600">🪙 {user?.gold}</span>
          <span className="text-blue-400">💙 {user?.hp}/{user?.max_hp}</span>
        </div>
      </div>
      
      {/* Active boosts row */}
      {activeBoosts.length > 0 && (
        <div className="flex items-center gap-3 bg-black/60 border border-[#daa520] px-3 py-2">
          {activeBoosts.map(boost => (
            <div key={boost.key} className="flex items-center gap-1 text-sm font-mono">
              <span title={`${boost.label} × ${user[boost.mult_attr]?.toFixed(2) || 'N/A'}`}>
                {boost.label}
              </span>
              <span className="text-[#daa520] font-bold">{boost.timer}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
```

**Key:** Timer ticks on client every 1s, refetch user every 60s to catch expiration on server.

---

## State of the Art

| Pattern | Version | Status | Context |
|---------|---------|--------|---------|
| JWT + refresh token | Phase 3 | Current | All endpoints use `get_current_user` dependency |
| Atomic transaction (db.begin) | Phase 4 | Current | Used in `complete_quest`; Phase 5 extends pattern |
| React-query `useQuery` + `setQueryData` | Phase 3+ | Current | Standard for cache invalidation |
| Lazy expiration (no scheduler) | Phase 5 | New (recommended) | Simpler than cron cleanup |
| Idempotency key pattern | Phase 5 | New (standard for payments) | Prevents duplicate charges on retry |

**No deprecated patterns:** This phase doesn't require removing old code (unlike Phase 3's removal of `verify_telegram_init_data`).

---

## Open Questions

None at this stage. User constraints are comprehensive and locked. Architecture is straightforward (no exotic patterns needed).

---

## Validation Architecture

**Test framework:** pytest with unit stubs (from Phase 4)

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-01 | `GET /api/shop` returns seed items with name, description, price | unit | `pytest backend/tests/test_shop_router.py::test_get_catalog -x` | ❌ Phase 5 |
| SHOP-02 | `POST /api/shop/buy/{id}` deducts gold, adds inventory, is idempotent | unit | `pytest backend/tests/test_shop_router.py::test_buy_item_idempotent -x` | ❌ Phase 5 |
| SHOP-03 | Gold multiplier boost activates via `POST /api/inventory/{id}/activate` | unit | `pytest backend/tests/test_inventory_router.py::test_activate_gold_boost -x` | ❌ Phase 5 |
| SHOP-05 | Skin purchase returns 409 if already owned; equip via `POST /api/inventory/{id}/equip` | unit | `pytest backend/tests/test_inventory_router.py::test_skin_already_owned -x` | ❌ Phase 5 |
| INV-01 | `GET /api/inventory` returns user's items grouped by type | unit | `pytest backend/tests/test_inventory_router.py::test_get_inventory -x` | ❌ Phase 5 |
| INV-02 | Potion activation applies heal, decrements quantity, is idempotent | unit | `pytest backend/tests/test_inventory_router.py::test_activate_potion -x` | ❌ Phase 5 |
| INV-03 | Skin equip sets `user.selected_avatar` and is visible in next `/api/user/me` | unit | `pytest backend/tests/test_inventory_router.py::test_equip_skin -x` | ❌ Phase 5 |

### Sampling Rate

- **Per task commit:** `pytest backend/tests/test_shop_router.py -x` (quick run, ~2s)
- **Per wave merge:** `pytest backend/tests/ -x` (full backend suite, ~10s)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_shop_router.py` — test shop.py routes (get_catalog, buy, seed data)
- [ ] `backend/tests/test_inventory_router.py` — test inventory.py routes (get_inventory, activate, equip)
- [ ] `backend/tests/conftest.py` — shared fixtures (StubUser, mock shop item, etc.)
- [ ] Framework install: already using pytest from Phase 4 ✓

**Note:** No additional test framework needed. Pytest + stub pattern (from Phase 4) sufficient.

---

## Sources

### Primary (HIGH confidence)

- **Codebase inspection (Phase 1-4 patterns):**
  - `backend/app/routers/quests.py:complete_quest` — atomic transaction pattern, idempotency analogue (user re-fetch)
  - `backend/app/models.py:User` — existing columns for xp_multiplier, gold_multiplier, timezone handling
  - `backend/app/utils/game_logic.py` — pure function utilities, CATEGORY_TO_STAT mapping
  - `backend/app/crud.py` — async CRUD pattern, db.execute + select pattern
  - `frontend/src/services/api.js` — JWT Bearer + 401-refresh pattern, axios
  - `frontend/src/pages/ShopPage.jsx`, `InventoryPage.jsx` — retro UI skeleton with Tailwind
  - `backend/tests/test_game_logic.py` — unit test pattern with StubUser (no DB required)

- **User decisions (CONTEXT.md):**
  - Locked decisions define all schema changes, endpoints, UI flow, seed data ranges
  - Claude's Discretion items marked for planner (denormalization, seed method, etc.)
  - Deferred items out of scope (equipment, SHOP-04, etc.)

### Secondary (MEDIUM confidence)

- SQLAlchemy async patterns verified in Phase 3+ code (AsyncSession, select, relationships)
- React-query patterns verified in Phase 3+ code (useQuery, useQueryClient, setQueryData)
- FastAPI patterns verified across all phases (APIRouter, Depends, HTTPException)

### Tertiary (not needed — decisions locked)

- No external library exploration required (no "should we use X or Y?" — user decided stack)

---

## Metadata

**Confidence breakdown:**
- **Standard stack: HIGH** — patterns all verified in existing codebase (Phase 1-4); no new external dependencies
- **Architecture: HIGH** — user decisions comprehensive; lazy expiration and idempotency are standard e-commerce patterns
- **Pitfalls: HIGH** — identified from real shop system experience; Phase 5 implementation can hardcode prevention
- **Code examples: HIGH** — based on exact Phase 4 patterns (transactions, async CRUD, tests) that exist in codebase

**Research date:** 2026-04-21
**Valid until:** 2026-05-05 (14 days — stack is stable, no version updates expected)

**Why confidence is HIGH:** All constraints are locked by user via CONTEXT.md. No architectural decisions remain. Codebase patterns are mature and verified through Phase 4 completion. Risk is implementation execution, not discovery.

