"""
CRUD Operations for Repository State Management.

This module provides database operations for tracking repository state.
"""

import logging
from typing import Any, Dict, List, Optional, Union, TypeVar, Type, cast
from uuid import UUID
from datetime import datetime, UTC

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from mlpie.db.models.repository import RepositoryState, SyncStatus


logger = logging.getLogger(__name__)


async def get_repository_state(
    session: AsyncSession, 
    repository_url: str
) -> Optional[RepositoryState]:
    """Get repository state by URL.
    
    Args:
        session: Database session
        repository_url: Repository URL to retrieve state for
        
    Returns:
        RepositoryState object if found, None otherwise
    """
    result = await session.execute(
        select(RepositoryState).where(RepositoryState.repository_url == repository_url)
    )
    return result.scalars().first()


async def get_repository_state_by_id(
    session: AsyncSession, 
    repo_id: UUID
) -> Optional[RepositoryState]:
    """Get repository state by ID.
    
    Args:
        session: Database session
        repo_id: Repository UUID
        
    Returns:
        RepositoryState object if found, None otherwise
    """
    result = await session.execute(
        select(RepositoryState).where(RepositoryState.id == repo_id)
    )
    return result.scalars().first()


async def get_all_repository_states(
    session: AsyncSession
) -> List[RepositoryState]:
    """Get all repository states.
    
    Args:
        session: Database session
        
    Returns:
        List of RepositoryState objects
    """
    result = await session.execute(select(RepositoryState))
    return result.scalars().all()


async def create_repository_state(
    session: AsyncSession,
    repository_url: str,
    repository_path: str,
    current_branch: str = "main",
    commit_sha: Optional[str] = None,
    commit_short_sha: Optional[str] = None,
    commit_message: Optional[str] = None,
    commit_author: Optional[str] = None,
    commit_date: Optional[datetime] = None,
    sync_status: SyncStatus = SyncStatus.UNKNOWN,
    is_local_repo_valid: bool = False,
    commit: bool = True
) -> RepositoryState:
    """Create a new repository state record.
    
    Args:
        session: Database session
        repository_url: URL of the repository
        repository_path: Local path to the repository
        current_branch: Current Git branch
        commit_sha: Full SHA of the current commit
        commit_short_sha: Short SHA of the current commit
        commit_message: Message of the current commit
        commit_author: Author of the current commit
        commit_date: Date of the current commit
        sync_status: Current sync status
        is_local_repo_valid: Whether the local repo exists and is valid
        commit: Whether to commit the transaction
        
    Returns:
        The created RepositoryState object
    """
    repo_state = RepositoryState(
        repository_url=repository_url,
        repository_path=repository_path,
        current_branch=current_branch,
        commit_sha=commit_sha,
        commit_short_sha=commit_short_sha,
        commit_message=commit_message,
        commit_author=commit_author,
        commit_date=commit_date,
        sync_status=sync_status,
        is_local_repo_valid=is_local_repo_valid,
        last_sync_attempt=datetime.now(UTC) if sync_status != SyncStatus.UNKNOWN else None,
        last_successful_sync=datetime.now(UTC) if sync_status == SyncStatus.IDLE else None
    )
    
    session.add(repo_state)
    
    if commit:
        await session.commit()
        await session.refresh(repo_state)
    
    return repo_state


async def update_repository_state(
    session: AsyncSession,
    repository_url: str,
    updates: Dict[str, Any],
    commit: bool = True
) -> Optional[RepositoryState]:
    """Update repository state.
    
    Args:
        session: Database session
        repository_url: Repository URL to update
        updates: Dictionary of field->value to update
        commit: Whether to commit the transaction
        
    Returns:
        Updated RepositoryState if found, None otherwise
    """
    repo_state = await get_repository_state(session, repository_url)
    
    if not repo_state:
        return None
    
    # Update fields
    for key, value in updates.items():
        if hasattr(repo_state, key):
            setattr(repo_state, key, value)
    
    # Special handling for sync timestamps
    if 'sync_status' in updates:
        # Always update last_sync_attempt when sync_status changes
        repo_state.last_sync_attempt = datetime.now(UTC)
        
        # Update last_successful_sync if sync was successful
        if updates['sync_status'] == SyncStatus.IDLE:
            repo_state.last_successful_sync = datetime.now(UTC)
    
    if commit:
        await session.commit()
        await session.refresh(repo_state)
    
    return repo_state


async def update_after_git_pull(
    session: AsyncSession,
    repository_url: str,
    was_pulled: bool,
    current_sha: Optional[str],
    is_local_repo_valid: bool = True,
    current_branch: Optional[str] = None,
    commit_message: Optional[str] = None,
    commit_author: Optional[str] = None,
    commit_date: Optional[datetime] = None,
    error_message: Optional[str] = None,
    commit: bool = True
) -> Optional[RepositoryState]:
    """Update repository state after a Git pull operation.
    
    Args:
        session: Database session
        repository_url: Repository URL
        was_pulled: Whether changes were pulled
        current_sha: Current commit SHA after pull
        is_local_repo_valid: Whether the local repo is valid
        current_branch: Current Git branch
        commit_message: Message of the current commit
        commit_author: Author of the current commit
        commit_date: Date of the current commit
        error_message: Error message if the operation failed
        commit: Whether to commit the transaction
        
    Returns:
        Updated RepositoryState if found, None otherwise
    """
    updates = {
        'is_local_repo_valid': is_local_repo_valid,
        'sync_status': SyncStatus.ERROR if error_message else SyncStatus.IDLE,
        'sync_error': error_message
    }
    
    if current_sha:
        updates['commit_sha'] = current_sha
        updates['commit_short_sha'] = current_sha[:7] if len(current_sha) >= 7 else current_sha
    
    if current_branch:
        updates['current_branch'] = current_branch
        
    if commit_message:
        updates['commit_message'] = commit_message
        
    if commit_author:
        updates['commit_author'] = commit_author
        
    if commit_date:
        updates['commit_date'] = commit_date
    
    return await update_repository_state(
        session=session,
        repository_url=repository_url,
        updates=updates,
        commit=commit
    )


async def set_sync_status(
    session: AsyncSession,
    repository_url: str,
    status: SyncStatus,
    error_message: Optional[str] = None,
    commit: bool = True
) -> Optional[RepositoryState]:
    """Update repository sync status.
    
    Args:
        session: Database session
        repository_url: Repository URL
        status: New sync status
        error_message: Error message if status is ERROR
        commit: Whether to commit the transaction
        
    Returns:
        Updated RepositoryState if found, None otherwise
    """
    updates = {
        'sync_status': status,
    }
    
    if status == SyncStatus.ERROR and error_message:
        updates['sync_error'] = error_message
    elif status != SyncStatus.ERROR:
        updates['sync_error'] = None
    
    return await update_repository_state(
        session=session,
        repository_url=repository_url,
        updates=updates,
        commit=commit
    )


async def delete_repository_state(
    session: AsyncSession,
    repository_url: str,
    commit: bool = True
) -> bool:
    """Delete repository state.
    
    Args:
        session: Database session
        repository_url: Repository URL to delete
        commit: Whether to commit the transaction
        
    Returns:
        True if a repository state was deleted, False otherwise
    """
    result = await session.execute(
        delete(RepositoryState).where(RepositoryState.repository_url == repository_url)
    )
    
    if commit:
        await session.commit()
    
    return result.rowcount > 0


async def get_or_create_repository_state(
    session: AsyncSession,
    repository_url: str,
    repository_path: str,
    current_branch: str = "main",
    commit_sha: Optional[str] = None,
    is_local_repo_valid: bool = False,
    commit: bool = True
) -> RepositoryState:
    """Get or create repository state.
    
    Args:
        session: Database session
        repository_url: Repository URL
        repository_path: Local path to the repository
        current_branch: Current Git branch
        commit_sha: Current commit SHA
        is_local_repo_valid: Whether the local repo exists and is valid
        commit: Whether to commit the transaction
        
    Returns:
        RepositoryState object (either existing or newly created)
    """
    repo_state = await get_repository_state(session, repository_url)
    
    if repo_state:
        return repo_state
    
    return await create_repository_state(
        session=session,
        repository_url=repository_url,
        repository_path=repository_path,
        current_branch=current_branch,
        commit_sha=commit_sha,
        commit_short_sha=commit_sha[:7] if commit_sha and len(commit_sha) >= 7 else None,
        sync_status=SyncStatus.UNKNOWN,
        is_local_repo_valid=is_local_repo_valid,
        commit=commit
    ) 