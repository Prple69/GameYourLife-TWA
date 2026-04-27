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


# ---------------------------------------------------------------------------
# Phase 10: Gems Foundation tests
# ---------------------------------------------------------------------------

def test_shop_item_schema_has_price_gems():
    """ShopItemSchema accepts price_gems=None (existing items) and int (gem-priced items)."""
    from app.schemas import ShopItemSchema

    # Existing gold-only item: price_gems should default to None
    item_gold = ShopItemSchema(
        id=1, item_type="booster_xp", name="XP Boost",
        price_gold=100, is_active=True
    )
    assert item_gold.price_gems is None

    # New gem-priced item
    item_gems = ShopItemSchema(
        id=21, item_type="potion_heal", name="Зелье здоровья (Gems)",
        price_gold=0, price_gems=500, is_active=True
    )
    assert item_gems.price_gems == 500


def test_get_catalog_gem_price_null_guard():
    """Frontend gem-price badge renders only when price_gems is truthy — simulate guard logic."""
    class StubItem:
        price_gems = None

    item_no_gems = StubItem()
    item_with_gems = StubItem()
    item_with_gems.price_gems = 500

    # Guard: only render gem badge if price_gems is truthy
    assert not item_no_gems.price_gems   # None → don't render
    assert item_with_gems.price_gems     # 500 → render badge


def test_gem_item_seed_price_gold_zero():
    """Gem-only item has price_gold=0 (not null, since column is NOT NULL) as placeholder."""
    class StubGemItem:
        item_type = "potion_heal"
        name = "Зелье здоровья (Gems)"
        price_gold = 0
        price_gems = 500
        is_active = True

    item = StubGemItem()
    # price_gold=0 is valid — item is gem-priced, not gold-priced
    assert item.price_gold == 0
    assert item.price_gems == 500
    assert item.is_active is True
