from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Схемы Пользователя ---

class UserSchema(BaseModel):
    id: int
    telegram_id: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    gems: int = 0
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

    model_config = ConfigDict(from_attributes=True)


# --- Auth schemas (Phase 3) -------------------------------------------------

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=64)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TelegramLoginRequest(BaseModel):
    """Body for POST /api/auth/telegram-login — fields as sent by Telegram Login Widget."""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class RefreshRequest(BaseModel):
    refresh_token: str


# --- Схемы Квестов ---

class QuestBase(BaseModel):
    title: str
    deadline: str  # Формат YYYY-MM-DD

class QuestCreate(QuestBase):
    """Данные для отправки на анализ ИИ (включая состояние юзера)"""
    today: str
    current_hp: int
    max_hp: int
    lvl: int

class QuestSave(QuestBase):
    """Данные для сохранения в БД после ИИ анализа"""
    difficulty: str
    xp_reward: int
    gold_reward: int
    hp_penalty: int  # <--- Добавлено

class QuestSchema(QuestBase):
    """Полная схема квеста для фронтенда"""
    id: int
    user_id: int
    difficulty: str
    xp_reward: int
    gold_reward: int
    hp_penalty: int  # <--- Добавлено
    is_completed: bool
    is_failed: bool
    created_at: datetime  

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для ответов API (Gemini) ---

class AnalysisResponse(BaseModel):
    """Результат от ИИ для фронтовой 'рулетки'"""
    difficulty: str
    xp: int  
    gold: int 
    hp_penalty: int # <--- Добавлено

class UserUpdate(BaseModel):
    """Для синхронизации прогресса"""
    xp: int
    gold: int
    lvl: Optional[int] = None
    hp: Optional[int] = None