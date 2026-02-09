"""CLI command: art generate — produce asset variants."""
import json
import click
from pathlib import Path
from src.generators.icons import generate_icon, generate_icon_batch


def _parse_seeds(seeds_str: str) -> list[int]:
    """Parse seed specification: '42' or '100-109' or '1,2,3'."""
    results = []
    for part in seeds_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            results.extend(range(int(start), int(end) + 1))
        else:
            results.append(int(part))
    return results


@click.group()
def generate():
    """Generate asset variants from templates."""
    pass


@generate.command("icons")
@click.option("--template-dir", required=True, type=click.Path(exists=True), help="Directory with template PNGs and JSON")
@click.option("--template", required=True, help="Template name (without extension)")
@click.option("--materials", required=True, help="Comma-separated material names")
@click.option("--qualities", required=True, help="Comma-separated quality tiers")
@click.option("--seeds", required=True, help="Seed(s): single number, range (100-109), or comma-separated")
@click.option("--output", "output_dir", default="output/icons", help="Output directory")
def generate_icons(template_dir, template, materials, qualities, seeds, output_dir):
    """Generate icon variants from a template."""
    mat_list = [m.strip() for m in materials.split(",")]
    qual_list = [q.strip() for q in qualities.split(",")]
    seed_list = _parse_seeds(seeds)

    total = len(mat_list) * len(qual_list) * len(seed_list)
    click.echo(f"Generating {total} icons...")

    results = generate_icon_batch(
        template_dir=Path(template_dir),
        template_name=template,
        materials=mat_list,
        qualities=qual_list,
        seeds=seed_list,
        output_dir=Path(output_dir),
    )

    click.echo(f"Generated {len(results)} icons in {output_dir}/")


@generate.command("manifest")
@click.option("--manifest", "manifest_path", required=True, type=click.Path(exists=True), help="JSON manifest file")
@click.option("--template-dir", required=True, type=click.Path(exists=True), help="Directory with templates")
def generate_from_manifest(manifest_path, template_dir):
    """Generate assets from a JSON manifest file."""
    manifest = json.loads(Path(manifest_path).read_text())

    gen_type = manifest.get("type", "icons")

    if gen_type == "icons":
        template = manifest["template"]
        materials = manifest["materials"]
        qualities = manifest["qualities"]
        seeds = manifest["seeds"]
        output_dir = manifest.get("output_dir", "output/icons")

        total = len(materials) * len(qualities) * len(seeds)
        click.echo(f"Manifest: generating {total} {gen_type}...")

        results = generate_icon_batch(
            template_dir=Path(template_dir),
            template_name=template,
            materials=materials,
            qualities=qualities,
            seeds=seeds,
            output_dir=Path(output_dir),
        )
        click.echo(f"Generated {len(results)} icons from manifest.")
    else:
        click.echo(f"Unknown manifest type: {gen_type}", err=True)
        raise click.Abort()
