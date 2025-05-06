from datetime import datetime
import json
from typing import Dict, Any, Optional, List
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from mlpie.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=False)  # Path to the dataset
    format = Column(String, nullable=False)  # e.g., csv, parquet, json
    
    # JSON field to store flexible metadata
    _spec = Column("spec", Text, nullable=False, default="{}")
    
    # Project relationship (optional)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="datasets")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Is this dataset currently active
    active = Column(Boolean, default=True)

    @hybrid_property
    def spec(self) -> Dict[str, Any]:
        return json.loads(self._spec)

    @spec.setter
    def spec(self, value: Dict[str, Any]) -> None:
        self._spec = json.dumps(value)

    def to_dict(self) -> Dict[str, Any]:
        """Convert dataset to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "location": self.location,
            "format": self.format,
            "spec": self.spec,
            "project_id": self.project_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "active": self.active
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Dataset":
        """Create dataset from dictionary."""
        dataset = cls(
            id=data.get("id", str(uuid4())),
            name=data["name"],
            location=data["location"],
            format=data["format"],
            active=data.get("active", True)
        )
        
        if "description" in data:
            dataset.description = data["description"]
            
        if "project_id" in data:
            dataset.project_id = data["project_id"]
            
        if "spec" in data:
            dataset.spec = data["spec"]
            
        if "created_at" in data and data["created_at"]:
            dataset.created_at = datetime.fromisoformat(data["created_at"])
            
        if "updated_at" in data and data["updated_at"]:
            dataset.updated_at = datetime.fromisoformat(data["updated_at"])
            
        return dataset 