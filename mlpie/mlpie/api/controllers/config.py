"""
Configuration Management API Controllers.

This module provides API controllers for configuration management.
"""

from typing import Any, Optional, Dict, List
from uuid import UUID
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.connection import get_session
from mlpie.config import get_config_manager, get_root_settings
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
    RootSettingsResponse,
)
from pydantic import BaseModel, Field
from mlpie.secrets.setup import setup_secret_manager
from mlpie.utils.logger import logger


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


# Secret provider API models
class SecretProviderConfig(BaseModel):
    """Configuration for a secret provider."""
    provider: str = Field(..., description="Secret provider type (file, env, db)")
    file_path: Optional[str] = Field(None, description="Path to secrets file (for file provider)")
    encryption_password: Optional[str] = Field(None, description="Password for encryption (for file provider)")
    env_prefix: Optional[str] = Field(None, description="Environment variable prefix (for env provider)")


class ConfigResponse(BaseModel):
    """Response model for configuration operations."""
    success: bool
    message: str


class CurrentSecretConfigResponse(BaseModel):
    """Response model for current secret provider configuration."""
    provider: str
    config: Dict[str, Any]
    available_providers: List[str]


# Secret provider API endpoints
@router.get("/secrets/current", response_model=CurrentSecretConfigResponse)
async def get_current_secrets_config():
    """Get the current secret provider configuration.
    
    This endpoint returns the active secret provider type and its configuration,
    as well as the list of available providers. These settings can only be 
    changed via environment variables before application startup.
    """
    try:
        # Get provider type from env vars or settings
        settings = get_root_settings()
        
        # Get provider from environment variable or settings
        provider_type = os.environ.get(
            "MLPIE_SECRETS_PROVIDER",
            settings.secrets.SECRETS_PROVIDER or "file"
        )
        
        # Get config based on provider type
        config = {}
        
        if provider_type == "file":
            # Get file path from environment or settings
            file_path = os.environ.get(
                "MLPIE_SECRETS_FILE",
                str(settings.secrets.SECRETS_FILE)
            )
            config["file_path"] = file_path
            
        elif provider_type == "env":
            # Get prefix from environment or settings
            prefix = os.environ.get(
                "MLPIE_SECRETS_ENV_PREFIX",
                settings.secrets.ENV_PREFIX
            )
            config["env_prefix"] = prefix
            
        elif provider_type == "db":
            # No additional config needed for db provider
            pass
            
        # Get the list of available providers
        try:
            # Try to get the secret manager to get available providers
            secret_manager = await setup_secret_manager()
            available_providers = await secret_manager.get_available_providers()
        except Exception as e:
            logger.error(f"Error getting available providers: {str(e)}")
            # Fallback to default list of providers
            available_providers = ["file", "env", "db"]
        
        return {
            "provider": provider_type,
            "config": config,
            "available_providers": available_providers
        }
    except Exception as e:
        # Log the error but still return a valid response
        logger.error(f"Error getting current secrets config: {str(e)}")
        return {
            "provider": "file",
            "config": {"file_path": ""},
            "available_providers": ["file", "env", "db"]
        }


# --- Root Settings Endpoint ---

@router.get("/root", response_model=RootSettingsResponse, summary="Get Root Application Settings")
async def get_root_config():
    """Retrieve the non-sensitive root application settings."""
    try:
        config_manager = get_config_manager()
        root_settings = config_manager.get_root_settings()
        # Pydantic will automatically convert root_settings to RootSettingsResponse,
        # excluding fields not defined in the response model.
        return root_settings
    except Exception as e:
        logger.exception("Error retrieving root settings") # Log the full error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving root settings."
        )

