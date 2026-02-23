from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone

Base = declarative_base()

# Смещение для МСК (UTC+3)
offset = timezone(timedelta(hours=3))

def get_msk_now():
    """Функция для получения текущего времени по МСК"""
    return datetime.now(offset)

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
    
    # Используем get_msk_now без скобок, чтобы SQLAlchemy вызывала её в момент создания записи
    created_at = Column(DateTime, default=get_msk_now)

    quests = relationship("Quest", back_populates="owner", cascade="all, delete-orphan")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String, nullable=False)
    difficulty = Column(String)
    
    xp_reward = Column(Integer)
    gold_reward = Column(Integer)
    
    deadline = Column(String) # Формат YYYY-MM-DD
    created_at = Column(DateTime, default=get_msk_now)
    
    is_completed = Column(Boolean, default=False)
    is_failed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="quests")