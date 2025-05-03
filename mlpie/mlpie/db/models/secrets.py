"""
Secret Database Models.

This module defines SQLAlchemy models for storing encrypted secrets in the database.
"""

import uuid
from datetime import datetime, UTC

from sqlalchemy import Column, String, Text, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from mlpie.db.base import Base


class DatabaseSecret(Base):
    """Database model for storing encrypted secrets.
    
    This model allows storing encrypted secrets in the database with namespacing
    for organization and avoiding key collisions.
    """
    
    __tablename__ = "database_secrets"
    __table_args__ = (
        # Compound unique constraint on namespace and key
        UniqueConstraint("namespace", "key", name="uq_namespace_key"),
        # Index for faster lookups by namespace
        Index("idx_namespace", "namespace"),
        {"extend_existing": True}
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    namespace = Column(String(255), nullable=False, index=True, default="default")
    key = Column(String(255), nullable=False, index=True)
    encrypted_value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                        onupdate=lambda: datetime.now(UTC), nullable=False) 