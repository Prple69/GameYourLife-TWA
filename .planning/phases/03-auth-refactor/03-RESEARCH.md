# Phase 3: Auth Refactor - Research

**Researched:** 2026-04-18
**Domain:** JWT authentication, password hashing, Telegram Login Widget, database migration, refresh token flows, email verification
**Confidence:** HIGH for JWT and password hashing; MEDIUM for email verification scope (can be logger-only in Phase 3)

## Summary

Phase 3 transforms the backend from Telegram initData-only authentication (mini-app exclusive) to a full multi-provider auth system supporting email/password login, Telegram Login Widget login, and JWT-based sessions. The frontend and backend infrastructure is already partially scaffolded in Phase 2 (Zustand authStore with Bearer token support, protected routes, axios interceptors). Phase 3 completes the backend auth layer, implements Alembic for versioned migrations, and wires both login flows to JWT token generation.

**Key technical challenges:** (1) Two different Telegram signature algorithms (initData HMAC for mini-app vs Login Widget HMAC using bot token hash), (2) Alembic baseline creation on an existing manually-created schema, (3) Refresh token lifecycle (DB-backed vs stateless), (4) Email verification scope (full SMTP vs logger stub for Phase 3), (5) Axios refresh interceptor race condition handling.

**Primary recommendations:**
- Use PyJWT for token generation/verification (industry standard, FastAPI official tutorials)
- Use passlib[bcrypt] with 12 rounds (current FastAPI recommendation; pwdlib is emerging but passlib is stable)
- Implement token refresh via `/api/auth/refresh` endpoint with DB-backed refresh token tracking
- Email verification: Log to console in Phase 3 (no real SMTP); defer Phase 11 production email setup
- Alembic: init, create baseline using `stamp head`, then new migration adding email/password fields
- Frontend: Axios auth-refresh library or custom interceptor with promise-queue to handle concurrent 401s

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PyJWT | 2.8+ | Generate and verify JWT access/refresh tokens | FastAPI official tutorial standard; pure Python, no external deps; HS256 (HMAC-SHA256) built-in |
| passlib[bcrypt] | 1.7.4+ | Secure password hashing with bcrypt | FastAPI recommended; bcrypt is slow by design (12 rounds ≈ 200ms per hash), resists brute force; timing-safe comparison built-in |
| python-multipart | 0.0.6+ | Form data parsing for login endpoints | FastAPI dependency for OAuth2PasswordRequestForm |
| Alembic | 1.13+ | Database migration versioning | SQLAlchemy official tool; baseline + incremental migrations from existing schema |
| itsdangerous | 2.1+ | Optional: email verification token generation | URLSafeTimedSerializer for time-limited verification links; scope TBD (Phase 3 can defer to Phase 11) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cryptography | 42.0+ | Optional: cryptographic operations for PyJWT | Installed with PyJWT[crypto]; handles HMAC-SHA256 internally |
| axios-auth-refresh | 4.4+ | Frontend: pre-built token refresh interceptor | Alternative to custom axios interceptor; handles queue + race condition |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PyJWT | python-jose (deprecated) or cryptography (lower-level) | python-jose is less maintained; cryptography requires manual token encoding |
| passlib | argon2-cffi (better security, slower) | Argon2 is newer, more secure, but overkill for v1 SaaS; passlib is battle-tested |
| Alembic | Flyway or sqlalchemy-utils | Alembic is SQLAlchemy-native, industry standard, zero friction in Python stack |
| Email via itsdangerous | Plain JWT with short expiry | JWT is simpler, fits existing token pattern; but itsdangerous is cleaner for email-specific flows |

**Installation:**
```bash
pip install PyJWT passlib[bcrypt] python-multipart Alembic itsdangerous cryptography
```

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | `POST /api/auth/register` with email + password + display_name, sends email confirmation | Pydantic schema validation; passlib bcrypt hashing; email verification token via itsdangerous or JWT; Phase 3 scope: log to console instead of real SMTP |
| AUTH-02 | `POST /api/auth/login` returns access (15min) + refresh (30days) tokens | PyJWT token generation with exp claim; refresh token storage in DB (or stateless JWT); both as JSON response |
| AUTH-03 | `POST /api/auth/telegram-login` accepts Telegram Login Widget data, validates HMAC using bot token hash, creates/finds user by telegram_id | Telegram Login Widget uses HMAC-SHA256(SHA256(bot_token), data-check-string); differs from initData algorithm; stdlib hmac sufficient |
| AUTH-04 | All existing endpoints (`/api/user/me`, `/api/quests/*`) work via `Depends(get_current_user)` replacing `verify_telegram_init_data`; uniform identity handling | FastAPI dependency pattern; decode JWT from Authorization: Bearer header; extract user_id from token sub claim |
| AUTH-05 | Password reset via email (request + reset endpoints) | Out of scope for Phase 3 per success criteria; deferred to Phase 11 |
| AUTH-06 | Existing Telegram user by telegram_id migrates without data loss on first Login Widget login | Nullable email/password_hash in migration; telegram-login finds user by telegram_id if exists, links email; test with seeded user |

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── app/
│   ├── config.py                  # Pydantic Settings (existing)
│   ├── main.py                    # FastAPI app (modify for new auth routes)
│   ├── dependencies.py            # verify_telegram_init_data + get_current_user
│   ├── database.py                # AsyncSession (existing)
│   ├── models.py                  # User model (ADD: email, password_hash, email_verified_at, display_name, gems; make telegram_id nullable)
│   ├── crud.py                    # User CRUD operations (ADD: find by email, hash password, etc.)
│   ├── schemas.py                 # Pydantic request/response schemas (ADD: Register, Login, Token)
│   ├── auth.py                    # NEW: JWT token generation/verification, password hashing utilities
│   ├── routers/
│   │   ├── auth.py                # NEW: /api/auth/* endpoints
│   │   └── quests.py              # REFACTOR: move quest routes here, add Depends(get_current_user)
│   └── migrations/                # Alembic (NEW directory structure)
│       ├── env.py
│       ├── script.py.mako
│       ├── versions/
│       │   ├── 001_baseline.py    # Baseline: current schema snapshot
│       │   └── 002_auth_fields.py # NEW: email, password_hash, email_verified_at, display_name, gems
│       └── alembic.ini
├── requirements.txt               # (update with PyJWT, passlib, etc.)
├── .env                           # Add JWT_SECRET_KEY, JWT_ALGORITHM, etc.
└── .env.example                   # Document all required vars
```

### Pattern 1: JWT Token Generation and Verification

**What:** Create and verify JWT tokens containing user identity (sub claim = user_id), expiration, and optional additional data. Access token is short-lived (15 min); refresh token is long-lived (30 days).

**When to use:** Every login, every protected endpoint that reads `Authorization: Bearer <token>` header.

**Example:**

```python
# backend/app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-at-least-32-chars-from-env"  # Load from config
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    exp: datetime

def hash_password(password: str) -> str:
    """Hash password with bcrypt (12 rounds ≈ 200ms)."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext against bcrypt hash (timing-safe)."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token with user_id in 'sub' claim.
    Expiration defaults to 15 minutes.
    
    Source: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
    """
    to_encode = {"sub": str(user_id)}
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # jwt.encode returns a string (PyJWT 2.0+)
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token with user_id in 'sub' claim. Default 30 days."""
    to_encode = {"sub": str(user_id), "type": "refresh"}
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[int]:
    """
    Decode and verify JWT. Returns user_id (sub claim) on success.
    Raises jwt.InvalidTokenError on failure (invalid signature, expired, etc.).
    
    Source: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return int(user_id)
    except jwt.InvalidTokenError:
        return None
```

### Pattern 2: FastAPI get_current_user Dependency

**What:** Replace `verify_telegram_init_data` with a JWT-based dependency that extracts Authorization: Bearer header, verifies token, and returns User object.

**When to use:** On every protected endpoint, just like Phase 1 used `verify_telegram_init_data`.

**Example:**

```python
# backend/app/dependencies.py
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import verify_token
from app.database import get_db
from app import crud

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency: Extract JWT from Authorization header, verify, fetch User from DB.
    Replaces verify_telegram_init_data for all endpoints.
    
    Raises HTTPException 401 if token is missing, invalid, or expired.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization[len("Bearer "):]
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from DB to ensure they still exist
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Old way (Phase 1, 2):
# @app.get("/api/user/me")
# async def get_profile(init_data = Depends(verify_telegram_init_data), db = Depends(get_db)):
#     tg_id = str(init_data["user"]["id"])
#     user = await crud.get_user_by_tg_id(db, tg_id)

# New way (Phase 3):
# @app.get("/api/user/me", response_model=schemas.UserSchema)
# async def get_profile(user = Depends(get_current_user)):
#     return user  # Already fetched from DB in dependency
```

### Pattern 3: Email/Password Registration and Login Endpoints

**What:** Accept email + password, validate via Pydantic, hash password, store user, return access + refresh tokens.

**When to use:** New user signup and existing user login flows.

**Example:**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.auth import hash_password, create_access_token, create_refresh_token, verify_password
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str  # EmailStr requires email-validator; for now plain string
    password: str
    display_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=Token)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    POST /api/auth/register
    Create new user with email + password. 
    Phase 3 scope: log verification email to console (no SMTP).
    """
    # Check email not already registered
    existing = await crud.get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password, create user
    hashed_pwd = hash_password(req.password)
    user = await crud.create_user_email(
        db,
        email=req.email,
        password_hash=hashed_pwd,
        display_name=req.display_name,
    )
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # TODO: Send verification email (Phase 3: log to console)
    # verification_token = create_email_verification_token(user.email)
    # logger.info(f"Email verification token for {user.email}: {verification_token}")
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    POST /api/auth/login
    Authenticate with email + password. Return access + refresh tokens.
    """
    # Fetch user by email
    user = await crud.get_user_by_email(db, req.email)
    
    # Dummy hash verification to prevent username enumeration
    # (If user not found, verify against dummy hash anyway to take same time)
    dummy_hash = "$2b$12$2r9.v7aQqHNMX.vVz3.wOeHp1tJvJtCDrF7R4p.7VYN/JZfI6b7zK"  # bcrypt hash of "dummy"
    hashed_to_check = user.password_hash if user else dummy_hash
    
    if not verify_password(req.password, hashed_to_check):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user:  # Redundant check, but explicit for clarity
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=Token)
async def refresh(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/auth/refresh
    Accept refresh token in Authorization header, return new access token.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    refresh_token = authorization[len("Bearer "):]
    user_id = verify_token(refresh_token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Verify user still exists
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Generate new access token (optional: rotate refresh token)
    access_token = create_access_token(user.id)
    
    return Token(access_token=access_token, refresh_token=refresh_token)
```

### Pattern 4: Telegram Login Widget Validation

**What:** Validate Telegram Login Widget HMAC signature using bot token hash (different from initData algorithm). Extract user data, find or create user by telegram_id, return JWT tokens.

**When to use:** When user clicks "Login with Telegram" on landing page (non-mini-app flow).

**Example:**

```python
# backend/app/auth.py (continuation)
import hmac
import hashlib
import json
import urllib.parse
from config import get_settings

def validate_telegram_login_widget(data: dict, bot_token: str) -> bool:
    """
    Validate Telegram Login Widget signature.
    
    IMPORTANT: Different from initData algorithm!
    - initData (mini-app): HMAC-SHA256(HMAC-SHA256("WebAppData", bot_token), data-check-string)
    - Login Widget: HMAC-SHA256(SHA256(bot_token), data-check-string)
    
    Source: https://core.telegram.org/widgets/login
    Data-check-string: sorted key=value pairs joined by newline, hash field excluded.
    """
    # Extract hash from data, remove it from validation
    received_hash = data.pop("hash", None)
    if not received_hash:
        return False
    
    # Build data-check-string: sorted key=value, newline separator
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(data.items())
    )
    
    # Compute secret key as SHA256(bot_token)
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    
    # Compute HMAC-SHA256(secret_key, data-check-string)
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Compare hashes with constant-time comparison
    return hmac.compare_digest(computed_hash, received_hash)

# backend/app/routers/auth.py (continuation)

class TelegramLoginRequest(BaseModel):
    id: int                    # Telegram user ID
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int             # Unix timestamp
    hash: str                  # HMAC signature

@router.post("/telegram-login", response_model=Token)
async def telegram_login(req: TelegramLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    POST /api/auth/telegram-login
    Validate Telegram Login Widget signature, find or create user by telegram_id.
    Returns JWT access + refresh tokens.
    """
    settings = get_settings()
    
    # Convert request to dict for signature validation
    req_dict = req.dict()
    received_hash = req_dict.pop("hash")
    
    # Validate signature
    if not validate_telegram_login_widget(req_dict, settings.TELEGRAM_BOT_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")
    
    # Check auth_date is recent (within 5 minutes to match Telegram widget spec)
    current_timestamp = int(datetime.now(timezone.utc).timestamp())
    if current_timestamp - req.auth_date > 300:  # 5 minutes
        raise HTTPException(status_code=401, detail="Telegram signature expired")
    
    # Find or create user by telegram_id
    telegram_id = str(req.id)
    user = await crud.get_user_by_telegram_id(db, telegram_id)
    
    if not user:
        # First-time Telegram Login Widget user: create with telegram_id, email=NULL, password_hash=NULL
        display_name = req.first_name
        if req.last_name:
            display_name += f" {req.last_name}"
        
        user = await crud.create_user_telegram(
            db,
            telegram_id=telegram_id,
            display_name=display_name,
            username=req.username,
        )
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return Token(access_token=access_token, refresh_token=refresh_token)
```

### Anti-Patterns to Avoid

- **Storing plaintext passwords:** Always hash with passlib. Storing "password123" loses user trust forever.
- **JWT without expiration:** Tokens that never expire mean stolen token = permanent compromise. Always include `exp` claim.
- **Comparing HMAC signatures with `==`:** Use `hmac.compare_digest()` for timing-safe comparison (prevents timing attacks on signature validation).
- **Confusing initData and Login Widget algorithms:** Phase 1 uses HMAC-SHA256(HMAC-SHA256("WebAppData", bot_token), ...). Login Widget uses HMAC-SHA256(SHA256(bot_token), ...). Document both clearly.
- **Storing refresh tokens in localStorage:** They're still JWT, still readable. Use httpOnly cookies for better security (but Phase 2 chose localStorage for simplicity; acceptable for v1 SaaS).
- **Making telegram_id non-nullable in new schema:** Phase 3 must support both email-only and telegram-only users. Always nullable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token generation/verification | Manual base64 + signature | PyJWT library | Cryptography is error-prone; library is battle-tested, handles edge cases (clock skew, algorithm mismatches) |
| Password hashing | md5() or custom hash | passlib[bcrypt] | Bcrypt is slow by design (12 rounds = 200ms), resists GPU brute-force; passlib handles salt + rounds automatically |
| Telegram signature validation (both initData and Login Widget) | Manual HMAC-SHA256 | stdlib hmac + hashlib | Cryptography is error-prone; understand both algorithms are different (Login Widget uses SHA256(bot_token) vs initData uses HMAC with "WebAppData" prefix) |
| Database migrations from existing schema | Manual SQL scripts | Alembic + autogenerate | Alembic baseline + migrations allow safe evolution; manual scripts are error-prone in production |
| Token refresh with concurrent requests | Simple if check on 401 | Promise queue or axios-auth-refresh | Without queue, concurrent requests trigger multiple refresh calls and race conditions; queue ensures single refresh shared by all pending requests |

**Key insight:** Authentication has many subtle pitfalls (timing attacks, token expiration, refresh token rotation, signature algorithm differences). Use well-tested libraries, not custom code.

## Common Pitfalls

### Pitfall 1: Forgetting JWT Expiration Check
**What goes wrong:** Token is valid signature but issued hours ago (stolen token still accepted indefinitely).
**Why it happens:** Developer forgets to include `exp` claim in token or skips verifying it during decode.
**How to avoid:** Always include `exp` in token: `to_encode.update({"exp": expire})`. PyJWT automatically validates `exp` during `jwt.decode()`.
**Warning signs:** Tokens in logs have no `exp` claim; security audit flags tokens with indefinite validity.

### Pitfall 2: Mixing initData and Login Widget Algorithms
**What goes wrong:** Using initData validation code for Login Widget (or vice versa). Signature always fails.
**Why it happens:** Both use HMAC-SHA256 but with different secrets: initData uses HMAC-SHA256("WebAppData", bot_token); Login Widget uses SHA256(bot_token). Easy to confuse.
**How to avoid:** Document both algorithms side-by-side. Phase 1 used one; Phase 3 adds the other. Keep separate functions: `validate_telegram_init_data()` and `validate_telegram_login_widget()`.
**Warning signs:** Login Widget endpoint always returns 401; signature validation code tries to use both endpoints with single function.

### Pitfall 3: Storing Refresh Tokens in Frontend
**What goes wrong:** Refresh token in localStorage = same as access token (readable by JavaScript). If SPA has XSS, attacker steals both tokens.
**Why it happens:** Simplicity: localStorage works in Zustand, no server-side session needed. But refresh token should be more protected than access token.
**How to avoid:** Use httpOnly cookies for refresh token (inaccessible to JavaScript), localStorage for access token. Phase 2 chose full localStorage for simplicity; Phase 3 can defer to Phase 11 hardening.
**Warning signs:** Token theft during XSS attack compromises all tokens simultaneously.

### Pitfall 4: Creating Password Reset Without Email Verification
**What goes wrong:** User resets password via email reset link, but doesn't verify email address is theirs. Attacker sets new password.
**Why it happens:** Shortcut: skip email verification step, go straight to password reset form.
**How to avoid:** Always verify email address matches before allowing password reset. Use email verification token with short expiry (1 hour).
**Warning signs:** "Reset password" endpoint accepts link from email without confirming email deliverability.

### Pitfall 5: Alembic Baseline Collision with Existing Schema
**What goes wrong:** Create baseline migration, then generate new migration, but baseline doesn't match current DB. Migrations fail or duplicate columns.
**Why it happens:** `alembic revision --autogenerate` sees schema as empty (or diverged from models), generates migration to recreate everything already in DB.
**How to avoid:** After init Alembic: (1) verify `target_metadata` in env.py points to your SQLAlchemy Base, (2) run `alembic revision --autogenerate -m "baseline"`, (3) review generated migration to ensure it's empty or matches current schema, (4) run `alembic stamp head` to mark DB as already at latest migration without running it.
**Warning signs:** First migration tries to recreate all tables; `alembic upgrade` fails with "table already exists".

### Pitfall 6: Bcrypt Rounds Too Low or Too High
**What goes wrong:** Rounds too low (4-6): hashing is fast, doesn't resist brute force. Rounds too high (14+): registration/login takes 5+ seconds, UX nightmare.
**Why it happens:** Misunderstanding bcrypt work factor. 2^rounds = iterations. Default is 12 (4096 iterations ≈ 200ms on modern CPU).
**How to avoid:** Use passlib default (12 rounds) unless you have specific reason. Test: `time python -c "from passlib.context import CryptContext; c = CryptContext(schemes=['bcrypt'], bcrypt__rounds=12); print(c.hash('test'))"` should take 100-300ms.
**Warning signs:** Password hash takes <50ms (too weak) or >1 second (too slow).

### Pitfall 7: Refresh Token Rotation Without Revocation
**What goes wrong:** Refresh token can be reused indefinitely. If stolen, attacker can get new access tokens forever.
**Why it happens:** No backend tracking of issued refresh tokens. Simple JWT stores data only in token itself.
**How to avoid:** Phase 3: Store refresh token in DB with expiry + revocation flag. On `/refresh`, check token exists and is not revoked. Optional: rotate (issue new refresh token, invalidate old one).
**Warning signs:** Refresh tokens never expire; security audit flags lack of token revocation mechanism.

## Code Examples

Verified patterns from official and community sources:

### Complete Auth Setup (Backend Main File)

```python
# backend/app/main.py (Phase 3 modifications)
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
import database, crud, schemas
from config import get_settings
from routers import auth, quests  # NEW: router imports
from dependencies import get_current_user  # NEW

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes (Phase 3 NEW)
app.include_router(auth.router)

# Include quest routes (refactored from @app.post inline)
app.include_router(quests.router)

# Health check (pre-auth, no JWT required)
@app.get("/api/health")
async def health(db: AsyncSession = Depends(database.get_db)):
    return {"status": "ok"}

# Profile endpoint (Phase 3: JWT instead of initData)
@app.get("/api/user/me", response_model=schemas.UserSchema)
async def get_profile(user = Depends(get_current_user)):
    """Now uses JWT token instead of Telegram initData."""
    return user
```

### Axios Refresh Interceptor (Frontend)

```javascript
// frontend/src/services/api.js (Phase 3 additions)
import axios from 'axios';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 + refresh
let refreshPromise = null;  // Queue for concurrent refresh calls

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refresh is already in progress, wait for it
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) {
              useAuthStore.getState().clearTokens();
              window.location.href = '/login';
              throw new Error('No refresh token');
            }

            const res = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'}/auth/refresh`,
              {},
              {
                headers: { Authorization: `Bearer ${refreshToken}` },
              }
            );

            const { access_token, refresh_token } = res.data;
            useAuthStore.getState().setTokens(access_token, refresh_token);

            return access_token;
          } catch (err) {
            useAuthStore.getState().clearTokens();
            window.location.href = '/login';
            throw err;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Alembic Baseline and Migration Setup

```bash
# Command sequence for Phase 3 Alembic setup
# Run from backend/ directory

# 1. Initialize Alembic (one-time)
alembic init migrations

# 2. Configure env.py to import your models
# Edit migrations/env.py:
#   - Import your Base: from app.models import Base
#   - Set target_metadata = Base.metadata

# 3. Generate baseline migration (captures current schema)
alembic revision --autogenerate -m "baseline"
# Review migrations/versions/xxx_baseline.py
# It should be mostly empty or match your current schema

# 4. Mark existing DB as already at baseline (don't actually run it)
alembic stamp head

# 5. Now create Phase 3 auth migration
alembic revision --autogenerate -m "add_auth_fields"
# Review migrations/versions/xxx_add_auth_fields.py
# It should add: email, password_hash, email_verified_at, display_name, gems
# And modify: telegram_id to nullable

# 6. Run new migration on dev DB
alembic upgrade head
```

### Alembic Migration File Example (Auth Fields)

```python
# migrations/versions/002_add_auth_fields.py (auto-generated, review before running)
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Add new nullable columns (existing users won't have these)
    op.add_column('users', sa.Column('email', sa.String, unique=True, nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String, nullable=True))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('display_name', sa.String, nullable=True))
    op.add_column('users', sa.Column('gems', sa.Integer, default=0, nullable=False))
    
    # Make telegram_id nullable (was unique, now both email and telegram_id can be NULL)
    op.alter_column('users', 'telegram_id', existing_type=sa.String, nullable=True)
    
    # Optional: drop the UNIQUE constraint on telegram_id if it exists, re-create as partial index
    # (Postgres syntax: UNIQUE constraint only where not null)
    # This is database-specific; SQLAlchemy may not autogenerate correctly

def downgrade() -> None:
    # Reverse the changes
    op.drop_column('users', 'gems')
    op.drop_column('users', 'display_name')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email')
    op.alter_column('users', 'telegram_id', existing_type=sa.String, nullable=False)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom JWT in Base64 | PyJWT library with HS256 | 2015+ (standard since JWT RFC 7519) | Industry standard; eliminates crypto bugs |
| MD5 password hashing | bcrypt with 12 rounds via passlib | 2015+ (bcrypt designed 1999, passlib 2010+) | Bcrypt is slow by design, resists GPU brute-force; timing-safe comparison built-in |
| Stateless tokens forever | JWT with exp claim + refresh token pattern | 2018+ (OAuth2 best practices) | Tokens can be revoked; refresh tokens can rotate; better UX (short-lived access tokens) |
| Manual HMAC comparison with `==` | `hmac.compare_digest()` | 2014+ (timing attack awareness) | Constant-time comparison prevents timing attacks on signature verification |
| `os.getenv()` for secrets | Pydantic Settings with env_file + @lru_cache | 2020+ (FastAPI best practice) | Type safety, automatic validation, `.env` file support |
| Manual database migrations | Alembic autogenerate + baseline | 2010+ (SQLAlchemy ecosystem standard) | Version control for schema changes; safe rollback |

**Deprecated/outdated:**
- `passlib` without bcrypt: Use `passlib[bcrypt]` with scheme specified
- `itsdangerous.URLSafeSerializer`: Still okay, but `URLSafeTimedSerializer` is recommended for time-limited tokens (password reset, email verification)
- Storing refresh tokens in localStorage: Still acceptable for v1 (Phase 2 chose this), but hardening to httpOnly cookies recommended post-launch

## Email Verification Scope (Phase 3 vs Phase 11)

**Phase 3 decision:** Email verification is OUT OF SCOPE for Phase 3 success criteria. Phase 3 scope is to build the JWT auth flow and refactor all endpoints. Email sending is deferred to Phase 11 production polish (when real SMTP is integrated).

**Phase 3 approach:**
1. User registers with email + password
2. Registration endpoint logs verification token to console instead of sending email
3. User can proceed to app immediately (email_verified_at = NULL for all Phase 3 users)
4. Verification link skeleton is already in App.jsx from Phase 2 (/verify-email/:token)

**Phase 11 approach:**
1. Real SMTP integration via aiosmtplib or FastAPI-Mail
2. Verification email template + dynamic link generation
3. Endpoint checks email_verified_at before certain features (e.g., purchase)

**Implementation for Phase 3:**

```python
# backend/app/routers/auth.py (Phase 3)

import logging
logger = logging.getLogger(__name__)

@router.post("/register", response_model=Token)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # ... existing code ...
    
    # Phase 3: Email verification via console log
    verification_token = create_email_verification_token(user.email)
    logger.info(f"[PHASE 3 STUB] Email verification for {user.email}:")
    logger.info(f"  Token: {verification_token}")
    logger.info(f"  Link: http://localhost:5173/verify-email/{verification_token}")
    
    # User can login immediately without verifying
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """
    POST /api/auth/verify-email?token=xxx
    Phase 3: Log to console (stub).
    Phase 11: Real email verification.
    """
    email = verify_email_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = await crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark email as verified
    await crud.update_user_email_verified(db, user.id)
    
    return {"message": "Email verified successfully"}
```

## Open Questions

1. **Refresh Token Revocation Strategy**
   - What we know: Phase 3 success criteria requires refresh tokens to be issued and work
   - What's unclear: Should refresh tokens be stored in DB for revocation? Or stateless JWT?
   - Recommendation: DB-backed for Phase 3 (simple: one row per refresh token, expiry + revoked flag). Stateless is simpler but loses ability to revoke. For v1 SaaS, DB-backed is safer.

2. **httpOnly Cookies vs localStorage for Tokens**
   - What we know: Phase 2 chose localStorage (Zustand persist middleware) for simplicity
   - What's unclear: Should Phase 3 switch tokens to httpOnly cookies (more secure from XSS)?
   - Recommendation: Keep localStorage in Phase 3 (matches Phase 2 architecture). Recommend switching to httpOnly cookies in Phase 11 hardening if time permits.

3. **Email Verification Required Before Login?**
   - What we know: Phase 3 success criteria doesn't mention blocking unverified users
   - What's unclear: Can user login immediately after registration, or must verify email first?
   - Recommendation: No email verification required in Phase 3. User can login immediately. Phase 11 can add verification checks.

4. **Partial Telegram User Migration**
   - What we know: Phase 3 must not lose data for users created in Phase 1/2 (telegram_id only)
   - What's unclear: When Phase 1 user logs in via telegram-login endpoint, should email field be auto-filled?
   - Recommendation: No. email = NULL, password_hash = NULL. User can set these later via account settings (out of Phase 3 scope).

## Validation Architecture

> Skip: `workflow.nyquist_validation` is not set to `true` in `.planning/config.json`

## Sources

### Primary (HIGH confidence)
- [FastAPI OAuth2 with JWT Tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) - PyJWT pattern, token generation/verification, HS256 algorithm
- [PyJWT Documentation](https://pyjwt.readthedocs.io/en/latest/) - Token encoding/decoding, exp claim, algorithms
- [passlib Documentation](https://passlib.readthedocs.io/en/1.7.x/) - CryptContext, bcrypt scheme, rounds configuration
- [Alembic Documentation](https://alembic.sqlalchemy.org/en/latest/) - Baseline, autogenerate, stamp command
- [Telegram Login Widget Official Docs](https://core.telegram.org/widgets/login) - Hash validation algorithm (uses SHA256(bot_token) as secret)
- [Telegram Mini Apps Init Data Docs](https://docs.telegram-mini-apps.com/platform/init-data) - initData validation algorithm (uses HMAC("WebAppData", bot_token))

### Secondary (MEDIUM confidence)
- [Securing FastAPI with JWT (TestDriven.io)](https://testdriven.io/blog/fastapi-jwt-auth/) - Refresh token pattern, 401 response handling
- [Token Refresh with Axios Interceptors (Medium)](https://medium.com/@velja/token-refresh-with-axios-interceptors-for-a-seamless-authentication-experience-854b06064bde) - Race condition handling with promise queue
- [axios-auth-refresh npm package](https://www.npmjs.com/package/axios-auth-refresh) - Pre-built library for refresh token interceptor
- [Alembic with Existing Database (Medium)](https://medium.com/@megablazikenabhishek/initialize-alembic-migrations-on-existing-database-for-auto-generated-migrations-zero-state-31ee93632ed1) - Baseline + stamp workflow

### Tertiary (verified via multiple sources, flagged for validation)
- Email verification patterns (itsdangerous vs JWT) — multiple community approaches, no single "canonical" pattern; Phase 3 defers to console logging
- Refresh token storage (DB vs stateless) — both approaches have tradeoffs; project chose DB-backed for safer revocation
- httpOnly cookies vs localStorage — security best practice is httpOnly; Phase 2 chose localStorage; can upgrade in Phase 11

## Metadata

**Confidence breakdown:**
- Standard stack (PyJWT, passlib, Alembic): **HIGH** — All from official FastAPI docs or SQLAlchemy ecosystem standards
- JWT pattern (token generation, verification, exp claim): **HIGH** — Verified against official FastAPI tutorial and PyJWT docs
- Telegram signature validation (both algorithms): **MEDIUM-HIGH** — Verified against official Telegram docs; community gists confirm implementation
- Password hashing (bcrypt 12 rounds): **HIGH** — FastAPI official recommendation; passlib best practice
- Email verification scope (Phase 3 vs 11): **MEDIUM** — Documented from success criteria; exact SMTP approach deferred
- Alembic baseline with existing schema: **MEDIUM** — Workflow verified via Medium article + official docs; edge cases may vary by DB engine
- Axios refresh interceptor: **MEDIUM** — Pattern verified via multiple sources; implementation varies (library vs custom)

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (JWT and password hashing are stable; Alembic and FastAPI may have minor updates)

---

## RESEARCH COMPLETE

### Key Findings Summary

1. **JWT Stack:** Use PyJWT 2.8+ with HS256 for token generation/verification. Always include `exp` claim; PyJWT validates automatically on decode.

2. **Password Hashing:** passlib[bcrypt] with 12 rounds (200ms per hash). Don't use less (too weak) or more (UX nightmare). Timing-safe comparison built-in.

3. **Telegram Login Widget vs initData:** Two different HMAC algorithms. Login Widget = HMAC-SHA256(SHA256(bot_token), data-check-string). initData = HMAC-SHA256(HMAC-SHA256("WebAppData", bot_token), ...). Keep separate validation functions.

4. **Alembic Baseline:** After init, generate baseline migration, review it (should be mostly empty or match current schema), then `alembic stamp head` to mark DB as already at baseline without running it. Then create Phase 3 auth migration.

5. **Email Verification:** Out of scope for Phase 3. Log token to console. Phase 11 adds real SMTP. User can login immediately without email verification.

6. **Refresh Token Interceptor (Frontend):** Use axios interceptor with promise queue to handle concurrent 401s. Single refresh call shared by all pending requests. Alternatively, use axios-auth-refresh npm package.

7. **JWT vs initData Migration:** Phase 1 endpoints use `Depends(verify_telegram_init_data)`. Phase 3 all endpoints use `Depends(get_current_user)` which reads `Authorization: Bearer` header and decodes JWT. Both can coexist during transition, but final Phase 3 removes initData entirely.

8. **localStorage vs httpOnly Cookies:** Phase 2 chose localStorage. Acceptable for v1 SaaS. Phase 11 hardening can switch to httpOnly cookies for refresh token (more secure from XSS). Defer to Phase 11.

*Research complete. Ready for phase planning.*
