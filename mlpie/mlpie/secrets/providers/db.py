"""
Database Secret Provider.

This module implements a secret provider that stores secrets in the database.
Secrets are encrypted with a key provided at bootstrap.
"""

import logging
import json
import os
from typing import Any, Dict, List, Optional
import base64

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.connection import get_session
from mlpie.secrets.exceptions import SecretError
from mlpie.secrets.interfaces import SecretProvider
from mlpie.db.models.secrets import DatabaseSecret


logger = logging.getLogger(__name__)


class DatabaseSecretProvider(SecretProvider):
    """Secret provider that stores secrets in the database.
    
    Secrets are stored encrypted in the database using a key derived from
    a master password provided during initialization.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the database secret provider.
        
        Args:
            config: Configuration dictionary with optional parameters:
                - encryption_key: Base64-encoded encryption key
                - password: Password to derive an encryption key (if key not provided)
                - salt: Salt for key derivation (if password provided)
        
        If neither encryption_key nor password is provided, a random key will be generated.
        """
        self.config = config or {}
        self._cipher = None
        self._session_factory = None
        self._init_encryption()
    
    def _init_encryption(self):
        """Initialize the encryption cipher."""
        if "encryption_key" in self.config:
            # Use provided encryption key
            try:
                key = base64.urlsafe_b64decode(self.config["encryption_key"])
                self._cipher = Fernet(key)
                logger.info("Database secret provider initialized with provided encryption key")
            except Exception as e:
                raise SecretError(f"Invalid encryption key: {str(e)}")
        elif "password" in self.config:
            # Derive key from password
            password = self.config["password"].encode()
            salt = base64.urlsafe_b64decode(self.config.get("salt", "")) if "salt" in self.config else os.urandom(16)
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            self._cipher = Fernet(key)
            
            # Store derived key
            self.config["encryption_key"] = key.decode()
            self.config["salt"] = base64.urlsafe_b64encode(salt).decode()
            
            logger.info("Database secret provider initialized with password-derived key")
        else:
            # Generate random key
            key = Fernet.generate_key()
            self._cipher = Fernet(key)
            self.config["encryption_key"] = key.decode()
            logger.info("Database secret provider initialized with randomly generated key")
    
    async def initialize(self):
        """Initialize the database provider and establish connection."""
        try:
            self._session_factory = get_session
            logger.info("Database secret provider initialized")
        except Exception as e:
            error_msg = f"Failed to initialize database secret provider: {str(e)}"
            logger.error(error_msg)
            raise SecretError(error_msg) from e
    
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
        validated = config.copy() if config else {}
        
        # Check encryption key if provided
        if "encryption_key" in validated:
            try:
                key = base64.urlsafe_b64decode(validated["encryption_key"])
                if len(key) != 32:
                    raise SecretError("Encryption key must be 32 bytes long")
            except Exception as e:
                raise SecretError(f"Invalid encryption key: {str(e)}")
        
        return validated
    
    @property
    def name(self) -> str:
        """Get the provider name."""
        return "db"
    
    @property
    def schema(self) -> Dict[str, Any]:
        """Get the schema for UI configuration."""
        return {
            "title": "Database Secret Provider",
            "description": "Stores secrets encrypted in the database",
            "type": "object",
            "properties": {
                "password": {
                    "type": "string",
                    "title": "Encryption Password",
                    "description": "Password used to derive encryption key",
                    "format": "password"
                },
                "encryption_key": {
                    "type": "string",
                    "title": "Encryption Key",
                    "description": "Base64-encoded 32-byte key for encryption (generated if not provided)",
                }
            }
        }
    
    async def get_secret(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Get a secret from the database.
        
        Args:
            key: Secret key
            namespace: Secret namespace
            
        Returns:
            Secret value or None if not found
            
        Raises:
            SecretError: If there's an error reading the secret
        """
        if not self._session_factory:
            raise SecretError("Database provider not initialized")
        
        try:
            async with self._session_factory() as session:
                secret_record = await self._get_secret_record(session, key, namespace)
                if not secret_record:
                    return None
                
                # Decrypt the value
                try:
                    decrypted = self._cipher.decrypt(secret_record.encrypted_value.encode())
                    return json.loads(decrypted)
                except Exception as e:
                    raise SecretError(f"Error decrypting secret {key}: {str(e)}")
        except Exception as e:
            if not isinstance(e, SecretError):
                error_msg = f"Error retrieving secret {key}: {str(e)}"
                logger.error(error_msg)
                raise SecretError(error_msg) from e
            raise
    
    async def set_secret(self, key: str, value: Any, namespace: str = "default") -> bool:
        """Store a secret in the database.
        
        Args:
            key: Secret key
            value: Secret value (must be JSON serializable)
            namespace: Secret namespace
            
        Returns:
            True if successful
            
        Raises:
            SecretError: If there's an error storing the secret
        """
        if not self._session_factory:
            raise SecretError("Database provider not initialized")
        
        try:
            # Serialize and encrypt the value
            serialized = json.dumps(value)
            encrypted = self._cipher.encrypt(serialized.encode())
            
            async with self._session_factory() as session:
                # Check if the secret already exists
                secret_record = await self._get_secret_record(session, key, namespace)
                
                if secret_record:
                    # Update existing secret
                    secret_record.encrypted_value = encrypted.decode()
                else:
                    # Create new secret
                    secret_record = DatabaseSecret(
                        key=key,
                        namespace=namespace,
                        encrypted_value=encrypted.decode()
                    )
                    session.add(secret_record)
                
                await session.commit()
                return True
        except Exception as e:
            error_msg = f"Error setting secret {key}: {str(e)}"
            logger.error(error_msg)
            raise SecretError(error_msg) from e
    
    async def delete_secret(self, key: str, namespace: str = "default") -> bool:
        """Delete a secret from the database.
        
        Args:
            key: Secret key
            namespace: Secret namespace
            
        Returns:
            True if the secret was deleted, False if it didn't exist
            
        Raises:
            SecretError: If there's an error deleting the secret
        """
        if not self._session_factory:
            raise SecretError("Database provider not initialized")
        
        try:
            async with self._session_factory() as session:
                secret_record = await self._get_secret_record(session, key, namespace)
                
                if not secret_record:
                    logger.warning(f"Secret {key} not found for deletion")
                    return False
                
                await session.delete(secret_record)
                await session.commit()
                return True
        except Exception as e:
            error_msg = f"Error deleting secret {key}: {str(e)}"
            logger.error(error_msg)
            raise SecretError(error_msg) from e
    
    async def list_secrets(self, namespace: str = "default") -> List[str]:
        """List all secret keys in the given namespace.
        
        Args:
            namespace: Secret namespace
            
        Returns:
            List of secret keys
            
        Raises:
            SecretError: If there's an error listing the secrets
        """
        if not self._session_factory:
            raise SecretError("Database provider not initialized")
        
        try:
            async with self._session_factory() as session:
                query = select(DatabaseSecret.key).where(DatabaseSecret.namespace == namespace)
                result = await session.execute(query)
                return [row[0] for row in result]
        except Exception as e:
            error_msg = f"Error listing secrets: {str(e)}"
            logger.error(error_msg)
            raise SecretError(error_msg) from e
    
    async def _get_secret_record(self, session: AsyncSession, key: str, namespace: str) -> Optional[DatabaseSecret]:
        """Get a secret record from the database.
        
        Args:
            session: Database session
            key: Secret key
            namespace: Secret namespace
            
        Returns:
            Secret record or None if not found
        """
        query = select(DatabaseSecret).where(
            DatabaseSecret.key == key,
            DatabaseSecret.namespace == namespace
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    async def shutdown(self):
        """Shut down the database secret provider."""
        self._session_factory = None
        logger.info("Database secret provider shutdown complete") 