"""
Database CRUD operations for MLPie.

This package provides CRUD (Create, Read, Update, Delete) operations
for database entities.
"""

from mlpie.db.crud.config import (
    get_configuration, get_configurations, set_configuration, delete_configuration,
    get_plugin, get_plugin_by_name_and_type, get_plugins, create_or_update_plugin,
    update_plugin_status, delete_plugin, delete_plugin_by_name_and_type
)


__all__ = [
    # Configuration
    "get_configuration", 
    "get_configurations", 
    "set_configuration", 
    "delete_configuration",
    
    # Plugins
    "get_plugin", 
    "get_plugin_by_name_and_type", 
    "get_plugins", 
    "create_or_update_plugin",
    "update_plugin_status", 
    "delete_plugin", 
    "delete_plugin_by_name_and_type"
] 