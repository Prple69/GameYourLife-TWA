# Phase 7: Leaderboard - Research

**Researched:** 2026-04-22
**Domain:** Redis sorted set ranking, FastAPI endpoints, frontend data fetching
**Confidence:** HIGH

## Summary

Phase 7 implements a global leaderboard ranked by user level (primary) and XP (secondary), with position tie-breaking by user ID (ascending). The system uses Redis sorted set `leaderboard:global` as the single source of truth for rank computation, updated inline in `crud.add_reward` after XP/level changes are committed to PostgreSQL. Two API endpoints retrieve top-N players and the current user's rank with surrounding context (±5 neighbors). The frontend stub UI in `LeaderboardPage.jsx` replaces mock data with real API calls while preserving glass-morphism pixel aesthetics.

**Primary recommendation:** Implement leaderboard as a two-module pattern: (1) backend router `app/routers/leaderboard.py` for HTTP endpoints, (2) backend utility module `app/leaderboard.py` for domain logic (score calculation, ZSET operations, lazy rebuild). Extend `crud.add_reward` with a single `await leaderboard.update(user)` call after `db.commit()`. Frontend adds `leaderboardService` to `api.js` with `getTop()` and `getMe()` methods, replaces mock array in `LeaderboardPage.jsx`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Ranking formula:** `lvl DESC` (primary), `xp DESC` (secondary), `user.id ASC` (tie-break)
- **Redis score encoding:** `lvl * 1e12 + xp * 1e6 - user.id` (float stored in sorted set)
- **Key:** `leaderboard:global`; **Member:** `str(user.id)` (member field)
- **Pagination:** `GET /api/leaderboard?offset=0&limit=50` (max 100, default 50)
- **Me endpoint:** `GET /api/leaderboard/me` returns `{ rank, total_users, neighbors: [±5] }`
- **Display identity:** `users.display_name` (fallback: `username` → `"Игрок #{user.id}"`)
- **Update trigger:** Inline in `crud.add_reward` after `db.commit()` (part of quest-complete HTTP request)
- **Graceful degradation:** If Redis unavailable during ZADD, log warning; quest still succeeds, leaderboard recovers on next successful update or lazy rebuild
- **Initial seed:** Lazy rebuild in FastAPI lifespan startup: check `EXISTS leaderboard:global` or `ZCARD`; if empty, batch-`ZADD` all users from PG
- **Display columns:** rank + avatar + display_name + lvl + xp (no `char_class` column)
- **UI highlight:** User's own row highlighted if `rank ≤ 100`; top-3 rows show gold text; plashka "Ты" shows user's rank

### Claude's Discretion
- Exact styling of rank plate and highlight (keep glass-morphism pixel aesthetic from stub)
- Loading skeleton vs spinner during API fetch
- Error UX (retry button vs toast message)
- Pixel details: top-3 highlighting (gold/silver/bronze or only gold)
- Batch size for lazy rebuild (default 500 per ZADD call recommended)
- Error message text
- List virtualization (only if 100 rows slow on mobile)

### Deferred Ideas (OUT OF SCOPE)
- Click on other player's row → public profile (Phase 8: Friends)
- Friend leaderboard or guild leaderboard (Phase 8/9)
- User opt-out from leaderboard with `users.hide_from_leaderboard` (Phase 11+)
- Anti-cheat / XP rollback (Phase 11+)
- Real-time updates (WebSocket/SSE) when page is open (Phase 11+)
- Admin endpoint for forced rebuild without restart (future operational need)
- Server-side cache of top-100 response with TTL (optimization if ZRANGE bottleneck)
- Virtualization for 1000+ rows (future scale, not v1.0)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| **LEAD-01** | User can view a global leaderboard of players ranked by level and XP | Redis sorted set `leaderboard:global` with ZREVRANGE for top-N retrieval; API `/api/leaderboard?offset=limit=50`; frontend service layer in `api.js` + `LeaderboardPage.jsx` data binding |
| **LEAD-02** | User's own rank and position are highlighted on the leaderboard | Endpoint `/api/leaderboard/me` returns `{ rank, total_users, neighbors }` with user's position; frontend conditional highlighting (gold bg if rank≤100); plashka "Ты" shows current rank |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| redis[asyncio] | 5.1.1 | Async Redis client for sorted set operations (ZADD, ZREVRANGE, ZREVRANK) | Project Phase 6 established redis connection pool; provides built-in support for aioredis-compatible async API matching project's async/await pattern |
| FastAPI | 0.109.0 | Router pattern for `/api/leaderboard*` endpoints with JWT dependencies | Existing pattern in `daily.py`, `shop.py`, `inventory.py`; matches project auth (Depends(get_current_user)) |
| SQLAlchemy 2.0 async | 2.0.25 | ORM queries for lazy seed: `SELECT id, lvl, xp FROM users` | Established async session pattern in `crud.py`, `add_reward` |
| Pydantic 2.5.3 | 2.5.3 | Response schemas `LeaderboardEntryResponse`, `LeaderboardMeResponse` | Project convention for all routers; `from_attributes=True` for ORM mapping |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | (frontend) | HTTP client for `/api/leaderboard*` calls | Established in `services/api.js` with Bearer interceptor and 401 refresh logic; all frontend services use it |
| React | 19 (frontend) | LeaderboardPage component with API data binding | Existing component structure; hooks pattern (useState, useEffect) for fetch + loading states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Redis sorted set | Custom ranking table in PostgreSQL | ZREVRANGE (O(log N + M)) vs ORDER BY with pagination (requires DB round-trip per page); Redis is stateless, survives DB migration |
| Lazy rebuild in lifespan startup | Admin-only rebuild endpoint | Lazy approach requires no manual intervention; admin endpoint adds operational complexity for v1.0 |
| Score encoding (float formula) | Separate Redis hash per user with fields {lvl, xp} | Single score field requires no additional HGET; float precision sufficient for quoted constraints (lvl<1000, xp<1M) |

**Installation (backend):**
```bash
# redis[asyncio] already in requirements.txt (Phase 6)
# No new dependencies needed for Phase 7
pip install -r backend/requirements.txt
```

**Installation (frontend):**
```bash
# axios already in package.json
# React hooks already available
# No new dependencies needed
```

---

## Architecture Patterns

### Recommended Project Structure
```
backend/app/
├── routers/
│   ├── leaderboard.py          # HTTP endpoints (GET /top, /me)
│   ├── daily.py                # existing; exemplar router pattern
│   └── quests.py               # existing; endpoint shapes to follow
├── leaderboard.py              # domain logic (NEW)
│   ├── score_for(user)         # → lvl * 1e12 + xp * 1e6 - user.id
│   ├── update(redis, user)     # → ZADD after level-up/XP change
│   ├── get_top(redis, db, offset, limit) # → ZREVRANGE + fetch user details
│   ├── get_me(redis, db, user) # → ZREVRANK + ZREVRANGE for neighbors
│   └── seed_if_empty(redis, db) # → lazy rebuild in lifespan
├── crud.py                     # EXTENDS add_reward with leaderboard.update call
├── main.py                     # EXTENDS lifespan with leaderboard.seed_if_empty()
└── cache.py                    # existing; _redis_client from get_redis()

frontend/src/
├── pages/
│   └── LeaderboardPage.jsx     # REPLACES mock data with API calls
├── services/
│   └── api.js                  # ADD leaderboardService { getTop, getMe }
└── components/
    └── Header.jsx              # existing; reuse for page title
```

### Pattern 1: Redis Score Encoding (Composite Float)
**What:** Score field encodes rank tuple (lvl, xp, -user_id) as single float `lvl * 1e12 + xp * 1e6 - user.id`. ZREVRANGE naturally sorts by this composite value, achieving multi-key ranking without additional logic.

**When to use:** When you need multi-field sorting in Redis sorted set without storing separate sorted sets per sort key.

**Example:**
```python
# Source: CONTEXT.md leaderboard design, verified against redis-py sorted set API

async def score_for(user: models.User) -> float:
    """Compute Redis score for user — encodes lvl DESC, xp DESC, id ASC tie-break."""
    # Constraints: lvl ∈ [1, 999], xp ∈ [0, 999999], id ∈ [1, 999999]
    # Score grows monotonically with level-up (gain 1e12 >> loss of xp)
    return float(user.lvl * 1e12 + user.xp * 1e6 - user.id)

async def update(redis_client: aioredis.Redis, user: models.User) -> None:
    """Update user's position in leaderboard after level/XP change."""
    try:
        score = score_for(user)
        await redis_client.zadd("leaderboard:global", {str(user.id): score})
        logger.debug(f"Updated leaderboard for user {user.id}: score={score}")
    except Exception as e:
        # Graceful degradation: log warning, don't crash
        logger.warning(f"Redis ZADD failed for user {user.id}: {e}")
```

**Note on aioredis compatibility:** `redis[asyncio]==5.1.1` (installed) provides the modern `redis.asyncio` module with API compatible to redis-py. Methods like `zadd(key, mapping_or_pairs)` accept dict `{member: score}` format.

### Pattern 2: Async Router with Cache + DB Lookups
**What:** Endpoint queries Redis for rank/position, then joins user details from PostgreSQL. Avoids denormalization; display_name is always fresh.

**When to use:** When ranking metadata (Redis) must be paired with user details (DB) for response payload.

**Example:**
```python
# Source: app/routers/daily.py (exemplar pattern for Depends, error handling)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from app import cache, models, schemas, crud
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["leaderboard"])

@router.get("/api/leaderboard", response_model=schemas.LeaderboardResponse)
async def get_leaderboard_top(
    offset: int = 0,
    limit: int = 50,
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Return top-N leaderboard entries (offset-based pagination)."""
    # Clamp limit to [1, 100]
    limit = max(1, min(100, limit))
    
    # ZREVRANGE: indices offset to offset+limit-1 (reversed = highest score first)
    member_ids = await redis_client.zrevrange(
        "leaderboard:global", offset, offset + limit - 1
    )
    
    # Fetch user details from DB
    entries = []
    for rank_num, member_id in enumerate(member_ids, start=offset + 1):
        user = await crud.get_user_by_id(db, int(member_id))
        if user:
            entries.append(schemas.LeaderboardEntryResponse(
                rank=rank_num,
                user_id=user.id,
                display_name=user.display_name or user.username or f"Игрок #{user.id}",
                avatar=user.selected_avatar,
                lvl=user.lvl,
                xp=user.xp,
            ))
    
    # Get total user count
    total = await redis_client.zcard("leaderboard:global")
    
    return schemas.LeaderboardResponse(entries=entries, total=total)
```

### Pattern 3: Lazy Seed in Lifespan Startup
**What:** Startup hook checks if Redis sorted set exists; if empty or missing, batch-loads all users from DB and populates with ZADD.

**When to use:** Recover leaderboard after Redis wipe or first deploy without manual admin action.

**Example:**
```python
# Source: app/main.py lifespan (extends with leaderboard module)

async def seed_if_empty(redis_client: aioredis.Redis, db: AsyncSession) -> None:
    """Lazy rebuild: populate leaderboard:global if empty (Redis lost or first run)."""
    try:
        exists = await redis_client.exists("leaderboard:global")
        if exists:
            card = await redis_client.zcard("leaderboard:global")
            if card > 0:
                logger.info(f"Leaderboard already seeded: {card} users")
                return
    except Exception as e:
        logger.warning(f"Redis ZCARD check failed: {e}")
        return
    
    # Rebuild: fetch all users from DB
    logger.info("Rebuilding leaderboard from PostgreSQL...")
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    
    if not users:
        logger.info("No users in DB, skipping seed")
        return
    
    # Batch ZADD in chunks to avoid timeout
    batch_size = 500
    for i in range(0, len(users), batch_size):
        batch = users[i:i + batch_size]
        mapping = {str(u.id): score_for(u) for u in batch}
        try:
            await redis_client.zadd("leaderboard:global", mapping)
            logger.debug(f"Seeded batch {i//batch_size + 1}: {len(batch)} users")
        except Exception as e:
            logger.error(f"Batch ZADD failed at offset {i}: {e}")
            continue
    
    logger.info(f"Leaderboard rebuild complete: {len(users)} users")

# In main.py lifespan:
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    await cache.init_redis()
    await leaderboard.seed_if_empty(_redis_client, db)  # ← NEW
    yield
    await cache.close_redis()
```

### Anti-Patterns to Avoid
- **Recomputing score per request:** Score should be calculated once (in `score_for()`) and stored in Redis; recomputing on each read wastes CPU and breaks tie-break consistency.
- **Storing display_name in Redis:** Names change but score stays — denormalizing breaks freshness. Always fetch from DB on read.
- **No error handling for Redis failures:** ZADD failures silence should log warnings but not crash quests. Frontend should handle 500 gracefully.
- **Infinite pagination without cap:** `limit > 100` should be rejected; allows DoS via large ZREVRANGE.
- **Querying all users on every `/me` call:** Use ZREVRANK (O(log N)) to get position, then ZREVRANGE for neighbors (O(log N + M) where M ≤ 11).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sorting players by level+XP | Custom pagination query with ORDER BY + OFFSET | Redis sorted set ZREVRANGE | ZREVRANGE is O(log N + M), survives DB restarts, zero application logic for tie-breaks |
| Storing ranking state in PostgreSQL | New `leaderboard_positions` table with updated_at trigger | Redis sorted set (ephemeral, rebuilt on startup) | Sorted set operations are atomic; rebuilding from user table is simpler than sync triggers |
| Counting top-3 / top-10 for achievements | Application-side filtering of all users | Redis ZREVRANGE with fixed ranges | Redis is stateless and fast; application logic adds debugging burden |
| User's rank in single query | Complex SQL window function `ROW_NUMBER() OVER (ORDER BY lvl DESC, xp DESC)` | ZREVRANK on Redis score | ZREVRANK (O log N) vs window function (full table scan); easier testing and no DB migration debt |

**Key insight:** Leaderboard is ranking metadata, not game state. PostgreSQL records truth (user.lvl, user.xp); Redis materializes the ranking view. Separation keeps the two systems simple and allows Redis to fail gracefully without data loss.

---

## Common Pitfalls

### Pitfall 1: Score Formula Precision Loss
**What goes wrong:** Float rounding errors cause rank instability. User A at lvl=1, xp=999999, id=1 and User B at lvl=1, xp=1000000, id=2 may have indistinguishable scores due to 64-bit IEEE float precision limits.

**Why it happens:** Naive formula `lvl * 1e12 + xp * 1e6 - id` with xp unbounded can exceed float mantissa precision (53 bits for IEEE 754 double precision).

**How to avoid:** 
- CONTEXT.md constrains: `lvl < 1000` (3 digits), `xp < 1M` (6 digits), `id < 1M` (6 digits). Formula `lvl * 1e12 + xp * 1e6 - id` uses 15 significant digits; well within float64 precision.
- Verify in comments: "Score uses 15 sig figs; float64 mantissa is 53 bits (15–16 decimal digits)."
- **Recommendation:** Add unit test: `assert score_for(User(id=1, lvl=999, xp=999999)) > score_for(User(id=999999, lvl=999, xp=999999))`

**Warning signs:** Test failures where tie-break order flips randomly; same user gets different ranks on consecutive reads.

### Pitfall 2: Broken Tie-Break After level-up
**What goes wrong:** User levels up (xp resets, lvl increments). Score changes, but if `crud.add_reward` doesn't call `leaderboard.update()`, Redis entry stales and user's rank doesn't update until next ZADD.

**Why it happens:** Level-up is a multi-step mutation (xp -= max_xp, lvl += 1). ZADD must happen after DB commit, not during the transaction.

**How to avoid:**
- `crud.add_reward` calls `await leaderboard.update(redis, user)` immediately after `await db.commit()`.
- Test: user completes quest → level up → `/api/leaderboard/me` returns updated rank.
- Pattern: see "Async Router with Cache + DB Lookups" — update is awaited before response.

**Warning signs:** User completes quest, levels up, but leaderboard rank unchanged; rank updates only on next quest or after restart.

### Pitfall 3: Missing Members in ZREVRANGE When Fetching Details
**What goes wrong:** User deleted from DB but still in Redis. ZREVRANGE returns user.id that doesn't exist in DB; `get_user_by_id()` returns None. Response has null entries.

**Why it happens:** Leaderboard and user table can diverge (unlikely v1.0, but manual data cleanup or soft-deletes cause it).

**How to avoid:**
- When fetching details after ZREVRANGE, skip (filter out) users where `get_user_by_id()` returns None.
- Log: "User {id} in leaderboard but not in DB" (signals data cleanup issue).
- Option: periodic cleanup job that DELs stale Redis entries (Phase 11+).

**Warning signs:** Leaderboard shows fewer entries than expected; some rank numbers skip.

### Pitfall 4: Redis Unavailable at Startup — Uncaught Startup Crash
**What goes wrong:** Redis connection fails at startup; `cache.init_redis()` logs warning (graceful degradation), but `leaderboard.seed_if_empty()` crashes with uncaught exception because it assumes Redis is available.

**Why it happens:** Graceful degradation pattern in `cache.py` (log and continue on PING failure) is not replicated in leaderboard.seed_if_empty.

**How to avoid:**
- Wrap `seed_if_empty` calls in try/except; log errors but don't re-raise.
- Check Redis connectivity before attempting ZCARD / ZADD.
- Pattern: lifespan startup continues even if leaderboard rebuild fails; leaderboard endpoints will fail at request time (401-like handling).

**Warning signs:** Server won't start if Redis is temporarily down; downtime is prolonged.

### Pitfall 5: Display Name Fallback Chain Not Implemented
**What goes wrong:** User has no display_name and no username; response shows `null` instead of fallback `"Игрок #{id}"`.

**Why it happens:** Pydantic schema doesn't enforce fallback; frontend tries to display null.

**How to avoid:**
- In router: `display_name = user.display_name or user.username or f"Игрок #{user.id}"`
- Or: implement in schema validator:
  ```python
  class LeaderboardEntryResponse(BaseModel):
      display_name: str
      
      @field_validator('display_name')
      @classmethod
      def fallback_name(cls, v, info):
          if v:
              return v
          # Retrieve from DB context (complex); simpler to do in router
          return "Anonymous"
  ```
- **Better:** Move fallback logic to router (see Pattern 2 example).

**Warning signs:** Leaderboard shows blank names or null in JSON; frontend renders "null" as text.

### Pitfall 6: Pagination Offset Exceeds Total
**What goes wrong:** User requests `offset=10000&limit=50` but only 100 users exist. ZREVRANGE returns empty list; response has empty entries array.

**Why it happens:** No validation on offset; Redis silently returns [].

**How to avoid:**
- After ZREVRANGE, check `len(member_ids)`. If 0 and offset > 0, return 200 OK with empty entries (or 404 if you want).
- Document: "Offset beyond total returns empty array with correct total count."
- Test: `GET /api/leaderboard?offset=10000&limit=50` → `{ "entries": [], "total": 100 }`

**Warning signs:** Frontend UI shows "no results" even though leaderboard is not empty; user confusion about API contract.

---

## Code Examples

Verified patterns from official sources and project conventions:

### Example 1: Score Calculation
```python
# Source: CONTEXT.md decision + redis-py sorted set API
# https://redis.io/docs/latest/commands/zadd/

from app import models

def score_for(user: models.User) -> float:
    """
    Encode user's rank as single float score.
    Higher score = higher rank (ZREVRANGE sorts by score DESC).
    
    Formula: lvl * 1e12 + xp * 1e6 - user.id
    Constraints: lvl<1000, xp<1M, id<1M → 15 sig figs (safe for float64).
    
    Tie-break: if two users have same lvl and xp, lower id ranks higher (earlier registration).
    """
    return float(user.lvl * 1e12 + user.xp * 1e6 - user.id)
```

### Example 2: ZADD Update Pattern
```python
# Source: app/routers/daily.py pattern + redis-py zadd() docs
# https://redis.io/docs/latest/commands/zadd/

import redis.asyncio as aioredis
from app import models

async def update(redis_client: aioredis.Redis, user: models.User) -> None:
    """
    Update user's position in Redis sorted set after level/XP change.
    Called from crud.add_reward() after db.commit().
    
    Graceful degradation: log but don't crash if Redis unavailable.
    """
    try:
        score = score_for(user)
        # zadd(key, mapping) where mapping = {member: score, ...}
        await redis_client.zadd("leaderboard:global", {str(user.id): score})
        logger.debug(f"Leaderboard updated: user={user.id}, score={score:.2e}")
    except Exception as e:
        logger.warning(f"Leaderboard ZADD failed for user {user.id}: {e}")
        # Don't re-raise; quest completion succeeds without leaderboard update
```

### Example 3: ZREVRANGE for Top-N
```python
# Source: redis-py zrevrange() docs + app/routers/daily.py pattern
# https://redis.io/docs/latest/commands/zrevrange/

async def get_top(
    redis_client: aioredis.Redis,
    db: AsyncSession,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list, int]:
    """
    Fetch top-N users ranked by score (highest first).
    
    ZREVRANGE key start stop → list of members in reverse order (highest score first).
    Args: start and stop are 0-indexed inclusive range; -1 = last.
    
    Returns: (entries list, total user count in leaderboard)
    """
    # Clamp limit
    limit = max(1, min(100, limit))
    
    # ZREVRANGE: indices [offset, offset+limit-1]
    member_ids = await redis_client.zrevrange(
        "leaderboard:global", offset, offset + limit - 1
    )
    
    entries = []
    for rank_num, member_id in enumerate(member_ids, start=offset + 1):
        user = await crud.get_user_by_id(db, int(member_id))
        if user:  # Skip deleted users
            entries.append({
                "rank": rank_num,
                "user_id": user.id,
                "display_name": user.display_name or user.username or f"Игрок #{user.id}",
                "avatar": user.selected_avatar,
                "lvl": user.lvl,
                "xp": user.xp,
            })
    
    # Total count
    total = await redis_client.zcard("leaderboard:global")
    
    return entries, total
```

### Example 4: ZREVRANK for User Position + Neighbors
```python
# Source: redis-py zrevrank() and zrevrange() docs + CONTEXT.md spec
# https://redis.io/docs/latest/commands/zrevrank/

async def get_me(
    redis_client: aioredis.Redis,
    db: AsyncSession,
    user: models.User,
) -> dict:
    """
    Return user's rank and neighbors (±5 positions).
    
    ZREVRANK key member → index of member in sorted set (reverse order).
    Returns None if member not in set.
    
    Neighbors: if rank=1, return [1,2,3,4,5,6] (no padding).
    If rank=50, return [45,46,...,50,...,54,55] (±5).
    """
    # Get user's rank (0-indexed, so +1 for display rank)
    rank_idx = await redis_client.zrevrank("leaderboard:global", str(user.id))
    
    if rank_idx is None:
        # User not in leaderboard (shouldn't happen; lazy rebuild handles it)
        return {
            "rank": None,
            "total_users": 0,
            "neighbors": [],
        }
    
    rank = rank_idx + 1  # Convert to 1-indexed
    
    # Get total
    total = await redis_client.zcard("leaderboard:global")
    
    # Fetch neighbors: ±5 around user
    start_idx = max(0, rank_idx - 5)
    end_idx = min(total - 1, rank_idx + 5)
    neighbor_ids = await redis_client.zrevrange(
        "leaderboard:global", start_idx, end_idx
    )
    
    neighbors = []
    for neighbor_id in neighbor_ids:
        neighbor_user = await crud.get_user_by_id(db, int(neighbor_id))
        if neighbor_user:
            neighbor_idx = await redis_client.zrevrank("leaderboard:global", neighbor_id)
            neighbors.append({
                "rank": neighbor_idx + 1 if neighbor_idx is not None else None,
                "user_id": neighbor_user.id,
                "display_name": neighbor_user.display_name or neighbor_user.username or f"Игрок #{neighbor_user.id}",
                "avatar": neighbor_user.selected_avatar,
                "lvl": neighbor_user.lvl,
                "xp": neighbor_user.xp,
            })
    
    return {
        "rank": rank,
        "total_users": total,
        "neighbors": neighbors,
    }
```

### Example 5: Integration into crud.add_reward
```python
# Source: backend/app/crud.py (lines 49-68) + leaderboard module

# In crud.py:
import leaderboard  # NEW import

async def add_reward(db: AsyncSession, user_id: int, xp_amount: int, gold_amount: int):
    """Начислить опыт и золото с проверкой Level Up"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None, False

    # Apply multipliers
    user.xp += int(xp_amount * user.xp_multiplier)
    user.gold += int(gold_amount * user.gold_multiplier)

    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True
    
    await db.commit()
    await db.refresh(user)
    
    # NEW: Update leaderboard after DB commit
    try:
        redis_client = await cache.get_redis()  # Phase 7: assume injected or fetched
        await leaderboard.update(redis_client, user)
    except Exception as e:
        logger.warning(f"Leaderboard update failed: {e}")
    
    return user, leveled_up
```

### Example 6: Frontend Service Layer
```javascript
// Source: frontend/src/services/api.js pattern + axios conventions

export const leaderboardService = {
  // GET /api/leaderboard?offset=0&limit=50
  getTop: async (offset = 0, limit = 50) => {
    const response = await api.get('/leaderboard', {
      params: { offset, limit }
    });
    return response.data;  // { entries: [...], total: N }
  },

  // GET /api/leaderboard/me
  getMe: async () => {
    const response = await api.get('/leaderboard/me');
    return response.data;  // { rank, total_users, neighbors: [...] }
  },
};
```

### Example 7: Frontend Component (LeaderboardPage)
```jsx
// Source: frontend/src/pages/LeaderboardPage.jsx (replace mock data pattern)

import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../services/api';
import Header from '../components/Header';

const LeaderboardPage = ({ videos }) => {
  const [entries, setEntries] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [topData, meData] = await Promise.all([
          leaderboardService.getTop(0, 100),
          leaderboardService.getMe(),
        ]);
        setEntries(topData.entries);
        setTotalUsers(topData.total);
        setUserRank(meData.rank);
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const glassStyle = {
    WebkitBackdropFilter: 'blur(5px)',
    backdropFilter: 'blur(5px)',
    transform: 'translateZ(0)',
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">
      {/* Background video (existing stub pattern) */}
      <div className="absolute inset-0 z-0">
        {videos?.leader && (
          <video
            src={videos.leader}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-100"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">
        <div className="w-full shrink-0">
          <Header title="Зал Славы" subtitle={`Топ ${totalUsers} героев`} />
        </div>

        {/* User rank plate */}
        {userRank && (
          <div
            style={glassStyle}
            className="w-full max-w-md mb-4 min-h-[60px] flex items-center px-4 bg-black/60 border border-[#F5F5F0]/20 shrink-0 shadow-lg"
          >
            <span className="text-[12px] text-[#daa520] font-black uppercase">Ты</span>
            <div className="flex-1 ml-2">
              <span className="text-[16px] text-[#F5F5F0] font-black uppercase">
                {/* Assuming user name from context or fetched separately */}
                Герой
              </span>
            </div>
            <span className="text-lg font-black text-[#F5F5F0]">#{userRank}</span>
          </div>
        )}

        {/* Loading / Error states */}
        {loading && <div className="text-[#A1A1AA]">Загрузка...</div>}
        {error && <div className="text-red-500">Ошибка: {error}</div>}

        {/* Leaderboard table */}
        {!loading && (
          <div className="w-full max-w-md flex-1 flex flex-col overflow-hidden relative">
            {/* Table header (existing stub pattern) */}
            <div
              style={glassStyle}
              className="flex h-[40px] items-center bg-black/80 border border-[#F5F5F0]/20 shrink-0 px-4 z-20"
            >
              <div className="w-[10%] text-[10px] text-[#daa520] font-black uppercase">#</div>
              <div className="flex-1 text-[10px] text-[#daa520] font-black uppercase text-center">Герой</div>
              <div className="w-[12%] text-[10px] text-[#daa520] font-black uppercase text-right">Ур</div>
              <div className="w-[12%] text-[10px] text-[#daa520] font-black uppercase text-right">XP</div>
            </div>

            {/* Table body */}
            <div
              style={glassStyle}
              className="flex-1 overflow-y-auto bg-black/40 border-x border-b border-white/10 shadow-2xl"
            >
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const isUser = entry.rank === userRank;

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center h-[60px] px-4 border-b border-white/5 ${
                      isUser ? 'bg-[#daa520]/20' : ''
                    }`}
                  >
                    <div className="w-[10%]">
                      <span
                        className={`text-[16px] font-black ${
                          isTop3 ? 'text-[#daa520]' : 'text-[#A1A1AA]/50'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </div>
                    <div className="flex-1 ml-1">
                      <span
                        className={`text-[15px] uppercase font-black tracking-tight ${
                          isUser ? 'text-[#daa520]' : 'text-[#F5F5F0]'
                        }`}
                      >
                        {entry.display_name}
                      </span>
                    </div>
                    <div className="w-[12%] text-right">
                      <span
                        className={`text-[16px] font-black ${
                          isUser ? 'text-[#daa520]' : 'text-[#F5F5F0]/80'
                        }`}
                      >
                        {entry.lvl}
                      </span>
                    </div>
                    <div className="w-[12%] text-right">
                      <span className="text-[14px] text-[#A1A1AA]/60">{entry.xp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Recompute rank per request via window function | ZREVRANK O(log N) on pre-computed Redis sorted set | v1.0 design | Leaderboard scales to 10k+ users; DB not hit for reads; rebuild is lazy at startup |
| Store display_name in Redis (denormalized) | Fetch from DB on read; Redis stores only rank data | CONTEXT.md decision + Phase 6 pattern | Name changes are instant; no sync burden |
| Admin manual rebuild via endpoint | Lazy rebuild in lifespan startup hook | CONTEXT.md deferred ideas | No operational overhead; recovery is automatic |

**Deprecated/outdated:**
- **Leaderboard via ORDER BY with pagination (pre-Redis):** v1.0 uses Redis; ORDER BY is replaced by ZREVRANGE for single-digit latency.

---

## Validation Architecture

**Test framework:** pytest (existing, used in Phase 4, 5, 6)
**Config file:** `backend/tests/conftest.py` (shared fixtures)
**Quick run:** `pytest backend/tests/test_leaderboard_router.py -x`
**Full suite:** `pytest backend/tests/ -x`

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEAD-01 | `GET /api/leaderboard?offset=0&limit=50` returns top-N entries with rank, display_name, lvl, xp | unit (mock Redis + DB) | `pytest backend/tests/test_leaderboard_router.py::test_get_leaderboard_top -x` | ❌ Wave 0 |
| LEAD-01 | Score encoding formula (lvl DESC, xp DESC, id ASC) produces correct ranking | unit (no DB) | `pytest backend/tests/test_leaderboard_router.py::test_score_encoding -x` | ❌ Wave 0 |
| LEAD-01 | Pagination offset/limit clamps correctly; returns empty if offset > total | unit (mock) | `pytest backend/tests/test_leaderboard_router.py::test_pagination -x` | ❌ Wave 0 |
| LEAD-02 | `GET /api/leaderboard/me` returns user's rank, total_users, neighbors (±5) | unit (mock) | `pytest backend/tests/test_leaderboard_router.py::test_get_leaderboard_me -x` | ❌ Wave 0 |
| LEAD-02 | User highlighted in top-100 entries; name shown correctly; fallback name works if no display_name | integration | `pytest backend/tests/test_leaderboard_router.py::test_user_highlight_and_fallback -x` | ❌ Wave 0 |
| General | Graceful degradation: ZADD failure logs warning but doesn't crash | unit (mock Redis that raises) | `pytest backend/tests/test_leaderboard_router.py::test_redis_failure_graceful -x` | ❌ Wave 0 |
| General | Lazy rebuild in lifespan: seed_if_empty populates empty Redis from DB users | unit (mock) | `pytest backend/tests/test_leaderboard_router.py::test_seed_if_empty -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest backend/tests/test_leaderboard_router.py -x` (10-15s)
- **Per wave merge:** `pytest backend/tests/ -x` (full suite including Phase 4-6 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/test_leaderboard_router.py` — all LEAD-01, LEAD-02 router tests + graceful degradation
- [ ] `backend/tests/conftest.py` — extend StubRedis with zadd(), zrevrange(), zrevrank(), zcard(), exists() methods for mocking sorted sets
- [ ] No frontend tests required v1.0 (manual verify of LeaderboardPage in browser after API integration)

---

## Open Questions

1. **When should lazy rebuild run if Redis was never initialized?**
   - What we know: `cache.init_redis()` logs warning on failure; graceful degradation continues.
   - What's unclear: Should `leaderboard.seed_if_empty()` also fail gracefully, or hard-fail startup?
   - Recommendation: Fail gracefully (log error, return early); leaderboard endpoints will fail at request-time if Redis unavailable. Matches Phase 6 daily quests pattern.

2. **Avatar field in leaderboard — which field to use?**
   - What we know: `users.selected_avatar` exists (Phase 5 feature).
   - What's unclear: Is `selected_avatar` a key like "avatar_123" or a URL? Needs to match frontend asset path.
   - Recommendation: Check `frontend/public/avatars/` or asset loader; `selected_avatar` likely references filename. Use as-is in response; frontend resolves to `/img/avatars/{selected_avatar}.png`.

3. **Soft-delete users — should leaderboard entries be cleaned?**
   - What we know: CONTEXT.md defers user management; v1.0 has no soft-delete column.
   - What's unclear: If user is deleted from DB, stale entry remains in Redis until next seed.
   - Recommendation: Out of scope v1.0. Add to Phase 11 (Production Polish) if user deletion becomes feature.

---

## Sources

### Primary (HIGH confidence)
- **redis-py 5.1.1 (async)** — ZADD, ZREVRANGE, ZREVRANK, ZCARD API documented at https://redis.io/docs/latest/commands/
- **FastAPI 0.109.0** — Router and Depends patterns verified in existing `app/routers/daily.py`
- **SQLAlchemy 2.0.25 async** — AsyncSession and select() patterns verified in `crud.py` and `daily.py`
- **Pydantic 2.5.3** — Response schema patterns verified in `schemas.py` (from_attributes=True)
- **Project CONTEXT.md** — Locked decisions on ranking formula, score encoding, pagination, update propagation, lazy rebuild
- **Project codebase** — `app/cache.py` (Redis pool), `app/routers/daily.py` (router pattern exemplar), `frontend/src/pages/LeaderboardPage.jsx` (UI stub), `backend/tests/conftest.py` (test fixtures)

### Secondary (MEDIUM confidence)
- **redis-py sorted sets cookbook** — https://xxx-cook-book.gitbooks.io/redis-cook-book/content/Python/redis-py/FunctionsAndMethods/sorted-sets.html (verified ZADD/ZREVRANGE API)
- **aioredis compatibility** — https://github.com/aio-libs-abandoned/aioredis-py/issues/1260 (confirms redis-py API match)

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — redis[asyncio], FastAPI, SQLAlchemy, Pydantic all verified in requirements.txt and existing codebase
- **Architecture patterns:** HIGH — Router pattern from `daily.py` exemplar; score encoding from CONTEXT.md; lazy rebuild from Phase 6 cache pattern
- **Pitfalls:** MEDIUM-HIGH — Identified from CONTEXT.md decisions and common leaderboard gotchas; test cases will validate scoring and tie-break logic
- **Validation:** MEDIUM — Test infrastructure (pytest, conftest.py) exists; StubRedis must be extended with sorted set operations for mocking

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days — Redis/FastAPI stable, no breaking changes expected in that window; user constraints are locked)
