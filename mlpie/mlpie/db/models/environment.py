"""
Environment Database Models.

This module defines SQLAlchemy models for storing environment information in the database.
"""

from datetime import datetime, UTC
from typing import Dict, Any, List
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base


class Environment(Base):
    __tablename__ = "environments"
    __table_args__ = {"extend_existing": True}

    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False, index=True, unique=True)
    description = Column(Text, nullable=True)
    version = Column(String(50), nullable=True)

    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False, default={})

    # Project relationship (optional)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="environments")

    # Tags and categorization
    _labels = Column("labels", JSON, nullable=True, default=list)  # JSON array of labels/tags

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Status
    active = Column(Boolean, default=True)
    status = Column(String(50), default="Ready", nullable=False)
    
    # File tracking
    source_path = Column(String(255), nullable=True)  # Path to the source YAML file

    @property
    def labels(self) -> List[str]:
        return self._labels or []

    @labels.setter
    def labels(self, values: List[str]) -> None:
        self._labels = values

    def __repr__(self):
        return f"<Environment(name='{self.name}', status='{self.status}')>"

    @classmethod
    def from_yaml_spec(cls, spec_dict, source_path=None):
        """
        Create an Environment instance from a YAML specification dictionary.
        
        Args:
            spec_dict (dict): The parsed YAML dictionary
            source_path (str): Path to the source YAML file
            
        Returns:
            Environment: A new Environment instance
        """
        # Extract core fields from spec
        metadata = spec_dict.get("metadata", {})
        spec = spec_dict.get("spec", {})
        
        return cls(
            name=metadata.get("name"),
            description=metadata.get("description"),
            version=metadata.get("version"),
            spec=spec_dict,  # Store the entire spec
            labels=metadata.get("labels"),
            status="Ready",
            active=True,
            source_path=source_path
        ) 