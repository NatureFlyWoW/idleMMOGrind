import numpy as np
from src.layout.text import TextRenderer


class TestTextRenderer:
    def test_render_returns_rgba(self):
        renderer = TextRenderer()
        img = renderer.render_text("Hello", font_name="body", size=14, color="#FFFFFF")
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4

    def test_render_has_nonzero_alpha(self):
        renderer = TextRenderer()
        img = renderer.render_text("Test", font_name="body", size=14, color="#FF0000")
        assert np.any(img[:, :, 3] > 0)

    def test_measure_text_positive(self):
        renderer = TextRenderer()
        w, h = renderer.measure_text("Hello", font_name="body", size=14)
        assert w > 0
        assert h > 0

    def test_different_sizes(self):
        renderer = TextRenderer()
        w1, _ = renderer.measure_text("Test", font_name="body", size=12)
        w2, _ = renderer.measure_text("Test", font_name="body", size=24)
        assert w2 > w1

    def test_colored_text(self):
        renderer = TextRenderer()
        img = renderer.render_text("Red", font_name="body", size=16, color="#FF0000")
        # Find non-transparent pixels
        mask = img[:, :, 3] > 128
        if np.any(mask):
            coords = np.argwhere(mask)
            y, x = coords[0]
            # Red channel should be dominant
            assert img[y, x, 0] > img[y, x, 2]

    def test_empty_string(self):
        renderer = TextRenderer()
        img = renderer.render_text("", font_name="body", size=14, color="#FFFFFF")
        assert isinstance(img, np.ndarray)

    def test_stat_block_rendering(self):
        renderer = TextRenderer()
        stats = [
            ("+15 Strength", "#1EFF00"),
            ("+8 Stamina", "#1EFF00"),
            ("Item Level 42", "#FFD700"),
        ]
        img = renderer.render_stat_block(stats, font_name="body", size=14)
        assert isinstance(img, np.ndarray)
        assert img.shape[0] > 0

    def test_stat_block_taller_than_single(self):
        renderer = TextRenderer()
        single = renderer.render_text("Test", font_name="body", size=14, color="#FFFFFF")
        block = renderer.render_stat_block([
            ("Line 1", "#FFFFFF"),
            ("Line 2", "#FFFFFF"),
            ("Line 3", "#FFFFFF"),
        ], font_name="body", size=14)
        assert block.shape[0] > single.shape[0]

    def test_stat_block_empty(self):
        renderer = TextRenderer()
        img = renderer.render_stat_block([], font_name="body", size=14)
        assert isinstance(img, np.ndarray)

    def test_heading_font(self):
        renderer = TextRenderer()
        img = renderer.render_text("Title", font_name="heading", size=20, color="#E8D5B0")
        assert np.any(img[:, :, 3] > 0)

    def test_mono_font(self):
        renderer = TextRenderer()
        img = renderer.render_text("12345", font_name="mono", size=12, color="#FFFFFF")
        assert np.any(img[:, :, 3] > 0)
