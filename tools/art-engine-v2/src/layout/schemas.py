"""Type definitions for layout and item data."""
from __future__ import annotations
from typing import TypedDict


class ItemData(TypedDict, total=False):
    name: str
    quality: str          # common, uncommon, rare, epic, legendary
    slot: str             # e.g., "Two-Hand", "Head", "Chest"
    bind: str             # e.g., "Binds when equipped"
    item_level: int
    primary_stats: list[str]    # e.g., ["+15 Intellect", "+10 Stamina"]
    secondary_stats: list[str]  # e.g., ["Equip: Increases spell power by 22"]
    effects: list[dict]         # [{name: str, description: str}]
    set_bonuses: list[dict]     # [{pieces: int, bonus: str, active: bool}]
    flavor_text: str
    icon_path: str | None
    source: str                 # e.g., "Drops from: Ignis the Flamewarden"
