"""
Utilities for working with MLPie plugins.

This module provides helper functions and utilities for working with plugins.
"""

import asyncio
import inspect
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar, Union, cast

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType
from mlpie.plugins.registry import plugin_registry
from mlpie.plugins.exceptions import (
    PluginError,
    PluginNotFoundError,
    PluginRegistrationError,
)


logger = logging.getLogger(__name__)

# Type variable for plugin classes
P = TypeVar('P', bound=Plugin)


def is_plugin_class(cls: Any) -> bool:
    """Check if a class is a valid MLPie plugin class.
    
    Args:
        cls: The class to check
        
    Returns:
        bool: True if the class is a valid plugin class
    """
    return (
        inspect.isclass(cls) and 
        issubclass(cls, Plugin) and 
        cls is not Plugin and
        hasattr(cls, 'metadata')
    )


async def create_plugin(
    plugin_type: PluginType,
    plugin_name: str,
    config: Optional[Dict[str, Any]] = None
) -> Plugin:
    """Create and initialize a plugin instance.
    
    This is a convenience wrapper around plugin_registry.get_plugin().
    
    Args:
        plugin_type: Type of the plugin
        plugin_name: Name of the plugin
        config: Configuration for the plugin
        
    Returns:
        The initialized plugin instance
        
    Raises:
        PluginNotFoundError: If the plugin is not found
        PluginError: If there is an error creating or initializing the plugin
    """
    return await plugin_registry.get_plugin(plugin_type, plugin_name, config)


async def create_plugins_of_type(
    plugin_type: PluginType,
    configs: Optional[Dict[str, Dict[str, Any]]] = None
) -> Dict[str, Plugin]:
    """Create and initialize all plugins of a specific type.
    
    Args:
        plugin_type: Type of plugins to create
        configs: Dictionary mapping plugin names to their configurations
        
    Returns:
        Dictionary mapping plugin names to initialized instances
    """
    result = {}
    plugins = plugin_registry.get_plugin_classes(plugin_type)
    
    if configs is None:
        configs = {}
    
    # Create each plugin
    for name, plugin_class in plugins.items():
        try:
            config = configs.get(name)
            plugin = await plugin_registry.get_plugin(plugin_type, name, config)
            result[name] = plugin
        except Exception as e:
            logger.warning(f"Error creating plugin '{name}': {str(e)}")
    
    return result


def get_plugin_metadata(plugin_class: Type[Plugin]) -> PluginMetadata:
    """Get metadata for a plugin class.
    
    Args:
        plugin_class: The plugin class
        
    Returns:
        The plugin metadata
        
    Raises:
        ValueError: If the plugin class does not have metadata
    """
    return plugin_class.get_metadata()


def validate_plugin_metadata(metadata: PluginMetadata) -> List[str]:
    """Validate plugin metadata for completeness and correctness.
    
    Args:
        metadata: The plugin metadata to validate
        
    Returns:
        List of validation errors, empty if valid
    """
    errors = []
    
    # Check required fields
    if not metadata.name:
        errors.append("Plugin name is required")
    
    if not metadata.version:
        errors.append("Plugin version is required")
    
    # Check name format
    if metadata.name and not metadata.name.isidentifier():
        errors.append("Plugin name must be a valid Python identifier")
    
    return errors 