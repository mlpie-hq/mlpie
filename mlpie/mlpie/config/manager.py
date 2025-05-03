"""
Configuration Management for MLPie.

This module provides a central service for accessing application settings.
"""

import logging # Keep logging for now, might be useful later
from functools import lru_cache
from typing import Optional

from .settings import get_root_settings, RootSettings


logger = logging.getLogger(__name__)


class ConfigurationManager:
    """Central service for managing MLPie configuration.
    
    This class provides access to the root application settings.
    """
    
    def __init__(self):
        """Initialize the configuration manager."""
        self.root_settings = get_root_settings()
        logger.info("Configuration manager initialized")

    def get_root_settings(self) -> RootSettings:
        """Get the root application settings.
            
        Returns:
            The root Settings object.
        """
        return self.root_settings

    # Removed all DB config and plugin methods


# Singleton instance
_config_manager: Optional[ConfigurationManager] = None


@lru_cache()
def get_config_manager() -> ConfigurationManager:
    """Get the configuration manager instance.
    
    Returns:
        The configuration manager singleton instance
    """
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    
    return _config_manager


async def setup_config_manager() -> ConfigurationManager:
    """Set up the configuration manager.
        
    Returns:
        The configured ConfigurationManager instance
    """
    # Ensure the singleton is created
    config_manager = get_config_manager()
    return config_manager 