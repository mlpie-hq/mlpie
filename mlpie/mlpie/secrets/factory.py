"""
Factory functions for creating secret providers.

This module provides helper functions to easily create and configure secret providers.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from mlpie.secrets.manager import SecretManager
from mlpie.secrets.interfaces import SecretProviderInterface
from mlpie.secrets.providers.file import FileSecretProvider
from mlpie.secrets.providers.env import EnvSecretProvider
from mlpie.secrets.exceptions import ProviderNotFoundError


logger = logging.getLogger(__name__)

# Registry of available provider types
PROVIDER_REGISTRY = {
    "file": FileSecretProvider,
    "env": EnvSecretProvider,
}


async def create_provider(
    provider_type: str, 
    config: Optional[Dict[str, Any]] = None
) -> SecretProviderInterface:
    """Create a secret provider of the specified type.
    
    Args:
        provider_type: Type of provider to create (e.g., "file", "env")
        config: Configuration for the provider
        
    Returns:
        SecretProviderInterface: Initialized provider
        
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
    provider = provider_class()
    await provider.initialize(config)
    
    return provider


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


async def create_secret_manager(
    default_provider_type: str = "file",
    default_provider_config: Optional[Dict[str, Any]] = None,
    additional_providers: Optional[Dict[str, Dict[str, Any]]] = None
) -> SecretManager:
    """Create and configure a secret manager.
    
    Args:
        default_provider_type: Type of the default provider
        default_provider_config: Configuration for the default provider
        additional_providers: Dictionary mapping provider names to their configurations
        
    Returns:
        SecretManager: Initialized secret manager
    """
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
    config = {
        "default_provider": default_provider_type,
        "providers": providers_config
    }
    
    # Initialize manager first
    await manager.initialize(config)
    
    # Create and register the default provider
    default_provider = await create_provider(default_provider_type, default_provider_config)
    await manager.register_provider(
        default_provider_type, 
        default_provider, 
        default_provider_config,
        make_default=True
    )
    
    # Register additional providers if specified
    if additional_providers:
        for name, config in additional_providers.items():
            provider_config = config.copy()
            provider_type = provider_config.pop("type", name)
            provider = await create_provider(provider_type, provider_config)
            await manager.register_provider(name, provider, provider_config)
    
    return manager 