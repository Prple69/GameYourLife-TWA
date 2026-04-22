# Phase 6: AI Daily Quests - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Пользователь получает 3 персонализированных AI-предложения квестов в день, размещённых секцией на `/app/quests`. Предложения учитывают статы и историю (completed + failed, last 10). Результат кешируется в Redis по ключу `daily:{user_id}:{YYYY-MM-DD}` с TTL до полуночи MSK. Accept создаёт настоящий квест; reject (reroll) перегенерирует одну карточку, максимум 2 реролла в день на пользователя.

**Requirements:** AI-01, AI-02

**Out of scope (эта фаза):** push-уведомления об обновлении daily, streak-бонусы за ежедневное принятие, история принятых daily отдельно от обычного quest history, множественная генерация "темы дня".

</domain>

<decisions>
## Implementation Decisions

### UX размещение и триггер

- **Размещение:** секция "Квесты дня" поверх списка Active в `QuestsPage.jsx` (не отдельный route, не модалка)
- **Триггер:** явная кнопка "Получить квесты дня" — пользователь запускает генерацию сам; нет авто-вызова LLM при открытии страницы
- **Карточка до accept:** title + category (chip) + difficulty + rewards preview (xp + gold + hp_penalty) — полный превью как в ответе `/api/analyze`
- **Empty state** после отработки всех 3 карточек (accepted/reroll исчерпан): секция остаётся, но показывает иллюстрацию + текст "Завтра новые" до сброса в полночь MSK

### Accept flow

- **1-клик accept:** `POST /api/daily/accept/{index}` (или аналог) → backend вызывает существующий путь создания квеста (`schemas.QuestSave` + `models.Quest`) с AI-rewards без редакций; квест появляется в Active снизу
- **Slot cap (5 активных):** Accept-кнопка **disabled** + tooltip "Освободи слот" когда `active_count >= MAX_ACTIVE_QUESTS`; frontend уже знает `active_count`, так что 409 не должен срабатывать
- **После accept:** принятая карточка **исчезает** из секции; оставшиеся (если есть) продолжают отображаться
- **Feedback:** короткий toast "Квест добавлен" + `triggerHaptic()` — не модалка

### Reroll политика

- **Счётчик:** **2 реролла total на пользователя в день** (не per-card). Соответствует буквальной формулировке Roadmap ("не более 2 раз в день")
- **Scope реролла:** рероллится **одна конкретная карточка**, остальные сохраняются. Нет "обновить все" кнопки
- **UI когда лимит исчерпан:** видимый счётчик "Рероллов использовано: 2/2" + кнопка reroll на карточках становится disabled. Информативность видна с первого появления секции
- **Persistence:** Redis-ключ `rerolls:{user_id}:{YYYY-MM-DD}`, INCR при каждом реролле, TTL до полуночи MSK — синхронно с основным кешем `daily:{user_id}:{YYYY-MM-DD}`

### AI output и роли

- **Один LLM-вызов возвращает весь пакет:** для каждой из 3 карточек — `title + category + difficulty + xp + gold + hp_penalty`. Формат аналогичен существующему `analyze_task`, но для списка. Нет второго round-trip через `/api/analyze` при accept
- **Категория:** AI фиксирует её с **weak-stat priority** (низкий стат → предложение категории, которая его качает). Пользователь **не может** переназначить — сохраняет интент "персонализации" (AI-02)
- **Deadline:** жёстко "сегодня" (MSK). AI не влияет на deadline. Семантика "daily" требует same-day completion, иначе -HP через существующий `_fail_overdue_quests`
- **История в промпте:** last **10 quests (completed + failed)** — AI видит как успехи так и провалы, это диагностично. Не только completed
- **Промпт-extension:** расширяем существующий шаблон из `analyze_task` — те же `stat_*_level`, те же difficulty-ranges, добавляем блок "история" и инструкцию "сгенерируй ровно 3 разнообразных предложения с weak-stat priority"

### Claude's Discretion

- Точный дизайн карточки (анимации hover, раскладка chip'ов) — design-pass по аналогии с Shop/Quest карточками
- Fallback при падении OpenRouter / таймауте: researcher проверит существующий `fallback`-dict в `analyze_task`, planner решит — показывать вчерашний кеш / статичный fallback-seed / error banner
- Обработка "новый пользователь без истории" (пустой list в промпте) — planner решит: отдельный prompt-branch vs просто пустой массив
- Точная JSON-schema LLM-ответа (массив vs объект с полем `suggestions`, error-handling при невалидном JSON)
- Структура Redis-payload: JSON-string целиком или отдельные поля
- Timezone non-MSK users — MSK ключ как единый стандарт проекта (унаследовано, не новый вопрос)

</decisions>

<specifics>
## Specific Ideas

- "Кнопка 'Получить квесты дня'" — explicit action, не автозапуск, чтобы не жечь OpenRouter при случайном открытии страницы
- AI-output-дизайн аналогичен ответу `analyze_task` — одна ментальная модель для пользователя и бэкенда
- Reroll-счётчик должен быть виден **сразу** (не после первого клика) — избегаем скрытого стейта
- Deadline "сегодня" — сохраняет RPG-интенсивность: daily квест = реальный daily, не "сделай когда-нибудь"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`AsyncOpenAI` client паттерн** (`backend/app/routers/quests.py::analyze_task`, lines 71-138): OpenRouter base URL, модель `liquid/lfm-2.5-1.2b-thinking:free`, markdown-JSON cleanup regex, fallback-dict. Расширяется под список 3 предложений.
- **`CATEGORY_TO_STAT` mapping** (`backend/app/utils/game_logic.py`): work→strength, fitness→endurance, learning→wisdom, social→charisma. AI использует это для weak-stat logic через prompt (не через код).
- **`schemas.QuestSave` + `POST /api/quests/save`**: ровно тот контракт, через который проходит accept (идентичен обычному созданию квеста).
- **`MAX_ACTIVE_QUESTS` (константа)**: ре-используем для disabled-tooltip на Accept.
- **`models.User.stat_*_level` (4 стата)**: передаём в AI-промпт как сейчас в `analyze_task` (lines 97-101).
- **`models.Quest` + `crud.get_quest_history`**: источник "last 10 quests" для промпта; существующий эндпоинт `/api/quests/history/me` — база для history-запроса.
- **`get_msk_now()` (`models.py`)**: MSK-время для ключей `daily:{uid}:{YYYY-MM-DD}` и `rerolls:{uid}:{YYYY-MM-DD}`.
- **JWT auth через `Depends(get_current_user)`**: консистентно с остальным API (Phase 3).
- **Frontend: `triggerHaptic()` + toast-паттерн** из `QuestsPage.jsx` — используем для feedback при accept.

### Established Patterns

- **Async FastAPI + SQLAlchemy + JWT**: новый роутер `backend/app/routers/daily.py`, регистрируется в `main.py::app.include_router`.
- **Pydantic schemas с "Schema" суффиксом**: `DailySuggestionSchema`, `DailySuggestionsResponse`.
- **Alembic migrations** для схемы БД — **не требуется** для этой фазы: persistence целиком в Redis.
- **Config через `Settings` (pydantic-settings)**: добавить `REDIS_URL` в `backend/app/config.py`.
- **Logging через `logger.error`** с fallback — как в `analyze_task`.
- **Frontend fetching через `axios`-инстанс из `services/api.js`**: добавить `dailyService`.
- **`AddTaskModal.jsx` category chip picker**: визуальный референс для category-chip на daily-карточке (но в daily оно read-only).

### Integration Points

- **`backend/app/main.py` line 18**: добавить `daily` в import, `app.include_router(daily.router)`.
- **`backend/app/config.py`**: добавить `REDIS_URL: str = "redis://localhost:6379/0"`.
- **`backend/requirements.txt`**: добавить `redis>=5.0` (async client через `redis.asyncio`).
- **`frontend/src/services/api.js`**: экспортировать `dailyService` (getSuggestions, accept, reroll).
- **`frontend/src/pages/QuestsPage.jsx`**: встроить секцию "Квесты дня" поверх списка Active, параллельно с existing `AddTaskModal` триггером.
- **Новый `frontend/src/components/DailyQuestCard.jsx`**: карточка предложения с accept/reroll кнопками и rewards-preview.
- **Redis infra**: **новая зависимость для проекта** — ни в dev-окружении, ни в deploy'е Redis пока не поднят. Planning должен учесть: локальный Redis (docker-compose / Windows WSL), prod-вариант — в Phase 11 (Production Polish) Redis обязателен для Leaderboard тоже. Здесь — минимальная установка для локальной разработки.

</code_context>

<deferred>
## Deferred Ideas

- **Push-уведомления о сбросе daily в полночь** — относится к NOTF-01 (deferred в REQUIREMENTS.md), самостоятельная фаза после v1.0
- **Daily streak** (бонус за N дней подряд с accepted daily) — ENG-01 (deferred), future phase
- **Custom prompt preferences** (пользователь настраивает "больше fitness / меньше social") — расширение AI-02, future
- **История dailies отдельно от quest history** (отчёт "за месяц я принял X daily quests") — не в scope v1.0
- **Tema dня / thematic suggestions** (3 квеста на одну тему) — креативное расширение, future
- **Тип подсказки "микро-цель на час"** (меньше чем daily, больше чем квест) — другой формат, не в Phase 6

</deferred>

---

*Phase: 06-ai-daily-quests*
*Context gathered: 2026-04-22*
