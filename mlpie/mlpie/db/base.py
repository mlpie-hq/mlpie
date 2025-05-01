"""
SQLAlchemy Base Configuration.

This module defines the SQLAlchemy base configuration and declarative base.
"""

from typing import Any

from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import as_declarative


@as_declarative()
class Base:
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