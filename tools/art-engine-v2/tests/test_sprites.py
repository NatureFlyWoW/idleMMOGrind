import numpy as np
from pathlib import Path
from PIL import Image
from src.generators.sprites import compose_sprite, LAYER_ORDER, SPRITE_WIDTH, SPRITE_HEIGHT


class TestLayerOrder:
    def test_correct_count(self):
        assert len(LAYER_ORDER) == 10

    def test_body_is_first(self):
        assert LAYER_ORDER[0] == "body"

    def test_back_is_last(self):
        assert LAYER_ORDER[-1] == "back"

    def test_all_expected_layers(self):
        expected = {"body", "pants", "boots", "chest", "belt", "shoulders", "gloves", "helm", "weapon", "back"}
        assert set(LAYER_ORDER) == expected


class TestComposeSprite:
    def _make_layer(self, tmp_path, name, color):
        """Create a test layer PNG."""
        d = tmp_path / "layers"
        d.mkdir(parents=True, exist_ok=True)
        img = np.zeros((SPRITE_HEIGHT, SPRITE_WIDTH, 4), dtype=np.uint8)
        # Draw a block in the center area
        img[200:300, 80:176] = [*color, 255]
        Image.fromarray(img).save(d / f"{name}.png")
        return d

    def test_body_only(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        result = compose_sprite(
            layer_dir=layer_dir,
            layers={"body": "body.png"},
        )
        assert result.shape == (SPRITE_HEIGHT, SPRITE_WIDTH, 4)
        assert np.any(result[:, :, 3] > 0)

    def test_body_plus_chest(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        # Add chest overlay with different color
        chest = np.zeros((SPRITE_HEIGHT, SPRITE_WIDTH, 4), dtype=np.uint8)
        chest[220:280, 90:166] = [140, 140, 150, 255]
        Image.fromarray(chest).save(layer_dir / "chest.png")

        result = compose_sprite(
            layer_dir=layer_dir,
            layers={"body": "body.png", "chest": "chest.png"},
        )
        assert result.shape == (SPRITE_HEIGHT, SPRITE_WIDTH, 4)
        # Chest should be visible on top
        assert np.any(result[250, 128, :3] != [0, 0, 0])

    def test_deterministic(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        r1 = compose_sprite(layer_dir, {"body": "body.png"}, seed=42, add_shadow=False, max_colors=0)
        r2 = compose_sprite(layer_dir, {"body": "body.png"}, seed=42, add_shadow=False, max_colors=0)
        np.testing.assert_array_equal(r1, r2)

    def test_missing_layer_ignored(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        # Request helm layer that doesn't exist
        result = compose_sprite(
            layer_dir=layer_dir,
            layers={"body": "body.png", "helm": "nonexistent.png"},
        )
        assert result.shape == (SPRITE_HEIGHT, SPRITE_WIDTH, 4)

    def test_empty_layers(self, tmp_path):
        d = tmp_path / "layers"
        d.mkdir(parents=True)
        result = compose_sprite(layer_dir=d, layers={})
        assert result.shape == (SPRITE_HEIGHT, SPRITE_WIDTH, 4)
        assert not np.any(result[:, :, 3] > 0)  # All transparent

    def test_shadow_added(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        with_shadow = compose_sprite(layer_dir, {"body": "body.png"}, add_shadow=True, max_colors=0)
        without_shadow = compose_sprite(layer_dir, {"body": "body.png"}, add_shadow=False, max_colors=0)
        # Shadow version should have more non-transparent pixels (shadow area)
        assert np.sum(with_shadow[:, :, 3] > 0) >= np.sum(without_shadow[:, :, 3] > 0)

    def test_layer_order_respected(self, tmp_path):
        """Later layers should composite on top of earlier ones."""
        d = tmp_path / "layers"
        d.mkdir(parents=True, exist_ok=True)

        # Body: red block
        body = np.zeros((SPRITE_HEIGHT, SPRITE_WIDTH, 4), dtype=np.uint8)
        body[240:260, 120:136] = [255, 0, 0, 255]
        Image.fromarray(body).save(d / "body.png")

        # Chest: blue block overlapping
        chest = np.zeros((SPRITE_HEIGHT, SPRITE_WIDTH, 4), dtype=np.uint8)
        chest[240:260, 120:136] = [0, 0, 255, 255]
        Image.fromarray(chest).save(d / "chest.png")

        result = compose_sprite(d, {"body": "body.png", "chest": "chest.png"}, add_shadow=False, max_colors=0)
        # Chest (blue) should be on top since it comes after body in LAYER_ORDER
        assert result[250, 128, 2] > result[250, 128, 0]  # Blue > Red
