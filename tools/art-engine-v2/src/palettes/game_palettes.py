"""Extended game palette definitions — class colors, bar colors, boss palettes, quality glow params."""
from __future__ import annotations


# 9 playable classes with their thematic colors (from art-style-guide.md section 6.4)
CLASS_COLORS: dict[str, dict[str, str]] = {
    "blademaster": {"name": "Steel Red", "hex": "#CC3333"},
    "sentinel": {"name": "Holy Gold", "hex": "#FFCC44"},
    "stalker": {"name": "Forest Green", "hex": "#44AA44"},
    "shadow": {"name": "Deep Purple", "hex": "#7733AA"},
    "cleric": {"name": "Silver White", "hex": "#CCCCDD"},
    "arcanist": {"name": "Arcane Blue", "hex": "#3366CC"},
    "summoner": {"name": "Fel Green", "hex": "#44CC44"},
    "channeler": {"name": "Storm Cyan", "hex": "#33AACC"},
    "shapeshifter": {"name": "Amber", "hex": "#CC8833"},
}

# Resource/progress bar colors (from art-style-guide.md section 3.4)
BAR_COLORS: dict[str, dict[str, str]] = {
    "health": {"fill": "#CC2222", "bg": "#3A0A0A", "border": "#661111"},
    "mana": {"fill": "#2255CC", "bg": "#0A0A3A", "border": "#112266"},
    "energy": {"fill": "#CCCC22", "bg": "#3A3A0A", "border": "#666611"},
    "rage": {"fill": "#CC2222", "bg": "#3A0A0A", "border": "#661111"},
    "xp": {"fill": "#8844CC", "bg": "#1A0A2A", "border": "#442266"},
    "reputation": {"fill": "#22AA44", "bg": "#0A2A12", "border": "#115522"},
    "profession": {"fill": "#CC8822", "bg": "#2A1A0A", "border": "#664411"},
    "cast": {"fill": "#CCCC22", "bg": "#3A3A0A", "border": "#666611"},
}

# Boss color palettes by dungeon (from art-style-guide.md section 2.3)
BOSS_PALETTES: dict[str, dict[str, str]] = {
    "emberforge_depths": {"primary": "#CC4422", "secondary": "#FF8844", "accent": "#FFD700"},
    "shadowspire_citadel": {"primary": "#4466CC", "secondary": "#8844CC", "accent": "#C0C0C0"},
    "temple_of_forsaken": {"primary": "#22AA66", "secondary": "#44CCAA", "accent": "#DDDDCC"},
    "eternal_crypt": {"primary": "#6622AA", "secondary": "#222222", "accent": "#CCCC44"},
}

# Quality glow rendering parameters (from art-style-guide.md section 3.1)
QUALITY_GLOW_PARAMS: dict[str, dict[str, int | float | str | None]] = {
    "common": {"radius": 0, "intensity": 0.0, "color": None},
    "uncommon": {"radius": 1, "intensity": 0.2, "color": "#1EFF00"},
    "rare": {"radius": 1, "intensity": 0.4, "color": "#0070DD"},
    "epic": {"radius": 2, "intensity": 0.6, "color": "#A335EE"},
    "legendary": {"radius": 2, "intensity": 0.9, "color": "#FF8000"},
}

# Talent tree specialization colors (from art-style-guide.md section 9)
SPEC_COLORS: dict[str, dict[str, str]] = {
    "holy_light": {"primary": "#FFD700", "secondary": "#FFFFFF", "bg": "#332200"},
    "physical_war": {"primary": "#AAAAAA", "secondary": "#CC2222", "bg": "#221111"},
    "fire": {"primary": "#FF4400", "secondary": "#FFAA00", "bg": "#331100"},
    "frost": {"primary": "#44AAFF", "secondary": "#FFFFFF", "bg": "#112233"},
    "shadow_magic": {"primary": "#7733AA", "secondary": "#CC44CC", "bg": "#220033"},
    "nature": {"primary": "#44CC44", "secondary": "#88FF88", "bg": "#113311"},
    "arcane": {"primary": "#3366CC", "secondary": "#88AAFF", "bg": "#111133"},
}

# Buff/debuff border colors (from art-style-guide.md section 6.5)
BUFF_BORDER_COLORS: dict[str, str] = {
    "beneficial": "#2255CC",
    "harmful": "#CC2222",
    "neutral": "#A89878",
}

# Currency icon colors (from art-style-guide.md section 6.6)
CURRENCY_COLORS: dict[str, str] = {
    "gold": "#FFD700",
    "silver": "#C0C0C0",
    "justice_points": "#0070DD",
    "valor_points": "#CC2222",
}

# Talent node states (from art-style-guide.md section 9.5)
TALENT_NODE_STATES: dict[str, dict[str, str | None]] = {
    "locked": {"border": "#3D3529", "icon_tint": "#5A5040", "bg": "#0D0D12"},
    "available": {"border": "#8B7340", "icon_tint": "#A89878", "bg": "#1A1A1F"},
    "partial": {"border": "#C9A84C", "icon_tint": None, "bg": "#1A1A1F"},
    "maxed": {"border": "#FFD700", "icon_tint": None, "bg": "#2A2520"},
    "capstone": {"border": "#FFD700", "icon_tint": None, "bg": "#2A2520"},
}
