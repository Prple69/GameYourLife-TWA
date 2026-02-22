# quests.py
from sqlalchemy.orm import Session
from . import models, game_logic

REWARDS = {
    "easy": {"xp": 20, "gold": 10},
    "medium": {"xp": 50, "gold": 25},
    "hard": {"xp": 120, "gold": 60},
    "epic": {"xp": 300, "gold": 150},
}

def complete_quest_logic(db: Session, user_id: int, difficulty: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    reward_base = REWARDS.get(difficulty, REWARDS["easy"])

    # Считаем с множителями
    final = game_logic.calculate_reward(
        reward_base["xp"], reward_base["gold"], 
        user.xp_multiplier, user.gold_multiplier
    )

    user.gold += final["gold"]
    user.xp += final["xp"]

    # Проверка уровня
    lv_up, n_xp, n_lvl, n_max = game_logic.check_level_up(user.xp, user.max_xp, user.lvl)
    
    if lv_up:
        user.xp = n_xp
        user.lvl = n_lvl
        user.max_xp = n_max

    db.commit()
    db.refresh(user)
    return user, final