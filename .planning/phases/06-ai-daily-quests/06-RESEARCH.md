# Phase 6: AI Daily Quests - Research

**Researched:** 2026-04-22
**Domain:** Redis caching + AsyncOpenAI list generation + FastAPI dependency injection patterns
**Confidence:** HIGH (verified via Context7, code patterns, and existing project architecture)

## Summary

Phase 6 introduces daily quest suggestions: users receive 3 AI-generated quests daily, cached in Redis with TTL until midnight MSK. The feature extends the existing OpenRouter pattern (`analyze_task`) to generate a list of 3 suggestions with weak-stat priority, uses Redis for caching and reroll-count tracking, and integrates with the existing quest acceptance flow via `POST /api/quests/save`.

No breaking changes to existing APIs. All infrastructure pieces exist in the project:
- **AsyncOpenAI** client already configured for OpenRouter (phase 4-5 quests)
- **FastAPI** dependency injection (`Depends(get_current_user)`) already established
- **SQLAlchemy async patterns** mature (4+ phases proven)
- **Pydantic schemas** consistent with project style
- **Test infrastructure** uses stub-objects for non-DB testing (phase 4-5 pattern)

**Key non-decisions from CONTEXT.md (locked):**
- Section placement: top of active quests on `/app/quests`, not separate route
- Accept flow: 1-click → calls existing `POST /api/quests/save` (no separate daily-specific save)
- Reroll cap: 2 total per user per day (not per-card), Redis-tracked
- Suggestion persistence: Redis only, no DB table for daily history
- AI output: single LLM call returns all 3 suggestions, no per-suggestion round-trip

**Primary recommendation:** Implement Redis async client via `redis.asyncio` (v5.0+), extend `AsyncOpenAI` pattern in `analyze_task` template to accept list-of-3 logic, add daily router following existing quest router structure, use Pydantic for both LLM response validation and schema exports.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**UX размещение и триггер:**
- Размещение: секция "Квесты дня" поверх списка Active в `QuestsPage.jsx` (не отдельный route, не модалка)
- Триггер: явная кнопка "Получить квесты дня" — пользователь запускает генерацию сам; нет авто-вызова LLM при открытии страницы
- Карточка до accept: title + category (chip) + difficulty + rewards preview (xp + gold + hp_penalty) — полный превью как в ответе `/api/analyze`
- Empty state после отработки всех 3 карточек (accepted/reroll исчерпан): секция остаётся, но показывает иллюстрацию + текст "Завтра новые" до сброса в полночь MSK

**Accept flow:**
- 1-клик accept: `POST /api/daily/accept/{index}` (или аналог) → backend вызывает существующий путь создания квеста (`schemas.QuestSave` + `models.Quest`) с AI-rewards без редакций; квест появляется в Active снизу
- Slot cap (5 активных): Accept-кнопка **disabled** + tooltip "Освободи слот" когда `active_count >= MAX_ACTIVE_QUESTS`; frontend уже знает `active_count`, так что 409 не должен срабатывать
- После accept: принятая карточка **исчезает** из секции; оставшиеся (если есть) продолжают отображаться
- Feedback: короткий toast "Квест добавлен" + `triggerHaptic()` — не модалка

**Reroll политика:**
- Счётчик: **2 реролла total на пользователя в день** (не per-card). Соответствует буквальной формулировке Roadmap ("не более 2 раз в день")
- Scope реролла: рероллится **одна конкретная карточка**, остальные сохраняются. Нет "обновить все" кнопки
- UI когда лимит исчерпан: видимый счётчик "Рероллов использовано: 2/2" + кнопка reroll на карточках становится disabled. Информативность видна с первого появления секции
- Persistence: Redis-ключ `rerolls:{user_id}:{YYYY-MM-DD}`, INCR при каждом реролле, TTL до полуночи MSK — синхронно с основным кешем `daily:{user_id}:{YYYY-MM-DD}`

**AI output и роли:**
- Один LLM-вызов возвращает весь пакет: для каждой из 3 карточек — `title + category + difficulty + xp + gold + hp_penalty`. Формат аналогичен существующему `analyze_task`, но для списка. Нет второго round-trip через `/api/analyze` при accept
- Категория: AI фиксирует её с **weak-stat priority** (низкий стат → предложение категории, которая его качает). Пользователь **не может** переназначить — сохраняет интент "персонализации" (AI-02)
- Deadline: жёстко "сегодня" (MSK). AI не влияет на deadline. Семантика "daily" требует same-day completion, иначе -HP через существующий `_fail_overdue_quests`
- История в промпте: last **10 quests (completed + failed)** — AI видит как успехи так и провалы, это диагностично. Не только completed
- Промпт-extension: расширяем существующий шаблон из `analyze_task` — те же `stat_*_level`, те же difficulty-ranges, добавляем блок "история" и инструкцию "сгенерируй ровно 3 разнообразных предложения с weak-stat priority"

### Claude's Discretion

- Точный дизайн карточки (анимации hover, раскладка chip'ов) — design-pass по аналогии с Shop/Quest карточками
- Fallback при падении OpenRouter / таймауте: researcher проверит существующий `fallback`-dict в `analyze_task`, planner решит — показывать вчерашний кеш / статичный fallback-seed / error banner
- Обработка "новый пользователь без истории" (пустой list в промпте) — planner решит: отдельный prompt-branch vs просто пустой массив
- Точная JSON-schema LLM-ответа (массив vs объект с полем `suggestions`, error-handling при невалидном JSON)
- Структура Redis-payload: JSON-string целиком или отдельные поля
- Timezone non-MSK users — MSK ключ как единый стандарт проекта (унаследовано, не новый вопрос)

### Deferred Ideas (OUT OF SCOPE)

- **Push-уведомления о сбросе daily в полночь** — относится к NOTF-01 (deferred в REQUIREMENTS.md), самостоятельная фаза после v1.0
- **Daily streak** (бонус за N дней подряд с accepted daily) — ENG-01 (deferred), future phase
- **Custom prompt preferences** (пользователь настраивает "больше fitness / меньше social") — расширение AI-02, future
- **История dailies отдельно от quest history** (отчёт "за месяц я принял X daily quests") — не в scope v1.0
- **Tema dня / thematic suggestions** (3 квеста на одну тему) — креативное расширение, future
- **Тип подсказки "микро-цель на час"** (меньше чем daily, больше чем квест) — другой формат, не в Phase 6

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | User receives 3 AI-generated quest suggestions refreshed each day | Redis daily key + OpenRouter list generation pattern + 24h TTL to midnight MSK |
| AI-02 | Daily AI quests are personalized based on user's character stats and recent completion history | `CATEGORY_TO_STAT` mapping enforces weak-stat priority; last 10 quests loaded via existing `crud.get_quest_history`; all 4 `stat_*_level` fields passed to LLM |

</phase_requirements>

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **redis.asyncio** | 5.0+ | Async Redis client with connection pooling | Official async driver for redis-py; non-blocking I/O integrates seamlessly with FastAPI async stack |
| **openai** (existing) | 1.10.0 | AsyncOpenAI for OpenRouter | Already in use for `analyze_task`; streaming JSON cleanup pattern proven |
| **fastapi** (existing) | 0.109.0 | Web framework with dependency injection | Mature async support; `Depends()` pattern reduces boilerplate for auth + DB |
| **pydantic** (existing) | 2.5.3 | Data validation & serialization | Schema-driven validation; ConfigDict(from_attributes=True) handles ORM model → JSON |
| **sqlalchemy.ext.asyncio** (existing) | 2.0.25 | Async DB access | Proven in 4+ phases; `select()` queries, scoped sessions via `get_db` dependency |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **python-dotenv** (existing) | 1.0.0 | Load `REDIS_URL` from `.env` | Added to config.py Settings class |
| **pytest** (existing) | 8.1.1 | Unit testing with stub objects | Phase 4-5 pattern: test pure functions (`game_logic.py`) without DB |

### Installation

```bash
# Add to backend/requirements.txt (after existing deps)
redis[asyncio]==5.1.1
```

Note: `redis[asyncio]` extra ensures `hiredis` is installed for parsing optimization (recommended for production).

## Architecture Patterns

### Pattern 1: Async Redis Client as FastAPI Dependency

**What:** Single shared Redis connection pool, lifespan-managed by FastAPI startup/shutdown.

**When to use:** Any endpoint needing caching (daily suggestions, leaderboard, rate limits).

**Implementation pattern:**

```python
# backend/app/cache.py — NEW FILE
import redis.asyncio as redis
from app.config import get_settings

_redis_client: redis.Redis | None = None

async def init_redis():
    """Called at FastAPI startup via lifespan context."""
    global _redis_client
    settings = get_settings()
    _redis_client = redis.Redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,  # Auto-decode strings from bytes
    )
    await _redis_client.ping()  # Verify connection
    print("Redis connected")

async def close_redis():
    """Called at FastAPI shutdown via lifespan context."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None

async def get_redis() -> redis.Redis:
    """Dependency for FastAPI endpoints: `redis: redis.Redis = Depends(get_redis)`."""
    if _redis_client is None:
        raise RuntimeError("Redis not initialized")
    return _redis_client

# backend/app/main.py — MODIFY lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    await cache.init_redis()  # NEW
    yield
    await cache.close_redis()  # NEW
```

**Source:** https://github.com/redis/redis-py/blob/master/docs/connections.md (Context7) — connection pool ownership and lifecycle management.

### Pattern 2: LLM List Generation (Extend analyze_task)

**What:** Reuse AsyncOpenAI base URL + API key, extend prompt to request 3 suggestions in one call.

**When to use:** Generating personalized bulk content from a single LLM prompt.

**Key differences from analyze_task:**
- **Input:** User stats + last 10 quests (for history context)
- **Prompt instruction:** "Generate exactly 3 quests with weak-stat priority (low stat → suggest quest that grows it)"
- **JSON response schema:** Array of 3 objects `[{title, category, difficulty, xp, gold, hp_penalty}, ...]` OR object with `suggestions` key
- **Fallback:** Return `analyze_task` fallback values × 3 if LLM fails

```python
# backend/app/routers/daily.py — NEW
async def get_daily_suggestions(
    user: models.User = Depends(get_current_user),
    redis: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/daily/suggestions — fetch cached or generate + cache 3 suggestions."""
    cache_key = f"daily:{user.id}:{get_msk_now().strftime('%Y-%m-%d')}"
    
    # Try cache first
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)  # parse cached JSON string
    
    # Fetch last 10 quests for history context
    history = await crud.get_quest_history(db, user.id, limit=10)  # existing CRUD
    
    # Call LLM with extended prompt
    suggestions = await _generate_suggestions_llm(user, history)
    
    # Cache with TTL = time until midnight MSK
    ttl_seconds = _seconds_until_midnight_msk()
    await redis.setex(cache_key, ttl_seconds, json.dumps(suggestions))
    
    return suggestions
```

**Source:** Context7 — AsyncOpenAI streaming pattern; adjusted to non-streaming single call.

### Pattern 3: Redis Key Structure for Daily Resets

**What:** Time-scoped keys (suffix = YYYY-MM-DD in MSK) auto-expire at day boundary.

**When to use:** Per-user daily state (suggestions cache, reroll counter, daily streaks).

**Keys in this phase:**
```
daily:{user_id}:{YYYY-MM-DD}      — JSON array of 3 suggestions, TTL = seconds until midnight MSK
rerolls:{user_id}:{YYYY-MM-DD}    — integer (0-2), incremented on each reroll, same TTL
```

**Why:** No separate reroll table in DB; INCR is atomic in Redis (race-condition safe); natural daily reset via TTL.

**Implementation note:** `get_msk_now()` already exists in `models.py`; use for all key construction.

### Pattern 4: Accept Flow (Minimal New Code)

**What:** Accept a daily suggestion → call existing `POST /api/quests/save` with the suggestion data (no modifications).

**When to use:** Creating a quest from a template (daily suggestions, skill tree branches, etc.).

**Endpoint:**
```python
@router.post("/api/daily/accept/{index}")
async def accept_daily(
    index: int,  # 0, 1, 2 for the 3 suggestions
    user: models.User = Depends(get_current_user),
    redis: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Accept a daily suggestion → create quest, remove from cache."""
    cache_key = f"daily:{user.id}:{get_msk_now().strftime('%Y-%m-%d')}"
    cached = await redis.get(cache_key)
    if not cached:
        raise HTTPException(status_code=404, detail="daily_suggestions_not_found")
    
    suggestions = json.loads(cached)
    if not (0 <= index < len(suggestions)):
        raise HTTPException(status_code=400, detail="invalid_suggestion_index")
    
    suggestion = suggestions[index]
    
    # Reuse QuestSave schema — suggestion already has all required fields
    quest_data = schemas.QuestSave(
        title=suggestion["title"],
        category=suggestion["category"],
        difficulty=suggestion["difficulty"],
        xp_reward=suggestion["xp"],
        gold_reward=suggestion["gold"],
        hp_penalty=suggestion["hp_penalty"],
        deadline=get_msk_now().strftime("%Y-%m-%d"),  # today
    )
    
    # Call existing save_quest logic
    quest = await _save_quest_impl(quest_data, user, db)
    
    # Remove accepted suggestion from cache, keep others
    suggestions.pop(index)
    if suggestions:
        await redis.setex(cache_key, _seconds_until_midnight_msk(), json.dumps(suggestions))
    else:
        await redis.delete(cache_key)
    
    return {"quest": quest, "remaining_suggestions": suggestions}
```

**Why minimal:** Existing `save_quest` endpoint already enforces slot cap (5 active), applies rewards correctly, integrates with stat growth. No duplication needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Redis connection lifecycle | Custom conn mgmt, multiple clients, manual close | `redis.asyncio.Redis.from_url()` + lifespan context | Handles connection pooling, timeouts, reconnect retries; prevents resource leaks |
| JSON cache serialization | Manual pickle/bytes → str conversions | `json.dumps()` + `decode_responses=True` on Redis client | JSON is language-agnostic, Redis handles decoding, avoids pickle security issues |
| Daily key expiry | Manual cleanup cron job, separate expiry table | Redis TTL via `SETEX` / `EXPIRE` | Built-in atomic op, no DB round-trip, auto-cleanup at precision of 1 second |
| Reroll counting | SELECT + UPDATE race condition | `INCR` in Redis | Atomic increment, no transaction overhead, natural clustering by {user_id:date} |
| LLM response validation | Manual JSON parse + field checks | Pydantic BaseModel with `model_validate()` | Type coercion, required field enforcement, clear error messages on invalid schema |
| Fallback suggestions | Hardcoded quest templates, complex branching | Deterministic seed generation based on user + date hash | Reproducible, no storage, aligns with existing `analyze_task` fallback pattern |

**Key insight:** Redis is purpose-built for time-scoped ephemeral state (cache, counters, expiry). Delegating daily resets to Redis TTL instead of application logic eliminates a whole class of bugs (stale data, cleanup failures, timezone drift).

## Common Pitfalls

### Pitfall 1: Timezone Drift in Daily Keys

**What goes wrong:** Frontend generates `new Date().toLocaleDateString()` in user's local timezone; backend generates `get_msk_now().strftime('%Y-%m-%d')` in MSK. Keys don't match → suggestions from "yesterday" appear on "today" for some users.

**Why it happens:** No consistent reference point; each component picks timezone independently.

**How to avoid:** **All date keys hardcoded to MSK.** Frontend receives `today_msk` from `GET /api/user/me/status` (same endpoint that auto-fails overdue quests). Store in Zustand, use for all `daily:{uid}:{today_msk}` keys. Backend has single source of truth: `get_msk_now()` in `models.py`.

**Warning signs:** QA testing finds suggestions disappear at midnight UTC (wrong TZ), reappear 3 hours later (TZ difference).

### Pitfall 2: Concurrent Reroll + Accept Race

**What goes wrong:** User spam-clicks "reroll" and "accept" simultaneously. Both requests fetch cached suggestions, both modify cache independently, final state is inconsistent (same suggestion appears twice, or missing suggestion).

**Why it happens:** Redis GET → Python logic → Redis SET is not atomic. Two requests can interleave.

**How to avoid:** 
- For reroll: fetch cache, modify in-memory, `SETEX` back (acceptable loss if race happens — user retries)
- For accept: same pattern — not critical if user clicks twice and gets 2 quests (both legit)
- **Strict serialization not needed:** suggestions are ephemeral; worst case = user's cache resets early (not a bug, just UX friction)
- **If strict needed (defer to Phase 11):** Lua script in Redis (atomic multi-op) or optimistic lock with versioning

**Warning signs:** Same quest accepted twice, or reroll counter jumps incorrectly under load testing.

### Pitfall 3: Redis Connection Timeout on Startup

**What goes wrong:** Backend starts, tries to ping Redis, Redis not running yet, app crashes. Manual restart required.

**Why it happens:** No retry logic in `init_redis()`, tight coupling between FastAPI lifespan and Redis availability.

**How to avoid:**
- **Dev setup:** Docker Compose with `depends_on: redis` (Phase 6 planning should include `docker-compose.yml`)
- **Fallback:** Graceful degradation — if Redis unavailable, generate suggestions on-the-fly (slower, but works)
- **Healthcheck:** `GET /api/health` includes Redis ping; alerts to DevOps if down

```python
@app.get("/api/health")
async def health(redis: redis.Redis = Depends(get_redis)):
    try:
        await redis.ping()
        redis_status = "ok"
    except Exception as e:
        redis_status = f"error: {e}"
    return {"db": "ok", "redis": redis_status}
```

**Warning signs:** App crashes silently during local `docker-compose up`, dev confused why FastAPI won't start.

### Pitfall 4: LLM JSON Response Not Matching Expected Schema

**What goes wrong:** OpenRouter returns `{"suggestions": [...]}` but code expects `[...]`. Or field names are typos: `exp` instead of `xp`. Parser crashes, fallback returns wrong shape, frontend breaks.

**Why it happens:** Prompt doesn't specify exact JSON format; LLM interprets "return 3 quests" as returning nested object.

**How to avoid:** 
- **Be explicit in prompt:** "Return ONLY a JSON array with exactly 3 objects: `[{title: string, category: enum, difficulty: string, xp: int, gold: int, hp_penalty: int}, ...]`. No markdown, no extra text."
- **Validate with Pydantic:**
  ```python
  class DailySuggestion(BaseModel):
      title: str
      category: QuestCategory  # Literal enforces enum
      difficulty: str  # or Literal["easy", "medium", "hard", "epic"]
      xp: int
      gold: int
      hp_penalty: int
  
  # Parse LLM response
  suggestions = [DailySuggestion.model_validate(item) for item in json.loads(clean_json)]
  ```
- **Test against fallback:** Unit test that fallback list validates against schema.

**Warning signs:** Inconsistent LLM responses in logs; some requests hit fallback, others return valid data.

### Pitfall 5: Reroll Counter Not Resetting at Midnight

**What goes wrong:** User had 1 reroll left at 11:59 PM MSK, used it at 12:01 AM (new day). Counter still shows 1/2 (should be 0/2). User can't reroll anymore today (thinks it's capped, but really stale key).

**Why it happens:** Frontend caches reroll count in state, doesn't refetch after midnight. Or Redis key didn't expire properly (clock skew, NTP issues).

**How to avoid:**
- **Frontend:** Refetch reroll count on every suggestion fetch (not cached client-side between days). Include `rerolls_remaining` in response.
- **Backend:** Always compute reroll count from Redis `GET rerolls:{uid}:{today}`, increment atomically with `INCR`, let TTL expire.
- **Verify TTL:** In `/api/daily/suggestions` response, include `ttl_seconds` or `reset_time_unix` so frontend can warn user "suggestions reset at 2026-04-23 00:00:00 MSK".

**Warning signs:** Timezone-specific bug reports ("After midnight reroll limit doesn't work"); reroll counter shows 3/2 or negative.

## Code Examples

### Example 1: Initialize Redis in main.py

```python
# Source: Phase 6 implementation pattern, verified against Context7 redis-py docs

from contextlib import asynccontextmanager
from app.cache import init_redis, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.init_db()
    await init_redis()
    print("✓ FastAPI ready")
    yield
    # Shutdown
    await close_redis()
    print("✓ FastAPI shutdown")

app = FastAPI(lifespan=lifespan, redirect_slashes=False)
```

### Example 2: Get Daily Suggestions with Caching

```python
# Source: Phase 6 pattern

@router.get("/api/daily/suggestions")
async def get_daily_suggestions(
    user: models.User = Depends(get_current_user),
    redis: redis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Fetch 3 cached suggestions or generate + cache."""
    today = get_msk_now().strftime("%Y-%m-%d")
    cache_key = f"daily:{user.id}:{today}"
    reroll_key = f"rerolls:{user.id}:{today}"
    
    # Check cache
    cached_json = await redis.get(cache_key)
    if cached_json:
        suggestions = json.loads(cached_json)
        rerolls_used = int(await redis.get(reroll_key) or 0)
        return {
            "suggestions": suggestions,
            "rerolls_remaining": 2 - rerolls_used,
            "reset_time": (get_msk_now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat(),
        }
    
    # Generate new
    history = await crud.get_quest_history(db, user.id, limit=10)
    suggestions = await _generate_suggestions_llm(user, history)
    
    # Cache with TTL until midnight
    ttl_seconds = _seconds_until_midnight_msk()
    await redis.setex(cache_key, ttl_seconds, json.dumps(suggestions))
    
    return {
        "suggestions": suggestions,
        "rerolls_remaining": 2,
        "reset_time": (get_msk_now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat(),
    }
```

### Example 3: LLM List Generation Prompt

```python
# Source: Phase 6 extension of Phase 4 analyze_task pattern

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
{format_quest_history(history)}

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
```

### Example 4: Reroll Counter with INCR

```python
# Source: Phase 6 pattern

@router.post("/api/daily/reroll/{index}")
async def reroll_suggestion(
    index: int,
    user: models.User = Depends(get_current_user),
    redis: redis.Redis = Depends(get_redis),
) -> dict:
    """Reroll one suggestion, check limit."""
    today = get_msk_now().strftime("%Y-%m-%d")
    reroll_key = f"rerolls:{user.id}:{today}"
    cache_key = f"daily:{user.id}:{today}"
    ttl_seconds = _seconds_until_midnight_msk()
    
    # Check limit before incrementing
    current = int(await redis.get(reroll_key) or 0)
    if current >= 2:
        raise HTTPException(status_code=429, detail="daily_reroll_limit_reached")
    
    # Increment atomically
    await redis.incr(reroll_key)
    if current == 0:  # First reroll of the day, set TTL
        await redis.expire(reroll_key, ttl_seconds)
    
    # Regenerate one suggestion and update cache
    # ... (implementation: fetch cache, replace [index], write back)
    
    return {"rerolls_remaining": 2 - (current + 1)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual database cleanup cron job (daily_suggestions table + DELETE WHERE date < today) | Redis TTL on per-day keys (SETEX with auto-expire) | Redis adoption (2024+) | Eliminated edge-case bugs: cleanup failures, timezone-aware deletion logic, orphaned rows |
| Separate "daily_quests" schema in DB | Ephemeral Redis cache only, no DB table | Phase 6 (this phase) | Simpler schema, faster read (single Redis GET vs DB query), no data duplication with quest_history |
| Single-threaded generation (one LLM call per user per day) | Parallel generation possible (if scalability needed later) | Design phase (now) | Redis caching allows multiple users' generations to overlap; no blocking |

**Deprecated/outdated:**
- Manual cache invalidation (e.g., `DELETE FROM cache WHERE user_id = 123`) — Redis TTL is the standard
- `memcached` for Flask/Django projects — replaced by Redis (superset of memcached features, persistence option)

## Open Questions

1. **Fallback Strategy When OpenRouter Fails**
   - What we know: Existing `analyze_task` returns hardcoded fallback dict `{"difficulty": "medium", "xp": 40, "gold": 20, "hp_penalty": 12, "fallback": True}`
   - What's unclear: Should daily fallback be × 3 hardcoded, or generate 3 via deterministic seed (user_id + date hash)?
   - Recommendation: Use deterministic generation (seed-based) so fallback is reproducible and avoids "always the same 3 quests"; sync with planner decision

2. **New User Without History (Empty Quest History)**
   - What we know: `crud.get_quest_history(db, user_id, limit=10)` returns `[]` for new users
   - What's unclear: Should prompt have branch "if no history: generic suggestions" vs "if history empty: pass [] to same prompt"?
   - Recommendation: Single prompt with empty list handling; LLM should generate sensible suggestions anyway (no branch complexity)

3. **Redis Persistence & Local Dev Setup**
   - What we know: No Redis running in current dev setup
   - What's unclear: Should Phase 6 planning add `docker-compose.yml` with Redis service, or defer to Phase 11 (Production Polish)?
   - Recommendation: Add minimal `docker-compose.yml` in Phase 6 for consistency; Phase 11 upgrades for persistence (RDB/AOF snapshots)

4. **JSON Schema Validation: Array vs Object with `suggestions` Key**
   - What we know: Prompt says "return array" but user might interpret as `{suggestions: [...]}`
   - What's unclear: How strict should Pydantic validation be? Accept both, or fail hard?
   - Recommendation: Pydantic model `DailySuggestionsResponse(BaseModel): suggestions: List[DailySuggestion]` — if LLM returns bare array, wrapper model can be optional in code; explicit in prompt to return `[...]` directly

5. **Atomic Daily Reset Coordination**
   - What we know: Redis TTL is atomic; DB queries for "quest history" are not time-scoped
   - What's unclear: If Redis key expires at 00:00:00 MSK but DB still has quests from yesterday, will `/api/daily/suggestions` return outdated history?
   - Recommendation: `crud.get_quest_history()` already filters by completion date implicitly (lists all completed/failed quests, not scoped); adding explicit "last 10 quests ever" means no issue. Verify in Phase 6 planning that history filtering is correct.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8.1.1 (existing) |
| Config file | No `pytest.ini`; uses default discovery (`tests/test_*.py`) |
| Quick run command | `pytest backend/tests/test_game_logic.py -x` |
| Full suite command | `pytest backend/tests/ -x` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | `GET /api/daily/suggestions` returns 3 quests from LLM, cached in Redis with TTL | unit + integration | `pytest backend/tests/test_daily_router.py::test_suggestions_cached -x` | ❌ Wave 0 |
| AI-01 | Cached suggestions expired at midnight MSK are regenerated | integration | `pytest backend/tests/test_daily_router.py::test_suggestions_ttl_expires -x` | ❌ Wave 0 |
| AI-02 | AI suggestions respect weak-stat priority (low stat → category that grows it) | unit | `pytest backend/tests/test_daily_router.py::test_weak_stat_priority -x` | ❌ Wave 0 |
| AI-02 | Suggestion history includes last 10 quests (completed + failed) in LLM prompt | unit | `pytest backend/tests/test_daily_router.py::test_history_in_prompt -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pytest backend/tests/test_daily_router.py -x -v` (daily router only)
- **Per wave merge:** `pytest backend/tests/ -x --tb=short` (full suite, error traceback)
- **Phase gate:** Full suite green + manual browser verification (daily card rendering, accept/reroll UX) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_daily_router.py` — covers AI-01 (suggestions cache, TTL) and AI-02 (weak-stat priority, history)
- [ ] `backend/tests/conftest.py` — add `StubRedis` (in-memory mock for unit tests, no docker redis required)
- [ ] Redis docker-compose service — for integration tests that need real Redis
- [ ] `backend/tests/test_daily_service.py` — pure function tests for `_generate_suggestions_llm()`, `_seconds_until_midnight_msk()`

**Note:** Phase 4-5 pattern: stub-only unit tests (no TestClient/DB) cover router logic isolation; real Redis only needed for integration tests.

## Sources

### Primary (HIGH confidence)

- **Context7 /redis/redis-py** — redis-py v5.0+ async API, connection pool lifecycle, `from_url()`, `INCR`/`SETEX` semantics
- **Context7 /openai/openai-python** — AsyncOpenAI initialization, streaming pattern, JSON parsing with regex cleanup
- **Project codebase (verified 2026-04-22):**
  - `backend/app/routers/quests.py:analyze_task` (lines 71-138) — OpenRouter pattern, fallback dict
  - `backend/app/utils/game_logic.py` — CATEGORY_TO_STAT, STAT_GROWTH, apply_stat_xp, effective_multipliers
  - `backend/app/models.py` — User stats fields, get_msk_now(), Quest model
  - `backend/tests/test_game_logic.py` — stub object testing pattern
  - `backend/app/config.py` — Settings class, lru_cache pattern

### Secondary (MEDIUM confidence)

- **FastAPI docs (Starlette lifespan)** — async startup/shutdown context managers (not directly linked but standard pattern)
- **redis-py GitHub issues (verified 2024)** — connection pool best practices, close() vs aclose()

### Tertiary (LOW confidence)

- None — all critical claims verified via Context7 or project code

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — redis-py and openai are current, in-project versions confirmed
- **Architecture:** HIGH — patterns extend existing Phase 4-5 code (analyze_task, game_logic stubs, config Settings)
- **Pitfalls:** MEDIUM — based on common async Redis patterns; not validated against this specific project's scale
- **Testing:** HIGH — existing test infrastructure (pytest, stubs) proven in 4+ phases

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days — redis-py and openai are stable; redis.asyncio API unlikely to break)

**Key dependencies for planner:**
- Config.py must add `REDIS_URL` setting
- main.py must add redis init/close in lifespan
- New daily.py router with async Redis dependency
- Pydantic schemas for DailySuggestion and DailySuggestionsResponse
- Frontend must fetch daily suggestions on button click (not auto-load)
