# Phase 10: Gems Foundation — Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Source:** In-session scoping decision (no /gsd:discuss-phase ceremony)

<domain>
## Phase Boundary

Foundation-only слой gem-валюты: схема БД и UI на месте, но **никакой реальной оплаты** в этой фазе. Пользователь видит страницу `/app/gems` с тремя паками и кнопкой-заглушкой; в каталоге `/app/shop` появляется хотя бы один товар с ценой в gems; HUD показывает `User.gems` рядом с gold. Все billing-endpoints, ЮKassa, webhooks, `gem_transactions` lifecycle, идемпотентность — DEFERRED в отдельную будущую фазу «Gems Payments».

**Что входит:**
- `shop_items.price_gems` (nullable INTEGER) + Alembic миграция
- Один или несколько gem-товаров в seed/fixture (для демонстрации)
- Страница `/app/gems` — три пака (100 / 500 / 1500), кнопка «Скоро» (disabled), вёрстка в стиле проекта
- Маршрут `/app/gems` в `App.jsx`, навигация
- HUD/character display: `User.gems` рядом с gold (badge или иконка)
- `/app/shop` отображает gem-цену рядом с gold-ценой для gem-товаров

**Что НЕ входит (deferred):**
- ЮKassa (любая SDK или API)
- `POST /api/billing/gems/create`
- `POST /api/billing/yookassa/webhook`
- Таблица `gem_transactions`
- Подпись webhook, идемпотентность, lock'и (`SELECT FOR UPDATE`)
- Admin-эндпоинт для ручного начисления gems (вариант B был отклонён)
- Real-money flow любого вида

</domain>

<decisions>
## Implementation Decisions

### Scope (locked)
- **Option A** выбран пользователем 2026-04-27 (отклонены B — admin grant, и C — full ЮKassa sandbox)
- Реальная оплата откладывается в будущую фазу «Gems Payments» (номер TBD, появится после Phase 11)
- BILL-01 покрыт **частично** (только каталог + UI), BILL-02 и BILL-03 остаются `not started`

### Backend
- Только одна миграция: добавить `price_gems INTEGER NULL` в `shop_items` (по паттерну Phase 4/5: hand-written, без autogenerate, чтобы избежать spurious drop_index)
- НИКАКИХ новых routers/endpoints в этой фазе
- Никаких изменений в `User` модели (gems колонка уже есть от Phase 5: `Column(Integer, default=0, nullable=False, server_default="0")`)
- Seed/fixture для gem-товара: либо через CRUD при первом запуске, либо через миграцию data-step, либо тестовый INSERT в `crud.py` стартап. Решение оставляется планировщику — выбрать минимально-инвазивный путь, согласный с существующим паттерном проекта.

### Frontend
- `/app/gems` — отдельная страница (lazy route как `/app/guilds`)
- Три пака как hardcoded константы в компоненте: 100 / 500 / 1500 (без backend-fetch — оплаты нет, контент статичный)
- Кнопка «Скоро» (disabled, серая) — НЕ «Купить»
- Стилистика: retro-game, как остальные страницы
- HUD gems: рядом с gold, та же иконография (или гем-эмоджи 💎 / SVG-иконка из существующих ассетов, если есть; иначе — текст «GEMS» как fallback)
- Shop: при наличии `price_gems`, показывать gem-цену в карточке shop-item рядом с gold-ценой; не как «или», а как «и» (эта механика отложена) — ИЛИ просто визуально «требуется gems», disabled-button. Решение оставляется планировщику.

### Tests
- Stub-pattern unit tests для backend (паттерн Phase 5/7/8/9): без TestClient, без DB
- Frontend smoke: `npm run build` проходит чисто
- Никаких e2e — браузер-смоук переедет в Pre-Launch Checklist (паттерн Phase 7/9)

### Migrations
- Hand-written migration (не autogenerate)
- `down_revision` = HEAD текущей миграционной цепочки (последняя — `3e157d3ff620` из Phase 9)
- Down-migration корректно дропает колонку

### Claude's Discretion
- Точный путь seeding gem-товара
- Иконка/визуал для gems в HUD (выбрать существующий ассет или fallback-текст)
- Имена компонентов (`GemsPage`, `GemsPackCard` и т.п.) — следовать паттерну проекта
- Структура volumes (один план или два) — на усмотрение планировщика, но логично разделить backend (миграция + seed) и frontend (страница + HUD + shop-card обновление)

</decisions>

<specifics>
## Specific Ideas

- Цены паков: **100, 500, 1500 gems** (из roadmap)
- Кнопка-заглушка: «Скоро» или «В разработке» — выбрать русский вариант, согласный с tone проекта
- HUD gems: иконка 💎 (если нет SVG-ассета) рядом с числом, как gold-display сейчас
- Shop-карточка: если `price_gems` не null, показать «💎 X» рядом с «🪙 Y» — обе цены видны, но кнопка покупки за gems disabled («Скоро»)

## Existing Assets to Reuse

- `User.gems` колонка (Phase 5) — уже NOT NULL с server_default=0
- `shop_items` таблица + ORM модель + Pydantic-схемы существуют (Phase 5)
- HUD-компонент с gold-display — найти и расширить, не создавать новый
- Lazy-route паттерн из `/app/guilds` (Phase 9) — copy-paste

</specifics>

<deferred>
## Deferred Ideas

Полностью deferred в отдельную будущую фазу «Gems Payments» (после Phase 11):
- ЮKassa SDK интеграция
- `POST /api/billing/gems/create` → confirmation_url
- `POST /api/billing/yookassa/webhook` с проверкой подписи
- `gem_transactions` lifecycle table (pending → succeeded/failed)
- Идемпотентность повторного webhook
- `SELECT FOR UPDATE` для зачисления
- Admin grant endpoint (отклонён в варианте B)
- Любые реальные траты gems за реальные деньги

</deferred>

---

*Phase: 10-gems-foundation*
*Context locked: 2026-04-27 via in-session scoping decision*
