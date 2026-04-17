# Game Your Life

## What This Is

Game Your Life — публичный SaaS-сайт для RU-рынка, превращающий повседневные задачи в RPG. Пользователь регистрируется по email или через Telegram Login Widget, создаёт квесты, AI оценивает сложность и назначает награды, а выполнение даёт XP, gold, рост 4 статов (Strength / Wisdom / Endurance / Charisma). Заработанный gold тратится в магазине на бусты и скины; премиум-валюта gems покупается за рубли через ЮKassa. Игроки соревнуются в глобальном лидерборде, дружат, создают гильдии с командными челленджами.

## Core Value

Выполнить реальную задачу = прокачать персонажа. RPG-петля всегда должна давать ощутимую награду, а не быть трекером дел с геймифицированной обложкой.

## Requirements

### Validated

<!-- Shipped and confirmed working in existing codebase. -->

- ✓ User получает профиль персонажа, инициализированный от Telegram-identity — existing (будет переиспользован для Telegram Login Widget)
- ✓ User может создать квест с заголовком и дедлайном — existing
- ✓ AI анализирует квест и назначает сложность, XP, gold, HP penalty — existing
- ✓ User выполняет активный квест и получает XP/gold — existing
- ✓ Уровень растёт по XP-порогу (масштаб 1.2× за уровень) — existing
- ✓ User может выбрать аватар персонажа — existing
- ✓ Просроченные квесты автоматически фейлятся и снимают HP — existing
- ✓ Quest history (completed/failed) отслеживается — existing
- ✓ Server валидирует Telegram initData HMAC-SHA256 (Phase 1) — existing
- ✓ Credentials загружаются из env через Pydantic Settings (Phase 1) — existing

### Active

<!-- v1.0 релиз публичного сайта — полный scope. -->

**Web Foundation & Auth:**
- [ ] Сайт работает на `gameyourlife.ru` без Telegram-контейнера
- [ ] User регистрируется по email + password с подтверждением email
- [ ] User логинится через Telegram Login Widget (как альтернатива email)
- [ ] Responsive: desktop (sidebar-навигация) и mobile web (bottom-tabs)
- [ ] Legal-страницы: Privacy Policy (152-ФЗ), Terms, Public Offer, Cookie consent

**Character Progression:**
- [ ] 4 стата (Strength / Wisdom / Endurance / Charisma) на профиле
- [ ] Квесты имеют категорию (work / fitness / learning / social), растят соответствующий стат
- [ ] AI учитывает текущие статы при назначении награды

**AI Features:**
- [ ] User получает 3 AI-предложения квестов в день, персонализированных под статы и историю

**Shop & Inventory:**
- [ ] Каталог магазина с товарами (бусты, скины, слоты) — цена в gold или gems
- [ ] User покупает XP-мультипликатор, gold-мультипликатор, доп. слоты квестов, скины
- [ ] User активирует бусты из инвентаря, экипирует скины

**Monetization:**
- [ ] User покупает паки gems (100/500/1500) за рубли через ЮKassa
- [ ] Покупки gems подтверждаются webhook-ом и зачисляются атомарно

**Social:**
- [ ] Глобальный лидерборд показывает топ-100 по уровню и XP; позиция пользователя подсвечена
- [ ] User ищет по display_name, добавляет друзей, видит их прогресс
- [ ] User создаёт/вступает в гильдию, участвует в групповых челленджах

**Production Readiness:**
- [ ] Rate-limiting на auth-эндпоинтах
- [ ] Ошибки отправляются в Sentry
- [ ] Email-нотификации через SMTP (email verification, password reset)
- [ ] Health-check эндпоинт для мониторинга
- [ ] PostgreSQL на хостинге в РФ (Yandex Cloud или аналог) для соответствия 152-ФЗ

### Out of Scope

<!-- Explicit exclusions with reasoning. -->

- **Native iOS/Android app** — web-first; PWA при необходимости позже
- **i18n (multi-language)** — v1.0 только русский; расширение после PMF
- **Гильдийный чат** — большой модуль, отложен после v1.0 для фокуса
- **Premium-подписка** — v1.0 монетизация только через gems; подписка после оценки LTV
- **Achievement badges / daily streaks** — отложены после ядра
- **Push-уведомления (web push)** — в v1.0 только email; push после PMF
- **Открытый API для сторонних клиентов** — не раскрываем API до стабилизации контракта

## Context

Исходный код — работающий прототип Telegram Mini App. Phase 1 (Secure Foundation) завершена: HMAC-валидация Telegram initData на всех эндпоинтах, credentials вынесены в Pydantic Settings.

**Пивот (2026-04-18):** Решение уйти с TWA на публичный веб-сайт. Причина — потенциал SaaS-рынка больше, чем Telegram-аудитория; убирает ограничения Telegram-контейнера; позволяет монетизацию через ЮKassa. Telegram остаётся как опция логина (Login Widget), существующие tg-юзеры переезжают без потери данных.

**Стек сохраняется** (React + FastAPI + PostgreSQL + OpenRouter), но добавляются:
- React Router v6, Zustand, TanStack Query (frontend)
- python-jose (JWT), bcrypt, Alembic (полноценные миграции), aioredis, slowapi, aiosmtplib, Sentry (backend)
- Redis (кеш лидерборда, rate-limit, daily cache)
- ЮKassa SDK (billing)

**Известные проблемы под пивот:**
- `backend/app/models.py:20` — `telegram_id UNIQUE NOT NULL` нужно сделать nullable
- `backend/app/dependencies.py` — `verify_telegram_init_data` заменить на `get_current_user` (JWT)
- `backend/app/main.py` — 262 строки в одном файле, разбить на роутеры
- `frontend/src/App.jsx:33-48` — инициализация `window.Telegram.WebApp` удаляется
- `frontend/src/services/api.js:19-26` — `X-Telegram-Init-Data` заменить на Bearer
- `frontend/index.html:4` — `<script src="telegram-web-app.js">` удаляется
- `package.json` — убрать `@twa-dev/sdk`, добавить `react-router-dom`, `zustand`, `@tanstack/react-query`
- Cloudflare Tunnel (`gameurlife.ru.tuna.am`) заменить на продакшн-домен с HTTPS

## Constraints

- **Рынок:** только RU (русский UI, без i18n, хостинг ПД в РФ по 152-ФЗ)
- **Платформа:** responsive web (desktop + mobile web); no native app
- **Стек:** React 19 + FastAPI + PostgreSQL + OpenRouter зафиксированы; миграция БД через Alembic
- **Визуал:** retro/pixel эстетика (Press Start 2P, золото-чёрная палитра, NES.css) сохраняется
- **Deployment:** фронт на Vercel, бэкенд на VDS (РФ) с nginx+HTTPS; Redis рядом
- **Auth:** Email+password (обязательно) и Telegram Login Widget (второй способ)
- **Payments:** ЮKassa — для РФ-рынка; требует ИП/самозанятого/ООО
- **Legal:** 152-ФЗ (политика ПД), публичная оферта для gems, удаление аккаунта по запросу

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Пивот с TWA на публичный сайт | Больший рынок, возможность монетизации, гибкость | Accepted 2026-04-18 |
| Сохранить retro-эстетику | Идентичность уже узнаваемая, уникальный вайб | Accepted 2026-04-18 |
| Email+password + Telegram Login Widget | Широкий охват + миграция существующих tg-юзеров | Accepted 2026-04-18 |
| Gems через ЮKassa (не Stripe) | Stripe не работает в РФ; ЮKassa стандарт для RU SaaS | Accepted 2026-04-18 |
| Redis для сессий/кеша/лидерборда | Масштабируемость; SQL-запросы на top-100 по каждому визиту недопустимы | Accepted 2026-04-18 |
| Alembic вместо `init_db()` на старте | Контроль миграций в продакшне; без потери данных при релизах | Accepted 2026-04-18 |
| Один релиз v1.0 (не инкрементальные) | Выбор пользователя; риск scope зафиксирован | Accepted 2026-04-18, risk acknowledged |
| OpenRouter для AI | Cost flexibility, multi-model access | Pending (existing) |
| Запуск всего RU-only | Меньше сложности для старта; i18n после PMF | Accepted 2026-04-18 |

---
*Last updated: 2026-04-18 после решения о пивоте TWA → Web*
