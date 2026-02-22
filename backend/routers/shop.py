# shop.py
from sqlalchemy.orm import Session
from . import models

def process_purchase(db: Session, user_id: int, item_slug: str, price: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user or user.gold < price:
        return None, "Недостаточно золота или юзер не найден"

    user.gold -= price

    # Эффекты предметов
    if item_slug == "clover":
        user.xp_multiplier = 1.5
    elif item_slug == "ancient_book":
        user.xp_multiplier += 0.2 # Книги стакаются
    elif item_slug == "phoenix_feather":
        user.hp = user.max_hp

    db.commit()
    db.refresh(user)
    return user, None