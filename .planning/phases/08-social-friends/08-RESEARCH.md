# Phase 8: Social — Friends - Research

**Researched:** 2026-04-27
**Domain:** Friend search, friendship requests, activity feed
**Confidence:** HIGH

## Summary

Phase 8 implements user-to-user friendship relationships with request/accept flow and activity feed visibility. The phase depends on existing Phase 3 auth infrastructure (JWT tokens, display_name in user model) and Phase 5+ character progression (XP/level) to track meaningful activity. Key decisions: friendships are directional (requester/addressee), accept eliminates the request, delete is symmetric mutual removal. Activity is defined as quest completion and level-up events (extractable from quest history and character progression), with friend-visible feed showing these events with timestamps.

The main technical challenge is avoiding N+1 queries in the activity feed (requires efficient join of friendships + quest history or derived activity log). Secondary concern: privacy — ensure users cannot enumerate other users without search criteria, and cannot view non-friends' personal stats beyond what's public on leaderboard.

**Primary recommendation:** Use SQLAlchemy relationships for Friendship model with user_id FK + cascade, implement activity tracking as derived from quest_history + user.lvl changes (no separate activity table for v1.0), use eager loading (selectinload) to avoid N+1 in feed queries.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SOCL-01 | User finds friends by display_name via `/api/users/search?q=` and sends requests `/api/friends/request` | Existing User model has display_name (Phase 3); search uses ilike/match pattern; request creates Friendship(requester_id, addressee_id, status='pending') |
| SOCL-02 | User accepts requests, deletes friendships, sees friend activity feed via `/api/friends` | Friendship model with status enum (pending/accepted); feed joins friendships + quests for recent activity (quest_id, event_type, timestamp); user.id filters to current user; privacy respects friend boundaries |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.109.0 | REST API framework | Existing project stack; async-first, minimal boilerplate |
| SQLAlchemy | 2.0.25 | ORM + schema | Existing async design; relationships and eager loading prevent N+1 |
| PostgreSQL | (via asyncpg 0.29.0) | Persistent DB | Existing database; supports UNIQUE constraints, FK, indexes for friend searches |
| Pydantic | 2.5.3 | Response schemas | Existing project; strict validation, JSON serialization |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SQLAlchemy selectinload | 2.0.25 | Eager loading | Prevent N+1 in friend list + activity feed queries |
| Alembic | 1.13.1 | Schema migration | Existing; create friendships table, add indexes on (requester_id, addressee_id) |
| Python UUID | stdlib | Idempotency (optional) | Reuse Phase 5 idempotency_keys pattern if requests can be replayed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Friendship model in DB | In-memory Redis zsets | Redis doesn't persist across deploy; harder to query by status (pending vs accepted); misses audit trail for deletes |
| Eager loading in query | N+1 + lazy load | N+1 with 100+ friends on feed causes 100+ DB queries per request — unacceptable latency |
| Activity from quest_history | Separate activity_events table | No need: quest completion already in quests table with (user_id, is_completed, created_at); level-up events inferred from user progression |

**Installation:**
```bash
# No new deps needed — all exist in Phase 3+ requirements.txt
# Verify Alembic is at 1.13.1 for migration safety
pip list | grep -i alembic
```

## Architecture Patterns

### Recommended Project Structure

**Backend additions:**
```
backend/app/routers/
├── friends.py          # New: GET /api/users/search, POST /api/friends/request, 
                        #       POST /api/friends/accept/{id}, DELETE /api/friends/{id},
                        #       GET /api/friends (list + activity feed)

backend/migrations/
└── XXXXXXX_add_friendships.py  # New: friendships table, status enum, indexes

frontend/src/
├── pages/FriendsPage.jsx       # New: search bar, request tabs, friend list, feed
├── components/
│   ├── FriendCard.jsx          # New: friend info + status button
│   ├── FriendActivityFeed.jsx   # New: quest completion + level-up events
│   ├── FriendSearchBar.jsx      # New: input + debounced search
│   └── FriendsRequestTabs.jsx   # New: incoming/outgoing requests section
└── services/
    └── friendsService.js       # New: API calls for search, request, accept, delete, feed
```

### Pattern 1: Friendship Status Lifecycle

**What:** Friendships follow state machine: pending → accepted → (delete) → null.

**When to use:** Always model requests as Friendship records with status='pending', eliminate requests on accept (status='accepted'), delete removes record entirely.

**Example:**
```python
# Source: SQLAlchemy relational pattern for Phase 3+ auth
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, UniqueConstraint, func
from app.models import Base, User, get_msk_now
import enum

class FriendshipStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"

class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(FriendshipStatus), default=FriendshipStatus.pending)
    created_at = Column(DateTime(timezone=True), default=get_msk_now)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="friend_requests_sent")
    addressee = relationship("User", foreign_keys=[addressee_id], backref="friend_requests_received")
```

**Why:** Prevents duplicate requests (UNIQUE constraint), enables querying pending/accepted separately, preserves audit trail of who requested when.

### Pattern 2: Bidirectional Friendship Query

**What:** When user A and B are friends, allow feed visibility both ways (not asymmetric).

**When to use:** After accept, create/check both directions to simplify feed joins.

**Example:**
```python
# Source: SQLAlchemy many-to-many pattern adapted for directional relationships
# In friendships router (GET /api/friends endpoint):

from sqlalchemy import select, or_, and_

async def get_friend_ids(db: AsyncSession, user_id: int) -> List[int]:
    """Return IDs of all accepted friends (bidirectional)."""
    result = await db.execute(
        select(Friendship).filter(
            Friendship.status == FriendshipStatus.accepted,
            or_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == user_id,
            )
        )
    )
    friendships = result.scalars().all()
    friend_ids = set()
    for f in friendships:
        if f.requester_id == user_id:
            friend_ids.add(f.addressee_id)
        else:
            friend_ids.add(f.requester_id)
    return list(friend_ids)
```

**Why:** Simplifies feed query — single join instead of two OR clauses; friend visibility is symmetric (if A sees B's activity, B sees A's).

### Pattern 3: Activity Feed Join with Eager Loading

**What:** Avoid N+1: fetch friendships + activities in one query with selectinload.

**When to use:** Any endpoint returning list of friends with activity (GET /api/friends).

**Example:**
```python
# Source: SQLAlchemy selectinload pattern from Phase 5-6 practice (leaderboard)
from sqlalchemy.orm import selectinload, joinedload

async def get_friends_with_activity(db: AsyncSession, user_id: int):
    """Return friend list + last quest completion for each."""
    friend_ids = await get_friend_ids(db, user_id)
    
    # Fetch users in batch to avoid N+1
    result = await db.execute(
        select(User)
        .filter(User.id.in_(friend_ids))
        .options(selectinload(User.quests))  # Eager-load all quests
    )
    friends = result.scalars().unique().all()
    
    # Extract last completed quest for each
    feed_items = []
    for friend in friends:
        last_quest = next(
            (q for q in sorted(friend.quests, key=lambda x: x.created_at, reverse=True)
             if q.is_completed),
            None
        )
        if last_quest:
            feed_items.append({
                "user_id": friend.id,
                "display_name": friend.display_name,
                "avatar": friend.selected_avatar,
                "event": "quest_completed",
                "quest_title": last_quest.title,
                "timestamp": last_quest.created_at,
            })
    return feed_items
```

**Why:** Selectinload executes 2 queries total (1 for users, 1 for all quests) instead of 1 + N. Scales to 100+ friends.

### Pattern 4: Search by display_name

**What:** Case-insensitive substring search on display_name, return paginated results.

**When to use:** GET /api/users/search?q=alexei&limit=10&offset=0.

**Example:**
```python
# Source: PostgreSQL ilike operator (Phase 3+ SQLAlchemy pattern)
from sqlalchemy import select, func, and_

async def search_users(db: AsyncSession, query: str, limit: int = 10, offset: int = 0):
    """Search users by display_name (case-insensitive)."""
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="query must be ≥2 chars")
    
    # Use ilike for PostgreSQL case-insensitive search
    search_pattern = f"%{query}%"
    result = await db.execute(
        select(User)
        .filter(User.display_name.ilike(search_pattern))
        .order_by(User.display_name)
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
```

**Why:** ilike leverages PostgreSQL indexing (with GIST or GIN on display_name); prevents injection; substring-friendly (search "alex" finds "alexander", "aleksei").

### Anti-Patterns to Avoid

- **Storing friendship status in User model (active_friends, blocked_list, etc.):** Denormalization leads to sync issues. Use Friendship table as single source of truth.
- **N+1 on friend activity feed:** Do NOT loop `for friend_id in friend_ids: db.query(Quest).filter(user_id=friend_id).first()`. Use eager loading + batch queries.
- **Asymmetric friendship (A→B only visible to A):** Violates user expectation; use bidirectional checks. After accept, both A and B can see each other.
- **Deleting Friendship record on reject:** Keep rejected (delete Friendship immediately), not as status='rejected'. Rejected requests don't litter DB; can send new request anytime.
- **Searching all users by default (GET /api/users without ?q):** Privacy risk. Require ?q parameter; do not enumerate all users.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Case-insensitive name search | Regex + Python string matching | PostgreSQL `ilike` operator | Regex in Python is slow for 10k+ users; ilike with index is O(log n) |
| Friendship deduplication | Check before insert in app code | Database UNIQUE constraint | Race condition: two requests in parallel both pass app check, both insert; UNIQUE prevents this |
| Activity feed pagination | Fetch all activities, slice in Python | SQL LIMIT/OFFSET + index | Memory bloat: 1M+ activities for 10k users; database can't optimize in Python |
| Friend visibility checks | Query DB per endpoint | Write helper `is_friend()` once | Repeated pattern across list/feed endpoints; single source of truth prevents bugs |
| Request notification | Poll GET /api/friends repeatedly | (Phase 11 scope: WebSocket or Web Push) | Polling is client-side tax; real notifications deferred to production phase |

**Key insight:** Friendships at scale (even 10k users) need DB-side enforcement and indexing. Python-level checks add latency; let Postgres do the work.

## Common Pitfalls

### Pitfall 1: N+1 Queries in Friend List + Activity Feed
**What goes wrong:** Endpoint returns friend list with last activity. Code queries friends, then loops to query each friend's quests: 1 + N queries. With N=100, kills API latency.

**Why it happens:** Naive query pattern feels natural in synchronous code; async doesn't fix the underlying issue.

**How to avoid:** 
- Always use `selectinload(User.quests)` when fetching user list for activity.
- Test with `assert len(db.queries) <= 2` in unit tests (use sqlalchemy event listener to count).
- Profile with slow query log (PostgreSQL log_statement='all' in dev).

**Warning signs:** 
- Endpoint takes 3+ seconds with <100 friends.
- PostgreSQL slow query log shows same table queried N times.
- Profiler shows 95% DB time, not application code.

### Pitfall 2: Race Condition on Friendship Request
**What goes wrong:** User A sends request to B, app checks "no pending request exists", but parallel request also passes check, both inserts succeed → duplicate requests in DB.

**Why it happens:** Check-then-insert pattern has window between check and insert.

**How to avoid:** 
- Use database UNIQUE constraint `(requester_id, addressee_id)` to prevent duplicates.
- Let DB raise IntegrityError; catch and return 409 Conflict (request already pending).
- Do NOT try to prevent duplicate in app code.

**Warning signs:** 
- Unit tests pass, integration tests show duplicate requests.
- Customer reports: "I sent request, saw it pending, but it let me send again."

### Pitfall 3: Asymmetric Friendship (A→B but not B→A after accept)
**What goes wrong:** After A sends request and B accepts, A sees B as friend but B doesn't see A. Feed is one-sided.

**Why it happens:** Accept only updates one Friendship record; forgot to check bidirectionally in queries.

**How to avoid:** 
- After accept, always check both `(requester, addressee)` and `(addressee, requester)` in "is_friend" helper.
- Or create a view/helper that returns union of both directions.
- Test: after accept, verify both users' friend lists include each other.

**Warning signs:** 
- A can see B's activity feed but B cannot see A's.
- Leaderboard shows both ranked, but friends list doesn't match.

### Pitfall 4: Privacy Leak (Exposing Non-Friend Activity)
**What goes wrong:** Endpoint returns friend activity feed but doesn't check friendship status; returns data for any user_id in params.

**Why it happens:** Forgot to add `where status='accepted' and (requester=user or addressee=user)` clause.

**How to avoid:** 
- Write helper `async def is_friend(db, user_a_id, user_b_id)` once, use everywhere.
- Protect all user-specific endpoints with this helper.
- Test: try to fetch /api/friends/{random_user_id}/activity without sending request → should 404 or return empty.

**Warning signs:** 
- Users report seeing strangers' quest activity.
- Endpoint returns data when friendship is still pending (should return nothing).

### Pitfall 5: Forgetting to Update Activity After Friend Deletes Account
**What goes wrong:** Friend deletes account, activity feed still references them by user_id, but User record is gone → foreign key violation or orphaned activity.

**Why it happens:** No cascade delete rule on Friendship or activity table.

**How to avoid:** 
- Add `cascade="all, delete-orphan"` to Friendship relationship when defining User model.
- If using separate activity_events table (v2.0), also cascade delete from there.
- Test: delete user, verify all their Friendship records are gone.

**Warning signs:** 
- User deletion fails with FK constraint error.
- Old deleted friend still appears in activity feed UI.

## Code Examples

Verified patterns from implementation sources:

### User Search by display_name
```python
# Source: Phase 3 auth router pattern + PostgreSQL ilike
# backend/app/routers/friends.py (new)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models, schemas, crud
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=2, max_length=64),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Search users by display_name (case-insensitive substring)."""
    search_pattern = f"%{q}%"
    result = await db.execute(
        select(models.User)
        .filter(models.User.display_name.ilike(search_pattern))
        .filter(models.User.id != user.id)  # Exclude self
        .order_by(models.User.display_name)
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "display_name": u.display_name or u.username or f"Игрок #{u.id}",
            "avatar": u.selected_avatar,
            "lvl": u.lvl,
        }
        for u in users
    ]
```

### Send Friend Request
```python
# Source: Phase 3 auth + Phase 5 inventory error handling pattern
# backend/app/routers/friends.py (new)

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.exc import IntegrityError
from app.models import Friendship, FriendshipStatus

@router.post("/api/friends/request")
async def send_friend_request(
    req: dict,  # {"addressee_id": 123}
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send friend request. Returns 409 if request already pending/accepted."""
    addressee_id = req.get("addressee_id")
    if addressee_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot befriend self")
    
    addressee = await crud.get_user_by_id(db, addressee_id)
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if request already exists (pending or accepted)
    existing = await db.execute(
        select(Friendship).filter(
            Friendship.requester_id == user.id,
            Friendship.addressee_id == addressee_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Request already pending or accepted")
    
    try:
        friendship = Friendship(
            requester_id=user.id,
            addressee_id=addressee_id,
            status=FriendshipStatus.pending,
        )
        db.add(friendship)
        await db.commit()
        await db.refresh(friendship)
        return {"status": "pending", "created_at": friendship.created_at}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Request conflict (race condition)")
```

### Accept Friend Request + Bidirectional Visibility
```python
# Source: Phase 7 leaderboard pattern + bidirectional query

async def is_friend(db: AsyncSession, user_a_id: int, user_b_id: int) -> bool:
    """Check if users are friends (bidirectional)."""
    result = await db.execute(
        select(Friendship).filter(
            Friendship.status == FriendshipStatus.accepted,
            or_(
                and_(Friendship.requester_id == user_a_id, Friendship.addressee_id == user_b_id),
                and_(Friendship.requester_id == user_b_id, Friendship.addressee_id == user_a_id),
            ),
        )
    )
    return result.scalars().first() is not None

@router.post("/api/friends/accept/{friendship_id}")
async def accept_friend_request(
    friendship_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept pending friend request. User must be addressee."""
    result = await db.execute(
        select(Friendship).filter(
            Friendship.id == friendship_id,
            Friendship.addressee_id == user.id,
            Friendship.status == FriendshipStatus.pending,
        )
    )
    friendship = result.scalars().first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found or already accepted")
    
    friendship.status = FriendshipStatus.accepted
    await db.commit()
    return {"status": "accepted"}
```

### Friend Activity Feed with Eager Loading
```python
# Source: Phase 7 leaderboard get_top() pattern

from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone

@router.get("/api/friends")
async def get_friends_with_activity(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
):
    """Return friend list + recent activity feed (quests, level-ups)."""
    # Get all friend IDs (bidirectional)
    result = await db.execute(
        select(Friendship).filter(
            Friendship.status == FriendshipStatus.accepted,
            or_(
                Friendship.requester_id == user.id,
                Friendship.addressee_id == user.id,
            ),
        )
    )
    friendships = result.scalars().all()
    friend_ids = {
        (f.addressee_id if f.requester_id == user.id else f.requester_id)
        for f in friendships
    }
    
    if not friend_ids:
        return {"friends": [], "activity": []}
    
    # Fetch users with eager-loaded quests (prevents N+1)
    result = await db.execute(
        select(models.User)
        .filter(models.User.id.in_(friend_ids))
        .options(selectinload(models.User.quests))
    )
    friends = result.scalars().unique().all()
    
    # Build activity feed (quest completions + level-ups)
    activity = []
    cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)  # Last 7 days
    
    for friend in friends:
        for quest in sorted(friend.quests, key=lambda q: q.created_at, reverse=True):
            if quest.is_completed and quest.created_at > cutoff_time:
                activity.append({
                    "user_id": friend.id,
                    "display_name": friend.display_name,
                    "avatar": friend.selected_avatar,
                    "event_type": "quest_completed",
                    "event_data": {"quest_title": quest.title, "difficulty": quest.difficulty},
                    "timestamp": quest.created_at,
                })
                break  # One activity per friend for feed brevity
    
    # Sort by timestamp descending
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    friend_list = [
        {
            "id": f.id,
            "display_name": f.display_name,
            "avatar": f.selected_avatar,
            "lvl": f.lvl,
        }
        for f in friends
    ]
    
    return {"friends": friend_list[:limit], "activity": activity[:limit]}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for requests | (Phase 11: WebSocket or Web Push) | v1.0 scope deferral | v1.0 uses GET endpoint with client-side poll every 30s; Phase 11 adds real-time |
| No friendship privacy | Friends-only leaderboard view (Phase 2.0) | Out of scope v1.0 | v1.0 shows leaderboard to all; Phase 2.0 may add friend-only views |
| Flat activity log | Time-windowed feed (7 days) | v1.0 standard | Keeps feed fresh, limits DB scan, prevents scroll-to-death |

**Deprecated/outdated:**
- Telegram Mini App context for friendship (Phase 1-2): Removed in Phase 3 pivot to web. Friendships now web-native.

## Open Questions

1. **Activity definition completeness**
   - What we know: SOCL-02 requires "feed их активности" (feed of their activity). From Phase 4-5, activity events are quest completions and level-ups.
   - What's unclear: Should level-up be explicit event or inferred from User.lvl change? Should shop purchases or inventory changes appear in friend feed?
   - Recommendation: v1.0 scope: quest completion only (clear data in quests table); level-up visible implicitly via User.lvl on friend card. Separate activity_events table deferred to v2.0 if needed for richer notifications.

2. **Blocking vs. ignore list**
   - What we know: SOCL-01/02 make no mention of blocking or ignoring users.
   - What's unclear: Should users be able to block? Prevent blocked users from sending requests? Hide blocked users from search?
   - Recommendation: Out of scope v1.0. Add FriendshipStatus='blocked' in v2.0 if users report spam. For now, delete handles removal.

3. **Request notification delivery**
   - What we know: Accept endpoint exists; phase assumes GET /api/friends polling.
   - What's unclear: Should incoming request create notification? (Phone, browser push, email?)
   - Recommendation: v1.0 scope: none — users check "Friends" page manually. Phase 11 adds email on request (PROD-03 SMTP). Phase 2.0 WebSocket for real-time.

4. **Search result ranking**
   - What we know: Search returns sorted by display_name.
   - What's unclear: Should results prioritize mutual friends, or recent activity, or similar lvl?
   - Recommendation: v1.0: alphabetical order (simple, predictable). Phase 2.0: relevance ranking if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.1.1 (existing) |
| Config file | `backend/pytest.ini` (use Phase 5 pattern: stub fixtures, no TestClient/DB) |
| Quick run command | `pytest tests/routers/test_friends.py -x` |
| Full suite command | `pytest tests/ -x` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SOCL-01a | `/api/users/search?q=alex` returns users with matching display_name (case-insensitive) | unit | `pytest tests/routers/test_friends.py::test_search_users_by_display_name -x` | ❌ Wave 0 |
| SOCL-01b | `POST /api/friends/request` creates pending Friendship; 409 if request exists | unit | `pytest tests/routers/test_friends.py::test_send_friend_request_success -x` | ❌ Wave 0 |
| SOCL-01c | Cannot request self; addressee must exist | unit | `pytest tests/routers/test_friends.py::test_send_friend_request_validation -x` | ❌ Wave 0 |
| SOCL-02a | `POST /api/friends/accept/{id}` changes status to accepted; only addressee can accept | unit | `pytest tests/routers/test_friends.py::test_accept_friend_request -x` | ❌ Wave 0 |
| SOCL-02b | `DELETE /api/friends/{id}` removes Friendship; works for both users | unit | `pytest tests/routers/test_friends.py::test_delete_friendship -x` | ❌ Wave 0 |
| SOCL-02c | `GET /api/friends` returns friend list + activity (quest completions only) | unit | `pytest tests/routers/test_friends.py::test_get_friends_with_activity -x` | ❌ Wave 0 |
| SOCL-02d | Friend activity visible only to friends; non-friends get empty list | unit | `pytest tests/routers/test_friends.py::test_friend_activity_privacy -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest tests/routers/test_friends.py::test_{feature} -x`
- **Per wave merge:** `pytest tests/routers/test_friends.py -x`
- **Phase gate:** All 8 tests green + coverage >80% before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/routers/test_friends.py` — covers SOCL-01/02 router endpoints (search, request, accept, delete, list+activity)
- [ ] `tests/routers/conftest.py` addition — StubFriendship fixture for isolation testing
- [ ] `backend/migrations/XXXXXXX_add_friendships.py` — Alembic migration (auto-generated from models.Friendship)

## Sources

### Primary (HIGH confidence)
- **Context7 (SQLAlchemy 2.0.25)** — Relationship definitions, selectinload eager loading, ilike operator, UniqueConstraint, ForeignKey cascade
- **Phase 3 (existing auth code)** — User model with display_name, get_current_user dependency, JWT Bearer pattern, HTTPException error handling
- **Phase 5 (existing inventory code)** — CRUD pattern with **Depends(get_db)**, IntegrityError handling on race conditions, Enum for status fields
- **Phase 7 (existing leaderboard code)** — Eager loading with selectinload, complex queries with or_/and_, fetching users in batch to prevent N+1
- **PostgreSQL ilike operator** — Case-insensitive search on text fields, performs index scan if GIST/GIN available

### Secondary (MEDIUM confidence)
- **SQLAlchemy relationships backref** — Inverse side of ForeignKey (e.g., User.friend_requests_sent). Verified in Phase 3-5 models.
- **Bidirectional friendship logic** — Common pattern in social networks; adapts standard SQLAlchemy many-to-many to directed graph (requester → addressee).

### Tertiary (LOW confidence)
- Activity feed timestamp windowing — Inferred from pagination patterns; not explicitly implemented in existing codebase. Will require validation during planning.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All dependencies exist in requirements.txt; patterns from Phase 3-7 verified in codebase
- Architecture (Friendship model, eager loading, search): **HIGH** — Direct analogs in Phase 5-7 code; SQLAlchemy docs support all patterns
- Pitfalls (N+1, race conditions, privacy): **MEDIUM** — Common social network issues; not specific to this codebase but standard knowledge domain
- Activity feed (quest completions only, 7-day window): **MEDIUM** — SOCL-02 says "feed их активности" but doesn't specify what counts; inferred from existing quest/user data model

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stable domain, minor library updates unlikely)
