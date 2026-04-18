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

from app import database
from app.routers import auth, quests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield


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


@app.get("/api/health")
async def health():
    return {"status": "ok", "phase": "03"}
