"""
File-based Secret Provider for MLPie.

This module provides a secret provider that stores secrets in an encrypted file.
It's useful for development and testing, but for production environments,
consider using a more secure provider like HashiCorp Vault.
"""

import os
import json
import base64
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

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
class FileSecretProvider(SecretProvider, Plugin):
    """File-based Secret Provider that stores secrets in an encrypted file."""
    
    # Plugin metadata
    metadata = PluginMetadata(
        name="file",
        version="0.1.0",
        description="Store secrets in an encrypted file",
        plugin_type=PluginType.SECRET_PROVIDER,
        author="MLPie Team",
        capabilities=["storage", "encryption"],
    )
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the file secret provider."""
        Plugin.__init__(self)
        self.config = config or {}
        self.file_path: Optional[Path] = None
        self.encryption_key: Optional[bytes] = None
        self.secrets: Dict[str, Dict[str, Any]] = {}
        self.initialized = False
    
    @property
    def name(self) -> str:
        """Get the provider name."""
        return "file"
    
    @property
    def schema(self) -> Dict[str, Any]:
        """Get the schema for UI configuration."""
        return {
            "title": "File Secret Provider",
            "description": "Stores secrets in an encrypted file",
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "title": "File Path",
                    "description": "Path to the encrypted secrets file"
                },
                "password": {
                    "type": "string",
                    "title": "Encryption Password",
                    "description": "Password used for encrypting the file (generated if not provided)",
                    "format": "password"
                }
            },
            "required": ["file_path"]
        }
    
    @classmethod
    def validate_config(cls, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the provider configuration."""
        if not config:
            raise SecretError("Configuration is required")
            
        if "file_path" not in config:
            raise SecretError("file_path is required")
            
        # Validate file path
        file_path = config.get("file_path")
        try:
            path = Path(file_path)
            if path.exists() and not os.access(path, os.W_OK):
                raise SecretError("File exists but is not writable")
            
            # Check if parent directory is writable
            parent = path.parent
            if parent.exists() and not os.access(parent, os.W_OK):
                raise SecretError("Parent directory is not writable")
        except Exception as e:
            if isinstance(e, SecretError):
                raise
            raise SecretError(f"Invalid file path: {str(e)}")
            
        return config
    
    async def initialize(self):
        """Initialize the file secret provider with configuration.
        
        Raises:
            ProviderInitializationError: If initialization fails
        """
        try:
            # Get the file path
            file_path = self.config.get("file_path")
            if not file_path:
                raise ProviderInitializationError("file_path is required")
                
            self.file_path = Path(file_path)
            
            # Get or generate the password
            password = self.config.get("password", os.urandom(32).hex())
            
            # Get or generate the salt
            salt = self.config.get("salt")
            if salt:
                if isinstance(salt, str):
                    salt = salt.encode()
            else:
                salt = os.urandom(16)
                
            # Derive the encryption key
            self.encryption_key = self._derive_key(password.encode(), salt)
            
            # Load existing secrets if the file exists
            if self.file_path.exists():
                await self._load_secrets()
            else:
                # Create the directory if it doesn't exist
                self.file_path.parent.mkdir(parents=True, exist_ok=True)
                # Save an empty secrets file
                await self._save_secrets()
            
            self.initialized = True
            logger.info(f"Initialized file secret provider with file: {self.file_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize file secret provider: {str(e)}")
            raise ProviderInitializationError(f"Failed to initialize file secret provider: {str(e)}")
    
    async def get_secret(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Retrieve a secret value by its key.
        
        Args:
            key: Unique identifier for the secret
            namespace: Secret namespace
            
        Returns:
            Any or None: The secret value if found, None otherwise
        
        Raises:
            SecretAccessError: If there's an error accessing the secret
        """
        self._ensure_initialized()
        
        # Refresh secrets from the file
        await self._load_secrets()
        
        try:
            # Get the namespace dictionary
            namespace_dict = self.secrets.get(namespace, {})
            return namespace_dict.get(key)
        except Exception as e:
            logger.error(f"Error retrieving secret {key}: {str(e)}")
            raise SecretAccessError(f"Error retrieving secret {key}: {str(e)}")
    
    async def set_secret(self, key: str, value: Any, namespace: str = "default") -> bool:
        """Store a secret value.
        
        Args:
            key: Unique identifier for the secret
            value: The secret value to store (must be JSON serializable)
            namespace: Secret namespace
            
        Returns:
            bool: True if the secret was stored successfully
        
        Raises:
            SecretAccessError: If there's an error storing the secret
        """
        self._ensure_initialized()
        
        try:
            # Make sure the namespace exists
            if namespace not in self.secrets:
                self.secrets[namespace] = {}
                
            # Update in-memory secrets
            self.secrets[namespace][key] = value
            
            # Save to file
            await self._save_secrets()
            
            logger.debug(f"Secret {key} stored successfully in namespace {namespace}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing secret {key}: {str(e)}")
            raise SecretAccessError(f"Error storing secret {key}: {str(e)}")
    
    async def delete_secret(self, key: str, namespace: str = "default") -> bool:
        """Delete a secret.
        
        Args:
            key: Unique identifier for the secret to delete
            namespace: Secret namespace
            
        Returns:
            bool: True if the secret was deleted successfully
        
        Raises:
            SecretAccessError: If there's an error deleting the secret
        """
        self._ensure_initialized()
        
        try:
            # Check if the namespace exists
            if namespace not in self.secrets:
                logger.warning(f"Namespace {namespace} not found for deletion")
                return False
                
            # Check if the secret exists
            if key not in self.secrets[namespace]:
                logger.warning(f"Secret {key} not found in namespace {namespace} for deletion")
                return False
                
            # Remove from in-memory secrets
            del self.secrets[namespace][key]
            
            # Remove empty namespace
            if not self.secrets[namespace]:
                del self.secrets[namespace]
            
            # Save to file
            await self._save_secrets()
            
            logger.debug(f"Secret {key} deleted successfully from namespace {namespace}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting secret {key}: {str(e)}")
            raise SecretAccessError(f"Error deleting secret {key}: {str(e)}")
    
    async def list_secrets(self, namespace: str = "default") -> List[str]:
        """List all secret keys in the given namespace.
        
        Args:
            namespace: Secret namespace
            
        Returns:
            List[str]: List of secret keys
        
        Raises:
            SecretAccessError: If there's an error listing secrets
        """
        self._ensure_initialized()
        
        # Refresh secrets from the file
        await self._load_secrets()
        
        try:
            # Get the namespace dictionary
            namespace_dict = self.secrets.get(namespace, {})
            return list(namespace_dict.keys())
                
        except Exception as e:
            logger.error(f"Error listing secrets: {str(e)}")
            raise SecretAccessError(f"Error listing secrets: {str(e)}")
    
    async def _load_secrets(self) -> None:
        """Load secrets from the encrypted file."""
        if not self.file_path or not self.file_path.exists() or not self.encryption_key:
            self.secrets = {}
            return
            
        try:
            # Read the encrypted content
            encrypted_data = self.file_path.read_bytes()
            
            # Skip if the file is empty
            if not encrypted_data:
                self.secrets = {}
                return
                
            # Decrypt the data
            fernet = Fernet(self.encryption_key)
            decrypted_data = fernet.decrypt(encrypted_data)
            
            # Parse the JSON data
            self.secrets = json.loads(decrypted_data.decode())
            
            # Ensure the structure is correct (migrate old format if needed)
            if self.secrets and not any(isinstance(v, dict) for v in self.secrets.values()):
                # Old format was a flat dictionary, convert to namespaced
                old_secrets = self.secrets
                self.secrets = {"default": old_secrets}
            
            logger.debug(f"Loaded secrets from {self.file_path} with {len(self.secrets)} namespaces")
            
        except Exception as e:
            logger.error(f"Error loading secrets: {str(e)}")
            self.secrets = {}
    
    async def _save_secrets(self) -> None:
        """Save secrets to the encrypted file."""
        if not self.file_path or not self.encryption_key:
            logger.error("Cannot save secrets: file_path or encryption_key not set")
            return
            
        try:
            # Convert secrets to JSON
            json_data = json.dumps(self.secrets).encode()
            
            # Encrypt the data
            fernet = Fernet(self.encryption_key)
            encrypted_data = fernet.encrypt(json_data)
            
            # Write to file
            self.file_path.write_bytes(encrypted_data)
            
            total_secrets = sum(len(secrets) for secrets in self.secrets.values())
            logger.debug(f"Saved {total_secrets} secrets to {self.file_path}")
            
        except Exception as e:
            logger.error(f"Error saving secrets: {str(e)}")
    
    def _derive_key(self, password: bytes, salt: bytes) -> bytes:
        """Derive an encryption key from a password and salt.
        
        Args:
            password: Password bytes
            salt: Salt bytes
            
        Returns:
            bytes: Derived key suitable for Fernet encryption
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _ensure_initialized(self) -> None:
        """Ensure the provider is initialized before use."""
        if not self.initialized:
            raise ProviderInitializationError("File secret provider not initialized")
            
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin."""
        if self.initialized:
            await self._save_secrets()
        
        logger.info("File secret provider shutdown complete") 