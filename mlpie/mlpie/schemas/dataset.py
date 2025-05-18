"""
Dataset Schema.

This module defines Pydantic models for Dataset entity validation.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, field_validator, model_validator

from mlpie.schemas.base import EntityBase, EntityKind, Metadata


class SecretKeyRefSpec(BaseModel):
    """Models a reference to a specific key within a Kubernetes secret."""
    name: str
    key: str

    class Config:
        extra = "allow"

class UsernameSpec(BaseModel):
    """Models the username, which can be a direct string or a secret reference."""
    secretKeyRef: Optional[SecretKeyRefSpec] = None
    # value: Optional[str] = None # If direct value is also allowed

    # @model_validator(mode='after')
    # def check_one_of(self) -> 'UsernameSpec':
    #     if self.secretKeyRef is None and self.value is None:
    #         raise ValueError("Either secretKeyRef or a direct value must be provided for username")
    #     if self.secretKeyRef is not None and self.value is not None:
    #         raise ValueError("Provide either secretKeyRef or a direct value for username, not both")
    #     return self
    class Config:
        extra = "allow"

class PasswordSpec(BaseModel):
    """Models the password, which can be a direct string or a secret reference."""
    secretKeyRef: Optional[SecretKeyRefSpec] = None
    # value: Optional[str] = None # If direct value is also allowed

    # @model_validator(mode='after')
    # def check_one_of(self) -> 'PasswordSpec':
    #     if self.secretKeyRef is None and self.value is None:
    #         raise ValueError("Either secretKeyRef or a direct value must be provided for password")
    #     if self.secretKeyRef is not None and self.value is not None:
    #         raise ValueError("Provide either secretKeyRef or a direct value for password, not both")
    #     return self
    class Config:
        extra = "allow"


class ConnectionSpec(BaseModel):
    """Connection details for a data source. Structure can vary."""
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[UsernameSpec] = None # Can be direct or from secret
    password: Optional[PasswordSpec] = None # Can be direct or from secret
    # Other fields like connection_string, options, etc., can be added here.

    class Config:
        extra = "allow"  # Allow other fields not explicitly defined


class SourceSpec(BaseModel):
    """Source specification schema for a dataset."""
    type: str  # Type of the source, e.g., "PostgreSQL"
    connection: Optional[Dict[str, Any]] = None # keep as optional for now
                                 # For now, using Dict[str, Any] as requested for flexibility.
    class Config:
        extra = "allow"


class DatasetSpecSchema(BaseModel):
    """Schema for the dataset spec section."""
    type: str # Overall type of the dataset, e.g., "PostgreSQL" (could be different from source.type)
    project: str
    environment: str
    source: SourceSpec
    config: Optional[Dict[str, Any]] = Field(default_factory=dict) # Generic config block
    
    # Removed projectRef, environmentRef, and repository as they are not in the new example.
    # format field also removed as it seems superseded by spec.type or source.type

    class Config:
        extra = "allow"


class DatasetSpec(EntityBase):
    """Dataset specification schema (top-level)."""
    
    EXPECTED_KIND: str = EntityKind.DATASET
    
    metadata: Metadata
    spec: DatasetSpecSchema
    
    class Config:
        extra = "allow"
    
    @model_validator(mode='after')
    def validate_entity_spec(self) -> 'DatasetSpec':
        """Validate dataset-specific fields based on DatasetSpecSchema."""
        if not self.spec.type or not self.spec.type.strip():
            raise ValueError("Dataset spec must include a non-empty 'type'.")
        if not self.spec.project or not self.spec.project.strip():
            raise ValueError("Dataset spec must include a non-empty 'project' name.")
        if not self.spec.environment or not self.spec.environment.strip():
            raise ValueError("Dataset spec must include a non-empty 'environment' name.")
        if not self.spec.source or not self.spec.source.type.strip(): # Ensure source and its type are present
            raise ValueError("Dataset spec.source must include a non-empty 'type'.")
        # `config` is optional and generic, so no specific validation here unless rules are defined.
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dict format for database model."""
        db_spec = self.spec
        source_spec = db_spec.source

        db_dict = {
            "name": self.metadata.name,
            "description": self.metadata.description,
            "version": self.metadata.version,
            "labels": self.metadata.labels or [],
            "format": db_spec.type, # Using spec.type for the main dataset format/type
            "project_name": db_spec.project,
            "environment_name": db_spec.environment,
            "source_type": source_spec.type, # From source block
            "spec": self.model_dump(),  # Store the full original spec
            "profile_config": db_spec.config # Mapping spec.config to profile_config
        }

        # Extract connection details if present in source.connection
        # This part is a bit manual due to the flexible nature of source.connection
        connection_details = source_spec.connection
        if connection_details:
            db_dict["host"] = connection_details.get("host")
            db_dict["port"] = connection_details.get("port")
            db_dict["database"] = connection_details.get("database")

            username_info = connection_details.get("username")
            if isinstance(username_info, dict) and username_info.get("secretKeyRef"):
                secret_ref = username_info["secretKeyRef"]
                if isinstance(secret_ref, dict):
                    db_dict["credentials_secret_name"] = secret_ref.get("name") # Assuming one secret for both
                    db_dict["credentials_username_key"] = secret_ref.get("key")
            
            password_info = connection_details.get("password")
            if isinstance(password_info, dict) and password_info.get("secretKeyRef"):
                secret_ref = password_info["secretKeyRef"]
                if isinstance(secret_ref, dict):
                    # If secret name is already set by username, ensure it's consistent or handle as needed
                    if "credentials_secret_name" in db_dict and db_dict["credentials_secret_name"] != secret_ref.get("name"):
                        # Handle potential conflict or decide on a strategy
                        pass # For now, it might overwrite or just use the first one if names differ.
                    else:
                        db_dict["credentials_secret_name"] = secret_ref.get("name")
                    db_dict["credentials_password_key"] = secret_ref.get("key")

        return db_dict 