"""
Secret Manager for the MLPie platform.

This module provides a central manager for handling secrets through the plugin system.
It leverages plugins of type SECRET_PROVIDER for storage backends.
"""

import logging
from typing import Any, Dict, List, Optional, Type, Union

from mlpie.plugins import (
    Plugin, 
    PluginType, 
    create_plugin, 
    plugin_registry,
    discover_all_plugins
)
from mlpie.secrets.exceptions import (
    SecretError, 
    ProviderNotFoundError, 
    SecretNotFoundError,
    ProviderExistsError
)
from mlpie.secrets.interfaces import SecretProvider


logger = logging.getLogger(__name__)


class SecretManager:
    """Central manager for handling secrets across different storage backends.
    
    This class provides a unified interface for storing and retrieving secrets
    regardless of the underlying storage mechanism, using the plugin system.
    """
    
    def __init__(self):
        """Initialize the secret manager."""
        self.default_provider: Optional[str] = None
        self._initialized = False
        self._providers = {}
        self._config = {}
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the secret manager with configuration.
        
        Args:
            config: Dictionary containing:
                - default_provider: Name of the default provider to use
                - providers: Dictionary mapping provider names to their configurations
                
        Returns:
            bool: True if initialization was successful
        """
        if self._initialized:
            return True
            
        try:
            # Ensure plugins are discovered
            discover_all_plugins()
            
            # Get the default provider name
            self.default_provider = config.get("default_provider")
            if not self.default_provider:
                logger.warning("No default provider specified in configuration")
                
                # Try to find a suitable default provider from available plugins
                provider_classes = plugin_registry.get_plugin_classes(PluginType.SECRET_PROVIDER)
                if provider_classes:
                    self.default_provider = next(iter(provider_classes.keys()))
                    logger.info(f"Using '{self.default_provider}' as default provider")
                else:
                    logger.error("No secret provider plugins available")
                    return False
            
            # Store the configuration
            self._config = config
            
            # Register all available providers in the registry first
            for provider_type in plugin_registry.get_plugin_classes(PluginType.SECRET_PROVIDER):
                logger.info(f"Found provider type: {provider_type}")
            
            self._initialized = True
            logger.info(f"Secret manager initialized with default provider: {self.default_provider}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize secret manager: {str(e)}")
            return False
    
    async def _ensure_initialized(self) -> None:
        """Ensure the manager is initialized before use.
        
        Raises:
            SecretError: If the manager is not initialized
        """
        if not self._initialized:
            raise SecretError("Secret manager not initialized")
    
    async def _get_provider(self, provider_name: Optional[str] = None) -> Plugin:
        """Get a provider plugin instance.
        
        Args:
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            Plugin: The provider plugin instance
            
        Raises:
            ProviderNotFoundError: If the provider is not found
        """
        await self._ensure_initialized()
        
        # Use the default provider if none specified
        name = provider_name or self.default_provider
        if not name:
            raise ProviderNotFoundError("No provider specified and no default provider set")
            
        try:
            # Get provider configuration
            providers_config = self._config.get("providers", {})
            provider_config = providers_config.get(name, {})
            
            # Create the plugin if it doesn't exist yet
            provider = None
            try:
                provider = await plugin_registry.get_plugin(PluginType.SECRET_PROVIDER, name)
            except:
                # Create the provider with configuration
                logger.info(f"Creating provider {name} with config: {provider_config}")
                provider = await create_plugin(
                    PluginType.SECRET_PROVIDER,
                    name,
                    provider_config
                )
            
            if not provider:
                raise ProviderNotFoundError(f"Failed to create provider '{name}'")
                
            return provider
            
        except Exception as e:
            logger.error(f"Failed to get provider '{name}': {str(e)}")
            raise ProviderNotFoundError(f"Failed to get provider '{name}': {str(e)}")
    
    async def get_secret(self, key: str, provider_name: Optional[str] = None) -> Optional[str]:
        """Get a secret from the specified provider or the default provider.
        
        Args:
            key: The secret key to retrieve
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            str or None: The secret value if found, None otherwise
            
        Raises:
            ProviderNotFoundError: If the specified provider does not exist
        """
        provider = await self._get_provider(provider_name)
        return await provider.get_secret(key)
    
    async def set_secret(self, key: str, value: str, provider_name: Optional[str] = None) -> bool:
        """Set a secret in the specified provider or the default provider.
        
        Args:
            key: The secret key to set
            value: The secret value to store
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            bool: True if the secret was stored successfully
            
        Raises:
            ProviderNotFoundError: If the specified provider does not exist
        """
        provider = await self._get_provider(provider_name)
        return await provider.set_secret(key, value)
    
    async def delete_secret(self, key: str, provider_name: Optional[str] = None) -> bool:
        """Delete a secret from the specified provider or the default provider.
        
        Args:
            key: The secret key to delete
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            bool: True if the secret was deleted successfully
            
        Raises:
            ProviderNotFoundError: If the specified provider does not exist
        """
        provider = await self._get_provider(provider_name)
        return await provider.delete_secret(key)
    
    async def list_secrets(
        self, 
        prefix: Optional[str] = None, 
        provider_name: Optional[str] = None
    ) -> Dict[str, str]:
        """List secrets from the specified provider or the default provider.
        
        Args:
            prefix: Optional prefix to filter keys
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            dict: Dictionary of key-value pairs of secrets
            
        Raises:
            ProviderNotFoundError: If the specified provider does not exist
        """
        provider = await self._get_provider(provider_name)
        secrets = await provider.list_secrets(prefix)
        return secrets
    
    async def check_secret_exists(self, key: str, provider_name: Optional[str] = None) -> bool:
        """Check if a secret exists in the specified provider or the default provider.
        
        Args:
            key: The secret key to check
            provider_name: Optional provider name to use, defaults to the default provider
            
        Returns:
            bool: True if the secret exists
            
        Raises:
            ProviderNotFoundError: If the specified provider does not exist
        """
        provider = await self._get_provider(provider_name)
        return await provider.check_secret_exists(key)
    
    async def get_available_providers(self) -> List[str]:
        """Get a list of available secret provider names.
        
        Returns:
            List[str]: List of provider names
        """
        try:
            provider_classes = plugin_registry.get_plugin_classes(PluginType.SECRET_PROVIDER)
            return list(provider_classes.keys())
        except Exception as e:
            logger.error(f"Error getting available providers: {str(e)}")
            return ["file", "env", "db"]  # Return defaults as fallback
    
    async def shutdown(self) -> None:
        """Shut down all provider instances."""
        # Let the plugin registry handle plugin shutdown
        if hasattr(plugin_registry, 'shutdown_all'):
            await plugin_registry.shutdown_all()

    async def register_provider(
        self,
        name: str,
        provider: SecretProvider,
        config: Dict[str, Any],
        make_default: bool = False
    ):
        """Register a new provider with the manager.
        
        Args:
            name: Name to register the provider under
            provider: Provider instance
            config: Provider configuration
            make_default: Whether to make this the default provider
            
        Raises:
            ProviderExistsError: If a provider with the same name already exists
        """
        await self._ensure_initialized()
        
        # Store the provider and its configuration
        if name in self._providers:
            raise ProviderExistsError(f"Provider '{name}' already exists")
            
        self._providers[name] = provider
        self._config.setdefault("providers", {})[name] = config
        
        # Update the default provider if requested
        if make_default:
            self.default_provider = name
            self._config["default_provider"] = name
            
        logger.info(f"Registered secret provider '{name}'") 