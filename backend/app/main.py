"""
FastAPI application entry point (Phase 3 refactored).

- Auth endpoints: /api/auth/* via app.routers.auth
- Quest / user / AI endpoints: /api/* via app.routers.quests
- Health: /api/health

Auth is JWT Bearer across the board. The legacy verify_telegram_init_data
dependency has been removed.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import database, cache, leaderboard
from app.routers import auth, quests, shop, inventory, daily, leaderboard as leaderboard_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    await cache.init_redis()
    # Phase 7: lazy-rebuild leaderboard ZSET from DB if Redis lost it
    try:
        async with database.AsyncSessionLocal() as db:
            await leaderboard.seed_if_empty(cache._redis_client, db)
    except Exception as e:
        logger.warning(f"Leaderboard seed_if_empty failed at startup: {e}")
    yield
    await cache.close_redis()


app = FastAPI(lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(quests.router)
app.include_router(shop.router)
app.include_router(inventory.router)
app.include_router(daily.router)
app.include_router(leaderboard_router.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "phase": "03"}
