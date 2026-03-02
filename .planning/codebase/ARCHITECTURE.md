# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Client-Server Game Architecture with AI-Powered Quest System

**Key Characteristics:**
- **Telegram WebApp Integration** - Frontend runs as Telegram Mini App (TWA) using @twa-dev/sdk
- **AI-Driven Content** - OpenRouter LLM analyzes user-created quests and determines difficulty/rewards
- **RPG Progression System** - Character leveling, XP/gold tracking, quest completion mechanics
- **Asynchronous Backend** - FastAPI with async/await and SQLAlchemy async ORM for database operations
- **Tab-Based Navigation** - Single Page Application with five main navigation tabs (Camp, Quests, Shop, Inventory, Leaderboard)

## Layers

**Presentation Layer (Frontend):**
- Purpose: Render interactive Telegram WebApp UI with real-time quest management and character progression
- Location: `frontend/src/`
- Contains: React components, pages, services, assets (videos, images, icons)
- Depends on: Axios API client, Telegram WebApp SDK, Framer Motion for animations, Lucide React icons
- Used by: End users via Telegram Mobile App

**API Layer (Backend):**
- Purpose: Expose RESTful endpoints for user management, quest operations, AI analysis, and game state updates
- Location: `backend/app/main.py`
- Contains: FastAPI route handlers, CORS middleware configuration, AI integration
- Depends on: CRUD operations, database session dependency injection
- Used by: Frontend via Axios HTTP requests

**Business Logic Layer:**
- Purpose: Implement game mechanics (quest rewards, leveling, multipliers) and state transitions
- Location: `backend/app/crud.py`, `backend/app/utils/game_logic.py`
- Contains: User management functions, quest lifecycle operations, reward calculations, level-up logic
- Depends on: SQLAlchemy async session, Pydantic schemas for validation
- Used by: API route handlers

**Data Access Layer:**
- Purpose: Provide async database connectivity and ORM mapping
- Location: `backend/app/database.py`
- Contains: SQLAlchemy async engine, session factory, initialization function
- Depends on: PostgreSQL with asyncpg driver
- Used by: CRUD operations, models

**Data Model Layer:**
- Purpose: Define domain entities and relationships
- Location: `backend/app/models.py`
- Contains: User and Quest SQLAlchemy ORM models with relationships
- Depends on: SQLAlchemy declarative base
- Used by: CRUD operations, database initialization

**AI Integration Layer:**
- Purpose: Analyze user-created quest titles/deadlines and generate difficulty/reward stats
- Location: `backend/app/main.py` (POST /api/analyze endpoint)
- Contains: OpenRouter API client configuration, prompt construction, response parsing
- Depends on: OpenAI AsyncOpenAI client (configured for OpenRouter base URL)
- Used by: Frontend to validate quest creation before persistence

## Data Flow

**User Initialization:**
1. Frontend loads, calls `userService.getProfile(tg_id, username)` with Telegram user data
2. Backend GET `/api/user/{tg_id}` checks if user exists in database
3. If new user, CRUD creates profile with default stats (level 1, 100 HP, avatar1)
4. User object returned to frontend, cached in component state `character`

**Quest Creation & AI Analysis:**
1. User opens AddTaskModal, enters quest title and deadline
2. Frontend POST `/api/analyze` with quest title, deadline, current character stats
3. Backend constructs RPG-themed prompt, calls OpenRouter LLM
4. LLM returns JSON with `difficulty`, `xp`, `gold`, `hp_penalty`
5. Frontend shows "roulette" animation during analysis, displays results
6. User confirms, frontend POST `/api/quests/save/{tg_id}` with analyzed data
7. Backend CRUD creates Quest record, returns full quest object
8. Quest added to tasks array in frontend, re-rendered in QuestsPage

**Quest Completion:**
1. User selects quest in QuestsPage, clicks confirm button
2. Frontend POST `/api/quests/complete/{quest_id}` with `tg_id` query param
3. Backend marks quest `is_completed = True`, calls `add_reward()` CRUD function
4. Reward function applies XP/gold multipliers, checks for level-up
5. If `user.xp >= user.max_xp`, level increments and max_xp multiplied by 1.2
6. Backend returns updated user object and `leveled_up` flag
7. Frontend updates character state, shows level-up animation if triggered

**Status Check & Expiration:**
1. QuestsPage useEffect fetches active quests on component mount
2. Backend GET `/api/quests/{tg_id}` internally calls `check_and_fail_quests()`
3. Function finds quests where `deadline < today`, marks `is_failed = True`
4. Failed quests apply -5 HP penalty to user
5. Only non-failed, non-completed quests returned to frontend

**State Management:**
- Frontend: Lifted state in App.jsx (`character`, `activeTab`, `isLoaded`)
- Each page component receives character and setCharacter via props
- Modals (AddTaskModal, ConfirmModal, QuestDetailsModal) manage local state, callback to parent
- Backend: Persistent state in PostgreSQL, stateless FastAPI handlers (session-per-request)

## Key Abstractions

**User Profile:**
- Purpose: Represent player character with progression stats and cosmetics
- Examples: `backend/app/models.User`, `backend/app/schemas/UserSchema`
- Pattern: SQLAlchemy ORM model with Pydantic schema for API responses
- Key attributes: `telegram_id` (unique), `lvl`, `xp`, `gold`, `hp`, `selected_avatar`, multipliers

**Quest/Contract:**
- Purpose: Represent single task with difficulty, deadline, and reward/penalty
- Examples: `backend/app/models/Quest`, `backend/app/schemas/QuestSchema`
- Pattern: ORM with foreign key to User, status flags (is_completed, is_failed)
- Lifecycle: created → active → completed/failed (one-way transitions)

**AI Analysis Request/Response:**
- Purpose: Bridge user input to LLM and validate output
- Examples: `backend/app/schemas/QuestCreate`, `AnalysisResponse`
- Pattern: Pydantic models for input validation, regex-based JSON extraction for output
- Fallback: Returns default medium-difficulty stats if LLM fails or returns invalid JSON

**Reward Multiplier System:**
- Purpose: Allow scalable progression through multiplier modifiers
- Examples: `user.xp_multiplier`, `user.gold_multiplier` in User model
- Pattern: Applied during `add_reward()` before XP/gold accumulation
- Use case: Future boosts/events can increase multipliers without changing quest data

## Entry Points

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: Browser load of Telegram WebApp URL
- Responsibilities: Create React root, mount App component with StrictMode

**Frontend App Initialization:**
- Location: `frontend/src/App.jsx` (useEffect in App component)
- Triggers: Component mount
- Responsibilities: Initialize Telegram SDK, load user profile, load video/image assets, show loading progress, render pages/navigation

**Backend Entry:**
- Location: `backend/app/main.py` (FastAPI app instantiation)
- Triggers: Server startup via uvicorn
- Responsibilities: Configure CORS, attach lifespan event (database init), register endpoints

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/{tg_id}` | Get/create user profile |
| POST | `/api/user/update-avatar` | Change character avatar |
| POST | `/api/analyze` | AI analysis of quest difficulty/rewards |
| POST | `/api/quests/save/{tg_id}` | Create quest in database |
| GET | `/api/quests/{tg_id}` | Get active quests (auto-fails expired) |
| POST | `/api/quests/complete/{quest_id}` | Mark complete, apply rewards |
| GET | `/api/quests/history/{tg_id}` | Get completed/failed quests |
| GET | `/api/user/{tg_id}/status` | Check status, fail overdue quests |

## Error Handling

**Strategy:** Defensive programming with fallbacks; frontend graceful degradation; backend error logging

**Patterns:**

- **API Response Fallback:** If LLM analysis fails, `/api/analyze` returns hardcoded medium-difficulty stats (`difficulty: medium, xp: 40, gold: 20, hp_penalty: 12`) instead of crashing
- **Empty Array Fallback:** Quest endpoints return `[]` instead of `null` to prevent `.map()` errors on frontend
- **User Not Found:** Operations return None/raise HTTPException 404 if user doesn't exist
- **Validation:** Pydantic schemas validate request data shape before CRUD operations
- **JSON Parsing:** Regex cleans LLM response of markdown backticks before JSON parsing
- **Try-Catch Blocks:** Both frontend (fetch) and backend (CRUD) wrapped in try-catch with logging

**Frontend Error UI:**
- Location: `frontend/src/App.jsx` (lines 115-124)
- Shows full-screen "SYSTEM FAILURE" modal with REBOOT button on critical errors
- Sets error state if user profile fails to load or assets fail

## Cross-Cutting Concerns

**Logging:**
- Backend: Python logging module configured at INFO level in `main.py`
- Pattern: `logger.error()`, `logger.info()` in CRUD and route handlers
- Frontend: `console.error()` for fetch/API errors, debug logs for quest loading

**Validation:**
- Backend: Pydantic schemas (`UserSchema`, `QuestCreate`, `QuestSave`) enforce types and required fields
- Frontend: Client-side state validation (is character loaded? is array?), no submission if title/deadline empty
- Database: NOT NULL constraints on user.telegram_id, quest.title

**Authentication:**
- Strategy: Implicit trust in Telegram initDataUnsafe user ID
- Pattern: Frontend extracts `tg_id` from `window.Telegram.WebApp.initDataUnsafe.user.id`
- Backend: Endpoint parameter `tg_id` used as lookup key (no signature verification)
- Assumption: Telegram SDK ensures initDataUnsafe comes from verified user session

**Timezone Handling:**
- Pattern: All timestamps in database use MSK (UTC+3) via `get_msk_now()` function
- Usage: Quest deadline comparison, quest created_at tracking
- Database: `DateTime(timezone=True)` in SQLAlchemy for Postgres timezone-aware columns

**Asset Loading:**
- Pattern: Vite glob imports with eager:true for videos/images
- Optimization: Parallel loading of videos, images, and API profile during app init
- Progress tracking: Incremental setProgress() as each asset loads
- Cleanup: useEffect cleanup revokes Blob URLs to prevent memory leaks

---

*Architecture analysis: 2026-03-01*
