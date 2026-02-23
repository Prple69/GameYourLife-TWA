from sqlalchemy.orm import Session
from . import models, schemas

# --- ЛОГИКА ПОЛЬЗОВАТЕЛЕЙ ---

def get_user_by_tg_id(db: Session, tg_id: str):
    """Найти пользователя по Telegram ID"""
    return db.query(models.User).filter(models.User.telegram_id == tg_id).first()

def create_user(db: Session, tg_id: str, username: str):
    """Создать нового персонажа 1-го уровня"""
    db_user = models.User(
        telegram_id=tg_id,
        username=username,
        lvl=1,
        xp=0,
        max_xp=100,
        gold=0,
        hp=100,
        max_hp=100,
        selected_avatar="avatar1",
        char_class="knight"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- ЛОГИКА ОБНОВЛЕНИЯ (Для CharacterPage) ---

def update_user_avatar(db: Session, tg_id: str, avatar_id: str):
    """Смена аватара"""
    user = get_user_by_tg_id(db, tg_id)
    if user:
        user.selected_avatar = avatar_id
        db.commit()
        db.refresh(user)
    return user

# --- ЛОГИКА НАГРАД (Для квестов) ---

def add_reward(db: Session, tg_id: str, xp_amount: int, gold_amount: int):
    """Начислить опыт и золото с проверкой Level Up"""
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return None

    # Применяем множители (баффы)
    user.xp += int(xp_amount * user.xp_multiplier)
    user.gold += int(gold_amount * user.gold_multiplier)

    # Логика повышения уровня
    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        # Усложняем следующий уровень на 20%
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True
    
    db.commit()
    db.refresh(user)
    return user, leveled_up