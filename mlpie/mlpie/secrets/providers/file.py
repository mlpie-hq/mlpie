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
from typing import Any, Dict, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

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
class FileSecretProvider(SecretProviderInterface, Plugin):
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
    
    def __init__(self):
        """Initialize the file secret provider."""
        Plugin.__init__(self)
        self.file_path: Optional[Path] = None
        self.encryption_key: Optional[bytes] = None
        self.secrets: Dict[str, str] = {}
        self.initialized = False
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dict[str, str]: Dictionary of validation errors, empty if valid
        """
        errors = {}
        
        # Check for required file_path
        if "file_path" not in config:
            errors["file_path"] = "file_path is required"
            
        # Additional validation for file path
        file_path = config.get("file_path")
        if file_path:
            try:
                # Convert to Path object
                path = Path(file_path)
                
                # Check if directory is writable
                if path.exists() and not os.access(path, os.W_OK):
                    errors["file_path"] = "File exists but is not writable"
                elif not path.exists():
                    # Check if parent directory exists and is writable
                    parent = path.parent
                    if not parent.exists():
                        try:
                            parent.mkdir(parents=True, exist_ok=True)
                        except Exception as e:
                            errors["file_path"] = f"Cannot create directory: {str(e)}"
                    elif not os.access(parent, os.W_OK):
                        errors["file_path"] = "Parent directory is not writable"
            except Exception as e:
                errors["file_path"] = f"Invalid file path: {str(e)}"
                
        return errors
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the file secret provider with configuration.
        
        Args:
            config: Configuration dictionary with:
                - file_path: Path to the secrets file
                - password: Password for encryption (or generate one if not provided)
                - salt: Salt for key derivation (or generate one if not provided)
        
        Returns:
            bool: True if initialization was successful
        
        Raises:
            ProviderInitializationError: If initialization fails
        """
        try:
            # Store the configuration
            self.config = config
            
            # Get the file path
            file_path = config.get("file_path")
            if not file_path:
                raise ProviderInitializationError("file_path is required")
                
            self.file_path = Path(file_path)
            
            # Get or generate the password
            password = config.get("password", os.urandom(32).hex())
            
            # Get or generate the salt
            salt = config.get("salt")
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
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize file secret provider: {str(e)}")
            raise ProviderInitializationError(f"Failed to initialize file secret provider: {str(e)}")
    
    async def get_secret(self, key: str) -> Optional[str]:
        """Retrieve a secret value by its key.
        
        Args:
            key: Unique identifier for the secret
            
        Returns:
            str or None: The secret value if found, None otherwise
        
        Raises:
            SecretAccessError: If there's an error accessing the secret
        """
        self._ensure_initialized()
        
        # Refresh secrets from the file
        await self._load_secrets()
        
        try:
            return self.secrets.get(key)
        except Exception as e:
            logger.error(f"Error retrieving secret {key}: {str(e)}")
            raise SecretAccessError(f"Error retrieving secret {key}: {str(e)}")
    
    async def set_secret(self, key: str, value: str) -> bool:
        """Store a secret value.
        
        Args:
            key: Unique identifier for the secret
            value: The secret value to store
            
        Returns:
            bool: True if the secret was stored successfully
        
        Raises:
            SecretAccessError: If there's an error storing the secret
        """
        self._ensure_initialized()
        
        try:
            # Update in-memory secrets
            self.secrets[key] = value
            
            # Save to file
            await self._save_secrets()
            
            logger.debug(f"Secret {key} stored successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error storing secret {key}: {str(e)}")
            raise SecretAccessError(f"Error storing secret {key}: {str(e)}")
    
    async def delete_secret(self, key: str) -> bool:
        """Delete a secret.
        
        Args:
            key: Unique identifier for the secret to delete
            
        Returns:
            bool: True if the secret was deleted successfully
        
        Raises:
            SecretAccessError: If there's an error deleting the secret
        """
        self._ensure_initialized()
        
        try:
            # Check if the secret exists
            if key not in self.secrets:
                logger.warning(f"Secret {key} not found for deletion")
                return False
                
            # Remove from in-memory secrets
            del self.secrets[key]
            
            # Save to file
            await self._save_secrets()
            
            logger.debug(f"Secret {key} deleted successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting secret {key}: {str(e)}")
            raise SecretAccessError(f"Error deleting secret {key}: {str(e)}")
    
    async def list_secrets(self, prefix: Optional[str] = None) -> Dict[str, str]:
        """List available secrets, optionally filtered by prefix.
        
        Args:
            prefix: Optional prefix to filter keys
            
        Returns:
            dict: Dictionary of key-value pairs of secrets
        
        Raises:
            SecretAccessError: If there's an error listing secrets
        """
        self._ensure_initialized()
        
        # Refresh secrets from the file
        await self._load_secrets()
        
        try:
            if prefix:
                return {k: v for k, v in self.secrets.items() if k.startswith(prefix)}
            else:
                return dict(self.secrets)
                
        except Exception as e:
            logger.error(f"Error listing secrets: {str(e)}")
            raise SecretAccessError(f"Error listing secrets: {str(e)}")
    
    async def check_secret_exists(self, key: str) -> bool:
        """Check if a secret exists.
        
        Args:
            key: Secret key to check
            
        Returns:
            bool: True if the secret exists
        
        Raises:
            SecretAccessError: If there's an error checking for the secret
        """
        self._ensure_initialized()
        
        try:
            # Refresh secrets from the file
            await self._load_secrets()
            
            return key in self.secrets
            
        except Exception as e:
            logger.error(f"Error checking secret existence {key}: {str(e)}")
            raise SecretAccessError(f"Error checking secret existence {key}: {str(e)}")
    
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
            logger.debug(f"Loaded {len(self.secrets)} secrets from {self.file_path}")
            
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
            logger.debug(f"Saved {len(self.secrets)} secrets to {self.file_path}")
            
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