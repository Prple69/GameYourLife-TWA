"""Leaderboard endpoints — Phase 7."""
import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app import cache, models, schemas, leaderboard
from app.database import get_db
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["leaderboard"])


@router.get("/api/leaderboard", response_model=schemas.LeaderboardResponse)
async def get_leaderboard_top(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Return top-N leaderboard entries (offset-based pagination, max limit=100)."""
    entries, total = await leaderboard.get_top(redis_client, db, offset=offset, limit=limit)
    return schemas.LeaderboardResponse(
        entries=[schemas.LeaderboardEntryResponse(**e) for e in entries],
        total=total,
    )


@router.get("/api/leaderboard/me", response_model=schemas.LeaderboardMeResponse)
async def get_leaderboard_me(
    current_user: models.User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Return current user's rank, total_users, and +-5 neighbors."""
    result = await leaderboard.get_me(redis_client, db, current_user)
    neighbors = [schemas.LeaderboardEntryResponse(**n) for n in result["neighbors"]]
    return schemas.LeaderboardMeResponse(
        rank=result["rank"],
        total_users=result["total_users"],
        neighbors=neighbors,
    )
