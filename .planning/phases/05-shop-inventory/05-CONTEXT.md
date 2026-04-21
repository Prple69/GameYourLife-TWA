# Phase 5: Shop & Inventory - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Пользователь тратит заработанный gold на каталожные товары (бусты-мультипликаторы XP/gold/stat-XP, временный +max_hp, instant heal-зелья, косметические скины аватара), управляет купленным в инвентаре, активирует бусты (consume-based, timer-based) и экипирует скины (collection, переключаемые). Cap в 5 активных квестов вводится, но делается НЕобходимым ограничением без возможности расширения.

**Out of scope:**
- **SHOP-04 (покупка слотов квестов)** — перемещается в `REQUIREMENTS.md` → Out of Scope навсегда. Покупаемые quest-slots не поддерживаются концепцией продукта.
- **Снаряжение / equipment** (оружие/броня/аксессуары с passive-бонусами) — Deferred (новая фаза, `/gsd:add-phase` позже).
- **Уникальные предметы** (2-я жизнь, respawn, one-time effects) — Deferred (одна фаза с Equipment).
- **Gems / ЮKassa / monetization** — Phase 10 (BILL-01..03).
- **AI daily quests** — Phase 6.
- **Backfill / migration существующих юзеров** — production-DB ещё не запущена, в БД только тестовые аккаунты; migration не требуется.

</domain>

<decisions>
## Implementation Decisions

### Catalog: 3 крупных класса товаров

| Класс    | item_type в shop_items                                                                                                 | Механика активации                                                                     | Consumable?                  |
|----------|------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|------------------------------|
| Бусты    | `booster_xp`, `booster_gold`, `booster_strength_xp`, `booster_wisdom_xp`, `booster_endurance_xp`, `booster_charisma_xp`, `booster_hp_max` | Один активный слот на тип, expires_at, lazy-compute multiplier в read-path            | Да (quantity -= 1)           |
| Зелья    | `potion_heal`                                                                                                          | Instant: `user.hp = min(hp + heal_amount, effective_max_hp)`. Нет expires_at и слота  | Да (quantity -= 1)           |
| Скины    | `skin`                                                                                                                 | `user.selected_avatar = shop_item.avatar_key`. Остаётся в inventory (collection)      | Нет (quantity остаётся 1)    |

### Boost: все параметры в shop_items (нет констант в коде)

Каждая строка `shop_items` типа `booster_*` несёт:
- `effect_multiplier: FLOAT` — например, 1.25 / 1.5 / 2.0 для мультипликатор-бустов, `+N` (int-сериализованный) для hp_max
- `duration_seconds: INT` — например, 900 / 1800 / 3600

Это даёт возможность иметь «Малый эликсир XP (1.25× / 15мин)», «Великий эликсир XP (2× / 1ч)» одним типом (`booster_xp`) с разными ценами.

### Boost stacking: один активный слот на тип

- При активации `booster_xp`, если `user.active_xp_expires_at > now()` — backend возвращает 409 `already_active`, frontend показывает disabled-кнопку «Активно до HH:MM».
- После истечения — можно активировать следующий того же типа.
- Разные типы независимы: XP-буст и gold-буст могут быть активны одновременно; два разных stat-буста (strength + wisdom) — тоже.
- HP-max буст — отдельный слот (не пересекается ни с XP, ни с потионами).

### Purchase flow

1. Юзер нажимает «Купить» на карточке → confirm-модал (переиспользовать `frontend/src/components/ConfirmModal.jsx`) со словами «Купить [name] за [price] gold?».
2. При подтверждении: frontend генерирует `uuid4()`, вызывает `POST /api/shop/buy/{shop_item_id}` с body `{ idempotency_key: UUID }`.
3. Backend атомарно: проверяет `user.gold >= shop_item.price_gold` (иначе 400 `insufficient_gold`) → проверяет idempotency-запись (если есть — возвращает сохранённый ответ) → списывает gold → upserts `inventory_items` (если уже есть — `quantity += 1`; для `skin` повторная покупка — 409 `already_owned`) → записывает idempotency.
4. Frontend: `queryClient.setQueryData(['user'])` оптимистично или invalidate + refetch.

### Activation flow (бусты + зелья)

- `POST /api/inventory/{inventory_item_id}/activate` body `{ idempotency_key: UUID }`.
- Backend dispatches по `inventory_item.shop_item.item_type`:
  - `booster_*`: проверяет, что слот свободен (`active_<type>_expires_at IS NULL OR < now()`). Если занят → 409. Иначе атомарно: `quantity -= 1` (delete row если 0), `active_<type>_multiplier = effect_multiplier`, `active_<type>_expires_at = now() + duration_seconds`.
  - `potion_heal`: атомарно `hp = min(hp + heal_amount, effective_max_hp)`, `quantity -= 1`.
  - `skin`: 400 `use_equip_endpoint` (скины экипируются отдельно).

### Equip flow (скины — отдельный endpoint)

- `POST /api/inventory/{inventory_item_id}/equip` body `{ idempotency_key: UUID }`.
- Backend проверяет `item_type = 'skin'` → `user.selected_avatar = shop_item.avatar_key`. `quantity` не трогается (collection).
- Dedicated endpoint не `/activate` — явно разделяем контракт equip vs consume.

### Cancel активного буста: нельзя

Активированный буст тикает до истечения. Нет endpoint'а для досрочной отмены. Оправдание: RPG-логика «выпил зелье — не вернёшь», упрощает логику, снимает UX-вопросы «что если активировал случайно и хочешь сохранить на потом».

### Lazy expire (нет cron/scheduler)

- Background-таск для зачистки expires_at не нужен в Phase 5.
- `UserSchema` (и любой эндпоинт, читающий user) вычисляет effective-значения в момент чтения:
  ```
  effective_xp_mult    = active_xp_mult    if (active_xp_expires_at    and now < active_xp_expires_at)    else 1.0
  effective_gold_mult  = active_gold_mult  if (active_gold_expires_at  and now < active_gold_expires_at)  else 1.0
  effective_strength_xp_mult = ... (аналогично для wisdom/endurance/charisma)
  effective_max_hp     = base_max_hp + (active_hp_max_bonus if (active_hp_max_expires_at and now < active_hp_max_expires_at) else 0)
  ```
- `complete_quest` применяет `effective_xp_mult` к rewards и `effective_<stat>_xp_mult` к stat-gain (из Phase 4 `apply_stat_xp`).
- `fail_quest` использует `effective_max_hp` при клампе HP после penalty.
- При истечении hp-max буста в момент read: если `hp > effective_max_hp` → clamp to new max (в том же lazy-check).

### UI: активные эффекты в Header.jsx

- Видимы везде (на любой странице) — в `frontend/src/components/Header.jsx`.
- Компактная строка иконок (эмодзи или lucide) + mm:ss таймер справа от gold/XP-блока.
- Если активны несколько бустов — отображать все в ряд (до 6), сортировка по времени до истечения.
- Таймер тикует на клиенте (`setInterval(1000)` computed из `expires_at`), без сетевых round-trip. `react-query invalidate ['user']` периодически (например раз в 60с) чтобы словить истечение.

### UI: ShopPage — 4 вкладки-фильтра

- «Все» / «Бусты» / «Скины» / «Зелья» — чипы сверху под Header.
- Вкладка «Бусты» агрегирует все `booster_*` item_types (xp + gold + stat×4 + hp_max).
- Вкладка «Зелья» — только `potion_heal` (отдельно т.к. консумабл без таймера / другая семантика).
- При фильтре «Все» — все товары плоским списком.
- **Filter «slots» убрать** (SHOP-04 Out of Scope).
- Текущий retro-стиль карточек в `ShopPage.jsx` сохранить (чёрные карточки, золотая кнопка price, иконка слева). Перевести с hardcoded items на `GET /api/shop` + `useQuery(['shop-items'])`.

### UI: покупка — insufficient_gold

- Client-side: если `shop_item.price_gold > user.gold` — кнопка цены затемнена (opacity-50 + strike или `×`-иконка), цена красным.
- Tap по disabled-кнопке показывает toast «Не хватает gold ({have} из {need})».
- Backend всё равно валидирует (защита от старых данных / обхода) и возвращает 400 `insufficient_gold`.

### UI: InventoryPage — секции по типам

Заменить текущую 4×4 сетку в `frontend/src/pages/InventoryPage.jsx` на 4 секции:

1. **Активные эффекты** (только если есть timer'ы > now) — строки с иконкой, именем, таймером mm:ss. Нет действий (cancel запрещён).
2. **Бусты** — grid/list owned `booster_*` items с quantity-badge и кнопкой «Активировать» (disabled если слот типа занят).
3. **Скины** — grid owned `skin` items с кнопкой «Экипировать» (highlight у текущего `user.selected_avatar`).
4. **Зелья** — owned `potion_heal` items с quantity и кнопкой «Использовать».

Существующая «карточка предмета» модалка (код в `InventoryPage.jsx:75-131`) — переиспользовать для detail-view при клике.

### UI: AvatarSelector — замки на premium

В `frontend/src/components/AvatarSelector.jsx`:
- Получает все скины (free + premium) как пропс (или хук).
- Premium без покупки — рендерится с оверлеем: grayscale + icon замок + цена мелким шрифтом.
- Клик по locked-скину → либо переход на `/app/shop` с фильтром «Скины», либо inline confirm-модал покупки прямо из AvatarSelector (Claude's Discretion — проще первый вариант).
- Клик по owned-скину → `/api/inventory/{id}/equip`.

### UI: completion-popup (из Phase 4) — добавление буст-инфо

При `complete_quest` rewards показываются через popup уже в Phase 4 (`+XP`, `+gold`, `+stat`). В Phase 5 — если активный буст повлиял на reward, добавить строку «⚡ XP-буст ×1.5» под rewards (визуальная атрибуция «почему больше чем обычно»).

### Skin catalog & migration

- `avatar1` Рыцарь → free (default для новых users в `crud.create_user`).
- `avatar2` Маг → premium skin, seed в shop_items.
- `avatar3` Тень → premium skin, seed в shop_items.
- +2-3 новых skin-позиции в seed с placeholder-артом (можно использовать копии avatar1 с CSS-фильтрами `hue-rotate`/`sepia` как mock-assets; финальный арт — post-Phase 5).
- **Migration не требуется** (DB только тестовая, production не запущен). Если тестовый юзер с `selected_avatar='avatar2'` или `'avatar3'` попадёт в prod-запуск — это ОК, т.к. тестовые данные будут пересозданы.

### Quest slot cap (5)

- Константа `MAX_ACTIVE_QUESTS = 5` в `backend/app/utils/game_logic.py`.
- `POST /api/quests/save` (в `routers/quests.py`): перед insert — count active quests (is_completed=False AND is_failed=False); если ≥ 5 → 409 `active_limit_reached`.
- Frontend:
  - `QuestsPage.jsx`: кнопка «+ Новый квест» с subtitle «{count}/5». Если count=5 — disabled.
  - Если всё же POST → получен 409 → toast «Лимит 5/5. Заверши активные квесты».
- **Без ссылки на shop** в toast (SHOP-04 Out of Scope).

### Idempotency (pattern)

- Все три endpoint'а (`/buy`, `/activate`, `/equip`) принимают `idempotency_key: str` (UUIDv4) в body.
- Frontend генерирует UUID при клике (React useState / useRef per-button), шлёт один раз.
- Backend: таблица `idempotency_keys (user_id, key, response_json, created_at)` с `UNIQUE(user_id, key)`. При повторе — возвращает сохранённый response (200 с исходным телом). TTL cleanup — не в Phase 5 (допустимо копить).
- **Альтернатива** (Claude's Discretion): Redis с TTL 24ч вместо табличного persistent storage.

### Seed data (~25 товаров, цены 100–2000 gold)

| Тип                       | Вариантов | Примерные цены (gold)     | Мультипликатор / эффект           | Duration        |
|---------------------------|-----------|----------------------------|------------------------------------|-----------------|
| `booster_xp`              | 3         | 100 / 300 / 800            | 1.25× / 1.5× / 2.0×                | 15 / 30 / 60 мин |
| `booster_gold`            | 3         | 100 / 300 / 800            | 1.25× / 1.5× / 2.0×                | 15 / 30 / 60 мин |
| `booster_<stat>_xp` × 4   | 2 × 4 = 8 | 150 / 400 на каждый стат   | 1.5× / 2.0×                        | 30 / 60 мин     |
| `booster_hp_max`          | 2         | 200 / 500                  | +20 / +50 max_hp                    | 30 / 60 мин     |
| `potion_heal`             | 3         | 50 / 150 / 400             | heal_amount 25 / 50 / 100           | — (instant)     |
| `skin`                    | 5         | 500 / 1000 / 1500 / 2000 / 2000 | avatar2/avatar3/+3 placeholder  | —               |
| **Итого**                 | **24**    |                            |                                    |                 |

Точные значения — Claude's Discretion (planner может пересмотреть в balance-review). Важно: все эти числа — decisions **в seed-данных**, не константы в коде; балансировать можно без миграций.

### Backend tables (шкаф decisions, schema — planner решает окончательно)

**`shop_items`**:
- `id PK`
- `item_type VARCHAR NOT NULL` (одно из 9 значений, ENUM или `CHECK`)
- `name VARCHAR NOT NULL` (ру label)
- `description VARCHAR`
- `icon VARCHAR` (эмодзи или asset-key)
- `price_gold INT NOT NULL`
- `effect_multiplier FLOAT NULL` (для мульт-бустов)
- `duration_seconds INT NULL` (для timer-бустов)
- `heal_amount INT NULL` (только для `potion_heal`)
- `hp_max_bonus INT NULL` (только для `booster_hp_max`)
- `avatar_key VARCHAR NULL` (только для `skin`, мэпится в existing avatar IDs)
- `is_active BOOLEAN DEFAULT TRUE` (показывать ли в каталоге)

**`inventory_items`**:
- `id PK`
- `user_id FK users.id NOT NULL`
- `shop_item_id FK shop_items.id NOT NULL`
- `quantity INT NOT NULL DEFAULT 1`
- `created_at DATETIME`
- `UNIQUE(user_id, shop_item_id)`

**`idempotency_keys`** (если выбрали табличный подход, не Redis):
- `id PK`
- `user_id FK`
- `key VARCHAR NOT NULL`
- `response_json TEXT NOT NULL`
- `created_at DATETIME`
- `UNIQUE(user_id, key)`

**User additions** (denormalized slot columns — **Claude's Discretion** vs normalized `user_active_boosts` table):
- `active_xp_mult FLOAT NULL`, `active_xp_expires_at DATETIME NULL`
- `active_gold_mult FLOAT NULL`, `active_gold_expires_at DATETIME NULL`
- `active_strength_xp_mult FLOAT NULL`, `active_strength_xp_expires_at DATETIME NULL`
- `active_wisdom_xp_mult FLOAT NULL`, `active_wisdom_xp_expires_at DATETIME NULL`
- `active_endurance_xp_mult FLOAT NULL`, `active_endurance_xp_expires_at DATETIME NULL`
- `active_charisma_xp_mult FLOAT NULL`, `active_charisma_xp_expires_at DATETIME NULL`
- `active_hp_max_bonus INT NULL`, `active_hp_max_expires_at DATETIME NULL`

*Итого +14 колонок (денормализованно) или 1 таблица с `(user_id, boost_type)` PK (нормализованно). Planner выбирает: денормализация — один SELECT без JOIN, но 14 колонок; нормализация — чище расширять, но +JOIN на каждое чтение user. Оба варианта реалистичны; решение зависит от плотности кода.*

### Claude's Discretion

- Денормализованные user-колонки vs нормализованная `user_active_boosts` таблица (планирование).
- Точные seed-цены и duration/multiplier в рамках диапазонов выше.
- Эмодзи/иконки lucide-react для товаров в каталоге.
- Placeholder-арт для 3 новых skin-позиций (CSS-фильтры над `avatar1.png` / `hue-rotate` / `sepia` или генерация placeholder).
- Toast-анимации и completion-popup расширения для «⚡ XP-буст ×1.5» строки.
- Способ seed'а: Alembic data-migration vs `backend/app/seed_shop.py` вызываемый на startup (`@app.on_event("startup")`).
- Idempotency store: таблица vs Redis (Redis — деплоится в Phase 11; для Phase 5 безопаснее табличный).
- Где хранится `MAX_ACTIVE_QUESTS`: env var `MAX_ACTIVE_QUESTS=5` в `config.py` vs hardcoded константа в `game_logic.py`.
- Поведение при клике на locked-скин в AvatarSelector: прямая покупка inline vs переход на `/app/shop`.
- Ordering активных бустов в Header, если активны сразу несколько.

</decisions>

<specifics>
## Specific Ideas

- Лавка существует как заглушка `frontend/src/pages/ShopPage.jsx` (retro chёрно-золотой стиль, карточки с price-button справа). Переиспользуем скелет, меняем data-source на `GET /api/shop`.
- Рюкзак существует как заглушка `frontend/src/pages/InventoryPage.jsx` с 4×4 сеткой слотов и модалкой деталей. Скелет модалки переиспользуем, сетку — заменяем на секции.
- `backend/app/utils/game_logic.py` — пустой после Phase 4 добавлений. В Phase 5 добавляем `MAX_ACTIVE_QUESTS`, `effective_multipliers(user, now)` helper, `apply_purchase(user, item, idempotency_key)` helper, `apply_activation(user, inv_item, now)` helper.
- AI-рекомендация (Phase 4) уже использует `user.stat_*_level` — она НЕ должна вдруг учитывать активные бусты в Phase 5 (это AI-персонализация, Phase 6). Бусты применяются ТОЛЬКО в `complete_quest` reward-расчёте и в rendering effective-max_hp.
- `user.xp_multiplier` / `user.gold_multiplier` колонки, существующие с Phase 2, сейчас `Float default=1.0` и не используются в `complete_quest` логике. Phase 5 вводит effective-мультипликаторы сверх этих базовых (base × active) — existing колонки остаются «base мультипликатор» (для будущего premium-аккаунта / event-баффов).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`frontend/src/pages/ShopPage.jsx`** (ныне заглушка с hardcoded 6 items): retro card-layout готов. Переиспользуем стилистику карточек (black glass + золотая price-кнопка), меняем data source на `useQuery(['shop-items'], shopService.getCatalog)` и добавляем фильтр-табы сверху.
- **`frontend/src/pages/InventoryPage.jsx`** (ныне заглушка с 4×4 grid + item-modal): Модалка деталей (`InventoryPage.jsx:75-131`) — переиспользуем для detail view. Grid-scheme заменяем на секции.
- **`frontend/src/components/ConfirmModal.jsx`** — готовый generic confirm-диалог. Используем для «Купить [name] за [price] gold?».
- **`frontend/src/components/AvatarSelector.jsx`** (36 строк) — сетка аватаров. Расширяем: добавляем lock-state для premium + оверлей с иконкой замка и ценой.
- **`frontend/src/components/Header.jsx`** — существующий top-bar с gold/XP/user name. Добавляем слот под иконки активных бустов + mm:ss-таймер.
- **`backend/app/routers/quests.py::complete_quest`** — атомарная мутация `user.xp/gold/lvl/stat_*`. Добавляем перемножение на `effective_xp_mult` / `effective_gold_mult` и на `effective_<stat>_xp_mult` перед `apply_stat_xp`.
- **`backend/app/routers/quests.py::save_quest`** — добавляем проверку `MAX_ACTIVE_QUESTS` перед insert.
- **`backend/app/utils/game_logic.py`** — там уже `STAT_GROWTH`, `CATEGORY_TO_STAT`, `max_xp_for_level`, `apply_stat_xp` из Phase 4. Добавляем `MAX_ACTIVE_QUESTS`, `effective_multipliers(user, now)` → dict, `apply_purchase`, `apply_activation`, `apply_equip`, `apply_heal`.
- **Alembic migrations (`backend/alembic/versions/`)** — уже три миграции (baseline, add_auth_fields, Phase 4). Phase 5 добавляет 4-ю миграцию с новыми таблицами и user-колонками.
- **`frontend/src/services/api.js`** — axios с JWT + 401-refresh interceptor. Новые сервисы (`shopService`, `inventoryService`) следуют паттерну `userService`.
- **react-query (`@tanstack/react-query`)** — уже использует Phase 3/4 паттерн `useQuery(['user'])` / `setQueryData`. Новые хуки: `useQuery(['shop-items'])`, `useQuery(['inventory'])`; инвалидация `['user']` + `['inventory']` после mutation.

### Established Patterns

- **JWT `Depends(get_current_user)`** — все новые эндпоинты `/api/shop/*` и `/api/inventory/*` следуют этому паттерну (Phase 3 contract).
- **Pydantic schemas** — новые `ShopItemSchema`, `InventoryItemSchema`, `PurchaseRequest`, `ActivateRequest`, `EquipRequest` идут в `backend/app/schemas.py` рядом с `UserSchema` / `QuestSchema`.
- **Atomic mutations в `complete_quest`** — паттерн `await db.begin()` / `flush` / `commit`. Покупка и активация следуют тому же паттерну.
- **Retro-стилистика:** `font-mono`, золотой акцент `#daa520`, `shadow-[4px_4px_0_#000]`, `uppercase`, `tracking-widest`. Все новые компоненты подчиняются.
- **Имена категорий / статов русскими** (из Phase 4 CONTEXT.md): СИЛА / МУДРОСТЬ / ВЫНОСЛИВОСТЬ / ОБАЯНИЕ. Stat-бусты в UI: «Эликсир силы», «Эликсир мудрости» и т.д.
- **`useQueryClient().setQueryData(['user'], ...)`** — оптимистичные обновления user-data после mutation (из Phase 4).

### Integration Points

- `backend/app/models.py::User` — добавить 14 active-boost колонок (denormalized) или flag no changes + новая таблица `user_active_boosts` (normalized) — planner.
- `backend/app/models.py` — новые `ShopItem`, `InventoryItem`, возможно `IdempotencyKey` (Base-classes в том же файле).
- `backend/app/schemas.py::UserSchema` — не меняется; effective-мультипликаторы вычисляются в response-builder'е, не хранятся.
- `backend/app/schemas.py` — новые схемы `ShopItemSchema`, `InventoryItemSchema`, `PurchaseRequest(idempotency_key)`, `ActivateRequest`, `EquipRequest`.
- `backend/app/routers/` — новые файлы `shop.py`, `inventory.py`. Регистрация в `main.py` рядом с `quests_router` / `auth_router`.
- `backend/app/routers/quests.py::complete_quest` — применить `effective_mult`; вернуть поля `applied_boosts: [{type, mult}]` для completion-popup.
- `backend/app/routers/quests.py::save_quest` — проверить `MAX_ACTIVE_QUESTS`.
- `backend/app/utils/game_logic.py` — добавить `MAX_ACTIVE_QUESTS`, `effective_multipliers`, `apply_purchase`, `apply_activation`, `apply_equip`, `apply_heal`.
- `backend/app/crud.py` — CRUD для shop (`get_catalog`), inventory (`get_inventory`, `upsert_inventory_item`), active-boost reads.
- `backend/alembic/versions/` — новый revision: создать shop_items, inventory_items, idempotency_keys (опционально); +14 колонок user или +user_active_boosts.
- **Seed script:** `backend/app/seed_shop.py` с 24+ позициями + startup-hook в `main.py` (idempotent insert по unique-constraint name).
- `frontend/src/services/api.js` — добавить `shopService.getCatalog`, `shopService.buy(itemId, idempotencyKey)`, `inventoryService.list`, `inventoryService.activate(invId, idempotencyKey)`, `inventoryService.equip(invId, idempotencyKey)`.
- `frontend/src/pages/ShopPage.jsx` — переписать на useQuery + 4 filter-tabs + retro-карточки + confirm-модал при buy.
- `frontend/src/pages/InventoryPage.jsx` — переписать на секции (Активные эффекты / Бусты / Скины / Зелья) с кнопками действий.
- `frontend/src/pages/QuestsPage.jsx` — cap 5 enforcement: disabled-кнопка добавления + обработка 409 `active_limit_reached` в toast.
- `frontend/src/pages/CharacterPage.jsx::AVATARS` — скорее всего надо перенести в `backend`-driven список (через shopService или статику) чтобы AvatarSelector знал про premium.
- `frontend/src/components/AvatarSelector.jsx` — добавить lock-state для premium, оверлей с замком и ценой.
- `frontend/src/components/Header.jsx` — добавить слот активных бустов (иконка + mm:ss, тикает через `setInterval(1000)` на клиенте, источник — effective-блок из `/user/me`).
- `frontend/src/stores/userStore.js` — если нужно кешировать activeBoosts отдельно (не обязательно, можно хранить в react-query cache).
- `REQUIREMENTS.md` — **переместить SHOP-04 в Out of Scope** (отдельное редактирование в первом-же плане phase 5).

</code_context>

<deferred>
## Deferred Ideas

- **Снаряжение / equipment** (оружие / броня / аксессуары — слоты экипировки, passive-бонусы к статам / xp_mult / gold_mult, взаимодействие с existing бустами). Это полноценная RPG-подсистема. Предлагаемый следующий шаг: `/gsd:add-phase` → «Phase 5.5 Equipment & Unique Items» → отдельный `/gsd:discuss-phase` цикл.
- **Уникальные предметы** (2-я жизнь на fail, respawn-charges, one-time special effects вроде «перо Феникса», «древний фолиант раскрывает скрытый навык»). Меняет quest-fail flow (из Phase 1-3). Идёт пакетом с equipment.
- **SHOP-04 (покупка слотов квестов)** — Out of Scope навсегда; `REQUIREMENTS.md` перемещаем в Out of Scope.
- **Background-cleanup истёкших бустов** (обнуление expires_at-полей cron-ом) — Phase 11 Production Polish.
- **Redis-based idempotency** — переход с табличного storage на Redis TTL, решается в Phase 11, когда Redis уже в проде.
- **Migration/backfill производственных юзеров** — актуально только после запуска prod; сейчас DB тестовая.
- **AvatarSelector inline-покупка (прямой checkout из модалки)** — UX-полировка, можно добавить после Phase 5 playtesting.
- **Воздействие эквипированного скина на AI-промпт / сторителлинг** — нет механического effect в Phase 5, только косметика.
- **Мультипликатор character XP от статов** (`Wis → xp_mult`) — было в Phase 4 Deferred; остаётся Deferred до Phase balance-review.

</deferred>

---

*Phase: 05-shop-inventory*
*Context gathered: 2026-04-21*
