"""
Plugin System for MLPie.

This package provides a flexible and extensible plugin architecture for the MLPie platform.
It handles plugin discovery, registration, and lifecycle management.
"""

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin
from mlpie.plugins.registry import plugin_registry, get_plugin_registry
from mlpie.plugins.discovery import (
    discover_plugins_from_entry_points,
    discover_module_providers,
    discover_all_plugins,
    get_available_plugins,
)
from mlpie.plugins.exceptions import (
    PluginError,
    PluginNotFoundError,
    PluginRegistrationError,
    PluginInitializationError,
    DuplicatePluginError,
    PluginConfigurationError,
    PluginDependencyError,
)
from mlpie.plugins.utils import (
    is_plugin_class,
    create_plugin,
    create_plugins_of_type,
    get_plugin_metadata,
    validate_plugin_metadata,
)

__all__ = [
    # Base classes and types
    "Plugin",
    "PluginMetadata",
    "PluginType",
    "register_plugin",
    
    # Registry
    "plugin_registry",
    "get_plugin_registry",
    
    # Discovery
    "discover_plugins_from_entry_points",
    "discover_module_providers",
    "discover_all_plugins",
    "get_available_plugins",
    
    # Utilities
    "is_plugin_class",
    "create_plugin",
    "create_plugins_of_type",
    "get_plugin_metadata",
    "validate_plugin_metadata",
    
    # Exceptions
    "PluginError",
    "PluginNotFoundError",
    "PluginRegistrationError",
    "PluginInitializationError",
    "DuplicatePluginError",
    "PluginConfigurationError",
    "PluginDependencyError",
] 