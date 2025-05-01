"""
Global pytest configuration.
"""

import os
import sys
import contextlib
from pathlib import Path
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# Add the project root directory to the Python path
# This allows importing from mlpie.mlpie directly as 'mlpie'
project_root = Path(__file__).parent.parent
mlpie_dir = project_root / "mlpie"

if str(mlpie_dir) not in sys.path:
    sys.path.insert(0, str(mlpie_dir))

from mlpie.db.base import Base

# Custom settings for tests with in-memory SQLite
@pytest.fixture
def test_db_env():
    """Set test database environment variables."""
    # Save original environment
    original_env = os.environ.copy()
    
    # Set test environment variables
    os.environ["MLPIE_DB_URL"] = "sqlite+aiosqlite:///:memory:"
    os.environ["MLPIE_DB_ECHO"] = "False"
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)


@pytest_asyncio.fixture
async def test_engine(test_db_env):
    """Create a test SQLite engine."""
    # Import here to use the test environment variables
    from mlpie.db.bootstrap import create_db_engine
    
    # Create engine with test settings
    engine = create_db_engine()
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def test_session_factory(test_engine):
    """Create a test session factory."""
    return async_sessionmaker(
        test_engine,
        expire_on_commit=False,
        autoflush=False,
    )


@pytest_asyncio.fixture
async def test_session(test_session_factory):
    """Get a test database session."""
    async with test_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def mock_db_dependency(test_session):
    """Mock the FastAPI dependency for database sessions."""
    async def _get_session():
        yield test_session
    
    return _get_session 