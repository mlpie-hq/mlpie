"""
Tests for the SecretManager class.
"""

import os
import uuid
import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock

from mlpie.secrets.manager import SecretManager
from mlpie.plugins import PluginType
from mlpie.secrets.exceptions import (
    SecretError, 
    ProviderNotFoundError
)


@pytest.fixture
def temp_dir():
    """Fixture to create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
async def manager():
    """Fixture for creating and initializing a SecretManager with file provider."""
    # Create UUID-based paths in the current directory
    uid = str(uuid.uuid4())
    temp_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with file provider
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(temp_file),
                    "password": "test-password"
                },
                "env": {
                    "prefix": f"MLPIE_TEST_{uid}_"
                }
            }
        })
        
        assert result is True
        yield manager
        
    finally:
        # Clean up environment variables
        for key in list(os.environ.keys()):
            if key.startswith(f"MLPIE_TEST_{uid}_"):
                del os.environ[key]
        
        # Make sure the file provider is shut down before we clean up
        try:
            await manager.shutdown()
        except:
            pass
            
        # Clean up the temporary file
        if temp_file.exists():
            temp_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_initialization():
    """Test manager initialization."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with configuration
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                }
            }
        })
        
        assert result is True
        assert manager._initialized is True
        assert manager.default_provider == "file"
        
        # Clean up
        await manager.shutdown()
    finally:
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_no_default_provider():
    """Test manager with no default provider specified."""
    # First ensure plugins are discovered
    from mlpie.plugins.discovery import discover_all_plugins
    discover_all_plugins()
    
    manager = SecretManager()
    
    # Initialize without specifying a default provider
    # It should use the first available provider
    result = await manager.initialize({
        "providers": {}
    })
    
    assert result is True
    assert manager.default_provider is not None
    
    # Clean up
    await manager.shutdown()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_set_secret():
    """Test setting and getting secrets through the manager."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with file provider
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                }
            }
        })
        
        assert result is True
        
        # Set a secret using the default provider
        key = "test-key"
        value = "test-value"
        result = await manager.set_secret(key, value)
        assert result is True
        
        # Get the secret back
        retrieved_value = await manager.get_secret(key)
        assert retrieved_value == value
        
        # Try with non-existent key
        non_existent = await manager.get_secret("non-existent")
        assert non_existent is None
        
        # Clean up
        await manager.shutdown()
    finally:
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_secret():
    """Test deleting secrets through the manager."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with file provider
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                }
            }
        })
        
        assert result is True
        
        # Set a secret
        key = "test-delete-key"
        value = "test-delete-value"
        await manager.set_secret(key, value)
        
        # Verify it exists
        assert await manager.check_secret_exists(key) is True
        
        # Delete the secret
        result = await manager.delete_secret(key)
        assert result is True
        
        # Verify it's gone
        assert await manager.check_secret_exists(key) is False
        assert await manager.get_secret(key) is None
        
        # Clean up
        await manager.shutdown()
    finally:
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_list_secrets():
    """Test listing secrets through the manager."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with file provider
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                }
            }
        })
        
        assert result is True
        
        # Add several secrets with different prefixes
        await manager.set_secret("prefix1:key1", "value1")
        await manager.set_secret("prefix1:key2", "value2")
        await manager.set_secret("prefix2:key1", "value3")
        
        # List all secrets
        all_secrets = await manager.list_secrets()
        assert len(all_secrets) == 3
        
        # List secrets with prefix
        prefix1_secrets = await manager.list_secrets("prefix1:")
        assert len(prefix1_secrets) == 2
        assert "prefix1:key1" in prefix1_secrets
        assert "prefix1:key2" in prefix1_secrets
        
        # Clean up
        await manager.shutdown()
    finally:
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_multiple_providers():
    """Test using multiple providers."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    env_prefix = f"MLPIE_TEST_{uid}_"
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with multiple providers
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                },
                "env": {
                    "prefix": env_prefix
                }
            }
        })
        
        assert result is True
        
        # Set secrets in different providers
        await manager.set_secret("file-secret", "file-value", provider_name="file")
        await manager.set_secret("env-secret", "env-value", provider_name="env")
        
        # Get secrets from specific providers
        assert await manager.get_secret("file-secret", provider_name="file") == "file-value"
        assert await manager.get_secret("env-secret", provider_name="env") == "env-value"
        
        # Default provider should be used when not specified
        assert await manager.get_secret("file-secret") == "file-value"
        
        # The secret should only exist in its specific provider
        assert await manager.get_secret("env-secret", provider_name="file") is None
        assert await manager.get_secret("file-secret", provider_name="env") is None
        
        # Clean up
        await manager.shutdown()
    finally:
        # Clean up environment variables
        for key in list(os.environ.keys()):
            if key.startswith(env_prefix):
                del os.environ[key]
        
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_available_providers():
    """Test getting available providers."""
    # Create UUID-based path in the current directory
    uid = str(uuid.uuid4())
    secrets_file = Path(f"./test_secrets_{uid}.dat")
    
    try:
        # Create manager
        manager = SecretManager()
        
        # Initialize with file provider
        result = await manager.initialize({
            "default_provider": "file",
            "providers": {
                "file": {
                    "file_path": str(secrets_file),
                    "password": "test-password"
                },
                "env": {
                    "prefix": f"MLPIE_TEST_{uid}_"
                }
            }
        })
        
        assert result is True
        
        providers = await manager.get_available_providers()
        assert "file" in providers
        assert "env" in providers
        
        # Clean up
        await manager.shutdown()
    finally:
        # Remove the temporary file
        if secrets_file.exists():
            secrets_file.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handling():
    """Test error handling in the manager."""
    manager = SecretManager()
    
    # Test operations on uninitialized manager
    with pytest.raises(SecretError):
        await manager.get_secret("key")
    
    # Initialize the manager
    await manager.initialize({
        "default_provider": "file",
        "providers": {}
    })
    
    # Test with non-existent provider
    with pytest.raises(ProviderNotFoundError):
        await manager.get_secret("key", provider_name="non-existent")
    
    # Clean up
    await manager.shutdown()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_with_mocked_provider():
    """Test manager with a mocked provider."""
    # Create mock provider (use AsyncMock for async methods)
    mock_provider = AsyncMock()
    mock_provider.get_secret.return_value = "mocked-value"
    mock_provider.set_secret.return_value = True
    mock_provider.check_secret_exists.return_value = True
    mock_provider.list_secrets.return_value = {"test1": "value1", "test2": "value2"}
    mock_provider.initialize.return_value = True
    
    # Class-level metadata for mock plugin
    mock_metadata = MagicMock()
    mock_metadata.name = "mock"
    mock_metadata.plugin_type = PluginType.SECRET_PROVIDER
    
    # Create a mock class for the plugin registry
    mock_plugin_class = MagicMock()
    mock_plugin_class.get_metadata.return_value = mock_metadata
    
    with patch("mlpie.secrets.manager.plugin_registry") as mock_registry, \
         patch("mlpie.secrets.manager.create_plugin") as mock_create_plugin, \
         patch("mlpie.secrets.manager.discover_all_plugins") as mock_discover:
         
        # Mock the plugin discovery to return our mock provider
        mock_discover.return_value = {PluginType.SECRET_PROVIDER: {"mock": mock_plugin_class}}
        mock_registry.get_plugin_classes.return_value = {"mock": mock_plugin_class}
        
        # Use AsyncMock for the async method
        mock_registry.get_plugin = AsyncMock()
        mock_registry.get_plugin.return_value = mock_provider
        
        mock_create_plugin.return_value = mock_provider
        
        # Create and initialize the manager
        manager = SecretManager()
        result = await manager.initialize({
            "default_provider": "mock",
            "providers": {"mock": {}}
        })
        
        assert result is True
        
        # Test operations
        assert await manager.get_secret("test-key") == "mocked-value"
        assert await manager.set_secret("test-key", "test-value") is True
        assert await manager.check_secret_exists("test-key") is True
        assert await manager.list_secrets() == {"test1": "value1", "test2": "value2"} 