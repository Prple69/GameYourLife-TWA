import re
import json
import logging
from typing import List
from openai import AsyncOpenAI
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from app import models, crud, database, schemas
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Body

# Настройка логирования для отладки
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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", 
)

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
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ИИ ОЦЕНКА КВЕСТОВ ---

@app.post("/api/analyze")
async def analyze_task(payload: dict = Body(...)):
    """
    Анализ квеста через Gemini AI. 
    Принимает те же данные, что и твоя Vercel-функция.
    """
    try:
        title = payload.get("title", "Без названия")
        deadline = payload.get("deadline", "Не указан")
        current_day = payload.get("today", "сегодня")
        lvl = payload.get("lvl", 1)
        current_hp = payload.get("current_hp", 100)
        max_hp = payload.get("max_hp", 100)

        # Твой промпт, перенесенный из JS
        prompt = f""" Ты RPG мастер. Оцени контракт: "{title}".
        Сегодня: {current_day}. Дедлайн: {deadline}.
        
        СТАТУС ИГРОКА:
        - Уровень: {lvl}
        - Текущее HP: {current_hp} / {max_hp}

        КРИТЕРИИ СЛОЖНОСТИ И НАГРАД:
        - easy: Рутина. Награда: gold 5-15, xp 10-30. Штраф при провале: 5-8 HP.
        - medium: Усилия. Награда: gold 20-45, xp 40-80. Штраф при провале: 10-15 HP.
        - hard: Тяжелая работа. Награда: gold 50-120, xp 100-250. Штраф при провале: 20-30 HP.
        - epic: Жизненное достижение. Награда: gold 150-300, xp 300-500. Штраф при провале: 40-60 HP.

        ПРАВИЛА МАСТЕРА:
        1. Если дедлайн критический (сегодня), сложность и награда растут.
        2. Оцени "hp_penalty" (штраф за провал) исходя из сложности. 
        3. Если у игрока критически мало HP ({current_hp}), сделай штраф чуть мягче, но не ниже минимального для категории.

        Верни ТОЛЬКО чистый JSON (без разметки markdown): 
        {{
            "difficulty": "easy"|"medium"|"hard"|"epic", 
            "xp": number, 
            "gold": number, 
            "hp_penalty": number
        }} """

        completion = await client.chat.completions.create(
            model="liquid/lfm-2.5-1.2b-thinking:free", # Та самая модель из примера
            messages=[
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
        )

        # 3. Обрабатываем ответ
        content = completion.choices[0].message.content

        # Чистка от ```json ... ``` если ИИ их добавил
        clean_json = re.sub(r"```json|```", "", content).strip()
        
        # Парсим строку в словарь и возвращаем
        result = json.loads(clean_json)
        return result

    except Exception as e:
        logger.error(f"AI Analysis Error: {e}")
        # Фаллбек, если ИИ упал или выдал невалидный JSON
        return {
            "difficulty": "medium",
            "xp": 40,
            "gold": 20,
            "hp_penalty": 12,
            "fallback": True
        }

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

@app.post("/api/user/update-avatar", response_model=schemas.UserSchema)
async def update_avatar(tg_id: str, avatar_id: str, db: AsyncSession = Depends(database.get_db)):
    print(f"Update request: tg_id={tg_id}, avatar={avatar_id}") # Лог для проверки
    user = await crud.update_user_avatar(db, tg_id, avatar_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- КОНТРАКТЫ (КВЕСТЫ) ---

@app.post("/api/quests/save/{tg_id}", response_model=schemas.QuestSchema)
async def save_quest(tg_id: str, quest_data: schemas.QuestSave, db: AsyncSession = Depends(database.get_db)):
    """Сохранение квеста. Обязательно метод POST"""
    try:
        # Логируем, чтобы видеть запрос в терминале
        print(f"DEBUG: Saving quest for {tg_id}. Data: {quest_data.title}")
        
        quest = await crud.create_quest(db, tg_id, quest_data)
        if not quest:
            raise HTTPException(status_code=404, detail="User not found")
        return quest
    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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