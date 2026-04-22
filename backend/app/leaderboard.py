"""
Leaderboard domain logic.
Redis sorted set: key='leaderboard:global', member=str(user.id), score=lvl*1e12+xp*1e6-id.
Score encodes: lvl DESC (primary), xp DESC (secondary), id ASC (tie-break).
Float64 precision safe: lvl<1000, xp<1M, id<1M -> 15 sig figs <= float64 mantissa.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import models, crud

logger = logging.getLogger(__name__)

LEADERBOARD_KEY = "leaderboard:global"
SEED_BATCH_SIZE = 500


def score_for(user: models.User) -> float:
    """Composite score: higher = better rank. lvl*1e12 + xp*1e6 - id."""
    return float(user.lvl * 1e12 + user.xp * 1e6 - user.id)


async def update(redis_client, user: models.User) -> None:
    """Update user's position in leaderboard after XP/level change. Graceful: logs, never raises."""
    try:
        score = score_for(user)
        await redis_client.zadd(LEADERBOARD_KEY, {str(user.id): score})
        logger.debug(f"Leaderboard updated: user={user.id}, score={score:.2e}")
    except Exception as e:
        logger.warning(f"Leaderboard ZADD failed for user {user.id}: {e}")


async def get_top(redis_client, db: AsyncSession, offset: int = 0, limit: int = 50):
    """Return (entries, total). entries are dicts matching LeaderboardEntryResponse shape."""
    limit = max(1, min(100, limit))
    member_ids = await redis_client.zrevrange(LEADERBOARD_KEY, offset, offset + limit - 1)
    entries = []
    for rank_num, member_id in enumerate(member_ids, start=offset + 1):
        user = await crud.get_user_by_id(db, int(member_id))
        if user:
            entries.append({
                "rank": rank_num,
                "user_id": user.id,
                "display_name": user.display_name or user.username or f"Игрок #{user.id}",
                "avatar": user.selected_avatar,
                "lvl": user.lvl,
                "xp": user.xp,
            })
        else:
            logger.warning(f"User {member_id} in leaderboard but not in DB — skipping")
    total = await redis_client.zcard(LEADERBOARD_KEY)
    return entries, total


async def get_me(redis_client, db: AsyncSession, user: models.User):
    """Return user's rank, total_users, and neighbors (+-5). Graceful if user not in set."""
    rank_idx = await redis_client.zrevrank(LEADERBOARD_KEY, str(user.id))
    if rank_idx is None:
        return {"rank": None, "total_users": 0, "neighbors": []}

    rank = rank_idx + 1
    total = await redis_client.zcard(LEADERBOARD_KEY)

    start_idx = max(0, rank_idx - 5)
    end_idx = min(total - 1, rank_idx + 5)
    neighbor_ids = await redis_client.zrevrange(LEADERBOARD_KEY, start_idx, end_idx)

    neighbors = []
    for neighbor_id in neighbor_ids:
        neighbor_user = await crud.get_user_by_id(db, int(neighbor_id))
        if neighbor_user:
            n_rank_idx = await redis_client.zrevrank(LEADERBOARD_KEY, str(neighbor_user.id))
            neighbors.append({
                "rank": (n_rank_idx + 1) if n_rank_idx is not None else None,
                "user_id": neighbor_user.id,
                "display_name": neighbor_user.display_name or neighbor_user.username or f"Игрок #{neighbor_user.id}",
                "avatar": neighbor_user.selected_avatar,
                "lvl": neighbor_user.lvl,
                "xp": neighbor_user.xp,
            })

    return {"rank": rank, "total_users": total, "neighbors": neighbors}


async def seed_if_empty(redis_client, db: AsyncSession) -> None:
    """Lazy rebuild: populate leaderboard:global from DB if empty. Graceful: logs, never raises."""
    try:
        exists = await redis_client.exists(LEADERBOARD_KEY)
        if exists:
            card = await redis_client.zcard(LEADERBOARD_KEY)
            if card > 0:
                logger.info(f"Leaderboard already seeded: {card} users")
                return
    except Exception as e:
        logger.warning(f"Redis check failed in seed_if_empty: {e}")
        return

    logger.info("Rebuilding leaderboard from PostgreSQL...")
    try:
        result = await db.execute(select(models.User))
        users = result.scalars().all()
    except Exception as e:
        logger.error(f"DB query failed in seed_if_empty: {e}")
        return

    if not users:
        logger.info("No users in DB, skipping leaderboard seed")
        return

    for i in range(0, len(users), SEED_BATCH_SIZE):
        batch = users[i:i + SEED_BATCH_SIZE]
        mapping = {str(u.id): score_for(u) for u in batch}
        try:
            await redis_client.zadd(LEADERBOARD_KEY, mapping)
            logger.debug(f"Seeded batch {i // SEED_BATCH_SIZE + 1}: {len(batch)} users")
        except Exception as e:
            logger.error(f"Batch ZADD failed at offset {i}: {e}")
            continue

    logger.info(f"Leaderboard seed complete: {len(users)} users")
