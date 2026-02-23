from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    username = Column(String)
    selected_avatar = Column(String, default="avatar1")
    char_class = Column(String, default="knight")
    lvl = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    max_xp = Column(Integer, default=100)
    gold = Column(Integer, default=0)
    hp = Column(Integer, default=100)
    max_hp = Column(Integer, default=100)
    xp_multiplier = Column(Float, default=1.0)
    gold_multiplier = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)