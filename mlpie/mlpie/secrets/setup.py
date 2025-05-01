"""
Setup utilities for the secret management system.

This module provides functions to set up the secret manager based on application settings.
"""

import os
import logging
from typing import Optional

from mlpie.config import get_settings
from mlpie.secrets.factory import create_secret_manager
from mlpie.secrets.manager import SecretManager
from mlpie.secrets.exceptions import SecretError


logger = logging.getLogger(__name__)


# Global instance of the secret manager (singleton)
_secret_manager_instance: Optional[SecretManager] = None


async def setup_secret_manager() -> SecretManager:
    """Set up the secret manager based on application settings.
    
    This function creates and configures a SecretManager instance based on the
    application settings. It handles different provider types and their configurations.
    
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
        settings = get_settings()
        
        # Get the provider type from settings
        provider_type = settings.secrets.SECRETS_PROVIDER
        
        # Configure based on provider type
        if provider_type == "file":
            # Set up file-based provider
            config = {
                "file_path": str(settings.secrets.SECRETS_FILE),
            }
            
            # Use configured password if available
            if settings.secrets.SECRETS_PASSWORD:
                config["password"] = settings.secrets.SECRETS_PASSWORD
            
            logger.info(f"Setting up file-based secret provider at: {settings.secrets.SECRETS_FILE}")
            
        elif provider_type == "env":
            # Set up environment-based provider
            config = {
                "prefix": settings.secrets.ENV_PREFIX,
            }
            logger.info(f"Setting up environment-based secret provider with prefix: {settings.secrets.ENV_PREFIX}")
            
        else:
            # Default to file-based provider if unknown
            logger.warning(f"Unknown provider type: {provider_type}, defaulting to file")
            provider_type = "file"
            config = {
                "file_path": str(settings.secrets.SECRETS_FILE),
            }
        
        # Create the secret manager
        _secret_manager_instance = await create_secret_manager(
            default_provider_type=provider_type,
            default_provider_config=config,
        )
        
        logger.info(f"Secret manager initialized with provider: {provider_type}")
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