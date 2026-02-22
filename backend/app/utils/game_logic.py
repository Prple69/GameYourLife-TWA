# game_logic.py

def calculate_reward(base_xp: int, base_gold: int, xp_mult: float, gold_mult: float):
    """Считает награду с учетом множителей"""
    return {
        "xp": int(base_xp * xp_mult),
        "gold": int(base_gold * gold_mult)
    }

def check_level_up(current_xp: int, max_xp: int, current_lvl: int):
    """Логика повышения уровня"""
    leveled_up = False
    new_xp = current_xp
    new_lvl = current_lvl
    new_max_xp = max_xp

    while new_xp >= new_max_xp:
        new_xp -= new_max_xp
        new_lvl += 1
        new_max_xp = int(new_max_xp * 1.2) # +20% к сложности
        leveled_up = True
    
    return leveled_up, new_xp, new_lvl, new_max_xp