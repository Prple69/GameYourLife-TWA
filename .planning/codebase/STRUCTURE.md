# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
GameYourLife-TWA/
├── frontend/                    # React Vite SPA - Telegram WebApp UI
│   ├── src/
│   │   ├── assets/             # Videos, images, icons
│   │   ├── components/         # Reusable modal/widget components
│   │   ├── pages/              # Full-page tab content components
│   │   ├── services/           # API client (axios)
│   │   ├── App.jsx             # Root component, tab router, app init
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind global styles
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies: React 19, Vite 7, Tailwind 4, axios
│   ├── vite.config.js          # Build config, API proxy
│   ├── eslint.config.js        # Linting rules
│   ├── postcss.config.js       # CSS processing
│   └── tailwind.config.js      # Tailwind utility generation
│
├── backend/                     # FastAPI async Python backend
│   ├── app/
│   │   ├── utils/
│   │   │   └── game_logic.py   # Utility functions (stub file, mostly empty)
│   │   ├── __init__.py         # Package init
│   │   ├── main.py             # FastAPI app, route handlers, AI integration
│   │   ├── models.py           # SQLAlchemy ORM (User, Quest)
│   │   ├── database.py         # Async session, engine, initialization
│   │   ├── crud.py             # Data access functions for User/Quest
│   │   └── schemas.py          # Pydantic request/response models
│   ├── routers/                # Empty (routes defined in main.py)
│   └── requirements.txt         # Dependencies list (empty)
│
└── .planning/                   # GSD planning documents
    └── codebase/               # This directory - architecture/structure analysis
```

## Directory Purposes

**frontend/src/assets/:**
- Purpose: Static media files loaded eagerly during app initialization
- Contains: `.mp4` video animations (shop_anim, bag_anim, hero_anim, leaderboard_anim, quests_anim), `.png`/`.jpg` images, SVG icons
- Key files: Videos are named with `_anim` suffix, mapped via `assetNamingMap` object in App.jsx

**frontend/src/components/:**
- Purpose: Modal dialogs and reusable widget components
- Contains: Modal/form components not tied to specific pages
- Key files:
  - `AddTaskModal.jsx` - Quest creation form with deadline picker
  - `QuestDetailsModal.jsx` - Display quest details with action buttons
  - `HistoryModal.jsx` - View completed/failed quests archive
  - `ProfileModal.jsx` - Edit avatar, view character stats
  - `AvatarSelector.jsx` - Avatar selection grid
  - `ConfirmModal.jsx` - Generic confirmation dialog
  - `Header.jsx` - Top bar with user name and stats
  - `Navigation.jsx` - Bottom tab bar for page switching
  - `CharacterCard.jsx` - Character display widget
  - `ProgressBar.jsx` - Visual XP/HP progress indicator

**frontend/src/pages/:**
- Purpose: Full-page tab content components
- Contains: Route-level components rendered based on `activeTab` state
- Key files:
  - `CharacterPage.jsx` - Camp tab, character display, stats, avatar selector
  - `QuestsPage.jsx` - Quests tab, active/pending quests, quest creation, completion
  - `ShopPage.jsx` - Shop tab, purchasable items (structure present, mechanics may vary)
  - `InventoryPage.jsx` - Inventory tab, owned items/equipment
  - `LeaderboardPage.jsx` - Leaderboard tab, top players by level/gold
  - `LoadingPage.jsx` - Full-screen loading overlay with progress bar (reusable in App)

**frontend/src/services/:**
- Purpose: API communication layer
- Contains: `api.js` with axios instance and exported service objects
- Key files:
  - `api.js` - Axios create instance, `userService` (getProfile, updateAvatar, checkHealth), `questService` (getQuests, verifyQuest stubs)

**backend/app/:**
- Purpose: FastAPI application code
- Contains: Route handlers, business logic, database models, schemas

**backend/app/main.py:**
- Purpose: Main application entry point and endpoint definitions
- Contains: FastAPI app instance, route handlers, CORS config, lifespan events
- Key routes:
  - `POST /api/analyze` - AI quest analysis
  - `GET /api/user/{tg_id}`, `POST /api/user/update-avatar` - User management
  - `POST /api/quests/save/{tg_id}`, `GET /api/quests/{tg_id}`, `POST /api/quests/complete/{quest_id}`, `GET /api/quests/history/{tg_id}` - Quest operations
  - `GET /api/user/{tg_id}/status` - Status check with auto-fail logic

**backend/app/models.py:**
- Purpose: SQLAlchemy ORM model definitions
- Contains: User model (telegram_id, avatar, level, XP, HP, multipliers), Quest model (title, difficulty, rewards, deadline, completion status)

**backend/app/database.py:**
- Purpose: Database connection and session management
- Contains: AsyncSession factory, engine creation, db dependency for FastAPI
- Key config: PostgreSQL connection string pointing to 127.0.0.1:5432 (asyncpg driver)

**backend/app/crud.py:**
- Purpose: Create-Read-Update-Delete operations
- Contains: Functions like `get_user_by_tg_id()`, `create_user()`, `add_reward()`, `complete_quest()`, `check_and_fail_quests()`, `get_active_quests()`, `get_quest_history()`

**backend/app/schemas.py:**
- Purpose: Pydantic validation and serialization
- Contains: `UserSchema`, `QuestBase`, `QuestCreate`, `QuestSave`, `QuestSchema`, `AnalysisResponse`

**backend/app/utils/game_logic.py:**
- Purpose: Game mechanics utilities
- Status: File exists but is empty (game logic currently in crud.py)

## Key File Locations

**Entry Points:**
- `frontend/src/main.jsx` - React root mount, creates DOM root and renders App
- `frontend/src/App.jsx` - Root component, initializes Telegram SDK, loads assets, manages app state
- `backend/app/main.py` - FastAPI app creation and all route handlers

**Configuration:**
- `frontend/package.json` - Project name, version, dependencies, build scripts
- `frontend/vite.config.js` - Vite build config, API proxy to backend
- `frontend/eslint.config.js` - ESLint rules
- `frontend/postcss.config.js` - PostCSS plugins (autoprefixer, tailwind)
- `backend/app/database.py` - PostgreSQL connection URL (hardcoded to 127.0.0.1)

**Core Logic:**
- `frontend/src/App.jsx` - Asset loading, user profile initialization, tab switching, page rendering
- `frontend/src/pages/QuestsPage.jsx` - Quest list, quest addition, quest completion flow
- `backend/app/crud.py` - All database write operations (user creation, quest creation, reward application, level-up logic)
- `backend/app/main.py` - All HTTP request handlers, AI integration

**Testing:**
- Not detected - no test files found in codebase

## Naming Conventions

**Files:**

| Pattern | Example | Usage |
|---------|---------|-------|
| PascalCase.jsx | `CharacterPage.jsx`, `AddTaskModal.jsx` | React components (pages, components) |
| camelCase.js | `api.js`, `vite.config.js` | Configuration, utility modules |
| snake_case.py | `game_logic.py`, `main.py` | Python backend files |
| UPPERCASE.md | `ARCHITECTURE.md`, `STRUCTURE.md` | Documentation |

**Directories:**

| Pattern | Example | Usage |
|---------|---------|-------|
| lowercase | `frontend`, `backend`, `app`, `components`, `pages` | Folder organization |
| snake_case | `game_logic`, `__pycache__` | Python packages and internal |
| assets | `assets/icons`, `assets/` | Static media |

**Functions/Variables:**

- **Frontend (JavaScript):** camelCase (e.g., `setActiveTab`, `triggerHaptic`, `onAddTask`)
- **Backend (Python):** snake_case (e.g., `get_user_by_tg_id`, `check_and_fail_quests`, `add_reward`)
- **React Components:** PascalCase (e.g., `App`, `QuestsPage`, `AddTaskModal`)
- **Constants:** UPPERCASE (e.g., `DEBUG_MODE`, `TUNNEL_URL`)

**Types/Schemas:**

- **Frontend:** Types inferred from prop shapes, no TypeScript
- **Backend:** Pydantic models with "Schema" suffix (e.g., `UserSchema`, `QuestSchema`) for API responses; "Create"/"Save" variants for requests

## Where to Add New Code

**New Feature (e.g., guilds, achievements):**
- Primary code: `backend/app/main.py` (new endpoints), `backend/app/models.py` (new ORM model), `backend/app/crud.py` (new CRUD functions)
- Frontend: `frontend/src/pages/NewFeaturePage.jsx` (tab page) + components in `frontend/src/components/`
- Database schema: Update `backend/app/models.py`, re-run `init_db()` on startup
- API client: Add service object to `frontend/src/services/api.js`

**New Component/Modal:**
- Implementation: Create in `frontend/src/components/NewComponent.jsx`
- Pattern: Functional component with props (character, setCharacter, onClose callback), useState for local form state
- Integration: Import in parent page component, conditionally render based on local state

**New Page/Tab:**
- Implementation: Create in `frontend/src/pages/NewTabPage.jsx`
- Integration: Import in `frontend/src/App.jsx`, add tab name to Navigation options, add div with conditional `activeTab === 'newtab'`
- Props: Receive `character`, `setCharacter`, `videos`, `triggerHaptic` as in existing pages

**Utilities/Helpers:**
- Shared frontend logic: `frontend/src/services/api.js` or new file in `frontend/src/utils/`
- Shared backend logic: `backend/app/utils/game_logic.py` or new module in `backend/app/utils/`
- Pattern: Export named functions, import where needed

**API Endpoint:**
- Location: `backend/app/main.py`
- Pattern: Define as async function with FastAPI decorator (e.g., `@app.post("/api/...")`), include db dependency
- Database interaction: Call CRUD functions from `backend/app/crud.py`
- Response: Return Pydantic schema object or dict

## Special Directories

**frontend/public/:**
- Purpose: Bundled static assets served at root
- Generated: No
- Committed: Yes

**backend/app/__pycache__/:**
- Purpose: Python bytecode cache
- Generated: Yes (automatically by Python runtime)
- Committed: No (listed in .gitignore)

**frontend/node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No (listed in .gitignore)

**frontend/dist/:**
- Purpose: Built production bundles
- Generated: Yes (by `vite build`)
- Committed: No

**.planning/codebase/:**
- Purpose: GSD analysis documents
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes (markdown documents)

## Import Path Patterns

**Frontend:**
- Absolute: Not configured; uses relative paths (e.g., `../components/Header.jsx`, `./services/api.js`)
- Could add: `jsconfig.json` with path aliases (e.g., `@/components`, `@/pages`)
- Vite config lacks path alias configuration

**Backend:**
- Relative: `from . import models, crud` (same package)
- Absolute: `from app import models, database` (from root when running as module)
- Pattern: Mix of relative and absolute depending on context

**API URLs:**
- Frontend hardcodes: `TUNNEL_URL = 'https://gameurlife.ru.tuna.am'` in `services/api.js`
- Should use: Environment variable (`.env.local` or `.env`) for Vercel deployment
- Backend CORS allows: Vercel production URL + localhost:5173

---

*Structure analysis: 2026-03-01*
