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

# --- ЛОГИКА КВЕСТОВ ---

def create_quest(db: Session, tg_id: str, quest_data: schemas.QuestSave):
    """Создать квест, привязав его к внутреннему ID пользователя"""
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return None

    db_quest = models.Quest(
        user_id=user.id,  # Используем внутренний ID из таблицы users
        title=quest_data.title,
        difficulty=quest_data.difficulty,
        xp_reward=quest_data.xp_reward,
        gold_reward=quest_data.gold_reward,
        deadline=quest_data.deadline,
        is_completed=False,
        is_failed=False
    )
    db.add(db_quest)
    db.commit()
    db.refresh(db_quest)
    return db_quest

def complete_quest(db: Session, quest_id: int, tg_id: str):
    """Завершить квест и начислить награду"""
    # Сначала ищем квест и проверяем, принадлежит ли он этому юзеру через join или проверку ID
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return None, False

    quest = db.query(models.Quest).filter(
        models.Quest.id == quest_id,
        models.Quest.user_id == user.id, # Важно: проверяем владельца
        models.Quest.is_completed == False,
        models.Quest.is_failed == False
    ).first()

    if not quest:
        return None, False

    # Помечаем выполненным
    quest.is_completed = True
    
    # Начисляем награду (используем твою функцию add_reward)
    updated_user, leveled_up = add_reward(db, tg_id, quest.xp_reward, quest.gold_reward)
    
    db.commit()
    return quest, leveled_up

def check_and_fail_quests(db: Session, tg_id: str):
    """Проверка просроченных квестов и применение штрафов"""
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return []

    # Получаем текущую дату МСК
    today_str = models.get_msk_now().strftime("%Y-%m-%d")

    # Ищем квесты, где дедлайн < сегодня
    expired_quests = db.query(models.Quest).filter(
        models.Quest.user_id == user.id,
        models.Quest.deadline < today_str,
        models.Quest.is_completed == False,
        models.Quest.is_failed == False
    ).all()

    if not expired_quests:
        return []

    for quest in expired_quests:
        quest.is_failed = True
        # ШТРАФ: -5 HP за провал
        user.hp = max(0, user.hp - 5)

    db.commit()
    db.refresh(user)
    return expired_quests

def get_active_quests(db: Session, tg_id: str):
    """Получить текущие задачи после проверки на просрочку"""
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return []

    # 1. Сначала "протухаем" старые квесты
    check_and_fail_quests(db, tg_id) 

    # 2. Возвращаем только живые и невыполненные
    return db.query(models.Quest).filter(
        models.Quest.user_id == user.id,
        models.Quest.is_completed == False,
        models.Quest.is_failed == False
    ).order_by(models.Quest.id.asc()).all()

def get_quest_history(db: Session, tg_id: str):
    """История выполненных контрактов"""
    user = get_user_by_tg_id(db, tg_id)
    if not user:
        return []
        
    return db.query(models.Quest).filter(
        models.Quest.user_id == user.id,
        models.Quest.is_completed == True
    ).order_by(models.Quest.created_at.desc()).all()