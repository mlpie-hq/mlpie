"""
Repository API Schemas.

This module defines the Pydantic schemas for repository state API endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class RepositoryStateResponse(BaseModel):
    """Repository state information."""

    id: str = Field(..., description="Repository state ID")
    repository_url: str = Field(..., description="Repository URL")
    repository_path: str = Field(..., description="Local repository path")
    current_branch: str = Field(..., description="Current Git branch")
    
    # Git state
    commit_sha: Optional[str] = Field(None, description="Full SHA of the current commit")
    commit_short_sha: Optional[str] = Field(None, description="Short SHA of the current commit")
    commit_message: Optional[str] = Field(None, description="Message of the current commit")
    commit_author: Optional[str] = Field(None, description="Author of the current commit")
    commit_date: Optional[datetime] = Field(None, description="Date of the current commit")
    
    # Sync state
    sync_status: str = Field(..., description="Current sync status (idle, syncing, error, unknown)")
    last_sync_attempt: Optional[datetime] = Field(None, description="When we last tried to sync")
    last_successful_sync: Optional[datetime] = Field(None, description="When we last successfully synced")
    sync_error: Optional[str] = Field(None, description="Error message from last failed sync")
    
    # Repository metadata
    is_local_repo_valid: bool = Field(..., description="Whether the local repo exists and is valid")
    
    # Timestamps
    created_at: datetime = Field(..., description="When the record was created")
    updated_at: datetime = Field(..., description="When the record was last updated")
    
    class Config:
        """Pydantic config."""
        
        from_attributes = True 


class SyncStatusResponse(BaseModel):
    """Simple sync status response for the repository."""
    
    needs_sync: bool = Field(..., description="Whether the repository needs syncing")
    last_synced: Optional[datetime] = Field(None, description="When the last successful sync occurred")
    sync_message: str = Field(..., description="Human-readable sync status message")
    out_of_sync_count: int = Field(..., description="Number of entities that need syncing") 