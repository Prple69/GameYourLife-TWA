from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserSchema(BaseModel):
    id: int
    telegram_id: str
    username: Optional[str]
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