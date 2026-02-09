"""Art Engine V2 CLI entry point."""
import click

from src.cli.ingest import ingest
from src.cli.generate import generate
from src.cli.compose import compose


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """Art Engine V2 — Pixel art asset generation for Idle MMORPG."""
    pass


cli.add_command(ingest)
cli.add_command(generate)
cli.add_command(compose)


if __name__ == "__main__":
    cli()
