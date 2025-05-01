"""
Plugin Discovery for MLPie.

This module provides utilities for discovering plugins from entry points
and other discovery mechanisms.
"""

import importlib.metadata
import logging
import sys
import pkgutil
from typing import Dict, List, Optional, Type

from mlpie.plugins.base import Plugin, PluginType
from mlpie.plugins.registry import plugin_registry


logger = logging.getLogger(__name__)

# Entry point group for MLPie plugins
PLUGIN_ENTRY_POINT_GROUP = "mlpie.plugins"


def discover_plugins_from_entry_points() -> List[Type[Plugin]]:
    """Discover plugins from entry points.
    
    This function looks for plugins registered using the entry_points mechanism
    in setuptools, under the 'mlpie.plugins' group.
    
    Returns:
        List of discovered plugin classes
    """
    discovered_plugins: List[Type[Plugin]] = []
    
    try:
        # Get all entry points in the mlpie.plugins group
        entry_points = importlib.metadata.entry_points()
        
        # Handle different versions of importlib.metadata
        if hasattr(entry_points, 'select'):
            # Python 3.10+ style
            plugin_entry_points = entry_points.select(group=PLUGIN_ENTRY_POINT_GROUP)
        else:
            # Older style
            plugin_entry_points = entry_points.get(PLUGIN_ENTRY_POINT_GROUP, [])
        
        # Load each entry point
        for entry_point in plugin_entry_points:
            try:
                # Load the plugin class
                plugin_class = entry_point.load()
                
                # Verify it's a Plugin subclass
                if not isinstance(plugin_class, type) or not issubclass(plugin_class, Plugin):
                    logger.warning(
                        f"Entry point '{entry_point.name}' does not point to a Plugin class: {plugin_class}"
                    )
                    continue
                
                # Register the plugin
                plugin_registry.register_plugin_class(plugin_class)
                discovered_plugins.append(plugin_class)
                
            except Exception as e:
                logger.warning(f"Error loading plugin from entry point '{entry_point.name}': {str(e)}")
        
    except Exception as e:
        logger.warning(f"Error discovering plugins from entry points: {str(e)}")
    
    return discovered_plugins


def discover_module_providers() -> List[Type[Plugin]]:
    """Discover provider plugins in each module's providers directory.
    
    Returns:
        List of discovered plugin classes
    """
    discovered_plugins: List[Type[Plugin]] = []
    
    # Define modules that may contain providers
    modules_with_providers = [
        "mlpie.secrets.providers", 
        "mlpie.db.providers",
        "mlpie.gitops.providers",
        "mlpie.storage.providers",
        "mlpie.auth.providers",
        # Add more modules as they are created
    ]
    
    # Scan each module for providers
    for module_name in modules_with_providers:
        try:
            # Try to import the module
            try:
                importlib.import_module(module_name)
                module_plugins = plugin_registry.discover_plugins(module_name)
                discovered_plugins.extend(module_plugins)
                logger.debug(f"Discovered {len(module_plugins)} plugins in {module_name}")
            except ImportError:
                # Skip modules that don't exist yet
                logger.debug(f"Module {module_name} not found, skipping")
                continue
                
        except Exception as e:
            logger.warning(f"Error discovering plugins in {module_name}: {str(e)}")
    
    return discovered_plugins


def discover_all_plugins() -> Dict[PluginType, Dict[str, Type[Plugin]]]:
    """Discover all available plugins.
    
    This function combines discovery from entry points, module providers,
    and any other discovery mechanisms.
    
    Returns:
        Dictionary mapping plugin types to dictionaries of plugin names and classes
    """
    # Discover plugins from entry points
    discover_plugins_from_entry_points()
    
    # Discover module provider plugins
    discover_module_providers()
    
    # Return all registered plugins
    result = {}
    for plugin_type in PluginType:
        result[plugin_type] = plugin_registry.get_plugin_classes(plugin_type)
    
    return result


def get_available_plugins(plugin_type: Optional[PluginType] = None) -> Dict[str, Dict[str, str]]:
    """Get information about available plugins.
    
    Args:
        plugin_type: Optional filter for plugin type
        
    Returns:
        Dictionary mapping plugin names to dictionaries of plugin information
    """
    result = {}
    
    # Ensure plugins are discovered
    discover_all_plugins()
    
    # Get plugins of the specified type, or all types
    if plugin_type:
        plugin_types = [plugin_type]
    else:
        plugin_types = list(PluginType)
    
    # Build result dictionary
    for pt in plugin_types:
        plugin_classes = plugin_registry.get_plugin_classes(pt)
        for name, plugin_class in plugin_classes.items():
            metadata = plugin_class.get_metadata()
            result[name] = {
                "name": metadata.name,
                "version": metadata.version,
                "description": metadata.description,
                "type": metadata.plugin_type.value,
                "author": metadata.author,
                "homepage": metadata.homepage,
                "capabilities": ", ".join(metadata.capabilities),
            }
    
    return result 