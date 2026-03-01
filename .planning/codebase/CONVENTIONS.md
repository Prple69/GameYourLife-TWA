# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Header.jsx`, `AddTaskModal.jsx`, `CharacterPage.jsx`)
- Service files: camelCase (e.g., `api.js`)
- Python modules: snake_case (e.g., `models.py`, `schemas.py`, `game_logic.py`, `crud.py`)
- Page components: PascalCase (e.g., `CharacterPage.jsx`, `QuestsPage.jsx`)

**Functions:**
- JavaScript/React: camelCase (e.g., `handleAvatarChange`, `triggerHaptic`, `initializeApp`)
- Python: snake_case (e.g., `get_user_by_tg_id`, `create_quest`, `update_user_avatar`)
- API endpoints: kebab-case URL paths (e.g., `/api/user/update-avatar`, `/api/quests/verify`)

**Variables:**
- JavaScript: camelCase (e.g., `setTitle`, `activeTab`, `isLoaded`, `videoUrls`)
- Python: snake_case (e.g., `telegram_id`, `xp_reward`, `hp_penalty`, `tg_id`)

**Types/Constants:**
- Component names: PascalCase (e.g., `MemoCamp`, `MemoQuests`)
- Object literals with IDs: kebab-case keys (e.g., `avatar1`, `avatar2`)
- Configuration objects: UPPERCASE for constants (e.g., `TITLES`, `AVATARS`, `assetNamingMap`)
- Python Pydantic schemas: PascalCase (e.g., `UserSchema`, `QuestSchema`, `QuestCreate`)

## Code Style

**Formatting:**
- No dedicated Prettier config; relies on ESLint rules
- Indentation: 2 spaces (JavaScript/JSX)
- Line length: No strict limit enforced
- Import statements: Module syntax (`import`/`export`)

**Linting:**
- ESLint with flat config (eslint.config.js)
- Rule for unused variables: Ignores pattern `^[A-Z_]` (uppercase/underscore vars)
- Enforces: `no-unused-vars` with pattern exception
- React hooks plugin active: `reactHooks.configs.flat.recommended`
- React refresh plugin for Vite: `reactRefresh.configs.vite`

**Configuration:**
- ESLint config location: `frontend/eslint.config.js`
- Tailwind CSS: `frontend/` (version 4.1.18)
- PostCSS: Configured with Tailwind
- Vite: Build tool for frontend (version 7.3.1)

## Import Organization

**Order (Frontend - JavaScript):**
1. React core imports (`import React, { useState, useEffect } from 'react'`)
2. Third-party packages (`import axios from 'axios'`, `import { X } from 'lucide-react'`)
3. Relative imports (components, services, assets)
4. Asset imports (images, videos via import.meta.glob)

**Example from codebase:**
```javascript
import React, { useState, useEffect, useMemo, memo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import { userService } from './services/api';
import axios from 'axios';
```

**Order (Backend - Python):**
1. Standard library (`import re, json, logging, os`)
2. Third-party packages (`from fastapi import`, `from sqlalchemy import`)
3. Local imports (`from app import models, crud, database, schemas`)

**Path Aliases:**
- None configured (uses relative imports throughout)

## Error Handling

**Frontend JavaScript:**
- Try-catch blocks with console.error logging
- Pattern: `console.error('descriptive message', error)` with either Russian or English messages
- No centralized error handler; errors logged directly in catch blocks
- Fallback returns: Empty arrays for API responses (e.g., `questService.getQuests` returns `[]` on error)
- Validation checks inline: `if (!title.trim() || !deadline) return;`

**Example:**
```javascript
catch (error) {
  console.error('Ошибка при получении профиля:', error);
  throw error;
}
```

**Backend Python:**
- Logging with standard `logging` module (`logger.error()`)
- HTTPException for API errors with status codes and detail messages
- Database transaction management: automatic commit/rollback in `get_db()` dependency
- Fallback responses: Return empty list `[]` for quest list endpoints if error occurs
- Print statements for debugging: `print(f"DEBUG: Saving quest for {tg_id}")`

**Example:**
```python
try:
    user = await crud.get_user_by_tg_id(db, tg_id)
except Exception as e:
    logger.error(f"Error getting profile: {e}")
    raise HTTPException(status_code=500, detail="Internal Server Error")
```

## Logging

**Frontend:**
- Framework: `console` (no dedicated logging library)
- Pattern: `console.error('message', error)` in catch blocks
- Messages: Mix of Russian and English descriptions
- Severity levels: Implicitly error logging only (no info/warn/debug)

**Backend:**
- Framework: Python's built-in `logging` module
- Setup: `logging.basicConfig(level=logging.INFO)` with named logger
- Pattern: `logger.error(f"Description: {e}")`
- Also uses `print()` for debug info (non-production pattern)

**Example Backend:**
```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.error(f"AI Analysis Error: {e}")
```

## Comments

**When to Comment:**
- Clarifications on complex logic (e.g., timezone conversions, bitmap calculations)
- Russian language explanations (codebase is Russian-first)
- Non-obvious game mechanics or reward calculations
- API integration details (e.g., Cloudflare tunnel URL updates)

**JSDoc/TSDoc:**
- Used in service files: Descriptive function docstrings with parameter descriptions
- Format: Multi-line comments with `@param` tags

**Example:**
```javascript
/**
 * Получить профиль игрока или создать нового
 * @param {string} tgId - ID из Telegram (initDataUnsafe.user.id)
 * @param {string} username - Имя пользователя из Telegram
 */
```

**Backend Docstrings:**
- Simple one-liners above functions: `"""Найти пользователя по Telegram ID (асинхронно)"""`
- Route docstrings in FastAPI endpoints: `"""Гарантированно возвращает список, чтобы .map() на фронте не падал"""`

## Function Design

**Size:**
- Small to medium (30-80 lines typical for React components)
- Larger pages (100+ lines) break functionality into sub-components or use memo optimization
- Python CRUD functions: 5-20 lines (simple, focused)

**Parameters:**
- React components: Props destructured in function signature (e.g., `const Header = ({ title, subtitle, gold })`)
- JavaScript services: Explicit parameters matching Telegram/API data
- Python async functions: Type hints on all parameters (`db: AsyncSession`, `tg_id: str`)

**Return Values:**
- React components: Always JSX
- Services: Data objects (user, quest) or arrays with fallback `[]`
- Python CRUD: Database ORM objects or tuples for multiple returns (e.g., `return user, leveled_up`)
- API endpoints: Pydantic schema responses or JSON dict

**Example async pattern:**
```python
async def get_user_by_tg_id(db: AsyncSession, tg_id: str):
    """Найти пользователя по Telegram ID (асинхронно)"""
    result = await db.execute(
        select(models.User).filter(models.User.telegram_id == tg_id)
    )
    return result.scalars().first()
```

## Module Design

**Exports:**
- React: Default export of component (`export default ComponentName;`)
- Services: Named exports of service objects (e.g., `export const userService = {...}`, `export const questService = {...}`)
- Python modules: No explicit exports (all public functions/classes available via import)

**Barrel Files:**
- Not used; imports are explicit from source files
- Frontend imports are direct: `from '../components/Header'` not from index
- Python `__init__.py` files: Empty or minimal (no re-exports)

**File Organization Pattern:**
- Frontend components self-contained: styling via className Tailwind
- Services grouped by domain: `userService`, `questService`
- Backend modules organized by responsibility: `models.py`, `schemas.py`, `crud.py`, `database.py`

## Async/Await Patterns

**Frontend:**
- Async functions in effects: Defined within useEffect, called immediately (IIFE pattern)
- Promise.all for parallel operations: `const [userRes] = await Promise.all([apiPromise, ...videoPromises])`
- Error handling in try-catch within async blocks

**Backend:**
- All database operations wrapped in `async with AsyncSessionLocal()`
- SQLAlchemy select statements: Use `await db.execute()` then `.scalars().first()`
- API calls use `async def` endpoints with `Depends()` for session injection
- Concurrent API calls to OpenAI: Standard `await client.chat.completions.create()`

## State Management

**Frontend:**
- React hooks: `useState` for local state (tab, modals, forms)
- `useMemo` for computed values (userData derived from Telegram context)
- `useCallback` for memoized handlers (avatar change handlers)
- Component memo optimization: `const MemoQuests = memo(QuestsPage);`
- Props passing: Direct prop drilling (no context API or state manager)

**Backend:**
- SQLAlchemy session dependency injection per request
- No global state; all data persistence through database
- Multipliers stored in User model (`xp_multiplier`, `gold_multiplier`)

## Performance Patterns

**Frontend:**
- Code splitting: Pages wrapped in `memo()` to prevent re-renders when hidden
- Asset loading: `import.meta.glob()` for dynamic asset imports
- Video/image preloading with progress tracking before render
- CSS transforms: `translateZ(0)`, `willChange: 'opacity'` for GPU acceleration
- Blob URL creation for video: `URL.createObjectURL(blob)` with cleanup on unmount

**Backend:**
- Async operations throughout (AsyncSession, AsyncOpenAI)
- Database connection pooling via SQLAlchemy async engine
- Query optimization: Indexed columns on `telegram_id`, `user_id`

## Type Safety

**Frontend:**
- No TypeScript; plain JavaScript with JSDoc type hints in service layer
- Prop validation: Runtime checks (e.g., `if (!title.trim()`)

**Backend:**
- Python type hints on all function signatures
- Pydantic models for schema validation (UserSchema, QuestSchema, QuestCreate, QuestSave)
- `ConfigDict(from_attributes=True)` for ORM object to schema conversion

---

*Convention analysis: 2026-03-01*
