from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
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
    telegram_id = Column(String, unique=True, index=True)
    username = Column(String)
    
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

    quests = relationship("Quest", back_populates="owner", cascade="all, delete-orphan")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String, nullable=False)
    difficulty = Column(String)
    
    xp_reward = Column(Integer)
    gold_reward = Column(Integer)
    hp_penalty = Column(Integer)
    
    deadline = Column(String) # Формат YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), default=get_msk_now)
    
    is_completed = Column(Boolean, default=False)
    is_failed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="quests")