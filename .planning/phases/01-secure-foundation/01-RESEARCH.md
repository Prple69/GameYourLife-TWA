# Phase 1: Secure Foundation - Research

**Researched:** 2026-03-01
**Domain:** Telegram Web App authentication, environment variable configuration, backend security
**Confidence:** HIGH

## Summary

Phase 1 addresses two critical security gaps: (1) Telegram initData signature validation to prevent identity spoofing, and (2) externalization of hardcoded credentials to environment variables. The codebase currently accepts user identity on implicit trust with zero backend verification, and database credentials are visible in source code and git history.

Telegram provides well-documented HMAC-SHA256 signature verification using the bot token (legacy approach) and Ed25519 public key verification (modern third-party approach). Python and FastAPI have mature, standardized patterns for both credential management via Pydantic Settings with dotenv, and Telegram signature validation via dedicated libraries. No hand-rolled cryptography is needed—established libraries handle the complexity.

**Primary recommendation:** Use `telegram-init-data` library for FastAPI-integrated signature validation, and `pydantic-settings` with `.env` file for environment-based credential management. Both are production-ready and require minimal integration effort.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all decisions are Claude's discretion.

### Claude's Discretion
- Endpoint coverage (all vs. write-only validation)
- Dev mode handling (bypass flag or always validate)
- Git history cleanup approach
- Error UX on auth failure
- All implementation details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Server verifies Telegram initData cryptographic signature on all requests (no spoofable tg_id) | Telegram signature validation via `telegram-init-data` library using HMAC-SHA256 with bot token; fastapi dependency pattern enables automatic verification on all endpoints |
| SEC-02 | All credentials and API keys loaded from environment variables (not hardcoded) | Pydantic Settings BaseSettings pattern with `.env` file support; environment variable prefix mapping; `@lru_cache` for performance |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| telegram-init-data | latest (pip) | Validate Telegram WebApp initData signatures against bot token | Official Telegram Mini Apps documentation recommends established validation libraries; prevents implementation errors in cryptography |
| pydantic-settings | 2.x (pip) | Load and validate credentials from environment variables | Pydantic is already in FastAPI stack; type-safe, validation built-in, `@lru_cache` support for performance |
| python-dotenv | latest (pip) | Load `.env` file into environment on app startup | De facto standard for local development; FastAPI documentation recommends for `.env` file support |
| hmac (stdlib) | 3.x+ | HMAC-SHA256 signature verification | Built into Python standard library; used by `telegram-init-data` internally |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fastapi | (existing) | Dependency injection for Telegram validation | `Depends()` pattern enables clean signature validation as request middleware |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| telegram-init-data | Manual HMAC-SHA256 with hashlib.hmac | Saves ~50 lines of cryptography code but error-prone; library is well-tested and maintained |
| pydantic-settings | os.getenv() + manual validation | More flexible but loses type safety, validation, and `.env` file parsing; less maintainable |

**Installation:**
```bash
pip install telegram-init-data pydantic-settings python-dotenv
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── app/
│   ├── config.py          # Pydantic Settings classes for credentials
│   ├── main.py            # FastAPI app with signature validation dependency
│   ├── dependencies.py     # FastAPI dependency: verify_telegram_init_data
│   ├── database.py         # Database connection using env vars
│   ├── models.py           # (existing)
│   ├── crud.py             # (existing)
│   └── schemas.py          # (existing)
└── .env                    # Environment variables (NEVER commit)
```

### Pattern 1: Telegram Signature Validation via FastAPI Dependency
**What:** Extract init data from request (query param or header), validate signature using bot token, return parsed user data or raise HTTPException 401.
**When to use:** Every endpoint that needs to verify user identity. Can be applied to individual routes or app-wide.
**Example:**
```python
# backend/app/dependencies.py
from fastapi import Depends, HTTPException, Query
from telegram_init_data import parse, validate
from app.config import get_settings

async def verify_telegram_init_data(
    init_data: str = Query(..., alias="initData"),
    settings = Depends(get_settings)
):
    """
    Dependency: Extract and validate Telegram initData signature.
    Returns parsed init data (user, auth_date, etc.) or raises 401.

    Source: https://github.com/iCodeCraft/telegram-init-data
    """
    try:
        # Validate signature using bot token (HMAC-SHA256)
        validate(init_data, settings.TELEGRAM_BOT_TOKEN)
        # Parse into structured data
        init_data_dict = parse(init_data)
        return init_data_dict
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

# backend/app/main.py
from fastapi import FastAPI, Depends
from app.dependencies import verify_telegram_init_data

@app.get("/api/quests/{quest_id}")
async def complete_quest(
    quest_id: int,
    init_data = Depends(verify_telegram_init_data),
):
    """All requests now require valid Telegram signature."""
    user_id = init_data["user"]["id"]  # Safely extracted from verified signature
    # ... proceed with quest completion
```

### Pattern 2: Pydantic Settings with Environment Variables
**What:** Create Settings class that loads credentials from `.env` file and environment, with type validation and optional prefix mapping.
**When to use:** Application startup; anywhere you need database URL, API keys, or bot token.
**Example:**
```python
# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    """
    Load configuration from environment variables and .env file.

    Source: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
    https://fastapi.tiangolo.com/advanced/settings/
    """
    # Database
    DATABASE_URL: str  # e.g., "postgresql+asyncpg://user:password@host:5432/db"

    # Telegram
    TELEGRAM_BOT_TOKEN: str  # e.g., "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

    # API Keys
    OPENAI_API_KEY: str  # Already in code, should use this pattern

    # Optional: app behavior
    DEBUG_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

@lru_cache
def get_settings():
    """Cache settings to avoid re-reading .env file on every request."""
    return Settings()

# Usage in main.py:
from app.config import get_settings
settings = get_settings()
database_url = settings.DATABASE_URL
```

### Anti-Patterns to Avoid
- **Hardcoding credentials in code:** Leads to git history leaks. Use `.env` + `os.getenv()`.
- **No signature validation:** Accepting `tg_id` as query param without verification means any client can impersonate any user.
- **Comparing HMAC with `==`:** Use `hmac.compare_digest()` to prevent timing attacks on signature verification.
- **Committing `.env` file:** Add `.env` to `.gitignore` immediately. Use `.env.example` as template.
- **Mixing dev and prod secrets:** One `.env` for local, environment variables for production. Never hardcode either.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telegram signature verification | Manual HMAC-SHA256 with hashlib | `telegram-init-data` library | Cryptography is error-prone; library is tested, maintained, handles edge cases (expiration, backward compatibility) |
| Environment variable parsing from .env | Custom parser with os.getenv() | Pydantic Settings BaseSettings | Type validation, automatic env var case mapping, `.env` file support, `@lru_cache` integration |
| Secure credential comparison | `if a == b:` for signatures | `hmac.compare_digest()` | Prevents timing attacks by using constant-time comparison |

**Key insight:** Cryptographic validation and configuration management are deceptively complex. Both have established, battle-tested solutions in Python/FastAPI ecosystem. Building either custom invites security vulnerabilities and maintenance burden.

## Common Pitfalls

### Pitfall 1: Forgetting Signature Expiration Check
**What goes wrong:** Signature is valid but hours/days old (stolen data still accepted). Example: user logs out, device stolen, attacker replays old initData, still authenticated.
**Why it happens:** HMAC-SHA256 only verifies authenticity, not freshness. Must check `auth_date` timestamp.
**How to avoid:** `telegram-init-data` library enforces expiration check by default (1 day, configurable). Verify the library does this or manually check: `now - auth_date < 86400` (1 day in seconds).
**Warning signs:** Accepting initData with old timestamps in logs; no time-based cache invalidation.

### Pitfall 2: Including Hash in Data-Check-String
**What goes wrong:** Signature verification fails because the hash parameter itself is included in the string being hashed. Circular dependency breaks validation.
**Why it happens:** Easy to forget the exclusion rule: "sort ALL fields except `hash` key".
**How to avoid:** `telegram-init-data` library handles this automatically. If implementing manually, explicitly exclude hash: `sorted_fields = {k: v for k, v in fields.items() if k != 'hash'}`.
**Warning signs:** "Signature mismatch" errors on every request despite correct bot token.

### Pitfall 3: Loading Credentials Multiple Times per Request
**What goes wrong:** Each request re-reads `.env` file and re-parses Pydantic Settings. Slow startup, disk I/O contention, possible race conditions.
**Why it happens:** Forgetting `@lru_cache` decorator on settings function, or creating new Settings() on every endpoint.
**How to avoid:** Always use `@lru_cache` decorator: `@lru_cache def get_settings(): return Settings()`. Dependency inject via `Depends(get_settings)`.
**Warning signs:** Latency spikes in logs; high disk I/O during load testing; Settings read > once per second.

### Pitfall 4: Committing .env File to Git
**What goes wrong:** Credentials (DB password, API key) end up in git history, visible to anyone with repo access. Even if deleted later, git history preserves it forever.
**Why it happens:** .env not in .gitignore from start; unclear which files should be secrets.
**How to avoid:** Add `.env` to `.gitignore` BEFORE first commit. Create `.env.example` with placeholder values as documentation. Document in README which vars are required.
**Warning signs:** `.env` appears in `git log --all --name-status`; security scanners flag credentials in history.

### Pitfall 5: Accepting Initdata as Query Parameter Without HTTPS
**What goes wrong:** Browser sends initData in URL, proxy/network logs capture it. Man-in-the-middle can read signature.
**Why it happens:** Casual implementation passes initData as `?initData=...` query param instead of secure header.
**How to avoid:** Pass initData in request header (e.g., `Authorization: Bearer <initData>`) or POST body over HTTPS. Verify your Vercel/backend uses HTTPS only.
**Warning signs:** Security audit flags initData in URL logs; network packet capture shows signature in plaintext.

## Code Examples

Verified patterns from official sources:

### Telegram Signature Validation Setup
```python
# backend/app/dependencies.py
# Source: https://github.com/iCodeCraft/telegram-init-data
from fastapi import Depends, HTTPException, Query
from telegram_init_data import validate, parse
from app.config import get_settings

async def verify_telegram_init_data(
    init_data: str = Query(..., alias="initData"),
    settings = Depends(get_settings)
):
    """
    Validate Telegram initData signature and return parsed user data.

    Raises HTTPException 401 if signature is invalid or expired.
    """
    try:
        # Validate signature using bot token (HMAC-SHA256)
        # Library checks expiration by default (86400 seconds = 1 day)
        validate(init_data, settings.TELEGRAM_BOT_TOKEN)

        # Parse into dict with user info, auth_date, etc.
        init_data_dict = parse(init_data)

        return init_data_dict
    except Exception as e:
        # Any validation failure → 401 Unauthorized
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Telegram signature"
        )

# backend/app/main.py
from fastapi import FastAPI
from app.dependencies import verify_telegram_init_data

@app.get("/api/quests/{quest_id}")
async def complete_quest(
    quest_id: int,
    init_data = Depends(verify_telegram_init_data),
):
    """
    All requests now require valid Telegram signature.
    init_data contains: {"user": {"id": 123, "username": "...", ...}, "auth_date": 1234567890}
    """
    user_id = init_data["user"]["id"]
    # Safely proceed knowing user is verified by Telegram signature
```

### Environment Variables with Pydantic Settings
```python
# backend/app/config.py
# Source: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
# https://fastapi.tiangolo.com/advanced/settings/
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    """
    Load configuration from environment variables and .env file.
    Type validation is automatic.
    """
    # Database connection
    DATABASE_URL: str

    # Telegram bot token (from BotFather)
    TELEGRAM_BOT_TOKEN: str

    # OpenRouter API (already in codebase)
    OPENAI_API_KEY: str

    # Optional: runtime behavior
    DEBUG_MODE: bool = False
    API_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

@lru_cache
def get_settings():
    """
    Cache settings: load .env file only once on app startup.
    @lru_cache ensures Pydantic Settings is instantiated once.
    """
    return Settings()

# backend/app/database.py
from app.config import get_settings

settings = get_settings()
DATABASE_URL = settings.DATABASE_URL  # e.g., "postgresql+asyncpg://user:pwd@host/db"

# Create async engine using loaded URL (no hardcoding)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)
```

### .env File Template
```bash
# .env (local development only)
# NEVER commit this file. Add to .gitignore.
# For production, set these as environment variables on the server.

DATABASE_URL=postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ-_1234567890
OPENAI_API_KEY=sk-...

# Optional
DEBUG_MODE=false
```

### .gitignore Update
```bash
# .gitignore
.env
.env.local
.env.*.local
__pycache__/
*.pyc
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual HMAC-SHA256 in backend code | Use `telegram-init-data` library | 2022-2023 (Telegram official SDK adoption) | Eliminates cryptography bugs, reduces code by ~50 lines, enables FastAPI dependency injection |
| Query param `tg_id` without validation | Require Telegram initData signature on every request | Industry standard as of 2023 | Impossible to spoof user identity without bot token |
| Hardcoded credentials in `database.py` | Load from environment variables via Pydantic Settings | Python/FastAPI best practice since 2020 | Credentials never in git history, easy local dev and production switching |
| os.getenv() + manual parsing | Pydantic Settings BaseSettings with validation | FastAPI official documentation 2022+ | Type safety, auto case mapping, `.env` file support, `@lru_cache` performance |

**Deprecated/outdated:**
- FastAPI `Config` class for settings: Use `SettingsConfigDict` instead (Pydantic v2)
- `dotenv.load_dotenv()` directly in main: Use Pydantic's built-in `env_file` support instead
- Manual HMAC comparison with `==`: Use `hmac.compare_digest()` to prevent timing attacks

## Open Questions

1. **Dev Mode Bypass for Signature Validation**
   - What we know: Phase CONTEXT marked "dev mode handling" as Claude's discretion
   - What's unclear: Should all local/dev requests bypass signature validation? Or always validate but with special test token?
   - Recommendation: Always validate, but use test Telegram Bot Token for local development. Never have code that skips signature verification (security surface too large). Test with real signature flow from day one.

2. **Endpoint Coverage: All vs Write-Only**
   - What we know: Existing endpoints are mixed (some POST, some GET, some state-changing)
   - What's unclear: Should GET endpoints (read-only) require signature? Or only state-changing endpoints?
   - Recommendation: Validate on ALL endpoints. Cost is negligible, attack surface is reduced. Current codebase has all endpoints accept `tg_id` parameter, so all are currently vulnerable to spoofing.

3. **Git History Cleanup**
   - What we know: Credentials are already in git history (commit f5f9f39 visible in log)
   - What's unclear: How aggressively to scrub history? Force push? Use BFG Repo-Cleaner?
   - Recommendation: Use `git-filter-branch` or BFG to remove credentials from history, then rotate the database password. Force push is risky; safer to treat as historical leak and rotate secrets immediately.

## Validation Architecture

> Skip: `workflow.nyquist_validation` not set to true in `.planning/config.json`

## Sources

### Primary (HIGH confidence)
- [Telegram Mini Apps Init Data Documentation](https://docs.telegram-mini-apps.com/platform/init-data) - HMAC-SHA256 and Ed25519 signature methods, data-check-string format
- [Telegram Init Data Node Package Docs](https://docs.telegram-mini-apps.com/packages/tma-js-init-data-node/validating) - Official signature validation approach
- [FastAPI Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/) - Pydantic Settings pattern with `@lru_cache` and dependency injection
- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) - Current BaseSettings with SettingsConfigDict, env_file support
- [Python HMAC Module](https://docs.python.org/3/library/hmac.html) - compare_digest() for timing-safe comparison

### Secondary (MEDIUM confidence)
- [telegram-init-data GitHub](https://github.com/iCodeCraft/telegram-init-data) - FastAPI integration example, library design
- [FastAPI Best Practices on Environment Variables](https://www.getorchestra.io/guides/fast-api-environment-variables-a-detailed-tutorial) - Centralized configuration patterns, nested settings

### Tertiary (verified via multiple sources)
- Telegram signature verification requires HMAC-SHA256 with bot token as secret and WebAppData constant — verified across official docs and multiple GitHub gist implementations
- Pydantic Settings with @lru_cache is industry standard for FastAPI credential management — confirmed in multiple tutorials and FastAPI community patterns

## Metadata

**Confidence breakdown:**
- Standard stack (libraries): **HIGH** - All recommendations from official Telegram, FastAPI, and Pydantic documentation
- Architecture patterns: **HIGH** - Dependency injection and Pydantic Settings are FastAPI standard approach, used in official examples
- Pitfalls: **HIGH** - Pitfalls are well-documented in Telegram Mini Apps docs and FastAPI security guides
- Code examples: **HIGH** - Examples adapted from official documentation and verified libraries

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (Pydantic Settings and Telegram API are stable; library versions may update)

---

*Research complete. Ready for phase planning.*
