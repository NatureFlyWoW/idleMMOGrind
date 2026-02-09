import numpy as np
from src.generators.backgrounds import generate_background


class TestBackgroundGenerator:
    def test_output_shape(self):
        bg = generate_background("starting_regions", 100, 100, seed=42)
        assert bg.shape == (100, 100, 4)

    def test_deterministic(self):
        bg1 = generate_background("mistmoors", 50, 50, seed=42)
        bg2 = generate_background("mistmoors", 50, 50, seed=42)
        np.testing.assert_array_equal(bg1, bg2)

    def test_different_zones_differ(self):
        bg1 = generate_background("starting_regions", 50, 50, seed=42)
        bg2 = generate_background("blighted_wastes", 50, 50, seed=42)
        assert not np.array_equal(bg1, bg2)

    def test_different_seeds_differ(self):
        bg1 = generate_background("mistmoors", 50, 50, seed=42)
        bg2 = generate_background("mistmoors", 50, 50, seed=99)
        assert not np.array_equal(bg1, bg2)

    def test_all_opaque(self):
        bg = generate_background("skyreach", 50, 50, seed=42)
        assert np.all(bg[:, :, 3] == 255)

    def test_unknown_zone_fallback(self):
        bg = generate_background("nonexistent_zone", 50, 50, seed=42)
        assert bg.shape == (50, 50, 4)
