import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from . import models, schemas

logger = logging.getLogger(__name__)

# --- ЛОГИКА ПОЛЬЗОВАТЕЛЕЙ ---

async def get_user_by_tg_id(db: AsyncSession, tg_id: str):
    """Найти пользователя по Telegram ID (асинхронно)"""
    result = await db.execute(
        select(models.User).filter(models.User.telegram_id == tg_id)
    )
    return result.scalars().first()

async def create_user(db: AsyncSession, tg_id: str, username: str):
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
    await db.commit()
    await db.refresh(db_user)
    return db_user

# --- ЛОГИКА ОБНОВЛЕНИЯ ---

async def update_user_avatar(db: AsyncSession, tg_id: str, avatar_id: str):
    """Смена аватара"""
    user = await get_user_by_tg_id(db, tg_id)
    if user:
        user.selected_avatar = avatar_id
        await db.commit()
        await db.refresh(user)
    return user

# --- ЛОГИКА НАГРАД ---

async def add_reward(db: AsyncSession, tg_id: str, xp_amount: int, gold_amount: int):
    """Начислить опыт и золото с проверкой Level Up"""
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return None, False

    # Применяем множители
    user.xp += int(xp_amount * user.xp_multiplier)
    user.gold += int(gold_amount * user.gold_multiplier)

    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True
    
    await db.commit()
    await db.refresh(user)

    # Phase 7: Update leaderboard rank after XP/level change
    try:
        from app import cache as _cache, leaderboard as _leaderboard
        if _cache._redis_client is not None:
            await _leaderboard.update(_cache._redis_client, user)
    except Exception as e:
        logger.warning(f"Leaderboard update failed in add_reward: {e}")

    return user, leveled_up

# --- ЛОГИКА КВЕСТОВ ---

async def create_quest(db: AsyncSession, tg_id: str, quest_data: schemas.QuestSave):
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return None

    db_quest = models.Quest(
        user_id=user.id,
        title=quest_data.title,
        difficulty=quest_data.difficulty,
        xp_reward=quest_data.xp_reward,
        gold_reward=quest_data.gold_reward,
        hp_penalty=quest_data.hp_penalty,
        deadline=quest_data.deadline,
        is_completed=False,
        is_failed=False
    )
    db.add(db_quest)
    await db.commit()
    await db.refresh(db_quest)
    return db_quest

async def complete_quest(db: AsyncSession, quest_id: int, tg_id: str):
    """Завершить квест и начислить награду"""
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return None, False

    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.id == quest_id,
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False
        )
    )
    quest = result.scalars().first()

    if not quest:
        return None, False

    quest.is_completed = True
    
    # Вызываем асинхронное начисление награды
    updated_user, leveled_up = await add_reward(db, tg_id, quest.xp_reward, quest.gold_reward)
    
    await db.commit()
    return quest, leveled_up

async def check_and_fail_quests(db: AsyncSession, tg_id: str):
    """Проверка просроченных квестов (асинхронно)"""
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return []

    today_str = models.get_msk_now().strftime("%Y-%m-%d")

    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            models.Quest.deadline < today_str,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False
        )
    )
    expired_quests = result.scalars().all()

    if not expired_quests:
        return []

    for quest in expired_quests:
        quest.is_failed = True
        user.hp = max(0, user.hp - 5)

    await db.commit()
    await db.refresh(user)
    return expired_quests

async def get_active_quests(db: AsyncSession, tg_id: str):
    """Получить текущие задачи"""
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return []

    # Сначала проверяем просрочку
    await check_and_fail_quests(db, tg_id) 

    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False
        ).order_by(models.Quest.id.asc())
    )
    return result.scalars().all()

async def get_quest_history(db: AsyncSession, tg_id: str, limit: int = 0):
    """Архив: выполненные или проваленные. limit=0 means no limit (backwards compat)."""
    user = await get_user_by_tg_id(db, tg_id)
    if not user:
        return []

    q = (
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            or_(models.Quest.is_completed == True, models.Quest.is_failed == True)
        ).order_by(models.Quest.created_at.desc())
    )
    if limit > 0:
        q = q.limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


# --- Phase 3: auth CRUD -----------------------------------------------------

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.User).filter(models.User.id == user_id)
    )
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(
        select(models.User).filter(models.User.email.ilike(email))
    )
    return result.scalars().first()


async def create_user_email(
    db: AsyncSession, email: str, password_hash: str, display_name: str
) -> models.User:
    """Create a new email+password user. telegram_id stays NULL."""
    db_user = models.User(
        email=email,
        password_hash=password_hash,
        display_name=display_name,
        telegram_id=None,
        username=None,
        lvl=1, xp=0, max_xp=100, gold=0, hp=100, max_hp=100,
        selected_avatar="avatar1", char_class="knight",
        gems=0,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def create_user_telegram(
    db: AsyncSession,
    telegram_id: str,
    display_name: str,
    username: Optional[str] = None,
) -> models.User:
    """
    Create a new user via Telegram Login Widget. email/password_hash stay NULL.
    AUTH-06: callers MUST check get_user_by_tg_id first — this function only
    runs when no matching user exists.
    """
    db_user = models.User(
        telegram_id=telegram_id,
        username=username,
        display_name=display_name,
        email=None,
        password_hash=None,
        lvl=1, xp=0, max_xp=100, gold=0, hp=100, max_hp=100,
        selected_avatar="avatar1", char_class="knight",
        gems=0,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user_email_verified(db: AsyncSession, user_id: int):
    user = await get_user_by_id(db, user_id)
    if user:
        user.email_verified_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)
    return user


async def update_user_avatar_by_id(db: AsyncSession, user_id: int, avatar_id: str):
    """Avatar update keyed by user.id — works for email-only users (no tg_id)."""
    user = await get_user_by_id(db, user_id)
    if user:
        user.selected_avatar = avatar_id
        await db.commit()
        await db.refresh(user)
    return user


# --- Phase 5: Shop / Inventory CRUD -----------------------------------------

async def get_catalog(db: AsyncSession) -> list:
    """Return all active shop items ordered by price ascending."""
    from sqlalchemy import select
    result = await db.execute(
        select(models.ShopItem)
        .filter(models.ShopItem.is_active == True)
        .order_by(models.ShopItem.price_gold.asc())
    )
    return result.scalars().all()


async def get_inventory(db: AsyncSession, user_id: int) -> list:
    """Return all inventory items for a user with shop_item eagerly loaded."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.InventoryItem)
        .filter(models.InventoryItem.user_id == user_id)
        .options(selectinload(models.InventoryItem.shop_item))
        .order_by(models.InventoryItem.created_at.asc())
    )
    return result.scalars().all()