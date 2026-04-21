"""Phase 5: Inventory view and item activation/equip endpoints."""
import json
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app import models, schemas, crud
from app.dependencies import get_current_user, get_db
from app.models import get_msk_now
from app.utils.game_logic import effective_max_hp

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

# Maps booster item_type to User column prefix
# e.g. "booster_xp" → prefix "xp" → columns "active_xp_mult", "active_xp_expires_at"
BOOSTER_PREFIX_MAP = {
    "booster_xp": "xp",
    "booster_gold": "gold",
    "booster_strength_xp": "strength_xp",
    "booster_wisdom_xp": "wisdom_xp",
    "booster_endurance_xp": "endurance_xp",
    "booster_charisma_xp": "charisma_xp",
    "booster_hp_max": "hp_max",  # special: no mult attr, uses hp_max_bonus
}


@router.get("", response_model=list[schemas.InventoryItemSchema])
async def get_inventory(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all owned items for the authenticated user with nested shop_item data."""
    return await crud.get_inventory(db, user.id)


@router.post("/{inventory_item_id}/activate")
async def activate_item(
    inventory_item_id: int,
    body: schemas.ActivateRequest,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atomically activate a consumable item (booster or potion). Idempotent via idempotency_key."""
    try:
        uuid.UUID(body.idempotency_key)
    except (ValueError, AttributeError):
        raise HTTPException(400, "invalid_uuid_format")

    async with db.begin():
        # Check idempotency cache
        idem_res = await db.execute(
            select(models.IdempotencyKey).filter(
                models.IdempotencyKey.user_id == user.id,
                models.IdempotencyKey.key == body.idempotency_key,
            )
        )
        if idem_res.scalars().first():
            return {"success": True, "message": "already_processed"}

        # Fetch inventory item with shop_item relationship
        inv_res = await db.execute(
            select(models.InventoryItem)
            .filter(
                models.InventoryItem.id == inventory_item_id,
                models.InventoryItem.user_id == user.id,
            )
            .options(selectinload(models.InventoryItem.shop_item))
        )
        inv_item = inv_res.scalars().first()
        if not inv_item:
            raise HTTPException(404, "item_not_found")

        item = inv_item.shop_item
        now = get_msk_now()
        result = {}

        if item.item_type == "skin":
            raise HTTPException(400, "use_equip_endpoint")

        elif item.item_type == "potion_heal":
            max_hp = effective_max_hp(user, now)
            healed = min(item.heal_amount, max_hp - user.hp)
            user.hp = min(user.hp + item.heal_amount, max_hp)
            inv_item.quantity -= 1
            if inv_item.quantity <= 0:
                await db.delete(inv_item)
            result = {"success": True, "item_type": "potion", "healed": healed, "hp_after": user.hp}

        elif item.item_type in BOOSTER_PREFIX_MAP:
            prefix = BOOSTER_PREFIX_MAP[item.item_type]

            if item.item_type == "booster_hp_max":
                # HP max boost: check slot, set bonus + expires_at
                exp_attr = "active_hp_max_expires_at"
                bon_attr = "active_hp_max_bonus"
                expires_at = getattr(user, exp_attr, None)
                if expires_at and expires_at > now:
                    raise HTTPException(409, "already_active")
                setattr(user, bon_attr, item.hp_max_bonus)
                setattr(user, exp_attr, now + timedelta(seconds=item.duration_seconds))
                result = {
                    "success": True, "boost_type": "hp_max",
                    "hp_max_bonus": item.hp_max_bonus,
                    "expires_at": (now + timedelta(seconds=item.duration_seconds)).isoformat(),
                }
            else:
                # Multiplier boosts (xp, gold, stat_xp)
                mult_attr = f"active_{prefix}_mult"
                exp_attr = f"active_{prefix}_expires_at"
                expires_at = getattr(user, exp_attr, None)
                if expires_at and expires_at > now:
                    raise HTTPException(409, "already_active")
                setattr(user, mult_attr, item.effect_multiplier)
                setattr(user, exp_attr, now + timedelta(seconds=item.duration_seconds))
                result = {
                    "success": True, "boost_type": prefix,
                    "multiplier": item.effect_multiplier,
                    "expires_at": (now + timedelta(seconds=item.duration_seconds)).isoformat(),
                }

            inv_item.quantity -= 1
            if inv_item.quantity <= 0:
                await db.delete(inv_item)

        else:
            raise HTTPException(400, "unknown_item_type")

        db.add(models.IdempotencyKey(
            user_id=user.id,
            key=body.idempotency_key,
            response_json=json.dumps(result),
        ))

    return result


@router.post("/{inventory_item_id}/equip")
async def equip_item(
    inventory_item_id: int,
    body: schemas.EquipRequest,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Equip a skin item: sets user.selected_avatar = shop_item.avatar_key. Idempotent."""
    try:
        uuid.UUID(body.idempotency_key)
    except (ValueError, AttributeError):
        raise HTTPException(400, "invalid_uuid_format")

    async with db.begin():
        idem_res = await db.execute(
            select(models.IdempotencyKey).filter(
                models.IdempotencyKey.user_id == user.id,
                models.IdempotencyKey.key == body.idempotency_key,
            )
        )
        if idem_res.scalars().first():
            return {"success": True, "message": "already_processed"}

        inv_res = await db.execute(
            select(models.InventoryItem)
            .filter(
                models.InventoryItem.id == inventory_item_id,
                models.InventoryItem.user_id == user.id,
            )
            .options(selectinload(models.InventoryItem.shop_item))
        )
        inv_item = inv_res.scalars().first()
        if not inv_item:
            raise HTTPException(404, "item_not_found")

        item = inv_item.shop_item
        if item.item_type != "skin":
            raise HTTPException(400, "not_a_skin")

        user.selected_avatar = item.avatar_key
        result = {"success": True, "equipped_avatar": item.avatar_key}

        db.add(models.IdempotencyKey(
            user_id=user.id,
            key=body.idempotency_key,
            response_json=json.dumps(result),
        ))

    return result
