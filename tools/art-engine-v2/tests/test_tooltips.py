import json
import numpy as np
from pathlib import Path
from src.generators.tooltips import render_tooltip, render_tooltip_from_file


SAMPLE_ITEM = {
    "name": "Staff of Starfire",
    "quality": "epic",
    "slot": "Two-Hand",
    "bind": "Binds when equipped",
    "item_level": 42,
    "primary_stats": ["+15 Intellect", "+10 Stamina"],
    "secondary_stats": ["Equip: Increases spell power by 22"],
    "effects": [],
    "set_bonuses": [],
    "flavor_text": "Forged in the heart of a dying star.",
    "icon_path": None,
    "source": "Drops from: Ignis the Flamewarden",
}

MINIMAL_ITEM = {
    "name": "Rusty Sword",
    "quality": "common",
}


class TestRenderTooltip:
    def test_returns_rgba(self):
        img = render_tooltip(SAMPLE_ITEM)
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4

    def test_has_expected_width(self):
        img = render_tooltip(SAMPLE_ITEM)
        # Width = 320 + 2 * frame border (5) = 330
        assert img.shape[1] == 330

    def test_height_varies_with_content(self):
        short_img = render_tooltip(MINIMAL_ITEM)
        long_img = render_tooltip(SAMPLE_ITEM)
        assert long_img.shape[0] > short_img.shape[0]

    def test_has_visible_content(self):
        img = render_tooltip(SAMPLE_ITEM)
        assert np.any(img[:, :, 3] > 0)

    def test_different_qualities(self):
        common = render_tooltip({**SAMPLE_ITEM, "quality": "common"})
        legendary = render_tooltip({**SAMPLE_ITEM, "quality": "legendary"})
        # Should produce different images (different name color)
        assert not np.array_equal(common, legendary)

    def test_with_effects(self):
        item = {
            **SAMPLE_ITEM,
            "effects": [{"name": "Starfire Proc", "description": "Chance to deal 50 fire damage"}],
        }
        img = render_tooltip(item)
        assert isinstance(img, np.ndarray)

    def test_with_set_bonuses(self):
        item = {
            **SAMPLE_ITEM,
            "set_bonuses": [
                {"pieces": 2, "bonus": "+10 Spell Power", "active": True},
                {"pieces": 4, "bonus": "+5% Crit", "active": False},
            ],
        }
        img = render_tooltip(item)
        assert img.shape[0] > render_tooltip(SAMPLE_ITEM).shape[0]

    def test_minimal_item(self):
        img = render_tooltip(MINIMAL_ITEM)
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4


class TestRenderFromFile:
    def test_from_json(self, tmp_path):
        item_path = tmp_path / "item.json"
        item_path.write_text(json.dumps(SAMPLE_ITEM))
        img = render_tooltip_from_file(item_path)
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4
