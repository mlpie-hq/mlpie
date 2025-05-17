"""
Pipeline Database Models.

This module defines SQLAlchemy models for storing pipeline information in the database.
"""

from datetime import datetime, UTC
from typing import Dict, Any, List, Optional
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base


class Pipeline(Base):
    __tablename__ = "pipelines"
    __table_args__ = {"extend_existing": True}

    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False, index=True, unique=True)
    description = Column(Text, nullable=True)
    version = Column(String(50), nullable=True)

    # Engine and code
    engine = Column(String(50), nullable=False)  # dagster, airflow, kubeflow, etc.
    code = Column(Text, nullable=False)  # Pipeline code (multi-line)

    # Tags and categorization
    _labels = Column("labels", JSON, nullable=True, default=list)  # JSON array of labels/tags

    # Full specification as JSON (K8s-like pattern)
    spec = Column(JSON, nullable=False, default={})

    # Project relationship (optional)
    project_name = Column(String(255), ForeignKey("projects.name"), nullable=True)
    project = relationship("Project", back_populates="pipelines")
    
    # Source repository information
    source_repository_url = Column(String(255), nullable=True)  # URL of the source repository
    source_repository_path = Column(String(255), nullable=True)  # Path within the repository

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
        return f"<Pipeline(name='{self.name}', engine='{self.engine}', status='{self.status}')>"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Pipeline":
        pipeline = cls(
            name=data["name"],
            engine=data["engine"],
            code=data["code"],
            spec=data.get("spec", {}),
            active=data.get("active", True)
        )
        if "description" in data:
            pipeline.description = data["description"]
        if "version" in data:
            pipeline.version = data["version"]
        if "labels" in data:
            pipeline.labels = data["labels"]
        if "status" in data:
            pipeline.status = data["status"]
        if "project_name" in data:
            pipeline.project_name = data["project_name"]
        if "source_path" in data:
            pipeline.source_path = data["source_path"]
        if "source_repository_url" in data:
            pipeline.source_repository_url = data["source_repository_url"]
        if "source_repository_path" in data:
            pipeline.source_repository_path = data["source_repository_path"]
        return pipeline
        
    @classmethod
    def from_yaml_spec(cls, spec_dict: Dict[str, Any], source_path: Optional[str] = None,
                       source_repo_url: Optional[str] = None, 
                       source_repo_path: Optional[str] = None) -> 'Pipeline':
        """
        Create a Pipeline instance from a YAML specification dictionary.
        
        Args:
            spec_dict: The parsed YAML dictionary
            source_path: Path to the source YAML file
            source_repo_url: URL of the source repository
            source_repo_path: Path within the repository
            
        Returns:
            Pipeline: A new Pipeline instance
            
        Raises:
            ValueError: If required fields are missing
        """
        # Extract core fields from spec
        metadata = spec_dict.get("metadata", {})
        spec = spec_dict.get("spec", {})
        
        # Get name from either root level or metadata
        name = spec_dict.get("name") or metadata.get("name")
        if not name:
            raise ValueError("Pipeline name is required")
            
        # Determine engine and code
        engine = spec.get("engine")
        if not engine:
            raise ValueError("Pipeline engine is required")
            
        code = spec.get("code", "")
        
        # Create the pipeline with base fields
        pipeline = cls(
            name=name,
            description=metadata.get("description"),
            version=metadata.get("version"),
            engine=engine,
            code=code,
            spec=spec_dict,  # Store the entire spec
            labels=metadata.get("labels"),
            status="Ready",
            active=True,
            source_path=source_path,
            source_repository_url=source_repo_url,
            source_repository_path=source_repo_path
        )
        
        # Handle project reference if present
        project_ref = spec.get("projectRef")
        if project_ref and isinstance(project_ref, dict) and project_ref.get("name"):
            pipeline.project_name = project_ref.get("name")
            
        return pipeline 