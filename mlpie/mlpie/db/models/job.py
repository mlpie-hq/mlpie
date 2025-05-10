"""
Job Database Models.

This module defines SQLAlchemy models for storing job information in the database.
Jobs represent asynchronous tasks that can be executed by the system.
"""

from datetime import datetime, UTC
from enum import Enum
from typing import Dict, Any, List, Optional
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base


class JobStatus(str, Enum):
    """Enum representing possible job statuses."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    """Enum representing possible job types."""
    PROFILE_DATASET = "profile_dataset"
    DATA_SYNC = "data_sync"
    MODEL_TRAINING = "model_training"
    MODEL_EVALUATION = "model_evaluation"
    CUSTOM = "custom"


class Job(Base):
    """Model representing an asynchronous job in the system."""
    
    __tablename__ = "jobs"
    __table_args__ = {"extend_existing": True}

    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    job_type = Column(String(50), nullable=False)  # Corresponds to JobType enum
    
    # Status and progress
    status = Column(String(50), default=JobStatus.PENDING.value, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    
    # Execution details
    executor = Column(String(50), nullable=False)  # "local", "aws", etc.
    parameters = Column(JSON, nullable=False, default={})  # Job-specific parameters
    
    # Results and logs
    result = Column(JSON, nullable=True)
    logs = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Who or what created this job
    created_by = Column(String(100), nullable=True)  # user_id or "system"
    
    # Relations (optional)
    # A job can be related to various entities like datasets, models, etc.
    dataset_name = Column(String(255), ForeignKey("datasets.name"), nullable=True)
    dataset = relationship("Dataset", back_populates="jobs")
    
    environment_name = Column(String(255), ForeignKey("environments.name"), nullable=True)
    environment = relationship("Environment", back_populates="jobs")
    
    # For recurring jobs
    is_recurring = Column(Boolean, default=False)
    schedule = Column(String(100), nullable=True)  # cron expression or interval
    
    def __repr__(self):
        return f"<Job(id='{self.id}', name='{self.name}', type='{self.job_type}', status='{self.status}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to a dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "job_type": self.job_type,
            "status": self.status,
            "progress": self.progress,
            "executor": self.executor,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_by": self.created_by,
            "dataset_name": self.dataset_name,
            "environment_name": self.environment_name,
            "is_recurring": self.is_recurring,
            "schedule": self.schedule,
            "error": self.error,
            # Don't include potentially large fields like logs and results by default
        } 