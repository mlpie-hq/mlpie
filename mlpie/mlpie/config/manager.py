"""
Configuration Management for MLPie.

This module provides a central service for managing persistent configurations
and installed plugins in the MLPie platform.
"""

import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional, Set, TypeVar, Union, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.config import get_settings
from mlpie.db.connection import get_session
from mlpie.db.crud.config import (
    get_configuration, get_configurations, set_configuration, delete_configuration,
    get_plugin, get_plugin_by_name_and_type, get_plugins, create_or_update_plugin,
    update_plugin_status, delete_plugin, delete_plugin_by_name_and_type
)
from mlpie.db.models.config import Configuration, InstalledPlugin
from mlpie.plugins.base import Plugin, PluginMetadata, PluginType
from mlpie.plugins.discovery import discover_all_plugins


logger = logging.getLogger(__name__)


class ConfigurationManager:
    """Central service for managing MLPie configuration.
    
    This class provides functionality for managing persistent configuration values
    and tracking installed plugins in the system.
    """
    
    def __init__(self):
        """Initialize the configuration manager."""
        self._initialized = False
        self._settings = get_settings()
        self._config_cache: Dict[str, Any] = {}
        self._plugins_cache: Dict[PluginType, Dict[str, InstalledPlugin]] = {
            plugin_type: {} for plugin_type in PluginType
        }
    
    async def initialize(self, session: AsyncSession) -> None:
        """Initialize the configuration manager.
        
        Args:
            session: Database session
        """
        if self._initialized:
            return
        
        logger.info("Initializing configuration manager")
        
        # Load configuration into cache
        configs = await get_configurations(session)
        for config in configs:
            self._config_cache[config.key] = config.get_value()
        
        # Load plugins into cache
        plugins = await get_plugins(session)
        for plugin in plugins:
            if plugin.plugin_type not in self._plugins_cache:
                self._plugins_cache[plugin.plugin_type] = {}
            self._plugins_cache[plugin.plugin_type][plugin.name] = plugin
        
        self._initialized = True
        
        logger.info(
            f"Configuration manager initialized with {len(self._config_cache)} "
            f"configuration values and {len(plugins)} plugins"
        )
    
    async def get_value(
        self, 
        session: AsyncSession, 
        key: str, 
        default: Any = None
    ) -> Any:
        """Get a configuration value.
        
        Args:
            session: Database session
            key: Configuration key
            default: Default value if the key is not found
            
        Returns:
            The configuration value or default
        """
        # Check cache first
        if key in self._config_cache:
            return self._config_cache[key]
        
        # Check database
        config = await get_configuration(session, key)
        if config:
            value = config.get_value()
            self._config_cache[key] = value
            return value
        
        return default
    
    async def set_value(
        self, 
        session: AsyncSession, 
        key: str, 
        value: Any,
        description: Optional[str] = None
    ) -> None:
        """Set a configuration value.
        
        Args:
            session: Database session
            key: Configuration key
            value: Configuration value
            description: Optional description
        """
        await set_configuration(session, key, value, description)
        self._config_cache[key] = value
    
    async def delete_value(self, session: AsyncSession, key: str) -> bool:
        """Delete a configuration value.
        
        Args:
            session: Database session
            key: Configuration key
            
        Returns:
            True if a value was deleted, False otherwise
        """
        result = await delete_configuration(session, key)
        if result and key in self._config_cache:
            del self._config_cache[key]
        return result
    
    async def get_all_values(
        self, 
        session: AsyncSession, 
        prefix: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all configuration values.
        
        Args:
            session: Database session
            prefix: Optional prefix to filter by
            
        Returns:
            Dictionary of configuration values
        """
        configs = await get_configurations(session, prefix)
        result = {}
        
        for config in configs:
            value = config.get_value()
            self._config_cache[config.key] = value
            result[config.key] = value
        
        return result
    
    async def register_plugin(
        self, 
        session: AsyncSession, 
        plugin_class: type[Plugin]
    ) -> InstalledPlugin:
        """Register a plugin in the system.
        
        Args:
            session: Database session
            plugin_class: Plugin class to register
            
        Returns:
            The registered plugin record
        """
        # Get plugin metadata
        metadata = plugin_class.get_metadata()
        
        # Register the plugin
        plugin = await create_or_update_plugin(
            session=session,
            name=metadata.name,
            version=metadata.version,
            plugin_type=metadata.plugin_type,
            description=metadata.description,
            author=metadata.author,
            homepage=metadata.homepage,
            entrypoint=f"{plugin_class.__module__}.{plugin_class.__name__}",
            is_active=True,
            capabilities=metadata.capabilities
        )
        
        # Update cache
        if plugin.plugin_type not in self._plugins_cache:
            self._plugins_cache[plugin.plugin_type] = {}
        self._plugins_cache[plugin.plugin_type][plugin.name] = plugin
        
        logger.info(f"Registered plugin: {plugin.name} ({plugin.plugin_type.value})")
        
        return plugin
    
    async def update_plugin_configuration(
        self, 
        session: AsyncSession, 
        plugin_id: UUID, 
        config: Dict[str, Any]
    ) -> Optional[InstalledPlugin]:
        """Update a plugin's configuration.
        
        Args:
            session: Database session
            plugin_id: Plugin ID
            config: New configuration
            
        Returns:
            The updated plugin record or None if the plugin was not found
        """
        plugin = await get_plugin(session, plugin_id)
        if not plugin:
            return None
        
        # Update plugin
        plugin.config = config
        await session.commit()
        
        # Update cache
        if plugin.plugin_type in self._plugins_cache:
            self._plugins_cache[plugin.plugin_type][plugin.name] = plugin
        
        return plugin
    
    async def activate_plugin(
        self, 
        session: AsyncSession, 
        plugin_id: UUID, 
        activate: bool = True
    ) -> bool:
        """Activate or deactivate a plugin.
        
        Args:
            session: Database session
            plugin_id: Plugin ID
            activate: Whether to activate (True) or deactivate (False)
            
        Returns:
            True if the plugin status was updated, False otherwise
        """
        # Get the plugin first to update cache
        plugin = await get_plugin(session, plugin_id)
        if not plugin:
            return False
        
        # Update status
        result = await update_plugin_status(session, plugin_id, activate)
        
        if result:
            # Update plugin in cache
            plugin.is_active = activate
            if plugin.plugin_type in self._plugins_cache:
                self._plugins_cache[plugin.plugin_type][plugin.name] = plugin
        
        return result
    
    async def unregister_plugin(
        self, 
        session: AsyncSession, 
        plugin_id: UUID
    ) -> bool:
        """Unregister a plugin from the system.
        
        Args:
            session: Database session
            plugin_id: Plugin ID
            
        Returns:
            True if the plugin was unregistered, False otherwise
        """
        # Get the plugin first to update cache
        plugin = await get_plugin(session, plugin_id)
        if not plugin:
            return False
        
        # Delete plugin
        result = await delete_plugin(session, plugin_id)
        
        if result:
            # Remove from cache
            if plugin.plugin_type in self._plugins_cache and plugin.name in self._plugins_cache[plugin.plugin_type]:
                del self._plugins_cache[plugin.plugin_type][plugin.name]
        
        return result
    
    async def get_active_plugins(
        self, 
        session: AsyncSession, 
        plugin_type: Optional[PluginType] = None
    ) -> List[InstalledPlugin]:
        """Get active plugins.
        
        Args:
            session: Database session
            plugin_type: Optional plugin type to filter by
            
        Returns:
            List of active plugin records
        """
        return await get_plugins(session, plugin_type, active_only=True)
    
    async def sync_plugins(self, session: AsyncSession) -> Dict[str, int]:
        """Sync plugins with the database.
        
        This method discovers all available plugins and ensures they
        are registered in the database.
        
        Args:
            session: Database session
            
        Returns:
            Dictionary with counts of plugins added, updated, and removed
        """
        # Discover all available plugins
        discover_all_plugins()
        
        from mlpie.plugins.registry import plugin_registry
        
        stats = {
            "added": 0,
            "updated": 0,
            "removed": 0
        }
        
        # Get all registered plugin classes
        all_plugin_classes = []
        for plugin_type in PluginType:
            all_plugin_classes.extend(
                plugin_registry.get_plugin_classes(plugin_type).values()
            )
        
        # Track which plugins we've seen
        seen_plugins: Set[tuple[str, PluginType]] = set()
        
        # Register each plugin
        for plugin_class in all_plugin_classes:
            metadata = plugin_class.get_metadata()
            
            seen_plugins.add((metadata.name, metadata.plugin_type))
            
            # Check if plugin is already registered
            existing = await get_plugin_by_name_and_type(
                session, metadata.name, metadata.plugin_type
            )
            
            if existing:
                # Update the plugin
                plugin = await create_or_update_plugin(
                    session=session,
                    name=metadata.name,
                    version=metadata.version,
                    plugin_type=metadata.plugin_type,
                    description=metadata.description,
                    author=metadata.author,
                    homepage=metadata.homepage,
                    entrypoint=f"{plugin_class.__module__}.{plugin_class.__name__}",
                    is_active=existing.is_active,  # Preserve active status
                    capabilities=metadata.capabilities
                )
                stats["updated"] += 1
            else:
                # Register new plugin
                plugin = await create_or_update_plugin(
                    session=session,
                    name=metadata.name,
                    version=metadata.version,
                    plugin_type=metadata.plugin_type,
                    description=metadata.description,
                    author=metadata.author,
                    homepage=metadata.homepage,
                    entrypoint=f"{plugin_class.__module__}.{plugin_class.__name__}",
                    is_active=True,
                    capabilities=metadata.capabilities
                )
                stats["added"] += 1
            
            # Update cache
            if plugin.plugin_type not in self._plugins_cache:
                self._plugins_cache[plugin.plugin_type] = {}
            self._plugins_cache[plugin.plugin_type][plugin.name] = plugin
        
        # Find plugins in database that no longer exist
        db_plugins = await get_plugins(session)
        
        for db_plugin in db_plugins:
            plugin_key = (db_plugin.name, db_plugin.plugin_type)
            
            if plugin_key not in seen_plugins:
                # Plugin no longer exists, remove it
                await delete_plugin(session, db_plugin.id)
                
                # Remove from cache
                if db_plugin.plugin_type in self._plugins_cache and db_plugin.name in self._plugins_cache[db_plugin.plugin_type]:
                    del self._plugins_cache[db_plugin.plugin_type][db_plugin.name]
                
                stats["removed"] += 1
        
        logger.info(
            f"Plugin sync completed: {stats['added']} added, "
            f"{stats['updated']} updated, {stats['removed']} removed"
        )
        
        return stats


# Singleton instance
_config_manager: Optional[ConfigurationManager] = None


@lru_cache()
def get_config_manager() -> ConfigurationManager:
    """Get the configuration manager instance.
    
    Returns:
        The configuration manager singleton instance
    """
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    
    return _config_manager


async def setup_config_manager(session: AsyncSession) -> ConfigurationManager:
    """Set up the configuration manager.
    
    Args:
        session: Database session
        
    Returns:
        The configured ConfigurationManager instance
    """
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    return config_manager 