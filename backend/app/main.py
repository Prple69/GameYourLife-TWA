from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from contextlib import asynccontextmanager
from app import models, crud, database, schemas

# Настройка жизненного цикла приложения (lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Действие при старте: создаем таблицы в Postgres
    await database.init_db()
    yield
    # Действие при завершении (если нужно)

app = FastAPI(lifespan=lifespan)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173" # Добавил для локальных тестов
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ---

@app.get("/api/user/{tg_id}", response_model=schemas.UserSchema)
async def get_profile(tg_id: str, username: str = "Hero", db: AsyncSession = Depends(database.get_db)):
    user = await crud.get_user_by_tg_id(db, tg_id)
    if not user:
        user = await crud.create_user(db, tg_id, username)
    return user

@app.post("/api/user/update-avatar", response_model=schemas.UserSchema)
async def update_avatar(tg_id: str, avatar_id: str, db: AsyncSession = Depends(database.get_db)):
    user = await crud.update_user_avatar(db, tg_id, avatar_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- КОНТРАКТЫ (КВЕСТЫ) ---

@app.get("/api/quests/{tg_id}", response_model=List[schemas.QuestSchema])
async def get_quests(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    """Получить все активные контракты (асинхронно)"""
    quests = await crud.get_active_quests(db, tg_id)
    return quests

@app.post("/api/quests/save/{tg_id}", response_model=schemas.QuestSchema)
async def save_quest(tg_id: str, quest_data: schemas.QuestSave, db: AsyncSession = Depends(database.get_db)):
    """Сохранить контракт в базу"""
    quest = await crud.create_quest(db, tg_id, quest_data)
    if not quest:
        raise HTTPException(status_code=404, detail="User not found")
    return quest

@app.post("/api/quests/complete/{quest_id}")
async def complete_quest(quest_id: int, tg_id: str, db: AsyncSession = Depends(database.get_db)):
    """Завершить квест асинхронно"""
    quest, leveled_up = await crud.complete_quest(db, quest_id, tg_id)
    
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found or already closed")
    
    # Обновляем данные пользователя для фронтенда
    user = await crud.get_user_by_tg_id(db, tg_id)
    
    return {
        "status": "success",
        "leveled_up": leveled_up,
        "user": user,
        "reward": {
            "xp": quest.xp_reward,
            "gold": quest.gold_reward
        }
    }

@app.get("/api/quests/history/{tg_id}", response_model=List[schemas.QuestSchema])
async def get_history(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    """История заданий асинхронно"""
    return await crud.get_quest_history(db, tg_id)

@app.get("/api/user/{tg_id}/status")
async def check_status(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    """Принудительная проверка статуса"""
    await crud.check_and_fail_quests(db, tg_id)
    user = await crud.get_user_by_tg_id(db, tg_id)
    return user