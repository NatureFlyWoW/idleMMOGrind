"""CLI command: art compose — render compositions."""
import click
from pathlib import Path
from PIL import Image
import numpy as np

from src.generators.backgrounds import generate_background
from src.generators.tooltips import render_tooltip_from_file
from src.layout.engine import LayoutEngine


@click.group()
def compose():
    """Render composed assets (tooltips, backgrounds, screens)."""
    pass


@compose.command("background")
@click.option("--zone", required=True, help="Zone name")
@click.option("--width", required=True, type=int, help="Width in pixels")
@click.option("--height", required=True, type=int, help="Height in pixels")
@click.option("--seed", default=42, type=int, help="RNG seed")
@click.option("--output", required=True, type=click.Path(), help="Output PNG path")
def compose_background(zone, width, height, seed, output):
    """Generate a zone background."""
    bg = generate_background(zone, width, height, seed)
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(bg).save(output_path)
    click.echo(f"Background saved to {output}")


@compose.command("tooltip")
@click.option("--item-data", required=True, type=click.Path(exists=True), help="Item JSON file")
@click.option("--output", required=True, type=click.Path(), help="Output PNG path")
def compose_tooltip(item_data, output):
    """Render an item tooltip from JSON data."""
    tooltip = render_tooltip_from_file(Path(item_data))
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(tooltip).save(output_path)
    click.echo(f"Tooltip saved to {output}")


@compose.command("screen")
@click.option("--layout", "layout_path", required=True, type=click.Path(exists=True), help="Layout JSON file")
@click.option("--output", required=True, type=click.Path(), help="Output PNG path")
def compose_screen(layout_path, output):
    """Render a full screen composition from a layout file."""
    engine = LayoutEngine()
    result = engine.render_from_file(Path(layout_path))
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(result).save(output_path)
    click.echo(f"Screen saved to {output}")
