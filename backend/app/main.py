from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app import models, crud, database, schemas

database.init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ---

@app.get("/api/user/{tg_id}", response_model=schemas.UserSchema)
def get_profile(tg_id: str, username: str = "Hero", db: Session = Depends(database.get_db)):
    user = crud.get_user_by_tg_id(db, tg_id)
    if not user:
        user = crud.create_user(db, tg_id, username)
    return user

@app.post("/api/user/update-avatar", response_model=schemas.UserSchema)
def update_avatar(tg_id: str, avatar_id: str, db: Session = Depends(database.get_db)):
    user = crud.update_user_avatar(db, tg_id, avatar_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- КОНТРАКТЫ (КВЕСТЫ) ---

@app.get("/api/quests/{tg_id}", response_model=List[schemas.QuestSchema])
def get_quests(tg_id: str, db: Session = Depends(database.get_db)):
    """Получить все активные контракты (автоматически помечает просроченные)"""
    quests = crud.get_active_quests(db, tg_id)
    return quests

@app.post("/api/quests/save/{tg_id}", response_model=schemas.QuestSchema)
def save_quest(tg_id: str, quest_data: schemas.QuestSave, db: Session = Depends(database.get_db)):
    """Сохранить контракт в базу после 'рулетки' на фронте"""
    quest = crud.create_quest(db, tg_id, quest_data)
    if not quest:
        raise HTTPException(status_code=404, detail="User not found")
    return quest

@app.post("/api/quests/complete/{quest_id}")
def complete_quest(quest_id: int, tg_id: str, db: Session = Depends(database.get_db)):
    """Завершить квест, выдать награду и проверить Level Up"""
    quest, leveled_up = crud.complete_quest(db, quest_id, tg_id)
    
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found or already closed")
    
    # Возвращаем обновленного юзера, чтобы фронт обновил стейт прогресс-бара
    user = crud.get_user_by_tg_id(db, tg_id)
    
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
def get_history(tg_id: str, db: Session = Depends(database.get_db)):
    """История выполненных заданий"""
    return crud.get_quest_history(db, tg_id)

# ЭНДПОИНТ: Проверка здоровья (если нужно для фронта)
@app.get("/api/user/{tg_id}/status")
def check_status(tg_id: str, db: Session = Depends(database.get_db)):
    """Принудительная проверка просрочки и возврат текущего HP/XP"""
    crud.check_and_fail_quests(db, tg_id)
    user = crud.get_user_by_tg_id(db, tg_id)
    return user