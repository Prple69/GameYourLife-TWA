# Requirements: Game Your Life

**Defined:** 2026-03-01
**Core Value:** Completing a real-life task feels like progressing a character — the RPG loop must always feel rewarding, never like a chore tracker with a skin.

## v1 Requirements

Requirements for initial release. Checked items are already working in the existing codebase.

### Quest Management

- [x] **QUEST-01**: User can create a quest with a custom title and deadline
- [x] **QUEST-02**: AI analyzes a user-created quest and assigns difficulty, XP reward, gold reward, and HP penalty
- [x] **QUEST-03**: User can complete an active quest and receive the assigned XP and gold
- [x] **QUEST-04**: Overdue quests automatically fail and apply HP penalty to the user
- [x] **QUEST-05**: User can view quest history showing completed and failed quests

### AI Features

- [x] **AI-01**: User receives 3 AI-generated quest suggestions refreshed each day
- [x] **AI-02**: Daily AI quests are personalized based on user's character stats and recent completion history

### Character Progression

- [x] **PROG-01**: User character levels up when XP reaches threshold (threshold scales 1.2× per level)
- [x] **PROG-02**: Character has 4 named stats (Strength, Wisdom, Endurance, Charisma) visible on profile
- [x] **PROG-03**: Completing different quest types grows the corresponding character stat

### Shop

- [x] **SHOP-01**: User can browse a shop catalog showing items with name, description, and gold cost
- [x] **SHOP-02**: User can purchase XP multiplier boost items with earned gold
- [x] **SHOP-03**: User can purchase gold multiplier boost items with earned gold
- [x] **SHOP-05**: User can purchase cosmetic avatar skins with earned gold

### Inventory

- [x] **INV-01**: User can view all owned items in their inventory
- [x] **INV-02**: User can activate owned boost items from inventory (applies effect immediately)
- [x] **INV-03**: User can equip owned avatar skins from inventory

### Leaderboard

- [x] **LEAD-01**: User can view a global leaderboard of players ranked by level and XP
- [x] **LEAD-02**: User's own rank and position are highlighted on the leaderboard

### Profile

- [x] **PROF-01**: User character profile is created automatically from Telegram identity on first launch
- [x] **PROF-02**: User can select and change their character avatar

### Security & Foundation

- [x] **SEC-01**: Server verifies Telegram initData cryptographic signature on all requests (no spoofable tg_id)
- [x] **SEC-02**: All credentials and API keys loaded from environment variables (not hardcoded)

### Web Foundation (added 2026-04-18 pivot)

- [x] **WEB-01**: Сайт открывается и работает в любом современном браузере (Chrome, Safari, Firefox) без зависимости от Telegram SDK или контейнера
- [x] **WEB-02**: Каждый экран приложения имеет собственный URL (React Router); навигация через адресную строку; закладки работают
- [x] **WEB-03**: Layout responsive — на desktop (≥1024px) sidebar-навигация; на mobile (<1024px) bottom-tabs; retro-эстетика сохранена

### Legal & Compliance (added 2026-04-18 pivot)

- [x] **LEGAL-01**: Публичный landing на `/` с hero / фичи / pricing / FAQ / footer
- [x] **LEGAL-02**: Страницы `/privacy`, `/terms`, `/public-offer` с контентом (152-ФЗ соответствие)
- [x] **LEGAL-03**: Cookie consent banner при первом визите, с сохранением выбора пользователя
- [x] **LEGAL-04**: В footer есть ссылки на все legal-страницы, email для связи

### Auth (added 2026-04-18 pivot)

- [x] **AUTH-01**: `POST /api/auth/register` с email + password + display_name, отправка email-подтверждения
- [x] **AUTH-02**: `POST /api/auth/login` возвращает access (15min) + refresh (30days) токены
- [x] **AUTH-03**: `POST /api/auth/telegram-login` принимает данные от Telegram Login Widget, валидирует HMAC, создаёт/находит юзера
- [x] **AUTH-04**: Все существующие эндпоинты мигрированы на `Depends(get_current_user)`; `verify_telegram_init_data` удалён
- [ ] **AUTH-05**: User может сбросить пароль по email; реализованы `request-password-reset` и `reset-password` — stub — Phase 11 (PROD-03) delivers SMTP
- [x] **AUTH-06**: Существующий Telegram-юзер при первом входе через Login Widget находится по `telegram_id` без потери данных

### Monetization (added 2026-04-18 pivot)

- [x] **BILL-01**: User покупает пак gems (100/500/1500) за рубли через ЮKassa; возвращается confirmation_url
- [ ] **BILL-02**: ЮKassa webhook валидирует подпись, атомарно зачисляет gems в транзакции (idempotent)
- [ ] **BILL-03**: В каталоге shop_items есть товары за gems (price_gems); покупка списывает gems

### Guilds (added 2026-04-18 pivot)

- [x] **GUILD-01**: User создаёт гильдию (slug/name/description), становится owner
- [x] **GUILD-02**: User вступает/покидает публичную гильдию; роли owner / officer / member

### Production (added 2026-04-18 pivot)

- [ ] **PROD-01**: Rate-limiting (slowapi) на auth-эндпоинтах (5 логинов/мин, 3 регистрации/час)
- [ ] **PROD-02**: Sentry ловит unhandled exceptions на frontend и backend
- [ ] **PROD-03**: SMTP (aiosmtplib) отправляет email verification и password reset через Yandex 360/аналог
- [ ] **PROD-04**: `GET /api/health` возвращает 200 + статус DB/Redis
- [ ] **PROD-05**: Production deploy — frontend Vercel, backend VDS (РФ), домен `gameyourlife.ru`, HTTPS Let's Encrypt

## Promoted to v1 (from v2)

After 2026-04-18 pivot, social features moved into v1.0 scope.

### Social — Friends

- [x] **SOCL-01**: User может искать по display_name и добавлять друзей
- [x] **SOCL-02**: User видит прогресс друзей и feed их активности

## Deferred (not in v1.0)

### Notifications

- **NOTF-01**: Web push-уведомления при обновлении daily quests
- **NOTF-02**: Email/push-напоминание о квестах с дедлайном сегодня

### Engagement

- **ENG-01**: Daily login streak с бонусным gold
- **ENG-02**: Achievement badges за milestones (первый квест, level 10, ...)

### Guild extras

- **GUILD-CHAT**: Гильдийный чат — большой модуль, отложен после v1.0
- **GUILD-PRIVATE**: Приватные / закрытые гильдии с инвайтами

## Out of Scope

| Feature | Reason |
|---------|--------|
| SHOP-04 (quest slot purchase) | Quest slots are a hard cap (5), not purchasable — removed from product permanently |
| Native iOS/Android app | Web-first; PWA при необходимости позже |
| i18n (multi-language) | RU-only в v1.0, расширение после PMF |
| Custom quest categories/tags | YAGNI; 4 категории (work/fitness/learning/social) достаточно |
| Premium-подписка | v1.0 монетизация только через gems; подписка после оценки LTV |
| Открытый API для сторонних клиентов | Не раскрываем API до стабилизации контракта |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUEST-01 | — | Complete (existing, pre-v1.0) |
| QUEST-02 | — | Complete (existing, pre-v1.0) |
| QUEST-03 | — | Complete (existing, pre-v1.0) |
| QUEST-04 | — | Complete (existing, pre-v1.0) |
| QUEST-05 | — | Complete (existing, pre-v1.0) |
| PROG-01 | — | Complete (existing, pre-v1.0) |
| PROF-01 | — | Complete (existing, pre-v1.0) |
| PROF-02 | — | Complete (existing, pre-v1.0) |
| SEC-01 | Phase 1 | Complete (verified 2026-03-02; see Phase 1 notes re pivot) |
| SEC-02 | Phase 1 | Complete (verified 2026-03-02) |
| WEB-01 | Phase 5.1 (verify) | Verified |
| WEB-02 | Phase 5.1 (verify) | Verified |
| WEB-03 | Phase 5.1 (verify) | Verified |
| LEGAL-01 | Phase 5.1 (verify) | Verified |
| LEGAL-02 | Phase 5.1 (verify) | Verified |
| LEGAL-03 | Phase 5.1 (verify) | Verified |
| LEGAL-04 | Phase 5.1 (verify) | Verified |
| AUTH-01 | Phase 5.2 (verify) | Verified (stub: email tokens logged) |
| AUTH-02 | Phase 5.2 (verify) | Verified |
| AUTH-03 | Phase 5.2 (verify) | Verified |
| AUTH-04 | Phase 5.2 (verify) | Verified |
| AUTH-05 | Phase 5.2 (verify) + Phase 11 (PROD-03) | Verified (stub) — token logged to console; SMTP delivery deferred to Phase 11 (PROD-03) |
| AUTH-06 | Phase 5.2 (verify) | Verified |
| PROG-02 | Phase 4 | Complete (verified 2026-04-21) |
| PROG-03 | Phase 4 | Complete (verified 2026-04-21) |
| SHOP-01 | Phase 5 | Complete (verified 2026-04-22) |
| SHOP-02 | Phase 5 | Complete (verified 2026-04-22) |
| SHOP-03 | Phase 5 | Complete (verified 2026-04-22) |
| SHOP-04 | — | Out of Scope (quest slots hard cap 5) |
| SHOP-05 | Phase 5 | Complete (verified 2026-04-22) |
| INV-01 | Phase 5 | Complete (verified 2026-04-22) |
| INV-02 | Phase 5 | Complete (verified 2026-04-22) |
| INV-03 | Phase 5 | Complete (verified 2026-04-22) |
| AI-01 | Phase 6 | Complete |
| AI-02 | Phase 6 | Complete |
| LEAD-01 | Phase 7 | Complete |
| LEAD-02 | Phase 7 | Complete |
| SOCL-01 | Phase 8 | Complete |
| SOCL-02 | Phase 8 | Complete |
| GUILD-01 | Phase 9 | Complete |
| GUILD-02 | Phase 9 | Complete |
| BILL-01 | Phase 10 | Complete |
| BILL-02 | Phase 10 | Pending |
| BILL-03 | Phase 10 | Pending |
| PROD-01 | Phase 11 | Pending |
| PROD-02 | Phase 11 | Pending |
| PROD-03 | Phase 11 | Pending (delivers AUTH-05 SMTP) |
| PROD-04 | Phase 11 | Pending |
| PROD-05 | Phase 11 | Pending |

**Coverage (post audit 2026-04-22):**
- v1.0 requirements: 51 total (10 validated pre-v1.0, 41 added in 2026-04-18 pivot; SHOP-04 moved to Out of Scope)
- Verified: 16 (SEC-01/02, PROG-02/03, SHOP-01/02/03/05, INV-01/02/03, WEB-01..03, LEGAL-01..04, AUTH-01..04, AUTH-06)
- Pending verification (implementation complete, needs VERIFICATION.md): 0 — all closed by Phase 5.1 (WEB/LEGAL) and Phase 5.2 (AUTH)
- Stub (known deferral): 1 (AUTH-05 — SMTP delivery → Phase 11/PROD-03)
- Unimplemented (future phases 6-11): 18 (AI-01/02, LEAD-01/02, SOCL-01/02, GUILD-01/02, BILL-01..03, PROD-01..05)
- Out of Scope: 1 (SHOP-04)
- Unmapped: 0 ✓

**Phase mapping summary (post-pivot):**
- Phase 1: Secure Foundation (SEC-01, SEC-02) — complete, verified
- Phase 2: Web Foundation (WEB-01..03, LEGAL-01..04) — complete, verification in Phase 5.1
- Phase 3: Auth Refactor (AUTH-01..06) — complete (AUTH-05 stub), verification in Phase 5.2
- Phase 4: Character Stats (PROG-02, PROG-03) — complete, verified
- Phase 5: Shop & Inventory (SHOP-01..03, SHOP-05, INV-01..03) — complete, verified
- **Phase 5.1: Verify Phase 02** — retroactive gap closure (milestone v1.0 audit 2026-04-22)
- **Phase 5.2: Verify Phase 03** — retroactive gap closure + AUTH-05 stub acknowledgment
- Phase 6: AI Daily Quests (AI-01, AI-02)
- Phase 7: Leaderboard (LEAD-01, LEAD-02)
- Phase 8: Friends (SOCL-01, SOCL-02)
- Phase 9: Guilds & Challenges (GUILD-01, GUILD-02)
- Phase 10: Monetization (BILL-01..03)
- Phase 11: Production Polish (PROD-01..05) — delivers AUTH-05 SMTP via PROD-03

---
*Requirements defined: 2026-03-01*
*Pivot expansion: 2026-04-18 (41 new requirements added, v2 social promoted to v1.0)*
*Traceability refresh + gap closure phases: 2026-04-22 (milestone v1.0 audit)*
