from src.palettes.game_palettes import (
    CLASS_COLORS,
    BAR_COLORS,
    BOSS_PALETTES,
    QUALITY_GLOW_PARAMS,
    SPEC_COLORS,
    BUFF_BORDER_COLORS,
    CURRENCY_COLORS,
    TALENT_NODE_STATES,
)


class TestClassColors:
    def test_all_nine_classes(self):
        expected = {"blademaster", "sentinel", "stalker", "shadow", "cleric",
                    "arcanist", "summoner", "channeler", "shapeshifter"}
        assert set(CLASS_COLORS.keys()) == expected

    def test_each_has_hex(self):
        for cls, colors in CLASS_COLORS.items():
            assert "hex" in colors, f"{cls} missing hex"
            assert colors["hex"].startswith("#"), f"{cls} hex should start with #"


class TestBarColors:
    def test_bar_types(self):
        expected = {"health", "mana", "energy", "rage", "xp", "reputation", "profession", "cast"}
        assert set(BAR_COLORS.keys()) == expected

    def test_bar_color_structure(self):
        for bar, colors in BAR_COLORS.items():
            assert "fill" in colors, f"{bar} missing fill"
            assert "bg" in colors, f"{bar} missing bg"
            assert "border" in colors, f"{bar} missing border"


class TestBossPalettes:
    def test_four_dungeons(self):
        assert len(BOSS_PALETTES) == 4

    def test_palette_structure(self):
        for dungeon, palette in BOSS_PALETTES.items():
            assert "primary" in palette
            assert "secondary" in palette
            assert "accent" in palette


class TestQualityGlowParams:
    def test_all_qualities(self):
        expected = {"common", "uncommon", "rare", "epic", "legendary"}
        assert set(QUALITY_GLOW_PARAMS.keys()) == expected

    def test_common_has_no_glow(self):
        assert QUALITY_GLOW_PARAMS["common"]["radius"] == 0
        assert QUALITY_GLOW_PARAMS["common"]["intensity"] == 0.0
        assert QUALITY_GLOW_PARAMS["common"]["color"] is None

    def test_legendary_has_max_glow(self):
        params = QUALITY_GLOW_PARAMS["legendary"]
        assert params["radius"] >= 2
        assert params["intensity"] >= 0.8
        assert params["color"] is not None

    def test_glow_radius_increases(self):
        order = ["common", "uncommon", "rare", "epic", "legendary"]
        radii = [QUALITY_GLOW_PARAMS[q]["radius"] for q in order]
        assert radii == sorted(radii)


class TestSpecColors:
    def test_has_entries(self):
        assert len(SPEC_COLORS) >= 5

    def test_structure(self):
        for spec, colors in SPEC_COLORS.items():
            assert "primary" in colors
            assert "secondary" in colors
            assert "bg" in colors


class TestBuffBorderColors:
    def test_three_types(self):
        assert set(BUFF_BORDER_COLORS.keys()) == {"beneficial", "harmful", "neutral"}


class TestCurrencyColors:
    def test_gold_and_silver(self):
        assert "gold" in CURRENCY_COLORS
        assert "silver" in CURRENCY_COLORS

    def test_all_are_hex(self):
        for name, color in CURRENCY_COLORS.items():
            assert color.startswith("#"), f"{name} should be hex"


class TestTalentNodeStates:
    def test_five_states(self):
        expected = {"locked", "available", "partial", "maxed", "capstone"}
        assert set(TALENT_NODE_STATES.keys()) == expected

    def test_state_structure(self):
        for state, props in TALENT_NODE_STATES.items():
            assert "border" in props
            assert "bg" in props
