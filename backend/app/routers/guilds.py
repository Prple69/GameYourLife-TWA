"""Phase 9: Social — Guilds & Challenges router.

Endpoints:
  POST   /api/guilds                       — create guild (owner = creator)
  GET    /api/guilds                       — list public guilds (paginated)
  GET    /api/guilds/{slug}                — guild detail + member list
  POST   /api/guilds/{guild_id}/join       — join guild as member
  DELETE /api/guilds/{guild_id}/leave      — leave guild
  GET    /api/guilds/{guild_id}/challenges — active challenges with progress
  POST   /api/guilds/{guild_id}/challenges — create challenge (owner/officer only)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

try:
    from slugify import slugify
except ImportError:
    def slugify(text, **kwargs):
        import re
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        text = re.sub(r'^-+|-+$', '', text)
        return text

router = APIRouter(tags=["guilds"])


# ── Permission helper ─────────────────────────────────────────────────────

async def get_guild_member(
    db: AsyncSession,
    guild_id: int,
    user_id: int,
) -> models.GuildMember | None:
    """Return GuildMember for user in guild, or None if not a member."""
    result = await db.execute(
        select(models.GuildMember).filter(
            models.GuildMember.guild_id == guild_id,
            models.GuildMember.user_id == user_id,
        )
    )
    return result.scalars().first()


async def require_guild_permission(
    db: AsyncSession,
    guild_id: int,
    user_id: int,
    min_role: models.GuildRole = models.GuildRole.officer,
) -> models.GuildMember:
    """Raise 403 if user's role is below min_role. Role hierarchy: owner > officer > member."""
    role_rank = {
        models.GuildRole.owner: 3,
        models.GuildRole.officer: 2,
        models.GuildRole.member: 1,
    }
    member = await get_guild_member(db, guild_id, user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a guild member")
    if role_rank[member.role] < role_rank[min_role]:
        raise HTTPException(status_code=403, detail="Insufficient guild role")
    return member


# ── Create Guild ──────────────────────────────────────────────────────────

@router.post("/api/guilds", response_model=schemas.GuildListItem, status_code=201)
async def create_guild(
    body: schemas.GuildCreate,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create new guild. Current user becomes owner."""
    name = body.name.strip()
    if len(name) < 3 or len(name) > 64:
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
        description=body.description,
    )
    db.add(guild)
    await db.flush()  # Assigns guild.id before inserting member

    # Creator becomes owner member
    owner_member = models.GuildMember(
        guild_id=guild.id,
        user_id=user.id,
        role=models.GuildRole.owner,
    )
    db.add(owner_member)
    await db.commit()
    await db.refresh(guild)

    return schemas.GuildListItem(
        id=guild.id,
        slug=guild.slug,
        name=guild.name,
        description=guild.description,
        member_count=1,
        owner_id=guild.owner_id,
    )


# ── List Guilds ───────────────────────────────────────────────────────────

@router.get("/api/guilds", response_model=List[schemas.GuildListItem])
async def list_guilds(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Return paginated list of public guilds with member counts."""
    result = await db.execute(
        select(
            models.Guild,
            func.count(models.GuildMember.id).label("member_count"),
        )
        .outerjoin(models.GuildMember, models.Guild.id == models.GuildMember.guild_id)
        .group_by(models.Guild.id)
        .order_by(models.Guild.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    return [
        schemas.GuildListItem(
            id=guild.id,
            slug=guild.slug,
            name=guild.name,
            description=guild.description,
            member_count=count,
            owner_id=guild.owner_id,
        )
        for guild, count in rows
    ]


# ── Guild Detail ──────────────────────────────────────────────────────────

@router.get("/api/guilds/{slug}", response_model=schemas.GuildDetail)
async def get_guild(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Return guild detail with member list (2 queries via selectinload — no N+1)."""
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

    # Find requesting user's role
    my_role = None
    member_items = []
    for m in guild.members:
        member_items.append(
            schemas.GuildMemberItem(
                id=m.user.id,
                display_name=m.user.display_name or f"Игрок #{m.user.id}",
                avatar=m.user.selected_avatar,
                lvl=m.user.lvl,
                role=m.role.value,
            )
        )
        if m.user_id == user.id:
            my_role = m.role.value

    return schemas.GuildDetail(
        id=guild.id,
        slug=guild.slug,
        name=guild.name,
        description=guild.description,
        owner_id=guild.owner_id,
        member_count=len(member_items),
        members=member_items,
        my_role=my_role,
    )


# ── Join Guild ────────────────────────────────────────────────────────────

@router.post("/api/guilds/{guild_id}/join", status_code=201)
async def join_guild(
    guild_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join guild as member. 409 if already a member."""
    guild = await db.get(models.Guild, guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")

    existing = await get_guild_member(db, guild_id, user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Already a member of this guild")

    try:
        member = models.GuildMember(
            guild_id=guild_id,
            user_id=user.id,
            role=models.GuildRole.member,
        )
        db.add(member)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already a member (race condition)")

    return {"message": "Joined guild"}


# ── Leave Guild ───────────────────────────────────────────────────────────

@router.delete("/api/guilds/{guild_id}/leave", status_code=204)
async def leave_guild(
    guild_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave guild. Owner cannot leave — must transfer ownership first."""
    member = await get_guild_member(db, guild_id, user.id)
    if not member:
        raise HTTPException(status_code=404, detail="Not a member of this guild")

    if member.role == models.GuildRole.owner:
        raise HTTPException(
            status_code=403,
            detail="Owner cannot leave. Transfer ownership to another member first.",
        )

    await db.delete(member)
    await db.commit()


# ── Challenges ────────────────────────────────────────────────────────────

@router.get("/api/guilds/{guild_id}/challenges", response_model=List[schemas.GuildChallengeWithProgress])
async def get_guild_challenges(
    guild_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return active challenges with computed XP progress. Members only."""
    member = await get_guild_member(db, guild_id, user.id)
    if not member:
        raise HTTPException(status_code=403, detail="Must be a guild member to view challenges")

    # Fetch challenges active now or in future (end_date >= now)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(models.GuildChallenge).filter(
            models.GuildChallenge.guild_id == guild_id,
            models.GuildChallenge.end_date >= now,
        ).order_by(models.GuildChallenge.start_date)
    )
    challenges = result.scalars().all()

    # For each challenge compute progress (SUM of XP from member quests in date range)
    output = []
    for challenge in challenges:
        progress_result = await db.execute(
            select(func.sum(models.Quest.xp_reward))
            .join(models.GuildMember, models.Quest.user_id == models.GuildMember.user_id)
            .filter(
                models.GuildMember.guild_id == guild_id,
                models.Quest.created_at >= challenge.start_date,
                models.Quest.created_at <= challenge.end_date,
                models.Quest.is_completed == True,
            )
        )
        current_xp = progress_result.scalar() or 0
        progress_percent = (
            int(100 * current_xp / challenge.target_xp)
            if challenge.target_xp > 0
            else 0
        )
        output.append(
            schemas.GuildChallengeWithProgress(
                id=challenge.id,
                guild_id=challenge.guild_id,
                name=challenge.name,
                description=challenge.description,
                target_xp=challenge.target_xp,
                current_xp=current_xp,
                progress_percent=min(progress_percent, 100),
                start_date=challenge.start_date,
                end_date=challenge.end_date,
            )
        )

    return output


@router.post("/api/guilds/{guild_id}/challenges", response_model=schemas.GuildChallengeItem, status_code=201)
async def create_guild_challenge(
    guild_id: int,
    body: schemas.GuildChallengeCreate,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create guild challenge. Requires owner or officer role."""
    await require_guild_permission(db, guild_id, user.id, min_role=models.GuildRole.officer)

    if body.end_date <= body.start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if body.target_xp <= 0:
        raise HTTPException(status_code=400, detail="target_xp must be positive")

    challenge = models.GuildChallenge(
        guild_id=guild_id,
        name=body.name,
        description=body.description,
        target_xp=body.target_xp,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)

    return schemas.GuildChallengeItem(
        id=challenge.id,
        guild_id=challenge.guild_id,
        name=challenge.name,
        description=challenge.description,
        target_xp=challenge.target_xp,
        start_date=challenge.start_date,
        end_date=challenge.end_date,
    )
