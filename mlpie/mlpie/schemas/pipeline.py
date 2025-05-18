"""
Pipeline Schema.

This module defines Pydantic models for Pipeline entity validation.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator

from mlpie.schemas.base import EntityBase, EntityKind, Metadata



class PipelineSpecSchema(BaseModel):
    """Schema for the pipeline spec section."""
    engine: str
    project: str  # Project name
    environment: str # Environment name
    code: Optional[str] = None
    # Removed projectRef and environmentRef as they are not in the new example
    # repository: Optional[RepositorySpec] = None # If pipeline can have its own repo spec
    
    class Config:
        extra = "allow"  # Allow extra fields in the spec


class PipelineSpec(EntityBase):
    """Pipeline specification schema."""
    
    EXPECTED_KIND: str = EntityKind.PIPELINE
    
    # Required fields from EntityBase
    # kind: str
    # apiVersion: str
    metadata: Metadata
    spec: PipelineSpecSchema # Use the detailed PipelineSpecSchema
    
    class Config:
        extra = "allow"
    
    @model_validator(mode='after')
    def validate_entity_spec(self) -> 'PipelineSpec':
        """Validate pipeline-specific fields based on PipelineSpecSchema."""
        if not self.spec.engine or not self.spec.engine.strip():
            raise ValueError("Pipeline spec must include a non-empty 'engine'.")
        
        if not self.spec.project or not self.spec.project.strip():
            raise ValueError("Pipeline spec must include a non-empty 'project' name.")

        if not self.spec.environment or not self.spec.environment.strip():
            raise ValueError("Pipeline spec must include a non-empty 'environment' name.")

        # if not self.spec.code or not self.spec.code.strip():
        #     raise ValueError("Pipeline spec must include non-empty 'code'.")
        
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dict format for database model."""
        db_dict = {
            "name": self.metadata.name,
            "description": self.metadata.description,
            "engine": self.spec.engine,
            "project_name": self.spec.project,
            "environment_name": self.spec.environment,
            # "code": self.spec.code,
            "spec": self.model_dump() # Store the full original spec
        }
        return db_dict 