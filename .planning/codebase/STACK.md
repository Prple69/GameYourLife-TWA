# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**
- JavaScript (Frontend) - React components, utilities, services
- Python (Backend) - FastAPI server, database models, game logic
- HTML/CSS (Frontend) - Page structure, Tailwind CSS styling

**Secondary:**
- JSX (Frontend) - React component syntax

## Runtime

**Environment:**
- Node.js (Frontend) - JavaScript runtime for build and dev
- Python 3.x (Backend) - FastAPI application runtime

**Package Manager:**
- npm (Frontend) - Node package management
- pip (Backend) - Python package management
- Lockfile: `package-lock.json` present for frontend

## Frameworks

**Core:**
- React 19.2.0 (Frontend) - UI component library and state management
- FastAPI (Backend) - Asynchronous Python web framework for REST API
- Vite 7.3.1 (Frontend) - Fast build tool and dev server

**Styling:**
- Tailwind CSS 4.1.18 (Frontend) - Utility-first CSS framework
- PostCSS 8.5.6 (Frontend) - CSS transformation tool

**Animation & UI:**
- Framer Motion 12.34.1 (Frontend) - React animation library
- Lucide React 0.574.0 (Frontend) - Icon component library
- React Mobile Picker 1.0.1 (Frontend) - Mobile-friendly picker component

**Testing:**
- Not detected in current configuration

**Build/Dev:**
- Vite 7.3.1 (Frontend) - Build tool with HMR support
- @vitejs/plugin-react 5.1.1 (Frontend) - React integration for Vite
- ESLint 9.39.1 (Frontend) - Code linting
- Autoprefixer 10.4.24 (Frontend) - CSS vendor prefixer

## Key Dependencies

**Critical:**
- axios 1.13.5 (Frontend) - HTTP client for API requests to backend
- @twa-dev/sdk 8.0.2 (Frontend) - Telegram Web App SDK for initialization and user data
- @google/genai latest (Frontend) - Google Generative AI SDK (for frontend AI analysis)

**Backend API:**
- FastAPI - Web framework with automatic OpenAPI documentation
- SQLAlchemy 2.x - Async ORM for database abstraction
- Pydantic - Data validation and serialization
- python-dotenv - Environment variable management

**Backend Integrations:**
- openai library - AsyncOpenAI client for OpenRouter API calls
- asyncpg - Async PostgreSQL driver for SQLAlchemy

**Frontend Utilities:**
- framer-motion 12.34.1 - Complex animation sequences
- lucide-react 0.574.0 - SVG icon library
- react-dom 19.2.0 - DOM rendering for React

## Configuration

**Environment:**
- `.env` file for backend (OPENAI_API_KEY required)
- Cloudflare Tunnel for local development proxy
- Backend Base URL: `https://gameurlife.ru.tuna.am` (Tuna tunnel)
- Fallback dev proxy in `vite.config.js`: `/api` routes to tunnel

**Build:**
- `vite.config.js` - Frontend build configuration with API proxy
- `eslint.config.js` - ESLint rules for React and React Hooks
- `postcss.config.js` - PostCSS plugin configuration
- `vercel.json` - Vercel deployment configuration (SPA rewrites)

**Frontend Dev:**
- `vite.config.js` proxy: `/api` routes to backend tunnel for development
- CORS enabled on backend for `https://game-your-life-twa.vercel.app` and `http://localhost:5173`

## Platform Requirements

**Development:**
- Node.js with npm
- Python 3.7+ with pip
- PostgreSQL 12+ database (async connection via asyncpg)
- Cloudflare Tunnel (for local development API access)
- Telegram Bot Token (for Web App initialization)

**Production:**
- Frontend: Vercel (deployment via `vercel.json` config)
- Backend: Python 3.x application server (e.g., Uvicorn, Gunicorn)
- Database: PostgreSQL (async connection string in `database.py`)
- API Tunnel: Cloudflare Tunnel (`https://gameurlife.ru.tuna.am`)

**Database:**
- PostgreSQL with asyncpg driver
- Async connection string: `postgresql+asyncpg://user:password@127.0.0.1:5432/game_db`
- Location: `backend/app/database.py`

---

*Stack analysis: 2026-03-01*
