"""
Database Connection Utilities.

This module provides utilities for creating and managing database connections.
"""

import logging
from functools import lru_cache
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio import AsyncEngine

# Use the bootstrap module instead of directly importing from config
from .bootstrap import create_db_engine
from mlpie.config.settings import RootSettings
logger = logging.getLogger(__name__)

# Global variables to store engine and session factory
_engine: Optional[AsyncEngine] = None
_async_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """Get the SQLAlchemy engine.
    
    Returns:
        AsyncEngine: SQLAlchemy async engine instance
        
    Raises:
        RuntimeError: If the engine has not been initialized
    """
    global _engine
    
    if _engine is None:
        raise RuntimeError(
            "Database engine not initialized. Call setup_database() first."
        )
    
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get the SQLAlchemy session factory.
    
    Returns:
        async_sessionmaker: SQLAlchemy async session factory
        
    Raises:
        RuntimeError: If the session factory has not been initialized
    """
    global _async_session_factory
    
    if _async_session_factory is None:
        raise RuntimeError(
            "Database session factory not initialized. Call setup_database() first."
        )
    
    return _async_session_factory


def setup_database(settings: RootSettings) -> AsyncEngine:
    """Set up the database engine and session factory.
    
    This function should be called at application startup to initialize
    the database connection.
    
    Returns:
        AsyncEngine: SQLAlchemy async engine instance
    """
    global _engine, _async_session_factory
    
    # Use the bootstrap module to create the engine
    _engine = create_db_engine(settings)
    
    # Create session factory
    _async_session_factory = async_sessionmaker(
        _engine,
        expire_on_commit=False, 
        autoflush=False,
    )
    
    return _engine


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a database session.
    
    This function should be used as a dependency in FastAPI endpoints
    to get a database session. It ensures the session is properly closed
    after use.
    
    Yields:
        AsyncSession: SQLAlchemy async session
    """
    session_factory = get_session_factory()
    session = session_factory()
    
    try:
        yield session
    finally:
        await session.close() 