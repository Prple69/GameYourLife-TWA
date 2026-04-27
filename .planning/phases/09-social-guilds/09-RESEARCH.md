# Phase 9: Social — Guilds & Challenges - Research

**Researched:** 2026-04-27
**Domain:** Guild management, membership, group challenges with quest-based progress
**Confidence:** MEDIUM-HIGH

## Summary

Phase 9 implements guild creation, membership management, and group challenge mechanics. Guilds are groups where users form communities and collaborate on time-bounded challenges. A guild has an owner (creator), officers (delegated managers), and members. Challenges are created by officers, include start/end dates and goals, and measure progress by tracking completed quests from guild members.

The phase builds directly on Phase 8 (friends/social foundation) and depends on Phase 4 character progression (quest system) and Phase 5 multiplier/boost mechanics. Key architectural decisions: guilds are public-by-default (GUILD-01/02 success criteria specify public listing), guild members track roles via enum, challenges roll up member quest completions into guild-level progress, and membership roles control who can create/edit challenges.

Primary technical challenge: building efficient aggregation queries that sum quest completions from guild members into challenge progress without N+1 queries. Secondary: ensuring role-based permission checks (owner/officer/member) on challenge creation/modification.

**Primary recommendation:** Use SQLAlchemy relationships for Guild→Member→User graph with eager loading for activity queries, implement challenge progress as view or computed field (sum of member quests matching challenge date range), use index on (guild_id, member_id) for membership lookups, and enforce permissions in router layer before mutation operations.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GUILD-01 | User создаёт гильдию (slug/name/description), становится owner | Guild ORM model with owner_id FK, post_guild endpoint creates Guild + GuildMember(user_id, guild_id, role='owner'), slug must be unique+URL-safe |
| GUILD-02 | User вступает/покидает публичную гильдию; роли owner / officer / member | GuildMember model with role enum; POST /api/guilds/{id}/join creates GuildMember(role='member'); DELETE /api/guilds/{id}/leave removes it; role changes require owner/officer check |

**Implicit requirements inferred from success criteria:**
- SOCL-03: `GET /api/guilds` lists public guilds (paginated), `GET /api/guilds/{slug}` detail view
- SOCL-04: `GET /api/guilds/{id}/challenges` returns active challenges with member quest-based progress tracking

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.109.0 | REST API framework | Existing project stack; async-first, minimal boilerplate, same as Phases 3-8 |
| SQLAlchemy | 2.0.25 | ORM + schema | Existing; relationships + eager loading prevent N+1 on guild member queries |
| PostgreSQL | (via asyncpg 0.29.0) | Persistent DB | Existing; supports UNIQUE constraints on slug, foreign key cascades on role changes |
| Pydantic | 2.5.3 | Response schemas | Existing; strict validation for guild creation (slug format, name length) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SQLAlchemy selectinload | 2.0.25 | Eager loading guild members + their users | Prevent N+1 when fetching guild member list with user details (avatar, name, level) |
| slugify (python-slugify) | 8.0.1 | Convert name to URL-safe slug | Guild slug generation from user input; already used in Phase 5 shop item slugs (verify) |
| Alembic | 1.13.1 | Schema migration | Create guilds, guild_members, guild_challenges tables + indexes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Guild slug (unique string) | Use sequential IDs only | Slug enables user-friendly URLs (/api/guilds/dragon-slayers vs /api/guilds/42); semantic URLs are important for share-ability |
| GuildMember role enum | String column + manual validation | Enum at DB level prevents invalid roles; string requires app-level validation + trust |
| Challenge progress from sum query | Track in denormalized column | Query is more complex but avoids data sync bugs; denormalization couples challenge table to member quest table, risk of stale data |
| Public-only guilds (v1.0) | Support invite-only guilds now | v1.0 scope: public registration only. Invite-only requires invite generation/revocation logic (Phase 2.0). Simple public model reduces complexity. |

**Installation:**
```bash
# Verify existing dependencies are in requirements.txt
pip list | grep -E "sqlalchemy|fastapi|pydantic"

# python-slugify may need explicit install if not present
pip install python-slugify  # or verify in requirements.txt
```

## Architecture Patterns

### Recommended Project Structure

**Backend additions:**
```
backend/app/routers/
├── guilds.py                    # New: GET /api/guilds, GET /api/guilds/{slug},
                                 #      POST /api/guilds, POST /api/guilds/{id}/join,
                                 #      DELETE /api/guilds/{id}/leave,
                                 #      GET /api/guilds/{id}/challenges

backend/migrations/versions/
└── XXXXXXX_add_guilds_and_challenges.py  # New: guilds, guild_members, guild_challenges tables

frontend/src/
├── pages/GuildsPage.jsx         # New: guild list, detail view, create form, challenges view
├── components/
│   ├── GuildCard.jsx            # New: guild info card with member count, join button
│   ├── GuildDetailView.jsx       # New: full guild info, member list, challenges list
│   ├── GuildCreateForm.jsx       # New: form to create guild (name, description)
│   ├── ChallengeCard.jsx         # New: challenge progress bar with member contribution
│   └── MemberListPanel.jsx       # New: guild members with roles (owner/officer/member)
└── services/
    └── guildsService.js         # New: API calls for guild CRUD, join/leave, challenges
```

### Pattern 1: Guild Ownership & Membership Roles

**What:** Guilds have owner (creator) who can transfer ownership and promote officers. Officers can create/edit challenges. Members see challenges and contribute via quests.

**When to use:** Any guild operation—membership changes, challenge creation, deletion require role checks.

**Example:**
```python
# Source: Phase 3/5 auth patterns adapted for guild roles
import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, UniqueConstraint

class GuildRole(str, enum.Enum):
    owner = "owner"
    officer = "officer"
    member = "member"

class Guild(Base):
    __tablename__ = "guilds"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)  # URL-safe name
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_msk_now)
    
    members = relationship("GuildMember", back_populates="guild", cascade="all, delete-orphan")

class GuildMember(Base):
    __tablename__ = "guild_members"
    __table_args__ = (
        UniqueConstraint("guild_id", "user_id", name="uq_guild_user"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(GuildRole), nullable=False, default=GuildRole.member)
    joined_at = Column(DateTime(timezone=True), default=get_msk_now)
    
    guild = relationship("Guild", back_populates="members")
    user = relationship("User")
```

**Why:** Prevents duplicate memberships (UNIQUE), enables role-based access control (check role before allowing challenge creation), cascade delete ensures data consistency when guild or user is deleted.

### Pattern 2: Challenge Progress Aggregation

**What:** A challenge has start_date, end_date, and target_xp. Progress is sum of XP earned by guild members on quests created between dates.

**When to use:** GET /api/guilds/{id}/challenges returns active challenges with current progress.

**Example:**
```python
# Source: Phase 7 leaderboard aggregation pattern adapted
from sqlalchemy import select, func

async def get_challenge_progress(db: AsyncSession, challenge_id: int) -> dict:
    """Return challenge with current progress (sum of member quests in date range)."""
    challenge = await db.get(GuildChallenge, challenge_id)
    if not challenge:
        return None
    
    # Query: sum XP from quests where:
    # - quest.user_id in (guild members)
    # - quest.created_at >= challenge.start_date
    # - quest.created_at <= challenge.end_date
    # - quest.is_completed = true
    result = await db.execute(
        select(func.sum(models.Quest.xp_reward))
        .join(models.GuildMember, models.Quest.user_id == models.GuildMember.user_id)
        .filter(
            models.GuildMember.guild_id == challenge.guild_id,
            models.Quest.created_at >= challenge.start_date,
            models.Quest.created_at <= challenge.end_date,
            models.Quest.is_completed == True,
        )
    )
    current_xp = result.scalar() or 0
    
    return {
        "id": challenge.id,
        "name": challenge.name,
        "target_xp": challenge.target_xp,
        "current_xp": current_xp,
        "progress_percent": int(100 * current_xp / challenge.target_xp) if challenge.target_xp > 0 else 0,
        "active": challenge.is_active,
    }
```

**Why:** Avoids denormalization (no stored progress field), always reflects current state, leverages PostgreSQL SUM aggregation (faster than Python loop).

### Pattern 3: Slug Generation & Validation

**What:** Guild slug is unique, URL-safe identifier derived from name (e.g., "Dragon Slayers" → "dragon-slayers").

**When to use:** Every guild creation; before INSERT check slug uniqueness + format.

**Example:**
```python
# Source: Phase 5 shop slug pattern (if exists) or standard python-slugify usage
from slugify import slugify

async def create_guild(
    body: dict,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create new guild. Current user becomes owner."""
    name = body.get("name", "").strip()
    if not name or len(name) < 3:
        raise HTTPException(status_code=400, detail="Guild name must be ≥3 chars")
    
    # Generate slug from name
    slug = slugify(name, lowercase=True, word_boundary=True)
    if not slug or len(slug) == 0:
        raise HTTPException(status_code=400, detail="Guild name contains no valid characters")
    
    # Check slug uniqueness
    existing = await db.execute(
        select(models.Guild).filter(models.Guild.slug == slug)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Guild with similar name already exists")
    
    guild = models.Guild(
        owner_id=user.id,
        slug=slug,
        name=name,
        description=body.get("description", ""),
    )
    db.add(guild)
    await db.flush()  # Ensure ID is assigned
    
    # Create owner membership
    member = models.GuildMember(
        guild_id=guild.id,
        user_id=user.id,
        role=models.GuildRole.owner,
    )
    db.add(member)
    await db.commit()
    return guild
```

**Why:** Slug is deterministic (same name always generates same slug), URL-safe (no special chars), human-readable (e.g., /api/guilds/dragon-slayers vs /api/guilds/42), UNIQUE constraint prevents duplicates.

### Pattern 4: Guild Member Eager Loading

**What:** When fetching guild details, fetch all members with their User data in one or two queries (not N+1).

**When to use:** GET /api/guilds/{slug} returns guild + member list with avatars/names/levels.

**Example:**
```python
# Source: Phase 8 friends eager loading pattern
from sqlalchemy.orm import selectinload

async def get_guild_detail(slug: str, db: AsyncSession):
    """Return guild with members (eager-loaded users to prevent N+1)."""
    result = await db.execute(
        select(models.Guild)
        .filter(models.Guild.slug == slug)
        .options(
            selectinload(models.Guild.members).selectinload(models.GuildMember.user)
        )
    )
    guild = result.scalars().first()
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    # Transform to response schema
    members = [
        {
            "id": m.user.id,
            "display_name": m.user.display_name or f"Игрок #{m.user.id}",
            "avatar": m.user.selected_avatar,
            "lvl": m.user.lvl,
            "role": m.role.value,
        }
        for m in guild.members
    ]
    
    return {
        "id": guild.id,
        "slug": guild.slug,
        "name": guild.name,
        "description": guild.description,
        "owner_id": guild.owner_id,
        "member_count": len(members),
        "members": members,
    }
```

**Why:** Selectinload + nested selectinload ensures 2 queries total (1 for guild, 1 for members+users), not 1 + N. Scales to 1000+ members.

### Anti-Patterns to Avoid

- **Storing guild progress in denormalized column:** Challenge.current_xp field that isn't updated atomically with quest completion → stale progress. Keep progress computed from quest data.
- **Checking ownership at every router branch:** Write helper `async def check_guild_permission(db, user_id, guild_id, required_role)` once, use everywhere.
- **N+1 on guild member queries:** Do NOT `for member_id in guild_member_ids: db.query(User).filter(id=member_id)`. Use eager loading.
- **Allowing user to be both owner and member:** Redundant GuildMember record. Owner is implicitly a member (has role='owner', can participate).
- **Public guild listing without pagination:** GET /api/guilds returns all 10k guilds → memory bloat. Always paginate (limit 20, offset).
- **Forgetting to check role before challenge creation:** Any member can create challenges → chaos. POST /api/guilds/{id}/challenges requires owner OR officer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug from user text | Regex in Python | python-slugify library | Regex doesn't handle accents/unicode well; slugify is battle-tested, handles Russian chars correctly |
| Guild member deduplication | Check in app code | UNIQUE(guild_id, user_id) constraint | Race condition: parallel joins both pass check; UNIQUE prevents duplicates at DB level |
| Challenge progress calculation | Track in denormalized column | Computed query (SUM quests) | Stale data risk: quest completion updates quest table but not challenge progress column; query is reliable source of truth |
| Role-based permission checks | Scattered throughout router | Write one `check_permission()` helper, import everywhere | Repeated pattern = maintenance burden + security bugs if one check is forgotten |
| Guild list pagination | Fetch all, slice in Python | SQL LIMIT/OFFSET | 10k+ guilds in memory kills server; DB pagination is O(1) per page |

**Key insight:** Guilds at scale (even 1000+ guilds) need DB-side enforcement (UNIQUE, cascades, indexes) and efficient queries (eager loading, aggregation). Python-level checks add latency and create permission bugs.

## Common Pitfalls

### Pitfall 1: Guild Creator Not Added to Members Table
**What goes wrong:** User creates guild, becomes owner, but no GuildMember record. GET /api/guilds/{id}/members returns empty list. Owner sees their guild as having 0 members.

**Why it happens:** Creation logic inserts Guild but forgets to insert GuildMember(role='owner') for the creator.

**How to avoid:** 
- In create_guild(), after INSERT guild, always INSERT guild_member with role='owner' for user.id.
- Test: create guild, then GET /api/guilds/{slug}, verify members array includes creator with role='owner'.

**Warning signs:**
- Guild shows 0 members but creator can still see challenges.
- UI says "1 other member" instead of "you + 0 others".

### Pitfall 2: N+1 on Guild Members + User Details
**What goes wrong:** Endpoint returns guild members list. Code queries guild members, then loops `for member in members: db.query(User).get(member.user_id)` → 1 + N queries.

**Why it happens:** Lazy loading feels natural; async doesn't fix underlying problem.

**How to avoid:**
- Always use selectinload(Guild.members).selectinload(GuildMember.user) when fetching guild with member list.
- Test with query counter: assert len(db.queries) == 2 for guild fetch with 100 members.

**Warning signs:**
- Endpoint takes 3+ seconds with 100 members.
- PostgreSQL slow query log shows User table queried N times.

### Pitfall 3: Challenge Progress Always Returns 0
**What goes wrong:** Challenge exists, guild members complete quests, but challenge progress query returns 0 XP.

**Why it happens:** Query joins quests WHERE quest.user_id IN guild_member_ids, but guild_members table not joined correctly, or date filter excludes quests.

**How to avoid:**
- Verify query includes `quest.created_at BETWEEN challenge.start AND challenge.end`.
- Verify guild_member_ids are correctly extracted from guild_members table (not hardcoded).
- Test: create challenge, complete quest, run progress query, verify current_xp > 0.

**Warning signs:**
- Challenge progress is always 0% even after members complete quests.
- Manual SQL query shows XP exists, but API endpoint returns 0.

### Pitfall 4: Permission Check Bypassed for Challenge Creation
**What goes wrong:** Regular member can POST /api/guilds/{id}/challenges and create challenges (only owner/officer should).

**Why it happens:** Forgot to check guild_member.role before INSERT guild_challenge.

**How to avoid:**
- Write helper: `async def require_guild_permission(db, user_id, guild_id, required_role: GuildRole)` that raises 403 if role < required.
- Call in POST /api/guilds/{id}/challenges before db.add(challenge).
- Test: non-officer tries to create challenge → 403.

**Warning signs:**
- Regular members report seeing a "Create Challenge" button they shouldn't have.
- Multiple challenges created by same member in seconds (they're spamming).

### Pitfall 5: Owner Transfer Leaves Old Owner in Members Table with Wrong Role
**What goes wrong:** Owner A transfers guild to B. A's GuildMember.role should change to 'member' or be deleted. If left as 'owner', A can still modify challenges.

**Why it happens:** Transfer logic updates Guild.owner_id but forgets to update GuildMember records.

**How to avoid:**
- Transfer endpoint: UPDATE guild_members SET role='member' WHERE guild_id=X AND user_id=old_owner_id.
- Or: DELETE old owner from guild_members, re-INSERT as role='member'.
- Test: transfer ownership, verify old owner can no longer create/delete challenges.

**Warning signs:**
- Transferring ownership doesn't revoke old owner's permissions.
- Multiple owners claim authority over same guild.

### Pitfall 6: Slug Collision on Guild Name Edit
**What goes wrong:** Guild "Dragon Slayers" has slug "dragon-slayers". Admin edits name to "Dragon slayers 2", which slugifies to "dragon-slayers-2". But if another guild already has that slug, constraint violation.

**Why it happens:** Edit endpoint re-slugifies name without checking uniqueness of new slug.

**How to avoid:**
- On name edit, generate new slug, check UNIQUE constraint before UPDATE.
- If slug conflict, append random suffix or reject edit.
- Test: try to rename guild to existing sibling name → 409 Conflict.

**Warning signs:**
- Guild name edit sometimes fails with mysterious constraint error.

### Pitfall 7: Challenge with End Date in Past Never Completes
**What goes wrong:** Challenge set to end 2026-04-20, now is 2026-04-27. Challenge query uses `is_active = true` to filter, so old challenges never appear in results. User can never see they completed it.

**Why it happens:** is_active column requires manual update; no trigger to mark as inactive at end_date.

**How to avoid:**
- Query includes both is_active=true AND end_date >= NOW (not just is_active).
- Or: use `SELECT ... WHERE end_date >= NOW()` (DB-computed).
- Consider cron job (Phase 11) to mark expired challenges is_active=false for cleanup.

**Warning signs:**
- Old challenges disappear from UI but aren't archived anywhere.
- Leaderboard shows challenge XP awards but user can't see their contribution.

## Code Examples

Verified patterns from existing Phases:

### Create Guild with Owner Membership
```python
# Source: Phase 8 friendship request pattern + Phase 3/5 transaction pattern
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify

router = APIRouter(prefix="/api/guilds", tags=["guilds"])

@router.post("", response_model=dict, status_code=201)
async def create_guild(
    body: dict,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create new guild. Current user becomes owner."""
    name = body.get("name", "").strip()
    if not name or len(name) < 3 or len(name) > 64:
        raise HTTPException(status_code=400, detail="Guild name must be 3-64 chars")
    
    slug = slugify(name, lowercase=True)
    if not slug:
        raise HTTPException(status_code=400, detail="Guild name contains no valid characters")
    
    # Check slug uniqueness
    existing = await db.execute(
        select(models.Guild).filter(models.Guild.slug == slug)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Guild name already exists")
    
    guild = models.Guild(
        owner_id=user.id,
        slug=slug,
        name=name,
        description=body.get("description", ""),
    )
    db.add(guild)
    await db.flush()  # Assign guild.id
    
    # Create owner membership
    member = models.GuildMember(
        guild_id=guild.id,
        user_id=user.id,
        role=models.GuildRole.owner,
    )
    db.add(member)
    await db.commit()
    await db.refresh(guild)
    
    return {
        "id": guild.id,
        "slug": guild.slug,
        "name": guild.name,
        "owner_id": guild.owner_id,
        "member_count": 1,
    }
```

### Join Guild
```python
# Source: Phase 5 inventory add pattern
@router.post("/{guild_id}/join", status_code=201)
async def join_guild(
    guild_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join guild as member (if public)."""
    guild = await db.get(models.Guild, guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    # Check if already member
    existing = await db.execute(
        select(models.GuildMember).filter(
            models.GuildMember.guild_id == guild_id,
            models.GuildMember.user_id == user.id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Already a member")
    
    member = models.GuildMember(
        guild_id=guild_id,
        user_id=user.id,
        role=models.GuildRole.member,
    )
    db.add(member)
    await db.commit()
    
    return {"message": "Joined guild"}
```

### Get Guild with Members (Eager Loaded)
```python
# Source: Phase 8 friends list pattern
from sqlalchemy.orm import selectinload

@router.get("/{slug}")
async def get_guild(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Return guild detail with members list."""
    result = await db.execute(
        select(models.Guild)
        .filter(models.Guild.slug == slug)
        .options(
            selectinload(models.Guild.members).selectinload(models.GuildMember.user)
        )
    )
    guild = result.scalars().first()
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    members = [
        {
            "id": m.user.id,
            "display_name": m.user.display_name or f"Игрок #{m.user.id}",
            "avatar": m.user.selected_avatar,
            "lvl": m.user.lvl,
            "role": m.role.value,
        }
        for m in guild.members
    ]
    
    return {
        "id": guild.id,
        "slug": guild.slug,
        "name": guild.name,
        "description": guild.description,
        "owner_id": guild.owner_id,
        "member_count": len(members),
        "members": members,
    }
```

### Challenge Progress Query
```python
# Source: Phase 7 leaderboard aggregation pattern
from sqlalchemy import func

async def get_challenge_progress(db: AsyncSession, challenge_id: int):
    """Return challenge with current progress."""
    challenge = await db.get(models.GuildChallenge, challenge_id)
    if not challenge:
        return None
    
    result = await db.execute(
        select(func.sum(models.Quest.xp_reward))
        .join(models.GuildMember, models.Quest.user_id == models.GuildMember.user_id)
        .filter(
            models.GuildMember.guild_id == challenge.guild_id,
            models.Quest.created_at >= challenge.start_date,
            models.Quest.created_at <= challenge.end_date,
            models.Quest.is_completed == True,
        )
    )
    current_xp = result.scalar() or 0
    
    return {
        "id": challenge.id,
        "name": challenge.name,
        "target_xp": challenge.target_xp,
        "current_xp": current_xp,
        "progress_percent": int(100 * current_xp / challenge.target_xp) if challenge.target_xp > 0 else 0,
    }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No guild system | Guild system (Phase 9) | v1.0 addition | Enables multiplayer engagement, competition, collaboration |
| Public guilds only | (Invite-only/private guilds in v2.0) | v1.0 scope limit | Public-only simplifies implementation; private invites require additional logic (Phase 2.0) |
| Manual challenge progress tracking | Query-computed from member quests | v1.0 standard | Always accurate, no sync needed, leverages existing quest data |
| Roles as strings | Enum(GuildRole) | Phase 9 standard | Type safety at DB level, prevents invalid role values |

**Deprecated/outdated:**
- None for guilds (new feature for v1.0).

## Open Questions

1. **Guild size limits**
   - What we know: GUILD-01/02 don't mention limits.
   - What's unclear: Should guilds have max members (e.g., 100 per guild)? Or unlimited?
   - Recommendation: v1.0 scope: no limit. If spam/moderation issues arise, Phase 2.0 adds caps and guild flags (blocked, inactive).

2. **Challenge types and custom goals**
   - What we know: SOCL-04 says challenges measure progress from quest completions.
   - What's unclear: Can challenges be custom (e.g., "complete 5 quests of type 'fitness'")? Or only total XP targets?
   - Recommendation: v1.0 scope: simple XP targets only. Custom quest type filters (Phase 2.0).

3. **Guild dissolution and member data**
   - What we know: Guild cascade-deletes members on deletion (from FK design).
   - What's unclear: What happens to member achievement history if guild is deleted?
   - Recommendation: v1.0 scope: no separate achievement log. Guild deletion removes challenge records (cascade). Phase 2.0 adds audit log if needed.

4. **Officer promotion and demotion**
   - What we know: Roles are owner/officer/member.
   - What's unclear: Can owner promote/demote members? Or is role fixed at join?
   - Recommendation: v1.0 scope: role fixed (anyone joins as 'member', owner can promote to 'officer' but no demotion). Phase 2.0 adds role management endpoints.

5. **Challenge visibility to non-members**
   - What we know: GET /api/guilds/{id}/challenges returns active challenges.
   - What's unclear: Can non-members see challenge details? Should they see progress?
   - Recommendation: v1.0 scope: challenges visible only to members (join to see). Anonymous users see guild name/member count only.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.1.1 (existing) |
| Config file | `backend/pytest.ini` (use Phase 8 pattern: stub fixtures, no TestClient/DB) |
| Quick run command | `pytest tests/routers/test_guilds.py -x` |
| Full suite command | `pytest tests/ -x` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GUILD-01a | `POST /api/guilds` creates guild with slug from name, owner becomes creator | unit | `pytest tests/routers/test_guilds.py::test_create_guild_success -x` | ❌ Wave 0 |
| GUILD-01b | Guild creation validates name (3-64 chars), rejects duplicate slug | unit | `pytest tests/routers/test_guilds.py::test_create_guild_validation -x` | ❌ Wave 0 |
| GUILD-02a | `POST /api/guilds/{id}/join` adds user as member, 409 if already joined | unit | `pytest tests/routers/test_guilds.py::test_join_guild_success -x` | ❌ Wave 0 |
| GUILD-02b | `DELETE /api/guilds/{id}/leave` removes membership | unit | `pytest tests/routers/test_guilds.py::test_leave_guild -x` | ❌ Wave 0 |
| GUILD-02c | `GET /api/guilds` returns public guilds (paginated), `GET /api/guilds/{slug}` detail | unit | `pytest tests/routers/test_guilds.py::test_list_and_detail_guilds -x` | ❌ Wave 0 |
| SOCL-04a | `GET /api/guilds/{id}/challenges` returns active challenges with progress (XP sum from member quests) | unit | `pytest tests/routers/test_guilds.py::test_get_challenges_with_progress -x` | ❌ Wave 0 |
| SOCL-04b | Challenge progress correctly sums XP from member quests within date range | unit | `pytest tests/routers/test_guilds.py::test_challenge_progress_calculation -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest tests/routers/test_guilds.py::test_{feature} -x`
- **Per wave merge:** `pytest tests/routers/test_guilds.py -x`
- **Phase gate:** All 7 tests green + coverage >80% before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/routers/test_guilds.py` — covers GUILD-01/02 router endpoints (create, list, detail, join, leave, challenges)
- [ ] `tests/routers/conftest.py` addition — StubGuild, StubGuildMember, StubChallenge fixtures for isolation testing
- [ ] `backend/migrations/XXXXXXX_add_guilds_and_challenges.py` — Alembic migration (hand-written, no autogenerate per Phase 4/5/8 pattern)

## Sources

### Primary (HIGH confidence)
- **Context7 (SQLAlchemy 2.0.25)** — Relationships, selectinload, Enum, UniqueConstraint, ForeignKey cascade, func.sum aggregation
- **Phase 3 (existing auth code)** — User model, get_current_user dependency, HTTPException error handling, transaction patterns
- **Phase 8 (existing friendship code)** — Directional relationships, status lifecycle, eager loading, UNIQUE constraints on user pairs
- **Phase 7 (existing leaderboard code)** — Query aggregation (ZADD), complex filters, batch user fetching
- **Phase 5 (existing inventory code)** — CRUD patterns, IntegrityError handling on race conditions, idempotency, transaction patterns

### Secondary (MEDIUM confidence)
- **python-slugify library** — URL-safe slug generation from user input; standard in Django/Rails ecosystems; handling of accents/unicode
- **Guild systems in MMORPG/social games** — Standard patterns: owner → officers → members, public guilds, quests as guild contribution

### Tertiary (LOW confidence)
- **Challenge progress calculation specifics** — Inferred from SOCL-04 ("прогресс считается от выполнения квестов участников"). Will require validation during planning.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All dependencies exist (SQLAlchemy, FastAPI); patterns from Phase 3-8 verified in codebase
- Architecture (Guild model, role enum, membership): **HIGH** — Direct analogs in Phase 5 inventory, Phase 8 friendships
- Challenge progress aggregation: **MEDIUM-HIGH** — Similar to Phase 7 leaderboard; some uncertainty on exact date range semantics (start/end inclusive?)
- Pitfalls (N+1, permission checks, slug collision): **MEDIUM** — Common social/gaming patterns; not all have been tested in this specific codebase

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stable domain, minor library updates unlikely)
