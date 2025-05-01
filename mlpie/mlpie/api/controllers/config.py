"""
Configuration Management API Controllers.

This module provides API controllers for configuration management.
"""

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Path

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.connection import get_session
from mlpie.config import get_config_manager
from mlpie.plugins.base import PluginType
from mlpie.api.schemas import (
    ConfigValueResponse,
    ConfigValueRequest,
    ConfigListResponse,
    StatusResponse,
    PluginResponse,
    PluginListResponse,
    PluginConfigRequest,
    PluginSyncResponse,
)


router = APIRouter(prefix="/config", tags=["Configuration"])


# Configuration API endpoints
@router.get("/values/{key}", response_model=ConfigValueResponse)
async def get_config_value(
    key: str = Path(..., description="Configuration key to retrieve"),
    session: AsyncSession = Depends(get_session)
):
    """Get a configuration value by key."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    value = await config_manager.get_value(session, key)
    
    if value is None:
        raise HTTPException(status_code=404, detail=f"Configuration not found: {key}")
    
    # Get the description from the database
    from mlpie.db.crud.config import get_configuration
    config = await get_configuration(session, key)
    
    return ConfigValueResponse(
        key=key,
        value=value,
        description=config.description if config else None
    )


@router.get("/values", response_model=ConfigListResponse)
async def list_config_values(
    prefix: Optional[str] = Query(None, description="Filter by key prefix"),
    session: AsyncSession = Depends(get_session)
):
    """List configuration values."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    values = await config_manager.get_all_values(session, prefix)
    
    return ConfigListResponse(configs=values)


@router.put("/values/{key}", response_model=StatusResponse)
async def set_config_value(
    key: str = Path(..., description="Configuration key to set"),
    config: ConfigValueRequest = None,
    session: AsyncSession = Depends(get_session)
):
    """Set a configuration value."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    await config_manager.set_value(
        session=session,
        key=key,
        value=config.value,
        description=config.description
    )
    
    return StatusResponse(
        success=True,
        message=f"Configuration value set successfully: {key}"
    )


@router.delete("/values/{key}", response_model=StatusResponse)
async def delete_config_value(
    key: str = Path(..., description="Configuration key to delete"),
    session: AsyncSession = Depends(get_session)
):
    """Delete a configuration value."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    result = await config_manager.delete_value(session, key)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Configuration not found: {key}")
    
    return StatusResponse(
        success=True,
        message=f"Configuration value deleted successfully: {key}"
    )


# Plugin API endpoints
@router.get("/plugins", response_model=PluginListResponse)
async def list_plugins(
    plugin_type: Optional[str] = Query(None, description="Filter by plugin type"),
    active_only: bool = Query(False, description="Show only active plugins"),
    session: AsyncSession = Depends(get_session)
):
    """List installed plugins."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    # Convert plugin_type string to enum if provided
    plugin_type_enum = None
    if plugin_type:
        try:
            plugin_type_enum = PluginType(plugin_type)
        except ValueError:
            valid_types = ", ".join([t.value for t in PluginType])
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid plugin type. Valid types: {valid_types}"
            )
    
    # Get plugins from database
    from mlpie.db.crud.config import get_plugins
    if active_only:
        plugins = await config_manager.get_active_plugins(session, plugin_type_enum)
    else:
        plugins = await get_plugins(session, plugin_type_enum)
    
    # Convert to response model
    plugin_responses = []
    for plugin in plugins:
        plugin_responses.append(PluginResponse(
            id=plugin.id,
            name=plugin.name,
            version=plugin.version,
            plugin_type=plugin.plugin_type.value,
            description=plugin.description,
            author=plugin.author,
            homepage=plugin.homepage,
            entrypoint=plugin.entrypoint,
            is_active=plugin.is_active,
            config=plugin.config,
            capabilities=plugin.capabilities
        ))
    
    return PluginListResponse(plugins=plugin_responses)


@router.get("/plugins/{plugin_id}", response_model=PluginResponse)
async def get_plugin(
    plugin_id: UUID = Path(..., description="Plugin ID to retrieve"),
    session: AsyncSession = Depends(get_session)
):
    """Get a plugin by ID."""
    from mlpie.db.crud.config import get_plugin
    
    plugin = await get_plugin(session, plugin_id)
    
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin not found: {plugin_id}")
    
    return PluginResponse(
        id=plugin.id,
        name=plugin.name,
        version=plugin.version,
        plugin_type=plugin.plugin_type.value,
        description=plugin.description,
        author=plugin.author,
        homepage=plugin.homepage,
        entrypoint=plugin.entrypoint,
        is_active=plugin.is_active,
        config=plugin.config,
        capabilities=plugin.capabilities
    )


@router.put("/plugins/{plugin_id}/config", response_model=StatusResponse)
async def update_plugin_config(
    plugin_id: UUID = Path(..., description="Plugin ID to update"),
    config: PluginConfigRequest = None,
    session: AsyncSession = Depends(get_session)
):
    """Update a plugin's configuration."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    plugin = await config_manager.update_plugin_configuration(
        session=session,
        plugin_id=plugin_id,
        config=config.config
    )
    
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin not found: {plugin_id}")
    
    return StatusResponse(
        success=True,
        message=f"Plugin configuration updated successfully: {plugin.name}"
    )


@router.put("/plugins/{plugin_id}/status", response_model=StatusResponse)
async def update_plugin_status(
    plugin_id: UUID = Path(..., description="Plugin ID to update"),
    activate: bool = Query(True, description="Whether to activate or deactivate the plugin"),
    session: AsyncSession = Depends(get_session)
):
    """Activate or deactivate a plugin."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    result = await config_manager.activate_plugin(
        session=session,
        plugin_id=plugin_id,
        activate=activate
    )
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Plugin not found: {plugin_id}")
    
    status = "activated" if activate else "deactivated"
    
    return StatusResponse(
        success=True,
        message=f"Plugin {status} successfully"
    )


@router.post("/plugins/sync", response_model=PluginSyncResponse)
async def sync_plugins(
    session: AsyncSession = Depends(get_session)
):
    """Synchronize available plugins with the database."""
    config_manager = get_config_manager()
    await config_manager.initialize(session)
    
    stats = await config_manager.sync_plugins(session)
    
    return PluginSyncResponse(
        added=stats["added"],
        updated=stats["updated"],
        removed=stats["removed"]
    ) 