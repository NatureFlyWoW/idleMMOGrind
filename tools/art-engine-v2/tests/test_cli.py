import json
import numpy as np
from pathlib import Path
from click.testing import CliRunner
from PIL import Image
from src.cli.__main__ import cli


def _make_draft(tmp_path):
    """Create a synthetic draft PNG."""
    drafts_dir = tmp_path / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    img = np.full((48, 48, 4), [0x1A, 0x1A, 0x1F, 255], dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]
    img_path = drafts_dir / "test_item.png"
    Image.fromarray(img).save(img_path)
    return img_path


def _make_template(tmp_path):
    """Create a template with metadata for generate testing."""
    tpl_dir = tmp_path / "templates"
    tpl_dir.mkdir(parents=True, exist_ok=True)
    img = np.zeros((48, 48, 4), dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]
    Image.fromarray(img).save(tpl_dir / "sword.png")
    meta = {
        "name": "sword",
        "type": "weapon",
        "regions": [{"label": "blade", "dominant_color": [140, 140, 150],
                     "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)]}],
    }
    (tpl_dir / "sword.json").write_text(json.dumps(meta))
    return tpl_dir


class TestIngestCLI:
    def test_ingest_single(self, tmp_path):
        draft = _make_draft(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "ingest",
            "--input", str(draft),
            "--type", "weapon",
            "--name", "test_item",
            "--output", str(tmp_path / "templates"),
        ])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "templates" / "test_item.png").exists()
        assert (tmp_path / "templates" / "test_item.json").exists()
        assert "processed successfully" in result.output

    def test_ingest_custom_regions(self, tmp_path):
        draft = _make_draft(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "ingest",
            "--input", str(draft),
            "--type", "armor",
            "--name", "chest_piece",
            "--output", str(tmp_path / "templates"),
            "--regions", "2",
        ])
        assert result.exit_code == 0, result.output


class TestGenerateIconsCLI:
    def test_generate_single_icon(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "icons",
            "--template-dir", str(tpl_dir),
            "--template", "sword",
            "--materials", "iron",
            "--qualities", "rare",
            "--seeds", "42",
            "--output", str(tmp_path / "output"),
        ])
        assert result.exit_code == 0, result.output
        assert any((tmp_path / "output").iterdir())

    def test_generate_batch(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "icons",
            "--template-dir", str(tpl_dir),
            "--template", "sword",
            "--materials", "iron,gold",
            "--qualities", "common,epic",
            "--seeds", "100-101",
            "--output", str(tmp_path / "output"),
        ])
        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 8  # 2 materials × 2 qualities × 2 seeds

    def test_generate_seed_range(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "icons",
            "--template-dir", str(tpl_dir),
            "--template", "sword",
            "--materials", "iron",
            "--qualities", "common",
            "--seeds", "1-5",
            "--output", str(tmp_path / "output"),
        ])
        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 5


class TestManifestCLI:
    def test_manifest_generation(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        manifest = {
            "type": "icons",
            "template": "sword",
            "materials": ["iron", "gold"],
            "qualities": ["common", "rare"],
            "seeds": [100, 101],
            "output_dir": str(tmp_path / "output"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "manifest",
            "--manifest", str(manifest_path),
            "--template-dir", str(tpl_dir),
        ])
        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 8


class TestVersionFlag:
    def test_version(self):
        runner = CliRunner()
        result = runner.invoke(cli, ["--version"])
        assert "0.1.0" in result.output
