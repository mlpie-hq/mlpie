"""
Secrets Configuration Service.

This module provides functionality for managing secrets configuration,
including provider selection and configuration management.
"""

import logging
from typing import Dict, List, Optional

from mlpie.config.settings import get_root_settings
from mlpie.secrets.setup import setup_secret_manager


logger = logging.getLogger(__name__)


class SecretsConfigService:
    """Service for managing secrets configuration."""

    def __init__(self):
        """Initialize the secrets configuration service."""
        self.settings = get_root_settings()

    async def get_current_config(self) -> Dict:
        """Get the current secrets configuration.
        
        This includes the active provider type, its configuration,
        and the list of available providers.
        
        Returns:
            Dict containing:
                - provider: Current provider type
                - config: Provider-specific configuration
                - available_providers: List of available providers
        """
        try:
            # Get provider type from settings
            provider_type = self.settings.secrets.PROVIDER
            
            # Get config based on provider type
            config = await self._get_provider_config(provider_type)
            
            # Get available providers
            available_providers = await self._get_available_providers()
            
            return {
                "provider": provider_type,
                "config": config,
                "available_providers": available_providers
            }
        except Exception as e:
            logger.error(f"Error getting current secrets config: {str(e)}")
            return {
                "provider": "file",
                "config": {"file_path": ""},
                "available_providers": ["file", "env", "db"]
            }

    async def _get_provider_config(self, provider_type: str) -> Dict:
        """Get configuration for the specified provider type.
        
        Args:
            provider_type: Type of secret provider
            
        Returns:
            Provider-specific configuration
        """
        config = {}
        
        if provider_type == "file":
            config["file_path"] = str(self.settings.secrets.FILE_PATH)
            if self.settings.secrets.PASSWORD:
                config["password"] = self.settings.secrets.PASSWORD
            
        elif provider_type == "env":
            config["env_prefix"] = self.settings.secrets.ENV_PREFIX
            
        elif provider_type == "db":
            if self.settings.secrets.ENCRYPTION_KEY:
                config["encryption_key"] = self.settings.secrets.ENCRYPTION_KEY
            if self.settings.secrets.PASSWORD:
                config["password"] = self.settings.secrets.PASSWORD
            if self.settings.secrets.SALT:
                config["salt"] = self.settings.secrets.SALT
            
        return config

    async def _get_available_providers(self) -> List[str]:
        """Get list of available secret providers.
        
        Returns:
            List of provider names
        """
        try:
            # Try to get the secret manager to get available providers
            secret_manager = await setup_secret_manager()
            return await secret_manager.get_available_providers()
        except Exception as e:
            logger.error(f"Error getting available providers: {str(e)}")
            # Fallback to default list of providers
            return ["file", "env", "db"]


# Global instance
_secrets_config_service: Optional[SecretsConfigService] = None


def get_secrets_config_service() -> SecretsConfigService:
    """Get the global secrets configuration service instance.
    
    Returns:
        SecretsConfigService instance
    """
    global _secrets_config_service
    if _secrets_config_service is None:
        _secrets_config_service = SecretsConfigService()
    return _secrets_config_service 