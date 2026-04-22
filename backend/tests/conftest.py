"""Shared test fixtures and stub classes for Phase 5 shop/inventory tests."""


class StubRedis:
    """In-memory Redis mock for unit tests — no docker required."""
    def __init__(self):
        self._store: dict = {}
        self._ttls: dict = {}

    async def get(self, key: str):
        return self._store.get(key)

    async def setex(self, key: str, ttl: int, value: str):
        self._store[key] = value
        self._ttls[key] = ttl

    async def delete(self, key: str):
        self._store.pop(key, None)

    async def incr(self, key: str) -> int:
        val = int(self._store.get(key) or 0) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key: str, ttl: int):
        self._ttls[key] = ttl


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
