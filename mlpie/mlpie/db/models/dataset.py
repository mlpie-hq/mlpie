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
from sqlalchemy.schema import UniqueConstraint

from mlpie.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = (
        UniqueConstraint('project_name', 'environment_name', 'name', name='uq_project_env_dataset_name'),
        {"extend_existing": True}
    )

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
    
    # Profiling configuration
    profiler_name = Column(String(100), nullable=True)  # Name of the profiler to use
    auto_profile = Column(Boolean, default=False)  # Whether to automatically profile the dataset
    last_profiled_at = Column(DateTime, nullable=True)  # When the dataset was last profiled
    profile_results = Column(JSON, nullable=True)  # Latest profile results
    profile_config = Column(JSON, nullable=True, default={})  # Configuration for the profiler
    
    # Tags and categorization
    _labels = Column("labels", JSON, nullable=True, default=list)  # JSON array of labels/tags
    
    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False, default={})
    
    # Project relationship (REQUIRED for context)
    project_name = Column(String(255), ForeignKey("projects.name"), nullable=False)
    project = relationship("Project", back_populates="datasets")
    
    # Environment relationship (required)
    environment_name = Column(String(255), ForeignKey("environments.name"), nullable=False)
    environment = relationship("Environment", back_populates="datasets")
    
    # Source repository information
    source_repository_url = Column(String(255), nullable=True)  # URL of the source repository
    source_repository_path = Column(String(255), nullable=True)  # Path within the repository
    
    # Jobs relationship
    jobs = relationship("Job", back_populates="dataset")
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                       onupdate=lambda: datetime.now(UTC), nullable=False)
    
    # Status
    active = Column(Boolean, default=True)
    status = Column(String(50), default="Ready", nullable=False)

    # File tracking
    source_path = Column(String(255), nullable=True)  # Path to the source YAML file

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
            
        if "project_name" in data:
            dataset.project_name = data["project_name"]
        
        if "environment_name" in data:
            dataset.environment_name = data["environment_name"]
            
        if "source_path" in data:
            dataset.source_path = data["source_path"]
            
        if "source_repository_url" in data:
            dataset.source_repository_url = data["source_repository_url"]
            
        if "source_repository_path" in data:
            dataset.source_repository_path = data["source_repository_path"]
            
        # Add profiling options if present
        if "profiler_name" in data:
            dataset.profiler_name = data["profiler_name"]
            
        if "auto_profile" in data:
            dataset.auto_profile = data["auto_profile"]
            
        if "profile_config" in data:
            dataset.profile_config = data["profile_config"]
            
        return dataset
        
    @classmethod
    def from_yaml_spec(cls, spec_dict: Dict[str, Any], source_path: Optional[str] = None, 
                       source_repo_url: Optional[str] = None, 
                       source_repo_path: Optional[str] = None) -> 'Dataset':
        """
        Create a Dataset instance from a YAML specification dictionary.
        
        Args:
            spec_dict: The parsed YAML dictionary
            source_path: Path to the source YAML file
            source_repo_url: URL of the source repository
            source_repo_path: Path within the repository
            
        Returns:
            Dataset: A new Dataset instance
        """
        # Extract core fields from spec
        metadata = spec_dict.get("metadata", {})
        spec = spec_dict.get("spec", {})
        
        # Get name from either root level or metadata
        name = spec_dict.get("name") or metadata.get("name")
        format_value = spec.get("format")
        
        # Handle environment reference - support both styles
        # First try the new direct style
        environment_name = spec.get("environment")
        
        # If not found, try K8s-style reference
        if not environment_name:
            env_ref = spec.get("environmentRef")
            if env_ref and isinstance(env_ref, dict) and env_ref.get("name"):
                environment_name = env_ref.get("name")
                
        # Create the dataset with base fields
        dataset = cls(
            name=name,
            description=metadata.get("description"),
            version=metadata.get("version"),
            format=format_value,
            spec=spec_dict,  # Store the entire spec
            labels=metadata.get("labels"),
            status="Ready",
            active=True,
            source_path=source_path,
            source_repository_url=source_repo_url,
            source_repository_path=source_repo_path,
            environment_name=environment_name  # Set environment name directly
        )
        
        # Handle project reference - support both styles
        # First try the new direct style
        project_name = spec.get("project")
        
        # If not found, try K8s-style reference
        if not project_name:
            project_ref = spec.get("projectRef")
            if project_ref and isinstance(project_ref, dict) and project_ref.get("name"):
                project_name = project_ref.get("name")
                
        # Set project if provided
        if project_name:
            dataset.project_name = project_name
            
        # Handle source information if present
        source = spec.get("source", {})
        if source:
            dataset.source_type = source.get("type")
            dataset.host = source.get("host")
            dataset.port = source.get("port")
            dataset.database = source.get("database")
            
            # Handle credentials if present
            creds = source.get("credentials", {})
            if creds:
                dataset.credentials_secret_name = creds.get("secretName")
                dataset.credentials_username_key = creds.get("usernameKey")
                dataset.credentials_password_key = creds.get("passwordKey")
                
        # Handle profiling configuration if present
        profiling = spec.get("profiling", {})
        if profiling:
            dataset.profiler_name = profiling.get("profiler")
            dataset.auto_profile = profiling.get("autoProfile", False)
            dataset.profile_config = profiling.get("config", {})
            
        return dataset 