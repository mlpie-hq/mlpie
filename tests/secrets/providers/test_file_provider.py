"""
Tests for the file-based secret provider.
"""

import os
import json
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch

from mlpie.secrets.providers.file import FileSecretProvider
from mlpie.secrets.exceptions import ProviderInitializationError


@pytest.fixture
def temp_secrets_file():
    """Fixture to create a temporary file for test secrets."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp_path = Path(tmp.name)
    
    yield tmp_path
    
    # Cleanup
    if tmp_path.exists():
        tmp_path.unlink()


@pytest.fixture
async def provider(temp_secrets_file):
    """Fixture for creating and initializing a FileSecretProvider."""
    provider = FileSecretProvider()
    
    # Initialize with a test password for predictable encryption
    await provider.initialize({
        "file_path": str(temp_secrets_file),
        "password": "test-password",
        "salt": "test-salt"
    })
    
    yield provider
    
    # Cleanup
    await provider.shutdown()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_initialization(temp_secrets_file):
    """Test provider initialization."""
    provider = FileSecretProvider()
    
    # Test initialization with valid configuration
    result = await provider.initialize({
        "file_path": str(temp_secrets_file),
        "password": "test-password"
    })
    
    assert result is True
    assert provider.initialized is True
    assert provider.file_path == temp_secrets_file
    assert provider.encryption_key is not None
    
    # Check if secrets file was created
    assert temp_secrets_file.exists()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_validate_config():
    """Test configuration validation."""
    provider = FileSecretProvider()
    
    # Test with missing file_path
    errors = await provider.validate_config({})
    assert "file_path" in errors
    
    # Test with valid file_path
    with tempfile.TemporaryDirectory() as tmp_dir:
        valid_path = Path(tmp_dir) / "secrets.dat"
        errors = await provider.validate_config({"file_path": str(valid_path)})
        assert not errors


@pytest.mark.unit
@pytest.mark.asyncio
async def test_set_and_get_secret(provider):
    """Test setting and getting secrets."""
    # Set a secret
    key = "test-key"
    value = "test-value"
    result = await provider.set_secret(key, value)
    assert result is True
    
    # Get the secret back
    retrieved_value = await provider.get_secret(key)
    assert retrieved_value == value
    
    # Try getting a non-existent secret
    non_existent = await provider.get_secret("non-existent")
    assert non_existent is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_secret(provider):
    """Test deleting secrets."""
    # Set a secret
    key = "test-delete-key"
    value = "test-delete-value"
    await provider.set_secret(key, value)
    
    # Verify it exists
    assert await provider.check_secret_exists(key) is True
    
    # Delete the secret
    result = await provider.delete_secret(key)
    assert result is True
    
    # Verify it's gone
    assert await provider.check_secret_exists(key) is False
    assert await provider.get_secret(key) is None
    
    # Try deleting a non-existent secret
    result = await provider.delete_secret("non-existent")
    assert result is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_list_secrets(provider):
    """Test listing secrets."""
    # Add several secrets with different prefixes
    await provider.set_secret("prefix1:key1", "value1")
    await provider.set_secret("prefix1:key2", "value2")
    await provider.set_secret("prefix2:key1", "value3")
    await provider.set_secret("no-prefix-key", "value4")
    
    # List all secrets
    all_secrets = await provider.list_secrets()
    assert len(all_secrets) == 4
    
    # List secrets with prefix
    prefix1_secrets = await provider.list_secrets("prefix1:")
    assert len(prefix1_secrets) == 2
    assert "prefix1:key1" in prefix1_secrets
    assert "prefix1:key2" in prefix1_secrets
    
    prefix2_secrets = await provider.list_secrets("prefix2:")
    assert len(prefix2_secrets) == 1
    assert "prefix2:key1" in prefix2_secrets


@pytest.mark.unit
@pytest.mark.asyncio
async def test_persistence(temp_secrets_file):
    """Test that secrets persist across provider instances."""
    # Create and initialize first provider instance
    provider1 = FileSecretProvider()
    await provider1.initialize({
        "file_path": str(temp_secrets_file),
        "password": "test-password",
        "salt": "test-salt"  # Using consistent salt for testing
    })
    
    # Set some secrets
    await provider1.set_secret("persist-key", "persist-value")
    await provider1.shutdown()
    
    # Create and initialize second provider instance with same file
    provider2 = FileSecretProvider()
    await provider2.initialize({
        "file_path": str(temp_secrets_file),
        "password": "test-password",
        "salt": "test-salt"  # Must use same password and salt
    })
    
    # Verify secrets exist in the new instance
    assert await provider2.get_secret("persist-key") == "persist-value"
    await provider2.shutdown()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_encryption():
    """Test that secrets are actually encrypted in the file."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp_path = Path(tmp.name)
    
    try:
        # Create and initialize provider
        provider = FileSecretProvider()
        await provider.initialize({
            "file_path": str(tmp_path),
            "password": "test-password"
        })
        
        # Set a secret
        await provider.set_secret("sensitive-key", "sensitive-value")
        await provider.shutdown()
        
        # Read the raw file content
        file_content = tmp_path.read_bytes()
        
        # Check if the secret is not stored in plaintext
        assert b"sensitive-key" not in file_content
        assert b"sensitive-value" not in file_content
        
    finally:
        # Cleanup
        if tmp_path.exists():
            tmp_path.unlink()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_error_handling():
    """Test error handling in the provider."""
    provider = FileSecretProvider()
    
    # Test initialization with invalid file path
    # The implementation validates this in initialize, not in validate_config
    with pytest.raises(ProviderInitializationError):
        await provider.initialize({
            "file_path": "/nonexistent/directory/that/should/not/exist",
            "password": "test-password"
        })
    
    # Test missing file_path in validate_config
    errors = await provider.validate_config({})
    assert "file_path" in errors
    
    # Test operations on uninitialized provider
    with pytest.raises(Exception):
        await provider.get_secret("key")
    
    with pytest.raises(Exception):
        await provider.set_secret("key", "value") 