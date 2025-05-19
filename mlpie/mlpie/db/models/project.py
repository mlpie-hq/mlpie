"""
Project Database Models.

This module defines SQLAlchemy models for storing project information in the database.
"""

import uuid
from datetime import datetime, UTC
import enum
from typing import Dict, Any, List, Optional

from sqlalchemy import Column, String, Text, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base
from mlpie.db.models.repository import EntityType, Repository


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
    name = Column(String(255), primary_key=True, nullable=False, index=True)
    
    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False)  # Complete project specification
    
    # Extracted fields for efficient querying
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.ACTIVE)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                       onupdate=lambda: datetime.now(UTC), nullable=False)
    
    # File tracking
    source_path = Column(String(255), nullable=True)  # Path to the source YAML file
    source_repository_url = Column(String(255), nullable=True)  # URL of the source repository
    source_repository_path = Column(String(255), nullable=True)  # Path within the source repository
    
    # Relationships
    datasets = relationship("Dataset", back_populates="project")
    pipelines = relationship("Pipeline", back_populates="project")
    environments = relationship("Environment", back_populates="project")
    repositories = relationship(
        "Repository", 
        primaryjoin="and_(Repository.entity_type=='project', Repository.entity_id==Project.name)",
        cascade="all, delete-orphan",
        foreign_keys="[Repository.entity_id]",
        backref="project_owner"
    )
    secret_definitions = relationship(
        "SecretDefinition", 
        back_populates="project", 
        cascade="all, delete-orphan",
        lazy="selectin" # Or "joined" if frequently accessed with Project
    )
    
    def __repr__(self):
        return f"<Project(name='{self.name}', status='{self.status}')>"
    
    def get_repositories_for_resource_type(self, resource_type: str) -> List[Repository]:
        """Get repositories that manage a specific resource type."""
        return [repo for repo in self.repositories if repo.manages_resource_type(resource_type)]
    
    def get_repository_url(self) -> str:
        """Get the main repository URL for this project.
        
        Returns:
            str: Repository URL or empty string if no repositories
        """
        if self.repositories and len(self.repositories) > 0:
            return self.repositories[0].url
        return ""
    
    def get_repository_branch(self) -> str:
        """Get the main repository branch for this project.
        
        Returns:
            str: Repository branch or "main" if no repositories
        """
        if self.repositories and len(self.repositories) > 0:
            return self.repositories[0].ref
        return "main"
    
    @classmethod
    def from_yaml_spec(cls, spec_dict: Dict[str, Any], source_path: Optional[str] = None) -> 'Project':
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
        
        # Create the project instance
        project = cls(
            name=metadata.get("name"),
            spec=spec_dict,  # Store the entire spec
            description=metadata.get("description"),
            status=ProjectStatus.ACTIVE,  # Default to active
            source_path=source_path
        )
        
        # Handle repositories
        repo_spec = spec.get("repository")
        if repo_spec and isinstance(repo_spec, dict):
            # Single repository definition
            repo = Repository.from_spec_dict(
                repo_spec, 
                entity_type=EntityType.PROJECT.value, 
                entity_id=project.name
            )
            project.repositories.append(repo)
        
        # Handle multiple repositories (backwards compatibility)
        repositories = spec.get("repositories", [])
        if repositories and isinstance(repositories, list):
            for repo_spec in repositories:
                if isinstance(repo_spec, dict):
                    repo = Repository.from_spec_dict(
                        repo_spec, 
                        entity_type=EntityType.PROJECT.value, 
                        entity_id=project.name
                    )
                    project.repositories.append(repo)
        
        return project
    