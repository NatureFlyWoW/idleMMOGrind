import json
import numpy as np
from pathlib import Path
from PIL import Image
from src.generators.icons import generate_icon, generate_icon_batch


def _make_template(tmp_path):
    """Create a minimal template for testing."""
    tpl_dir = tmp_path / "templates"
    tpl_dir.mkdir(parents=True)
    img = np.zeros((48, 48, 4), dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]  # Iron-colored center
    Image.fromarray(img).save(tpl_dir / "test_sword.png")
    meta = {
        "name": "test_sword",
        "type": "weapon",
        "regions": [{
            "label": "blade",
            "dominant_color": [140, 140, 150],
            "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)],
        }],
    }
    (tpl_dir / "test_sword.json").write_text(json.dumps(meta))
    return tpl_dir


class TestGenerateIcon:
    def test_generates_png(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out_dir = tmp_path / "output"
        result = generate_icon(tpl_dir, "test_sword", "iron", "common", 42, out_dir)
        assert result.exists()
        assert result.suffix == ".png"

    def test_deterministic_output(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out1 = tmp_path / "out1"
        out2 = tmp_path / "out2"
        r1 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out1)
        r2 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out2)
        img1 = np.array(Image.open(r1))
        img2 = np.array(Image.open(r2))
        np.testing.assert_array_equal(img1, img2)

    def test_different_seeds_differ(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out1 = tmp_path / "out1"
        out2 = tmp_path / "out2"
        r1 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out1)
        r2 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 99, out2)
        img1 = np.array(Image.open(r1))
        img2 = np.array(Image.open(r2))
        assert not np.array_equal(img1, img2)

    def test_different_materials(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out1 = tmp_path / "out1"
        out2 = tmp_path / "out2"
        r1 = generate_icon(tpl_dir, "test_sword", "iron", "common", 42, out1)
        r2 = generate_icon(tpl_dir, "test_sword", "gold", "common", 42, out2)
        img1 = np.array(Image.open(r1))
        img2 = np.array(Image.open(r2))
        assert not np.array_equal(img1, img2)

    def test_quality_glow_applied(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out_c = tmp_path / "out_c"
        out_l = tmp_path / "out_l"
        rc = generate_icon(tpl_dir, "test_sword", "iron", "common", 42, out_c)
        rl = generate_icon(tpl_dir, "test_sword", "iron", "legendary", 42, out_l)
        ic = np.array(Image.open(rc))
        il = np.array(Image.open(rl))
        # Legendary should have more non-transparent pixels due to glow
        assert np.sum(il[:, :, 3] > 0) > np.sum(ic[:, :, 3] > 0)

    def test_output_filename_format(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out_dir = tmp_path / "output"
        result = generate_icon(tpl_dir, "test_sword", "gold", "epic", 42, out_dir)
        assert result.name == "weapon-test_sword-gold-epic-042.png"


class TestGenerateIconBatch:
    def test_batch_count(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out_dir = tmp_path / "output"
        results = generate_icon_batch(
            tpl_dir, "test_sword",
            materials=["iron", "gold"],
            qualities=["common", "rare"],
            seeds=[100, 101],
            output_dir=out_dir,
        )
        # 2 materials × 2 qualities × 2 seeds = 8
        assert len(results) == 8
        assert all(p.exists() for p in results)

    def test_batch_all_unique(self, tmp_path):
        tpl_dir = _make_template(tmp_path)
        out_dir = tmp_path / "output"
        results = generate_icon_batch(
            tpl_dir, "test_sword",
            materials=["iron", "gold"],
            qualities=["common", "epic"],
            seeds=[42, 43],
            output_dir=out_dir,
        )
        # All filenames should be unique
        names = [r.name for r in results]
        assert len(names) == len(set(names))
