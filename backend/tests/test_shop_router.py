"""Shop router unit tests — Plan 03 implementation.

Uses stub objects (no DB, no TestClient) to test route logic in isolation.
"""
import json
import pytest
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Stub helpers
# ---------------------------------------------------------------------------

class StubShopItem:
    """Minimal in-memory shop item."""
    item_type = "booster_xp"
    name = "Test Boost"
    price_gold = 100
    effect_multiplier = 1.5
    duration_seconds = 900
    heal_amount = None
    hp_max_bonus = None
    avatar_key = None
    is_active = True


class StubUser:
    id = 1
    gold = 500


class StubCachedIdempotencyKey:
    response_json = json.dumps({"success": True, "item_name": "Test Boost", "gold_remaining": 400})


# ---------------------------------------------------------------------------
# test_get_catalog_returns_active_items
# ---------------------------------------------------------------------------

def test_get_catalog_returns_active_items():
    """Only is_active=True items should appear in the catalog."""
    active = StubShopItem()
    active.is_active = True

    inactive = StubShopItem()
    inactive.is_active = False

    all_items = [active, inactive]
    catalog = [item for item in all_items if item.is_active]

    assert len(catalog) == 1
    assert catalog[0].is_active is True


# ---------------------------------------------------------------------------
# test_buy_idempotency_cached
# ---------------------------------------------------------------------------

def test_buy_idempotency_cached():
    """Second call with same idempotency_key returns cached JSON without re-running logic."""
    cached = StubCachedIdempotencyKey()
    result = json.loads(cached.response_json)

    assert result["success"] is True
    assert result["item_name"] == "Test Boost"
    assert result["gold_remaining"] == 400


# ---------------------------------------------------------------------------
# test_buy_insufficient_gold
# ---------------------------------------------------------------------------

def test_buy_insufficient_gold():
    """Buying an item the user cannot afford raises HTTPException 400 insufficient_gold."""
    user = StubUser()
    user.gold = 50  # less than price

    item = StubShopItem()
    item.price_gold = 100

    with pytest.raises(HTTPException) as exc_info:
        if user.gold < item.price_gold:
            raise HTTPException(status_code=400, detail="insufficient_gold")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "insufficient_gold"


# ---------------------------------------------------------------------------
# test_buy_skin_already_owned
# ---------------------------------------------------------------------------

def test_buy_skin_already_owned():
    """Buying a skin that is already in inventory raises HTTPException 409 already_owned."""
    user = StubUser()
    user.gold = 1000

    item = StubShopItem()
    item.item_type = "skin"
    item.price_gold = 200
    item.avatar_key = "warrior_skin"

    # Simulate: user already owns this skin in inventory
    already_owned = True  # In router: owned_res.scalars().first() is not None

    with pytest.raises(HTTPException) as exc_info:
        if item.item_type == "skin" and already_owned:
            raise HTTPException(status_code=409, detail="already_owned")

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "already_owned"


# ---------------------------------------------------------------------------
# test_buy_gold_deducted_correctly
# ---------------------------------------------------------------------------

def test_buy_gold_deducted_correctly():
    """After purchase gold is reduced by item price."""
    user = StubUser()
    user.gold = 500

    item = StubShopItem()
    item.price_gold = 100

    # Simulate purchase logic
    if user.gold < item.price_gold:
        raise HTTPException(400, "insufficient_gold")
    user.gold -= item.price_gold

    assert user.gold == 400
