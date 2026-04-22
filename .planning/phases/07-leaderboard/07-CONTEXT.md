# Phase 7: Leaderboard - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Глобальный публичный лидерборд игроков, ранжированный по уровню и прогрессу XP. Два API-эндпоинта (`GET /api/leaderboard` для топа с offset/limit; `GET /api/leaderboard/me` для позиции юзера и окружения), Redis sorted set как основное хранилище ранга (inline-обновление при начислении XP), страница `/app/leaderboard` с плашкой "Ты" и подсветкой юзера в top-100. Клик по чужой строке ничего не делает (публичный профиль — Phase 8).

**Вне скоупа:** friends-leaderboard, guild-leaderboard, публичный профиль игрока, анти-чит, real-time push, opt-out hide-me-from-leaderboard.

</domain>

<decisions>
## Implementation Decisions

### Privacy & Display Identity

- **Основное имя:** `users.display_name`. Fallback-цепочка: `display_name` → `username` (легаси TG-поле) → `"Игрок #{user.id}"`.
- **Opt-out из лидерборда:** нет в v1.0. Все пользователи участвуют автоматически (`display_name` — псевдоним, юридически ок).
- **Клик по чужой строке:** ничего не делает. Public profile и friend-add — Phase 8.

### Display Columns

Строка таблицы: **rank + avatar + display_name + lvl + xp**.

- `avatar` — из `users.selected_avatar` (есть в модели).
- `xp` показывается как число (не progress-bar) — финальный формат оформления на усмотрение при планировании.
- `char_class` из текущего stub-UI **убирается** — не в ROADMAP-спеке.

### Ranking Formula

- **Первичный ключ:** `lvl DESC`.
- **Вторичный:** `xp DESC` (xp до следующего уровня).
- **Tie-break:** `user.id ASC` — при равных lvl+xp старшие (меньший id, более ранняя регистрация) выше.
- **Предположение о max lvl:** <1000 игроков достигают lvl≥1000 в v1.0 (формула работает в пределах 53-bit JS number precision).

### Redis ZSET Score Encoding

- **Key:** `leaderboard:global`.
- **Member:** `str(user.id)`.
- **Score (float):** `lvl * 1e12 + xp * 1e6 - user.id`
  - Подразумевает lvl ∈ [1, 999], xp ∈ [0, 999999], id ∈ [1, 999999].
  - Score монотонно растёт при level-up (убытие xp = -xp*1e6, прибыль lvl = +1e12).
  - Вычитание `user.id` делает старших пользователей выше при абсолютном равенстве.
- **Чтение:** `ZREVRANGE` для top-N (индексы 0..N-1), `ZREVRANK` для `/me`.

### Level-Up XP Behavior (observed, not decided)

Текущая логика в `crud.add_reward` (`backend/app/crud.py:60-64`):
```python
while user.xp >= user.max_xp:
    user.xp -= user.max_xp   # xp вычитается, не обнуляется
    user.lvl += 1
    user.max_xp = int(user.max_xp * 1.2)  # +20% threshold
```

→ xp монотонно не убывает внутри уровня; при level-up вычитается `max_xp`; composite score всё равно монотонно растёт.

### Pagination & Top Endpoint

- **UI top-список:** fixed top-100 одним запросом (как сейчас в stub).
- **API контракт:** `GET /api/leaderboard?offset=0&limit=50` поддерживает `offset` и `limit` (ROADMAP Success Criteria 2). `limit` максимум 100, default 50.
- **Response shape:**
  ```json
  { "entries": [{ "rank": 1, "user_id": 42, "display_name": "...", "avatar": "...", "lvl": 14, "xp": 450 }, ...], "total": 123 }
  ```
- **Infinite scroll:** не требуется в v1.0. Если база вырастет выше 100 активных игроков, расширим UI позже.

### "Me" Endpoint & Around-User Section

- **API:** `GET /api/leaderboard/me` возвращает `{ rank, total_users, neighbors: [...] }`, где `neighbors` — до 11 записей (сам юзер + до 5 выше + до 5 ниже).
- **Контракт ROADMAP сохранён** (Success Criteria 3: "позиция и ±5 вокруг").
- **Edge ranks:** если rank=1, `neighbors` = [сам, 2, 3, 4, 5, 6] (6 записей). Без фейк-расширения до 11; возвращаем ровно то, что есть.
- **UI v1.0:** отображает только плашку `{display_name, rank}` сверху страницы; поле `neighbors` доступно в ответе, но не рендерится (задел на будущее расширение, когда rank>100).
- **Подсветка в top-100:** если rank≤100, строка юзера в общей таблице получает визуальный акцент (как сейчас золотой bg в stub).

### Update Propagation

- **Когда:** inline в `crud.add_reward` после `db.commit()`. Обновление ZSET — часть одного HTTP-запроса quest-complete.
- **Graceful degradation:** если Redis недоступен во время ZADD — log warning, quest всё равно засчитывается. Лидерборд отстанет до следующего успешного update для этого юзера или до re-seed. Повторяет паттерн `cache.py:27-32`.
- **Пересчёт при смене display_name:** никакого. ZSET хранит только user_id; display_name подтягивается из PG на чтении — всегда актуально.

### Initial Seed & Redis Loss Recovery

- **Lazy rebuild в FastAPI lifespan startup:**
  1. Проверить `EXISTS leaderboard:global` / `ZCARD`.
  2. Если ключа нет или кардинальность 0 — батч-`ZADD` всех юзеров из PG (`SELECT id, lvl, xp FROM users`).
  3. Это автоматически восстанавливает ZSET после потери Redis или рестарта с пустым кэшем.
- **Без отдельного admin-эндпоинта** (можно добавить позже, если понадобится принудительный rebuild без рестарта).
- **First deploy:** при первом запуске после Phase 7 кода lazy rebuild засеет существующих юзеров. Миграция не требуется.

### Claude's Discretion

- Exact styling of the user's rank plate (keep glass-morphism pixel aesthetic from current stub).
- Loading skeleton vs spinner при первичной загрузке.
- Error UX (retry button vs toast) при ошибке API.
- Пиксельные детали подсветки top-3 (golden/silver/bronze или только gold).
- Batch size для lazy rebuild (разумный default 500 per ZADD call).
- Тексты сообщений ошибок.
- Виртуализация списка (если 100 строк тормозят на mobile).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`backend/app/cache.py`** — готовый Redis connection pool с `init_redis()`, `close_redis()`, `get_redis()` FastAPI dependency. Phase 7 переиспользует без изменений.
- **`backend/app/routers/daily.py`** — образцовый паттерн нового роутера: `APIRouter`, эндпоинты с `Depends(cache.get_redis)`, `Depends(get_current_user)`, `Depends(get_db)`. Phase 7 повторяет ту же структуру.
- **`backend/app/crud.py:add_reward` (строки 51-68)** — единственная точка начисления XP/level-up. Phase 7 расширяет её вызовом `leaderboard.update(user)` после `db.commit()`.
- **`backend/app/dependencies.py:get_current_user`** — JWT dep готов.
- **`backend/app/models.py:User`** — все нужные поля есть: `id`, `display_name` (nullable), `username`, `selected_avatar`, `lvl`, `xp`.
- **`frontend/src/pages/LeaderboardPage.jsx`** — UI-скелет с glass-morphism пиксельной эстетикой, плашка "Ты", шапка таблицы + тело на 100 строк, подсветка rank≤100. Заменить mock-массив на реальные API-вызовы. Убрать `class` колонку, добавить `xp`.
- **`frontend/src/hooks/useMediaQuery.js`** — responsive detection, если понадобится.

### Established Patterns

- **Async SQLAlchemy:** `db: AsyncSession = Depends(get_db)`, запросы через `await db.execute(select(...))`.
- **Redis через aioredis:** `decode_responses=True` (`cache.py:24`).
- **MSK-время:** `get_msk_now()` из `models.py` для любой даты.
- **Pydantic response schemas:** живут в `backend/app/schemas.py`, именование `{Name}Response`.
- **Роутеры монтируются в `main.py`** через `app.include_router(...)`.

### Integration Points

- `crud.add_reward` после `db.commit()` — единственное место изменения lvl/xp, здесь ZADD.
- `main.py` lifespan — добавить `leaderboard.seed_if_empty()` после `cache.init_redis()`.
- `frontend/src/services/api.js` — новый `leaderboardService` (`getTop(offset, limit)`, `getMe()`).
- `App.jsx` routes — `/app/leaderboard` уже смонтирован (от Phase 2).

### Module Shape (рекомендация)

- `backend/app/routers/leaderboard.py` — HTTP endpoints (`/top`, `/me`).
- `backend/app/leaderboard.py` (новый) или `backend/app/utils/leaderboard.py` — доменная логика: `score_for(user)`, `update(redis, user)`, `get_top(redis, db, offset, limit)`, `get_me(redis, db, user)`, `seed_if_empty(redis, db)`.
- Planner решит точное деление модулей в PLAN.md.

</code_context>

<specifics>
## Specific Ideas

- UI должен остаться в текущей glass-morphism / пиксельной эстетике (sin shadows, gold accents `#daa520`, monospace font) — нельзя ломать визуальный стиль проекта.
- ROADMAP Success Criteria 3 явно требует "±5 вокруг юзера" — сохраняем в API-контракте, даже если UI v1.0 не рендерит `neighbors`.
- Level-up формула уже определена в коде (`crud.add_reward`) — Phase 7 не меняет её, только реагирует на финальные `lvl`/`xp`.

</specifics>

<deferred>
## Deferred Ideas

- **Клик по строке → публичный профиль игрока** — Phase 8 (Friends).
- **Friend-лидерборд** — Phase 8.
- **Guild-лидерборд** — Phase 9.
- **Opt-out `users.hide_from_leaderboard`** — пост-v1.0, когда появится privacy settings UI.
- **Anti-cheat / xp rollback mechanics** — пост-v1.0 (Production Polish, Phase 11).
- **Real-time updates (WebSocket/SSE/polling)** при открытой странице лидерборда — пост-v1.0.
- **Admin-эндпоинт принудительного rebuild** — добавим при первой операционной нужде.
- **Server-side кэш top-100** ответа (TTL 10s) — оптимизация, если ZRANGE+PG lookup окажется узким местом.
- **Виртуализация списка на 1000+ строк** — только если база серьёзно вырастет.

</deferred>

---

*Phase: 07-leaderboard*
*Context gathered: 2026-04-22*
