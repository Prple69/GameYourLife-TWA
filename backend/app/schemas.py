from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Схемы Пользователя ---

class UserSchema(BaseModel):
    id: int
    telegram_id: str
    username: Optional[str] = None
    selected_avatar: str
    char_class: str
    lvl: int
    xp: int
    max_xp: int
    gold: int
    hp: int
    max_hp: int
    xp_multiplier: float
    gold_multiplier: float

    class Config:
        from_attributes = True


# --- Схемы Квестов ---

class QuestBase(BaseModel):
    title: str
    deadline: str  # Храним как строку YYYY-MM-DD для синхрона с фронтом

class QuestCreate(QuestBase):
    """Данные для отправки на анализ ИИ"""
    today: str

class QuestSave(QuestBase):
    """Данные для сохранения в БД после того, как ИИ выдал результат"""
    difficulty: str
    xp_reward: int
    gold_reward: int

class QuestSchema(QuestBase):
    """Полная схема квеста для отдачи фронтенду"""
    id: int
    user_id: int
    difficulty: str
    xp_reward: int
    gold_reward: int
    is_completed: bool
    is_failed: bool
    created_at: datetime  # Здесь FastAPI автоматически применит МСК при выдаче

    class Config:
        from_attributes = True


# --- Схемы для ответов API ---

class AnalysisResponse(BaseModel):
    """То, что фронт получает от Gemini и крутит в рулетке"""
    difficulty: str
    xp: int  # Мапим xp_reward -> xp для фронта
    gold: int # Мапим gold_reward -> gold для фронта

class UserUpdate(BaseModel):
    """Для синхронизации прогресса при завершении квеста"""
    xp: int
    gold: int
    lvl: Optional[int] = None
    hp: Optional[int] = None