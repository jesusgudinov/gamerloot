def calculate_level(xp: float) -> int:
    """
    Calculates the user level based on their XP (total spent).
    Niveles 1-9: 0 - 999 MXN
    Niveles 10-19: 1,000 - 4,999 MXN
    Niveles 20-29: 5,000 - 14,999 MXN
    Niveles 30-39: 15,000 - 29,999 MXN
    Niveles 40-49: 30,000 - 49,999 MXN
    Nivel 50+: > 50,000 MXN
    """
    if xp < 1000:
        # 0 to 999 -> Level 1 to 9
        # Every 111 XP is a level
        return max(1, min(9, 1 + int(xp / 111)))
        
    elif xp < 5000:
        # 1000 to 4999 -> Level 10 to 19
        # Range of 4000 for 10 levels -> 400 XP per level
        return min(19, 10 + int((xp - 1000) / 400))
        
    elif xp < 15000:
        # 5000 to 14999 -> Level 20 to 29
        # Range of 10000 for 10 levels -> 1000 XP per level
        return min(29, 20 + int((xp - 5000) / 1000))
        
    elif xp < 30000:
        # 15000 to 29999 -> Level 30 to 39
        # Range of 15000 for 10 levels -> 1500 XP per level
        return min(39, 30 + int((xp - 15000) / 1500))
        
    elif xp < 50000:
        # 30000 to 49999 -> Level 40 to 49
        # Range of 20000 for 10 levels -> 2000 XP per level
        return min(49, 40 + int((xp - 30000) / 2000))
        
    else:
        # 50000+ -> Level 50+
        # Every 5000 XP is an extra level beyond 50
        return 50 + int((xp - 50000) / 5000)

def get_tier_name(level: int) -> str:
    if level < 10:
        return "Aventurero Novato"
    elif level < 20:
        return "Cazador de Loot"
    elif level < 30:
        return "Guerrero Élite"
    elif level < 40:
        return "Maestro del Setup"
    elif level < 50:
        return "Leyenda del Loot"
    else:
        return "Dios del Loot (Loot God)"
