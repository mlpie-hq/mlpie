"""
Plugin Registry for MLPie.

This module provides a central registry for plugin management, 
handling plugin registration, discovery, and lifecycle.
"""

import importlib
import inspect
import logging
import pkgutil
from functools import lru_cache
from typing import Any, Dict, List, Optional, Set, Type, TypeVar, Union, cast

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType
from mlpie.plugins.exceptions import (
    PluginError, 
    PluginNotFoundError, 
    PluginRegistrationError,
    PluginInitializationError,
    DuplicatePluginError
)


logger = logging.getLogger(__name__)

# Type variable for plugin classes
P = TypeVar('P', bound=Plugin)


class PluginRegistry:
    """Central registry for managing plugins in the MLPie platform.
    
    This class handles plugin registration, discovery, and lifecycle management.
    """
    
    def __init__(self):
        """Initialize the plugin registry."""
        # Mapping of plugin types to dict of {plugin_name: plugin_class}
        self._plugins: Dict[PluginType, Dict[str, Type[Plugin]]] = {
            plugin_type: {} for plugin_type in PluginType
        }
        
        # Set of plugin modules that have been scanned
        self._scanned_modules: Set[str] = set()
        
        # Instance cache for initialized plugins
        self._instances: Dict[str, Plugin] = {}
    
    def register_plugin_class(self, plugin_class: Type[P]) -> None:
        """Register a plugin class with the registry.
        
        Args:
            plugin_class: The plugin class to register
            
        Raises:
            PluginRegistrationError: If registration fails
            DuplicatePluginError: If a plugin with the same name is already registered
        """
        try:
            # Get the plugin metadata
            metadata = plugin_class.get_metadata()
            plugin_type = metadata.plugin_type
            plugin_name = metadata.name
            
            # Check if a plugin with this name is already registered
            if plugin_name in self._plugins[plugin_type]:
                existing_class = self._plugins[plugin_type][plugin_name]
                raise DuplicatePluginError(
                    f"Plugin '{plugin_name}' of type '{plugin_type}' is already registered "
                    f"(class: {existing_class.__module__}.{existing_class.__name__})"
                )
            
            # Register the plugin class
            self._plugins[plugin_type][plugin_name] = plugin_class
            logger.info(f"Registered plugin '{plugin_name}' of type '{plugin_type}' "
                       f"(class: {plugin_class.__module__}.{plugin_class.__name__})")
            
        except Exception as e:
            if not isinstance(e, (PluginRegistrationError, DuplicatePluginError)):
                raise PluginRegistrationError(
                    f"Failed to register plugin class {plugin_class.__name__}: {str(e)}"
                ) from e
            raise
    
    def discover_plugins(self, package_name: str) -> List[Type[Plugin]]:
        """Discover plugins in the specified package.
        
        This method recursively scans the package for plugin classes.
        
        Args:
            package_name: Name of the package to scan for plugins
            
        Returns:
            List of discovered plugin classes
        """
        discovered_plugins: List[Type[Plugin]] = []
        
        try:
            # Skip if already scanned
            if package_name in self._scanned_modules:
                return discovered_plugins
            
            # Mark as scanned
            self._scanned_modules.add(package_name)
            
            # Import the package
            package = importlib.import_module(package_name)
            
            # Get the package path
            if not hasattr(package, '__path__'):
                logger.warning(f"Package '{package_name}' is not a package (no __path__ attribute)")
                return discovered_plugins
            
            # Recursively scan all modules in the package
            for _, name, is_pkg in pkgutil.walk_packages(package.__path__, package_name + '.'):
                try:
                    # Import the module
                    module = importlib.import_module(name)
                    
                    # If it's a package, recursively scan it
                    if is_pkg:
                        sub_plugins = self.discover_plugins(name)
                        discovered_plugins.extend(sub_plugins)
                    
                    # Look for plugin classes in the module
                    for _, obj in inspect.getmembers(module, inspect.isclass):
                        # Check if it's a plugin class (but not the base Plugin class or an abstract class)
                        if (issubclass(obj, Plugin) and obj is not Plugin and 
                                not inspect.isabstract(obj) and # Exclude abstract classes
                                obj.__module__ == module.__name__):
                            try:
                                # Register the plugin
                                self.register_plugin_class(cast(Type[Plugin], obj))
                                discovered_plugins.append(cast(Type[Plugin], obj))
                            except DuplicatePluginError:
                                # Ignore duplicate plugins during discovery
                                pass
                    
                except Exception as e:
                    logger.warning(f"Error discovering plugins in module '{name}': {str(e)}")
            
            return discovered_plugins
            
        except Exception as e:
            logger.warning(f"Error discovering plugins in package '{package_name}': {str(e)}")
            return discovered_plugins
    
    def get_plugin_class(
        self, 
        plugin_type: PluginType, 
        plugin_name: str
    ) -> Type[Plugin]:
        """Get a plugin class by type and name.
        
        Args:
            plugin_type: Type of the plugin
            plugin_name: Name of the plugin
            
        Returns:
            The plugin class
            
        Raises:
            PluginNotFoundError: If the plugin is not found
        """
        try:
            # Get the plugin class
            plugin_class = self._plugins[plugin_type].get(plugin_name)
            if plugin_class is None:
                raise PluginNotFoundError(
                    f"Plugin '{plugin_name}' of type '{plugin_type}' not found"
                )
            
            return plugin_class
            
        except KeyError:
            raise PluginNotFoundError(f"Plugin type '{plugin_type}' is not valid")
    
    def get_plugin_classes(self, plugin_type: PluginType) -> Dict[str, Type[Plugin]]:
        """Get all plugin classes of a specific type.
        
        Args:
            plugin_type: Type of plugins to get
            
        Returns:
            Dictionary mapping plugin names to plugin classes
            
        Raises:
            PluginNotFoundError: If the plugin type is not valid
        """
        try:
            return dict(self._plugins[plugin_type])
        except KeyError:
            raise PluginNotFoundError(f"Plugin type '{plugin_type}' is not valid")
    
    async def get_plugin(
        self, 
        plugin_type: PluginType, 
        plugin_name: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Plugin:
        """Get or create a plugin instance.
        
        This method returns an existing instance if available, or creates a new one.
        
        Args:
            plugin_type: Type of the plugin
            plugin_name: Name of the plugin
            config: Configuration for the plugin (if creating a new instance)
            
        Returns:
            The plugin instance
            
        Raises:
            PluginNotFoundError: If the plugin is not found
            PluginInitializationError: If plugin initialization fails
        """
        # Create a unique key for the plugin instance
        instance_key = f"{plugin_type.value}:{plugin_name}"
        logger.debug(f"Getting plugin instance for '{instance_key}'")
        
        # Return existing instance if available
        if instance_key in self._instances:
            logger.debug(f"Found existing instance for '{instance_key}': {self._instances[instance_key]}")
            # Check if the instance is properly initialized
            if hasattr(self._instances[instance_key], 'initialized'):
                logger.debug(f"Plugin '{instance_key}' initialized state: {self._instances[instance_key].initialized}")
            return self._instances[instance_key]
        
        logger.debug(f"No existing instance for '{instance_key}', creating new one")
        
        # Get the plugin class
        try:
            plugin_class = self.get_plugin_class(plugin_type, plugin_name)
            logger.debug(f"Found plugin class for '{instance_key}': {plugin_class}")
        except Exception as e:
            logger.error(f"Failed to get plugin class for '{instance_key}': {str(e)}")
            raise
        
        try:
            # Create a new instance
            logger.debug(f"Creating new instance of '{instance_key}'")
            plugin_instance = plugin_class()
            logger.debug(f"Created new instance: {plugin_instance}")
            
            # Initialize the plugin
            if config is not None:
                logger.debug(f"Validating configuration for '{instance_key}': {config}")
                # Validate the configuration
                validation_errors = await plugin_instance.validate_config(config)
                if validation_errors:
                    error_messages = "; ".join(f"{key}: {msg}" for key, msg in validation_errors.items())
                    logger.error(f"Invalid configuration for plugin '{plugin_name}': {error_messages}")
                    raise PluginInitializationError(
                        f"Invalid configuration for plugin '{plugin_name}': {error_messages}"
                    )
                
                logger.debug(f"Initializing plugin '{instance_key}' with config: {config}")
                # Initialize with the validated configuration (Asynchronous call)
                success = await plugin_instance.initialize(config)
                logger.debug(f"Plugin '{instance_key}' initialization result: {success}")
                if not success:
                    logger.error(f"Failed to initialize plugin '{plugin_name}'")
                    raise PluginInitializationError(
                        f"Failed to initialize plugin '{plugin_name}'"
                    )
            else:
                logger.debug(f"No configuration provided for '{instance_key}', skipping initialization")
            
            # Cache the instance
            logger.debug(f"Caching instance for '{instance_key}'")
            self._instances[instance_key] = plugin_instance
            
            return plugin_instance
            
        except Exception as e:
            logger.error(f"Error getting plugin '{plugin_name}': {str(e)}")
            if isinstance(e, PluginInitializationError):
                raise
            raise PluginInitializationError(
                f"Failed to create or initialize plugin '{plugin_name}': {str(e)}"
            ) from e
    
    async def shutdown_all(self) -> None:
        """Shutdown all plugin instances."""
        for plugin_name, plugin in list(self._instances.items()):
            try:
                await plugin.shutdown()
                logger.info(f"Shutdown plugin: {plugin_name}")
            except Exception as e:
                logger.warning(f"Error shutting down plugin '{plugin_name}': {str(e)}")
        
        # Clear the instance cache
        self._instances.clear()


# Singleton instance of the plugin registry
plugin_registry = PluginRegistry()


@lru_cache
def get_plugin_registry() -> PluginRegistry:
    """Get the global plugin registry instance (cached)."""
    return plugin_registry 