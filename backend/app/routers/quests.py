"""
Router for user profile, quests, and AI quest analysis.

All endpoints use Depends(get_current_user) — JWT Bearer auth. Identity comes
from user.id (JWT sub) rather than Telegram initData. URLs match Phase 1 so
cached frontend calls keep working after the auth swap.

Endpoints:
  POST /api/analyze                 — AI quest evaluation
  GET  /api/user/me                 — current user profile
  POST /api/user/update-avatar      — change avatar
  GET  /api/user/me/status          — auto-fail overdue + return user
  POST /api/quests/save             — save a quest
  POST /api/quests/complete/{id}    — mark quest complete, apply rewards + level-up
  GET  /api/quests/me               — active quests (auto-fails overdue)
  GET  /api/quests/history/me       — completed or failed quests
"""
import json
import logging
import re
from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException
from openai import AsyncOpenAI
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import get_msk_now

logger = logging.getLogger(__name__)
router = APIRouter(tags=["quests"])


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _fail_overdue_quests(db: AsyncSession, user: models.User) -> None:
    """Mark quests past their deadline as failed and dock HP. Commits on change."""
    today_str = get_msk_now().strftime("%Y-%m-%d")
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            models.Quest.deadline < today_str,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False,
        )
    )
    overdue = result.scalars().all()
    if not overdue:
        return
    for q in overdue:
        q.is_failed = True
        user.hp = max(0, user.hp - 5)
    await db.commit()


# ── AI Quest Analysis ────────────────────────────────────────────────────────

@router.post("/api/analyze")
async def analyze_task(
    payload: dict = Body(...),
    user: models.User = Depends(get_current_user),
):
    settings = get_settings()
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENAI_API_KEY,
    )
    try:
        title = payload.get("title", "Без названия")
        deadline = payload.get("deadline", "Не указан")
        current_day = payload.get("today", "сегодня")
        lvl = payload.get("lvl", user.lvl)
        current_hp = payload.get("current_hp", user.hp)
        max_hp = payload.get("max_hp", user.max_hp)

        prompt = f""" Ты RPG мастер. Оцени контракт: "{title}".
        Сегодня: {current_day}. Дедлайн: {deadline}.

        СТАТУС ИГРОКА:
        - Уровень: {lvl}
        - Текущее HP: {current_hp} / {max_hp}

        КРИТЕРИИ СЛОЖНОСТИ И НАГРАД:
        - easy: Рутина. Награда: gold 5-15, xp 10-30. Штраф при провале: 5-8 HP.
        - medium: Усилия. Награда: gold 20-45, xp 40-80. Штраф при провале: 10-15 HP.
        - hard: Тяжелая работа. Награда: gold 50-120, xp 100-250. Штраф при провале: 20-30 HP.
        - epic: Жизненное достижение. Награда: gold 150-300, xp 300-500. Штраф при провале: 40-60 HP.

        ПРАВИЛА МАСТЕРА:
        1. Если дедлайн критический (сегодня), сложность и награда растут.
        2. Оцени "hp_penalty" (штраф за провал) исходя из сложности.
        3. Если у игрока критически мало HP ({current_hp}), сделай штраф чуть мягче, но не ниже минимального для категории.

        Верни ТОЛЬКО чистый JSON (без разметки markdown):
        {{
            "difficulty": "easy"|"medium"|"hard"|"epic",
            "xp": number,
            "gold": number,
            "hp_penalty": number
        }} """

        completion = await client.chat.completions.create(
            model="liquid/lfm-2.5-1.2b-thinking:free",
            messages=[{"role": "user", "content": prompt}],
        )
        content = completion.choices[0].message.content
        clean_json = re.sub(r"```json|```", "", content).strip()
        return json.loads(clean_json)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI Analysis Error: %s", e)
        return {"difficulty": "medium", "xp": 40, "gold": 20, "hp_penalty": 12, "fallback": True}


# ── User Profile ─────────────────────────────────────────────────────────────

@router.get("/api/user/me", response_model=schemas.UserSchema)
async def get_profile(user: models.User = Depends(get_current_user)):
    return user


@router.post("/api/user/update-avatar", response_model=schemas.UserSchema)
async def update_avatar(
    avatar_id: str,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await crud.update_user_avatar_by_id(db, user.id, avatar_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.get("/api/user/me/status", response_model=schemas.UserSchema)
async def check_status(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _fail_overdue_quests(db, user)
    await db.refresh(user)
    return user


# ── Quests ───────────────────────────────────────────────────────────────────

@router.post("/api/quests/save", response_model=schemas.QuestSchema)
async def save_quest(
    quest_data: schemas.QuestSave,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quest = models.Quest(
        user_id=user.id,
        title=quest_data.title,
        difficulty=quest_data.difficulty,
        xp_reward=quest_data.xp_reward,
        gold_reward=quest_data.gold_reward,
        hp_penalty=quest_data.hp_penalty,
        deadline=quest_data.deadline,
        is_completed=False,
        is_failed=False,
    )
    db.add(quest)
    await db.commit()
    await db.refresh(quest)
    return quest


@router.post("/api/quests/complete/{quest_id}")
async def complete_quest(
    quest_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.id == quest_id,
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False,
        )
    )
    quest = result.scalars().first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    quest.is_completed = True

    user.xp += int(quest.xp_reward * user.xp_multiplier)
    user.gold += int(quest.gold_reward * user.gold_multiplier)

    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "leveled_up": leveled_up,
        "user": schemas.UserSchema.model_validate(user),
        "reward": {"xp": quest.xp_reward, "gold": quest.gold_reward},
    }


@router.get("/api/quests/me", response_model=List[schemas.QuestSchema])
async def get_quests(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _fail_overdue_quests(db, user)
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False,
        ).order_by(models.Quest.id.asc())
    )
    return result.scalars().all()


@router.get("/api/quests/history/me", response_model=List[schemas.QuestSchema])
async def get_history(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            or_(models.Quest.is_completed == True, models.Quest.is_failed == True),
        ).order_by(models.Quest.created_at.desc())
    )
    return result.scalars().all()
