from sqlalchemy.orm import Session
from . import models, schemas

# --- ПОЛЬЗОВАТЕЛИ ---

def get_user_by_tg_id(db: Session, tg_id: str):
    return db.query(models.User).filter(models.User.telegram_id == tg_id).first()

def create_user(db: Session, telegram_id: str, username: str):
    # Создаем самого юзера
    db_user = models.User(telegram_id=telegram_id, username=username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Сразу создаем ему пустые настройки
    db_settings = models.UserSettings(user_id=db_user.id)
    db.add(db_settings)
    db.commit()
    
    return db_user

# --- ЛОГИКА ПРОГРЕССИИ ---

def apply_reward(db: Session, user: models.User, difficulty: str):
    # Базовые значения наград
    rewards = {
        "easy": {"xp": 20, "gold": 5},
        "medium": {"xp": 50, "gold": 15},
        "hard": {"xp": 120, "gold": 40}
    }
    
    base = rewards.get(difficulty, rewards["easy"])
    
    # ПРИМЕНЯЕМ ТВОИ КОЭФФИЦИЕНТЫ
    xp_gain = int(base["xp"] * user.xp_multiplier)
    gold_gain = int(base["gold"] * user.gold_multiplier)
    
    # Начисляем награду
    user.xp += xp_gain
    user.gold += gold_gain
    
    leveled_up = False
    
    # ЛОГИКА LEVEL UP
    # Если опыта стало больше, чем нужно для текущего уровня
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        # Увеличиваем планку опыта на 20% для следующего уровня
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True
        
    db.commit()
    db.refresh(user)
    
    return {
        "xp_gain": xp_gain,
        "gold_gain": gold_gain,
        "leveled_up": leveled_up
    }

# --- КВЕСТЫ ---

def create_quest(db: Session, user_id: int, quest_data: schemas.QuestCreate):
    db_quest = models.Quest(
        user_id=user_id,
        title=quest_data.title,
        difficulty=quest_data.difficulty
    )
    db.add(db_quest)
    db.commit()
    db.refresh(db_quest)
    return db_quest

def complete_quest(db: Session, quest_id: int):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id).first()
    if quest:
        quest.is_completed = True
        db.commit()
    return quest

# --- ЛАВКА ---

def buy_item(db: Session, user_id: int, item_id: str, price: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user.gold < price:
        return {"success": False, "detail": "Недостаточно золота"}
    
    # Списываем золото
    user.gold -= price
    
    # Логика эффектов (зависит от slug предмета)
    # В будущем можно вынести в отдельную таблицу эффектов
    if item_id == "clover": # Клевер удачи
        user.xp_multiplier = 1.5
    elif item_id == "phoenix": # Перо феникса (пример)
        # можно добавить в инвентарь или восстановить HP
        user.hp = user.max_hp 
        
    db.commit()
    db.refresh(user)
    return {"success": True, "user": user}