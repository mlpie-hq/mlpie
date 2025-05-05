"""
Repository State Models.

This module defines SQLAlchemy models for tracking repository state.
"""

import uuid
from datetime import datetime, UTC
from typing import Optional

from sqlalchemy import Column, String, DateTime, Text, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
import enum

from mlpie.db.base import Base


class SyncStatus(str, enum.Enum):
    """Status of repository synchronization."""
    
    IDLE = "idle"           # No sync in progress
    SYNCING = "syncing"     # Sync in progress
    ERROR = "error"         # Last sync attempt failed
    UNKNOWN = "unknown"     # Initial state


class RepositoryState(Base):
    """Model for tracking the state of the root repository.
    
    This model stores information about the current state of the root repository,
    including the commit hash, last sync time, and sync status.
    """
    
    __tablename__ = "repository_state"
    __table_args__ = {"extend_existing": True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_url = Column(String(255), nullable=False, index=True)
    repository_path = Column(String(255), nullable=False)
    current_branch = Column(String(100), nullable=False, default="main")
    
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
        return f"<RepositoryState(repository_url='{self.repository_url}', commit_sha='{self.commit_short_sha}', status='{self.sync_status}')>" 