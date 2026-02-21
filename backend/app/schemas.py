from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- НАСТРОЙКИ (Settings) ---
class UserSettingsBase(BaseModel):
    language: str = "ru"
    is_muted: bool = False
    theme: str = "classic"
    show_in_leaderboard: bool = True

class UserSettings(UserSettingsBase):
    class Config:
        from_attributes = True

# --- КВЕСТЫ (Quests) ---
class QuestBase(BaseModel):
    title: str
    difficulty: str  # easy, medium, hard

class QuestCreate(QuestBase):
    pass

class Quest(QuestBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- ПОЛЬЗОВАТЕЛЬ (User) ---
class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = "Герой"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    lvl: int
    xp: int
    max_xp: int
    gold: int
    hp: int
    
    # Твои коэффициенты, которые фронтенд будет отображать
    xp_multiplier: float
    gold_multiplier: float
    
    # Вложенные данные
    settings: Optional[UserSettings] = None
    
    class Config:
        from_attributes = True

# --- РЕЗУЛЬТАТ ВЫПОЛНЕНИЯ КВЕСТА ---
class QuestCompleteResponse(BaseModel):
    xp_gain: int
    gold_gain: int
    new_lvl: int
    new_xp: int
    new_gold: int
    leveled_up: bool