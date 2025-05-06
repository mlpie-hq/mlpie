"""
Dataset Database Models.

This module defines SQLAlchemy models for storing dataset information in the database.
"""

from datetime import datetime, UTC
import json
from typing import Dict, Any, Optional, List
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON, Integer, BigInteger
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from mlpie.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = {"extend_existing": True}

    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String(50), nullable=True)
    
    # Data format
    format = Column(String(50), nullable=False)  # File format or database type
    
    # Source information
    source_type = Column(String(50), nullable=True)  # Type of source (PostgreSQL, CSV, etc.)
    host = Column(String(255), nullable=True)  # Host name or address
    port = Column(Integer, nullable=True)  # Port number
    database = Column(String(255), nullable=True)  # Database name
    
    # Secret reference (K8s-style)
    credentials_secret_name = Column(String(255), nullable=True)      # Secret name
    credentials_username_key = Column(String(255), nullable=True)     # Username key in secret
    credentials_password_key = Column(String(255), nullable=True)     # Password key in secret
    
    # Statistics (populated by analysis, not from YAML)
    size_bytes = Column(BigInteger, nullable=True)  # Size in bytes
    size_display = Column(String(20), nullable=True)  # Human-readable size (e.g., "48 MB")
    record_count = Column(BigInteger, nullable=True)  # Number of records
    last_synced_at = Column(DateTime, nullable=True)  # When was data last synced
    last_updated_at = Column(DateTime, nullable=True)  # When was data last updated
    
    # Tags and categorization
    _labels = Column("labels", JSON, nullable=True, default=list)  # JSON array of labels/tags
    
    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False, default={})
    
    # Project relationship (optional)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="datasets")
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                       onupdate=lambda: datetime.now(UTC), nullable=False)
    
    # Status
    active = Column(Boolean, default=True)
    status = Column(String(50), default="Ready", nullable=False)

    @property
    def labels(self) -> List[str]:
        """Get dataset labels."""
        return self._labels or []
        
    @labels.setter
    def labels(self, values: List[str]) -> None:
        """Set dataset labels."""
        self._labels = values

    def __repr__(self):
        return f"<Dataset(name='{self.name}', format='{self.format}', status='{self.status}')>"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Dataset":
        """Create dataset from dictionary."""
        dataset = cls(
            name=data["name"],
            format=data["format"],
            spec=data.get("spec", {}),
            active=data.get("active", True)
        )
        
        # Add optional fields if present
        if "description" in data:
            dataset.description = data["description"]
            
        if "version" in data:
            dataset.version = data["version"]
            
        if "source_type" in data:
            dataset.source_type = data["source_type"]
            
        if "host" in data:
            dataset.host = data["host"]
            
        if "port" in data:
            dataset.port = data["port"]
            
        if "database" in data:
            dataset.database = data["database"]
            
        if "credentials_secret_name" in data:
            dataset.credentials_secret_name = data["credentials_secret_name"]
            
        if "credentials_username_key" in data:
            dataset.credentials_username_key = data["credentials_username_key"]
            
        if "credentials_password_key" in data:
            dataset.credentials_password_key = data["credentials_password_key"]
            
        if "labels" in data:
            dataset.labels = data["labels"]
            
        if "status" in data:
            dataset.status = data["status"]
            
        if "project_id" in data:
            dataset.project_id = data["project_id"]
            
        return dataset 