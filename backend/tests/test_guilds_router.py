"""Unit tests for Phase 9 guilds router — stub pattern (no DB, no TestClient)."""
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
import pytest

from app.models import GuildRole


# ── Stub helpers ──────────────────────────────────────────────────────────

class StubUser:
    def __init__(self, id=1, display_name="TestUser", lvl=1, selected_avatar=None):
        self.id = id
        self.display_name = display_name
        self.lvl = lvl
        self.selected_avatar = selected_avatar


class StubGuild:
    def __init__(self, id=1, slug="test-guild", name="Test Guild",
                 owner_id=1, description=None):
        self.id = id
        self.slug = slug
        self.name = name
        self.owner_id = owner_id
        self.description = description
        self.created_at = datetime.now(timezone.utc)
        self.members = []
        self.challenges = []


class StubGuildMember:
    def __init__(self, id=1, guild_id=1, user_id=1, role=GuildRole.member):
        self.id = id
        self.guild_id = guild_id
        self.user_id = user_id
        self.role = role
        self.joined_at = datetime.now(timezone.utc)
        self.user = StubUser(id=user_id)


class StubChallenge:
    def __init__(self, id=1, guild_id=1, name="Weekly XP", target_xp=500,
                 days_from_now=7):
        self.id = id
        self.guild_id = guild_id
        self.name = name
        self.description = None
        self.target_xp = target_xp
        self.start_date = datetime.now(timezone.utc) - timedelta(days=1)
        self.end_date = datetime.now(timezone.utc) + timedelta(days=days_from_now)
        self.created_at = datetime.now(timezone.utc)


class StubScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar(self):
        return self._value


class StubResult:
    def __init__(self, items, scalar_value=None):
        self._items = items if isinstance(items, list) else [items] if items else []
        self._scalar_value = scalar_value

    def scalars(self):
        return self

    def all(self):
        return self._items

    def first(self):
        return self._items[0] if self._items else None

    def unique(self):
        return self

    def scalar(self):
        return self._scalar_value


class StubDB:
    def __init__(self, results=None):
        self._results = results or []
        self._idx = 0
        self.added = []
        self.deleted = []
        self._get_return = None

    def set_get_return(self, obj):
        self._get_return = obj

    async def get(self, model, pk):
        return self._get_return

    async def execute(self, *args, **kwargs):
        if self._idx < len(self._results):
            result = self._results[self._idx]
        else:
            result = StubResult([])
        self._idx += 1
        return result

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        # Assign fake ID to added objects
        for i, obj in enumerate(self.added, start=10):
            if not hasattr(obj, 'id') or obj.id is None:
                obj.id = i

    async def delete(self, obj):
        self.deleted.append(obj)

    async def commit(self):
        pass

    async def refresh(self, obj):
        # Ensure refreshed objects have an id (simulates DB auto-increment)
        if hasattr(obj, 'id') and obj.id is None:
            obj.id = len(self.added) + 100


# ── Tests ─────────────────────────────────────────────────────────────────

def test_create_guild_success():
    """Create guild: db gets guild + owner member; returns GuildListItem."""
    from app.routers.guilds import create_guild
    from app.schemas import GuildCreate
    db = StubDB(results=[StubResult([])])  # no existing slug
    me = StubUser(id=1)
    result = asyncio.run(create_guild(body=GuildCreate(name="Dragon Slayers"), user=me, db=db))
    # Two objects added: Guild + GuildMember
    assert len(db.added) == 2
    from app.models import Guild, GuildMember
    assert any(isinstance(o, Guild) for o in db.added)
    assert any(isinstance(o, GuildMember) and o.role == GuildRole.owner for o in db.added)
    assert result.slug == "dragon-slayers"


def test_create_guild_name_too_short_raises_400():
    """Name under 3 chars returns 400."""
    from app.routers.guilds import create_guild
    from app.schemas import GuildCreate
    from fastapi import HTTPException
    db = StubDB()
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(create_guild(body=GuildCreate(name="ab"), user=me, db=db))
    assert exc.value.status_code == 400


def test_create_guild_duplicate_slug_raises_409():
    """Existing slug returns 409."""
    from app.routers.guilds import create_guild
    from app.schemas import GuildCreate
    from fastapi import HTTPException
    existing_guild = StubGuild(slug="dragon-slayers")
    db = StubDB(results=[StubResult([existing_guild])])
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(create_guild(body=GuildCreate(name="Dragon Slayers"), user=me, db=db))
    assert exc.value.status_code == 409


def test_get_guild_detail_not_found_raises_404():
    """Unknown slug returns 404."""
    from app.routers.guilds import get_guild
    from fastapi import HTTPException
    db = StubDB(results=[StubResult([])])
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_guild(slug="nonexistent", db=db, user=me))
    assert exc.value.status_code == 404


def test_join_guild_success():
    """Join guild adds GuildMember with role=member."""
    from app.routers.guilds import join_guild
    guild = StubGuild(id=1)
    db = StubDB(results=[StubResult([])])  # not already a member
    db.set_get_return(guild)
    me = StubUser(id=2)
    asyncio.run(join_guild(guild_id=1, user=me, db=db))
    from app.models import GuildMember
    added_members = [o for o in db.added if isinstance(o, GuildMember)]
    assert len(added_members) == 1
    assert added_members[0].role == GuildRole.member
    assert added_members[0].user_id == 2


def test_join_guild_already_member_raises_409():
    """Already-member join returns 409."""
    from app.routers.guilds import join_guild
    from fastapi import HTTPException
    guild = StubGuild(id=1)
    existing_member = StubGuildMember(guild_id=1, user_id=1)
    db = StubDB(results=[StubResult([existing_member])])
    db.set_get_return(guild)
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(join_guild(guild_id=1, user=me, db=db))
    assert exc.value.status_code == 409


def test_leave_guild_owner_raises_403():
    """Owner cannot leave guild."""
    from app.routers.guilds import leave_guild
    from fastapi import HTTPException
    owner_member = StubGuildMember(guild_id=1, user_id=1, role=GuildRole.owner)
    db = StubDB(results=[StubResult([owner_member])])
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(leave_guild(guild_id=1, user=me, db=db))
    assert exc.value.status_code == 403


def test_leave_guild_member_success():
    """Regular member can leave guild."""
    from app.routers.guilds import leave_guild
    member = StubGuildMember(guild_id=1, user_id=2, role=GuildRole.member)
    db = StubDB(results=[StubResult([member])])
    me = StubUser(id=2)
    asyncio.run(leave_guild(guild_id=1, user=me, db=db))
    assert member in db.deleted


def test_leave_guild_not_member_raises_404():
    """Non-member leave returns 404."""
    from app.routers.guilds import leave_guild
    from fastapi import HTTPException
    db = StubDB(results=[StubResult([])])
    me = StubUser(id=99)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(leave_guild(guild_id=1, user=me, db=db))
    assert exc.value.status_code == 404


def test_create_challenge_as_regular_member_raises_403():
    """Regular member cannot create challenge."""
    from app.routers.guilds import create_guild_challenge
    from app.schemas import GuildChallengeCreate
    from fastapi import HTTPException
    regular_member = StubGuildMember(guild_id=1, user_id=2, role=GuildRole.member)
    db = StubDB(results=[StubResult([regular_member])])
    me = StubUser(id=2)
    body = GuildChallengeCreate(
        name="Sprint",
        target_xp=200,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=7),
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(create_guild_challenge(guild_id=1, body=body, user=me, db=db))
    assert exc.value.status_code == 403


def test_create_challenge_as_owner_success():
    """Owner can create challenge."""
    from app.routers.guilds import create_guild_challenge
    from app.schemas import GuildChallengeCreate
    from app.models import GuildChallenge
    owner_member = StubGuildMember(guild_id=1, user_id=1, role=GuildRole.owner)
    db = StubDB(results=[StubResult([owner_member])])
    me = StubUser(id=1)
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=7)
    body = GuildChallengeCreate(name="Weekly Sprint", target_xp=500, start_date=start, end_date=end)
    asyncio.run(create_guild_challenge(guild_id=1, body=body, user=me, db=db))
    challenges_added = [o for o in db.added if isinstance(o, GuildChallenge)]
    assert len(challenges_added) == 1
    assert challenges_added[0].target_xp == 500


def test_get_challenges_returns_progress():
    """GET challenges returns GuildChallengeWithProgress with current_xp from SUM query."""
    from app.routers.guilds import get_guild_challenges
    member = StubGuildMember(guild_id=1, user_id=1, role=GuildRole.member)
    challenge = StubChallenge(id=1, guild_id=1, target_xp=500)
    # Results: member check, challenges list, progress SUM
    db = StubDB(results=[
        StubResult([member]),         # get_guild_member check
        StubResult([challenge]),      # challenges query
        StubResult([], scalar_value=150),  # SUM xp_reward = 150
    ])
    me = StubUser(id=1)
    result = asyncio.run(get_guild_challenges(guild_id=1, user=me, db=db))
    assert len(result) == 1
    assert result[0].current_xp == 150
    assert result[0].progress_percent == 30  # 150/500 * 100
