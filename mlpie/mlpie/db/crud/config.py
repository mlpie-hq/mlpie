"""
CRUD Operations for Configuration Management.

This module provides database operations for the configuration management system.
"""

import logging
from typing import Any, Dict, List, Optional, Union, TypeVar, Type, cast
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from mlpie.db.models.config import Configuration, ConfigValueType, InstalledPlugin
from mlpie.plugins.base import PluginType


logger = logging.getLogger(__name__)

# Type variable for configuration models
T = TypeVar('T', bound=Union[Configuration, InstalledPlugin])


# Configuration CRUD operations
async def get_configuration(
    session: AsyncSession, 
    key: str
) -> Optional[Configuration]:
    """Get a configuration value by key.
    
    Args:
        session: Database session
        key: Configuration key to retrieve
        
    Returns:
        Configuration object if found, None otherwise
    """
    result = await session.execute(
        select(Configuration).where(Configuration.key == key)
    )
    return result.scalars().first()


async def get_configurations(
    session: AsyncSession, 
    prefix: Optional[str] = None
) -> List[Configuration]:
    """Get multiple configuration values.
    
    Args:
        session: Database session
        prefix: Optional prefix to filter by (e.g., 'database.')
        
    Returns:
        List of Configuration objects
    """
    query = select(Configuration)
    
    if prefix:
        query = query.where(Configuration.key.startswith(prefix))
    
    result = await session.execute(query)
    return result.scalars().all()


async def set_configuration(
    session: AsyncSession, 
    key: str, 
    value: Any, 
    description: Optional[str] = None,
    commit: bool = True
) -> Configuration:
    """Set a configuration value.
    
    Args:
        session: Database session
        key: Configuration key
        value: Configuration value
        description: Optional description of the configuration
        commit: Whether to commit the transaction
        
    Returns:
        The created or updated Configuration object
    """
    config = await get_configuration(session, key)
    
    if config is None:
        # Create new configuration
        config = Configuration(key=key, description=description)
        session.add(config)
    
    # Set value with appropriate type
    config.set_value(value)
    
    if description is not None:
        config.description = description
    
    if commit:
        await session.commit()
    
    return config


async def delete_configuration(
    session: AsyncSession, 
    key: str, 
    commit: bool = True
) -> bool:
    """Delete a configuration value.
    
    Args:
        session: Database session
        key: Configuration key to delete
        commit: Whether to commit the transaction
        
    Returns:
        True if a configuration was deleted, False otherwise
    """
    result = await session.execute(
        delete(Configuration).where(Configuration.key == key)
    )
    
    if commit:
        await session.commit()
    
    return result.rowcount > 0


# InstalledPlugin CRUD operations
async def get_plugin(
    session: AsyncSession, 
    plugin_id: UUID
) -> Optional[InstalledPlugin]:
    """Get a plugin by ID.
    
    Args:
        session: Database session
        plugin_id: Plugin UUID
        
    Returns:
        InstalledPlugin object if found, None otherwise
    """
    result = await session.execute(
        select(InstalledPlugin).where(InstalledPlugin.id == plugin_id)
    )
    return result.scalars().first()


async def get_plugin_by_name_and_type(
    session: AsyncSession, 
    name: str, 
    plugin_type: PluginType
) -> Optional[InstalledPlugin]:
    """Get a plugin by name and type.
    
    Args:
        session: Database session
        name: Plugin name
        plugin_type: Plugin type
        
    Returns:
        InstalledPlugin object if found, None otherwise
    """
    result = await session.execute(
        select(InstalledPlugin).where(
            InstalledPlugin.name == name,
            InstalledPlugin.plugin_type == plugin_type
        )
    )
    return result.scalars().first()


async def get_plugins(
    session: AsyncSession, 
    plugin_type: Optional[PluginType] = None,
    active_only: bool = False
) -> List[InstalledPlugin]:
    """Get multiple plugins.
    
    Args:
        session: Database session
        plugin_type: Optional plugin type to filter by
        active_only: Whether to return only active plugins
        
    Returns:
        List of InstalledPlugin objects
    """
    query = select(InstalledPlugin)
    
    if plugin_type:
        query = query.where(InstalledPlugin.plugin_type == plugin_type)
    
    if active_only:
        query = query.where(InstalledPlugin.is_active == True)
    
    query = query.order_by(InstalledPlugin.name)
    
    result = await session.execute(query)
    return result.scalars().all()


async def create_or_update_plugin(
    session: AsyncSession, 
    name: str, 
    version: str, 
    plugin_type: PluginType, 
    description: Optional[str] = None,
    author: Optional[str] = None,
    homepage: Optional[str] = None,
    entrypoint: Optional[str] = None,
    is_active: bool = True,
    config: Optional[Dict[str, Any]] = None,
    capabilities: Optional[List[str]] = None,
    commit: bool = True
) -> InstalledPlugin:
    """Create or update a plugin.
    
    Args:
        session: Database session
        name: Plugin name
        version: Plugin version
        plugin_type: Plugin type
        description: Optional plugin description
        author: Optional plugin author
        homepage: Optional plugin homepage URL
        entrypoint: Optional Python entry point reference
        is_active: Whether the plugin is active
        config: Optional plugin configuration
        capabilities: Optional list of plugin capabilities
        commit: Whether to commit the transaction
        
    Returns:
        The created or updated InstalledPlugin object
    """
    # Check if plugin already exists
    plugin = await get_plugin_by_name_and_type(session, name, plugin_type)
    
    if plugin is None:
        # Create new plugin
        plugin = InstalledPlugin(
            name=name,
            version=version,
            plugin_type=plugin_type,
            description=description,
            author=author,
            homepage=homepage,
            entrypoint=entrypoint,
            is_active=is_active,
            config=config,
            capabilities=capabilities or []
        )
        session.add(plugin)
    else:
        # Update existing plugin
        plugin.version = version
        if description is not None:
            plugin.description = description
        if author is not None:
            plugin.author = author
        if homepage is not None:
            plugin.homepage = homepage
        if entrypoint is not None:
            plugin.entrypoint = entrypoint
        plugin.is_active = is_active
        if config is not None:
            plugin.config = config
        if capabilities is not None:
            plugin.capabilities = capabilities
    
    if commit:
        await session.commit()
    
    return plugin


async def update_plugin_status(
    session: AsyncSession, 
    plugin_id: UUID, 
    is_active: bool, 
    commit: bool = True
) -> bool:
    """Update a plugin's active status.
    
    Args:
        session: Database session
        plugin_id: Plugin UUID
        is_active: New active status
        commit: Whether to commit the transaction
        
    Returns:
        True if the plugin was updated, False otherwise
    """
    result = await session.execute(
        update(InstalledPlugin)
        .where(InstalledPlugin.id == plugin_id)
        .values(is_active=is_active)
    )
    
    if commit:
        await session.commit()
    
    return result.rowcount > 0


async def delete_plugin(
    session: AsyncSession, 
    plugin_id: UUID, 
    commit: bool = True
) -> bool:
    """Delete a plugin.
    
    Args:
        session: Database session
        plugin_id: Plugin UUID
        commit: Whether to commit the transaction
        
    Returns:
        True if the plugin was deleted, False otherwise
    """
    result = await session.execute(
        delete(InstalledPlugin).where(InstalledPlugin.id == plugin_id)
    )
    
    if commit:
        await session.commit()
    
    return result.rowcount > 0


async def delete_plugin_by_name_and_type(
    session: AsyncSession, 
    name: str, 
    plugin_type: PluginType, 
    commit: bool = True
) -> bool:
    """Delete a plugin by name and type.
    
    Args:
        session: Database session
        name: Plugin name
        plugin_type: Plugin type
        commit: Whether to commit the transaction
        
    Returns:
        True if the plugin was deleted, False otherwise
    """
    result = await session.execute(
        delete(InstalledPlugin).where(
            InstalledPlugin.name == name,
            InstalledPlugin.plugin_type == plugin_type
        )
    )
    
    if commit:
        await session.commit()
    
    return result.rowcount > 0 