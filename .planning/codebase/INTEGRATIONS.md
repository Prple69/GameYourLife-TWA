# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**AI/LLM Services:**
- OpenRouter (via OpenAI-compatible API)
  - Service: LLM model inference for quest analysis
  - SDK/Client: `openai` library with AsyncOpenAI
  - Auth: `OPENAI_API_KEY` environment variable
  - Model used: `liquid/lfm-2.5-1.2b-thinking:free`
  - Purpose: Analyzes quest difficulty, XP rewards, gold rewards, and HP penalties
  - Implementation: `backend/app/main.py` lines 24-27, endpoint `/api/analyze` (lines 50-120)

**Telegram Integration:**
- Telegram Web App (TWA)
  - SDK: `@twa-dev/sdk` v8.0.2
  - Auth: Native Telegram user data via `window.Telegram.WebApp.initDataUnsafe`
  - Purpose: User authentication, user ID retrieval, app expansion
  - Implementation: `frontend/src/App.jsx` lines 33, 47-48
  - Extracts: User ID (tg_id), username from Telegram context

**Google AI:**
- Google Generative AI (frontend library)
  - SDK: `@google/genai` (latest)
  - Purpose: Alternative or supplementary AI generation (currently in dependencies)
  - Status: Included but primary AI routing goes through OpenRouter backend

## Data Storage

**Databases:**
- PostgreSQL 12+
  - Connection: `postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db`
  - Client: SQLAlchemy 2.x with asyncpg driver
  - Location: `backend/app/database.py`
  - Tables:
    - `users` - Player profiles with XP, gold, HP, avatar selection
    - `quests` - Quest/task records with difficulty, rewards, deadlines
  - Async session management via AsyncSessionLocal (lines 16-20)
  - Auto-initialization on app startup via `lifespan` context manager

**File Storage:**
- Local filesystem only - No external file storage detected

**Caching:**
- None - No caching layer detected

## Authentication & Identity

**Auth Provider:**
- Telegram Web App (Custom)
  - Implementation: Native Telegram user data via SDK
  - User ID source: `tg.initDataUnsafe?.user?.id` from Telegram
  - Username source: `tg.initDataUnsafe?.user?.username` from Telegram
  - Auto-creation: Users created on first profile request if not found
  - Location: `frontend/src/App.jsx` lines 41-44, `backend/app/main.py` lines 124-134

## Monitoring & Observability

**Error Tracking:**
- None detected - No external error tracking service integrated

**Logs:**
- Python logging module (Backend)
  - Logger setup: `backend/app/main.py` lines 16-17
  - Level: INFO
  - Fallback handling: Exception logging with printed errors for debugging
  - Examples: Error logging in `/api/analyze` (line 112), profile endpoint (line 133)

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel
  - Config: `frontend/vercel.json`
  - SPA rewrites enabled (all routes → index.html)
  - Deployment URL: `https://game-your-life-twa.vercel.app`

- Backend: Self-hosted (Python application)
  - Deployment via Cloudflare Tunnel
  - Public URL: `https://gameurlife.ru.tuna.am`
  - Default port: 8000 (FastAPI default)

**CI Pipeline:**
- Not detected - No CI/CD configuration found

## Environment Configuration

**Required env vars (Backend):**
- `OPENAI_API_KEY` - OpenRouter API key for LLM inference
- `DATABASE_URL` (optional) - Overrides hardcoded PostgreSQL connection
- `.env` file location: Backend root (loaded via `python-dotenv`)

**Required env vars (Frontend):**
- None required - Backend URL hardcoded as `https://gameurlife.ru.tuna.am`
- Optional: Dev proxy uses `vite.config.js` for `/api` redirect to tunnel

**Secrets location:**
- Backend: `.env` file (not committed to git)
- Frontend: None - API URLs hardcoded

## CORS & Cross-Origin

**CORS Configuration (Backend):**
- `backend/app/main.py` lines 36-46
- Allowed Origins:
  - `https://game-your-life-twa.vercel.app` (production frontend)
  - `http://localhost:5173` (Vite dev server)
  - `http://127.0.0.1:5173` (Vite dev server alternate)
- Methods: All allowed (`*`)
- Headers: All allowed (`*`)
- Credentials: Enabled

## API Endpoints

**Quest Analysis:**
- `POST /api/analyze` - AI-powered quest difficulty analysis
  - Input: `{title, deadline, today, lvl, current_hp, max_hp}`
  - Output: `{difficulty, xp, gold, hp_penalty}`
  - Provider: OpenRouter via OpenAI SDK
  - Fallback: Returns default medium difficulty rewards on error

**User Endpoints:**
- `GET /api/user/{tg_id}` - Get or create user profile
- `POST /api/user/update-avatar` - Change character avatar

**Quest Endpoints:**
- `POST /api/quests/save/{tg_id}` - Create and save new quest
- `POST /api/quests/complete/{quest_id}` - Mark quest as complete
- `GET /api/quests/{tg_id}` - Fetch active quests
- `GET /api/quests/history/{tg_id}` - Fetch quest history

**Status Endpoint:**
- `GET /api/user/{tg_id}/status` - Check user status and fail overdue quests

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## External Dependencies Summary

- **AI/LLM**: OpenRouter (via OpenAI SDK)
- **Database**: PostgreSQL with asyncpg
- **Auth**: Telegram Web App native integration
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Cloudflare Tunnel (development/staging)
- **Google AI**: Included as dependency but not actively used in current codebase

---

*Integration audit: 2026-03-01*
