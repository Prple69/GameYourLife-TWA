from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Literal, Optional, List
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

    # Phase 4: character stats
    stat_strength_level: int = 1
    stat_strength_xp: int = 0
    stat_wisdom_level: int = 1
    stat_wisdom_xp: int = 0
    stat_endurance_level: int = 1
    stat_endurance_xp: int = 0
    stat_charisma_level: int = 1
    stat_charisma_xp: int = 0

    # Phase 5: active boost slots — nullable, computed lazy at read-time
    active_xp_mult: Optional[float] = None
    active_xp_expires_at: Optional[datetime] = None
    active_gold_mult: Optional[float] = None
    active_gold_expires_at: Optional[datetime] = None
    active_strength_xp_mult: Optional[float] = None
    active_strength_xp_expires_at: Optional[datetime] = None
    active_wisdom_xp_mult: Optional[float] = None
    active_wisdom_xp_expires_at: Optional[datetime] = None
    active_endurance_xp_mult: Optional[float] = None
    active_endurance_xp_expires_at: Optional[datetime] = None
    active_charisma_xp_mult: Optional[float] = None
    active_charisma_xp_expires_at: Optional[datetime] = None
    active_hp_max_bonus: Optional[int] = None
    active_hp_max_expires_at: Optional[datetime] = None

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

QuestCategory = Literal["work", "fitness", "learning", "social"]


class QuestBase(BaseModel):
    title: str
    deadline: str  # Формат YYYY-MM-DD

class QuestCreate(QuestBase):
    """Данные для отправки на анализ ИИ (включая состояние юзера)"""
    today: str
    current_hp: int
    max_hp: int
    lvl: int
    category: QuestCategory

class QuestSave(QuestBase):
    """Данные для сохранения в БД после ИИ анализа"""
    difficulty: str
    xp_reward: int
    gold_reward: int
    hp_penalty: int  # <--- Добавлено
    category: QuestCategory

class QuestSchema(QuestBase):
    """Полная схема квеста для фронтенда"""
    id: int
    user_id: int
    difficulty: str
    xp_reward: int
    gold_reward: int
    hp_penalty: int  # <--- Добавлено
    category: Optional[QuestCategory] = None  # Phase 4: nullable for legacy quests
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


# --- Phase 5: Shop & Inventory schemas ---

class ShopItemSchema(BaseModel):
    id: int
    item_type: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    price_gold: int
    effect_multiplier: Optional[float] = None
    duration_seconds: Optional[int] = None
    heal_amount: Optional[int] = None
    hp_max_bonus: Optional[int] = None
    avatar_key: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class InventoryItemSchema(BaseModel):
    id: int
    user_id: int
    shop_item_id: int
    quantity: int
    created_at: Optional[datetime] = None
    shop_item: ShopItemSchema

    model_config = ConfigDict(from_attributes=True)


class PurchaseRequest(BaseModel):
    idempotency_key: str  # UUIDv4 string


class ActivateRequest(BaseModel):
    idempotency_key: str


class EquipRequest(BaseModel):
    idempotency_key: str


# --- Phase 6: Daily AI Suggestions ---

class DailySuggestion(BaseModel):
    """One AI-generated quest suggestion. Shape matches analyze_task response + category."""
    title: str
    category: QuestCategory
    difficulty: Literal["easy", "medium", "hard", "epic"]
    xp: int
    gold: int
    hp_penalty: int

class DailySuggestionsResponse(BaseModel):
    """Response for GET /api/daily/suggestions."""
    suggestions: List[DailySuggestion]
    rerolls_remaining: int  # 0-2
    reset_time: str         # ISO8601 MSK midnight of next day


# --- Phase 7: Leaderboard schemas ---

class LeaderboardEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rank: int
    user_id: int
    display_name: str
    avatar: Optional[str] = None
    lvl: int
    xp: int


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntryResponse]
    total: int


class LeaderboardMeResponse(BaseModel):
    rank: Optional[int]
    total_users: int
    neighbors: list[LeaderboardEntryResponse]


# ── Phase 8: Social – Friends ──────────────────────────────────────────────

class UserSearchResult(BaseModel):
    id: int
    display_name: str
    avatar: str | None = None
    lvl: int

    model_config = ConfigDict(from_attributes=True)


class FriendListItem(BaseModel):
    id: int
    display_name: str
    avatar: str | None = None
    lvl: int

    model_config = ConfigDict(from_attributes=True)


class ActivityFeedItem(BaseModel):
    user_id: int
    display_name: str
    avatar: str | None = None
    event_type: str          # "quest_completed"
    event_data: dict         # {"quest_title": str, "difficulty": str}
    timestamp: datetime


class FriendsResponse(BaseModel):
    friends: list[FriendListItem]
    activity: list[ActivityFeedItem]


class FriendRequestOut(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PendingRequestItem(BaseModel):
    """Incoming or outgoing friend request visible to the addressee/requester."""
    id: int
    other_user_id: int
    other_display_name: str
    other_avatar: str | None = None
    direction: str           # "incoming" | "outgoing"
    created_at: datetime