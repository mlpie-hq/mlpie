"""
Project Database Models.

This module defines SQLAlchemy models for storing project information in the database.
"""

import uuid
from datetime import datetime, UTC
import enum

from sqlalchemy import Column, String, Text, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base


class ProjectStatus(str, enum.Enum):
    """Status of a project."""
    
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    ERROR = "error"


class AuthType(str, enum.Enum):
    """Authentication type for repository access."""
    
    NONE = "none"           # No authentication required
    SSH_KEY = "ssh_key"     # SSH key authentication
    USERNAME_PASSWORD = "username_password"  # Username and password authentication
    TOKEN = "token"         # Token-based authentication


class Project(Base):
    """Model for storing project information.
    
    This model stores project details in a Kubernetes-like pattern:
    - Core metadata fields as columns for direct querying
    - Full configuration stored as JSON in spec field
    """
    
    __tablename__ = "projects"
    __table_args__ = {"extend_existing": True}
    
    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    
    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False)  # Complete project specification
    
    # Extracted fields for efficient querying
    repository_url = Column(String(255), nullable=False)
    branch = Column(String(100), nullable=False, default="main")
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.ACTIVE)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                       onupdate=lambda: datetime.now(UTC), nullable=False)
    
    # File tracking
    source_path = Column(String(255), nullable=True)  # Path to the source YAML file
    
    # Relationships
    datasets = relationship("Dataset", back_populates="project")
    
    def __repr__(self):
        return f"<Project(name='{self.name}', repository_url='{self.repository_url}', status='{self.status}')>"
    
    @classmethod
    def from_yaml_spec(cls, spec_dict, source_path=None):
        """
        Create a Project instance from a YAML specification dictionary.
        
        Args:
            spec_dict (dict): The parsed YAML dictionary
            source_path (str): Path to the source YAML file
            
        Returns:
            Project: A new Project instance
        """
        # Extract core fields from spec
        metadata = spec_dict.get("metadata", {})
        spec = spec_dict.get("spec", {})
        
        return cls(
            name=metadata.get("name"),
            spec=spec_dict,  # Store the entire spec
            repository_url=spec.get("repositoryUrl", ""),
            branch=spec.get("branch", "main"),
            description=metadata.get("description"),
            status=ProjectStatus.ACTIVE,  # Default to active
            source_path=source_path
        )
    