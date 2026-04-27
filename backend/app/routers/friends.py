"""Phase 8: Social — Friends router.

Endpoints:
  GET  /api/users/search          — search users by display_name
  POST /api/friends/request       — send friend request
  GET  /api/friends/pending       — list incoming + outgoing pending requests
  POST /api/friends/accept/{id}   — accept pending request (addressee only)
  DELETE /api/friends/{id}        — remove friendship (either party)
  GET  /api/friends               — friend list + activity feed
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
from typing import List

from app import models, schemas, crud
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["friends"])


# ── User Search ───────────────────────────────────────────────────────────

@router.get("/api/users/search", response_model=List[schemas.UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=2, max_length=64),
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    result = await db.execute(
        select(models.User)
        .filter(
            models.User.display_name.ilike(f"%{q}%"),
            models.User.id != user.id,
        )
        .order_by(models.User.display_name)
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()
    return [
        schemas.UserSearchResult(
            id=u.id,
            display_name=u.display_name or f"Игрок #{u.id}",
            avatar=u.selected_avatar,
            lvl=u.lvl,
        )
        for u in users
    ]


# ── Friend Requests ───────────────────────────────────────────────────────

@router.post("/api/friends/request", response_model=schemas.FriendRequestOut, status_code=201)
async def send_friend_request(
    body: dict,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    addressee_id = body.get("addressee_id")
    if not addressee_id:
        raise HTTPException(status_code=422, detail="addressee_id required")
    if addressee_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot befriend self")

    addressee = await crud.get_user_by_id(db, addressee_id)
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found")

    # App-level check (UNIQUE constraint is the real guard for races)
    existing = await db.execute(
        select(models.Friendship).filter(
            or_(
                and_(models.Friendship.requester_id == user.id, models.Friendship.addressee_id == addressee_id),
                and_(models.Friendship.requester_id == addressee_id, models.Friendship.addressee_id == user.id),
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Request already pending or friendship exists")

    try:
        friendship = models.Friendship(
            requester_id=user.id,
            addressee_id=addressee_id,
            status=models.FriendshipStatus.pending,
        )
        db.add(friendship)
        await db.commit()
        await db.refresh(friendship)
        return friendship
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Friendship conflict (race condition)")


@router.get("/api/friends/pending", response_model=List[schemas.PendingRequestItem])
async def get_pending_requests(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return incoming and outgoing pending requests."""
    result = await db.execute(
        select(models.Friendship, models.User).join(
            models.User,
            or_(
                and_(models.Friendship.requester_id == user.id, models.User.id == models.Friendship.addressee_id),
                and_(models.Friendship.addressee_id == user.id, models.User.id == models.Friendship.requester_id),
            )
        ).filter(models.Friendship.status == models.FriendshipStatus.pending)
    )
    rows = result.all()
    items = []
    for friendship, other_user in rows:
        direction = "outgoing" if friendship.requester_id == user.id else "incoming"
        items.append(
            schemas.PendingRequestItem(
                id=friendship.id,
                other_user_id=other_user.id,
                other_display_name=other_user.display_name or f"Игрок #{other_user.id}",
                other_avatar=other_user.selected_avatar,
                direction=direction,
                created_at=friendship.created_at,
            )
        )
    return items


@router.post("/api/friends/accept/{friendship_id}", response_model=schemas.FriendRequestOut)
async def accept_friend_request(
    friendship_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Friendship).filter(
            models.Friendship.id == friendship_id,
            models.Friendship.addressee_id == user.id,
            models.Friendship.status == models.FriendshipStatus.pending,
        )
    )
    friendship = result.scalars().first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found or already accepted")

    friendship.status = models.FriendshipStatus.accepted
    await db.commit()
    await db.refresh(friendship)
    return friendship


@router.delete("/api/friends/{friendship_id}", status_code=204)
async def delete_friendship(
    friendship_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Friendship).filter(
            models.Friendship.id == friendship_id,
            or_(
                models.Friendship.requester_id == user.id,
                models.Friendship.addressee_id == user.id,
            )
        )
    )
    friendship = result.scalars().first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    await db.delete(friendship)
    await db.commit()


# ── Friends List + Activity Feed ──────────────────────────────────────────

@router.get("/api/friends", response_model=schemas.FriendsResponse)
async def get_friends(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    # Query 1: all accepted friendships
    result = await db.execute(
        select(models.Friendship).filter(
            models.Friendship.status == models.FriendshipStatus.accepted,
            or_(
                models.Friendship.requester_id == user.id,
                models.Friendship.addressee_id == user.id,
            ),
        )
    )
    friendships = result.scalars().all()
    friend_ids = {
        (f.addressee_id if f.requester_id == user.id else f.requester_id)
        for f in friendships
    }

    if not friend_ids:
        return schemas.FriendsResponse(friends=[], activity=[])

    # Query 2: fetch friend users with eager-loaded quests (prevents N+1)
    result = await db.execute(
        select(models.User)
        .filter(models.User.id.in_(friend_ids))
        .options(selectinload(models.User.quests))
    )
    friends = result.scalars().unique().all()

    # Build activity feed (quest completions only, last 7 days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    activity = []
    for friend in friends:
        completed = [
            q for q in friend.quests
            if q.is_completed and q.created_at is not None
        ]
        completed.sort(key=lambda q: q.created_at, reverse=True)
        for quest in completed:
            ts = quest.created_at
            # Normalize naive datetimes from DB
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if ts > cutoff:
                activity.append(
                    schemas.ActivityFeedItem(
                        user_id=friend.id,
                        display_name=friend.display_name or f"Игрок #{friend.id}",
                        avatar=friend.selected_avatar,
                        event_type="quest_completed",
                        event_data={"quest_title": quest.title, "difficulty": quest.difficulty or ""},
                        timestamp=ts,
                    )
                )
                break  # One activity item per friend for feed brevity

    activity.sort(key=lambda x: x.timestamp, reverse=True)

    friend_list = [
        schemas.FriendListItem(
            id=f.id,
            display_name=f.display_name or f"Игрок #{f.id}",
            avatar=f.selected_avatar,
            lvl=f.lvl,
        )
        for f in friends
    ]

    return schemas.FriendsResponse(
        friends=friend_list[:limit],
        activity=activity[:limit],
    )
