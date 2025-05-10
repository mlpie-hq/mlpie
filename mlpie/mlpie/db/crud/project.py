"""
CRUD operations for Project models.

This module provides database operations for projects.
"""

import logging
from typing import List, Optional, Dict, Any

from sqlalchemy import select
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


async def get_projects(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[ProjectStatus] = None
) -> List[Project]:
    """
    Get a list of projects.
    
    Args:
        session: Database session
        skip: Number of projects to skip
        limit: Maximum number of projects to return
        status: Filter by project status
        
    Returns:
        List of project objects
    """
    query = select(Project)
    
    if status:
        query = query.where(Project.status == status)
        
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def create_project(session: AsyncSession, project_data: Dict[str, Any]) -> Project:
    """
    Create a new project.
    
    Args:
        session: Database session
        project_data: Project data dictionary
        
    Returns:
        Created project object
    """
    project = Project(**project_data)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def update_project(session: AsyncSession, project: Project) -> Project:
    """
    Update a project.
    
    Args:
        session: Database session
        project: Project object to update
        
    Returns:
        Updated project object
    """
    await session.commit()
    await session.refresh(project)
    return project


async def delete_project(session: AsyncSession, name: str) -> bool:
    """
    Delete a project.
    
    Args:
        session: Database session
        name: Project name
        
    Returns:
        True if project was deleted, False if not found
    """
    result = await session.execute(delete(Project).where(Project.name == name))
    await session.commit()
    return result.rowcount > 0


async def reconcile_projects(
    session: AsyncSession,
    scanned_projects: List[Project]
) -> Dict[str, int]:
    """
    Reconcile scanned projects with database state.
    
    Args:
        session: Database session
        scanned_projects: List of projects from scanning
        
    Returns:
        Dictionary with counts of created/updated/unchanged projects
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
            # We need to preserve created_at
            created_at = existing_project.created_at
            
            # Update fields from new project
            existing_project.spec = project.spec
            existing_project.description = project.description
            existing_project.repository_url = project.repository_url
            existing_project.branch = project.branch
            existing_project.status = project.status
            
            # Update in database
            await update_project(session, existing_project)
            counters["updated"] += 1
        else:
            # Create new project
            await create_project(session, {
                "name": project.name,
                "spec": project.spec,
                "description": project.description,
                "repository_url": project.repository_url,
                "branch": project.branch,
                "status": project.status
            })
            counters["created"] += 1
    
    # Optional: Mark projects not found in scan for cleanup
    # This would depend on your reconciliation strategy
    
    return counters 