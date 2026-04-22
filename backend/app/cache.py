"""
Redis connection pool for Phase 6+.

Usage:
  - FastAPI lifespan: await cache.init_redis() / await cache.close_redis()
  - Endpoints: redis: Redis = Depends(cache.get_redis)
"""
import logging
import redis.asyncio as aioredis
from app.config import get_settings

logger = logging.getLogger(__name__)

_redis_client: aioredis.Redis | None = None


async def init_redis() -> None:
    """Initialize shared connection pool. Call once at FastAPI startup."""
    global _redis_client
    settings = get_settings()
    _redis_client = aioredis.Redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    try:
        await _redis_client.ping()
        logger.info("Redis connected: %s", settings.REDIS_URL)
    except Exception as e:
        # Graceful degradation: log warning but don't crash startup.
        # Endpoints will raise RuntimeError if they try to use Redis.
        logger.warning("Redis ping failed (daily suggestions unavailable): %s", e)


async def close_redis() -> None:
    """Close connection pool. Call once at FastAPI shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis connection closed")


async def get_redis() -> aioredis.Redis:
    """
    FastAPI dependency: `redis: aioredis.Redis = Depends(cache.get_redis)`.
    Raises RuntimeError if Redis was unavailable at startup.
    """
    if _redis_client is None:
        raise RuntimeError("Redis not initialized — check REDIS_URL and Redis service")
    return _redis_client
