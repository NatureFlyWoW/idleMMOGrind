"""CLI command: art ingest — process AI drafts into templates."""
import click
from pathlib import Path
from src.ingest.template_processor import process_template


@click.command()
@click.option("--input", "input_path", required=True, type=click.Path(exists=True), help="Path to AI draft PNG")
@click.option("--type", "asset_type", required=True, help="Asset type (weapon, armor_overlay, etc.)")
@click.option("--name", required=True, help="Template name")
@click.option("--output", "output_dir", default="src/data/templates", help="Output directory for processed templates")
@click.option("--regions", "num_regions", default=1, type=int, help="Number of material regions to detect")
@click.option("--max-colors", default=128, type=int, help="Maximum palette colors")
@click.option("--threshold", "bg_threshold", default=30, type=int, help="Background removal threshold")
def ingest(input_path, asset_type, name, output_dir, num_regions, max_colors, bg_threshold):
    """Process an AI draft image into a cleaned template."""
    result = process_template(
        input_path=Path(input_path),
        output_dir=Path(output_dir),
        name=name,
        asset_type=asset_type,
        num_regions=num_regions,
        max_colors=max_colors,
        bg_threshold=bg_threshold,
    )
    click.echo(f"Template '{name}' processed successfully.")
    click.echo(f"  Type: {result['type']}")
    click.echo(f"  Size: {result['width']}x{result['height']}")
    click.echo(f"  Regions: {len(result['regions'])}")
    click.echo(f"  Palette: {result['palette_size']} colors")
    click.echo(f"  Output: {output_dir}/{name}.png")
