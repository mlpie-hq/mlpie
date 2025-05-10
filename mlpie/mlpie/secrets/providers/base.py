"""
Base class for Secret Provider plugins.
"""
import abc
from typing import Any, Dict, Optional

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType

class SecretProviderPlugin(Plugin, abc.ABC):
    """
    Abstract base class for all Secret Provider plugins.

    Secret providers are responsible for securely storing and retrieving
    the actual key-value bundles associated with a SecretDefinition.
    The SecretManager delegates calls to the active global provider instance.
    """

    # All SecretProviderPlugins should have this type in their metadata
    # metadata: PluginMetadata = PluginMetadata(
    #     # name, version, etc. will be overridden by concrete implementations
    #     plugin_type=PluginType.SECRET_PROVIDER 
    # )

    @abc.abstractmethod
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """
        Initialize the secret provider with its specific configuration.
        This method is called by the SecretManager when it instantiates the
        globally configured provider.

        Args:
            config: Provider-specific configuration dictionary.
        
        Returns:
            True if initialization was successful, False otherwise.
        """
        self.config = config
        self.initialized = True # Base implementation, override if complex init needed
        return True

    @abc.abstractmethod
    async def store_bundle(
        self, 
        project_identifier: str, 
        secret_name: str, 
        data: Dict[str, str]
    ) -> bool:
        """
        Store (create or update) a bundle of secret key-value pairs.

        Args:
            project_identifier: A unique identifier for the project (e.g., project.id or project.name).
            secret_name: The user-defined name of the secret bundle (from SecretDefinition).
            data: A dictionary containing the secret key-value pairs to store.
        
        Returns:
            True if the bundle was stored successfully, False otherwise.
        """
        pass

    @abc.abstractmethod
    async def retrieve_bundle(
        self, 
        project_identifier: str, 
        secret_name: str
    ) -> Optional[Dict[str, str]]:
        """
        Retrieve a bundle of secret key-value pairs.

        Args:
            project_identifier: A unique identifier for the project.
            secret_name: The user-defined name of the secret bundle.
        
        Returns:
            A dictionary containing the secret key-value pairs if found, otherwise None.
        """
        pass

    @abc.abstractmethod
    async def delete_bundle(
        self, 
        project_identifier: str, 
        secret_name: str
    ) -> bool:
        """
        Delete a bundle of secret key-value pairs.

        Args:
            project_identifier: A unique identifier for the project.
            secret_name: The user-defined name of the secret bundle.
        
        Returns:
            True if the bundle was deleted successfully or if it didn't exist, 
            False if an error occurred during deletion.
        """
        pass

    # validate_config and shutdown are inherited from the base Plugin class
    # and can be overridden if specific behavior is needed.
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Default config validation (accepts anything). Override for specific validation."""
        # TODO: Implement schema-based validation if plugin_metadata.config_schema is defined
        return {}

    async def shutdown(self) -> None:
        """Default shutdown (does nothing). Override to release resources."""
        pass 