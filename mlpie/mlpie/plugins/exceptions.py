"""
Exceptions for the MLPie Plugin System.

This module defines custom exceptions used by the plugin system.
"""


class PluginError(Exception):
    """Base exception for all plugin-related errors."""
    pass


class PluginNotFoundError(PluginError):
    """Raised when a requested plugin is not found."""
    pass


class PluginRegistrationError(PluginError):
    """Raised when there is an error registering a plugin."""
    pass


class PluginInitializationError(PluginError):
    """Raised when a plugin cannot be initialized."""
    pass


class DuplicatePluginError(PluginRegistrationError):
    """Raised when attempting to register a plugin with a name that is already registered."""
    pass


class PluginConfigurationError(PluginError):
    """Raised when there is an error with a plugin's configuration."""
    pass


class PluginDependencyError(PluginError):
    """Raised when a plugin's dependencies cannot be satisfied."""
    pass 