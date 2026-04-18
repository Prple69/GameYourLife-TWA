import hmac
import hashlib
import json
import urllib.parse
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.auth import verify_token


def _verify_manual(init_data: str, bot_token: str) -> dict:
    """
    Validate Telegram WebApp initData HMAC-SHA256 signature using Python stdlib.

    Steps per Telegram docs:
    1. Parse URL-encoded initData into key-value pairs.
    2. Extract and remove the "hash" field.
    3. Build data-check-string: sorted key=value pairs joined by newline, hash excluded.
    4. Derive secret_key = HMAC-SHA256("WebAppData", bot_token).
    5. Compute HMAC-SHA256(secret_key, data-check-string).
    6. Compare computed hash with extracted hash (constant-time).
    7. Reject if auth_date is older than 86400 seconds (1 day).
    8. Parse nested "user" JSON string into a dict.
    """
    parsed = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))

    hash_value = parsed.pop("hash", None)
    if not hash_value:
        raise ValueError("No hash in initData")

    # Build data-check-string from remaining fields, sorted alphabetically
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    # Derive secret key
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()

    # Compute expected hash
    computed_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, hash_value):
        raise ValueError("Signature mismatch")

    # Check expiry (1 day = 86400 seconds)
    auth_date = int(parsed.get("auth_date", 0))
    if (datetime.now(timezone.utc).timestamp() - auth_date) > 86400:
        raise ValueError("InitData expired")

    # Parse nested user JSON string into dict
    if "user" in parsed:
        parsed["user"] = json.loads(parsed["user"])

    return parsed


async def verify_telegram_init_data(
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    settings=Depends(get_settings),
) -> dict:
    """
    FastAPI dependency: Validate Telegram initData HMAC-SHA256 signature.

    Reads initData from X-Telegram-Init-Data request header.
    Returns parsed init data dict on success.
    Raises HTTP 401 on missing, invalid, or expired initData.

    The returned dict contains:
      init_data["user"]["id"]       -> verified Telegram user ID (int)
      init_data["user"]["username"] -> Telegram username (str, may be absent)
      init_data["auth_date"]        -> Unix timestamp of signature (int)
    """
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=401,
            detail="Missing Telegram initData header",
        )
    try:
        init_data_dict = _verify_manual(x_telegram_init_data, settings.TELEGRAM_BOT_TOKEN)
        return init_data_dict
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Telegram signature",
        )


# --- Phase 3: JWT-based dependency -----------------------------------------

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency: extract JWT from Authorization: Bearer header, verify it,
    fetch user from DB. Raises HTTP 401 on any failure.

    Unified identity: works for both email-login'd and telegram-login'd users —
    identity is user.id, not telegram_id.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization[len("Bearer "):]
    user_id = verify_token(token, expected_type="access")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    from app import crud
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
