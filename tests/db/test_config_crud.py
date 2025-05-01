"""
Tests for configuration CRUD operations.

This module tests the CRUD operations for the configuration management system.
"""

import pytest
import uuid
from typing import Dict, Any

from mlpie.db.crud.config import (
    get_configuration,
    get_configurations,
    set_configuration,
    delete_configuration,
    get_plugin,
    get_plugin_by_name_and_type,
    get_plugins,
    create_or_update_plugin,
    update_plugin_status,
    delete_plugin,
)
from mlpie.plugins.base import PluginType


# Configuration CRUD tests
@pytest.mark.asyncio
async def test_configuration_crud(test_session):
    """Test basic CRUD operations for configuration."""
    # Create a configuration
    test_key = f"test.config.{uuid.uuid4()}"
    test_value = "test_value"
    test_description = "Test configuration"
    
    config = await set_configuration(
        session=test_session,
        key=test_key,
        value=test_value,
        description=test_description,
    )
    
    assert config is not None
    assert config.key == test_key
    assert config.get_value() == test_value
    assert config.description == test_description
    
    # Read the configuration
    config_read = await get_configuration(test_session, test_key)
    assert config_read is not None
    assert config_read.key == test_key
    assert config_read.get_value() == test_value
    
    # Update the configuration
    new_value = {"key": "value", "nested": {"key2": "value2"}}
    config_updated = await set_configuration(
        session=test_session,
        key=test_key,
        value=new_value,
    )
    
    assert config_updated is not None
    assert config_updated.key == test_key
    assert config_updated.get_value() == new_value
    
    # Get multiple configurations
    configs = await get_configurations(test_session, prefix="test.config")
    assert len(configs) >= 1
    assert any(c.key == test_key for c in configs)
    
    # Delete the configuration
    deleted = await delete_configuration(test_session, test_key)
    assert deleted is True
    
    # Verify it's gone
    config_gone = await get_configuration(test_session, test_key)
    assert config_gone is None


@pytest.mark.asyncio
async def test_configuration_value_types(test_session):
    """Test storing various types of configuration values."""
    # Test different value types
    value_types = {
        "string_value": "test string",
        "int_value": 42,
        "float_value": 3.14159,
        "bool_value": True,
        "list_value": [1, 2, 3, "four", 5.0],
        "dict_value": {"key1": "value1", "key2": 2, "nested": {"inner": "value"}},
        "none_value": None,
    }
    
    # Set and verify each type
    for key, value in value_types.items():
        test_key = f"test.types.{key}.{uuid.uuid4()}"
        
        # Set the value
        config = await set_configuration(
            session=test_session,
            key=test_key,
            value=value,
        )
        
        assert config is not None
        assert config.get_value() == value
        
        # Read it back and verify
        config_read = await get_configuration(test_session, test_key)
        assert config_read is not None
        assert config_read.get_value() == value
        
        # Clean up
        await delete_configuration(test_session, test_key)


# Plugin CRUD tests
@pytest.mark.asyncio
async def test_plugin_crud(test_session):
    """Test basic CRUD operations for plugins."""
    # Create a plugin
    test_name = f"test-plugin-{uuid.uuid4()}"
    test_version = "1.0.0"
    test_type = PluginType.SECRET_PROVIDER
    test_description = "Test plugin description"
    test_config = {"key": "value"}
    test_capabilities = ["capability1", "capability2"]
    
    plugin = await create_or_update_plugin(
        session=test_session,
        name=test_name,
        version=test_version,
        plugin_type=test_type,
        description=test_description,
        config=test_config,
        capabilities=test_capabilities,
    )
    
    assert plugin is not None
    assert plugin.name == test_name
    assert plugin.version == test_version
    assert plugin.plugin_type == test_type
    assert plugin.description == test_description
    assert plugin.config == test_config
    assert plugin.capabilities == test_capabilities
    assert plugin.is_active is True
    
    # Store the plugin ID for later
    plugin_id = plugin.id
    
    # Get the plugin by ID
    plugin_by_id = await get_plugin(test_session, plugin_id)
    assert plugin_by_id is not None
    assert plugin_by_id.id == plugin_id
    
    # Get the plugin by name and type
    plugin_by_name = await get_plugin_by_name_and_type(test_session, test_name, test_type)
    assert plugin_by_name is not None
    assert plugin_by_name.id == plugin_id
    
    # Update plugin status
    updated = await update_plugin_status(test_session, plugin_id, False)
    assert updated is True
    
    # Verify status update
    plugin_updated = await get_plugin(test_session, plugin_id)
    assert plugin_updated is not None
    assert plugin_updated.is_active is False
    
    # Get all plugins
    plugins = await get_plugins(test_session)
    assert len(plugins) >= 1
    assert any(p.id == plugin_id for p in plugins)
    
    # Get plugins filtered by type
    plugins_by_type = await get_plugins(test_session, plugin_type=test_type)
    assert len(plugins_by_type) >= 1
    assert any(p.id == plugin_id for p in plugins_by_type)
    
    # Get active plugins only (should not include our deactivated plugin)
    active_plugins = await get_plugins(test_session, active_only=True)
    assert not any(p.id == plugin_id for p in active_plugins)
    
    # Delete the plugin
    deleted = await delete_plugin(test_session, plugin_id)
    assert deleted is True
    
    # Verify it's gone
    plugin_gone = await get_plugin(test_session, plugin_id)
    assert plugin_gone is None 