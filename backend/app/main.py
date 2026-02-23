from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from contextlib import asynccontextmanager
from app import models, crud, database, schemas
import logging

# Настройка логирования для отладки
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ---

@app.get("/api/user/{tg_id}", response_model=schemas.UserSchema)
async def get_profile(tg_id: str, username: str = "Hero", db: AsyncSession = Depends(database.get_db)):
    try:
        user = await crud.get_user_by_tg_id(db, tg_id)
        if not user:
            # Создаем нового, если нет
            user = await crud.create_user(db, tg_id, username)
        return user
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# --- КОНТРАКТЫ (КВЕСТЫ) ---

@app.get("/api/quests/{tg_id}", response_model=List[schemas.QuestSchema])
async def get_quests(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    """Гарантированно возвращает список, чтобы .map() на фронте не падал"""
    try:
        quests = await crud.get_active_quests(db, tg_id)
        # Если crud вернул None или что-то еще, возвращаем []
        if quests is None:
            return []
        return quests
    except Exception as e:
        logger.error(f"Error fetching quests for {tg_id}: {e}")
        # Вместо падения возвращаем пустой список, чтобы фронт выжил
        return []

@app.post("/api/quests/save/{tg_id}", response_model=schemas.QuestSchema)
async def save_quest(tg_id: str, quest_data: schemas.QuestSave, db: AsyncSession = Depends(database.get_db)):
    try:
        quest = await crud.create_quest(db, tg_id, quest_data)
        if not quest:
            raise HTTPException(status_code=404, detail="User not found")
        return quest
    except Exception as e:
        logger.error(f"Error saving quest: {e}")
        raise HTTPException(status_code=400, detail="Could not save quest")

@app.post("/api/quests/complete/{quest_id}")
async def complete_quest(quest_id: int, tg_id: str, db: AsyncSession = Depends(database.get_db)):
    try:
        quest, leveled_up = await crud.complete_quest(db, quest_id, tg_id)
        
        if not quest:
            raise HTTPException(status_code=404, detail="Quest not found")
        
        user = await crud.get_user_by_tg_id(db, tg_id)
        
        return {
            "status": "success",
            "leveled_up": leveled_up,
            "user": user,
            "reward": {
                "xp": quest.xp_reward if quest else 0,
                "gold": quest.gold_reward if quest else 0
            }
        }
    except Exception as e:
        logger.error(f"Error completing quest: {e}")
        raise HTTPException(status_code=500, detail="Error during completion")

@app.get("/api/quests/history/{tg_id}", response_model=List[schemas.QuestSchema])
async def get_history(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    try:
        history = await crud.get_quest_history(db, tg_id)
        return history if history is not None else []
    except Exception as e:
        logger.error(f"Error history: {e}")
        return []

@app.get("/api/user/{tg_id}/status")
async def check_status(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    try:
        await crud.check_and_fail_quests(db, tg_id)
        user = await crud.get_user_by_tg_id(db, tg_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Status check error")