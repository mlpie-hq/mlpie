"""
Repository API Router.

This module defines the FastAPI router for repository state endpoints.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from mlpie.db.connection import get_session
from mlpie.db.crud.repository import (
    get_repository_state, get_all_repository_states, get_repository_state_by_id,
    get_repository
)
from mlpie.api.schemas.repository import RepositoryStateResponse, SyncStatusResponse
from mlpie.api.schemas.config import StatusResponse  # Import StatusResponse for sync endpoint
from mlpie.db.models.repository import Repository  # Add the Repository model import


router = APIRouter(
    prefix="/repository",
    tags=["repository"],
    responses={404: {"description": "Not found"}},
)


@router.get("/state", response_model=List[RepositoryStateResponse])
async def get_all_repositories(
    session: AsyncSession = Depends(get_session)
):
    """
    Get all repository states.
    
    Returns a list of all repositories and their current states.
    """
    repo_states = await get_all_repository_states(session)
    return repo_states


@router.get("/state/{repo_id}", response_model=RepositoryStateResponse)
async def get_repository_by_id(
    repo_id: UUID,
    session: AsyncSession = Depends(get_session)
):
    """
    Get repository state by ID.
    
    Args:
        repo_id: Repository state UUID
        
    Returns:
        Repository state information
    """
    repo_state = await get_repository_state_by_id(session, repo_id)
    if not repo_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository state with ID {repo_id} not found"
        )
    return repo_state


@router.get("/state/url/{repo_url:path}", response_model=RepositoryStateResponse)
async def get_repository_by_url(
    repo_url: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get repository state by URL.
    
    Args:
        repo_url: Repository URL
        
    Returns:
        Repository state information
    """
    # First, find the repository by URL
    result = await session.execute(
        select(Repository).filter(Repository.url == repo_url)
    )
    repository = result.scalars().first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository with URL {repo_url} not found"
        )
    
    # Then get its state
    repo_state = await get_repository_state(session, repository.id)
    if not repo_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository state for URL {repo_url} not found"
        )
    return repo_state


@router.get("/sync/status", response_model=SyncStatusResponse)
async def get_sync_status(
    session: AsyncSession = Depends(get_session)
):
    """
    Get overall sync status.
    
    Returns information about whether the repository is in sync.
    """
    # Just check if we have a valid repository state
    repo_states = await get_all_repository_states(session)
    
    if not repo_states:
        return {
            "needs_sync": True,
            "last_synced": None,
            "sync_message": "Initial repository sync required",
            "out_of_sync_count": 0
        }
    
    # Use the first repository state (root repository)
    repo = repo_states[0]
    
    # Determine if sync is needed based on repository state
    # In a real implementation, this would check for actual out-of-sync entities
    return {
        "needs_sync": repo.sync_status != "SYNCED",
        "last_synced": repo.last_successful_sync,
        "sync_message": f"Repository status: {repo.sync_status}",
        "out_of_sync_count": 0  # Placeholder for actual count
    }


@router.get("/sync/details")
async def get_sync_details(
    session: AsyncSession = Depends(get_session)
):
    """
    Get detailed sync information.
    
    Returns detailed information about the sync status of various entities.
    """
    # Fetch all repositories to get their sync status
    repo_states = await get_all_repository_states(session)
    
    if not repo_states:
        return {
            "repositories": [],
            "total_count": 0,
            "synced_count": 0,
            "out_of_sync_count": 0,
            "error_count": 0
        }
    
    # Count repositories in different states
    synced_count = 0
    error_count = 0
    
    # Build repository details
    repositories = []
    for repo in repo_states:
        is_synced = repo.sync_status == "SYNCED"
        has_error = repo.sync_status == "ERROR"
        
        if is_synced:
            synced_count += 1
        if has_error:
            error_count += 1
            
        repositories.append({
            "id": str(repo.id),
            "url": repo.repository_url,
            "sync_status": repo.sync_status,
            "last_synced": repo.last_successful_sync,
            "last_attempt": repo.last_sync_attempt,
            "error": repo.sync_error
        })
    
    total_count = len(repo_states)
    out_of_sync_count = total_count - synced_count
    
    return {
        "repositories": repositories,
        "total_count": total_count,
        "synced_count": synced_count,
        "out_of_sync_count": out_of_sync_count,
        "error_count": error_count
    }


@router.post("/sync", response_model=StatusResponse)
async def trigger_sync(
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger a synchronization of the repository.
    """
    # Check if we have a valid repository state
    repo_states = await get_all_repository_states(session)
    
    if not repo_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository not initialized. Cannot sync."
        )
    
    # In a real implementation, this would trigger a sync process
    # For now, just return a success message
    return {
        "status": "success",
        "message": "Sync process started"
    } 