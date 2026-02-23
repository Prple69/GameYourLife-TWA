from pydantic import BaseModel, Field, ConfigDict
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

    # В Pydantic V2 используется model_config вместо class Config
    model_config = ConfigDict(from_attributes=True)


# --- Схемы Квестов ---

class QuestBase(BaseModel):
    title: str
    deadline: str  # Формат YYYY-MM-DD

class QuestCreate(QuestBase):
    """Данные для отправки на анализ ИИ"""
    today: str

class QuestSave(QuestBase):
    """Данные для сохранения в БД после ИИ анализа"""
    difficulty: str
    xp_reward: int
    gold_reward: int

class QuestSchema(QuestBase):
    """Полная схема квеста для фронтенда"""
    id: int
    user_id: int
    difficulty: str
    xp_reward: int
    gold_reward: int
    is_completed: bool
    is_failed: bool
    created_at: datetime  

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для ответов API ---

class AnalysisResponse(BaseModel):
    """Результат от ИИ для фронтовой 'рулетки'"""
    difficulty: str
    xp: int  
    gold: int 

class UserUpdate(BaseModel):
    """Для синхронизации прогресса"""
    xp: int
    gold: int
    lvl: Optional[int] = None
    hp: Optional[int] = None