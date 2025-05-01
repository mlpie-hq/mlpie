"""
Configuration Database Models.

This module defines SQLAlchemy models for the configuration management system.
"""

import enum
import uuid
from datetime import datetime, UTC
from typing import Optional, Dict, Any

from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped

from mlpie.db.base import Base
from mlpie.plugins.base import PluginType


class ConfigValueType(str, enum.Enum):
    """Types of configuration values."""
    
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    JSON = "json"


class Configuration(Base):
    """General configuration key-value storage.
    
    This model stores configuration values that need to be persisted and
    are not tracked in Git or environment variables.
    """
    
    __tablename__ = "configurations"
    __table_args__ = {"extend_existing": True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value_type = Column(Enum(ConfigValueType), nullable=False, default=ConfigValueType.STRING)
    string_value = Column(Text, nullable=True)
    integer_value = Column(String(50), nullable=True)  # Stored as string to support large integers
    float_value = Column(String(50), nullable=True)    # Stored as string for precision
    boolean_value = Column(Boolean, nullable=True)
    json_value = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    
    def get_value(self) -> Any:
        """Get the configuration value in the appropriate type."""
        if self.value_type == ConfigValueType.STRING:
            if self.string_value == 'None':
                return None
            return self.string_value
        elif self.value_type == ConfigValueType.INTEGER:
            try:
                return int(self.integer_value) if self.integer_value is not None else None
            except ValueError:
                # Handle case where a non-integer value was stored
                if self.integer_value == 'True':
                    return True
                elif self.integer_value == 'False':
                    return False
                elif self.integer_value == 'None':
                    return None
                return self.integer_value
        elif self.value_type == ConfigValueType.FLOAT:
            try:
                return float(self.float_value) if self.float_value is not None else None
            except ValueError:
                if self.float_value == 'None':
                    return None
                return self.float_value
        elif self.value_type == ConfigValueType.BOOLEAN:
            return self.boolean_value
        elif self.value_type == ConfigValueType.JSON:
            return self.json_value
        return None
    
    def set_value(self, value: Any) -> None:
        """Set the configuration value based on its Python type."""
        # Reset all value fields
        self.string_value = None
        self.integer_value = None
        self.float_value = None
        self.boolean_value = None
        self.json_value = None
        
        # Set the appropriate field based on value type
        if isinstance(value, str):
            self.value_type = ConfigValueType.STRING
            self.string_value = value
        elif isinstance(value, int):
            self.value_type = ConfigValueType.INTEGER
            self.integer_value = str(value)
        elif isinstance(value, float):
            self.value_type = ConfigValueType.FLOAT
            self.float_value = str(value)
        elif isinstance(value, bool):
            self.value_type = ConfigValueType.BOOLEAN
            self.boolean_value = value
        elif isinstance(value, (dict, list)):
            self.value_type = ConfigValueType.JSON
            self.json_value = value
        else:
            # Default to string representation for other types
            self.value_type = ConfigValueType.STRING
            self.string_value = str(value)


class InstalledPlugin(Base):
    """Record of installed plugins in the system.
    
    This model keeps track of plugins that have been installed, their
    configurations, and whether they are currently active.
    """
    
    __tablename__ = "installed_plugins"
    __table_args__ = (
        UniqueConstraint('name', 'plugin_type', name='uq_plugin_name_type'),
        {"extend_existing": True}
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    plugin_type = Column(Enum(PluginType), nullable=False)
    description = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    homepage = Column(String(255), nullable=True)
    entrypoint = Column(String(255), nullable=True)  # Python entry point reference
    is_active = Column(Boolean, default=True, nullable=False)
    config = Column(JSON, nullable=True)  # JSON configuration
    capabilities = Column(JSON, nullable=True)  # List of capabilities
    installed_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False) 