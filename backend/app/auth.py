"""
auth.py — JWT token utilities, bcrypt password hashing, Telegram Login Widget validation.

Two Telegram HMAC algorithms coexist in this codebase:
  - initData (Phase 1, mini-app):
      HMAC-SHA256(HMAC-SHA256("WebAppData", bot_token), data-check-string)
      -> implemented in dependencies.py::verify_telegram_init_data (removed in Plan 03-02)
  - Login Widget (Phase 3, web):
      HMAC-SHA256(SHA256(bot_token), data-check-string)
      -> implemented here in validate_telegram_login_widget()

Source: https://core.telegram.org/widgets/login
"""
import hmac
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.context import CryptContext

from app.config import get_settings

logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30
EMAIL_VERIFICATION_SALT = "email-verification"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[int]:
    """
    Decode and verify JWT. Returns user_id (int) on success, None on failure.
    PyJWT validates exp automatically. If expected_type is provided ('access' | 'refresh'),
    the token's 'type' claim must match.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        if expected_type and payload.get("type") != expected_type:
            return None
        return int(user_id)
    except jwt.InvalidTokenError:
        return None


def _get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().JWT_SECRET_KEY)


def create_email_verification_token(email: str) -> str:
    return _get_serializer().dumps(email, salt=EMAIL_VERIFICATION_SALT)


def verify_email_token(token: str, max_age: int = 3600) -> Optional[str]:
    try:
        return _get_serializer().loads(token, salt=EMAIL_VERIFICATION_SALT, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None


def validate_telegram_login_widget(data: dict, bot_token: str) -> bool:
    """
    Validate Telegram Login Widget HMAC signature.

    secret_key        = SHA256(bot_token)                  (Login Widget, NOT initData)
    data_check_string = sorted "key=value\n..." without the hash field
    computed_hash     = HMAC-SHA256(secret_key, data_check_string)

    Source: https://core.telegram.org/widgets/login#checking-authorization
    """
    payload = dict(data)
    received_hash = payload.pop("hash", None)
    if not received_hash:
        return False

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(payload.items()))
    secret_key = hashlib.sha256(bot_token.encode()).digest()

    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_hash, received_hash)
