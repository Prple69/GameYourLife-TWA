"""Unit tests for Phase 8 friends router — stub pattern (no DB, no TestClient)."""
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.models import Friendship, FriendshipStatus


# ── Stub helpers ─────────────────────────────────────────────────────────

class StubUser:
    def __init__(self, id=1, display_name="Test", lvl=1, selected_avatar=None):
        self.id = id
        self.display_name = display_name
        self.lvl = lvl
        self.selected_avatar = selected_avatar
        self.quests = []


class StubQuest:
    def __init__(self, title="Test Quest", is_completed=True, difficulty="easy", days_ago=1):
        self.title = title
        self.is_completed = is_completed
        self.difficulty = difficulty
        ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
        self.created_at = ts


class StubFriendship:
    def __init__(self, id=1, requester_id=1, addressee_id=2, status=FriendshipStatus.pending):
        self.id = id
        self.requester_id = requester_id
        self.addressee_id = addressee_id
        self.status = status
        self.created_at = datetime.now(timezone.utc)


class StubResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def all(self):
        return self._items

    def first(self):
        return self._items[0] if self._items else None

    def unique(self):
        return self


class StubDB:
    def __init__(self, results=None):
        self._results = results or []
        self._idx = 0
        self.added = []
        self.deleted = []

    async def execute(self, *args, **kwargs):
        if self._idx < len(self._results):
            result = self._results[self._idx]
        else:
            result = StubResult([])
        self._idx += 1
        return result

    def add(self, obj):
        self.added.append(obj)

    async def delete(self, obj):
        self.deleted.append(obj)

    async def commit(self):
        pass

    async def refresh(self, obj):
        pass


# ── Tests ─────────────────────────────────────────────────────────────────

def test_search_users_by_display_name():
    """Search returns users matching display_name ilike pattern."""
    from app.routers.friends import search_users
    alice = StubUser(id=2, display_name="Alexei", lvl=5)
    db = StubDB(results=[StubResult([alice])])
    me = StubUser(id=1)
    result = asyncio.run(search_users(q="alex", db=db, user=me))
    assert len(result) == 1
    assert result[0].display_name == "Alexei"


def test_search_returns_empty_when_no_match():
    """Search with no matching users returns empty list."""
    from app.routers.friends import search_users
    db = StubDB(results=[StubResult([])])
    me = StubUser(id=1)
    result = asyncio.run(search_users(q="zzz", db=db, user=me))
    assert result == []


def test_send_friend_request_success():
    """Successful request creates Friendship with pending status."""
    from app.routers.friends import send_friend_request
    # crud.get_user_by_id is mocked, so only db.execute for existing-friendship check is used
    db = StubDB(results=[StubResult([])])  # no existing friendship
    me = StubUser(id=1)
    with patch("app.routers.friends.crud.get_user_by_id", new_callable=AsyncMock, return_value=StubUser(id=2)):
        result = asyncio.run(send_friend_request(body={"addressee_id": 2}, user=me, db=db))
    assert len(db.added) == 1
    assert db.added[0].requester_id == 1
    assert db.added[0].addressee_id == 2
    assert db.added[0].status == FriendshipStatus.pending


def test_send_friend_request_self_raises_400():
    """Cannot send request to self."""
    from app.routers.friends import send_friend_request
    from fastapi import HTTPException
    db = StubDB()
    me = StubUser(id=1)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(send_friend_request(body={"addressee_id": 1}, user=me, db=db))
    assert exc.value.status_code == 400


def test_send_friend_request_duplicate_raises_409():
    """Existing friendship/request returns 409."""
    from app.routers.friends import send_friend_request
    from fastapi import HTTPException
    existing = StubFriendship(requester_id=1, addressee_id=2)
    db = StubDB(results=[StubResult([existing])])
    me = StubUser(id=1)
    with patch("app.routers.friends.crud.get_user_by_id", new_callable=AsyncMock, return_value=StubUser(id=2)):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(send_friend_request(body={"addressee_id": 2}, user=me, db=db))
    assert exc.value.status_code == 409


def test_accept_friend_request_success():
    """Accept sets friendship status to accepted."""
    from app.routers.friends import accept_friend_request
    fs = StubFriendship(id=1, requester_id=2, addressee_id=1, status=FriendshipStatus.pending)
    db = StubDB(results=[StubResult([fs])])
    me = StubUser(id=1)
    asyncio.run(accept_friend_request(friendship_id=1, user=me, db=db))
    assert fs.status == FriendshipStatus.accepted


def test_accept_wrong_user_raises_404():
    """Non-addressee cannot accept request."""
    from app.routers.friends import accept_friend_request
    from fastapi import HTTPException
    db = StubDB(results=[StubResult([])])  # filter by addressee_id=user.id returns nothing
    me = StubUser(id=3)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(accept_friend_request(friendship_id=1, user=me, db=db))
    assert exc.value.status_code == 404


def test_delete_friendship_success():
    """Delete removes friendship record from DB."""
    from app.routers.friends import delete_friendship
    fs = StubFriendship(id=1, requester_id=1, addressee_id=2, status=FriendshipStatus.accepted)
    db = StubDB(results=[StubResult([fs])])
    me = StubUser(id=1)
    asyncio.run(delete_friendship(friendship_id=1, user=me, db=db))
    assert fs in db.deleted


def test_get_friends_with_activity():
    """Returns friend list and activity feed with quest completion items."""
    from app.routers.friends import get_friends
    fs = StubFriendship(id=1, requester_id=1, addressee_id=2, status=FriendshipStatus.accepted)
    friend = StubUser(id=2, display_name="Bob", lvl=3)
    quest = StubQuest(title="Run 5km", is_completed=True, days_ago=1)
    friend.quests = [quest]
    db = StubDB(results=[StubResult([fs]), StubResult([friend])])
    me = StubUser(id=1)
    result = asyncio.run(get_friends(user=me, db=db))
    assert len(result.friends) == 1
    assert result.friends[0].display_name == "Bob"
    assert len(result.activity) == 1
    assert result.activity[0].event_type == "quest_completed"


def test_get_friends_no_friends_returns_empty():
    """User with no accepted friendships gets empty response."""
    from app.routers.friends import get_friends
    db = StubDB(results=[StubResult([])])
    me = StubUser(id=1)
    result = asyncio.run(get_friends(user=me, db=db))
    assert result.friends == []
    assert result.activity == []
