"""
CRUD operations for environment entities.

This module provides functions for creating, reading, updating, and deleting environment entities in the database.
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from mlpie.db.models.environment import Environment
from mlpie.db.models.project import Project

logger = logging.getLogger(__name__)


async def create_environment(session: AsyncSession, environment_data: Dict[Any, Any]) -> Environment:
    """
    Create a new environment in the database.
    
    Args:
        session: Database session
        environment_data: Environment data dictionary
        
    Returns:
        Environment: Created environment object
    """
    # Create environment instance from YAML spec
    environment = Environment.from_yaml_spec(environment_data)
    
    session.add(environment)
    await session.commit()
    await session.refresh(environment)
    return environment


async def get_environment_by_id(session: AsyncSession, environment_id: UUID) -> Optional[Environment]:
    """
    Get an environment by ID.
    
    Args:
        session: Database session
        environment_id: Environment ID
        
    Returns:
        Environment instance or None if not found
    """
    result = await session.execute(select(Environment).where(Environment.id == environment_id))
    return result.scalars().first()


async def get_environment_by_name(session: AsyncSession, name: str) -> Optional[Environment]:
    """
    Get an environment by name.
    
    Args:
        session: Database session
        name: Environment name
        
    Returns:
        Environment instance or None if not found
    """
    result = await session.execute(select(Environment).where(Environment.name == name))
    return result.scalars().first()


async def get_environments(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    project_name: Optional[str] = None
) -> List[Environment]:
    """
    Get a list of environments.
    
    Args:
        session: Database session
        skip: Number of environments to skip
        limit: Maximum number of environments to return
        project_name: Filter by project name
        
    Returns:
        List of environment objects
    """
    query = select(Environment)
    
    if project_name:
        query = query.where(Environment.project_name == project_name)
        
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def update_environment_from_spec(
    session: AsyncSession,
    environment_id: UUID,
    environment_data: Dict[str, Any]
) -> Optional[Environment]:
    """
    Update an environment from a YAML specification.
    
    Args:
        session: Database session
        environment_id: Environment ID
        environment_data: Environment data dictionary
        
    Returns:
        Updated environment object if found, None otherwise
    """
    environment = await get_environment_by_id(session, environment_id)
    if not environment:
        return None
    
    # Update core fields from spec
    metadata = environment_data.get("metadata", {})
    environment.name = metadata.get("name", environment.name)
    environment.description = metadata.get("description", environment.description)
    environment.version = metadata.get("version", environment.version)
    environment.labels = metadata.get("labels", environment.labels)
    
    # Store the complete specification
    environment.spec = environment_data
    
    await session.commit()
    await session.refresh(environment)
    return environment


async def update_environment(session: AsyncSession, environment: Environment) -> Environment:
    """
    Update an environment.
    
    Args:
        session: Database session
        environment: Environment object to update
        
    Returns:
        Updated environment object
    """
    await session.commit()
    await session.refresh(environment)
    return environment


async def delete_environment(session: AsyncSession, name: str) -> bool:
    """
    Delete an environment.
    
    Args:
        session: Database session
        name: Environment name
        
    Returns:
        True if environment was deleted, False if not found
    """
    result = await session.execute(delete(Environment).where(Environment.name == name))
    await session.commit()
    return result.rowcount > 0


async def reconcile_environments(
    session: AsyncSession,
    scanned_environments: List[Environment]
) -> Dict[str, int]:
    """
    Reconcile scanned environments with database state.
    
    Args:
        session: Database session
        scanned_environments: List of environments from scanning
        
    Returns:
        Dictionary with counts of created/updated/unchanged environments
    """
    counters = {
        "created": 0,
        "updated": 0,
        "unchanged": 0
    }
    
    # Track processed environments by name for potential cleanup
    processed_names = set()
    
    # Process each scanned environment
    for environment in scanned_environments:
        name = environment.name
        processed_names.add(name)
        
        # Check if environment exists
        existing_environment = await get_environment_by_name(session, name)
        
        if existing_environment:
            # Update existing environment
            # We need to preserve created_at
            created_at = existing_environment.created_at
            
            # Update fields from new environment
            existing_environment.spec = environment.spec
            existing_environment.description = environment.description
            existing_environment.version = environment.version
            existing_environment.labels = environment.labels
            existing_environment.active = environment.active
            existing_environment.project_name = environment.project_name
            
            # Update in database
            await update_environment(session, existing_environment)
            counters["updated"] += 1
        else:
            # Create new environment
            await create_environment(session, {
                "name": environment.name,
                "spec": environment.spec,
                "description": environment.description,
                "version": environment.version,
                "labels": environment.labels,
                "active": environment.active,
                "project_name": environment.project_name
            })
            counters["created"] += 1
    
    return counters 