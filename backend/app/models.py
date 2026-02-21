from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    username = Column(String)
    
    # Основные статы
    lvl = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    max_xp = Column(Integer, default=100)
    gold = Column(Integer, default=0)
    hp = Column(Integer, default=100)
    
    # Твои множители для гибкой экономики
    xp_multiplier = Column(Float, default=1.0)
    gold_multiplier = Column(Float, default=1.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Связи: uselist=False делает связь 1-к-1 для настроек
    settings = relationship("UserSettings", uselist=False, back_populates="user")
    quests = relationship("Quest", back_populates="user")
    inventory = relationship("Inventory", back_populates="user")


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    language = Column(String, default="ru")
    is_muted = Column(Boolean, default=False)
    theme = Column(String, default="classic")
    show_in_leaderboard = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    difficulty = Column(String)  # easy, medium, hard
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quests")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(String)  # Уникальный код предмета (напр. 'potion_01')
    quantity = Column(Integer, default=1)

    user = relationship("User", back_populates="inventory")