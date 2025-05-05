"""
CRUD operations for Project models.

This module provides database operations for projects.
"""

import logging
import uuid
from typing import List, Optional, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.project import Project, ProjectStatus

logger = logging.getLogger(__name__)


async def get_project_by_name(session: AsyncSession, name: str) -> Optional[Project]:
    """
    Get a project by name.
    
    Args:
        session: Database session
        name: Project name
        
    Returns:
        Project instance or None if not found
    """
    result = await session.execute(select(Project).where(Project.name == name))
    return result.scalars().first()


async def get_project_by_id(session: AsyncSession, project_id: uuid.UUID) -> Optional[Project]:
    """
    Get a project by ID.
    
    Args:
        session: Database session
        project_id: Project ID
        
    Returns:
        Project instance or None if not found
    """
    result = await session.execute(select(Project).where(Project.id == project_id))
    return result.scalars().first()


async def get_all_projects(session: AsyncSession) -> List[Project]:
    """
    Get all projects.
    
    Args:
        session: Database session
        
    Returns:
        List of Project instances
    """
    result = await session.execute(select(Project))
    return result.scalars().all()


async def get_active_projects(session: AsyncSession) -> List[Project]:
    """
    Get all active projects.
    
    Args:
        session: Database session
        
    Returns:
        List of active Project instances
    """
    result = await session.execute(
        select(Project).where(Project.status == ProjectStatus.ACTIVE)
    )
    return result.scalars().all()


async def create_project(session: AsyncSession, project: Project) -> Project:
    """
    Create a new project.
    
    Args:
        session: Database session
        project: Project instance
        
    Returns:
        Created Project instance
    """
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def update_project(session: AsyncSession, project: Project) -> Project:
    """
    Update an existing project.
    
    Args:
        session: Database session
        project: Project instance with updated values
        
    Returns:
        Updated Project instance
    """
    await session.commit()
    await session.refresh(project)
    return project


async def delete_project(session: AsyncSession, project_id: uuid.UUID) -> bool:
    """
    Delete a project.
    
    Args:
        session: Database session
        project_id: ID of the project to delete
        
    Returns:
        True if project was deleted, False if not found
    """
    result = await session.execute(delete(Project).where(Project.id == project_id))
    await session.commit()
    return result.rowcount > 0


async def reconcile_projects(
    session: AsyncSession, 
    scanned_projects: List[Project],
    source_path_prefix: Optional[str] = None
) -> Dict[str, int]:
    """
    Reconcile scanned projects with database state.
    
    Args:
        session: Database session
        scanned_projects: List of projects from scanning
        source_path_prefix: Optional prefix to add to source paths
        
    Returns:
        Dictionary with counts of created/updated/deleted projects
    """
    counters = {
        "created": 0,
        "updated": 0,
        "unchanged": 0
    }
    
    # Track processed projects by name for potential cleanup
    processed_names = set()
    
    # Process each scanned project
    for project in scanned_projects:
        name = project.name
        processed_names.add(name)
        
        # Check if project exists
        existing_project = await get_project_by_name(session, name)
        
        if existing_project:
            # Update existing project
            # We need to preserve ID and created_at
            project_id = existing_project.id
            created_at = existing_project.created_at
            
            # Update fields from new project
            existing_project.spec = project.spec
            existing_project.repository_url = project.repository_url
            existing_project.branch = project.branch
            existing_project.description = project.description
            existing_project.status = project.status
            existing_project.source_path = project.source_path
            
            # Update in database
            await update_project(session, existing_project)
            counters["updated"] += 1
        else:
            # Create new project
            await create_project(session, project)
            counters["created"] += 1
    
    # Optional: Mark projects not found in scan for cleanup
    # This would depend on your reconciliation strategy
    
    return counters 