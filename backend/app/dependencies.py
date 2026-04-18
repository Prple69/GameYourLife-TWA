"""
Shared FastAPI dependencies.

Phase 3: verify_telegram_init_data (Phase 1 initData HMAC dependency) has been
removed. All protected endpoints now use get_current_user, which reads a JWT
from `Authorization: Bearer <token>`.

For first-time Telegram users, the login path is POST /api/auth/telegram-login
(Login Widget HMAC, see app.auth.validate_telegram_login_widget).
"""
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.auth import verify_token
from app.database import get_db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Decode JWT from the Authorization header, fetch the user from DB.
    Raises 401 on missing/invalid/expired token or missing user.
    Rejects refresh tokens (expected_type='access').
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
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
