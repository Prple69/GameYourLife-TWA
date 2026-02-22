# users.py
from sqlalchemy.orm import Session
from . import models

def update_avatar(db: Session, user_id: int, avatar_key: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.selected_avatar = avatar_key # Например 'avatar2'
        db.commit()
        db.refresh(user)
    return user

def get_leaderboard(db: Session, limit: int = 100):
    return db.query(models.User).order_by(models.User.lvl.desc(), models.User.xp.desc()).limit(limit).all()

def get_or_create_user(db: Session, tg_id: str, username: str):
    user = db.query(models.User).filter(models.User.telegram_id == tg_id).first()
    if not user:
        user = models.User(
            telegram_id=tg_id,
            username=username,
            max_xp=100, # Базовый опыт для 1 уровня
            gold=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user