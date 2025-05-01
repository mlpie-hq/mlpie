"""
CLI Commands for Configuration Management.

This module provides CLI commands for managing configurations and plugins.
"""

import asyncio
import json
from typing import Optional, List, Dict, Any

import typer
from rich.console import Console
from rich.table import Table
from rich.text import Text

from mlpie.config import get_settings, get_config_manager
from mlpie.db.connection import setup_database, get_session
from mlpie.plugins.base import PluginType
from mlpie.plugins.discovery import discover_all_plugins


console = Console()
app = typer.Typer(help="Manage MLPie configurations and plugins")


@app.command("get")
def get_config(
    key: str = typer.Argument(..., help="Configuration key to retrieve"),
    default: Optional[str] = typer.Option(None, help="Default value if not found")
):
    """Get a configuration value."""
    async def _get_config():
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Get the value
            value = await config_manager.get_value(session, key, default)
            
            if value is None:
                console.print(f"Configuration not found: [bold red]{key}[/bold red]")
                return 1
            
            # Print the value
            if isinstance(value, (dict, list)):
                console.print(json.dumps(value, indent=2))
            else:
                console.print(str(value))
            
            return 0
    
    return asyncio.run(_get_config())


@app.command("set")
def set_config(
    key: str = typer.Argument(..., help="Configuration key to set"),
    value: str = typer.Argument(..., help="Configuration value"),
    description: Optional[str] = typer.Option(None, help="Description of the configuration"),
    json_value: bool = typer.Option(False, "--json", "-j", help="Parse value as JSON")
):
    """Set a configuration value."""
    async def _set_config():
        # Parse value if JSON
        parsed_value: Any = value
        if json_value:
            try:
                parsed_value = json.loads(value)
            except json.JSONDecodeError:
                console.print("[bold red]Error:[/bold red] Invalid JSON value")
                return 1
        
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Set the value
            await config_manager.set_value(session, key, parsed_value, description)
            
            console.print(f"Configuration set: [bold green]{key}[/bold green]")
            return 0
    
    return asyncio.run(_set_config())


@app.command("delete")
def delete_config(
    key: str = typer.Argument(..., help="Configuration key to delete"),
    force: bool = typer.Option(False, "--force", "-f", help="Force deletion without confirmation")
):
    """Delete a configuration value."""
    async def _delete_config():
        # Confirm deletion
        if not force:
            confirm = typer.confirm(f"Are you sure you want to delete the configuration '{key}'?")
            if not confirm:
                console.print("Operation cancelled")
                return 0
        
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Delete the value
            result = await config_manager.delete_value(session, key)
            
            if result:
                console.print(f"Configuration deleted: [bold green]{key}[/bold green]")
            else:
                console.print(f"Configuration not found: [bold yellow]{key}[/bold yellow]")
            
            return 0 if result else 1
    
    return asyncio.run(_delete_config())


@app.command("list")
def list_configs(
    prefix: Optional[str] = typer.Option(None, help="Filter by key prefix")
):
    """List all configuration values."""
    async def _list_configs():
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Get all values
            values = await config_manager.get_all_values(session, prefix)
            
            if not values:
                if prefix:
                    console.print(f"No configurations found with prefix: [bold yellow]{prefix}[/bold yellow]")
                else:
                    console.print("No configurations found")
                return 0
            
            # Create a table
            table = Table(show_header=True, header_style="bold")
            table.add_column("Key")
            table.add_column("Value")
            
            # Add rows
            for key, value in sorted(values.items()):
                if isinstance(value, (dict, list)):
                    formatted_value = json.dumps(value)
                else:
                    formatted_value = str(value)
                
                table.add_row(key, formatted_value)
            
            console.print(table)
            return 0
    
    return asyncio.run(_list_configs())


@app.command("plugin-list")
def list_plugins(
    plugin_type: Optional[str] = typer.Option(None, help="Filter by plugin type"),
    active_only: bool = typer.Option(False, "--active", "-a", help="Show only active plugins")
):
    """List installed plugins."""
    async def _list_plugins():
        # Setup database connection
        setup_database()
        
        # Validate plugin type
        plugin_type_enum = None
        if plugin_type:
            try:
                plugin_type_enum = PluginType(plugin_type)
            except ValueError:
                valid_types = ", ".join([t.value for t in PluginType])
                console.print(f"[bold red]Error:[/bold red] Invalid plugin type. Valid types: {valid_types}")
                return 1
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Get plugins
            plugins = await config_manager.get_active_plugins(session, plugin_type_enum) if active_only else \
                     await get_plugins(session, plugin_type_enum)
            
            if not plugins:
                status = "active " if active_only else ""
                type_str = f" of type '{plugin_type}'" if plugin_type else ""
                console.print(f"No {status}plugins found{type_str}")
                return 0
            
            # Create a table
            table = Table(show_header=True, header_style="bold")
            table.add_column("ID")
            table.add_column("Name")
            table.add_column("Type")
            table.add_column("Version")
            table.add_column("Status")
            table.add_column("Description")
            
            # Add rows
            for plugin in sorted(plugins, key=lambda p: (p.plugin_type.value, p.name)):
                status = Text("Active", style="green") if plugin.is_active else Text("Inactive", style="red")
                table.add_row(
                    str(plugin.id),
                    plugin.name,
                    plugin.plugin_type.value,
                    plugin.version,
                    status,
                    plugin.description or ""
                )
            
            console.print(table)
            return 0
    
    return asyncio.run(_list_plugins())


@app.command("plugin-sync")
def sync_plugins():
    """Synchronize available plugins with the database."""
    async def _sync_plugins():
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            # Discover and register plugins
            console.print("Synchronizing plugins...")
            stats = await config_manager.sync_plugins(session)
            
            # Print results
            console.print(
                f"[bold green]Plugin sync completed:[/bold green] "
                f"{stats['added']} added, {stats['updated']} updated, {stats['removed']} removed"
            )
            
            return 0
    
    return asyncio.run(_sync_plugins())


@app.command("plugin-enable")
def enable_plugin(
    plugin_id: str = typer.Argument(..., help="Plugin ID to enable"),
    disable: bool = typer.Option(False, "--disable", "-d", help="Disable the plugin instead of enabling it")
):
    """Enable or disable a plugin."""
    async def _enable_plugin():
        # Setup database connection
        setup_database()
        
        # Get a database session
        async for session in get_session():
            # Setup configuration manager
            config_manager = get_config_manager()
            await config_manager.initialize(session)
            
            try:
                # Update status
                action = "disable" if disable else "enable"
                console.print(f"Attempting to {action} plugin: {plugin_id}")
                
                result = await config_manager.activate_plugin(session, plugin_id, not disable)
                
                if result:
                    status = "disabled" if disable else "enabled"
                    console.print(f"Plugin successfully {status}: [bold green]{plugin_id}[/bold green]")
                else:
                    console.print(f"[bold red]Error:[/bold red] Plugin not found: {plugin_id}")
                
                return 0 if result else 1
                
            except ValueError:
                console.print(f"[bold red]Error:[/bold red] Invalid plugin ID format: {plugin_id}")
                return 1
    
    return asyncio.run(_enable_plugin())


if __name__ == "__main__":
    app() 