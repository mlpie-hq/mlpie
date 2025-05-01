"""
Base Plugin System for MLPie.

This module defines the core interfaces and base classes for MLPie's plugin system.
All plugins in the system inherit from these base classes to ensure consistent behavior.
"""

import abc
import logging
from enum import Enum
from typing import Any, ClassVar, Dict, List, Optional, Type, TypeVar, Union

from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)


class PluginType(str, Enum):
    """Enumeration of supported plugin types in the MLPie platform."""
    
    SECRET_PROVIDER = "secret_provider"
    GIT_PROVIDER = "git_provider"
    DATABASE_PROVIDER = "database_provider"
    STORAGE_PROVIDER = "storage_provider"
    MODEL_REGISTRY = "model_registry"
    WORKFLOW_ENGINE = "workflow_engine"
    NOTIFICATION = "notification"
    AUTHENTICATION = "authentication"
    METRICS = "metrics"
    CUSTOM = "custom"


class PluginMetadata(BaseModel):
    """Metadata for a plugin, describing its capabilities and requirements."""
    
    # Basic plugin information
    name: str = Field(..., description="Unique name of the plugin")
    version: str = Field(..., description="Version of the plugin")
    description: str = Field("", description="Description of what the plugin does")
    plugin_type: PluginType = Field(..., description="Type of plugin")
    
    # Author and support information
    author: str = Field("", description="Author of the plugin")
    author_email: str = Field("", description="Email of the plugin author")
    homepage: str = Field("", description="Homepage or repository URL for the plugin")
    
    # Plugin dependencies and requirements
    requires: Dict[str, str] = Field(
        default_factory=dict,
        description="Required dependencies with version constraints"
    )
    
    # Plugin capabilities and features
    capabilities: List[str] = Field(
        default_factory=list,
        description="List of capabilities provided by this plugin"
    )
    
    # Configuration schema
    config_schema: Optional[Dict[str, Any]] = Field(
        None, 
        description="JSON Schema for plugin configuration"
    )


# Generic type for plugin classes
T = TypeVar('T', bound='Plugin')


class Plugin(abc.ABC):
    """Base class for all MLPie plugins.
    
    All plugins must inherit from this class and implement the required methods.
    """
    
    # Class variable for plugin metadata
    metadata: ClassVar[PluginMetadata]
    
    def __init__(self):
        """Initialize the plugin."""
        self.initialized: bool = False
        self.config: Dict[str, Any] = {}
    
    @abc.abstractmethod
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.
        
        Args:
            config: Configuration dictionary for the plugin
            
        Returns:
            bool: True if initialization was successful
        """
        pass
    
    @classmethod
    def get_metadata(cls) -> PluginMetadata:
        """Get the plugin metadata.
        
        Returns:
            PluginMetadata: Metadata for the plugin
        """
        if not hasattr(cls, 'metadata'):
            raise ValueError(f"Plugin class {cls.__name__} must define 'metadata' class variable")
        
        return cls.metadata
    
    @abc.abstractmethod
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the provided configuration against the plugin's requirements.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dict[str, str]: Dictionary of validation errors, empty if valid
        """
        pass
    
    @abc.abstractmethod
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin.
        
        This method should release any resources held by the plugin.
        """
        pass


# Decorator to register a plugin class
def register_plugin(plugin_class: Type[T]) -> Type[T]:
    """Decorator to register a plugin class with the plugin system.
    
    Args:
        plugin_class: The plugin class to register
        
    Returns:
        The plugin class (unchanged)
    """
    from mlpie.plugins.registry import plugin_registry
    
    # Register the plugin with the registry
    plugin_registry.register_plugin_class(plugin_class)
    
    return plugin_class 