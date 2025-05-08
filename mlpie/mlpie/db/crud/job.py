"""
CRUD operations for job entities.

This module provides functions for creating, reading, updating, and deleting job entities in the database.
"""

from datetime import datetime, UTC
from typing import Dict, List, Optional, Any, Union
from uuid import UUID

from sqlalchemy import select, update, delete, desc, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from mlpie.db.models.job import Job, JobStatus, JobType


async def create_job(
    session: AsyncSession,
    job_data: Dict[str, Any]
) -> Job:
    """
    Create a new job in the database.
    
    Args:
        session: Database session
        job_data: Job data dictionary
        
    Returns:
        Created job object
    """
    job = Job(**job_data)
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job


async def get_job(
    session: AsyncSession,
    job_id: Union[str, UUID]
) -> Optional[Job]:
    """
    Get a job by ID.
    
    Args:
        session: Database session
        job_id: Job ID
        
    Returns:
        Job object if found, None otherwise
    """
    if isinstance(job_id, str):
        job_id = UUID(job_id)
        
    job = await session.get(Job, job_id)
    return job


async def get_jobs(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    dataset_id: Optional[Union[str, UUID]] = None,
    environment_id: Optional[Union[str, UUID]] = None,
    created_by: Optional[str] = None,
    order_by_created: bool = True
) -> List[Job]:
    """
    Get a list of jobs with optional filtering.
    
    Args:
        session: Database session
        skip: Number of jobs to skip
        limit: Maximum number of jobs to return
        status: Filter by job status
        job_type: Filter by job type
        dataset_id: Filter by dataset ID
        environment_id: Filter by environment ID
        created_by: Filter by creator
        order_by_created: Order by created_at timestamp (descending)
        
    Returns:
        List of job objects
    """
    query = select(Job)
    
    # Apply filters
    filters = []
    
    if status:
        filters.append(Job.status == status)
        
    if job_type:
        filters.append(Job.job_type == job_type)
        
    if dataset_id:
        if isinstance(dataset_id, str):
            dataset_id = UUID(dataset_id)
        filters.append(Job.dataset_id == dataset_id)
        
    if environment_id:
        if isinstance(environment_id, str):
            environment_id = UUID(environment_id)
        filters.append(Job.environment_id == environment_id)
        
    if created_by:
        filters.append(Job.created_by == created_by)
        
    if filters:
        query = query.where(and_(*filters))
        
    # Apply ordering
    if order_by_created:
        query = query.order_by(desc(Job.created_at))
        
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await session.execute(query)
    jobs = result.scalars().all()
    
    return list(jobs)


async def update_job(
    session: AsyncSession,
    job_id: Union[str, UUID],
    updates: Dict[str, Any]
) -> Optional[Job]:
    """
    Update a job.
    
    Args:
        session: Database session
        job_id: Job ID
        updates: Dictionary of fields to update
        
    Returns:
        Updated job object if found, None otherwise
    """
    if isinstance(job_id, str):
        job_id = UUID(job_id)
        
    # Get the job first
    job = await get_job(session, job_id)
    if not job:
        return None
        
    # Update fields
    for key, value in updates.items():
        setattr(job, key, value)
        
    # If status is changing to a completed state, update timestamp
    if 'status' in updates:
        if updates['status'] in [JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value]:
            job.completed_at = datetime.now(UTC)
        elif updates['status'] == JobStatus.RUNNING.value and not job.started_at:
            job.started_at = datetime.now(UTC)
            
    # Save changes
    await session.commit()
    await session.refresh(job)
    
    return job


async def update_job_status(
    session: AsyncSession,
    job_id: Union[str, UUID],
    status: str,
    progress: Optional[float] = None,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None
) -> Optional[Job]:
    """
    Update a job's status.
    
    Args:
        session: Database session
        job_id: Job ID
        status: New job status
        progress: Job progress (0-100)
        error: Error message (for failed jobs)
        result: Job result data
        
    Returns:
        Updated job object if found, None otherwise
    """
    updates = {"status": status}
    
    if progress is not None:
        updates["progress"] = progress
        
    if error is not None:
        updates["error"] = error
        
    if result is not None:
        updates["result"] = result
        
    return await update_job(session, job_id, updates)


async def append_job_logs(
    session: AsyncSession,
    job_id: Union[str, UUID],
    log_entry: str
) -> Optional[Job]:
    """
    Append logs to a job.
    
    Args:
        session: Database session
        job_id: Job ID
        log_entry: Log entry to append
        
    Returns:
        Updated job object if found, None otherwise
    """
    if isinstance(job_id, str):
        job_id = UUID(job_id)
        
    # Get the job first
    job = await get_job(session, job_id)
    if not job:
        return None
        
    # Append to logs
    timestamp = datetime.now(UTC).isoformat()
    log_line = f"[{timestamp}] {log_entry}"
    
    if job.logs:
        job.logs = job.logs + "\n" + log_line
    else:
        job.logs = log_line
        
    # Save changes
    await session.commit()
    await session.refresh(job)
    
    return job


async def delete_job(
    session: AsyncSession,
    job_id: Union[str, UUID]
) -> bool:
    """
    Delete a job.
    
    Args:
        session: Database session
        job_id: Job ID
        
    Returns:
        True if the job was deleted, False otherwise
    """
    if isinstance(job_id, str):
        job_id = UUID(job_id)
        
    job = await get_job(session, job_id)
    if not job:
        return False
        
    await session.delete(job)
    await session.commit()
    
    return True


async def get_active_jobs_count(session: AsyncSession) -> int:
    """
    Get the count of active jobs (pending or running).
    
    Args:
        session: Database session
        
    Returns:
        Count of active jobs
    """
    query = select(Job).where(or_(
        Job.status == JobStatus.PENDING.value,
        Job.status == JobStatus.RUNNING.value
    ))
    
    result = await session.execute(query)
    jobs = result.scalars().all()
    
    return len(list(jobs))


async def get_failed_jobs_count(session: AsyncSession) -> int:
    """
    Get the count of failed jobs.
    
    Args:
        session: Database session
        
    Returns:
        Count of failed jobs
    """
    query = select(Job).where(Job.status == JobStatus.FAILED.value)
    
    result = await session.execute(query)
    jobs = result.scalars().all()
    
    return len(list(jobs)) 