from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas, database

# Инициализируем базу данных (создаем файл game.db и таблицы)
database.init_db()

app = FastAPI(title="Pixel RPG API")

# Настройка CORS, чтобы React мог достучаться до FastAPI
app.add_middleware(
    CORSMiddleware,
    # Разрешаем запросы с твоего Vercel-адреса
    allow_origins=[
        "https://gameyourlifetwa.vercel.app",
        "http://localhost:5173",  # для тестов локально
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ЭНДПОИНТЫ ДЛЯ ИГРОКА ---

@app.get("/api/user/{tg_id}", response_model=schemas.User)
def read_user(tg_id: str, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_tg_id(db, tg_id=tg_id)
    if db_user is None:
        # Если юзера нет, создаем его автоматически
        return crud.create_user(db=db, telegram_id=tg_id, username=f"Hero_{tg_id[:5]}")
    return db_user

# --- ЭНДПОИНТЫ ДЛЯ КВЕСТОВ ---

@app.get("/api/quests/{user_id}", response_model=list[schemas.Quest])
def read_user_quests(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [q for q in user.quests if not q.is_completed]

@app.post("/api/quests/{user_id}", response_model=schemas.Quest)
def create_quest_for_user(user_id: int, quest: schemas.QuestCreate, db: Session = Depends(database.get_db)):
    return crud.create_quest(db=db, user_id=user_id, quest_data=quest)

@app.post("/api/quests/complete/{quest_id}", response_model=schemas.QuestCompleteResponse)
def complete_quest(quest_id: int, db: Session = Depends(database.get_db)):
    # 1. Находим квест
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id).first()
    if not quest or quest.is_completed:
        raise HTTPException(status_code=404, detail="Quest not found or already completed")
    
    # 2. Помечаем как выполненный
    quest.is_completed = True
    
    # 3. Начисляем награду с учетом коэффициентов юзера
    reward_result = crud.apply_reward(db, user=quest.user, difficulty=quest.difficulty)
    
    return {
        "xp_gain": reward_result["xp_gain"],
        "gold_gain": reward_result["gold_gain"],
        "new_lvl": quest.user.lvl,
        "new_xp": quest.user.xp,
        "new_gold": quest.user.gold,
        "leveled_up": reward_result["leveled_up"]
    }