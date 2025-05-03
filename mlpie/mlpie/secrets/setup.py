"""
Setup utilities for the secret management system.

This module provides functions to set up the secret manager based on application settings.
"""

import os
import logging
from typing import Optional, Dict, Any

from mlpie.config import get_config_manager
from mlpie.secrets.factory import create_secret_manager
from mlpie.secrets.manager import SecretManager
from mlpie.secrets.exceptions import SecretError
from mlpie.secrets.providers.file import FileSecretProvider
from mlpie.secrets.providers.env import EnvSecretProvider
from mlpie.secrets.providers.db import DatabaseSecretProvider


logger = logging.getLogger(__name__)


# Global instance of the secret manager (singleton)
_secret_manager_instance: Optional[SecretManager] = None


async def setup_secret_manager() -> SecretManager:
    """Set up the secret manager based on application settings.
    
    This function creates and configures a SecretManager instance based on the
    application settings and environment variables. It handles different provider 
    types and their configurations.
    
    Environment variables take precedence over configuration settings:
    - MLPIE_SECRETS_PROVIDER: Type of secret provider (file, env, db)
    - MLPIE_SECRETS_FILE: Path to secrets file (for file provider)
    - MLPIE_SECRETS_PASSWORD: Password for secrets (for file provider)
    - MLPIE_SECRETS_ENV_PREFIX: Prefix for env vars (for env provider)
    
    Returns:
        SecretManager: Configured secret manager
        
    Raises:
        SecretError: If there is an error setting up the secret manager
    """
    global _secret_manager_instance
    
    # Return existing instance if available
    if _secret_manager_instance is not None:
        return _secret_manager_instance
    
    try:
        settings = get_config_manager().get_root_settings()
        
        # Get the provider type from environment or settings
        provider_type = os.environ.get(
            "MLPIE_SECRETS_PROVIDER",
            settings.secrets.SECRETS_PROVIDER
        )
        
        # Prepare configuration for all providers
        providers_config = {}
        
        # Setup file provider config
        file_path = os.environ.get(
            "MLPIE_SECRETS_FILE",
            str(settings.secrets.SECRETS_FILE)
        )
        password = os.environ.get(
            "MLPIE_SECRETS_PASSWORD",
            settings.secrets.SECRETS_PASSWORD
        )
        
        providers_config["file"] = {
            "file_path": file_path
        }
        if password:
            providers_config["file"]["password"] = password
            
        # Setup env provider config
        prefix = os.environ.get(
            "MLPIE_SECRETS_ENV_PREFIX",
            settings.secrets.ENV_PREFIX
        )
        
        providers_config["env"] = {
            "prefix": prefix
        }
        
        # Setup db provider config
        db_config = {}
        encryption_key = os.environ.get(
            "MLPIE_SECRETS_ENCRYPTION_KEY",
            getattr(settings.secrets, "SECRETS_ENCRYPTION_KEY", None)
        )
        
        if encryption_key:
            db_config["encryption_key"] = encryption_key
            
        db_password = os.environ.get(
            "MLPIE_SECRETS_PASSWORD",
            settings.secrets.SECRETS_PASSWORD
        )
        
        if db_password:
            db_config["password"] = db_password
            salt = os.environ.get(
                "MLPIE_SECRETS_SALT",
                getattr(settings.secrets, "SECRETS_SALT", None)
            )
            if salt:
                db_config["salt"] = salt
                
        providers_config["db"] = db_config
        
        # Log which provider is being set up
        if provider_type == "file":
            logger.info(f"Setting up file-based secret provider at: {file_path}")
        elif provider_type == "env":
            logger.info(f"Setting up environment-based secret provider with prefix: {prefix}")
        elif provider_type == "db":
            logger.info("Setting up database-based secret provider")
        else:
            # Default to file-based provider if unknown
            logger.warning(f"Unknown provider type: {provider_type}, defaulting to file")
            provider_type = "file"
        
        # Create the secret manager with complete configuration in one step
        _secret_manager_instance = await create_secret_manager({
            "default_provider": provider_type,
            "providers": providers_config
        })
        
        return _secret_manager_instance
        
    except Exception as e:
        logger.error(f"Error setting up secret manager: {str(e)}")
        raise SecretError(f"Failed to set up secret manager: {str(e)}")


def get_secret_manager() -> SecretManager:
    """Get the global secret manager instance, initializing it if necessary.
    
    Returns:
        SecretManager: The global secret manager instance
        
    Raises:
        SecretError: If there is an error getting the secret manager
    """
    global _secret_manager_instance
    
    # Simply return the instance if it exists
    # This function should not be async as it's just retrieving an existing instance
    if _secret_manager_instance is None:
        logger.warning("Secret manager not initialized - this should be set up first")
        raise SecretError("Secret manager not initialized. Call setup_secret_manager() first")
        
    return _secret_manager_instance 