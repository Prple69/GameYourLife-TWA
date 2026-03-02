---
phase: 01-secure-foundation
plan: 01
subsystem: infra
tags: [pydantic-settings, python-dotenv, environment-variables, credentials, gitignore]

# Dependency graph
requires: []
provides:
  - "backend/app/config.py: Pydantic Settings class loading all credentials from environment"
  - "backend/.env.example: documented template for required environment variables"
  - "Root .gitignore excluding .env files and build artifacts"
  - "database.py and main.py using settings object instead of hardcoded values or raw os.getenv"
affects:
  - "02-telegram-auth"
  - "all subsequent backend plans"

# Tech tracking
tech-stack:
  added: [pydantic-settings, telegram-init-data]
  patterns: [centralized-settings-via-pydantic, lru_cache-singleton, absolute-env-path-from-file-location]

key-files:
  created:
    - backend/app/config.py
    - backend/.env.example
    - .gitignore
  modified:
    - backend/app/database.py
    - backend/app/main.py
    - backend/requirements.txt

key-decisions:
  - "Use Path(__file__).parent.parent to resolve backend/.env absolutely, ensuring it works regardless of working directory when the module is imported"
  - "Delete backend/app/.env (exposed real API key) and consolidate all secrets into backend/.env (gitignored)"
  - "Add telegram-init-data to requirements.txt now so Plan 02 can install all deps at once"

patterns-established:
  - "Settings singleton: import get_settings() from app.config, never use os.getenv() directly in backend"
  - "Env file location: all secrets live at backend/.env, never inside a Python package directory"

requirements-completed: [SEC-02]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 1 Plan 1: Credentials Externalization Summary

**Pydantic Settings singleton centralizes all credentials (DATABASE_URL, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN) loaded from backend/.env, eliminating hardcoded secrets from Python source files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T12:26:59Z
- **Completed:** 2026-03-02T12:30:02Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `backend/app/config.py` with Pydantic `Settings` class and `@lru_cache` `get_settings()` factory
- Moved `OPENAI_API_KEY` from exposed `backend/app/.env` to gitignored `backend/.env`; deleted old file
- Migrated `database.py` and `main.py` off hardcoded strings and raw `os.getenv()` to use `get_settings()`
- Added root `.gitignore` protecting `.env` files and common build artifacts
- Added `backend/.env.example` as a committed template documenting all required variables
- Added `telegram-init-data` to `requirements.txt` for Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Pydantic Settings config and .env files** - `692fc16` (feat)
2. **Task 2: Migrate database.py and main.py to use Settings** - `a65f49d` (feat)

## Files Created/Modified

- `backend/app/config.py` - Pydantic Settings class with lru_cache singleton; resolves .env path absolutely from file location
- `backend/.env.example` - Committed template with placeholder values for DATABASE_URL, TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, DEBUG_MODE
- `.gitignore` - Root gitignore excluding .env files, __pycache__, .venv, node_modules, dist
- `backend/app/database.py` - Removed hardcoded SQLALCHEMY_DATABASE_URL; now uses `get_settings().DATABASE_URL`
- `backend/app/main.py` - Removed load_dotenv(), os.getenv(), import os; now uses `get_settings().OPENAI_API_KEY`
- `backend/requirements.txt` - Added telegram-init-data for Plan 02

## Decisions Made

- Used `Path(__file__).parent.parent / ".env"` for absolute env file resolution instead of relative `"../\.env"` — relative paths fail when the module is imported from a different working directory (e.g., running tests from project root vs running server from backend/)
- Deleted `backend/app/.env` (the file that contained the real API key) and consolidated into `backend/.env` which is gitignored at the root `.gitignore`
- Added `telegram-init-data` to requirements.txt proactively so Plan 02 only needs one `pip install -r` run

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed env_file path from relative "../.env" to absolute path derived from __file__**
- **Found during:** Task 1 (Create Pydantic Settings config)
- **Issue:** Plan specified `env_file="../.env"` (relative path). This fails when Python imports config.py from a working directory other than `backend/app/` — specifically when running the verification test from the project root
- **Fix:** Used `Path(__file__).parent.parent / ".env"` to compute absolute path at import time, ensuring .env is always found regardless of cwd
- **Files modified:** backend/app/config.py
- **Verification:** `python3 -c "from app.config import get_settings; s = get_settings(); print(s.DATABASE_URL)"` passes from project root with `sys.path.insert(0, 'backend')`
- **Committed in:** 692fc16 (Task 1 commit)

**2. [Rule 3 - Blocking] Cleaned stale .pyc cache containing old credential**
- **Found during:** Final verification
- **Issue:** `grep -r "purple666" backend/app/` matched `backend/app/__pycache__/database.cpython-310.pyc` — stale bytecode from before migration
- **Fix:** Deleted all `*.pyc` files and `__pycache__` directories under `backend/`
- **Files modified:** (deleted files, not tracked in git)
- **Verification:** Grep on source files only (`--include="*.py"`) returns zero matches
- **Committed in:** Not committed (deleted untracked build artifacts)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for correctness. No scope creep.

## Issues Encountered

- `pydantic_settings` not installed in system Python — installed via `pip install pydantic-settings` before verification ran. Already present in `requirements.txt` for server deployments.

## User Setup Required

- Copy `backend/.env.example` to `backend/.env` and fill in real values
- `DATABASE_URL`: real PostgreSQL connection string with password
- `TELEGRAM_BOT_TOKEN`: token from BotFather (needed for Plan 02)
- `OPENAI_API_KEY`: OpenRouter API key (already populated from moved file)

## Next Phase Readiness

- Credentials foundation complete — all backend modules use `get_settings()` singleton
- Plan 02 (Telegram auth) can use `settings.TELEGRAM_BOT_TOKEN` immediately
- `telegram-init-data` package already added to requirements.txt
- No blockers for Phase 1 Plan 02

---
*Phase: 01-secure-foundation*
*Completed: 2026-03-02*
