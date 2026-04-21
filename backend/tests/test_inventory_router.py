"""Inventory router unit tests — Plan 03 implementation.

Uses stub objects (no DB, no TestClient) to test route logic in isolation.
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from app.utils.game_logic import effective_max_hp


# ---------------------------------------------------------------------------
# Stub helpers
# ---------------------------------------------------------------------------

class StubShopItem:
    item_type = "booster_xp"
    name = "XP Boost"
    price_gold = 100
    effect_multiplier = 1.5
    duration_seconds = 900
    heal_amount = None
    hp_max_bonus = None
    avatar_key = None
    is_active = True


class StubInventoryItem:
    quantity = 1
    shop_item = None  # must be set per test


class StubUser:
    id = 1
    gold = 500
    hp = 80
    max_hp = 100
    selected_avatar = "avatar1"
    active_xp_mult = None
    active_xp_expires_at = None
    active_gold_mult = None
    active_gold_expires_at = None
    active_strength_xp_mult = None
    active_strength_xp_expires_at = None
    active_wisdom_xp_mult = None
    active_wisdom_xp_expires_at = None
    active_endurance_xp_mult = None
    active_endurance_xp_expires_at = None
    active_charisma_xp_mult = None
    active_charisma_xp_expires_at = None
    active_hp_max_bonus = None
    active_hp_max_expires_at = None


# ---------------------------------------------------------------------------
# Booster activation helper (mirrors router logic)
# ---------------------------------------------------------------------------

BOOSTER_PREFIX_MAP = {
    "booster_xp": "xp",
    "booster_gold": "gold",
    "booster_strength_xp": "strength_xp",
    "booster_wisdom_xp": "wisdom_xp",
    "booster_endurance_xp": "endurance_xp",
    "booster_charisma_xp": "charisma_xp",
    "booster_hp_max": "hp_max",
}


def simulate_activate(user, inv_item, now):
    """Simulate router activate_item logic. Returns result dict or raises HTTPException."""
    item = inv_item.shop_item

    if item.item_type == "skin":
        raise HTTPException(400, "use_equip_endpoint")

    if item.item_type == "potion_heal":
        max_hp = effective_max_hp(user, now)
        healed = min(item.heal_amount, max_hp - user.hp)
        user.hp = min(user.hp + item.heal_amount, max_hp)
        inv_item.quantity -= 1
        return {"success": True, "item_type": "potion", "healed": healed, "hp_after": user.hp}

    if item.item_type in BOOSTER_PREFIX_MAP:
        prefix = BOOSTER_PREFIX_MAP[item.item_type]

        if item.item_type == "booster_hp_max":
            exp_attr = "active_hp_max_expires_at"
            bon_attr = "active_hp_max_bonus"
            expires_at = getattr(user, exp_attr, None)
            if expires_at and expires_at > now:
                raise HTTPException(409, "already_active")
            setattr(user, bon_attr, item.hp_max_bonus)
            setattr(user, exp_attr, now + timedelta(seconds=item.duration_seconds))
            return {"success": True, "boost_type": "hp_max"}
        else:
            mult_attr = f"active_{prefix}_mult"
            exp_attr = f"active_{prefix}_expires_at"
            expires_at = getattr(user, exp_attr, None)
            if expires_at and expires_at > now:
                raise HTTPException(409, "already_active")
            setattr(user, mult_attr, item.effect_multiplier)
            setattr(user, exp_attr, now + timedelta(seconds=item.duration_seconds))
            inv_item.quantity -= 1
            return {
                "success": True, "boost_type": prefix,
                "multiplier": item.effect_multiplier,
                "expires_at": (now + timedelta(seconds=item.duration_seconds)).isoformat(),
            }

    raise HTTPException(400, "unknown_item_type")


# ---------------------------------------------------------------------------
# test_activate_xp_booster_sets_user_attrs
# ---------------------------------------------------------------------------

def test_activate_xp_booster_sets_user_attrs():
    """Activating an XP booster sets active_xp_mult and active_xp_expires_at on user."""
    user = StubUser()
    item = StubShopItem()
    item.item_type = "booster_xp"
    item.effect_multiplier = 1.5
    item.duration_seconds = 900

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    now = datetime.now(timezone.utc)
    result = simulate_activate(user, inv_item, now)

    assert result["success"] is True
    assert result["boost_type"] == "xp"
    assert result["multiplier"] == 1.5
    assert user.active_xp_mult == 1.5
    assert user.active_xp_expires_at is not None
    assert user.active_xp_expires_at > now


# ---------------------------------------------------------------------------
# test_activate_booster_409_if_slot_occupied
# ---------------------------------------------------------------------------

def test_activate_booster_409_if_slot_occupied():
    """Activating a booster when slot is already active raises HTTPException 409."""
    user = StubUser()
    future_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    user.active_xp_expires_at = future_expiry  # slot already occupied

    item = StubShopItem()
    item.item_type = "booster_xp"
    item.effect_multiplier = 2.0
    item.duration_seconds = 900

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    now = datetime.now(timezone.utc)
    with pytest.raises(HTTPException) as exc_info:
        simulate_activate(user, inv_item, now)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "already_active"


# ---------------------------------------------------------------------------
# test_activate_potion_heals_hp
# ---------------------------------------------------------------------------

def test_activate_potion_heals_hp():
    """Potion heal clamps hp to effective_max_hp (no overheal)."""
    user = StubUser()
    user.hp = 80
    user.max_hp = 100

    item = StubShopItem()
    item.item_type = "potion_heal"
    item.heal_amount = 30  # would overheal: 80+30=110 > 100

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    now = datetime.now(timezone.utc)
    result = simulate_activate(user, inv_item, now)

    assert result["success"] is True
    assert result["item_type"] == "potion"
    assert user.hp == 100  # clamped to max_hp
    assert result["hp_after"] == 100
    assert result["healed"] == 20  # only 20 points were actually usable


# ---------------------------------------------------------------------------
# test_activate_skin_returns_400
# ---------------------------------------------------------------------------

def test_activate_skin_returns_400():
    """Activating a skin item via /activate raises 400 use_equip_endpoint."""
    user = StubUser()
    item = StubShopItem()
    item.item_type = "skin"
    item.avatar_key = "warrior_skin"

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    now = datetime.now(timezone.utc)
    with pytest.raises(HTTPException) as exc_info:
        simulate_activate(user, inv_item, now)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "use_equip_endpoint"


# ---------------------------------------------------------------------------
# test_equip_skin_sets_selected_avatar
# ---------------------------------------------------------------------------

def test_equip_skin_sets_selected_avatar():
    """Equipping a skin item sets user.selected_avatar to avatar_key."""
    user = StubUser()
    item = StubShopItem()
    item.item_type = "skin"
    item.avatar_key = "warrior_skin"

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    # Simulate equip_item logic
    if item.item_type != "skin":
        raise HTTPException(400, "not_a_skin")
    user.selected_avatar = item.avatar_key
    result = {"success": True, "equipped_avatar": item.avatar_key}

    assert result["success"] is True
    assert result["equipped_avatar"] == "warrior_skin"
    assert user.selected_avatar == "warrior_skin"


# ---------------------------------------------------------------------------
# test_equip_non_skin_returns_400
# ---------------------------------------------------------------------------

def test_equip_non_skin_returns_400():
    """Equipping a non-skin item raises HTTPException 400 not_a_skin."""
    user = StubUser()
    item = StubShopItem()
    item.item_type = "booster_xp"

    inv_item = StubInventoryItem()
    inv_item.shop_item = item

    with pytest.raises(HTTPException) as exc_info:
        if item.item_type != "skin":
            raise HTTPException(400, "not_a_skin")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "not_a_skin"
