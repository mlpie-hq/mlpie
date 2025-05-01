"""
Environment Variable Secret Provider for MLPie.

This module provides a secret provider that uses environment variables.
It's useful for containerized deployments and cloud environments.
"""

import os
import logging
from typing import Any, Dict, Optional

from mlpie.secrets.interfaces import SecretProviderInterface
from mlpie.secrets.exceptions import (
    SecretError,
    SecretNotFoundError,
    SecretAccessError,
    ProviderInitializationError
)
from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin


logger = logging.getLogger(__name__)


@register_plugin
class EnvSecretProvider(SecretProviderInterface, Plugin):
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
    
    def __init__(self):
        """Initialize the environment secret provider."""
        Plugin.__init__(self)
        self.prefix: str = ""
        self.initialized = False
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dict[str, str]: Dictionary of validation errors, empty if valid
        """
        # No validation needed for environment provider
        return {}
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the environment secret provider with configuration.
        
        Args:
            config: Configuration dictionary with optional keys:
                - prefix: Prefix for environment variable names (default: "MLPIE_SECRET_")
        
        Returns:
            bool: True if initialization was successful
        """
        try:
            # Store the configuration
            self.config = config
            
            # Get the prefix, defaulting to "MLPIE_SECRET_"
            self.prefix = config.get("prefix", "MLPIE_SECRET_")
            
            self.initialized = True
            logger.info(f"Initialized environment secret provider with prefix: {self.prefix}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize environment secret provider: {str(e)}")
            raise ProviderInitializationError(f"Failed to initialize environment secret provider: {str(e)}")
    
    async def get_secret(self, key: str) -> Optional[str]:
        """Retrieve a secret value by its key.
        
        Args:
            key: Unique identifier for the secret
            
        Returns:
            str or None: The secret value if found, None otherwise
        """
        self._ensure_initialized()
        
        env_var_name = self._get_env_var_name(key)
        return os.environ.get(env_var_name)
    
    async def set_secret(self, key: str, value: str) -> bool:
        """Store a secret value.
        
        Note: This method sets the environment variable for the current process only.
        It will not persist across process restarts unless the environment is saved elsewhere.
        
        Args:
            key: Unique identifier for the secret
            value: The secret value to store
            
        Returns:
            bool: True if the secret was stored successfully
        """
        self._ensure_initialized()
        
        env_var_name = self._get_env_var_name(key)
        os.environ[env_var_name] = value
        logger.debug(f"Set environment variable {env_var_name}")
        return True
    
    async def delete_secret(self, key: str) -> bool:
        """Delete a secret.
        
        Args:
            key: Unique identifier for the secret to delete
            
        Returns:
            bool: True if the secret was deleted successfully
        """
        self._ensure_initialized()
        
        env_var_name = self._get_env_var_name(key)
        
        if env_var_name in os.environ:
            del os.environ[env_var_name]
            logger.debug(f"Deleted environment variable {env_var_name}")
            return True
        
        return False
    
    async def list_secrets(self, prefix: Optional[str] = None) -> Dict[str, str]:
        """List available secrets, optionally filtered by prefix.
        
        Args:
            prefix: Optional prefix to filter keys
            
        Returns:
            dict: Dictionary of key-value pairs of secrets
        """
        self._ensure_initialized()
        
        result = {}
        
        # Full prefix for environment variables
        env_prefix = self.prefix
        
        # Add the additional prefix if specified
        if prefix:
            env_prefix = f"{env_prefix}{prefix}"
        
        # Find all matching environment variables
        for key, value in os.environ.items():
            if key.startswith(env_prefix):
                # Remove the prefix to get the actual key
                secret_key = key[len(self.prefix):]
                result[secret_key] = value
        
        return result
    
    async def check_secret_exists(self, key: str) -> bool:
        """Check if a secret exists.
        
        Args:
            key: Secret key to check
            
        Returns:
            bool: True if the secret exists
        """
        self._ensure_initialized()
        
        env_var_name = self._get_env_var_name(key)
        return env_var_name in os.environ
    
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