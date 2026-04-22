"""Shared test fixtures and stub classes for Phase 5 shop/inventory tests."""


class StubRedis:
    """In-memory Redis mock for unit tests — no docker required."""
    def __init__(self):
        self._store: dict = {}
        self._ttls: dict = {}
        self._zsets: dict[str, dict[str, float]] = {}

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

    # --- Sorted set operations (Phase 7: Leaderboard) ---

    async def zadd(self, key: str, mapping: dict) -> int:
        """Add members with scores to sorted set. Returns number of new members added."""
        zset = self._zsets.setdefault(key, {})
        added = 0
        for member, score in mapping.items():
            if member not in zset:
                added += 1
            zset[member] = float(score)
        return added

    async def zrevrange(self, key: str, start: int, stop: int) -> list:
        """Return members sorted by score DESC, sliced [start:stop+1]. stop=-1 means to end."""
        zset = self._zsets.get(key, {})
        sorted_members = sorted(zset.keys(), key=lambda m: zset[m], reverse=True)
        if stop == -1:
            return sorted_members[start:]
        return sorted_members[start:stop + 1]

    async def zrevrank(self, key: str, member: str):
        """Return 0-based rank of member in DESC-sorted set, or None if not found."""
        zset = self._zsets.get(key, {})
        sorted_members = sorted(zset.keys(), key=lambda m: zset[m], reverse=True)
        try:
            return sorted_members.index(member)
        except ValueError:
            return None

    async def zcard(self, key: str) -> int:
        """Return count of members in sorted set."""
        return len(self._zsets.get(key, {}))

    async def exists(self, key: str) -> int:
        """Return 1 if key has members in sorted set, 0 otherwise."""
        zset = self._zsets.get(key)
        if zset:
            return 1
        return 0


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
