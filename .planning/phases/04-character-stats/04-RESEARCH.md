# Phase 4: Character Stats - Research

**Researched:** 2026-04-21
**Domain:** SQLAlchemy/Alembic schema extension + Pydantic v2 category enum + React/Tailwind stat UI + AI prompt augmentation
**Confidence:** HIGH (project-internal patterns dominate; every decision has an on-disk precedent)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Category → Stat mapping (canonical 1:1)**

| DB category key | UI label (ru) | Grows stat | DB stat column prefix |
|-----------------|---------------|-----------|-----------------------|
| `fitness`       | ТРЕНИРОВКА    | Strength  | `stat_strength_*`     |
| `learning`      | УЧЁБА         | Wisdom    | `stat_wisdom_*`       |
| `work`          | РАБОТА        | Endurance | `stat_endurance_*`    |
| `social`        | ОБЩЕНИЕ       | Charisma  | `stat_charisma_*`     |

- Backend/DB — английские ключи (`work`, `fitness`, `learning`, `social`).
- UI — только русские labels (СИЛА / МУДРОСТЬ / ВЫНОСЛИВОСТЬ / ОБАЯНИЕ).
- Цвета статов: Strength → `text-red-500`, Endurance → `text-green-500`, Wisdom → `text-blue-500`, Charisma → `text-yellow-500`.

**Stat schema (отдельный XP от character XP)**

8 колонок в `users`, все `INTEGER NOT NULL`:
- `stat_strength_level`, `stat_strength_xp`
- `stat_wisdom_level`, `stat_wisdom_xp`
- `stat_endurance_level`, `stat_endurance_xp`
- `stat_charisma_level`, `stat_charisma_xp`

`server_default=1` для `_level`, `server_default=0` для `_xp`. Порог лэвелапа — константа `max_xp(lvl) = round(10 × 1.2^(lvl-1))` в `backend/app/utils/game_logic.py`, в БД не хранится.

**Stat growth amounts**

| Difficulty | Stat XP |
|------------|---------|
| easy       | +1      |
| medium     | +2      |
| hard       | +4      |
| epic       | +8      |

- Начисляется **только** стату категории квеста; остальные не трогаются.
- Character XP (`user.xp`) — как сейчас, без изменений.
- Failed quest — stat XP не снимается (только HP penalty).
- Кап у стата отсутствует; прогресс-бар относительно `max_xp(current_level)`.
- Level-up loop: `while stat_xp >= max_xp(stat_lvl): stat_xp -= max_xp; stat_lvl += 1` (тот же паттерн, что в `complete_quest` для user.xp).

**Quest schema**

- `quests.category` — `VARCHAR` **nullable** (legacy-квесты).
- Для новых квестов (через `/api/quests/save`) категория **обязательна** (Pydantic).
- Для `NULL` категорий — ветка пропуска в `complete_quest`.

**UI: stat display (двоеточие single source через `useQuery(['user'])`)**

1. **CharacterPage.jsx** — новая секция под блоком HP/XP:
   - 2×2 сетка, для каждого стата: `LVL N` + тонкий progress bar (xp / max_xp) в цвете стата.
2. **ProfileModal.jsx** — заменить stub (СИЛА/ЛОВКОСТЬ/ИНТЕЛЛЕКТ/УДАЧА) на реальные СИЛА/ВЫНОСЛИВОСТЬ/МУДРОСТЬ/ОБАЯНИЕ с цветами red/green/blue/yellow и `character.stat_*_level`.

**UI: category picker (AddTaskModal)**

- Ряд из 4 chip-кнопок под «Суть задания», перед «Дедлайн».
- `lucide-react` иконки: `Briefcase` / `Dumbbell` / `BookOpen` / `Users`.
- Категория обязательна — кнопка «Оценить контракт» disabled пока не выбрано.
- Активный chip — золотой (`border-[#daa520]`, `text-[#daa520]`).
- Выбранная категория → `POST /api/analyze` → `POST /api/quests/save`.

**UI: quest card**

- Маленькая иконка категории (~16px, цвет стата) слева от title на QuestsPage.
- Для legacy `category=NULL` — иконка не рендерится.

**UI: completion feedback**

- Добавить строку `+N <русское имя стата>` (цвет стата) в completion popup рядом с `+XP, +gold`.
- При stat-level-up — строка `НОВЫЙ УРОВЕНЬ: ВЫНОСЛИВОСТЬ LVL 3`.

**Backend: completion flow**

```python
if quest.category:
    stat_gain = STAT_GROWTH[quest.difficulty]    # {easy:1, medium:2, hard:4, epic:8}
    stat_col = CATEGORY_TO_STAT[quest.category]  # "strength" | "wisdom" | ...
    apply_stat_xp(user, stat_col, stat_gain)     # handles level-up loop
```

`STAT_GROWTH`, `CATEGORY_TO_STAT`, `max_xp_for_level(lvl)`, `apply_stat_xp(user, stat_col, gain)` — все в `backend/app/utils/game_logic.py`.

Response от `POST /api/quests/complete/{id}` расширяется: `stat_gain: {name: "endurance", xp: 4, leveled_up: bool}`.

**Backend: AI prompt integration**

В `analyze_task` после блока STATUS:
```
СТАТЫ ИГРОКА (level):
- Сила: {user.stat_strength_level}
- Мудрость: {user.stat_wisdom_level}
- Выносливость: {user.stat_endurance_level}
- Обаяние: {user.stat_charisma_level}

КАТЕГОРИЯ КВЕСТА: {quest.category}

ПРАВИЛО: если стат, соответствующий категории этого квеста, НИЖЕ среднего по 4 статам — слегка увеличь XP/gold (+10%) и снизь hp_penalty (-10%), чтобы поощрить прокачку слабого направления.
```

**Migration** — один Alembic-ревижн, только schema:
- `users` +8 колонок (`stat_{name}_level NOT NULL DEFAULT 1`, `stat_{name}_xp NOT NULL DEFAULT 0`).
- `quests` +1 колонка (`category VARCHAR NULL`).
- `server_default` наполняет новые колонки для старых строк; `quests.category` остаётся `NULL` для legacy.

**Legacy users / quests**
- Users: 4 стата стартуют с LVL 1, 0 XP.
- Quests: `category = NULL`, complete не начисляет stat XP.

**Stat effects on game mechanics** — Phase 4: только vanity + AI-hint. Ни xp_mult/gold_mult/max_hp не влияют.

### Claude's Discretion
- Точный выбор lucide-иконок (начать с `Briefcase` / `Dumbbell` / `BookOpen` / `Users`).
- Визуальная плотность stat-секции на CharacterPage (padding/gap).
- Tailwind-анимация при stat-level-up (можно переиспользовать character level-up или сдержаннее).
- Порядок статов в UI (предложен Strength → Endurance → Wisdom → Charisma).
- Формулировка в tooltip при выборе (опционально).
- Fallback-поведение в `/api/analyze`, если AI вернул невалидную интерпретацию stat-подсказки.

### Deferred Ideas (OUT OF SCOPE)
- Stat effects на xp_mult/gold_mult/max_hp — отдельная фаза.
- AI-backfill категорий для legacy-квестов — дорого и рискованно.
- Stat-гейты контента и shop items — связаны с Phase 5/6.
- Stat-каппинг по user.lvl — только если playtesting покажет необходимость.
- Категория для AI daily quests (Phase 6) — естественно сделается там.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROG-02 | Character has 4 named stats (Strength, Wisdom, Endurance, Charisma) visible on profile | Standard Stack §1 (SQLAlchemy columns + Pydantic), Architecture §1 (CharacterPage + ProfileModal stat grid), Code Examples §1-§4 |
| PROG-03 | Completing different quest types grows the corresponding character stat | Standard Stack §2 (`quests.category` + `CATEGORY_TO_STAT`), Architecture §2-§3 (category picker + completion flow), Code Examples §5-§6, AI prompt augmentation §7 |
</phase_requirements>

## Summary

Phase 4 расширяет существующую RPG-петлю одним дополнительным измерением — четырьмя категорийными статами, каждый со своим уровнем и XP. Вся работа ложится на уже установленный стек (SQLAlchemy 2.0 async + Alembic + Pydantic v2 + FastAPI + React 19 + TanStack Query 5 + Tailwind 4 + lucide-react). Новых библиотек не нужно; никаких архитектурных пертурбаций — только аккуратные локальные расширения восьми уже существующих файлов + одна новая Alembic-миграция + один новый util-модуль (`game_logic.py`, сейчас пустой).

Ключевые риски — **миграционные** (правильно добавить NOT NULL колонки к таблице с данными через `server_default`) и **контрактные** (синхронизация Pydantic enum для `category` между `QuestSave`/`QuestSchema` и фронтовым picker). Оба полностью решены паттернами, уже присутствующими в codebase: Phase 3 миграция `b74c083b2140_add_auth_fields.py` показывает именно тот шаблон для `gems INTEGER NOT NULL DEFAULT 0`, который мы переиспользуем для всех 8 stat-колонок.

AI prompt augmentation — нежирный rewrite; сохраняем существующий формат ответа (`difficulty` / `xp` / `gold` / `hp_penalty`), добавляем лишь блок СТАТЫ + правило. Модель `liquid/lfm-2.5-1.2b-thinking:free` уже склонна к небольшим отклонениям формата — fallback в `analyze_task` остаётся критичен и должен учитывать новое правило (игнорировать его как noise при ошибке).

**Primary recommendation:** Начать с миграции + models/schemas/util (pure backend foundation, нулевой риск для фронта), потом extended `complete_quest` + `analyze_task`, потом UI (picker → CharacterPage → ProfileModal → quest card → completion popup). Frontend работает сразу же через `UserSchema` без дополнительных fetch-ов (stat-поля появляются в `useQuery(['user'])` автоматически).

## Standard Stack

### Core (уже в проекте — ничего устанавливать не нужно)

| Library | Version (locked) | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| SQLAlchemy | 2.0.25 | ORM, `Column(Integer, nullable=False, server_default="N")` | Уже используется для `User`/`Quest`; миграции стабильны |
| Alembic | (installed) | Schema migrations (sync psycopg2 в `env.py`) | Baseline + 1 auth миграция уже применены |
| asyncpg | 0.29.0 | Async PG driver для runtime | Phase 1-3 |
| Pydantic | 2.5.3 | `Literal[...]`, `ConfigDict(from_attributes=True)`, `Optional` | Уже в `schemas.py`; нативно поддерживает enum-валидацию через `Literal` |
| pydantic-settings | 2.1.0 | Settings singleton (не расширяется в Phase 4) | — |
| FastAPI | 0.109.0 | Router + `Depends(get_current_user)` | Все endpoints уже на JWT |
| openai | 1.10.0 | `AsyncOpenAI` → OpenRouter | Promt расширяется на месте в `analyze_task` |
| React | 19.2.0 | UI | — |
| @tanstack/react-query | 5.99.0 | Server state (`['user']`, `['quests']`) | Уже single-source во фронте; stat-поля появятся free через `UserSchema` |
| axios | 1.13.5 | HTTP + refresh interceptor | — |
| lucide-react | 0.574.0 | Category icons (`Briefcase`, `Dumbbell`, `BookOpen`, `Users`) | Все 4 иконки проверены на диске в `frontend/node_modules/lucide-react/dist/esm/icons/` |
| tailwindcss | 4.1.18 | Stat colors (`text-red-500`, `text-green-500`, `text-blue-500`, `text-yellow-500`), золотой `#daa520` | — |
| zustand | 4 | `authStore` (не трогаем) | — |

### Supporting (reuse, не новое)

| Library / module | Purpose | When to Use |
|------------------|---------|-------------|
| `backend/app/utils/game_logic.py` (пустой файл — 0 строк, подтверждено) | Заселить константами `STAT_GROWTH`, `CATEGORY_TO_STAT`, функцией `max_xp_for_level(lvl)`, `apply_stat_xp(user, stat_name, gain)` | Единственный источник game-math для Phase 4+ |
| `frontend/src/components/ProgressBar.jsx` | Рендер stat XP / max_xp в цвете стата | На CharacterPage stat section |
| `frontend/src/components/ProfileModal.jsx` | 2×2 stat grid (skeleton уже готов; переписываем данные) | Заменить hardcoded `stats` array |

### Alternatives Considered (для справки — **не использовать**)

| Instead of | Could Use | Why we don't |
|------------|-----------|--------------|
| `server_default` на существующей таблице | Phased migration (nullable → backfill → NOT NULL) | Уже есть прецедент `gems` в Phase 3; Postgres хорошо обрабатывает `DEFAULT` при `ADD COLUMN NOT NULL` без table rewrite (метаданные, не физическая запись) |
| `Literal["work","fitness","learning","social"]` в Pydantic | `Enum` класс | Весь проект использует строки для difficulty (`"easy"`/`"medium"`…); остаёмся в этом стиле. `Literal` даёт такую же валидацию без импорта enum |
| Отдельный JSON-столбец `stats` | 8 отдельных колонок | Проигрыш в индексации, сложнее мигрировать значения, нельзя ORDER BY stat. 8 колонок — явное решение, уже locked в CONTEXT |
| Новая таблица `user_stats` | Plain `users` columns | Оверкилл; 8 integer-колонок на user — не проблема, join избыточен |

**Installation:** None. Zero new dependencies.

## Architecture Patterns

### Recommended Project Structure (deltas only)

```
backend/
├── app/
│   ├── models.py              # User +8 stat columns; Quest +category
│   ├── schemas.py             # UserSchema +8 fields; QuestSave/QuestCreate/QuestSchema +category
│   ├── crud.py                # (optional) apply_stat_xp helper; или всё в utils
│   ├── utils/
│   │   └── game_logic.py      # [NEW CONTENT] STAT_GROWTH, CATEGORY_TO_STAT, max_xp_for_level, apply_stat_xp
│   └── routers/
│       └── quests.py          # analyze_task: +stats block in prompt; complete_quest: +stat gain + level-up
├── migrations/
│   └── versions/
│       └── XXXXX_add_character_stats.py   # [NEW] users +8 cols, quests +category

frontend/
├── src/
│   ├── components/
│   │   ├── AddTaskModal.jsx          # +category chips row, disabled-until-selected
│   │   ├── ProfileModal.jsx          # stats array sourced from character.stat_* (replaces hardcoded stub)
│   │   ├── QuestDetailsModal.jsx     # (optional) category icon in header
│   │   └── StatGrid.jsx              # [NEW, optional] reusable 2×2 stat grid used by CharacterPage + ProfileModal
│   └── pages/
│       ├── CharacterPage.jsx         # stat section with 4 ProgressBars
│       └── QuestsPage.jsx            # category icon on card + stat-gain line in completion flow (via completeMutation response)
```

### Pattern 1: Schema-extend-in-place (existing)

**What:** Расширяем существующие SQLAlchemy/Pydantic классы, не создаём новые параллельные.

**When to use:** Для всех 8 stat-колонок и `quests.category`.

**Example (наш project pattern, из `models.py` уже:**
```python
# Source: backend/app/models.py (existing gems pattern from Phase 3)
class User(Base):
    __tablename__ = "users"
    ...
    gems = Column(Integer, default=0, nullable=False, server_default="0")
    # Phase 4 добавляет по тому же шаблону:
    stat_strength_level = Column(Integer, default=1, nullable=False, server_default="1")
    stat_strength_xp    = Column(Integer, default=0, nullable=False, server_default="0")
    # ... ×4 stats
```

**Important:** обязательно И `default=...` (для runtime ORM-создания), И `server_default="..."` (для SQL DDL в Alembic/ `create_all`). Оба необходимы; `default` не применяется на уже существующих строках, только `server_default`.

### Pattern 2: Alembic `op.add_column` с NOT NULL + server_default на существующей таблице

**What:** PostgreSQL позволяет `ALTER TABLE ADD COLUMN ... NOT NULL DEFAULT value` без table rewrite начиная с PG 11 — default применяется ко всем существующим строкам метаданно (не физически переписывает каждую строку).

**Example (наш project pattern, верифицирован):**
```python
# Source: backend/migrations/versions/b74c083b2140_add_auth_fields.py (existing Phase 3 pattern)
op.add_column('users', sa.Column('gems', sa.Integer(), server_default='0', nullable=False))
```

Для Phase 4:
```python
def upgrade() -> None:
    # users: 8 stat columns
    for stat in ("strength", "wisdom", "endurance", "charisma"):
        op.add_column('users', sa.Column(f'stat_{stat}_level', sa.Integer(),
                                         server_default='1', nullable=False))
        op.add_column('users', sa.Column(f'stat_{stat}_xp', sa.Integer(),
                                         server_default='0', nullable=False))
    # quests: nullable category
    op.add_column('quests', sa.Column('category', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('quests', 'category')
    for stat in ("charisma", "endurance", "wisdom", "strength"):
        op.drop_column('users', f'stat_{stat}_xp')
        op.drop_column('users', f'stat_{stat}_level')
```

### Pattern 3: Pydantic v2 `Literal` для enum-валидации

**What:** Вместо `Enum` класса используем `Literal["work", "fitness", "learning", "social"]` — Pydantic v2 выдаст validation error на любое другое значение автоматически. Это уже project-convention для `difficulty`.

**When to use:** `QuestCreate`/`QuestSave` — обязательный `Literal[...]`; `QuestSchema` — `Optional[Literal[...]]` для legacy.

**Example:**
```python
# Source: extends backend/app/schemas.py
from typing import Literal, Optional

QuestCategory = Literal["work", "fitness", "learning", "social"]

class QuestSave(QuestBase):
    difficulty: str
    category: QuestCategory  # Required
    xp_reward: int
    gold_reward: int
    hp_penalty: int

class QuestSchema(QuestBase):
    id: int
    user_id: int
    difficulty: str
    category: Optional[QuestCategory] = None  # Legacy nullable
    xp_reward: int
    gold_reward: int
    hp_penalty: int
    is_completed: bool
    is_failed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

### Pattern 4: "Everything through `useQuery(['user'])`" (existing frontend convention)

**What:** Обе страницы (`CharacterPage`, `QuestsPage`) уже используют `useQuery({ queryKey: ['user'], queryFn: () => api.get('/user/me') })`. Stat-данные доберутся автоматически после расширения `UserSchema`.

**When to use:** Всегда. Никаких отдельных `/api/stats` endpoint'ов. `ProfileModal` получает stats через prop `character` (который и есть cached `user`).

**Example:**
```jsx
// Source: frontend/src/pages/CharacterPage.jsx (existing)
const { data: character } = useQuery({
  queryKey: ['user'],
  queryFn: () => api.get('/user/me').then((r) => r.data),
  staleTime: 1000 * 60,
});

// Phase 4: character.stat_strength_level, character.stat_strength_xp, etc.
```

### Pattern 5: Optimistic cache update после completion (existing)

**What:** `completeMutation.onSuccess` уже инвалидирует `['user']` и `['quests']`. Для Phase 4 — тот же паттерн, плюс response теперь содержит `stat_gain` — отображается во временном popup.

**Example:**
```jsx
// Source: extends frontend/src/pages/QuestsPage.jsx
const completeMutation = useMutation({
  mutationFn: (questId) => api.post(`/quests/complete/${questId}`).then((r) => r.data),
  onSuccess: (data) => {
    // data.stat_gain = { name: "endurance", xp: 4, leveled_up: false }
    setCompletionPopup({
      xp: data.reward.xp,
      gold: data.reward.gold,
      stat: data.stat_gain,  // NEW
      leveledUp: data.leveled_up,
    });
    queryClient.invalidateQueries({ queryKey: ['quests'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
```

### Anti-Patterns to Avoid

- **Хранение `max_xp_for_stat_level` в БД.** Не делать. Формула в коде — мутация баланса не требует миграции.
- **Multiple conditionals на категорию в `complete_quest`.** Вместо `if quest.category == "work": ...; elif quest.category == "fitness": ...` — lookup-dict `CATEGORY_TO_STAT = {"work": "endurance", ...}`.
- **Отдельные React useState для каждого стата.** Всё идёт через `useQuery(['user'])` — один источник.
- **Хранить выбранную категорию в Zustand.** Это transient form state → local `useState` в `AddTaskModal`.
- **Хардкодить русские имена статов в backend.** Backend говорит только английскими ключами (`strength` / `wisdom` / `endurance` / `charisma`); русские labels — строго фронтовая забота.
- **Менять формат AI-ответа** (`difficulty` / `xp` / `gold` / `hp_penalty`). Расширяем только prompt (input), не output schema — иначе нужен новый fallback.
- **Обнулять stat XP при provale квеста.** Phase 4 explicitly: failed quest = только HP penalty; stats неизменны.
- **Rename `category` в Pydantic при отправке на AI.** Передаём как есть; AI промпт использует русские labels только в текстовом теле, но значение `quest.category` остаётся `"work"` и т.д.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Level-up progression formula (×1.2 scaling) | Новую функцию с нуля | Переиспользовать существующую логику из `routers/quests.py::complete_quest` (`while xp >= max_xp: xp -= max_xp; lvl += 1; max_xp = int(max_xp * 1.2)`) — вынести в `game_logic.max_xp_for_level` + `apply_stat_xp` | Один алгоритм — одна реализация; игрок не учит две системы |
| Enum validation для category | `match/case`, if/elif chains, manual regex | Pydantic `Literal[...]` | Уже в проекте (весь `difficulty` flow), декларативно, один source of truth |
| Category → stat map | If/elif в `complete_quest` | Dict `CATEGORY_TO_STAT = {"work":"endurance",...}` в `game_logic.py` | Импортируется в router и в тестах; легче мигрировать |
| Category icon lookup (frontend) | Switch/case в JSX | Lookup map `const CATEGORY_META = { work: {icon: Briefcase, label: 'РАБОТА', color: 'text-green-500'}, ... }` | DRY; ProfileModal, AddTaskModal, QuestsPage card все используют одну таблицу |
| ProgressBar для stat XP | Custom div с width% | `<ProgressBar />` из `components/ProgressBar.jsx` | Уже handles edge cases (max≤0, percentage clipping, accessibility role, tailwind colors) |
| Stat migration backfill | Python script, raw SQL | `server_default='1'` / `server_default='0'` в `op.add_column` | Postgres applies default atomically; PG 11+ без table rewrite |
| Pydantic optional + validator для `category=NULL` | Custom `@validator` | `Optional[Literal[...]] = None` в `QuestSchema`, обязательный `Literal[...]` в `QuestSave`/`QuestCreate` | Разделение required (input) vs optional (output) через отдельные schema classes — уже проектный паттерн |

**Key insight:** Эта фаза — extension, не greenfield. 95% работы — добавить колонки и распространить существующий паттерн. Не изобретать новые абстракции (service layer, domain events, stat-repository). Расширяем на месте — это проверенный стиль в этом codebase от Phase 1 до Phase 3.

## Common Pitfalls

### Pitfall 1: `default` vs `server_default` — забыть один из двух
**What goes wrong:** Новые строки создаются без значения (если забыт `default=` на Python-уровне) ИЛИ существующие строки получают NULL в NOT NULL колонке (если забыт `server_default` в миграции).
**Why it happens:** SQLAlchemy `default=` применяется только при INSERT через ORM; `server_default=` компилируется в DDL `DEFAULT` clause и применяется при `ALTER TABLE ADD COLUMN` к существующим строкам.
**How to avoid:** **Всегда оба** на новых NOT NULL колонках. Precedent — `gems` в Phase 3: `Column(Integer, default=0, nullable=False, server_default="0")`.
**Warning signs:** `IntegrityError: null value in column "stat_strength_level"` либо `CheckViolation` при `alembic upgrade head`.

### Pitfall 2: Alembic autogenerate придумал drops / rename
**What goes wrong:** `alembic revision --autogenerate` иногда детектит несуществующие индексы на drop или рассматривает неполные колонки как разницу.
**Why it happens:** Baseline миграция (`fa4573e2e0b9`) — no-op; метаданные Alembic'а соответствуют тому, что есть в models.py в момент создания, а не реальному DDL от `create_all`.
**How to avoid:** Написать миграцию вручную по шаблону `b74c083b2140_add_auth_fields.py` (8 add_column для stats, 1 для quest.category). Не доверять autogenerate без ревью.
**Warning signs:** Свежий revision-файл содержит `op.drop_column`, `op.alter_column`, `op.drop_index` — всё это **удалить** вручную.

### Pitfall 3: Pydantic v2 `Literal` не валидирует на `from_attributes`
**What goes wrong:** SQLAlchemy возвращает строку `"work"` — Pydantic v2 проверяет её на `Literal["work","fitness","learning","social"]`, но если в БД каким-то образом оказался `"WORK"` или пробел — `ValidationError`.
**Why it happens:** Валидация происходит и на output (response_model).
**How to avoid:** Нормализовать input в frontend'е (отправлять lowercase ключи из map'а). Не позволять произвольный строковый ввод — chip picker с fixed-set values.
**Warning signs:** 500 при GET `/api/quests/me` после ручной DB-манипуляции. В тестах — использовать Literal ключи, не `"Work"`.

### Pitfall 4: AI возвращает расширенный формат и ломает existing fallback
**What goes wrong:** Модель `liquid/lfm-2.5-1.2b-thinking:free` может "подхватить" новое правило и вернуть дополнительные поля, либо уйти в markdown-блок.
**Why it happens:** Small model + thinking mode = нестабильный JSON при добавлении инструкций.
**How to avoid:**
1. Формат ответа в промпте (JSON schema) **не менять**.
2. Правило стат — приписать как "при этом output остаётся строго таким же JSON" напрямую в промпте.
3. Fallback `{"difficulty":"medium","xp":40,"gold":20,"hp_penalty":12,"fallback":True}` — сохранить; логи на ошибку парсинга — обязательны.
**Warning signs:** В логах `AI Analysis Error: Expecting value: line 1 column 1 (char 0)` вырастает; фронт показывает fallback-награды слишком часто.

### Pitfall 5: Stat level-up loop с нулевым gain → infinite loop
**What goes wrong:** Если `max_xp_for_level(lvl)` вдруг вернёт 0 (деление, переполнение, round(0)) — `while stat_xp >= 0: ...` зависнет.
**Why it happens:** Пограничные случаи в формуле: отрицательный lvl, очень большой lvl с float overflow.
**How to avoid:**
1. `max_xp_for_level(lvl)` должен иметь гуард `max(1, round(10 * 1.2 ** (lvl - 1)))`.
2. В `apply_stat_xp`: цикл с safety counter (например, `for _ in range(100): if xp < threshold: break; ...`).
**Warning signs:** Long-running request на `/api/quests/complete/*`; 504 gateway timeout.

### Pitfall 6: React commit-write-race между `queryClient.setQueryData(['user'])` и `invalidate`
**What goes wrong:** После complete_quest frontend и invalidates `['user']`, и оптимистично сетит (если делать оптимистичное обновление stats). Refetch перезаписывает optimistic-state, игрок видит "прыжок" значения.
**Why it happens:** TanStack Query разрешает гонку: setQueryData → invalidate → refetch возвращает старую (до commit) запись из-за race с backend replication / caching.
**How to avoid:** Не использовать optimistic update для stats. Сервер-ответ `complete_quest` уже возвращает полного user (текущий контракт) — достаточно `queryClient.setQueryData(['user'], data.user)` один раз; `invalidate` можно пропустить или поставить с задержкой.
**Warning signs:** Прогресс-бар "прыгает" после завершения квеста; LVL N → N+1 → N → N+1.

### Pitfall 7: NULL category в complete_quest даёт KeyError
**What goes wrong:** `STAT_GROWTH[quest.difficulty]` бросит KeyError если `quest.category is None` И кто-то убрал guard.
**Why it happens:** Phase 4 legacy-компат — `category` может быть NULL. Guard `if quest.category:` критичен.
**How to avoid:** Всегда писать `if quest.category is not None: apply_stat_xp(...)`. В unit-тестах покрыть legacy quest без category.
**Warning signs:** 500 Internal Server Error при complete старого квеста (созданного до Phase 4 deploy).

### Pitfall 8: Migration downgrade order matters
**What goes wrong:** `drop_column('users', 'stat_strength_level')` до `drop_column('quests', 'category')` — ок, но порядок "stat_*_level потом stat_*_xp" нужно развернуть в downgrade.
**Why it happens:** Если есть constraints / dependent indexes — порядок становится важен. В нашем случае — нет, но привычка.
**How to avoid:** Downgrade строго в обратном порядке upgrade'а. См. Code Examples §5.

## Code Examples

### 1. `backend/app/utils/game_logic.py` (полное содержимое нового модуля)
```python
# Source: new file — fills empty backend/app/utils/game_logic.py
"""Phase 4: stat math + category mapping. Pure functions, no DB access."""
from typing import Literal

QuestCategory = Literal["work", "fitness", "learning", "social"]
StatName = Literal["strength", "wisdom", "endurance", "charisma"]

# Category → which stat it grows (locked 1:1 mapping from CONTEXT.md)
CATEGORY_TO_STAT: dict[QuestCategory, StatName] = {
    "work": "endurance",
    "fitness": "strength",
    "learning": "wisdom",
    "social": "charisma",
}

# Difficulty → stat XP awarded on completion
STAT_GROWTH: dict[str, int] = {
    "easy": 1,
    "medium": 2,
    "hard": 4,
    "epic": 8,
}


def max_xp_for_level(level: int) -> int:
    """Threshold for next stat level-up. Mirrors user lvl curve (×1.2 per level, start 10)."""
    if level < 1:
        return 10
    return max(1, round(10 * (1.2 ** (level - 1))))


def apply_stat_xp(user, stat_name: StatName, gain: int) -> dict:
    """
    Mutates `user` in place — adds `gain` XP to the given stat and levels up while possible.
    Returns {'name': stat_name, 'xp_gained': gain, 'leveled_up': bool, 'new_level': int}.
    Callers are responsible for `await db.commit()` afterwards.
    """
    level_attr = f"stat_{stat_name}_level"
    xp_attr = f"stat_{stat_name}_xp"

    new_xp = getattr(user, xp_attr) + gain
    new_level = getattr(user, level_attr)
    leveled_up = False

    # Safety counter guards against pathological inputs
    for _ in range(100):
        threshold = max_xp_for_level(new_level)
        if new_xp < threshold:
            break
        new_xp -= threshold
        new_level += 1
        leveled_up = True

    setattr(user, xp_attr, new_xp)
    setattr(user, level_attr, new_level)

    return {
        "name": stat_name,
        "xp_gained": gain,
        "leveled_up": leveled_up,
        "new_level": new_level,
    }
```

### 2. `backend/app/models.py` diff (User + Quest)
```python
# Source: extends backend/app/models.py (existing style, mirrors gems pattern)
class User(Base):
    # ... existing fields ...
    gems = Column(Integer, default=0, nullable=False, server_default="0")

    # Phase 4: character stats (8 columns)
    stat_strength_level  = Column(Integer, default=1, nullable=False, server_default="1")
    stat_strength_xp     = Column(Integer, default=0, nullable=False, server_default="0")
    stat_wisdom_level    = Column(Integer, default=1, nullable=False, server_default="1")
    stat_wisdom_xp       = Column(Integer, default=0, nullable=False, server_default="0")
    stat_endurance_level = Column(Integer, default=1, nullable=False, server_default="1")
    stat_endurance_xp    = Column(Integer, default=0, nullable=False, server_default="0")
    stat_charisma_level  = Column(Integer, default=1, nullable=False, server_default="1")
    stat_charisma_xp     = Column(Integer, default=0, nullable=False, server_default="0")

    # ... rest ...


class Quest(Base):
    # ... existing fields ...
    hp_penalty = Column(Integer)
    category = Column(String, nullable=True)  # Phase 4: nullable for legacy
    # ... rest ...
```

### 3. `backend/app/schemas.py` diff
```python
# Source: extends backend/app/schemas.py
from typing import Literal, Optional

QuestCategory = Literal["work", "fitness", "learning", "social"]

class UserSchema(BaseModel):
    # ... existing ...
    gold: int
    hp: int
    max_hp: int
    xp_multiplier: float
    gold_multiplier: float
    # Phase 4: stats
    stat_strength_level: int = 1
    stat_strength_xp: int = 0
    stat_wisdom_level: int = 1
    stat_wisdom_xp: int = 0
    stat_endurance_level: int = 1
    stat_endurance_xp: int = 0
    stat_charisma_level: int = 1
    stat_charisma_xp: int = 0

    model_config = ConfigDict(from_attributes=True)


class QuestCreate(QuestBase):
    today: str
    current_hp: int
    max_hp: int
    lvl: int
    category: QuestCategory  # Required for new quests


class QuestSave(QuestBase):
    difficulty: str
    category: QuestCategory  # Required
    xp_reward: int
    gold_reward: int
    hp_penalty: int


class QuestSchema(QuestBase):
    id: int
    user_id: int
    difficulty: str
    category: Optional[QuestCategory] = None  # Legacy nullable
    xp_reward: int
    gold_reward: int
    hp_penalty: int
    is_completed: bool
    is_failed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### 4. `complete_quest` extension
```python
# Source: extends backend/app/routers/quests.py
from app.utils.game_logic import STAT_GROWTH, CATEGORY_TO_STAT, apply_stat_xp

@router.post("/api/quests/complete/{quest_id}")
async def complete_quest(
    quest_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Quest).filter(
            models.Quest.id == quest_id,
            models.Quest.user_id == user.id,
            models.Quest.is_completed == False,
            models.Quest.is_failed == False,
        )
    )
    quest = result.scalars().first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    quest.is_completed = True
    user.xp += int(quest.xp_reward * user.xp_multiplier)
    user.gold += int(quest.gold_reward * user.gold_multiplier)

    leveled_up = False
    while user.xp >= user.max_xp:
        user.xp -= user.max_xp
        user.lvl += 1
        user.max_xp = int(user.max_xp * 1.2)
        leveled_up = True

    # Phase 4: stat gain
    stat_gain = None
    if quest.category is not None:
        stat_name = CATEGORY_TO_STAT[quest.category]
        xp_gain = STAT_GROWTH[quest.difficulty]
        stat_gain = apply_stat_xp(user, stat_name, xp_gain)

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "leveled_up": leveled_up,
        "user": schemas.UserSchema.model_validate(user),
        "reward": {"xp": quest.xp_reward, "gold": quest.gold_reward},
        "stat_gain": stat_gain,  # None for legacy quests without category
    }
```

### 5. Alembic migration (manually-written)
```python
# Source: backend/migrations/versions/XXXXX_add_character_stats.py — NEW
"""add_character_stats

Adds 8 stat columns to users and nullable category to quests.
Follows b74c083b2140_add_auth_fields.py pattern (NOT NULL + server_default
applied atomically to existing rows via Postgres ALTER TABLE DEFAULT clause).

Revision ID: XXXXXXXXXXXX
Revises: b74c083b2140
Create Date: 2026-04-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'XXXXXXXXXXXX'
down_revision: Union[str, None] = 'b74c083b2140'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATS = ("strength", "wisdom", "endurance", "charisma")


def upgrade() -> None:
    for stat in STATS:
        op.add_column('users', sa.Column(f'stat_{stat}_level', sa.Integer(),
                                         server_default='1', nullable=False))
        op.add_column('users', sa.Column(f'stat_{stat}_xp', sa.Integer(),
                                         server_default='0', nullable=False))
    op.add_column('quests', sa.Column('category', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('quests', 'category')
    for stat in reversed(STATS):
        op.drop_column('users', f'stat_{stat}_xp')
        op.drop_column('users', f'stat_{stat}_level')
```

### 6. AI prompt augmentation
```python
# Source: extends backend/app/routers/quests.py::analyze_task
# Pull stats from authenticated user (not from request body — server is source of truth)
prompt = f""" Ты RPG мастер. Оцени контракт: "{title}".
Сегодня: {current_day}. Дедлайн: {deadline}.

СТАТУС ИГРОКА:
- Уровень: {lvl}
- Текущее HP: {current_hp} / {max_hp}

СТАТЫ ИГРОКА (level):
- Сила: {user.stat_strength_level}
- Мудрость: {user.stat_wisdom_level}
- Выносливость: {user.stat_endurance_level}
- Обаяние: {user.stat_charisma_level}

КАТЕГОРИЯ КВЕСТА: {category}

КРИТЕРИИ СЛОЖНОСТИ И НАГРАД:
- easy: Рутина. Награда: gold 5-15, xp 10-30. Штраф при провале: 5-8 HP.
- medium: Усилия. Награда: gold 20-45, xp 40-80. Штраф при провале: 10-15 HP.
- hard: Тяжелая работа. Награда: gold 50-120, xp 100-250. Штраф при провале: 20-30 HP.
- epic: Жизненное достижение. Награда: gold 150-300, xp 300-500. Штраф при провале: 40-60 HP.

ПРАВИЛА МАСТЕРА:
1. Если дедлайн критический (сегодня), сложность и награда растут.
2. Оцени "hp_penalty" исходя из сложности.
3. Если у игрока критически мало HP ({current_hp}), сделай штраф чуть мягче, но не ниже минимума.
4. Если стат, соответствующий категории квеста ({category}), НИЖЕ среднего по 4 статам —
   слегка увеличь XP/gold (+10%) и снизь hp_penalty (-10%), чтобы поощрить прокачку слабого
   направления. Не меняй формат ответа.

Верни ТОЛЬКО чистый JSON (без markdown):
{{
    "difficulty": "easy"|"medium"|"hard"|"epic",
    "xp": number,
    "gold": number,
    "hp_penalty": number
}} """
```

**Important:** payload теперь обязан содержать `category` (из frontend chip picker). Backend читает `user.stat_*` напрямую через `Depends(get_current_user)` — клиенту эти поля в body не нужно отправлять.

### 7. Frontend — category chip picker в `AddTaskModal.jsx`
```jsx
// Source: extends frontend/src/components/AddTaskModal.jsx
import { Briefcase, Dumbbell, BookOpen, Users, X } from 'lucide-react';

const CATEGORIES = [
  { key: 'work',     label: 'РАБОТА',     Icon: Briefcase },
  { key: 'fitness',  label: 'ТРЕНИРОВКА', Icon: Dumbbell },
  { key: 'learning', label: 'УЧЁБА',      Icon: BookOpen },
  { key: 'social',   label: 'ОБЩЕНИЕ',    Icon: Users },
];

const AddTaskModal = ({ onAdd, onClose, triggerHaptic }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(null);
  // ... today calc ...

  const handleCreate = () => {
    if (!title.trim() || !deadline || !category) return;
    if (deadline < today) { triggerHaptic?.('error'); return; }
    onAdd({ title: title.trim(), deadline, today, category });
    onClose();
  };

  return (
    // ... modal shell ...
    <div className="space-y-6">
      {/* title input */}
      {/* category row */}
      <div>
        <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
          Категория
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ key, label, Icon }) => {
            const selected = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`flex flex-col items-center justify-center gap-1 py-2 border text-[9px] font-black uppercase tracking-widest transition-colors ${
                  selected
                    ? 'bg-[#daa520]/10 border-[#daa520] text-[#daa520]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                <Icon size={18} strokeWidth={2.5} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* deadline input */}
    </div>
    // ... button, disabled={!title.trim() || !deadline || !category} ...
  );
};
```

Frontend `QuestsPage::onAddTask` передаёт `basicData.category` и в `/analyze`, и в `/quests/save` payload.

### 8. Stat grid на CharacterPage
```jsx
// Source: extends frontend/src/pages/CharacterPage.jsx
import { max_xp_for_stat_level } from '../services/statMath'; // or inline

// Duplicate backend formula in JS — trivially simple, kept in sync by tests
const maxXpForLevel = (lvl) => Math.max(1, Math.round(10 * Math.pow(1.2, Math.max(1, lvl) - 1)));

const STAT_META = [
  { key: 'strength',  label: 'СИЛА',         color: 'red',    barClass: 'bg-gradient-to-r from-red-600 to-red-400',       shadow: 'rgba(239,68,68,0.5)' },
  { key: 'endurance', label: 'ВЫНОСЛИВОСТЬ', color: 'green',  barClass: 'bg-gradient-to-r from-green-600 to-green-400',   shadow: 'rgba(34,197,94,0.5)' },
  { key: 'wisdom',    label: 'МУДРОСТЬ',     color: 'blue',   barClass: 'bg-gradient-to-r from-blue-600 to-blue-400',     shadow: 'rgba(59,130,246,0.5)' },
  { key: 'charisma',  label: 'ОБАЯНИЕ',      color: 'yellow', barClass: 'bg-gradient-to-r from-yellow-600 to-yellow-400', shadow: 'rgba(234,179,8,0.5)' },
];

// Inside CharacterPage, under existing ProgressBars:
<div className="w-full max-w-[400px] mt-4 px-2 grid grid-cols-2 gap-3">
  {STAT_META.map(({ key, label, color, barClass, shadow }) => {
    const level = character[`stat_${key}_level`];
    const xp = character[`stat_${key}_xp`];
    const maxXp = maxXpForLevel(level);
    return (
      <div key={key} className="bg-white/5 border border-white/10 p-2 space-y-1">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
          <span className={`text-${color}-500`}>{label}</span>
          <span className="text-white/60 tabular-nums">LVL {level}</span>
        </div>
        <ProgressBar
          label=""
          value={xp}
          max={maxXp}
          labelColor={`text-${color}-500`}
          barClass={barClass}
          shadowColor={shadow}
        />
      </div>
    );
  })}
</div>
```

**Tailwind v4 note:** Если `text-${color}-500` не парсится в production build — заменить на явный object lookup `{red: 'text-red-500', ...}`. Скорее всего уже работает, потому что ProfileModal использует той же конвенцией (см. verified stub `text-red-500`/etc).

### 9. ProfileModal — замена stub
```jsx
// Source: rewrites frontend/src/components/ProfileModal.jsx stats array
const ProfileModal = ({ isOpen, onClose, character }) => {
  if (!isOpen || !character) return null;

  const stats = [
    { label: 'СИЛА',        val: character.stat_strength_level,  color: 'text-red-500' },
    { label: 'ВЫНОСЛИВОСТЬ', val: character.stat_endurance_level, color: 'text-green-500' },
    { label: 'МУДРОСТЬ',    val: character.stat_wisdom_level,    color: 'text-blue-500' },
    { label: 'ОБАЯНИЕ',     val: character.stat_charisma_level,  color: 'text-yellow-500' },
  ];
  // ... rest of JSX unchanged (grid/cards already support these 4 items) ...
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact for Phase 4 |
|--------------|------------------|--------------|--------------------|
| Enum class for fixed string values | `Literal[...]` in Pydantic v2 | Pydantic 2.0 (2023) | Use `Literal` for `category`; consistent with existing `difficulty` string usage |
| `default_factory=datetime.utcnow` | `server_default=sa.func.now()` + tz-aware | SQLAlchemy 2.0 + PG best practice | Not applicable to Phase 4 (integer columns) but informs migration style |
| `ALTER TABLE SET NOT NULL` after backfill (multi-step) | Single-step `ADD COLUMN ... NOT NULL DEFAULT` | PostgreSQL 11+ | Applied once in Phase 3 (gems); apply same in Phase 4 (8 stat columns) |
| Manual refetch via `useEffect` | `useQuery` invalidation | TanStack Query 4+ (4.x, 5.x) | Already used everywhere; extend with `stat_gain` in mutation response |
| CRA / webpack | Vite 7 | Ongoing industry shift | Already on Vite 7.3 |

**Deprecated/outdated:**
- `telegram-init-data` lib is in `requirements.txt` but verified removed from runtime in Phase 3 — phase 4 должна не reintroduce it.
- `DEBUG_MODE = true` в старом `QuestsPage.jsx` — уже false; Phase 4 не включать обратно.

## Open Questions

1. **Дублирование `max_xp_for_level` формулы JS vs Python.**
   - What we know: Backend вычисляет `max_xp_for_level` в `game_logic.py`; frontend `CharacterPage` должен показывать прогресс-бар (xp / max_xp) — значит, нужно то же число.
   - What's unclear: Передавать через `UserSchema` (8 доп. полей `stat_*_max_xp`) или дублировать формулу в JS.
   - Recommendation: Дублировать в JS — формула тривиальна (одна строка), сервер всё равно source of truth (решения level-up принимает backend). В JS это только для отображения %.

2. **Где рендерить stat-level-up баннер.**
   - What we know: Phase 4 CONTEXT требует строку `НОВЫЙ УРОВЕНЬ: ВЫНОСЛИВОСТЬ LVL 3` при stat-level-up.
   - What's unclear: Тот же самый popup, что для character level-up? Или отдельный toast?
   - Recommendation: Добавить в completion popup третью секцию; если `data.stat_gain.leveled_up === true` — показать доп. строку золотом. Отдельный toast — overkill.

3. **Подать ли category в AI analyze как **обязательное** в payload.**
   - What we know: CONTEXT locked — category обязательна на /quests/save. Но `/analyze` — backend делает request-payload validation через `payload.get()`, а не через Pydantic.
   - What's unclear: Делать ли `/analyze` принимать `QuestCreate` pydantic-моделью (добавит строгую валидацию, но сломает текущий `Body(...)` контракт)?
   - Recommendation: Оставить `Body(...)` контракт (минимальный breaking change), но добавить явную проверку `if not payload.get("category"): raise HTTPException(422, ...)`. Перевод на Pydantic-модель — отдельной задачей.

4. **Category icon color на quest card — от категории или от difficulty.**
   - What we know: CONTEXT говорит "цвет — матчится со статом категории".
   - What's unclear: Текущий QuestsPage card УЖЕ использует цвета difficulty (зелёный/жёлтый/красный/фиолетовый). Не будет ли конфликта с жёлтой Charisma (совпадёт с medium difficulty) или красной Strength (совпадёт с hard)?
   - Recommendation: Category иконка — маленькая (16px) и слева от title; difficulty pill — справа. Визуально не наложатся. Но для дальнейшего тестирования — можно попросить human-ревью после первого рендера.

5. **AI hint verification — как поверить, что модель реально учла статы.**
   - What we know: AI-промпт расширяется правилом "+10%/-10% при слабом стате".
   - What's unclear: Модель `liquid/lfm-2.5-1.2b-thinking:free` — маленькая; вероятность, что правило игнорируется, ненулевая.
   - Recommendation: Добавить лог строки prompt'а для первых N запросов (уровень DEBUG) — можно пост-фактум верифицировать в STATE.md, влияет ли статистика на выдачу. Не блокер для phase verify, но flag для наблюдения.

## Sources

### Primary (HIGH confidence — verified on disk)
- `backend/app/models.py` — existing User/Quest schema; `gems` NOT NULL pattern precedent
- `backend/app/schemas.py` — Pydantic v2 `Literal`, `ConfigDict(from_attributes=True)`, existing `Optional` usage
- `backend/app/routers/quests.py` — existing `complete_quest` level-up loop, `analyze_task` prompt format
- `backend/migrations/versions/b74c083b2140_add_auth_fields.py` — Alembic NOT NULL + server_default precedent
- `backend/migrations/env.py` — Alembic sync psycopg2 setup verified
- `backend/app/utils/game_logic.py` — verified empty (0 lines), no conflict with new content
- `backend/app/utils/__init__.py` — verified empty, package import works
- `backend/requirements.txt` — SQLAlchemy 2.0.25, Pydantic 2.5.3, FastAPI 0.109.0, openai 1.10.0
- `frontend/src/pages/CharacterPage.jsx` + `QuestsPage.jsx` — existing `useQuery(['user'])`, `useMutation`, `queryClient.setQueryData` patterns
- `frontend/src/components/AddTaskModal.jsx` + `ProfileModal.jsx` — existing retro-styled modal conventions
- `frontend/src/components/ProgressBar.jsx` — verified API: `label`, `value`, `max`, `labelColor`, `barClass`, `shadowColor`
- `frontend/package.json` — React 19.2, @tanstack/react-query 5, lucide-react 0.574, Tailwind 4.1.18
- `frontend/node_modules/lucide-react/dist/esm/icons/` — verified presence of `briefcase.js`, `dumbbell.js`, `book-open.js`, `users.js`
- `.planning/REQUIREMENTS.md` — PROG-02, PROG-03 (canonical requirement text)
- `.planning/STATE.md` — project conventions (`/me` route, `Depends(get_current_user)`, retro styling)
- `.planning/phases/04-character-stats/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence — standard library knowledge consistent with project usage)
- Pydantic v2 `Literal` validation semantics — consistent with existing `difficulty: str` / `Optional[EmailStr]` usage
- Alembic `op.add_column(..., nullable=False, server_default='...')` on PG 11+ — avoids table rewrite; matches Phase 3 pattern
- TanStack Query 5 `setQueryData` / `invalidateQueries` behavior — matches existing Phase 3 usage in QuestsPage
- React 19 + Tailwind 4 — no breaking changes affecting Phase 4 (no new JSX primitives, no ColorScheme changes)

### Tertiary (LOW confidence — none critical)
- Behavior of `liquid/lfm-2.5-1.2b-thinking:free` under extended prompt — inherent model variance; mitigated by keeping response JSON schema unchanged + existing fallback in `analyze_task`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library and version is verified on disk, including lucide icons
- Architecture: HIGH — every pattern has a working in-project precedent (Phase 1-3)
- Migration pattern: HIGH — Phase 3 `b74c083b2140_add_auth_fields.py` is the exact template
- Pitfalls: HIGH (pitfalls 1-5, 7-8) — verified against project code / Postgres semantics; MEDIUM for pitfall 6 (React race) — conservative recommendation holds regardless
- AI prompt augmentation: MEDIUM — model behavior under extended prompt is inherently variable; keep fallback intact

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (30 days; stack is stable, no Phase-4-relevant changes pending)
