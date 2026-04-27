import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, UniqueConstraint, Enum
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime, timedelta, timezone

# Смещение для МСК (UTC+3)
offset = timezone(timedelta(hours=3))

def get_msk_now():
    """Функция для получения текущего времени по МСК"""
    return datetime.now(offset)

# В SQLAlchemy 2.0 рекомендуется наследоваться от DeclarativeBase
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True, nullable=True)
    username = Column(String)

    # Phase 3: email/password auth fields (nullable for legacy tg-only users)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    display_name = Column(String, nullable=True)
    gems = Column(Integer, default=0, nullable=False, server_default="0")

    # Phase 4: character stats (8 columns, mirrors gems NOT NULL+server_default pattern)
    stat_strength_level  = Column(Integer, default=1, nullable=False, server_default="1")
    stat_strength_xp     = Column(Integer, default=0, nullable=False, server_default="0")
    stat_wisdom_level    = Column(Integer, default=1, nullable=False, server_default="1")
    stat_wisdom_xp       = Column(Integer, default=0, nullable=False, server_default="0")
    stat_endurance_level = Column(Integer, default=1, nullable=False, server_default="1")
    stat_endurance_xp    = Column(Integer, default=0, nullable=False, server_default="0")
    stat_charisma_level  = Column(Integer, default=1, nullable=False, server_default="1")
    stat_charisma_xp     = Column(Integer, default=0, nullable=False, server_default="0")

    # Кастомизация персонажа
    selected_avatar = Column(String, default="avatar1")
    char_class = Column(String, default="knight")
    
    # Прогресс
    lvl = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    max_xp = Column(Integer, default=100)
    gold = Column(Integer, default=0)
    
    # Состояние
    hp = Column(Integer, default=100)
    max_hp = Column(Integer, default=100)
    
    # Множители
    xp_multiplier = Column(Float, default=1.0)
    gold_multiplier = Column(Float, default=1.0)
    
    # Добавляем timezone=True для корректной работы с Postgres
    created_at = Column(DateTime(timezone=True), default=get_msk_now)

    # Phase 5: active boost slots (denormalized — one slot per boost type)
    active_xp_mult         = Column(Float, nullable=True)
    active_xp_expires_at   = Column(DateTime(timezone=True), nullable=True)
    active_gold_mult       = Column(Float, nullable=True)
    active_gold_expires_at = Column(DateTime(timezone=True), nullable=True)
    active_strength_xp_mult         = Column(Float, nullable=True)
    active_strength_xp_expires_at   = Column(DateTime(timezone=True), nullable=True)
    active_wisdom_xp_mult           = Column(Float, nullable=True)
    active_wisdom_xp_expires_at     = Column(DateTime(timezone=True), nullable=True)
    active_endurance_xp_mult        = Column(Float, nullable=True)
    active_endurance_xp_expires_at  = Column(DateTime(timezone=True), nullable=True)
    active_charisma_xp_mult         = Column(Float, nullable=True)
    active_charisma_xp_expires_at   = Column(DateTime(timezone=True), nullable=True)
    active_hp_max_bonus    = Column(Integer, nullable=True)
    active_hp_max_expires_at = Column(DateTime(timezone=True), nullable=True)

    quests = relationship("Quest", back_populates="owner", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="user")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String, nullable=False)
    difficulty = Column(String)
    
    xp_reward = Column(Integer)
    gold_reward = Column(Integer)
    hp_penalty = Column(Integer)
    category = Column(String, nullable=True)  # Phase 4: nullable for legacy quests

    deadline = Column(String) # Формат YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), default=get_msk_now)
    
    is_completed = Column(Boolean, default=False)
    is_failed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="quests")


class ShopItem(Base):
    __tablename__ = "shop_items"
    id               = Column(Integer, primary_key=True, index=True)
    item_type        = Column(String, nullable=False)   # booster_xp, booster_gold, booster_strength_xp, booster_wisdom_xp, booster_endurance_xp, booster_charisma_xp, booster_hp_max, potion_heal, skin
    name             = Column(String, nullable=False, unique=True)
    description      = Column(String, nullable=True)
    icon             = Column(String, nullable=True)    # emoji or asset key
    price_gold       = Column(Integer, nullable=False)
    price_gems       = Column(Integer, nullable=True)   # Phase 10: gem-currency price
    effect_multiplier = Column(Float, nullable=True)   # for booster_* (mult value)
    duration_seconds = Column(Integer, nullable=True)  # for timer-based boosters
    heal_amount      = Column(Integer, nullable=True)  # for potion_heal
    hp_max_bonus     = Column(Integer, nullable=True)  # for booster_hp_max
    avatar_key       = Column(String, nullable=True)   # for skin
    is_active        = Column(Boolean, default=True, nullable=False)

    inventory_items  = relationship("InventoryItem", back_populates="shop_item")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    __table_args__ = (UniqueConstraint("user_id", "shop_item_id", name="uq_user_shop_item"),)

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_item_id = Column(Integer, ForeignKey("shop_items.id"), nullable=False)
    quantity     = Column(Integer, nullable=False, default=1)
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone(timedelta(hours=3))))

    user       = relationship("User", back_populates="inventory_items")
    shop_item  = relationship("ShopItem", back_populates="inventory_items")


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_user_idem_key"),)

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    key           = Column(String, nullable=False)
    response_json = Column(Text, nullable=False)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone(timedelta(hours=3))))


# ── Phase 8: Social – Friends ──────────────────────────────────────────────

class FriendshipStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),
    )

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    addressee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(FriendshipStatus), nullable=False, default=FriendshipStatus.pending)
    created_at = Column(DateTime(timezone=True), default=get_msk_now)


# ── Phase 9: Social – Guilds & Challenges ─────────────────────────────────

class GuildRole(str, enum.Enum):
    owner = "owner"
    officer = "officer"
    member = "member"


class Guild(Base):
    __tablename__ = "guilds"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_msk_now)

    members = relationship("GuildMember", back_populates="guild", cascade="all, delete-orphan")
    challenges = relationship("GuildChallenge", back_populates="guild", cascade="all, delete-orphan")


class GuildMember(Base):
    __tablename__ = "guild_members"
    __table_args__ = (
        UniqueConstraint("guild_id", "user_id", name="uq_guild_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(GuildRole), nullable=False, default=GuildRole.member)
    joined_at = Column(DateTime(timezone=True), default=get_msk_now)

    guild = relationship("Guild", back_populates="members")
    user = relationship("User")


class GuildChallenge(Base):
    __tablename__ = "guild_challenges"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    target_xp = Column(Integer, nullable=False, default=0)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_msk_now)

    guild = relationship("Guild", back_populates="challenges")