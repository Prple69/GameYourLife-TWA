"""
Daily AI quest suggestions router — Phase 6.

Endpoints:
  GET  /api/daily/suggestions      — fetch cached or generate 3 AI quest suggestions
  POST /api/daily/accept/{index}   — accept a suggestion, create quest, remove from cache
  POST /api/daily/reroll/{index}   — replace one suggestion with a new LLM suggestion

Cache keys (Redis):
  daily:{user.id}:{YYYY-MM-DD}      — JSON list of suggestion dicts, TTL = midnight MSK
  rerolls:{user.id}:{YYYY-MM-DD}    — reroll counter (0-2), same TTL

Reroll cap: 2 total per user per day (not per-card).
"""
import json
import logging
import re
from datetime import timedelta
from typing import List

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import cache, models, schemas
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import get_msk_now
from app.schemas import DailySuggestion, DailySuggestionsResponse
from app.utils.game_logic import MAX_ACTIVE_QUESTS

logger = logging.getLogger(__name__)
router = APIRouter(tags=["daily"])


# ── Constants ─────────────────────────────────────────────────────────────────

FALLBACK_SUGGESTIONS = [
    {"title": "Ежедневная задача", "category": "work", "difficulty": "easy", "xp": 30, "gold": 15, "hp_penalty": 8},
    {"title": "Физическая активность", "category": "fitness", "difficulty": "easy", "xp": 30, "gold": 15, "hp_penalty": 8},
    {"title": "Обучение чему-то новому", "category": "learning", "difficulty": "easy", "xp": 30, "gold": 15, "hp_penalty": 8},
]

MAX_REROLLS_PER_DAY = 2


# ── Helpers ───────────────────────────────────────────────────────────────────

def _seconds_until_midnight_msk() -> int:
    """Return seconds from now until next MSK midnight (minimum 1)."""
    now = get_msk_now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(1, int((midnight - now).total_seconds()))


def _format_quest_history(quests: list) -> str:
    """Format quest history list for LLM prompt context."""
    if not quests:
        return "История пустая (новый игрок)"
    lines = []
    for q in quests:
        status = "✓" if q.is_completed else "✗"
        lines.append(f"{status} [{q.category or 'unknown'}] {q.title} ({q.difficulty})")
    return "\n".join(lines)


async def _generate_suggestions_llm(user: models.User, history: list) -> list:
    """Call LLM to generate 3 quest suggestions. Returns fallback list on any error."""
    settings = get_settings()
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENAI_API_KEY,
    )
    try:
        history_text = _format_quest_history(history)
        prompt = f"""Ты RPG мастер. Сгенерируй ровно 3 разных квеста для игрока.

СТАТУС ИГРОКА:
- Уровень: {user.lvl}
- Текущее HP: {user.hp} / {user.max_hp}

СТАТЫ ИГРОКА (level):
- Сила: {user.stat_strength_level}
- Мудрость: {user.stat_wisdom_level}
- Выносливость: {user.stat_endurance_level}
- Обаяние: {user.stat_charisma_level}

ИСТОРИЯ ПОСЛЕДНИХ 10 КВЕСТОВ (успехи и провалы):
{history_text}

ПРАВИЛА МАСТЕРА:
1. Сгенерируй 3 разнообразных квеста (разные категории где возможно).
2. ПРИОРИТЕТ НА СЛАБЫЕ СТАТЫ: если стат ниже среднего, предложи квест той категории.
   - Сила низка? → fitness quest
   - Мудрость низка? → learning quest
   - Выносливость низка? → work quest
   - Обаяние низко? → social quest
3. Каждый квест: сложность (easy/medium/hard/epic), награда (gold, xp), штраф (hp_penalty).
4. Критерии как в одиночном квесте (в зависимости от уровня и дедлайна = сегодня).

Верни ТОЛЬКО чистый JSON (без разметки markdown):
[
  {{"title": "string", "category": "work"|"fitness"|"learning"|"social", "difficulty": "easy"|"medium"|"hard"|"epic", "xp": number, "gold": number, "hp_penalty": number}},
  {{"title": "string", "category": "work"|"fitness"|"learning"|"social", "difficulty": "easy"|"medium"|"hard"|"epic", "xp": number, "gold": number, "hp_penalty": number}},
  {{"title": "string", "category": "work"|"fitness"|"learning"|"social", "difficulty": "easy"|"medium"|"hard"|"epic", "xp": number, "gold": number, "hp_penalty": number}}
]"""

        completion = await client.chat.completions.create(
            model="liquid/lfm-2.5-1.2b-thinking:free",
            messages=[{"role": "user", "content": prompt}],
        )
        content = completion.choices[0].message.content
        clean_json = re.sub(r"```json|```", "", content).strip()
        raw_list = json.loads(clean_json)
        # Validate each suggestion; raises ValidationError on bad shape
        validated = [DailySuggestion.model_validate(item).model_dump() for item in raw_list]
        return validated
    except Exception as e:
        logger.error("Daily suggestions LLM error: %s", e)
        return list(FALLBACK_SUGGESTIONS)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/api/daily/suggestions", response_model=DailySuggestionsResponse)
async def get_daily_suggestions(
    user: models.User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Return cached suggestions or generate new ones via LLM."""
    today = get_msk_now().strftime("%Y-%m-%d")
    cache_key = f"daily:{user.id}:{today}"
    reroll_key = f"rerolls:{user.id}:{today}"
    reset_time = (
        get_msk_now() + timedelta(days=1)
    ).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    cached = await redis_client.get(cache_key)
    if cached:
        rerolls_used = int(await redis_client.get(reroll_key) or 0)
        return DailySuggestionsResponse(
            suggestions=[DailySuggestion.model_validate(s) for s in json.loads(cached)],
            rerolls_remaining=max(0, MAX_REROLLS_PER_DAY - rerolls_used),
            reset_time=reset_time,
        )

    # Query last 10 completed/failed quests by user.id directly
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.user_id == user.id,
            or_(models.Quest.is_completed == True, models.Quest.is_failed == True),
        ).order_by(models.Quest.created_at.desc()).limit(10)
    )
    history = result.scalars().all()

    raw_suggestions = await _generate_suggestions_llm(user, history)
    ttl = _seconds_until_midnight_msk()
    await redis_client.setex(cache_key, ttl, json.dumps(raw_suggestions))

    return DailySuggestionsResponse(
        suggestions=[DailySuggestion.model_validate(s) for s in raw_suggestions],
        rerolls_remaining=MAX_REROLLS_PER_DAY,
        reset_time=reset_time,
    )


@router.post("/api/daily/accept/{index}")
async def accept_daily_suggestion(
    index: int,
    user: models.User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Accept a suggestion: create quest, remove suggestion from cache."""
    today = get_msk_now().strftime("%Y-%m-%d")
    cache_key = f"daily:{user.id}:{today}"

    cached = await redis_client.get(cache_key)
    if not cached:
        raise HTTPException(status_code=404, detail="daily_suggestions_not_found")

    suggestions = json.loads(cached)
    if not (0 <= index < len(suggestions)):
        raise HTTPException(status_code=400, detail="invalid_suggestion_index")

    # Enforce active quest slot cap
    count_res = await db.execute(
        select(func.count(models.Quest.id)).filter(
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False,
        )
    )
    active_count = count_res.scalar()
    if active_count >= MAX_ACTIVE_QUESTS:
        raise HTTPException(status_code=409, detail="active_limit_reached")

    suggestion = suggestions[index]
    quest = models.Quest(
        user_id=user.id,
        title=suggestion["title"],
        difficulty=suggestion["difficulty"],
        xp_reward=suggestion["xp"],
        gold_reward=suggestion["gold"],
        hp_penalty=suggestion["hp_penalty"],
        deadline=today,
        category=suggestion["category"],
        is_completed=False,
        is_failed=False,
    )
    db.add(quest)
    await db.commit()
    await db.refresh(quest)

    # Remove accepted suggestion; persist remaining or delete cache
    suggestions.pop(index)
    if suggestions:
        await redis_client.setex(cache_key, _seconds_until_midnight_msk(), json.dumps(suggestions))
    else:
        await redis_client.delete(cache_key)

    return {
        "quest_id": quest.id,
        "remaining_suggestions": suggestions,
    }


@router.post("/api/daily/reroll/{index}", response_model=DailySuggestionsResponse)
async def reroll_daily_suggestion(
    index: int,
    user: models.User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(cache.get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Replace one suggestion with a new LLM suggestion (reroll cap: 2/day)."""
    today = get_msk_now().strftime("%Y-%m-%d")
    cache_key = f"daily:{user.id}:{today}"
    reroll_key = f"rerolls:{user.id}:{today}"

    # Check reroll limit before consuming
    rerolls_used = int(await redis_client.get(reroll_key) or 0)
    if rerolls_used >= MAX_REROLLS_PER_DAY:
        raise HTTPException(status_code=429, detail="daily_reroll_limit_reached")

    # Increment counter atomically; set TTL on first reroll
    new_count = await redis_client.incr(reroll_key)
    if new_count == 1:
        await redis_client.expire(reroll_key, _seconds_until_midnight_msk())

    cached = await redis_client.get(cache_key)
    if not cached:
        raise HTTPException(status_code=404, detail="daily_suggestions_not_found")

    suggestions = json.loads(cached)
    if not (0 <= index < len(suggestions)):
        raise HTTPException(status_code=400, detail="invalid_suggestion_index")

    # Generate a single replacement suggestion (empty history for simplicity)
    new_suggestions = await _generate_suggestions_llm(user, history=[])
    suggestions[index] = new_suggestions[0]

    ttl = _seconds_until_midnight_msk()
    await redis_client.setex(cache_key, ttl, json.dumps(suggestions))

    reset_time = (
        get_msk_now() + timedelta(days=1)
    ).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    return DailySuggestionsResponse(
        suggestions=[DailySuggestion.model_validate(s) for s in suggestions],
        rerolls_remaining=max(0, MAX_REROLLS_PER_DAY - new_count),
        reset_time=reset_time,
    )
