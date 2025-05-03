"""
Environment Variable Secret Provider for MLPie.

This module provides a secret provider that uses environment variables.
It's useful for containerized deployments and cloud environments.
"""

import os
import logging
from typing import Any, Dict, List, Optional

from mlpie.secrets.interfaces import SecretProvider
from mlpie.secrets.exceptions import (
    SecretError,
    SecretNotFoundError,
    SecretAccessError,
    ProviderInitializationError
)
from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin


logger = logging.getLogger(__name__)


@register_plugin
class EnvSecretProvider(SecretProvider, Plugin):
    """Environment Variable Secret Provider.
    
    This provider uses environment variables for storing secrets.
    It can be configured with an optional prefix to distinguish
    MLPie secrets from other environment variables.
    """
    
    # Plugin metadata
    metadata = PluginMetadata(
        name="env",
        version="0.1.0",
        description="Store secrets in environment variables",
        plugin_type=PluginType.SECRET_PROVIDER,
        author="MLPie Team",
        capabilities=["environment"],
    )
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the environment secret provider."""
        Plugin.__init__(self)
        self.config = config or {}
        self.prefix: str = ""
        self.initialized = False
    
    @property
    def name(self) -> str:
        """Get the provider name."""
        return "env"
    
    async def initialize(self):
        """Initialize the environment secret provider with configuration.
        
        Raises:
            ProviderInitializationError: If initialization fails
        """
        try:
            # Get the prefix, defaulting to "MLPIE_SECRET_"
            self.prefix = self.config.get("prefix", "MLPIE_SECRET_")
            
            self.initialized = True
            logger.info(f"Initialized environment secret provider with prefix: {self.prefix}")
            
        except Exception as e:
            logger.error(f"Failed to initialize environment secret provider: {str(e)}")
            raise ProviderInitializationError(f"Failed to initialize environment secret provider: {str(e)}")
    
    async def get_secret(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Retrieve a secret value by its key.
        
        Args:
            key: Unique identifier for the secret
            namespace: Secret namespace (prefixed to the key)
            
        Returns:
            str or None: The secret value if found, None otherwise
        """
        self._ensure_initialized()
        
        # Combine namespace and key
        full_key = f"{namespace}_{key}" if namespace != "default" else key
        env_var_name = self._get_env_var_name(full_key)
        return os.environ.get(env_var_name)
    
    async def set_secret(self, key: str, value: Any, namespace: str = "default") -> bool:
        """Store a secret value.
        
        Note: This method sets the environment variable for the current process only.
        It will not persist across process restarts unless the environment is saved elsewhere.
        
        Args:
            key: Unique identifier for the secret
            value: The secret value to store
            namespace: Secret namespace (prefixed to the key)
            
        Returns:
            bool: True if the secret was stored successfully
        """
        self._ensure_initialized()
        
        # Combine namespace and key
        full_key = f"{namespace}_{key}" if namespace != "default" else key
        env_var_name = self._get_env_var_name(full_key)
        
        # Convert to string if not already
        if not isinstance(value, str):
            value = str(value)
            
        os.environ[env_var_name] = value
        logger.debug(f"Set environment variable {env_var_name}")
        return True
    
    async def delete_secret(self, key: str, namespace: str = "default") -> bool:
        """Delete a secret.
        
        Args:
            key: Unique identifier for the secret to delete
            namespace: Secret namespace (prefixed to the key)
            
        Returns:
            bool: True if the secret was deleted successfully
        """
        self._ensure_initialized()
        
        # Combine namespace and key
        full_key = f"{namespace}_{key}" if namespace != "default" else key
        env_var_name = self._get_env_var_name(full_key)
        
        if env_var_name in os.environ:
            del os.environ[env_var_name]
            logger.debug(f"Deleted environment variable {env_var_name}")
            return True
        
        return False
    
    async def list_secrets(self, namespace: str = "default") -> List[str]:
        """List available secrets in the given namespace.
        
        Args:
            namespace: Secret namespace
            
        Returns:
            List[str]: List of secret keys in the namespace
        """
        self._ensure_initialized()
        
        result = []
        
        # Full prefix for environment variables
        env_prefix = self.prefix
        
        # Add the namespace if not default
        if namespace != "default":
            env_prefix = f"{env_prefix}{namespace}_"
        
        # Find all matching environment variables
        for key in os.environ:
            if key.startswith(env_prefix):
                # Remove the prefix to get the actual key
                if namespace != "default":
                    # Remove namespace_ as well
                    secret_key = key[len(env_prefix):]
                else:
                    secret_key = key[len(self.prefix):]
                result.append(secret_key)
        
        return result
    
    def _get_env_var_name(self, key: str) -> str:
        """Convert a secret key to an environment variable name.
        
        Args:
            key: The secret key
            
        Returns:
            str: The corresponding environment variable name
        """
        return f"{self.prefix}{key}"
    
    def _ensure_initialized(self) -> None:
        """Ensure the provider is initialized before use."""
        if not self.initialized:
            raise ProviderInitializationError("Environment secret provider not initialized")
            
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin."""
        # No cleanup needed for environment variables
        logger.info("Environment secret provider shutdown complete") 