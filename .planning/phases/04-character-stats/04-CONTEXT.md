# Phase 4: Character Stats - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Персонаж имеет 4 именованных стата (Strength / Wisdom / Endurance / Charisma), каждый со своим независимым уровнем и XP-прогрессом (отдельно от character XP). При создании квеста игрок явно выбирает категорию (work / fitness / learning / social). Завершение квеста начисляет stat XP соответствующему стату. Статы видны на `/app/character` и в ProfileModal. AI при оценке нового квеста получает текущие stat-уровни и учитывает их при выставлении награды.

**Out of scope:** влияние статов на gold/xp-мультипликаторы и HP, stat-гейты контента, покупка roll-over в магазине, AI-категоризация старых квестов. Все эти идеи — в Deferred.

</domain>

<decisions>
## Implementation Decisions

### Category → Stat mapping (canonical 1:1)

| DB category key | UI label (ru) | Grows stat | DB stat column prefix |
|-----------------|---------------|-----------|-----------------------|
| `fitness`       | ТРЕНИРОВКА    | Strength  | `stat_strength_*`     |
| `learning`      | УЧЁБА         | Wisdom    | `stat_wisdom_*`       |
| `work`          | РАБОТА        | Endurance | `stat_endurance_*`    |
| `social`        | ОБЩЕНИЕ       | Charisma  | `stat_charisma_*`     |

- В БД — английские ключи категорий (`work`, `fitness`, `learning`, `social`).
- В UI — только русские labels для категорий и русские имена статов (СИЛА / МУДРОСТЬ / ВЫНОСЛИВОСТЬ / ОБАЯНИЕ).
- Цвета статов (переиспользуем существующий `ProfileModal.jsx` stub):
  - Strength → `text-red-500`
  - Endurance → `text-green-500`
  - Wisdom → `text-blue-500`
  - Charisma → `text-yellow-500`

### Stat schema (отдельный XP от character XP)

Каждый стат — независимая пара `level + xp`, параллельная существующей паре `user.lvl / user.xp`:

- `users.stat_strength_level`, `users.stat_strength_xp`
- `users.stat_wisdom_level`, `users.stat_wisdom_xp`
- `users.stat_endurance_level`, `users.stat_endurance_xp`
- `users.stat_charisma_level`, `users.stat_charisma_xp`

Все 8 колонок `INTEGER NOT NULL`, `server_default=1` для `_level`, `server_default=0` для `_xp`. Порог лэвелапа считается на лету: `max_xp(lvl) = round(10 × 1.2^(lvl-1))`. Порог и формулу хранить константой в `backend/app/utils/game_logic.py`, не в БД.

### Stat growth amounts

| Difficulty | Stat XP |
|------------|---------|
| easy       | +1      |
| medium     | +2      |
| hard       | +4      |
| epic       | +8      |

- Завершение квеста начисляет stat XP **только** стату категории квеста. Остальные статы не трогаются.
- Character XP (`user.xp`) начисляется как сейчас — Phase 4 ничего не меняет в character-leveling.
- Failed quest — stat XP не снимается, ведёт себя как сейчас (только HP penalty).
- Кап у стата отсутствует — растёт бесконечно, прогресс-бар считается относительно `max_xp(current_level)`.
- Level-up для стата работает тем же циклом, что и для user (`while stat_xp >= max_xp(stat_lvl): stat_xp -= max_xp; stat_lvl += 1`).

### Quest schema

- `quests.category` — `VARCHAR` **nullable** (для legacy-квестов, созданных до Phase 4).
- Server/API: для всех новых квестов (через `/api/quests/save`) категория **обязательна** (Pydantic-валидация в `QuestSave` / `QuestCreate`).
- Для `NULL` категорий в старых квестах stat-рост не применяется (в `complete_quest` ветка пропуска).

### UI: stat display

Статы показываются в **двух местах** — single source через `useQuery(['user'])`:

1. **CharacterPage.jsx** — новая секция под блоком HP/XP прогресс-баров:
   - 2×2 сетка, для каждого стата:
     - Строка 1: русское имя + `LVL N`
     - Строка 2: тонкий progress bar (xp / max_xp) в цвете стата
2. **ProfileModal.jsx** — заменить захардкоженный stub (СИЛА/ЛОВКОСТЬ/ИНТЕЛЛЕКТ/УДАЧА, значения 14/22/18/7):
   - Имена: СИЛА / ВЫНОСЛИВОСТЬ / МУДРОСТЬ / ОБАЯНИЕ
   - Значения: из `character.stat_*_level`
   - Цвета — из существующего stub (`text-red-500`, `text-green-500`, `text-blue-500`, `text-yellow-500`), просто адаптированы под правильный порядок/имена.

### UI: category picker (AddTaskModal)

- Ряд из 4 кнопок-чипов под полем «Суть задания», перед полем «Дедлайн».
- Каждый чип: `lucide-react` иконка + русское слово. Предлагаемые иконки (финальный выбор Claude's Discretion):
  - РАБОТА → `Briefcase`
  - ТРЕНИРОВКА → `Dumbbell`
  - УЧЁБА → `BookOpen`
  - ОБЩЕНИЕ → `Users`
- Категория **обязательна**: кнопка «Оценить контракт» disabled пока не выбрано (как сейчас с `title.trim() && deadline`, добавляется условие `&& category`).
- Активный чип визуально — выделен золотом (`border-[#daa520]`, `text-[#daa520]`) в стиле существующих interactive элементов.
- Выбранная категория прокидывается в `POST /api/analyze` и затем в `POST /api/quests/save`.

### UI: quest card

- На QuestsPage в карточке квеста — маленькая иконка категории слева от title (размер ~16px, цвет — матчится со статом категории).
- Для legacy-квестов с `category=NULL` — иконка не рендерится (пустое место или placeholder).

### UI: completion feedback

- Текущий completion-поп показывает `+XP, +gold`. Добавить третью строку: `+N <русское имя стата>` с цветом стата (напр. `+4 ВЫНОСЛИВОСТЬ` зелёным).
- Если после начисления произошёл stat-level-up — дополнительно строка-anons: `НОВЫЙ УРОВЕНЬ: ВЫНОСЛИВОСТЬ LVL 3`.

### Backend: completion flow

В `routers/quests.py::complete_quest`, после начисления `user.xp` / `user.gold` / character level-up:

```
if quest.category:
    stat_gain = STAT_GROWTH[quest.difficulty]    # {easy:1, medium:2, hard:4, epic:8}
    stat_col = CATEGORY_TO_STAT[quest.category]  # "strength" | "wisdom" | ...
    apply_stat_xp(user, stat_col, stat_gain)     # handles level-up loop
```

`STAT_GROWTH`, `CATEGORY_TO_STAT`, `max_xp_for_level(lvl)`, `apply_stat_xp(user, stat_col, gain)` — все живут в `backend/app/utils/game_logic.py` (который сейчас пустой — отличное место для них).

Response от `POST /api/quests/complete/{id}` расширяется полями: `stat_gain: {name: "endurance", xp: 4, leveled_up: bool}` — фронт использует для completion popup.

### Backend: AI prompt integration

В `routers/quests.py::analyze_task` промпт расширяется блоком статов после блока STATUS:

```
СТАТЫ ИГРОКА (level):
- Сила: {user.stat_strength_level}
- Мудрость: {user.stat_wisdom_level}
- Выносливость: {user.stat_endurance_level}
- Обаяние: {user.stat_charisma_level}

КАТЕГОРИЯ КВЕСТА: {quest.category}

ПРАВИЛО: если стат, соответствующий категории этого квеста, НИЖЕ среднего по 4 статам — слегка увеличь XP/gold (+10%) и снизь hp_penalty (-10%), чтобы поощрить прокачку слабого направления.
```

### Migration

Один Alembic-ревижн — **только schema**, никаких data-migrations:

- `users` +8 колонок (`stat_{name}_level NOT NULL DEFAULT 1`, `stat_{name}_xp NOT NULL DEFAULT 0`).
- `quests` +1 колонка (`category VARCHAR NULL`).
- Существующие данные не трогаем: `server_default` наполняет новые колонки для старых строк; `quests.category` остаётся `NULL` для legacy.

### Legacy users / quests

- Существующие users: все 4 стата стартуют с LVL 1, 0 XP (через `server_default`).
- Существующие quests: `category = NULL` остаётся как есть. Complete этого квеста не начисляет stat XP (ветка `if quest.category:`). Иконка категории не рендерится на карточке.

### Stat effects on game mechanics

- В Phase 4 статы — **только vanity + AI-hint**. Ни на xp_mult / gold_mult, ни на max_hp не влияют.
- Любые эффекты (например, "Wis повышает xp_mult") — Deferred.

### Claude's Discretion

- Точный выбор lucide-иконок для категорий (есть ~6 разумных вариантов; начать с `Briefcase` / `Dumbbell` / `BookOpen` / `Users`).
- Визуальная плотность stat-секции на CharacterPage (padding, gap между прогресс-барами).
- Tailwind-анимация при stat-level-up (существующий паттерн для character level-up можно переиспользовать или сделать сдержаннее).
- Порядок статов в UI (предлагаю: Strength → Endurance → Wisdom → Charisma, но это полировка).
- Формулировка `РАБОТА/ТРЕНИРОВКА/УЧЁБА/ОБЩЕНИЕ` в tooltip при выборе (опционально).
- Fallback-поведение в `/api/analyze`, если AI вернул невалидную интерпретацию stat-подсказки.

</decisions>

<specifics>
## Specific Ideas

- Stat XP — это **собственный XP**, отдельный от character XP. Завершение квеста даёт и character XP (как сейчас, +40/80/250/500), и stat XP (+1/+2/+4/+8). Две независимые шкалы прогресса.
- Кривая лэвелапа статов совпадает с кривой character lvl (`×1.2` за уровень, старт 10), чтобы игроку не приходилось учить две разные системы.
- ProfileModal stat grid уже существует как заглушка с неправильными именами (ЛОВКОСТЬ / ИНТЕЛЛЕКТ / УДАЧА) — его просто переписываем на реальные 4 стата и на живые данные. Визуальный контур UI не меняется.
- AI-промпт расширяется аккуратно: не перепроектируем существующий — добавляем блок СТАТЫ после СТАТУС ИГРОКА, добавляем одно правило. Формат ответа не меняется.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`frontend/src/components/ProfileModal.jsx`** — готовая 2×2 сетка статов с цветами red/green/blue/yellow; сейчас заглушка с неправильными именами и хардкод-значениями. Phase 4 переписывает содержимое, UI-скелет остаётся.
- **`frontend/src/pages/CharacterPage.jsx::useQuery(['user'])`** — уже тянет `GET /api/user/me` и возвращает `UserSchema`. Стоит только расширить `UserSchema` новыми полями — фронт получит их бесплатно через `character.stat_*`.
- **`frontend/src/components/ProgressBar.jsx`** — готовый компонент прогресс-бара с `label`, `value`, `max`, `labelColor`, `barClass`, `shadowColor`. Используется для HP и XP на CharacterPage; тот же компонент для stat-прогресса.
- **`backend/app/utils/game_logic.py`** — пустой файл. Идеальное место под `STAT_GROWTH`, `CATEGORY_TO_STAT`, `max_xp_for_level`, `apply_stat_xp`.
- **`backend/app/routers/quests.py::complete_quest`** — уже делает атомарную мутацию `user.xp/gold/lvl` и level-up цикл. Stat-инкремент добавляется тем же паттерном в той же функции.
- **`backend/app/routers/quests.py::analyze_task`** — уже шлёт `lvl / current_hp / max_hp` в AI-промпт; блок статов добавляется таким же форматированием.
- **Alembic setup** (`backend/migrations/versions/`) — `baseline` + `add_auth_fields` на месте. Phase 4 добавляет третью миграцию тем же стилем.

### Established Patterns

- `UserSchema` в `backend/app/schemas.py` — single-source для контракта user между фронтом и бэком. Добавляем 8 полей (`stat_*_level`, `stat_*_xp`) — фронт получит автоматически.
- `QuestCreate` / `QuestSave` / `QuestSchema` — Pydantic-пайплайн для квестов. Добавляем `category: Literal["work", "fitness", "learning", "social"]` в Create/Save (обязательно) и `Optional[str]` в QuestSchema (nullable для legacy).
- `useQueryClient().setQueryData(['user'], ...)` для оптимистичных обновлений после completion (существующий паттерн из Phase 3).
- Ретро-стилистика: `font-mono`, `text-[9px/10px/11px]`, `tracking-widest`, `uppercase`, золотой акцент `#daa520`, тени `shadow-[4px_4px_0_#000]`. Всё новое UI подчиняется этим правилам.
- JWT `Depends(get_current_user)` на всех эндпоинтах — новые/изменённые эндпоинты следуют этому же паттерну.

### Integration Points

- `backend/app/models.py::User` — добавить 8 stat-колонок.
- `backend/app/models.py::Quest` — добавить `category` (nullable).
- `backend/app/schemas.py::UserSchema` — expose 8 stat-полей.
- `backend/app/schemas.py::QuestCreate/QuestSave/QuestSchema` — добавить `category`.
- `backend/app/utils/game_logic.py` — заполнить константы + функции.
- `backend/app/routers/quests.py::analyze_task` — расширить prompt блоком статов.
- `backend/app/routers/quests.py::complete_quest` — вызвать `apply_stat_xp`, вернуть stat-часть в response.
- `backend/app/routers/quests.py::save_quest` — сохранять `category`.
- `backend/migrations/versions/` — новая миграция.
- `frontend/src/components/AddTaskModal.jsx` — category picker.
- `frontend/src/pages/CharacterPage.jsx` — stat section.
- `frontend/src/components/ProfileModal.jsx` — real stats вместо stub.
- `frontend/src/components/QuestDetailsModal.jsx` и/или карточка на `QuestsPage.jsx` — иконка категории.
- Completion popup (в `QuestsPage.jsx` по текущему паттерну) — строка stat gain + опциональный level-up banner.

</code_context>

<deferred>
## Deferred Ideas

- **Stat effects on multipliers** — Wis → `xp_multiplier`, End → `max_hp` и т.д. Серьёзно меняет баланс и пересекается с Phase 5 (Shop boosts). Оставляем как отдельную фазу.
- **AI-backfill категорий для legacy-квестов** — дорого, медленно, риск ошибок. Пусть старые квесты остаются без категории.
- **Stat-гейты контента** (stat-требования для определённых квестов / shop items) — другая фаза, связана с Phase 5/6.
- **Stat каппинг по user.lvl** (cap = `lvl × 10` и т.п.) — рассмотреть, если лэвелапы статов слишком быстрые после Phase 4 playtesting.
- **Категория обязательна для AI-сгенерированных daily quests** (Phase 6) — естественно, тот же паттерн, но решение там.

</deferred>

---

*Phase: 04-character-stats*
*Context gathered: 2026-04-21*
