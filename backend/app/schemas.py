from pydantic import BaseModel
from typing import List, Optional

class InventoryItemBase(BaseModel):
    item_slug: str

    class Config:
        from_attributes = True

class QuestBase(BaseModel):
    id: int
    title: str
    difficulty: str
    is_completed: bool

    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    id: int
    telegram_id: str
    username: str
    selected_avatar: str
    char_class: str
    lvl: int
    xp: int
    max_xp: int
    gold: int
    hp: int
    max_hp: int
    xp_multiplier: float
    gold_multiplier: float
    
    class Config:
        from_attributes = True