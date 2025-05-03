"""
Interfaces for the MLPie Secret Management System.

This module defines the abstract interfaces that all secret provider implementations must follow.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union

from mlpie.secrets.exceptions import SecretError


class SecretProvider(ABC):
    """Abstract interface for secret storage providers.
    
    All secret storage backends (environment, vault, encrypted file, etc.) must implement this interface.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Get the provider name."""
        pass
    
    @property
    def schema(self) -> Dict[str, Any]:
        """Get the JSON Schema for provider configuration.
        
        This schema is used by the UI to dynamically render configuration forms.
        It follows the JSON Schema specification.
        
        Returns:
            JSON Schema object describing configuration options
        """
        return {
            "type": "object",
            "properties": {}
        }
    
    @classmethod
    def validate_config(cls, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the provider configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            Validated configuration dictionary
            
        Raises:
            SecretError: If the configuration is invalid
        """
        return config or {}
    
    @abstractmethod
    async def initialize(self):
        """Initialize the provider.
        
        This method should be called after provider instantiation to
        establish connections, load configuration, etc.
        
        Raises:
            SecretError: If initialization fails
        """
        pass
    
    @abstractmethod
    async def get_secret(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Get a secret value.
        
        Args:
            key: Secret key
            namespace: Secret namespace
            
        Returns:
            Secret value or None if not found
            
        Raises:
            SecretError: If there's an error getting the secret
        """
        pass
    
    @abstractmethod
    async def set_secret(self, key: str, value: Any, namespace: str = "default") -> bool:
        """Set a secret value.
        
        Args:
            key: Secret key
            value: Secret value (must be JSON serializable)
            namespace: Secret namespace
            
        Returns:
            True if successful
            
        Raises:
            SecretError: If there's an error setting the secret
        """
        pass
    
    @abstractmethod
    async def delete_secret(self, key: str, namespace: str = "default") -> bool:
        """Delete a secret.
        
        Args:
            key: Secret key
            namespace: Secret namespace
            
        Returns:
            True if the secret was deleted, False if it didn't exist
            
        Raises:
            SecretError: If there's an error deleting the secret
        """
        pass
    
    @abstractmethod
    async def list_secrets(self, namespace: str = "default") -> List[str]:
        """List all secret keys in the given namespace.
        
        Args:
            namespace: Secret namespace
            
        Returns:
            List of secret keys
            
        Raises:
            SecretError: If there's an error listing the secrets
        """
        pass
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to the secret provider.
        
        This method attempts to verify that the provider is properly
        configured and can be used.
        
        Returns:
            Dictionary with status information
            
        Raises:
            SecretError: If the connection test fails
        """
        try:
            # Try to list secrets to check if provider is working
            await self.list_secrets()
            return {
                "status": "success",
                "message": f"Successfully connected to {self.name} provider"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def shutdown(self):
        """Shut down the provider, closing connections and resources."""
        pass 