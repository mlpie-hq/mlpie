"""
Custom SQLAlchemy types.

This module defines custom SQLAlchemy types that support both PostgreSQL and SQLite.
"""

import json
from sqlalchemy import String, Text
from sqlalchemy.types import TypeDecorator
from sqlalchemy.dialects.postgresql import ARRAY


class StringArray(TypeDecorator):
    """
    String array that works with both PostgreSQL and SQLite.
    
    This type acts as PostgreSQL's native ARRAY when using PostgreSQL,
    and uses JSON serialization when using SQLite.
    """
    
    # This property allows the type to be properly pickled
    cache_ok = True
    impl = Text
    
    def __init__(self, *args, **kwargs):
        """Initialize with Text as the implementation."""
        super().__init__()
        
    def load_dialect_impl(self, dialect):
        """Return dialect implementation based on database."""
        if dialect.name == 'postgresql':
            # Use native PostgreSQL ARRAY for PostgreSQL
            return dialect.type_descriptor(ARRAY(String))
        else:
            # Use TEXT for SQLite and others
            return dialect.type_descriptor(Text())
            
    def process_bind_param(self, value, dialect):
        """Process the value being assigned to a column."""
        if dialect.name == 'postgresql':
            # PostgreSQL handles arrays natively
            return value
        if value is None:
            return None
        # For SQLite, serialize to JSON
        return json.dumps(value)
        
    def process_result_value(self, value, dialect):
        """Process the value being retrieved from the database."""
        if dialect.name == 'postgresql':
            # PostgreSQL returns arrays correctly
            return value
        if value is None:
            return []
        # For SQLite, deserialize from JSON
        try:
            return json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return []

    def __repr__(self):
        """
        Return string representation.
        This is used by migrations to represent the type.
        """
        return "Text()"
    
    @property
    def python_type(self):
        """Return Python type represented by this type."""
        return list
        
    def get_col_spec(self, **kw):
        """Return SQL column specification for migrations."""
        return "TEXT" 