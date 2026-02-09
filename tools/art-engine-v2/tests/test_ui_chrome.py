import numpy as np
from src.generators.ui_chrome import (
    render_nine_slice,
    render_panel_frame,
    render_button,
    render_progress_bar,
)


class TestNineSlice:
    def test_output_size(self):
        source = np.full((12, 12, 4), [100, 100, 100, 255], dtype=np.uint8)
        result = render_nine_slice(source, 100, 60, border=4)
        assert result.shape == (60, 100, 4)

    def test_corners_preserved(self):
        source = np.zeros((12, 12, 4), dtype=np.uint8)
        source[:4, :4] = [255, 0, 0, 255]
        result = render_nine_slice(source, 50, 50, border=4)
        assert tuple(result[0, 0, :3]) == (255, 0, 0)

    def test_larger_than_source(self):
        source = np.full((10, 10, 4), [50, 50, 50, 255], dtype=np.uint8)
        result = render_nine_slice(source, 200, 200, border=3)
        assert result.shape == (200, 200, 4)


class TestPanelFrame:
    def test_renders_at_size(self):
        frame = render_panel_frame(200, 100)
        assert frame.shape == (100, 200, 4)

    def test_has_border_pixels(self):
        frame = render_panel_frame(50, 50)
        assert frame[0, 10, 3] > 0

    def test_has_content_area(self):
        frame = render_panel_frame(100, 100)
        # Center should be panel background color (#1A1A1F)
        center = frame[50, 50, :3]
        assert center[0] == 0x1A
        assert center[2] == 0x1F


class TestButton:
    def test_renders(self):
        btn = render_button(120, 40)
        assert btn.shape == (40, 120, 4)

    def test_with_label(self):
        btn = render_button(120, 40, label="Click")
        assert btn.shape == (40, 120, 4)
        assert np.any(btn[:, :, 3] > 0)

    def test_small_button(self):
        btn = render_button(30, 20)
        assert btn.shape == (20, 30, 4)


class TestProgressBar:
    def test_full_bar(self):
        bar = render_progress_bar(200, 20, progress=1.0, bar_type="health")
        assert bar.shape == (20, 200, 4)

    def test_half_bar(self):
        bar = render_progress_bar(200, 20, progress=0.5, bar_type="xp")
        assert bar.shape == (20, 200, 4)

    def test_empty_bar(self):
        bar = render_progress_bar(200, 20, progress=0.0, bar_type="mana")
        assert bar.shape == (20, 200, 4)

    def test_all_bar_types(self):
        for bar_type in ["health", "mana", "energy", "rage", "xp", "reputation", "profession", "cast"]:
            bar = render_progress_bar(100, 16, progress=0.75, bar_type=bar_type)
            assert bar.shape == (16, 100, 4)
