"""
/api/auth/* endpoints.

  POST /api/auth/register       — email + password; logs verification token (Phase 3 stub)
  POST /api/auth/login          — email + password -> JWT tokens
  POST /api/auth/refresh        — refresh access token using refresh_token
  POST /api/auth/telegram-login — Telegram Login Widget HMAC -> JWT tokens
  POST /api/auth/verify-email   — decode itsdangerous token, stamp email_verified_at

Phase 11 scope (not here): real SMTP, password-reset endpoints, rate-limiting.

Telegram algorithm note: Login Widget uses SHA256(bot_token) as HMAC key.
This is distinct from initData's HMAC("WebAppData", bot_token). See auth.py.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, schemas
from app.auth import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    hash_password,
    validate_telegram_login_widget,
    verify_email_token,
    verify_password,
    verify_token,
)
from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Dummy bcrypt hash used when login'd email does not exist — keeps CPU time constant
# so attackers cannot distinguish "no such user" from "wrong password" via timing.
# Regenerate with: python -c "from app.auth import hash_password; print(hash_password('x'))"
_DUMMY_HASH = "$2b$12$FXftuGEp4xSKgjYg9x5U4.OmKDZ0GMHKo8Age9qXlWsvxIQ1D7Ij6"

_TELEGRAM_AUTH_MAX_AGE_SEC = 300  # 5 min, per Telegram Login Widget recommendation


@router.post("/register", response_model=schemas.Token)
async def register(req: schemas.RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await crud.get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await crud.create_user_email(
        db,
        email=req.email,
        password_hash=hash_password(req.password),
        display_name=req.display_name,
    )

    # Phase 3 email verification stub: log the token. Phase 11 adds aiosmtplib.
    token = create_email_verification_token(user.email)
    logger.info("[PHASE 3 STUB] Email verification for %s", user.email)
    logger.info("  Token: %s", token)
    logger.info("  Link:  http://localhost:5173/verify-email/%s", token)

    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=schemas.Token)
async def login(req: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_email(db, req.email)

    # Always run bcrypt verify to keep login timing constant.
    hash_to_check = user.password_hash if (user and user.password_hash) else _DUMMY_HASH
    password_ok = verify_password(req.password, hash_to_check)

    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=schemas.Token)
async def refresh(req: schemas.RefreshRequest, db: AsyncSession = Depends(get_db)):
    user_id = verify_token(req.refresh_token, expected_type="refresh")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Phase 3: stateless — return same refresh token. Phase 11 adds rotation + revocation.
    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=req.refresh_token,
    )


@router.post("/telegram-login", response_model=schemas.Token)
async def telegram_login(
    req: schemas.TelegramLoginRequest, db: AsyncSession = Depends(get_db)
):
    """
    Validate Telegram Login Widget signature, find (AUTH-06) or create user.
    """
    settings = get_settings()

    payload = req.model_dump()
    if not validate_telegram_login_widget(payload, settings.TELEGRAM_BOT_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    now = int(datetime.now(timezone.utc).timestamp())
    if now - req.auth_date > _TELEGRAM_AUTH_MAX_AGE_SEC:
        raise HTTPException(status_code=401, detail="Telegram auth_date expired")

    # AUTH-06: legacy tg user keeps all their data — no migration step needed.
    telegram_id = str(req.id)
    user = await crud.get_user_by_tg_id(db, telegram_id)

    if not user:
        display_name = req.first_name + (f" {req.last_name}" if req.last_name else "")
        user = await crud.create_user_telegram(
            db,
            telegram_id=telegram_id,
            display_name=display_name,
            username=req.username,
        )

    return schemas.Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """POST /api/auth/verify-email?token=... — Phase 3 stub flow."""
    email = verify_email_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user = await crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await crud.update_user_email_verified(db, user.id)
    return {"message": "Email verified successfully"}
