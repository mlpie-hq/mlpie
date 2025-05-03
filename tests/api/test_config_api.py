"""
Tests for configuration API endpoints.

This module tests the API endpoints for configuration management.
"""

import pytest
import uuid
import os
from fastapi import status

from mlpie.db.crud.config import set_configuration, delete_configuration


@pytest.mark.asyncio
async def test_get_config_value(async_client, test_session):
    """Test the GET /config/values/{key} endpoint."""
    # Create a test configuration
    test_key = f"test.api.{uuid.uuid4()}"
    test_value = "test_value"
    test_description = "Test from API"
    
    await set_configuration(
        session=test_session,
        key=test_key,
        value=test_value,
        description=test_description,
    )
    
    # Get the configuration via API
    response = await async_client.get(f"/config/values/{test_key}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["key"] == test_key
    assert data["value"] == test_value
    assert data["description"] == test_description
    
    # Clean up
    await delete_configuration(test_session, test_key)


@pytest.mark.asyncio
async def test_get_nonexistent_config(async_client):
    """Test getting a nonexistent configuration."""
    nonexistent_key = f"nonexistent.{uuid.uuid4()}"
    
    # Try to get a nonexistent configuration
    response = await async_client.get(f"/config/values/{nonexistent_key}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_list_config_values(async_client, test_session):
    """Test the GET /config/values endpoint."""
    # Create test configurations with a common prefix
    prefix = f"test.list.{uuid.uuid4()}"
    test_keys = [f"{prefix}.{i}" for i in range(3)]
    
    for i, key in enumerate(test_keys):
        await set_configuration(
            session=test_session,
            key=key,
            value=f"value_{i}",
        )
    
    # Get all configurations with the prefix
    response = await async_client.get(f"/config/values?prefix={prefix}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "configs" in data
    
    configs = data["configs"]
    # Each key should be in the response
    for key in test_keys:
        assert key in configs
    
    # Clean up
    for key in test_keys:
        await delete_configuration(test_session, key)


@pytest.mark.asyncio
async def test_set_config_value(async_client, test_session):
    """Test the PUT /config/values/{key} endpoint."""
    test_key = f"test.set.{uuid.uuid4()}"
    test_value = {"string": "value", "number": 42, "boolean": True}
    test_description = "Test setting via API"
    
    # Set a configuration value via API
    payload = {
        "value": test_value,
        "description": test_description
    }
    response = await async_client.put(f"/config/values/{test_key}", json=payload)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["success"] is True
    assert f"Configuration value set successfully: {test_key}" in data["message"]
    
    # Verify it was saved correctly
    get_response = await async_client.get(f"/config/values/{test_key}")
    assert get_response.status_code == status.HTTP_200_OK
    
    get_data = get_response.json()
    assert get_data["key"] == test_key
    assert get_data["value"] == test_value
    assert get_data["description"] == test_description
    
    # Clean up
    await delete_configuration(test_session, test_key)


@pytest.mark.asyncio
async def test_delete_config_value(async_client, test_session):
    """Test the DELETE /config/values/{key} endpoint."""
    # Create a test configuration
    test_key = f"test.delete.{uuid.uuid4()}"
    await set_configuration(
        session=test_session,
        key=test_key,
        value="to_be_deleted",
    )
    
    # Delete the configuration via API
    response = await async_client.delete(f"/config/values/{test_key}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["success"] is True
    assert f"Configuration value deleted successfully: {test_key}" in data["message"]
    
    # Verify it's gone
    get_response = await async_client.get(f"/config/values/{test_key}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_get_current_secrets_config(async_client):
    """Test the GET /config/secrets/current endpoint."""
    # Get the current secrets config
    response = await async_client.get("/config/secrets/current")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "provider" in data
    assert "config" in data
    assert "available_providers" in data
    
    # Check that the available providers includes the expected providers
    providers = data["available_providers"]
    assert "file" in providers
    assert "env" in providers
    # Note: "db" might not be in providers if the plugin isn't properly registered


@pytest.mark.asyncio
async def test_update_secrets_config_method_not_allowed(async_client):
    """Test the POST /config/secrets endpoint returns HTTP 405."""
    # Try to update secrets configuration
    payload = {
        "provider": "file",
        "file_path": "/path/to/secrets.yml"
    }
    response = await async_client.post("/config/secrets", json=payload)
    
    # Should return Method Not Allowed since we've made this endpoint read-only
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    # Check error message
    data = response.json()
    assert "detail" in data
    assert "environment variables" in data["detail"].lower() 