from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True) # ID из Telegram
    username = Column(String)
    
    # Характеристики персонажа
    lvl = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    max_xp = Column(Integer, default=100)
    gold = Column(Integer, default=0)
    hp = Column(Integer, default=100)
    
    # Множители (для баффов из магазина)
    xp_multiplier = Column(Float, default=1.0)
    gold_multiplier = Column(Float, default=1.0)
    
    # Системное: когда создан профиль
    created_at = Column(DateTime, default=datetime.datetime.utcnow)