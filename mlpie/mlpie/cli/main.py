"""
MLPie CLI Application.

This module provides the main CLI interface for MLPie.
"""

import typer
import asyncio
from typing import Optional

from mlpie.db.connection import setup_database
from mlpie.cli.commands import config as config_cmd


app = typer.Typer(
    help="MLPie CLI - The Machine Learning Platform CLI",
    no_args_is_help=True,
)


# Add subcommands
app.add_typer(config_cmd.app, name="config", help="Manage MLPie configuration and plugins")


@app.callback()
def callback():
    """MLPie CLI - The Machine Learning Platform CLI."""
    # This function is called before any command
    pass


@app.command()
def version():
    """Show MLPie version information."""
    from mlpie.config import get_settings
    
    settings = get_settings()
    typer.echo(f"MLPie version: {settings.APP_VERSION}")


@app.command()
def init():
    """Initialize the MLPie platform.
    
    This command initializes the database and default configuration.
    """
    async def _init():
        # Setup database
        typer.echo("Initializing database...")
        setup_database()
        
        # Initialize configuration
        from mlpie.config import get_config_manager
        from mlpie.db.connection import get_session
        
        typer.echo("Initializing configuration...")
        async for session in get_session():
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Discover and register plugins
            typer.echo("Synchronizing plugins...")
            stats = await config_manager.sync_plugins(session)
            
            typer.echo(
                f"Plugin sync completed: "
                f"{stats['added']} added, {stats['updated']} updated, {stats['removed']} removed"
            )
        
        typer.echo("MLPie initialized successfully!")
        return 0
    
    return asyncio.run(_init())


if __name__ == "__main__":
    app() 