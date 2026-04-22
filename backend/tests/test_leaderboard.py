"""
Unit tests for leaderboard.py domain logic — Phase 7.
Strategy: stub objects (StubUser, StubRedis, StubDB) — no DB, no real Redis.
Tests validate LEAD-01 (scoring formula) and LEAD-02 (rank/neighbor calculation).
Uses asyncio.run() pattern (no pytest-asyncio dependency) — matches Phase 6 convention.
"""
import asyncio
import pytest
from tests.conftest import StubRedis


# ── Stubs ─────────────────────────────────────────────────────────────────────

class StubUser:
    def __init__(self, id, lvl, xp, display_name=None, username=None, selected_avatar=None):
        self.id = id
        self.lvl = lvl
        self.xp = xp
        self.display_name = display_name
        self.username = username
        self.selected_avatar = selected_avatar


class StubDB:
    """Minimal async session stub that returns users by id."""
    def __init__(self, users: list):
        self._users = {str(u.id): u for u in users}

    async def execute(self, stmt):
        return _StubResult(list(self._users.values()))


class _StubResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def all(self):
        return self._items


# ── Module import ─────────────────────────────────────────────────────────────

import app.leaderboard as leaderboard_mod
from app import crud as crud_mod

LEADERBOARD_KEY = "leaderboard:global"


def make_crud_stub(users: list):
    """Return a coroutine function simulating crud.get_user_by_id from a list of StubUsers."""
    lookup = {u.id: u for u in users}

    async def _get_user_by_id(db, user_id: int):
        return lookup.get(user_id)

    return _get_user_by_id


# ── Score encoding tests ──────────────────────────────────────────────────────

def test_score_encoding():
    """score_for: id=1 scores higher than id=2 when lvl and xp equal; lvl=2,xp=0 > lvl=1,xp=999999."""
    u1 = StubUser(id=1, lvl=5, xp=100)
    u2 = StubUser(id=2, lvl=5, xp=100)
    # id ASC tie-break: smaller id -> higher score (- id in formula)
    assert leaderboard_mod.score_for(u1) > leaderboard_mod.score_for(u2)

    # lvl is primary sort: lvl=2,xp=0 must beat lvl=1,xp=999999
    high_lvl = StubUser(id=99, lvl=2, xp=0)
    low_lvl_high_xp = StubUser(id=99, lvl=1, xp=999999)
    assert leaderboard_mod.score_for(high_lvl) > leaderboard_mod.score_for(low_lvl_high_xp)


# ── update tests ─────────────────────────────────────────────────────────────

def test_update_writes_to_redis():
    """update() calls zadd with correct member and score."""
    async def _run():
        redis = StubRedis()
        user = StubUser(id=7, lvl=3, xp=500)
        expected_score = leaderboard_mod.score_for(user)
        await leaderboard_mod.update(redis, user)
        # Verify member stored in redis zset
        assert LEADERBOARD_KEY in redis._zsets
        assert "7" in redis._zsets[LEADERBOARD_KEY]
        assert redis._zsets[LEADERBOARD_KEY]["7"] == expected_score

    asyncio.run(_run())


def test_update_graceful_on_redis_error():
    """update() logs warning but does NOT raise when redis.zadd raises RuntimeError."""
    class FailingRedis:
        async def zadd(self, key, mapping):
            raise RuntimeError("connection refused")

    async def _run():
        user = StubUser(id=3, lvl=1, xp=0)
        # Must not raise
        await leaderboard_mod.update(FailingRedis(), user)

    asyncio.run(_run())


# ── get_top tests ─────────────────────────────────────────────────────────────

def test_get_top_basic():
    """get_top returns entries in rank order starting at rank=1."""
    async def _run():
        users = [
            StubUser(id=1, lvl=5, xp=200),
            StubUser(id=2, lvl=3, xp=100),
            StubUser(id=3, lvl=1, xp=50),
        ]
        redis = StubRedis()
        for u in users:
            await redis.zadd(LEADERBOARD_KEY, {str(u.id): leaderboard_mod.score_for(u)})

        db = StubDB(users)
        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub(users)
        try:
            entries, total = await leaderboard_mod.get_top(redis, db, offset=0, limit=10)
        finally:
            crud_mod.get_user_by_id = original_fn

        assert total == 3
        assert len(entries) == 3
        # rank starts at 1
        assert entries[0]["rank"] == 1
        assert entries[1]["rank"] == 2
        assert entries[2]["rank"] == 3
        # user with lvl=5 should be first
        assert entries[0]["user_id"] == 1

    asyncio.run(_run())


def test_get_top_display_name_fallback():
    """display_name fallback chain: display_name -> username -> 'Игрок #N'."""
    async def _run():
        u_display = StubUser(id=1, lvl=3, xp=0, display_name="Hero")
        u_username = StubUser(id=2, lvl=2, xp=0, display_name=None, username="player2")
        u_none = StubUser(id=3, lvl=1, xp=0, display_name=None, username=None)
        users = [u_display, u_username, u_none]

        redis = StubRedis()
        for u in users:
            await redis.zadd(LEADERBOARD_KEY, {str(u.id): leaderboard_mod.score_for(u)})

        db = StubDB(users)
        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub(users)
        try:
            entries, _ = await leaderboard_mod.get_top(redis, db, offset=0, limit=10)
        finally:
            crud_mod.get_user_by_id = original_fn

        # Find by user_id
        by_uid = {e["user_id"]: e for e in entries}
        assert by_uid[1]["display_name"] == "Hero"
        assert by_uid[2]["display_name"] == "player2"
        assert by_uid[3]["display_name"] == "Игрок #3"

    asyncio.run(_run())


def test_get_top_limit_clamp():
    """limit=200 is clamped to 100."""
    async def _run():
        # Seed 5 users
        redis = StubRedis()
        users = [StubUser(id=i, lvl=i, xp=0) for i in range(1, 6)]
        for u in users:
            await redis.zadd(LEADERBOARD_KEY, {str(u.id): leaderboard_mod.score_for(u)})

        db = StubDB(users)
        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub(users)
        try:
            entries, total = await leaderboard_mod.get_top(redis, db, offset=0, limit=200)
        finally:
            crud_mod.get_user_by_id = original_fn

        # Clamped to 100; only 5 users exist so we get 5
        assert len(entries) == 5
        assert total == 5

    asyncio.run(_run())


# ── get_me tests ─────────────────────────────────────────────────────────────

def test_get_me_rank():
    """User at top position (idx=0) gets rank=1."""
    async def _run():
        user = StubUser(id=42, lvl=10, xp=999)
        other = StubUser(id=99, lvl=1, xp=0)
        redis = StubRedis()
        await redis.zadd(LEADERBOARD_KEY, {str(user.id): leaderboard_mod.score_for(user)})
        await redis.zadd(LEADERBOARD_KEY, {str(other.id): leaderboard_mod.score_for(other)})

        db = StubDB([user, other])
        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub([user, other])
        try:
            result = await leaderboard_mod.get_me(redis, db, user)
        finally:
            crud_mod.get_user_by_id = original_fn

        assert result["rank"] == 1
        assert result["total_users"] == 2

    asyncio.run(_run())


def test_get_me_not_in_redis():
    """User not in redis -> rank=None, total_users=0, neighbors=[]."""
    async def _run():
        user = StubUser(id=77, lvl=5, xp=100)
        redis = StubRedis()  # empty redis
        db = StubDB([user])

        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub([user])
        try:
            result = await leaderboard_mod.get_me(redis, db, user)
        finally:
            crud_mod.get_user_by_id = original_fn

        assert result["rank"] is None
        assert result["total_users"] == 0
        assert result["neighbors"] == []

    asyncio.run(_run())


def test_get_me_neighbors_edge():
    """User at rank=1 (idx=0): neighbors start_idx=0, no negative index."""
    async def _run():
        # Only 3 users; target user is at top
        users = [
            StubUser(id=1, lvl=10, xp=0),
            StubUser(id=2, lvl=5, xp=0),
            StubUser(id=3, lvl=1, xp=0),
        ]
        redis = StubRedis()
        for u in users:
            await redis.zadd(LEADERBOARD_KEY, {str(u.id): leaderboard_mod.score_for(u)})

        db = StubDB(users)
        original_fn = crud_mod.get_user_by_id
        crud_mod.get_user_by_id = make_crud_stub(users)
        try:
            result = await leaderboard_mod.get_me(redis, db, users[0])
        finally:
            crud_mod.get_user_by_id = original_fn

        assert result["rank"] == 1
        # neighbors should be all 3 (idx 0 to min(2, 5) = 2)
        assert len(result["neighbors"]) == 3
        # All neighbor ranks are positive (no zero or negative)
        for n in result["neighbors"]:
            assert n["rank"] >= 1

    asyncio.run(_run())


# ── seed_if_empty tests ───────────────────────────────────────────────────────

def test_seed_if_empty_skips_when_seeded():
    """Redis already has entries -> zadd never called again."""
    async def _run():
        redis = StubRedis()
        # Pre-populate redis with 3 users
        await redis.zadd(LEADERBOARD_KEY, {"1": 3e12, "2": 2e12, "3": 1e12})
        zadd_call_count = [0]
        original_zadd = redis.zadd

        async def counting_zadd(key, mapping):
            zadd_call_count[0] += 1
            return await original_zadd(key, mapping)

        redis.zadd = counting_zadd
        db = StubDB([])
        await leaderboard_mod.seed_if_empty(redis, db)
        # zadd should NOT be called again (already seeded)
        assert zadd_call_count[0] == 0

    asyncio.run(_run())


def test_seed_if_empty_builds_when_empty():
    """Empty redis -> after seed all users appear in sorted set."""
    async def _run():
        users = [
            StubUser(id=1, lvl=5, xp=100),
            StubUser(id=2, lvl=3, xp=200),
            StubUser(id=3, lvl=1, xp=0),
        ]
        redis = StubRedis()
        db = StubDB(users)
        await leaderboard_mod.seed_if_empty(redis, db)

        # All 3 users should now be in redis
        assert await redis.zcard(LEADERBOARD_KEY) == 3
        for u in users:
            assert str(u.id) in redis._zsets[LEADERBOARD_KEY]

    asyncio.run(_run())


def test_seed_if_empty_graceful_on_redis_error():
    """redis.exists raises -> no crash from seed_if_empty."""
    class FailingExistsRedis:
        async def exists(self, key):
            raise RuntimeError("redis down")

    async def _run():
        db = StubDB([])
        # Must not raise
        await leaderboard_mod.seed_if_empty(FailingExistsRedis(), db)

    asyncio.run(_run())
