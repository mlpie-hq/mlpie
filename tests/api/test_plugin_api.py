"""
Tests for plugin API endpoints.

This module tests the API endpoints for plugin management.
"""

import pytest
import uuid
from fastapi import status

from mlpie.db.crud.config import (
    create_or_update_plugin, 
    delete_plugin, 
    get_plugin_by_name_and_type
)
from mlpie.plugins.base import PluginType


@pytest.mark.asyncio
async def test_list_plugins(async_client, test_session):
    """Test the GET /config/plugins endpoint."""
    # Create test plugins
    test_plugin_count = 3
    test_name_prefix = f"test-plugin-list-{uuid.uuid4()}"
    plugins = []
    
    for i in range(test_plugin_count):
        plugin = await create_or_update_plugin(
            session=test_session,
            name=f"{test_name_prefix}-{i}",
            version=f"1.0.{i}",
            plugin_type=PluginType.SECRET_PROVIDER,
            description=f"Test plugin {i}",
        )
        plugins.append(plugin)
    
    # Get all plugins
    response = await async_client.get("/config/plugins")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "plugins" in data
    
    # Should have at least our test plugins
    assert len(data["plugins"]) >= test_plugin_count
    
    # Verify our test plugins are included
    plugin_ids = [p.id for p in plugins]
    for plugin_data in data["plugins"]:
        if uuid.UUID(plugin_data["id"]) in plugin_ids:
            assert plugin_data["plugin_type"] == PluginType.SECRET_PROVIDER.value
            assert plugin_data["name"].startswith(test_name_prefix)
    
    # Clean up
    for plugin in plugins:
        await delete_plugin(test_session, plugin.id)


@pytest.mark.asyncio
async def test_get_plugin(async_client, test_session):
    """Test the GET /config/plugins/{plugin_id} endpoint."""
    # Create a test plugin
    test_name = f"test-plugin-get-{uuid.uuid4()}"
    test_version = "1.2.3"
    test_type = PluginType.SECRET_PROVIDER
    test_description = "Test plugin for GET endpoint"
    
    plugin = await create_or_update_plugin(
        session=test_session,
        name=test_name,
        version=test_version,
        plugin_type=test_type,
        description=test_description,
    )
    
    # Get the plugin via API
    response = await async_client.get(f"/config/plugins/{plugin.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert str(plugin.id) == data["id"]
    assert test_name == data["name"]
    assert test_version == data["version"]
    assert test_type.value == data["plugin_type"]
    assert test_description == data["description"]
    
    # Clean up
    await delete_plugin(test_session, plugin.id)


@pytest.mark.asyncio
async def test_get_nonexistent_plugin(async_client):
    """Test getting a nonexistent plugin."""
    nonexistent_id = uuid.uuid4()
    
    # Try to get a nonexistent plugin
    response = await async_client.get(f"/config/plugins/{nonexistent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_plugin_config(async_client, test_session):
    """Test the PUT /config/plugins/{plugin_id}/config endpoint."""
    # Create a test plugin
    test_name = f"test-plugin-config-{uuid.uuid4()}"
    test_plugin = await create_or_update_plugin(
        session=test_session,
        name=test_name,
        version="1.0.0",
        plugin_type=PluginType.SECRET_PROVIDER,
        config={"initial": "config"},
    )
    
    # Update the plugin config via API
    new_config = {
        "updated": "configuration",
        "nested": {
            "value": 123,
            "flag": True
        }
    }
    
    response = await async_client.put(
        f"/config/plugins/{test_plugin.id}/config",
        json={"config": new_config}
    )
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["success"] is True
    
    # Verify the config was updated
    plugin_response = await async_client.get(f"/config/plugins/{test_plugin.id}")
    plugin_data = plugin_response.json()
    assert plugin_data["config"] == new_config
    
    # Clean up
    await delete_plugin(test_session, test_plugin.id)


@pytest.mark.asyncio
async def test_update_plugin_status(async_client, test_session):
    """Test the PUT /config/plugins/{plugin_id}/status endpoint."""
    # Create a test plugin (active by default)
    test_name = f"test-plugin-status-{uuid.uuid4()}"
    test_plugin = await create_or_update_plugin(
        session=test_session,
        name=test_name,
        version="1.0.0",
        plugin_type=PluginType.SECRET_PROVIDER,
    )
    
    # Deactivate the plugin
    response = await async_client.put(
        f"/config/plugins/{test_plugin.id}/status?activate=false"
    )
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["success"] is True
    assert "deactivated successfully" in data["message"]
    
    # Verify the status was updated
    plugin_response = await async_client.get(f"/config/plugins/{test_plugin.id}")
    plugin_data = plugin_response.json()
    assert plugin_data["is_active"] is False
    
    # Activate the plugin again
    response = await async_client.put(
        f"/config/plugins/{test_plugin.id}/status?activate=true"
    )
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["success"] is True
    assert "activated successfully" in data["message"]
    
    # Verify the status was updated
    plugin_response = await async_client.get(f"/config/plugins/{test_plugin.id}")
    plugin_data = plugin_response.json()
    assert plugin_data["is_active"] is True
    
    # Clean up
    await delete_plugin(test_session, test_plugin.id)


@pytest.mark.asyncio
async def test_sync_plugins(async_client, test_session):
    """Test the POST /config/plugins/sync endpoint."""
    # This endpoint is more complex to test properly as it depends on the actual
    # plugin discovery mechanism and installed plugins. We'll just test that the
    # endpoint responds correctly.
    
    response = await async_client.post("/config/plugins/sync")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "added" in data
    assert "updated" in data
    assert "removed" in data
    assert isinstance(data["added"], int)
    assert isinstance(data["updated"], int)
    assert isinstance(data["removed"], int) 