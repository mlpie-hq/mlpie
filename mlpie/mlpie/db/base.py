"""
SQLAlchemy Base Configuration.

This module defines the SQLAlchemy base configuration and declarative base.
"""

from typing import Any, AsyncGenerator

from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mlpie.config.settings import RootSettings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models.
    
    This class provides common functionality for all models,
    such as automatically generating table names.
    """
    
    # Make table name automatically generated from class name
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate __tablename__ automatically as lowercase of class name."""
        return cls.__name__.lower()
    
    # Allow dictionary-like access to columns
    def __getitem__(self, key: str) -> Any:
        """Allow dictionary-like access to model attributes."""
        return getattr(self, key)
    
    def __setitem__(self, key: str, value: Any) -> None:
        """Allow dictionary-like setting of model attributes."""
        setattr(self, key, value)


# Create async session factory
def create_async_session_factory(settings: RootSettings) -> async_sessionmaker[AsyncSession]:
    """Create an async session factory.
    
    Args:
        settings: Application settings
        
    Returns:
        Async session factory
    """
    engine = create_async_engine(
        settings.database.DATABASE_URL,
        echo=settings.database.DATABASE_ECHO,
        pool_pre_ping=True,
    )
    
    return async_sessionmaker(
        engine,
        expire_on_commit=False,
        autoflush=False,
    )


# Create async session local
async def AsyncSessionLocal() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session.
    
    Yields:
        AsyncSession: Database session
    """
    from mlpie.db.connection import get_session_factory
    
    session_factory = get_session_factory()
    session = session_factory()
    
    try:
        yield session
    finally:
        await session.close() 