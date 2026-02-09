import json
import numpy as np
from pathlib import Path
from PIL import Image
from src.layout.engine import LayoutEngine


class TestLayoutEngine:
    def test_simple_rect(self):
        layout = {
            "width": 200,
            "height": 100,
            "background": "#1A1A1F",
            "elements": [
                {"type": "rect", "x": 10, "y": 10, "width": 50, "height": 30, "color": "#FF0000"},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (100, 200, 4)
        # Red rect should be present
        assert result[20, 20, 0] > 200

    def test_text_element(self):
        layout = {
            "width": 200,
            "height": 50,
            "background": "#000000",
            "elements": [
                {"type": "text", "x": 10, "y": 10, "text": "Hello", "font": "body", "size": 14, "color": "#FFFFFF"},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (50, 200, 4)
        assert np.any(result[:, :, 3] > 0)

    def test_nested_panel(self):
        layout = {
            "width": 300,
            "height": 200,
            "background": "#1A1A1F",
            "elements": [
                {
                    "type": "panel",
                    "x": 10,
                    "y": 10,
                    "width": 280,
                    "height": 180,
                    "elements": [
                        {"type": "text", "x": 10, "y": 10, "text": "Nested", "font": "body", "size": 14, "color": "#E8D5B0"},
                    ],
                }
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (200, 300, 4)

    def test_image_element(self, tmp_path):
        test_img = np.full((32, 32, 4), [255, 0, 0, 255], dtype=np.uint8)
        img_path = tmp_path / "test.png"
        Image.fromarray(test_img).save(img_path)

        layout = {
            "width": 100,
            "height": 100,
            "background": "#000000",
            "elements": [
                {"type": "image", "x": 10, "y": 10, "path": str(img_path)},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert tuple(result[10, 10, :3]) == (255, 0, 0)

    def test_progress_bar_element(self):
        layout = {
            "width": 250,
            "height": 40,
            "background": "#1A1A1F",
            "elements": [
                {"type": "progress_bar", "x": 10, "y": 10, "width": 200, "height": 16, "progress": 0.7, "bar_type": "xp"},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (40, 250, 4)

    def test_separator_element(self):
        layout = {
            "width": 200,
            "height": 20,
            "background": "#1A1A1F",
            "elements": [
                {"type": "separator", "x": 10, "y": 10, "width": 180},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (20, 200, 4)

    def test_from_file(self, tmp_path):
        layout = {
            "width": 100,
            "height": 50,
            "background": "#1A1A1F",
            "elements": [
                {"type": "rect", "x": 5, "y": 5, "width": 20, "height": 20, "color": "#FF0000"},
            ],
        }
        layout_path = tmp_path / "layout.json"
        layout_path.write_text(json.dumps(layout))
        engine = LayoutEngine()
        result = engine.render_from_file(layout_path)
        assert result.shape == (50, 100, 4)

    def test_empty_layout(self):
        layout = {"width": 50, "height": 50, "elements": []}
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (50, 50, 4)


class TestComposeCLI:
    def test_compose_background(self, tmp_path):
        from click.testing import CliRunner

        # We need to get the cli — handle whether __main__ exists or not
        try:
            from src.cli.__main__ import cli
        except ImportError:
            import click
            from src.cli.compose import compose
            cli = click.Group()
            cli.add_command(compose)

        runner = CliRunner()
        result = runner.invoke(cli, [
            "compose", "background",
            "--zone", "mistmoors",
            "--width", "50",
            "--height", "50",
            "--seed", "42",
            "--output", str(tmp_path / "bg.png"),
        ])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "bg.png").exists()
