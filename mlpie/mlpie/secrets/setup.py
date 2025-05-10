"""
Setup utilities for the secret management system.

This module provides functions to initialize and retrieve the global SecretManager instance.
"""

import logging
from typing import Optional

from mlpie.config import get_root_settings # Use get_root_settings directly
from mlpie.secrets.manager import SecretManager
from mlpie.secrets.exceptions import SecretError
# Removed imports for FileSecretProvider, EnvSecretProvider, DatabaseSecretProvider (old)

logger = logging.getLogger(__name__)

# Global instance of the secret manager (singleton)
_secret_manager_instance: Optional[SecretManager] = None

async def setup_secret_manager() -> SecretManager:
    """
    Set up the global SecretManager instance based on application settings.
    This involves creating the SecretManager and calling its initialize method,
    which will, in turn, load and initialize the globally configured SecretProvider plugin.
    
    Returns:
        The initialized SecretManager instance.
        
    Raises:
        SecretError: If there is an error setting up the secret manager or its provider.
    """
    global _secret_manager_instance
    
    if _secret_manager_instance is not None and _secret_manager_instance._initialized:
        logger.info("Secret manager already set up and initialized.")
        return _secret_manager_instance
    
    logger.info("Setting up secret manager...")
    try:
        root_settings = get_root_settings()
        secrets_settings = root_settings.secrets # This is the SecretsSettings Pydantic model
        
        manager = SecretManager()
        initialized_ok = await manager.initialize(secrets_settings)
        
        if not initialized_ok or not manager._initialized:
            # The manager.initialize() method logs specifics about provider loading failure
            logger.error("SecretManager failed to initialize its active provider.")
            raise SecretError("Failed to initialize the active secret provider. Check logs for details.")

        _secret_manager_instance = manager
        logger.info(f"Secret manager set up successfully with provider: {manager.get_active_provider_type()}")
        return _secret_manager_instance
        
    except Exception as e:
        logger.error(f"Critical error during secret manager setup: {e}", exc_info=True)
        # Ensure instance is None if setup fails badly
        _secret_manager_instance = None 
        raise SecretError(f"Could not set up secret manager: {e}")


def get_secret_manager() -> SecretManager:
    """
    Get the global SecretManager instance.

    Assumes setup_secret_manager() has been called successfully during application bootstrap.
    
    Returns:
        The global SecretManager instance.
        
    Raises:
        SecretError: If the secret manager has not been initialized.
    """
    if _secret_manager_instance is None or not _secret_manager_instance._initialized:
        # This state should ideally not be reached if bootstrap sequence is correct.
        logger.critical("get_secret_manager() called before setup_secret_manager() or setup failed.")
        raise SecretError("SecretManager has not been initialized. Ensure setup_secret_manager() is called successfully at startup.")
    return _secret_manager_instance 