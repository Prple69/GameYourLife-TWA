"""Shared test fixtures and stub classes for Phase 5 shop/inventory tests."""


class StubShopItem:
    """Minimal in-memory shop item — no DB needed."""
    item_type = "booster_xp"
    name = "Test Boost"
    price_gold = 100
    effect_multiplier = 1.5
    duration_seconds = 900
    heal_amount = None
    hp_max_bonus = None
    avatar_key = None
    is_active = True


class StubInventoryItem:
    """Minimal in-memory inventory item — no DB needed."""
    quantity = 1
    # shop_item must be set per test (e.g. stub.shop_item = StubShopItem())
