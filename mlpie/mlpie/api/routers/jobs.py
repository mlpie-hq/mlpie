"""
API Routes for job operations.

This module defines the API endpoints for managing and monitoring jobs.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from mlpie.db.connection import get_session
from mlpie.db.crud.job import (
    get_job,
    get_jobs,
    update_job_status,
    append_job_logs,
    get_active_jobs_count,
    get_failed_jobs_count
)
from mlpie.db.crud.environment import get_environment_by_id
from mlpie.db.crud.dataset import get_dataset_by_id
from mlpie.jobs import JobManager, JobStatus, get_job_manager


# Create router
router = APIRouter(
    prefix="/jobs",
    tags=["jobs"],
)


# Request model for profile dataset
class ProfileDatasetRequest(BaseModel):
    dataset_id: str
    profiler_name: Optional[str] = None
    environment_id: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


@router.get("/", response_model=List[Dict[str, Any]])
async def list_jobs(
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    dataset_id: Optional[UUID] = None,
    environment_id: Optional[UUID] = None
):
    """
    List all jobs with optional filtering.
    
    Args:
        session: Database session
        skip: Number of items to skip
        limit: Maximum number of items to return
        status: Filter jobs by status
        job_type: Filter jobs by type
        dataset_id: Filter jobs by dataset ID
        environment_id: Filter jobs by environment ID
        
    Returns:
        List of job dictionaries
    """
    job_manager = get_job_manager()
    jobs = await job_manager.get_jobs(
        skip=skip,
        limit=limit,
        status=status,
        job_type=job_type,
        dataset_id=dataset_id,
        environment_id=environment_id
    )
    return [job.to_dict() for job in jobs]


@router.get("/{job_id}", response_model=Dict[str, Any])
async def get_job_by_id(
    job_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get a job by ID.
    
    Args:
        job_id: Job ID
        session: Database session
        
    Returns:
        Job dictionary
    """
    job = await get_job(session, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    return job.to_dict()


@router.get("/{job_id}/logs", response_model=Dict[str, Any])
async def get_job_logs(
    job_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get the logs for a job.
    
    Args:
        job_id: Job ID
        session: Database session
        
    Returns:
        Dictionary with job logs
    """
    job = await get_job(session, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    return {
        "id": str(job.id),
        "name": job.name,
        "job_type": job.job_type,
        "status": job.status,
        "logs": job.logs or ""
    }


@router.post("/{job_id}/cancel", response_model=Dict[str, Any])
async def cancel_job(
    job_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Cancel a running job.
    
    Args:
        job_id: Job ID
        session: Database session
        
    Returns:
        Dictionary with cancellation result
    """
    job = await get_job(session, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    if job.status != JobStatus.RUNNING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not in running state"
        )
    
    job_manager = get_job_manager()
    cancelled = await job_manager.cancel_job(job_id)
    
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job {job_id}"
        )
    
    return {
        "id": str(job.id),
        "status": JobStatus.CANCELLED.value,
        "message": "Job cancelled successfully"
    }


@router.post("/profile-dataset", response_model=Dict[str, Any])
async def create_profile_job(
    request: ProfileDatasetRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Create a job to profile a dataset.
    
    Args:
        request: Profile job request parameters
        session: Database session
        
    Returns:
        Dictionary with job information
    """
    # Get the dataset
    dataset_id = UUID(request.dataset_id) if request.dataset_id else None
    dataset = await get_dataset_by_id(session, dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} not found"
        )
    
    # Check environment if specified
    environment = None
    if request.environment_id:
        environment_id = UUID(request.environment_id) if request.environment_id else None
        environment = await get_environment_by_id(session, environment_id)
        if not environment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Environment with ID {environment_id} not found"
            )
    
    # Use profiler from dataset config if not specified
    profiler_name = request.profiler_name or dataset.profiler_name
    
    # Create job parameters
    parameters = {
        "dataset_id": str(dataset_id),
        "profiler_name": profiler_name,
        "config": request.config or dataset.profile_config or {}
    }
    
    # Add environment_id to parameters if specified
    if request.environment_id:
        parameters["environment_id"] = request.environment_id
    
    # Create job
    job_manager = get_job_manager()
    job = await job_manager.create_job(
        job_type="profile_dataset",
        parameters=parameters,
        name=f"Profile {dataset.name}",
        dataset_id=dataset_id,
        environment_id=UUID(request.environment_id) if request.environment_id else None
    )
    
    return {
        "job_id": str(job.id),
        "status": job.status,
        "message": f"Profiling job created for dataset {dataset.name}"
    }


@router.get("/stats/count", response_model=Dict[str, int])
async def get_job_stats(
    session: AsyncSession = Depends(get_session),
):
    """
    Get job statistics.
    
    Args:
        session: Database session
        
    Returns:
        Dictionary with job statistics
    """
    active_count = await get_active_jobs_count(session)
    failed_count = await get_failed_jobs_count(session)
    
    return {
        "active_jobs": active_count,
        "failed_jobs": failed_count
    } 