"""
Tests for database bootstrap.

This module tests the database bootstrap functionality.
"""

import os
import pytest
from unittest.mock import patch
import importlib

from mlpie.db.bootstrap import get_db_config_from_env


def test_get_db_config_from_env():
    """Test getting database configuration from environment variables."""
    # Test with default values
    with patch.dict(os.environ, {}, clear=True):
        config = get_db_config_from_env()
        assert "db_url" in config
        assert "db_echo" in config
        assert "data/mlpie.db" in config["db_url"]
        assert config["db_echo"] is False
    
    # Test with custom values
    with patch.dict(os.environ, {
        "MLPIE_DB_URL": "sqlite+aiosqlite:///:memory:",
        "MLPIE_DB_ECHO": "True"
    }, clear=True):
        config = get_db_config_from_env()
        assert config["db_url"] == "sqlite+aiosqlite:///:memory:"
        assert config["db_echo"] is True


def is_module_available(module_name):
    """Check if a module is available for import."""
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False


@pytest.mark.skipif(not is_module_available("aiosqlite"), 
                   reason="aiosqlite module not available")
def test_create_db_engine():
    """Test creating a database engine."""
    # This test requires aiosqlite to be installed
    from sqlalchemy.ext.asyncio import AsyncEngine
    from mlpie.db.bootstrap import create_db_engine
    
    # Test with in-memory SQLite
    with patch.dict(os.environ, {
        "MLPIE_DB_URL": "sqlite+aiosqlite:///:memory:"
    }, clear=True):
        engine = create_db_engine()
        assert isinstance(engine, AsyncEngine)
        assert "sqlite" in str(engine.url)
        assert ":memory:" in str(engine.url) 