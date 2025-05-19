"""
Projects API Controller.

This module provides REST endpoints for managing projects.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from mlpie.db.models.project import Project, ProjectStatus
from mlpie.db.models.environment import Environment
from mlpie.db.connection import get_session, AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from mlpie.api.schemas.environment import EnvironmentResponse

import logging

logger = logging.getLogger(__name__)


# Define API models
class ProjectBase(BaseModel):
    """Base model for project operations."""

    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    # Typically, project creation might come from GitOps, but an API might be useful
    repository_url: str
    branch: Optional[str] = "main"


class ProjectResponse(ProjectBase):
    """Response model for project operations."""

    name: str
    repository_url: str
    branch: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    source_path: Optional[str] = None

    class Config:
        from_attributes = True
        
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        """Custom model validation to handle repository fields."""
        if hasattr(obj, "get_repository_url") and hasattr(obj, "get_repository_branch"):
            # Create a modified object with repository fields
            obj_dict = {
                "name": obj.name,
                "description": obj.description,
                "repository_url": obj.get_repository_url(),
                "branch": obj.get_repository_branch(),
                "status": obj.status,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
                "source_path": obj.source_path
            }
            return super().model_validate(obj_dict, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)


# Create router
router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    session: AsyncSession = Depends(get_session),
    status_filter: Optional[ProjectStatus] = Query(
        None, alias="status"
    ),
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
):
    """List all projects, with optional status filtering."""
    logger.info(f"Listing projects with status filter: {status_filter}")
    query = select(Project).options(selectinload(Project.repositories)).limit(limit).offset(skip).order_by(Project.name)
    if status_filter:
        query = query.where(Project.status == status_filter)
    result = await session.execute(query)
    projects = result.scalars().all()
    
    # Transform the projects to include repository information
    transformed_projects = []
    for project in projects:
        transformed_project = {
            "name": project.name,
            "description": project.description,
            "repository_url": project.get_repository_url(),
            "branch": project.get_repository_branch(),
            "status": project.status,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "source_path": project.source_path
        }
        transformed_projects.append(transformed_project)
    
    return transformed_projects


@router.get("/{project_name}", response_model=ProjectResponse)
async def get_project(
    project_name: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific project by its name."""
    # Eagerly load repositories
    query = select(Project).options(selectinload(Project.repositories)).where(Project.name == project_name)
    result = await session.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with name '{project_name}' not found.",
        )
    
    # Transform the project to include repository information
    transformed_project = {
        "name": project.name,
        "description": project.description,
        "repository_url": project.get_repository_url(),
        "branch": project.get_repository_branch(),
        "status": project.status,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "source_path": project.source_path
    }
    
    return transformed_project


@router.get("/{project_name}/environments", response_model=List[EnvironmentResponse])
async def list_project_environments(
    project_name: str,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
):
    """List all environments for a specific project."""
    logger.info(f"Listing environments for project: {project_name}")
    
    # First, check if the project exists
    project = await session.get(Project, project_name)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with name '{project_name}' not found.",
        )
        
    query = (
        select(Environment)
        .where(Environment.project_name == project_name)
        .limit(limit)
        .offset(skip)
        .order_by(Environment.name)
    )
    result = await session.execute(query)
    environments = result.scalars().all()
    return environments
