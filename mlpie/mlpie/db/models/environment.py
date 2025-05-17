"""
Environment Database Models.

This module defines SQLAlchemy models for storing environment information in the database.
"""

from datetime import datetime, UTC
from typing import Dict, Any, List, Optional
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base
from mlpie.db.models.repository import EntityType, Repository
from mlpie.profilers.config import (
    ProfilerConfig,
    get_profiler_config_from_environment,
    get_available_profilers_from_environment,
    get_default_profiler_from_environment
)


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
    project_name = Column(String(255), ForeignKey("projects.name"), nullable=True)
    project = relationship("Project", back_populates="environments")
    
    # Jobs relationship
    jobs = relationship("Job", back_populates="environment")
    
    # Pipeline relationship
    pipelines = relationship("Pipeline", back_populates="environment")
    
    # Dataset relationship
    datasets = relationship("Dataset", back_populates="environment")

    # Tags and categorization
    _labels = Column("labels", JSON, nullable=True, default=list)  # JSON array of labels/tags

    # Repository relationships
    repositories = relationship(
        "Repository", 
        primaryjoin="and_(Repository.entity_type=='environment', Repository.entity_id==Environment.id)",
        cascade="all, delete-orphan",
        foreign_keys="[Repository.entity_id]",
        backref="environment_owner"
    )

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
        
    def get_repositories_for_resource_type(self, resource_type: str) -> List[Repository]:
        """Get repositories that manage a specific resource type."""
        return [repo for repo in self.repositories if repo.manages_resource_type(resource_type)]

    def get_profiler_config(self, profiler_name: Optional[str] = None) -> Optional[ProfilerConfig]:
        """
        Get configuration for a specific profiler or the default profiler.
        
        Args:
            profiler_name: Name of the profiler to get, or None for default
            
        Returns:
            ProfilerConfig if found, None otherwise
        """
        return get_profiler_config_from_environment(self.spec, profiler_name)
    
    def get_available_profilers(self) -> List[str]:
        """
        Get list of available profiler names configured for this environment.
        
        Returns:
            List of profiler names
        """
        return get_available_profilers_from_environment(self.spec)
    
    def get_default_profiler(self) -> Optional[str]:
        """
        Get the default profiler name for this environment.
        
        Returns:
            Default profiler name or None if not specified
        """
        return get_default_profiler_from_environment(self.spec)

    @classmethod
    def from_yaml_spec(cls, spec_dict: Dict[str, Any], source_path: Optional[str] = None) -> 'Environment':
        """
        Create an Environment instance from a YAML specification dictionary.
        
        Args:
            spec_dict: The parsed YAML dictionary
            source_path: Path to the source YAML file
            
        Returns:
            Environment: A new Environment instance
            
        Raises:
            ValueError: If required fields are missing
        """
        # Extract core fields from spec
        metadata = spec_dict.get("metadata", {})
        spec = spec_dict.get("spec", {})
        
        # Get name from either root level or metadata
        name = spec_dict.get("name") or metadata.get("name")
        if not name:
            raise ValueError("Environment name is required")
        
        # Create instance
        environment = cls(
            name=name,
            description=metadata.get("description"),
            version=metadata.get("version"),
            spec=spec_dict,  # Store the entire spec
            labels=metadata.get("labels"),
            status="Ready",
            active=True,
            source_path=source_path
        )
        
        # Handle project reference
        project_ref = spec.get("projectRef")
        if project_ref and isinstance(project_ref, dict) and project_ref.get("name"):
            environment.project_name = project_ref.get("name")
        
        # Handle repositories
        repo_spec = spec.get("repository")
        if repo_spec and isinstance(repo_spec, dict):
            # Single repository definition
            repo = Repository.from_spec_dict(
                repo_spec, 
                entity_type=EntityType.ENVIRONMENT.value, 
                entity_id=str(environment.id)
            )
            environment.repositories.append(repo)
        
        # Handle multiple repositories
        repositories = spec.get("repositories", [])
        if repositories and isinstance(repositories, list):
            for repo_spec in repositories:
                if isinstance(repo_spec, dict):
                    repo = Repository.from_spec_dict(
                        repo_spec, 
                        entity_type=EntityType.ENVIRONMENT.value, 
                        entity_id=str(environment.id)
                    )
                    environment.repositories.append(repo)
            
        return environment 