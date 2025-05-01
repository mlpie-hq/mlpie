"""
Interfaces for the MLPie Secret Management System.

This module defines the abstract interfaces that all secret provider implementations must follow.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union


class SecretProviderInterface(ABC):
    """Abstract interface for secret storage providers.
    
    All secret storage backends (environment, vault, encrypted file, etc.) must implement this interface.
    """
    
    @abstractmethod
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the secret provider with configuration.
        
        Args:
            config: Provider-specific configuration
            
        Returns:
            bool: True if initialization was successful
        """
        pass
        
    @abstractmethod
    async def get_secret(self, key: str) -> Optional[str]:
        """Retrieve a secret value by its key.
        
        Args:
            key: Unique identifier for the secret
            
        Returns:
            str or None: The secret value if found, None otherwise
        """
        pass
        
    @abstractmethod
    async def set_secret(self, key: str, value: str) -> bool:
        """Store a secret value.
        
        Args:
            key: Unique identifier for the secret
            value: The secret value to store
            
        Returns:
            bool: True if the secret was stored successfully
        """
        pass
        
    @abstractmethod
    async def delete_secret(self, key: str) -> bool:
        """Delete a secret.
        
        Args:
            key: Unique identifier for the secret to delete
            
        Returns:
            bool: True if the secret was deleted successfully
        """
        pass
        
    @abstractmethod
    async def list_secrets(self, prefix: Optional[str] = None) -> Dict[str, str]:
        """List available secrets, optionally filtered by prefix.
        
        Args:
            prefix: Optional prefix to filter keys
            
        Returns:
            dict: Dictionary of key-value pairs of secrets
        """
        pass
        
    @abstractmethod
    async def check_secret_exists(self, key: str) -> bool:
        """Check if a secret exists.
        
        Args:
            key: Secret key to check
            
        Returns:
            bool: True if the secret exists
        """
        pass 