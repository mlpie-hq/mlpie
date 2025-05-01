"""
Tests for database connection.

This module tests the database connection functionality.
"""

import os
import pytest
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Import individual functions to avoid potential circular imports
from mlpie.db.connection import setup_database, get_engine, get_session_factory
from mlpie.db.bootstrap import get_db_config_from_env


@pytest.mark.asyncio
async def test_setup_database(test_db_env):
    """Test database setup functionality."""
    # Test setup_database creates an engine
    engine = setup_database()
    assert engine is not None
    
    # Test the engine is cached
    engine2 = get_engine()
    assert engine is engine2
    
    # Clean up
    await engine.dispose()


@pytest.mark.asyncio
async def test_get_session_factory(test_db_env):
    """Test session factory creation."""
    # Set up database first
    setup_database()
    
    # Test get_session_factory returns a session factory
    session_factory = get_session_factory()
    assert session_factory is not None
    
    # Test creating a session from the factory
    async with session_factory() as session:
        assert isinstance(session, AsyncSession)
    
    # Clean up
    engine = get_engine()
    await engine.dispose()


@pytest.mark.asyncio
async def test_get_session(test_db_env):
    """Test get_session dependency."""
    # Set up database first
    setup_database()
    
    # Use delayed import to avoid circular import
    from mlpie.db.connection import get_session
    
    # Test get_session returns a generator
    session_gen = get_session()
    
    # Get session from the generator
    session = await session_gen.__anext__()
    assert isinstance(session, AsyncSession)
    
    # Clean up
    try:
        await session.close()
        await session_gen.aclose()
    except:
        pass
    
    engine = get_engine()
    await engine.dispose()


def test_database_url_validation():
    """Test database URL validation."""
    temp_files = []
    
    try:
        # Create unique filename for test
        abs_filename = f"test_db_{uuid.uuid4().hex}.db"
        temp_files.append(abs_filename)
        
        # Test with absolute path by using current dir
        abs_path = os.path.abspath(abs_filename)
        abs_url = f"sqlite+aiosqlite:///{abs_path}"
        with pytest.MonkeyPatch.context() as mp:
            mp.setenv("MLPIE_DB_URL", abs_url)
            config = get_db_config_from_env()
            assert config["db_url"] == abs_url
        
        # Test with relative path (should be converted to absolute)
        rel_filename = f"relative_{uuid.uuid4().hex}.db"
        temp_files.append(rel_filename)
        with pytest.MonkeyPatch.context() as mp:
            mp.setenv("MLPIE_DB_URL", f"sqlite+aiosqlite:///{rel_filename}")
            config = get_db_config_from_env()
            assert rel_filename in config["db_url"]
            assert not config["db_url"] == f"sqlite+aiosqlite:///{rel_filename}"  # Should be absolute now
        
        # Test with memory database
        with pytest.MonkeyPatch.context() as mp:
            mp.setenv("MLPIE_DB_URL", "sqlite+aiosqlite:///:memory:")
            config = get_db_config_from_env()
            assert config["db_url"] == "sqlite+aiosqlite:///:memory:"
    
    finally:
        # Clean up any temp files
        for filename in temp_files:
            try:
                if os.path.exists(filename):
                    os.remove(filename)
            except:
                pass


@pytest.mark.asyncio
async def test_with_test_session(test_session):
    """Test using the test_session fixture."""
    # This just verifies our test fixtures work
    assert isinstance(test_session, AsyncSession)
    
    # Try a simple query
    result = await test_session.execute(text("SELECT 1"))
    value = result.scalar_one()
    assert value == 1 