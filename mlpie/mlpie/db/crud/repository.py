"""
Repository CRUD Operations.

This module provides functions for managing repositories in the database.
"""

import logging
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, UTC
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.repository import Repository, RepositoryState, EntityType, SyncStatus, AuthType

logger = logging.getLogger(__name__)


async def create_repository(
    session: AsyncSession,
    url: str,
    entity_type: str,
    entity_id: str,
    name: Optional[str] = None,
    ref: str = "main",
    path_in_repo: Optional[str] = None,
    resource_types: List[str] = None,
    scan_interval_seconds: Optional[int] = None,
    auth_type: str = "none",
    secret_ref: Optional[str] = None,
    token_secret_key: Optional[str] = None,
    username_secret_key: Optional[str] = None,
    password_secret_key: Optional[str] = None,
    ssh_key_secret_key: Optional[str] = None
) -> Repository:
    """
    Create a new repository record.
    
    Args:
        session: Database session
        url: Repository URL
        entity_type: Type of entity that owns the repository
        entity_id: ID of the owning entity
        name: Optional name for the repository
        ref: Branch, tag, or commit to use
        path_in_repo: Path within repo to scan for resources
        resource_types: Types of resources this repo manages
        scan_interval_seconds: Custom scan interval for this repo
        auth_type: Authentication type
        secret_ref: Reference to secret with credentials
        token_secret_key: Key in secret for token
        username_secret_key: Key in secret for username
        password_secret_key: Key in secret for password
        ssh_key_secret_key: Key in secret for SSH key
        
    Returns:
        Created repository object
    """
    if not resource_types:
        resource_types = ["*"]
        
    # Create repository
    repository = Repository(
        url=url,
        entity_type=entity_type,
        entity_id=entity_id,
        name=name,
        ref=ref,
        path_in_repo=path_in_repo,
        resource_types=resource_types,
        scan_interval_seconds=scan_interval_seconds,
        auth_type=auth_type,
        secret_ref=secret_ref,
        token_secret_key=token_secret_key,
        username_secret_key=username_secret_key,
        password_secret_key=password_secret_key,
        ssh_key_secret_key=ssh_key_secret_key
    )
    
    # Add to session
    session.add(repository)
    await session.flush()
    
    # Create initial repository state
    repository_state = RepositoryState(
        repository_id=repository.id,
        sync_status=SyncStatus.UNKNOWN
    )
    
    session.add(repository_state)
    await session.commit()
    
    return repository


async def get_repository(
    session: AsyncSession,
    repository_id: Union[str, UUID]
) -> Optional[Repository]:
    """
    Get a repository by ID.
    
    Args:
        session: Database session
        repository_id: Repository ID
        
    Returns:
        Repository object or None if not found
    """
    result = await session.execute(
        select(Repository).filter(Repository.id == repository_id)
    )
    
    return result.scalars().first()


async def get_repositories_by_entity(
    session: AsyncSession,
    entity_type: str,
    entity_id: str
) -> List[Repository]:
    """
    Get repositories for a specific entity.
    
    Args:
        session: Database session
        entity_type: Type of entity
        entity_id: ID of the entity
        
    Returns:
        List of repository objects
    """
    result = await session.execute(
        select(Repository).filter(
            Repository.entity_type == entity_type,
            Repository.entity_id == entity_id
        )
    )
    
    return list(result.scalars().all())


async def get_master_repository(
    session: AsyncSession
) -> Optional[Repository]:
    """
    Get the master repository.
    
    Args:
        session: Database session
        
    Returns:
        Master repository object or None if not found
    """
    result = await session.execute(
        select(Repository).filter(Repository.entity_type == EntityType.MASTER)
    )
    
    return result.scalars().first()


async def update_repository(
    session: AsyncSession,
    repository_id: Union[str, UUID],
    **kwargs
) -> Optional[Repository]:
    """
    Update a repository.
    
    Args:
        session: Database session
        repository_id: Repository ID
        **kwargs: Fields to update
        
    Returns:
        Updated repository object or None if not found
    """
    # Update repository
    await session.execute(
        update(Repository)
        .where(Repository.id == repository_id)
        .values(**kwargs)
    )
    
    # Get updated repository
    result = await session.execute(
        select(Repository).filter(Repository.id == repository_id)
    )
    
    repository = result.scalars().first()
    
    if repository:
        await session.commit()
        
    return repository


async def delete_repository(
    session: AsyncSession,
    repository_id: Union[str, UUID]
) -> bool:
    """
    Delete a repository.
    
    Args:
        session: Database session
        repository_id: Repository ID
        
    Returns:
        True if deleted, False if not found
    """
    # Delete repository states first
    await session.execute(
        delete(RepositoryState).where(RepositoryState.repository_id == repository_id)
    )
    
    # Delete repository
    result = await session.execute(
        delete(Repository).where(Repository.id == repository_id)
    )
    
    if result.rowcount > 0:
        await session.commit()
        return True
    else:
        return False


async def get_repository_state(
    session: AsyncSession,
    repository_id: Union[str, UUID]
) -> Optional[RepositoryState]:
    """
    Get the current state of a repository.
    
    Args:
        session: Database session
        repository_id: Repository ID
        
    Returns:
        Repository state object or None if not found
    """
    result = await session.execute(
        select(RepositoryState)
        .filter(RepositoryState.repository_id == repository_id)
        .order_by(RepositoryState.updated_at.desc())
        .limit(1)
    )
    
    return result.scalars().first()


async def get_repository_state_by_id(
    session: AsyncSession,
    state_id: Union[str, UUID]
) -> Optional[RepositoryState]:
    """
    Get a repository state by its ID.
    
    Args:
        session: Database session
        state_id: Repository state ID
        
    Returns:
        Repository state object or None if not found
    """
    result = await session.execute(
        select(RepositoryState)
        .filter(RepositoryState.id == state_id)
    )
    
    return result.scalars().first()


async def get_all_repository_states(
    session: AsyncSession
) -> List[RepositoryState]:
    """
    Get all repository states.
    
    Args:
        session: Database session
        
    Returns:
        List of repository state objects
    """
    # Join with Repository to get repository information
    result = await session.execute(
        select(RepositoryState, Repository)
        .join(Repository, RepositoryState.repository_id == Repository.id)
        .order_by(Repository.entity_type, Repository.entity_id)
    )
    
    states = []
    for state, repo in result:
        # Add repository URL to state object for convenience
        state.repository_url = repo.url
        states.append(state)
    
    return states


async def create_repository_state(
    session: AsyncSession,
    repository_id: Union[str, UUID],
    commit_sha: Optional[str] = None,
    commit_short_sha: Optional[str] = None,
    commit_message: Optional[str] = None,
    commit_author: Optional[str] = None,
    commit_date: Optional[datetime] = None,
    sync_status: SyncStatus = SyncStatus.UNKNOWN,
    is_local_repo_valid: bool = False,
    sync_error: Optional[str] = None
) -> RepositoryState:
    """
    Create a new repository state record.
    
    Args:
        session: Database session
        repository_id: Repository ID
        commit_sha: Full SHA of the current commit
        commit_short_sha: Short SHA (for display)
        commit_message: Message of the current commit
        commit_author: Author of the current commit
        commit_date: Date of the current commit
        sync_status: Sync status
        is_local_repo_valid: Whether the local repo exists and is valid
        sync_error: Error message from last failed sync
        
    Returns:
        Created repository state object
    """
    # Create repository state
    repository_state = RepositoryState(
        repository_id=repository_id,
        commit_sha=commit_sha,
        commit_short_sha=commit_short_sha,
        commit_message=commit_message,
        commit_author=commit_author,
        commit_date=commit_date,
        sync_status=sync_status,
        is_local_repo_valid=is_local_repo_valid,
        sync_error=sync_error
    )
    
    # For status changes, update timestamps
    if sync_status == SyncStatus.SYNCING:
        repository_state.last_sync_attempt = datetime.now(UTC)
    elif sync_status == SyncStatus.IDLE:
        repository_state.last_successful_sync = datetime.now(UTC)
        
    # Add to session
    session.add(repository_state)
    await session.commit()
    await session.refresh(repository_state)
    
    return repository_state


async def update_repository_state(
    session: AsyncSession,
    repository_id: Union[str, UUID],
    sync_status: Optional[SyncStatus] = None,
    is_local_repo_valid: Optional[bool] = None,
    sync_error: Optional[str] = None
) -> Optional[RepositoryState]:
    """
    Update repository state with sync status information.
    
    Args:
        session: Database session
        repository_id: Repository ID
        sync_status: New sync status
        is_local_repo_valid: Whether the local repo exists and is valid
        sync_error: Error message from last failed sync
        
    Returns:
        Updated repository state object or None if not found
    """
    # Get current state
    repo_state = await get_repository_state(session, repository_id)
    
    if not repo_state:
        # Create new state if not found
        return await create_repository_state(
            session=session,
            repository_id=repository_id,
            sync_status=sync_status or SyncStatus.UNKNOWN,
            is_local_repo_valid=is_local_repo_valid if is_local_repo_valid is not None else False,
            sync_error=sync_error
        )
    
    # Update state
    update_data = {}
    
    if sync_status is not None:
        update_data["sync_status"] = sync_status
        
        # Update timestamps based on status
        if sync_status == SyncStatus.SYNCING:
            update_data["last_sync_attempt"] = datetime.now(UTC)
        elif sync_status == SyncStatus.IDLE:
            update_data["last_successful_sync"] = datetime.now(UTC)
            update_data["sync_error"] = None  # Clear error on success
    
    if is_local_repo_valid is not None:
        update_data["is_local_repo_valid"] = is_local_repo_valid
        
    if sync_error is not None:
        update_data["sync_error"] = sync_error
    
    # Apply updates if any
    if update_data:
        await session.execute(
            update(RepositoryState)
            .where(RepositoryState.id == repo_state.id)
            .values(**update_data)
        )
        
        await session.commit()
        
        # Refresh state
        result = await session.execute(
            select(RepositoryState).filter(RepositoryState.id == repo_state.id)
        )
        
        repo_state = result.scalars().first()
    
    return repo_state


async def update_after_git_pull(
    session: AsyncSession,
    repository_id: Union[str, UUID],
    commit_sha: str,
    commit_short_sha: str,
    commit_message: str,
    commit_author: str,
    commit_date: datetime,
    is_local_repo_valid: bool = True
) -> Optional[RepositoryState]:
    """
    Update repository state after successful git pull.
    
    Args:
        session: Database session
        repository_id: Repository ID
        commit_sha: Full SHA of the current commit
        commit_short_sha: Short SHA (for display)
        commit_message: Message of the current commit
        commit_author: Author of the current commit
        commit_date: Date of the current commit
        is_local_repo_valid: Whether the local repo exists and is valid
        
    Returns:
        Updated repository state object or None if not found
    """
    # Get current state
    repo_state = await get_repository_state(session, repository_id)
    
    if not repo_state:
        # Create new state if not found
        return await create_repository_state(
            session=session,
            repository_id=repository_id,
            commit_sha=commit_sha,
            commit_short_sha=commit_short_sha,
            commit_message=commit_message,
            commit_author=commit_author,
            commit_date=commit_date,
            sync_status=SyncStatus.IDLE,
            is_local_repo_valid=is_local_repo_valid
        )
    
    # Update state
    update_data = {
        "commit_sha": commit_sha,
        "commit_short_sha": commit_short_sha,
        "commit_message": commit_message,
        "commit_author": commit_author,
        "commit_date": commit_date,
        "sync_status": SyncStatus.IDLE,
        "is_local_repo_valid": is_local_repo_valid,
        "last_successful_sync": datetime.now(UTC),
        "sync_error": None  # Clear error on success
    }
    
    await session.execute(
        update(RepositoryState)
        .where(RepositoryState.id == repo_state.id)
        .values(**update_data)
    )
    
    await session.commit()
    
    # Refresh state
    result = await session.execute(
        select(RepositoryState).filter(RepositoryState.id == repo_state.id)
    )
    
    return result.scalars().first()


async def set_sync_status(
    session: AsyncSession,
    repository_id: Union[str, UUID],
    status: SyncStatus,
    error_message: Optional[str] = None
) -> Optional[RepositoryState]:
    """
    Update repository sync status.
    
    Args:
        session: Database session
        repository_id: Repository ID
        status: New sync status
        error_message: Error message (if status is ERROR)
        
    Returns:
        Updated repository state object or None if not found
    """
    # Set error message if status is ERROR
    sync_error = error_message if status == SyncStatus.ERROR else None
    
    return await update_repository_state(
        session=session,
        repository_id=repository_id,
        sync_status=status,
        sync_error=sync_error
    )


async def get_or_create_repository_state(
    session: AsyncSession,
    repository_id: Union[str, UUID]
) -> RepositoryState:
    """
    Get or create repository state.
    
    Args:
        session: Database session
        repository_id: Repository ID
        
    Returns:
        Repository state object (existing or newly created)
    """
    # Get current state
    repo_state = await get_repository_state(session, repository_id)
    
    if not repo_state:
        # Create new state if not found
        repo_state = await create_repository_state(
            session=session,
            repository_id=repository_id
        )
    
    return repo_state


async def delete_repository_state(
    session: AsyncSession,
    state_id: Union[str, UUID]
) -> bool:
    """
    Delete a repository state.
    
    Args:
        session: Database session
        state_id: Repository state ID
        
    Returns:
        True if deleted, False if not found
    """
    result = await session.execute(
        delete(RepositoryState).where(RepositoryState.id == state_id)
    )
    
    if result.rowcount > 0:
        await session.commit()
        return True
    else:
        return False


async def find_repositories_for_resource_type(
    session: AsyncSession,
    resource_type: str
) -> List[Repository]:
    """
    Find repositories that manage a specific resource type.
    
    Args:
        session: Database session
        resource_type: Type of resource
        
    Returns:
        List of repository objects
    """
    # This is a more complex query that should check the resource_types array
    # But for now, we'll use a simpler approach
    result = await session.execute(
        select(Repository)
    )
    
    repositories = list(result.scalars().all())
    
    # Filter repositories that manage this resource type
    return [repo for repo in repositories if repo.manages_resource_type(resource_type)] 