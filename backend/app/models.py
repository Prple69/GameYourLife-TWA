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
    
    # Визуал (храним только ключи для ассетов: 'avatar1', 'knight')
    selected_avatar = Column(String, default="avatar1")
    char_class = Column(String, default="knight")
    
    # Прогресс
    lvl = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    max_xp = Column(Integer, default=100)
    gold = Column(Integer, default=0)
    hp = Column(Integer, default=100)
    max_hp = Column(Integer, default=100)
    
    # Экономика
    xp_multiplier = Column(Float, default=1.0)
    gold_multiplier = Column(Float, default=1.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Связи
    quests = relationship("Quest", back_populates="user", cascade="all, delete-orphan")
    inventory = relationship("InventoryItem", back_populates="user", cascade="all, delete-orphan")

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    difficulty = Column(String)  # easy, medium, hard, epic
    is_completed = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="quests")

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_slug = Column(String)  # Например: 'clover', 'phoenix_feather'
    
    user = relationship("User", back_populates="inventory")