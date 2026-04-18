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

- [ ] **AI-01**: User receives 3 AI-generated quest suggestions refreshed each day
- [ ] **AI-02**: Daily AI quests are personalized based on user's character stats and recent completion history

### Character Progression

- [x] **PROG-01**: User character levels up when XP reaches threshold (threshold scales 1.2× per level)
- [ ] **PROG-02**: Character has 4 named stats (Strength, Wisdom, Endurance, Charisma) visible on profile
- [ ] **PROG-03**: Completing different quest types grows the corresponding character stat

### Shop

- [ ] **SHOP-01**: User can browse a shop catalog showing items with name, description, and gold cost
- [ ] **SHOP-02**: User can purchase XP multiplier boost items with earned gold
- [ ] **SHOP-03**: User can purchase gold multiplier boost items with earned gold
- [ ] **SHOP-04**: User can purchase additional active quest slots with earned gold
- [ ] **SHOP-05**: User can purchase cosmetic avatar skins with earned gold

### Inventory

- [ ] **INV-01**: User can view all owned items in their inventory
- [ ] **INV-02**: User can activate owned boost items from inventory (applies effect immediately)
- [ ] **INV-03**: User can equip owned avatar skins from inventory

### Leaderboard

- [ ] **LEAD-01**: User can view a global leaderboard of players ranked by level and XP
- [ ] **LEAD-02**: User's own rank and position are highlighted on the leaderboard

### Profile

- [x] **PROF-01**: User character profile is created automatically from Telegram identity on first launch
- [x] **PROF-02**: User can select and change their character avatar

### Security & Foundation

- [x] **SEC-01**: Server verifies Telegram initData cryptographic signature on all requests (no spoofable tg_id)
- [x] **SEC-02**: All credentials and API keys loaded from environment variables (not hardcoded)

### Web Foundation (added 2026-04-18 pivot)

- [ ] **WEB-01**: Сайт открывается и работает в любом современном браузере (Chrome, Safari, Firefox) без зависимости от Telegram SDK или контейнера
- [ ] **WEB-02**: Каждый экран приложения имеет собственный URL (React Router); навигация через адресную строку; закладки работают
- [ ] **WEB-03**: Layout responsive — на desktop (≥1024px) sidebar-навигация; на mobile (<1024px) bottom-tabs; retro-эстетика сохранена

### Legal & Compliance (added 2026-04-18 pivot)

- [ ] **LEGAL-01**: Публичный landing на `/` с hero / фичи / pricing / FAQ / footer
- [x] **LEGAL-02**: Страницы `/privacy`, `/terms`, `/public-offer` с контентом (152-ФЗ соответствие)
- [x] **LEGAL-03**: Cookie consent banner при первом визите, с сохранением выбора пользователя
- [x] **LEGAL-04**: В footer есть ссылки на все legal-страницы, email для связи

### Auth (added 2026-04-18 pivot)

- [ ] **AUTH-01**: `POST /api/auth/register` с email + password + display_name, отправка email-подтверждения
- [ ] **AUTH-02**: `POST /api/auth/login` возвращает access (15min) + refresh (30days) токены
- [ ] **AUTH-03**: `POST /api/auth/telegram-login` принимает данные от Telegram Login Widget, валидирует HMAC, создаёт/находит юзера
- [ ] **AUTH-04**: Все существующие эндпоинты мигрированы на `Depends(get_current_user)`; `verify_telegram_init_data` удалён
- [ ] **AUTH-05**: User может сбросить пароль по email; реализованы `request-password-reset` и `reset-password`
- [ ] **AUTH-06**: Существующий Telegram-юзер при первом входе через Login Widget находится по `telegram_id` без потери данных

### Monetization (added 2026-04-18 pivot)

- [ ] **BILL-01**: User покупает пак gems (100/500/1500) за рубли через ЮKassa; возвращается confirmation_url
- [ ] **BILL-02**: ЮKassa webhook валидирует подпись, атомарно зачисляет gems в транзакции (idempotent)
- [ ] **BILL-03**: В каталоге shop_items есть товары за gems (price_gems); покупка списывает gems

### Guilds (added 2026-04-18 pivot)

- [ ] **GUILD-01**: User создаёт гильдию (slug/name/description), становится owner
- [ ] **GUILD-02**: User вступает/покидает публичную гильдию; роли owner / officer / member

### Production (added 2026-04-18 pivot)

- [ ] **PROD-01**: Rate-limiting (slowapi) на auth-эндпоинтах (5 логинов/мин, 3 регистрации/час)
- [ ] **PROD-02**: Sentry ловит unhandled exceptions на frontend и backend
- [ ] **PROD-03**: SMTP (aiosmtplib) отправляет email verification и password reset через Yandex 360/аналог
- [ ] **PROD-04**: `GET /api/health` возвращает 200 + статус DB/Redis
- [ ] **PROD-05**: Production deploy — frontend Vercel, backend VDS (РФ), домен `gameyourlife.ru`, HTTPS Let's Encrypt

## Promoted to v1 (from v2)

After 2026-04-18 pivot, social features moved into v1.0 scope.

### Social — Friends

- [ ] **SOCL-01**: User может искать по display_name и добавлять друзей
- [ ] **SOCL-02**: User видит прогресс друзей и feed их активности

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
| Native iOS/Android app | Web-first; PWA при необходимости позже |
| i18n (multi-language) | RU-only в v1.0, расширение после PMF |
| Custom quest categories/tags | YAGNI; 4 категории (work/fitness/learning/social) достаточно |
| Premium-подписка | v1.0 монетизация только через gems; подписка после оценки LTV |
| Открытый API для сторонних клиентов | Не раскрываем API до стабилизации контракта |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUEST-01 | — | Complete (existing) |
| QUEST-02 | — | Complete (existing) |
| QUEST-03 | — | Complete (existing) |
| QUEST-04 | — | Complete (existing) |
| QUEST-05 | — | Complete (existing) |
| PROG-01 | — | Complete (existing) |
| PROF-01 | — | Complete (existing) |
| PROF-02 | — | Complete (existing) |
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| PROG-02 | Phase 2 | Pending |
| PROG-03 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| SHOP-01 | Phase 4 | Pending |
| SHOP-02 | Phase 4 | Pending |
| SHOP-03 | Phase 4 | Pending |
| SHOP-04 | Phase 4 | Pending |
| SHOP-05 | Phase 4 | Pending |
| INV-01 | Phase 4 | Pending |
| INV-02 | Phase 4 | Pending |
| INV-03 | Phase 4 | Pending |
| LEAD-01 | Phase 7 | Pending |
| LEAD-02 | Phase 7 | Pending |
| WEB-01 | Phase 2 | Pending |
| WEB-02 | Phase 2 | Pending |
| WEB-03 | Phase 2 | Pending |
| LEGAL-01 | Phase 2 | Pending |
| LEGAL-02 | Phase 2 | Complete |
| LEGAL-03 | Phase 2 | Complete |
| LEGAL-04 | Phase 2 | Complete |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 3 | Pending |
| AUTH-06 | Phase 3 | Pending |
| SOCL-01 | Phase 8 | Pending |
| SOCL-02 | Phase 8 | Pending |
| GUILD-01 | Phase 9 | Pending |
| GUILD-02 | Phase 9 | Pending |
| BILL-01 | Phase 10 | Pending |
| BILL-02 | Phase 10 | Pending |
| BILL-03 | Phase 10 | Pending |
| PROD-01 | Phase 11 | Pending |
| PROD-02 | Phase 11 | Pending |
| PROD-03 | Phase 11 | Pending |
| PROD-04 | Phase 11 | Pending |
| PROD-05 | Phase 11 | Pending |

**Coverage:**
- v1.0 requirements: 51 total (10 validated, 41 new in 2026-04-18 pivot)
- Mapped to phases: 41 new + 2 complete (Phase 1)
- Unmapped: 0 ✓

**Phase mapping summary (post-pivot):**
- Phase 1: Secure Foundation (SEC-01, SEC-02) — complete
- Phase 2: Web Foundation (WEB-01..03, LEGAL-01..04)
- Phase 3: Auth Refactor (AUTH-01..06)
- Phase 4: Character Stats (PROG-02, PROG-03)
- Phase 5: Shop & Inventory (SHOP-01..05, INV-01..03)
- Phase 6: AI Daily Quests (AI-01, AI-02)
- Phase 7: Leaderboard (LEAD-01, LEAD-02)
- Phase 8: Friends (SOCL-01, SOCL-02)
- Phase 9: Guilds & Challenges (GUILD-01, GUILD-02)
- Phase 10: Monetization (BILL-01..03)
- Phase 11: Production Polish (PROD-01..05)

---
*Requirements defined: 2026-03-01*
*Pivot expansion: 2026-04-18 (41 new requirements added, v2 social promoted to v1.0)*
