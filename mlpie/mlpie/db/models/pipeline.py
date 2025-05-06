"""
Pipeline Database Models.

This module defines SQLAlchemy models for storing pipeline information in the database.
"""

from datetime import datetime, UTC
from typing import Dict, Any, List
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
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="pipelines")

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Status
    active = Column(Boolean, default=True)
    status = Column(String(50), default="Ready", nullable=False)

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
        if "project_id" in data:
            pipeline.project_id = data["project_id"]
        return pipeline 