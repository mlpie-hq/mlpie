"""
Repository State Models.

This module defines SQLAlchemy models for tracking repository state.
"""

import uuid
from datetime import datetime, UTC
from typing import Optional, Dict, Any, List
import enum
import json

from sqlalchemy import Column, String, DateTime, Text, Enum, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from mlpie.db.base import Base
from mlpie.db.types import StringArray


# Create a database-agnostic ArrayType that works for both PostgreSQL and SQLite
class ArrayType(StringArray):
    """
    Legacy alias for StringArray for backward compatibility.
    """
    pass


class SyncStatus(str, enum.Enum):
    """Status of repository synchronization."""
    
    IDLE = "idle"           # No sync in progress
    SYNCING = "syncing"     # Sync in progress
    ERROR = "error"         # Last sync attempt failed
    UNKNOWN = "unknown"     # Initial state


class AuthType(str, enum.Enum):
    """Authentication type for repository access."""
    
    NONE = "none"           # No authentication required (public repo)
    SSH_KEY = "ssh_key"     # SSH key authentication
    TOKEN = "token"         # Token-based authentication
    USERNAME_PASSWORD = "username_password"  # Username and password authentication
    USE_MASTER = "use_master"  # Use master repository credentials


class EntityType(str, enum.Enum):
    """Type of entity that owns a repository."""
    
    MASTER = "master"       # Master/root repository
    PROJECT = "project"     # Project repository
    ENVIRONMENT = "environment"  # Environment repository


class Repository(Base):
    """Model for storing repository information and credentials.
    
    This model stores information about git repositories and access credentials.
    """
    
    __tablename__ = "repositories"
    __table_args__ = {"extend_existing": True}
    
    # Core identity fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=True)  # Optional name for the repository
    url = Column(String(255), nullable=False, index=True)
    ref = Column(String(100), nullable=False, default="main")  # Branch, tag, or commit to use
    local_path = Column(String(255), nullable=True)  # Local clone path (derived)
    
    # Path within repository
    path_in_repo = Column(String(255), nullable=True)  # Path within repo to scan for resources
    
    # Resource types this repository manages - using Text with JSON serialization
    _resource_types = Column("resource_types", Text, nullable=False, default='["*"]')  # Types of resources this repo manages
    
    # Polling interval
    scan_interval_seconds = Column(Integer, nullable=True)  # Custom scan interval for this repo
    
    # Entity ownership
    entity_type = Column(Enum(EntityType), nullable=False)
    entity_id = Column(String(255), nullable=True)  # ID or name of owning entity
    
    # Authentication 
    auth_type = Column(Enum(AuthType), nullable=False, default=AuthType.NONE)
    secret_ref = Column(String(255), nullable=True)  # Reference to secret with credentials
    token_secret_key = Column(String(100), nullable=True)  # Key in secret for token 
    username_secret_key = Column(String(100), nullable=True)  # Key in secret for username
    password_secret_key = Column(String(100), nullable=True)  # Key in secret for password
    ssh_key_secret_key = Column(String(100), nullable=True)  # Key in secret for SSH key
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                      onupdate=lambda: datetime.now(UTC), nullable=False)
    
    # Relationships
    repository_states = relationship("RepositoryState", back_populates="repository", cascade="all, delete-orphan")
    
    @hybrid_property
    def resource_types(self) -> List[str]:
        """Get the resource types as a list."""
        if isinstance(self._resource_types, list):
            # Already a list, return as is
            return self._resource_types
        
        try:
            # Try to parse from JSON string
            return json.loads(self._resource_types)
        except (TypeError, json.JSONDecodeError):
            # Default to all resource types on error
            return ["*"]
    
    @resource_types.setter
    def resource_types(self, value: List[str]) -> None:
        """Set the resource types, storing as JSON string."""
        if value is None:
            value = ["*"]
            
        if isinstance(value, list):
            # Convert list to JSON string for storage
            self._resource_types = json.dumps(value)
        else:
            # Set raw value (might be already a JSON string)
            self._resource_types = value
    
    def __repr__(self):
        return f"<Repository(name='{self.name}', url='{self.url}', entity_type='{self.entity_type}', entity_id='{self.entity_id}')>"
    
    def manages_resource_type(self, resource_type: str) -> bool:
        """Check if this repository manages a specific resource type."""
        resource_types = self.resource_types
        if "*" in resource_types:
            return True
        return resource_type in resource_types
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Repository":
        """Create repository from dictionary."""
        repository = cls(
            name=data.get("name"),
            url=data["url"],
            entity_type=data["entity_type"],
            entity_id=data.get("entity_id"),
            ref=data.get("ref", "main"),
            path_in_repo=data.get("path_in_repo"),
            resource_types=data.get("resource_types", ["*"]),
            scan_interval_seconds=data.get("scan_interval_seconds"),
            auth_type=data.get("auth_type", AuthType.NONE),
            secret_ref=data.get("secret_ref"),
            token_secret_key=data.get("token_secret_key"),
            username_secret_key=data.get("username_secret_key"),
            password_secret_key=data.get("password_secret_key"),
            ssh_key_secret_key=data.get("ssh_key_secret_key")
        )
        return repository
        
    @classmethod
    def from_spec_dict(cls, spec_dict: Dict[str, Any], entity_type: str, entity_id: str) -> "Repository":
        """Create repository from specification dictionary."""
        # Extract auth information
        auth = spec_dict.get("auth", {})
        auth_type = AuthType.NONE if not auth else AuthType(auth.get("type", "none"))
        
        # Create the repository
        repo = cls(
            name=spec_dict.get("name"),
            url=spec_dict.get("url"),
            entity_type=entity_type,
            entity_id=entity_id,
            ref=spec_dict.get("ref", "main"),
            path_in_repo=spec_dict.get("path_in_repo"),
            resource_types=spec_dict.get("resource_types", ["*"]),
            scan_interval_seconds=spec_dict.get("scan_interval_seconds"),
            auth_type=auth_type,
            secret_ref=auth.get("secret_ref"),
            token_secret_key=auth.get("token_secret_key"),
            username_secret_key=auth.get("username_secret_key"),
            password_secret_key=auth.get("password_secret_key"),
            ssh_key_secret_key=auth.get("ssh_key_secret_key")
        )
        return repo


class RepositoryState(Base):
    """Model for tracking the state of a repository.
    
    This model stores information about the current state of a repository,
    including the commit hash, last sync time, and sync status.
    """
    
    __tablename__ = "repository_states"
    __table_args__ = {"extend_existing": True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    repository = relationship("Repository", back_populates="repository_states")
    
    # Git state
    commit_sha = Column(String(40), nullable=True)  # Full SHA of the current commit
    commit_short_sha = Column(String(10), nullable=True)  # Short SHA (for display)
    commit_message = Column(Text, nullable=True)  # Message of the current commit
    commit_author = Column(String(255), nullable=True)  # Author of the current commit
    commit_date = Column(DateTime, nullable=True)  # Date of the current commit
    
    # Sync state
    sync_status = Column(Enum(SyncStatus), nullable=False, default=SyncStatus.UNKNOWN)
    last_sync_attempt = Column(DateTime, nullable=True)  # When we last tried to sync
    last_successful_sync = Column(DateTime, nullable=True)  # When we last successfully synced
    sync_error = Column(Text, nullable=True)  # Error message from last failed sync
    
    # Repository metadata
    is_local_repo_valid = Column(Boolean, default=False, nullable=False)  # Whether the local repo exists and is valid
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), 
                      onupdate=lambda: datetime.now(UTC), nullable=False)
    
    def __repr__(self):
        return f"<RepositoryState(repository_id='{self.repository_id}', commit_sha='{self.commit_short_sha}', status='{self.sync_status}')>" 