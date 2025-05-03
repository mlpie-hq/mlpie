"""
Factory functions for creating secret providers.

This module provides helper functions to easily create and configure secret providers.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from mlpie.secrets.manager import SecretManager
from mlpie.secrets.interfaces import SecretProvider
from mlpie.secrets.providers.file import FileSecretProvider
from mlpie.secrets.providers.env import EnvSecretProvider
from mlpie.secrets.providers.db import DatabaseSecretProvider
from mlpie.secrets.exceptions import ProviderNotFoundError


logger = logging.getLogger(__name__)

# Registry of available provider types
PROVIDER_REGISTRY = {
    "file": FileSecretProvider,
    "env": EnvSecretProvider,
    "db": DatabaseSecretProvider,
}


async def create_provider(
    provider_type: str, 
    config: Optional[Dict[str, Any]] = None
) -> SecretProvider:
    """Create a secret provider of the specified type.
    
    Args:
        provider_type: Type of provider to create (e.g., "file", "env")
        config: Configuration for the provider
        
    Returns:
        SecretProvider: Initialized provider
        
    Raises:
        ProviderNotFoundError: If the provider type is not found
    """
    if config is None:
        config = {}
        
    # Get the provider class
    provider_class = PROVIDER_REGISTRY.get(provider_type)
    if provider_class is None:
        raise ProviderNotFoundError(f"Secret provider type '{provider_type}' not found")
        
    # Create and initialize the provider
    try:
        logger.info(f"Creating provider of type {provider_type} with config: {config}")
        provider = provider_class(config)
        await provider.initialize()
        return provider
    except Exception as e:
        logger.error(f"Failed to create provider '{provider_type}': {str(e)}")
        raise ProviderNotFoundError(f"Failed to create provider '{provider_type}': {str(e)}")


async def create_file_provider(
    file_path: Union[str, Path],
    password: Optional[str] = None,
    salt: Optional[Union[str, bytes]] = None
) -> FileSecretProvider:
    """Create a file-based secret provider.
    
    Args:
        file_path: Path to the secrets file
        password: Optional password for encryption (if not provided, a random one will be generated)
        salt: Optional salt for key derivation (if not provided, a random one will be generated)
        
    Returns:
        FileSecretProvider: Initialized file provider
    """
    config = {
        "file_path": str(file_path),
    }
    
    if password:
        config["password"] = password
        
    if salt:
        config["salt"] = salt
        
    provider = await create_provider("file", config)
    return provider


async def create_env_provider(prefix: str = "MLPIE_SECRET_") -> EnvSecretProvider:
    """Create an environment variable-based secret provider.
    
    Args:
        prefix: Prefix for environment variables
        
    Returns:
        EnvSecretProvider: Initialized environment provider
    """
    config = {
        "prefix": prefix,
    }
    
    provider = await create_provider("env", config)
    return provider


async def create_db_provider(
    encryption_key: Optional[str] = None,
    password: Optional[str] = None,
    salt: Optional[str] = None
) -> DatabaseSecretProvider:
    """Create a database-based secret provider.
    
    Args:
        encryption_key: Base64-encoded encryption key
        password: Password for deriving an encryption key (if key not provided)
        salt: Salt for key derivation (if password provided)
        
    Returns:
        DatabaseSecretProvider: Initialized database provider
    """
    config = {}
    
    if encryption_key:
        config["encryption_key"] = encryption_key
        
    if password:
        config["password"] = password
        
    if salt:
        config["salt"] = salt
    
    provider = await create_provider("db", config)
    return provider


async def create_secret_manager(
    config_or_provider_type: Union[Dict[str, Any], str] = "file",
    default_provider_config: Optional[Dict[str, Any]] = None,
    additional_providers: Optional[Dict[str, Dict[str, Any]]] = None
) -> SecretManager:
    """Create and configure a secret manager.
    
    This function can be called in two ways:
    1. With a full configuration dictionary: create_secret_manager({"default_provider": "file", "providers": {...}})
    2. With separate arguments: create_secret_manager("file", {"file_path": "..."}, {...})
    
    Args:
        config_or_provider_type: Either a complete config dict or the default provider type string
        default_provider_config: Configuration for the default provider (used only if first arg is a string)
        additional_providers: Dictionary mapping provider names to their configurations (used only if first arg is a string)
        
    Returns:
        SecretManager: Initialized secret manager
    """
    try:
        # Check if first argument is a complete configuration dictionary
        if isinstance(config_or_provider_type, dict):
            config = config_or_provider_type
            default_provider_type = config.get("default_provider", "file")
            providers_config = config.get("providers", {})
        else:
            # Use legacy argument style
            default_provider_type = config_or_provider_type
            if default_provider_config is None:
                default_provider_config = {}
                
            # Prepare provider configurations for manager initialization
            providers_config = {default_provider_type: default_provider_config}
            
            # Add additional provider configs
            if additional_providers:
                for name, config in additional_providers.items():
                    providers_config[name] = config.copy()
        
        # Create the manager
        manager = SecretManager()
        
        # Initialize the manager with all provider configurations
        manager_config = {
            "default_provider": default_provider_type,
            "providers": providers_config
        }
        
        # Initialize manager
        await manager.initialize(manager_config)
        
        # Create all providers and register them with the manager
        try:
            # Register the default provider first
            default_config = providers_config.get(default_provider_type, {})
            default_provider = await create_provider(default_provider_type, default_config)
            await manager.register_provider(
                default_provider_type, 
                default_provider, 
                default_config,
                make_default=True
            )
            
            # Register all other providers
            for name, config in providers_config.items():
                if name == default_provider_type:
                    continue  # Already registered
                    
                try:
                    provider = await create_provider(name, config)
                    await manager.register_provider(name, provider, config)
                except Exception as e:
                    logger.error(f"Error registering provider '{name}': {str(e)}")
                    # Continue with other providers
        except Exception as e:
            logger.error(f"Error registering providers: {str(e)}")
            # We'll still return the initialized manager
        
        logger.info(f"Created secret manager with default provider '{default_provider_type}'")
        return manager
        
    except Exception as e:
        logger.error(f"Error creating secret manager: {str(e)}")
        raise e 