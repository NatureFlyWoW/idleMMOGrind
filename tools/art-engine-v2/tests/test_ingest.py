import json

import numpy as np
from pathlib import Path
from PIL import Image

from src.ingest.background_remover import remove_background
from src.ingest.region_extractor import extract_regions
from src.ingest.template_processor import process_template


class TestBackgroundRemover:
    def test_dark_bg_removed(self):
        img = np.zeros((10, 10, 4), dtype=np.uint8)
        img[:, :] = [0x1A, 0x1A, 0x1F, 255]
        img[5, 5] = [255, 0, 0, 255]
        result = remove_background(img, threshold=30)
        assert result[0, 0, 3] == 0
        assert result[5, 5, 3] == 255

    def test_near_black_removed(self):
        img = np.zeros((5, 5, 4), dtype=np.uint8)
        img[:, :] = [20, 20, 25, 255]
        img[2, 2] = [200, 100, 50, 255]
        result = remove_background(img, threshold=30)
        assert result[0, 0, 3] == 0
        assert result[2, 2, 3] == 255

    def test_preserves_bright_pixels(self):
        img = np.full((5, 5, 4), [180, 50, 30, 255], dtype=np.uint8)
        result = remove_background(img, threshold=30)
        assert np.all(result[:, :, 3] == 255)

    def test_custom_bg_color(self):
        img = np.full((5, 5, 4), [100, 100, 100, 255], dtype=np.uint8)
        img[2, 2] = [255, 0, 0, 255]
        result = remove_background(img, bg_color=(100, 100, 100), threshold=5)
        assert result[0, 0, 3] == 0
        assert result[2, 2, 3] == 255


class TestRegionExtractor:
    def test_single_region(self):
        img = np.zeros((10, 10, 4), dtype=np.uint8)
        img[3:7, 3:7] = [180, 50, 30, 255]
        regions = extract_regions(img, num_regions=1)
        assert len(regions) == 1
        assert len(regions[0]["pixels"]) > 0
        assert "dominant_color" in regions[0]

    def test_two_regions(self):
        img = np.zeros((10, 20, 4), dtype=np.uint8)
        img[2:8, 2:8] = [180, 50, 30, 255]
        img[2:8, 12:18] = [30, 50, 180, 255]
        regions = extract_regions(img, num_regions=2)
        assert len(regions) == 2

    def test_empty_image(self):
        img = np.zeros((10, 10, 4), dtype=np.uint8)
        regions = extract_regions(img, num_regions=1)
        assert len(regions) == 0


class TestTemplateProcessor:
    def test_full_pipeline(self, tmp_path):
        img = np.full((48, 48, 4), [0x1A, 0x1A, 0x1F, 255], dtype=np.uint8)
        img[10:38, 10:38] = [140, 140, 150, 255]
        input_path = tmp_path / "test_weapon.png"
        Image.fromarray(img).save(input_path)

        output_dir = tmp_path / "templates"
        result = process_template(
            input_path=input_path,
            output_dir=output_dir,
            name="test_weapon",
            asset_type="weapon",
            num_regions=1,
            max_colors=128,
        )
        assert (output_dir / "test_weapon.png").exists()
        assert (output_dir / "test_weapon.json").exists()
        meta = json.loads((output_dir / "test_weapon.json").read_text())
        assert meta["name"] == "test_weapon"
        assert meta["type"] == "weapon"
        assert "regions" in meta

    def test_preserves_dimensions(self, tmp_path):
        img = np.full((64, 32, 4), [0x1A, 0x1A, 0x1F, 255], dtype=np.uint8)
        img[10:54, 5:27] = [100, 180, 220, 255]
        input_path = tmp_path / "crystal.png"
        Image.fromarray(img).save(input_path)
        output_dir = tmp_path / "out"
        result = process_template(input_path, output_dir, "crystal", "material", 1, 64)
        assert result["width"] == 32
        assert result["height"] == 64
