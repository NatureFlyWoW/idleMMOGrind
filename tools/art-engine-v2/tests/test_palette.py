"""Tests for palette color utilities and game color constants."""

import numpy as np
import pytest

from src.core.palette import (
    MATERIAL_RAMPS,
    QUALITY_COLORS,
    ZONE_PALETTES,
    UI_COLORS,
    hex_to_rgb,
    rgb_to_hex,
    generate_ramp,
    nearest_color,
    quantize_image,
)


class TestColorConversion:
    """Test hex/RGB conversion functions."""

    def test_hex_to_rgb_with_hash(self):
        """Convert hex string with leading hash."""
        assert hex_to_rgb("#FF8000") == (255, 128, 0)
        assert hex_to_rgb("#FFFFFF") == (255, 255, 255)
        assert hex_to_rgb("#000000") == (0, 0, 0)

    def test_hex_to_rgb_without_hash(self):
        """Convert hex string without leading hash."""
        assert hex_to_rgb("FF8000") == (255, 128, 0)
        assert hex_to_rgb("123456") == (18, 52, 86)

    def test_hex_to_rgb_lowercase(self):
        """Handle lowercase hex strings."""
        assert hex_to_rgb("#ff8000") == (255, 128, 0)
        assert hex_to_rgb("abcdef") == (171, 205, 239)

    def test_rgb_to_hex_formatting(self):
        """Convert RGB to uppercase hex with hash."""
        assert rgb_to_hex((255, 128, 0)) == "#FF8000"
        assert rgb_to_hex((0, 0, 0)) == "#000000"
        assert rgb_to_hex((255, 255, 255)) == "#FFFFFF"

    def test_rgb_to_hex_zero_padding(self):
        """Ensure single-digit values are zero-padded."""
        assert rgb_to_hex((1, 2, 3)) == "#010203"
        assert rgb_to_hex((15, 16, 17)) == "#0F1011"

    def test_roundtrip_conversion(self):
        """Verify hex -> RGB -> hex preserves color."""
        original = "#A335EE"
        rgb = hex_to_rgb(original)
        result = rgb_to_hex(rgb)
        assert result == original

    def test_roundtrip_rgb_to_hex_to_rgb(self):
        """Verify RGB -> hex -> RGB preserves color."""
        original = (212, 175, 55)
        hex_str = rgb_to_hex(original)
        result = hex_to_rgb(hex_str)
        assert result == original


class TestColorRamps:
    """Test color ramp generation."""

    def test_generate_ramp_length(self):
        """Ramp contains requested number of colors."""
        ramp = generate_ramp((128, 128, 128), 7)
        assert len(ramp) == 7

    def test_generate_ramp_odd_steps(self):
        """Generate ramp with odd number of steps."""
        ramp = generate_ramp((100, 100, 100), 5)
        assert len(ramp) == 5

    def test_generate_ramp_light_to_dark(self):
        """Ramp progresses from light to dark."""
        base = (128, 64, 32)
        ramp = generate_ramp(base, 7)

        # First color should be lighter than base
        assert sum(ramp[0]) > sum(base)

        # Last color should be darker than base
        assert sum(ramp[-1]) < sum(base)

        # Verify monotonic decrease in brightness
        for i in range(len(ramp) - 1):
            brightness_current = sum(ramp[i])
            brightness_next = sum(ramp[i + 1])
            assert brightness_current >= brightness_next

    def test_generate_ramp_base_in_middle(self):
        """Base color appears approximately in middle of ramp."""
        base = (150, 100, 50)
        ramp = generate_ramp(base, 7)
        center_idx = 3

        # Center should match base exactly
        assert ramp[center_idx] == base

    def test_generate_ramp_boundary_colors(self):
        """Ramp stays within valid RGB range."""
        base = (240, 200, 50)
        ramp = generate_ramp(base, 7)

        for color in ramp:
            for channel in color:
                assert 0 <= channel <= 255

    def test_generate_ramp_black_base(self):
        """Handle black as base color."""
        ramp = generate_ramp((0, 0, 0), 7)
        assert len(ramp) == 7
        assert ramp[3] == (0, 0, 0)
        assert sum(ramp[0]) > 0  # Lighter than black

    def test_generate_ramp_white_base(self):
        """Handle white as base color."""
        ramp = generate_ramp((255, 255, 255), 7)
        assert len(ramp) == 7
        assert ramp[3] == (255, 255, 255)
        assert sum(ramp[-1]) < 255 * 3  # Darker than white


class TestNearestColor:
    """Test nearest color matching."""

    def test_nearest_color_exact_match(self):
        """Find exact color in palette."""
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        assert nearest_color((255, 0, 0), palette) == 0
        assert nearest_color((0, 255, 0), palette) == 1
        assert nearest_color((0, 0, 255), palette) == 2

    def test_nearest_color_closest_match(self):
        """Find closest color when no exact match."""
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]

        # Close to red
        assert nearest_color((250, 10, 10), palette) == 0

        # Close to green
        assert nearest_color((10, 250, 10), palette) == 1

        # Close to blue
        assert nearest_color((10, 10, 250), palette) == 2

    def test_nearest_color_grayscale(self):
        """Match grayscale colors."""
        palette = [(0, 0, 0), (128, 128, 128), (255, 255, 255)]

        # Dark gray -> black
        assert nearest_color((50, 50, 50), palette) == 0

        # Mid gray -> gray
        assert nearest_color((120, 130, 125), palette) == 1

        # Light gray -> white
        assert nearest_color((200, 200, 200), palette) == 2

    def test_nearest_color_single_palette(self):
        """Handle palette with single color."""
        palette = [(128, 128, 128)]
        assert nearest_color((255, 255, 255), palette) == 0
        assert nearest_color((0, 0, 0), palette) == 0


class TestImageQuantization:
    """Test image quantization to palette."""

    def test_quantize_image_shape_preserved(self):
        """Output has same shape as input."""
        img = np.zeros((10, 20, 4), dtype=np.uint8)
        img[:, :, 3] = 255  # Opaque
        palette = [(0, 0, 0), (255, 255, 255)]

        result = quantize_image(img, palette)
        assert result.shape == img.shape

    def test_quantize_image_reduces_colors(self):
        """Image is quantized to palette colors only."""
        img = np.random.randint(0, 256, (10, 10, 4), dtype=np.uint8)
        img[:, :, 3] = 255  # Opaque
        palette = [(0, 0, 0), (128, 128, 128), (255, 255, 255)]

        result = quantize_image(img, palette)

        # Every non-transparent pixel should match a palette color
        for y in range(result.shape[0]):
            for x in range(result.shape[1]):
                if result[y, x, 3] > 0:
                    color = tuple(result[y, x, :3])
                    assert color in palette

    def test_quantize_image_preserves_transparency(self):
        """Fully transparent pixels remain transparent."""
        img = np.zeros((5, 5, 4), dtype=np.uint8)
        img[:, :, :3] = [128, 128, 128]
        img[:, :, 3] = 0  # All transparent
        palette = [(0, 0, 0), (255, 255, 255)]

        result = quantize_image(img, palette)

        # All pixels should still be transparent
        assert np.all(result[:, :, 3] == 0)

    def test_quantize_image_mixed_transparency(self):
        """Handle mix of transparent and opaque pixels."""
        img = np.zeros((4, 4, 4), dtype=np.uint8)

        # Top half opaque with gray
        img[:2, :, :3] = [128, 128, 128]
        img[:2, :, 3] = 255

        # Bottom half transparent
        img[2:, :, :3] = [200, 100, 50]
        img[2:, :, 3] = 0

        palette = [(0, 0, 0), (255, 255, 255)]
        result = quantize_image(img, palette)

        # Top half should be quantized (opaque)
        assert np.all(result[:2, :, 3] == 255)
        assert np.all((result[:2, :, :3] == (0, 0, 0)) | (result[:2, :, :3] == (255, 255, 255)))

        # Bottom half should remain transparent
        assert np.all(result[2:, :, 3] == 0)

    def test_quantize_image_partial_transparency(self):
        """Pixels with alpha > 0 are quantized."""
        img = np.zeros((3, 3, 4), dtype=np.uint8)
        img[:, :, :3] = [100, 150, 200]

        # Different alpha levels
        img[0, 0, 3] = 0  # Fully transparent
        img[1, 1, 3] = 128  # Semi-transparent
        img[2, 2, 3] = 255  # Opaque

        palette = [(0, 0, 0), (128, 128, 255)]
        result = quantize_image(img, palette)

        # Only fully transparent pixel (0,0) is skipped
        assert result[0, 0, 3] == 0

        # Semi and fully opaque are quantized
        assert tuple(result[1, 1, :3]) in palette
        assert tuple(result[2, 2, :3]) in palette


class TestMaterialRamps:
    """Test material color ramps."""

    def test_material_ramps_exist(self):
        """All 8 material ramps are defined."""
        expected_materials = [
            "iron",
            "gold",
            "leather",
            "cloth",
            "bone",
            "crystal",
            "wood",
            "stone",
        ]
        assert set(MATERIAL_RAMPS.keys()) == set(expected_materials)

    def test_material_ramps_length(self):
        """Each material ramp has 7 colors."""
        for material, ramp in MATERIAL_RAMPS.items():
            assert len(ramp) == 7, f"{material} ramp should have 7 colors"

    def test_material_ramps_valid_rgb(self):
        """All colors in material ramps are valid RGB."""
        for material, ramp in MATERIAL_RAMPS.items():
            for color in ramp:
                assert len(color) == 3, f"{material} color should be RGB tuple"
                for channel in color:
                    assert 0 <= channel <= 255, f"{material} has invalid channel value"

    def test_material_ramps_light_to_dark(self):
        """Material ramps progress from light to dark."""
        for material, ramp in MATERIAL_RAMPS.items():
            for i in range(len(ramp) - 1):
                brightness_current = sum(ramp[i])
                brightness_next = sum(ramp[i + 1])
                assert (
                    brightness_current >= brightness_next
                ), f"{material} ramp not monotonic at index {i}"

    def test_specific_material_colors(self):
        """Verify specific material base colors are approximately correct."""
        # Gold should be yellowish
        gold_center = MATERIAL_RAMPS["gold"][3]
        assert gold_center[0] > 200  # High red
        assert gold_center[1] > 150  # High green
        assert gold_center[2] < 100  # Low blue

        # Crystal should be cyan-ish
        crystal_center = MATERIAL_RAMPS["crystal"][3]
        assert crystal_center[2] > crystal_center[0]  # More blue than red


class TestQualityColors:
    """Test quality tier colors."""

    def test_quality_colors_exist(self):
        """All 5 quality tiers are defined."""
        expected_qualities = ["common", "uncommon", "rare", "epic", "legendary"]
        assert set(QUALITY_COLORS.keys()) == set(expected_qualities)

    def test_quality_colors_required_fields(self):
        """Each quality has name, border, and glow fields."""
        required_fields = {"name", "border", "glow"}
        for quality, colors in QUALITY_COLORS.items():
            assert (
                set(colors.keys()) == required_fields
            ), f"{quality} missing required fields"

    def test_quality_colors_valid_hex(self):
        """All non-None quality colors are valid hex strings."""
        for quality, colors in QUALITY_COLORS.items():
            for field, value in colors.items():
                if value is not None:
                    assert value.startswith("#"), f"{quality}.{field} should start with #"
                    # Verify it can be converted
                    if len(value) in (7, 9):  # #RRGGBB or #RRGGBBAA
                        hex_to_rgb(value[:7])  # Test RGB portion

    def test_quality_glow_optional(self):
        """Common quality has no glow, others may have glow."""
        assert QUALITY_COLORS["common"]["glow"] is None
        # At least one other quality should have glow
        glows = [q["glow"] for q in QUALITY_COLORS.values() if q["glow"] is not None]
        assert len(glows) > 0

    def test_specific_quality_colors(self):
        """Verify specific quality colors match spec."""
        assert QUALITY_COLORS["uncommon"]["name"] == "#1EFF00"  # Green
        assert QUALITY_COLORS["rare"]["name"] == "#0070DD"  # Blue
        assert QUALITY_COLORS["epic"]["name"] == "#A335EE"  # Purple
        assert QUALITY_COLORS["legendary"]["name"] == "#FF8000"  # Orange


class TestZonePalettes:
    """Test zone color palettes."""

    def test_zone_palettes_exist(self):
        """All 6 zones are defined."""
        expected_zones = [
            "starting_regions",
            "wildwood",
            "mistmoors",
            "skyreach",
            "blighted_wastes",
            "ascendant",
        ]
        assert set(ZONE_PALETTES.keys()) == set(expected_zones)

    def test_zone_palettes_required_fields(self):
        """Each zone has primary, secondary, and accent colors."""
        required_fields = {"primary", "secondary", "accent"}
        for zone, colors in ZONE_PALETTES.items():
            assert set(colors.keys()) == required_fields, f"{zone} missing required fields"

    def test_zone_palettes_valid_hex(self):
        """All zone colors are valid hex strings."""
        for zone, colors in ZONE_PALETTES.items():
            for field, value in colors.items():
                assert value.startswith("#"), f"{zone}.{field} should start with #"
                # Verify it can be converted
                hex_to_rgb(value)

    def test_zone_palettes_distinct(self):
        """Each zone has a distinct accent color."""
        accents = [palette["accent"] for palette in ZONE_PALETTES.values()]
        assert len(accents) == len(set(accents)), "Zone accent colors should be distinct"

    def test_specific_zone_colors(self):
        """Verify specific zone accent colors match theme."""
        # Wildwood should be green
        wildwood_accent = hex_to_rgb(ZONE_PALETTES["wildwood"]["accent"])
        assert wildwood_accent[1] > 180  # High green

        # Mistmoors should be blue
        mistmoors_accent = hex_to_rgb(ZONE_PALETTES["mistmoors"]["accent"])
        assert mistmoors_accent[2] > 180  # High blue


class TestUIColors:
    """Test UI element colors."""

    def test_ui_colors_exist(self):
        """All UI color constants are defined."""
        required_colors = [
            "panel_bg",
            "panel_bg_alt",
            "frame_outer",
            "frame_inner",
            "frame_highlight",
            "frame_shadow",
            "separator",
            "text_primary",
            "text_secondary",
            "stat_positive",
            "stat_negative",
            "text_gold",
        ]
        assert set(UI_COLORS.keys()) == set(required_colors)

    def test_ui_colors_valid_hex(self):
        """All UI colors are valid hex strings."""
        for name, value in UI_COLORS.items():
            assert value.startswith("#"), f"{name} should start with #"
            # Verify it can be converted
            hex_to_rgb(value)

    def test_ui_panel_colors_dark(self):
        """Panel backgrounds are dark colors."""
        panel_bg = hex_to_rgb(UI_COLORS["panel_bg"])
        panel_bg_alt = hex_to_rgb(UI_COLORS["panel_bg_alt"])

        # All channels should be < 50 for dark UI
        for channel in panel_bg:
            assert channel < 50

        for channel in panel_bg_alt:
            assert channel < 50

    def test_ui_text_colors_light(self):
        """Text colors are light for readability."""
        text_primary = hex_to_rgb(UI_COLORS["text_primary"])
        text_secondary = hex_to_rgb(UI_COLORS["text_secondary"])

        # Primary text should be quite bright
        assert sum(text_primary) > 400

        # Secondary text should be dimmer but still readable
        assert sum(text_secondary) > 300

    def test_specific_ui_colors(self):
        """Verify specific UI colors match spec."""
        assert UI_COLORS["stat_positive"] == "#1EFF00"  # Green
        assert UI_COLORS["stat_negative"] == "#FF3333"  # Red
        assert UI_COLORS["text_gold"] == "#FFD700"  # Gold
