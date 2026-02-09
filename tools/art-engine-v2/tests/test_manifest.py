"""Comprehensive tests for manifest-based generation pipeline."""
import json
import numpy as np
from pathlib import Path
from click.testing import CliRunner
from PIL import Image
from src.cli.__main__ import cli


def _make_manifest_setup(tmp_path):
    """Create template + manifest for testing."""
    tpl_dir = tmp_path / "templates"
    tpl_dir.mkdir(parents=True)
    img = np.zeros((48, 48, 4), dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]  # iron-colored center
    Image.fromarray(img).save(tpl_dir / "dagger.png")
    meta = {
        "name": "dagger",
        "type": "weapon",
        "regions": [
            {
                "label": "blade",
                "dominant_color": [140, 140, 150],
                "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)],
            }
        ],
    }
    (tpl_dir / "dagger.json").write_text(json.dumps(meta))
    return tpl_dir


class TestManifestPipeline:
    """Test the manifest-based generation system."""

    def test_manifest_generates_all(self, tmp_path):
        """Verify manifest generates correct number of icons (materials × qualities × seeds)."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron", "gold"],
            "qualities": ["common", "epic"],
            "seeds": [100, 101],
            "output_dir": str(tmp_path / "output" / "icons"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code == 0, result.output
        assert "Manifest: generating" in result.output
        assert "Generated 8 icons" in result.output

        output_dir = tmp_path / "output" / "icons"
        pngs = list(output_dir.glob("*.png"))
        assert len(pngs) == 8  # 2 materials × 2 qualities × 2 seeds

        # Verify filenames follow pattern: weapon-dagger-{material}-{quality}-{seed}.png
        filenames = {p.name for p in pngs}
        assert "weapon-dagger-iron-common-100.png" in filenames
        assert "weapon-dagger-gold-epic-101.png" in filenames

    def test_manifest_missing_file(self, tmp_path):
        """Verify error when manifest file doesn't exist."""
        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(tmp_path / "nonexistent.json"),
                "--template-dir",
                str(tmp_path),
            ],
        )

        assert result.exit_code != 0

    def test_manifest_unknown_type(self, tmp_path):
        """Verify error on unknown manifest type."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "unknown",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["common"],
            "seeds": [100],
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code != 0
        assert "Unknown manifest type: unknown" in result.output

    def test_manifest_output_dir_created(self, tmp_path):
        """Verify output directory is auto-created if it doesn't exist."""
        tpl_dir = _make_manifest_setup(tmp_path)
        output_dir = tmp_path / "deeply" / "nested" / "output"
        assert not output_dir.exists()

        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["common"],
            "seeds": [100],
            "output_dir": str(output_dir),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code == 0, result.output
        assert output_dir.exists()
        assert len(list(output_dir.glob("*.png"))) == 1

    def test_manifest_deterministic(self, tmp_path):
        """Verify running same manifest twice produces identical outputs."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["rare"],
            "seeds": [42],
            "output_dir": str(tmp_path / "output1"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()

        # First run
        result1 = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )
        assert result1.exit_code == 0, result1.output

        # Second run with different output dir
        manifest["output_dir"] = str(tmp_path / "output2")
        manifest_path.write_text(json.dumps(manifest))

        result2 = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )
        assert result2.exit_code == 0, result2.output

        # Compare outputs
        img1_path = list((tmp_path / "output1").glob("*.png"))[0]
        img2_path = list((tmp_path / "output2").glob("*.png"))[0]

        img1 = np.array(Image.open(img1_path))
        img2 = np.array(Image.open(img2_path))

        assert np.array_equal(img1, img2), "Outputs should be deterministic"

    def test_manifest_multiple_materials(self, tmp_path):
        """Test manifest with extended material list."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron", "steel", "gold", "darksteel"],
            "qualities": ["common"],
            "seeds": [100],
            "output_dir": str(tmp_path / "output"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 4  # 4 materials × 1 quality × 1 seed

    def test_manifest_multiple_qualities(self, tmp_path):
        """Test manifest with all quality tiers."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["common", "uncommon", "rare", "epic", "legendary"],
            "seeds": [100],
            "output_dir": str(tmp_path / "output"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 5  # 1 material × 5 qualities × 1 seed

        # Verify all quality tiers present in filenames
        filenames = {p.name for p in pngs}
        for quality in ["common", "uncommon", "rare", "epic", "legendary"]:
            assert any(quality in f for f in filenames)

    def test_manifest_multiple_seeds(self, tmp_path):
        """Test manifest with multiple seeds for variation."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["common"],
            "seeds": [100, 101, 102, 103, 104],
            "output_dir": str(tmp_path / "output"),
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        result = runner.invoke(
            cli,
            [
                "generate",
                "manifest",
                "--manifest",
                str(manifest_path),
                "--template-dir",
                str(tpl_dir),
            ],
        )

        assert result.exit_code == 0, result.output
        pngs = list((tmp_path / "output").glob("*.png"))
        assert len(pngs) == 5  # 1 material × 1 quality × 5 seeds

        # Verify seeds in filenames
        filenames = {p.name for p in pngs}
        for seed in [100, 101, 102, 103, 104]:
            assert any(f"-{seed:03d}.png" in f for f in filenames)

    def test_manifest_default_output_dir(self, tmp_path):
        """Verify default output directory is used when not specified."""
        tpl_dir = _make_manifest_setup(tmp_path)
        manifest = {
            "type": "icons",
            "template": "dagger",
            "materials": ["iron"],
            "qualities": ["common"],
            "seeds": [100],
            # No output_dir specified
        }
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest))

        runner = CliRunner()
        # Use isolated filesystem to avoid polluting real output
        with runner.isolated_filesystem(temp_dir=tmp_path) as td:
            isolated = Path(td)
            iso_tpl = isolated / "templates"
            iso_tpl.mkdir()
            # Copy template files
            for f in tpl_dir.glob("*"):
                (iso_tpl / f.name).write_bytes(f.read_bytes())

            iso_manifest = isolated / "manifest.json"
            iso_manifest.write_text(json.dumps(manifest))

            result = runner.invoke(
                cli,
                [
                    "generate",
                    "manifest",
                    "--manifest",
                    str(iso_manifest),
                    "--template-dir",
                    str(iso_tpl),
                ],
            )

            assert result.exit_code == 0, result.output
            # Should use default "output/icons"
            default_output = isolated / "output" / "icons"
            assert default_output.exists()
            assert len(list(default_output.glob("*.png"))) == 1
