# ROADMAP: Game Your Life v1.0 (Pivot TWA → Web)

**Created:** 2026-03-01
**Revised:** 2026-04-18 (pivot to public web SaaS)
**Project:** Game Your Life (публичный RU SaaS-сайт с RPG-геймификацией задач)
**Core Value:** Выполнить реальную задачу = прокачать персонажа. RPG-петля всегда даёт ощутимую награду.

---

## Phases

- [x] **Phase 1: Secure Foundation** — HMAC-валидация Telegram initData + credentials в env (completed 2026-03-02)
- [x] **Phase 2: Web Foundation** — React Router, Zustand, react-query, responsive layout (sidebar/bottom-tabs), landing, legal pages. Удаление TWA SDK с фронта (completed 2026-04-18)
- [x] **Phase 3: Auth Refactor** — JWT (access + refresh), email/password регистрация и логин, Telegram Login Widget, миграция всех эндпоинтов на `get_current_user`, Alembic baseline + add_auth_fields (completed 2026-04-18)
- [x] **Phase 4: Character Stats** — 4 стата (Strength/Wisdom/Endurance/Charisma), категории квестов, рост статов, AI-промпт с учётом статов. (completed 2026-04-21)
- [ ] **Phase 5: Shop & Inventory** — каталог магазина, seed-данные, покупка за gold, инвентарь, активация бустов, экипировка скинов.
- [ ] **Phase 6: AI Daily Quests** — on-demand daily suggestions, персонализация под статы, кеш в Redis.
- [ ] **Phase 7: Leaderboard** — Redis sorted set, страница с топ-100 + позиция юзера.
- [ ] **Phase 8: Social — Friends** — поиск, инвайты, friendship, feed активности друзей.
- [ ] **Phase 9: Social — Guilds & Challenges** — CRUD гильдий, членство, групповые челленджи.
- [ ] **Phase 10: Monetization** — gems как валюта, ЮKassa SDK интеграция, webhook, gem-паки в магазине.
- [ ] **Phase 11: Production Polish** — Sentry, rate-limiting, SMTP-email, health-checks, prod-деплой на `gameyourlife.ru`, CI/CD.

---

## Phase Details

### Phase 1: Secure Foundation ✓

**Goal:** Users interact with a secure backend where their identity cannot be spoofed and credentials are protected.

**Status:** Complete (2026-03-02).

**Requirements:** SEC-01, SEC-02

---

### Phase 2: Web Foundation

**Goal:** Фронтенд работает как обычный сайт в любом браузере (без Telegram-контейнера), роутинг на URL, responsive layout под desktop и mobile, публичный landing и legal-страницы.

**Depends on:** Phase 1

**Requirements:** WEB-01, WEB-02, WEB-03, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04

**Success Criteria:**
1. Сайт открывается в любом браузере (Chrome / Safari / Firefox) без зависимости от Telegram SDK
2. URL-роутинг: каждая страница имеет свой путь (`/app/quests`, `/app/character`, etc.)
3. На desktop (≥1024px) — sidebar-навигация; на mobile (<1024px) — bottom-tabs
4. Landing page на `/` с hero / фичи / pricing / FAQ / footer
5. Legal-страницы `/privacy`, `/terms`, `/public-offer` с контентом
6. Cookie consent banner показывается при первом визите
7. Существующие экраны (Quests, Character, Shop, Inventory, Leaderboard) открываются под `/app/*`, старый tab-state удалён
8. `@twa-dev/sdk` удалён из `package.json`, `<script telegram-web-app.js>` удалён из `index.html`

**Plans:** 3/3 plans executed ✓

Plans:
- [x] 02-01-PLAN.md — Stack setup: install deps, remove TWA SDK, Zustand stores, routing skeleton, api.js Bearer interceptor
- [x] 02-02-PLAN.md — Legal pages (/privacy, /terms, /public-offer) and cookie consent banner
- [x] 02-03-PLAN.md — AppLayout (responsive sidebar/bottom-tabs), landing page (6 sections), auth shells, final route wiring + human verify

---

### Phase 3: Auth Refactor

**Goal:** Пользователь регистрируется по email+password или через Telegram Login Widget. Все API работают через JWT-токены. Существующие tg-юзеры мигрируют без потери данных.

**Depends on:** Phase 2

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

**Success Criteria:**
1. `POST /api/auth/register` создаёт юзера, отправляет email-подтверждение
2. `POST /api/auth/login` возвращает access (15 min) + refresh (30 days) токены
3. `POST /api/auth/telegram-login` принимает данные от Telegram Login Widget, валидирует HMAC, создаёт/находит юзера по `telegram_id`
4. Все ранее существующие эндпоинты (`/api/user/me`, `/api/quests/*`) работают через `Depends(get_current_user)` — JWT вместо initData
5. `verify_telegram_init_data` и `@twa-dev/sdk`-зависимость полностью удалены из кода
6. Alembic baseline миграция = текущая схема; новая миграция добавляет `email`, `password_hash`, `email_verified_at`, `display_name`, `gems` в users; делает `telegram_id` nullable
7. Существующий юзер с `telegram_id` может войти через Telegram Login и получить те же данные

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Backend foundation: deps, Alembic baseline+migration, auth.py (JWT/bcrypt/TG-widget HMAC), models, schemas, crud, get_current_user dependency
- [ ] 03-02-PLAN.md — Auth endpoints (register, login, refresh, telegram-login, verify-email) + migrate all endpoints to get_current_user + delete verify_telegram_init_data
- [ ] 03-03-PLAN.md — Frontend: LoginPage + RegisterPage forms, Telegram Login Widget, 401-refresh interceptor with promise queue, QuestsPage + CharacterPage data fetching, remove DEV bypass

---

### Phase 4: Character Stats

**Goal:** Персонаж имеет 4 именованных стата, которые растут от квестов разных категорий. AI учитывает слабые статы при назначении награды.

**Depends on:** Phase 3

**Requirements:** PROG-02, PROG-03

**Success Criteria:**
1. На `/app/character` видно 4 стата (Strength, Wisdom, Endurance, Charisma) со значениями
2. При создании квеста пользователь выбирает категорию (work / fitness / learning / social)
3. Завершение квеста увеличивает соответствующий стат (+1/+2/+4/+8 по difficulty)
4. AI-промпт получает статы юзера и учитывает их при выставлении награды
5. Alembic-миграция добавила `stat_strength / stat_wisdom / stat_endurance / stat_charisma` в users, `category` в quests

**Plans:** 4/4 plans complete

Plans:
- [ ] 04-01-PLAN.md — Backend foundation: Alembic migration (users +8 stat cols, quests +category), models.py + schemas.py extensions, game_logic.py utilities (STAT_GROWTH, CATEGORY_TO_STAT, max_xp_for_level, apply_stat_xp)
- [ ] 04-02-PLAN.md — Router behavior: save_quest persists category, complete_quest applies stat XP and returns stat_gain, analyze_task prompt includes stats block + weak-stat boost rule
- [ ] 04-03-PLAN.md — Frontend UI: AddTaskModal category chip picker, CharacterPage 2×2 stat grid, ProfileModal real stats (replaces stub)
- [ ] 04-04-PLAN.md — Frontend wiring + human verify: QuestsPage passes category to /analyze and /quests/save, stat_gain completion toast, end-to-end blocking human-verify checkpoint

---

### Phase 5: Shop & Inventory

**Goal:** Пользователь тратит gold на каталожные товары, управляет инвентарём, активирует бусты и скины.

**Depends on:** Phase 4

**Requirements:** SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, INV-01, INV-02, INV-03

**Success Criteria:**
1. `GET /api/shop` возвращает каталог (seed-данные в БД)
2. На `/app/shop` — карточки товаров с фильтрами (boosters / skins / slots)
3. Покупка за gold — `POST /api/shop/buy/{id}` с idempotency_key, атомарное списание gold и создание inventory_item
4. `/app/inventory` показывает купленные товары
5. Активация буста `POST /api/inventory/{id}/activate` устанавливает `xp_multiplier` / `gold_multiplier` с `expires_at`
6. Экипировка скина меняет аватар персонажа
7. Новые таблицы `shop_items`, `inventory_items` мигрированы через Alembic

**Plans:** 2/6 plans executed

Plans:
- [ ] 05-01-PLAN.md — DB foundation: Alembic migration (shop_items, inventory_items, idempotency_keys, +14 user boost cols), ORM models, Pydantic schemas, SHOP-04 Out of Scope
- [ ] 05-02-PLAN.md — game_logic.py TDD: effective_multipliers, effective_max_hp, MAX_ACTIVE_QUESTS + Wave 0 test scaffolds
- [ ] 05-03-PLAN.md — Backend routers: GET /api/shop, POST /api/shop/buy, GET /api/inventory, POST activate/equip, wired into main.py
- [ ] 05-04-PLAN.md — quests.py modifications: 5-slot cap in save_quest, boost multipliers in complete_quest + HP clamp
- [ ] 05-05-PLAN.md — Frontend: ShopPage catalog+buy, InventoryPage sections, Header boost timers, QuestsPage cap, AvatarSelector locks
- [ ] 05-06-PLAN.md — Human verify: end-to-end shop+inventory flow in browser

---

### Phase 6: AI Daily Quests

**Goal:** Пользователь получает 3 персонализированных AI-предложения каждый день, основанных на статах и истории.

**Depends on:** Phase 4

**Requirements:** AI-01, AI-02

**Success Criteria:**
1. `GET /api/daily/suggestions` возвращает 3 квеста, сгенерированных AI
2. Предложения учитывают слабые статы юзера (низкая Charisma → social quest)
3. Результат кешируется в Redis по ключу `daily:{user_id}:{YYYY-MM-DD}` (TTL до полуночи)
4. User может принять (создаёт квест) или отклонить (перегенерировать, но не более 2 раз в день)
5. AI-промпт включает lvl, last 10 quests, stats

**Plans:** TBD

---

### Phase 7: Leaderboard

**Goal:** Глобальный лидерборд по уровню/XP с позицией пользователя.

**Depends on:** Phase 4

**Requirements:** LEAD-01, LEAD-02

**Success Criteria:**
1. Redis sorted set `leaderboard:global` обновляется при каждом изменении xp/lvl
2. `GET /api/leaderboard?offset=0&limit=50` возвращает топ
3. `GET /api/leaderboard/me` возвращает позицию и ±5 вокруг юзера
4. На `/app/leaderboard` отображаются display_name, lvl, xp; позиция юзера подсвечена

**Plans:** TBD

---

### Phase 8: Social — Friends

**Goal:** Пользователь находит друзей, отправляет и принимает инвайты, видит их активность.

**Depends on:** Phase 3

**Requirements:** SOCL-01, SOCL-02

**Success Criteria:**
1. `GET /api/users/search?q=` ищет по display_name
2. `POST /api/friends/request` / `POST /api/friends/accept/{id}` / `DELETE /api/friends/{id}` работают
3. `GET /api/friends` возвращает список + последнюю активность
4. `/app/friends` — страница с поиском, списком, feed активности
5. Новая таблица `friendships` (UNIQUE requester_id + addressee_id)

**Plans:** TBD

---

### Phase 9: Social — Guilds & Challenges

**Goal:** Пользователь создаёт/вступает в гильдию, участвует в групповых челленджах.

**Depends on:** Phase 8

**Requirements:** SOCL-03, SOCL-04, GUILD-01, GUILD-02

**Success Criteria:**
1. `POST /api/guilds` создаёт гильдию (owner = создатель)
2. `GET /api/guilds` — список публичных, `GET /api/guilds/{slug}` — детали
3. `POST /api/guilds/{id}/join` / `leave` работают с ролями (owner/officer/member)
4. `GET /api/guilds/{id}/challenges` — активные челленджи, прогресс считается от выполнения квестов участников
5. `/app/guilds` — list, detail, join-flow
6. Новые таблицы `guilds`, `guild_members`, `guild_challenges`

**Plans:** TBD

---

### Phase 10: Monetization

**Goal:** Пользователь покупает gems за рубли через ЮKassa; gems тратятся в магазине.

**Depends on:** Phase 5

**Requirements:** BILL-01, BILL-02, BILL-03

**Success Criteria:**
1. В каталоге shop_items появляются товары за gems (price_gems)
2. Страница `/app/gems` — три пака (100 / 500 / 1500)
3. `POST /api/billing/gems/create` создаёт платёж в ЮKassa (test mode), возвращает confirmation_url
4. `POST /api/billing/yookassa/webhook` валидирует подпись, зачисляет gems в транзакции (SELECT FOR UPDATE)
5. `gem_transactions` отражает lifecycle (pending → succeeded/failed)
6. Идемпотентность: повторный webhook не зачисляет gems дважды

**Plans:** TBD

---

### Phase 11: Production Polish

**Goal:** Сайт готов к публичному запуску: мониторинг, защита, нотификации, деплой.

**Depends on:** Phase 10

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05

**Success Criteria:**
1. Rate-limiting (slowapi) на `/api/auth/*` (5 логинов/мин, 3 регистрации/час)
2. Sentry ловит все unhandled exceptions (frontend + backend)
3. SMTP-отправка работает (email verification, password reset) через Yandex 360 или аналог
4. `GET /api/health` возвращает 200 + ping DB/Redis
5. Deploy pipeline: frontend → Vercel (auto), backend → VDS через GitHub Actions + docker-compose
6. Домен `gameyourlife.ru` прописан, HTTPS (Let's Encrypt)
7. PostgreSQL и Redis на хостинге в РФ

**Plans:** TBD

---

## Progress Tracking

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Foundation | 2/2 | Complete | 2026-03-02 |
| 2. Web Foundation | 3/3 | Complete | 2026-04-18 |
| 3. Auth Refactor | 3/3 | Complete | 2026-04-18 |
| 4. Character Stats | 4/4 | Complete   | 2026-04-21 |
| 5. Shop & Inventory | 2/6 | In Progress|  |
| 6. AI Daily Quests | 0/TBD | Not started | — |
| 7. Leaderboard | 0/TBD | Not started | — |
| 8. Friends | 0/TBD | Not started | — |
| 9. Guilds & Challenges | 0/TBD | Not started | — |
| 10. Monetization | 0/TBD | Not started | — |
| 11. Production Polish | 0/TBD | Not started | — |

---

## Coverage Summary

**Total v1.0 Requirements:** расширено после пивота
- Existing validated: 10
- New v1.0: Web+Legal (7) + Auth (6) + Stats (2) + AI (2) + Shop/Inv (8) + Leader (2) + Friends (2) + Guilds (4) + Billing (3) + Prod (5) = **41 new**

| Category | Count | Phase |
|----------|-------|-------|
| Security & Foundation | 2 | Phase 1 ✓ |
| Web Foundation & Legal | 7 | Phase 2 |
| Auth | 6 | Phase 3 |
| Character Progression | 2 | Phase 4 |
| Shop & Inventory | 8 | Phase 5 |
| AI Features | 2 | Phase 6 |
| Leaderboard | 2 | Phase 7 |
| Friends | 2 | Phase 8 |
| Guilds | 4 | Phase 9 |
| Monetization | 3 | Phase 10 |
| Production | 5 | Phase 11 |

---

*Roadmap v2 (post-pivot): 2026-04-18*
