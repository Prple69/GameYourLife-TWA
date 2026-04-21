"""Phase 5: Shop catalog and purchase endpoints."""
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app import models, schemas, crud
from app.dependencies import get_current_user, get_db
from app.models import get_msk_now

router = APIRouter(prefix="/api/shop", tags=["shop"])


@router.get("", response_model=list[schemas.ShopItemSchema])
async def get_catalog(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all active shop items ordered by price ascending."""
    return await crud.get_catalog(db)


@router.post("/buy/{shop_item_id}")
async def buy_item(
    shop_item_id: int,
    body: schemas.PurchaseRequest,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atomic purchase: check idempotency → validate gold → deduct → upsert inventory → save idempotency."""
    try:
        uuid.UUID(body.idempotency_key)
    except (ValueError, AttributeError):
        raise HTTPException(400, "invalid_uuid_format")

    async with db.begin():
        # 1. Check idempotency cache
        idem_res = await db.execute(
            select(models.IdempotencyKey).filter(
                models.IdempotencyKey.user_id == user.id,
                models.IdempotencyKey.key == body.idempotency_key,
            )
        )
        cached = idem_res.scalars().first()
        if cached:
            return json.loads(cached.response_json)

        # 2. Fetch item
        item_res = await db.execute(
            select(models.ShopItem).filter(models.ShopItem.id == shop_item_id)
        )
        item = item_res.scalars().first()
        if not item:
            raise HTTPException(404, "item_not_found")

        # 3. Check gold
        if user.gold < item.price_gold:
            raise HTTPException(400, "insufficient_gold")

        # 4. Skin: check not already owned
        if item.item_type == "skin":
            owned_res = await db.execute(
                select(models.InventoryItem).filter(
                    models.InventoryItem.user_id == user.id,
                    models.InventoryItem.shop_item_id == item.id,
                )
            )
            if owned_res.scalars().first():
                raise HTTPException(409, "already_owned")

        # 5. Deduct gold
        user.gold -= item.price_gold

        # 6. Upsert inventory
        inv_res = await db.execute(
            select(models.InventoryItem).filter(
                models.InventoryItem.user_id == user.id,
                models.InventoryItem.shop_item_id == item.id,
            )
        )
        inv_item = inv_res.scalars().first()
        if inv_item:
            inv_item.quantity += 1
        else:
            db.add(models.InventoryItem(user_id=user.id, shop_item_id=item.id, quantity=1))

        # 7. Build and cache response
        result = {"success": True, "item_name": item.name, "gold_remaining": user.gold}
        db.add(models.IdempotencyKey(
            user_id=user.id,
            key=body.idempotency_key,
            response_json=json.dumps(result),
        ))

    return result
