"""
Projects API Controller.

This module provides REST endpoints for managing projects.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from mlpie.db.models.project import Project, ProjectStatus
from mlpie.db.connection import get_session, AsyncSession
from sqlalchemy import select

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
    query = select(Project).limit(limit).offset(skip).order_by(Project.name)
    if status_filter:
        query = query.where(Project.status == status_filter)
    result = await session.execute(query)
    projects = result.scalars().all()
    return projects


@router.get("/{project_name}", response_model=ProjectResponse)
async def get_project(
    project_name: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific project by its name."""
    project = await session.get(Project, project_name)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with name '{project_name}' not found.",
        )
    return project
