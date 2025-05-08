 """
Job Management Service for MLPie.

This module provides a central service for managing job operations.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from uuid import UUID

from mlpie.db.base import AsyncSessionLocal
from mlpie.db.crud.job import (
    create_job,
    get_job,
    get_jobs,
    update_job_status,
    append_job_logs,
)
from mlpie.db.models.job import Job, JobStatus, JobType
from mlpie.jobs.executors.base import JobExecutor
from mlpie.jobs.executors.local import LocalJobExecutor


logger = logging.getLogger(__name__)


class JobManager:
    """Central service for managing job operations."""
    
    def __init__(self):
        """Initialize the job manager."""
        self.executors: Dict[str, JobExecutor] = {}
        self.default_executor: Optional[str] = None
        self._initialized = False
    
    async def initialize(self) -> bool:
        """
        Initialize the job manager.
        
        Returns:
            True if initialization was successful
        """
        if self._initialized:
            return True
            
        logger.info("Initializing job manager")
        
        # Create and register local executor by default
        local_executor = LocalJobExecutor()
        await local_executor.initialize({})
        await self.register_executor("local", local_executor)
        self.set_default_executor("local")
        
        # Register job handlers
        await self.register_job_handlers()
        
        self._initialized = True
        return True
    
    async def register_executor(self, name: str, executor: JobExecutor) -> None:
        """
        Register a job executor.
        
        Args:
            name: Name of the executor
            executor: Executor instance
        """
        logger.info(f"Registering job executor: {name}")
        self.executors[name] = executor
        
        # Set as default if no default is set
        if self.default_executor is None:
            self.default_executor = name
    
    def set_default_executor(self, name: str) -> None:
        """
        Set the default executor.
        
        Args:
            name: Name of the executor to use as default
            
        Raises:
            ValueError: If the executor is not registered
        """
        if name not in self.executors:
            raise ValueError(f"Executor '{name}' is not registered")
            
        logger.info(f"Setting default executor to: {name}")
        self.default_executor = name
    
    async def register_job_handlers(self) -> None:
        """
        Register all available job handlers.
        
        This method discovers and registers all available job handlers
        from the handlers package.
        """
        logger.info("Registering job handlers")
        
        try:
            # Import here to avoid circular imports
            from mlpie.jobs.handlers.profile_dataset import register_profile_dataset_handler
            
            # Register profile dataset handler
            await register_profile_dataset_handler(self)
            
            logger.info("Successfully registered all job handlers")
        except Exception as e:
            logger.error(f"Error registering job handlers: {str(e)}")
    
    async def register_job_handler(
        self,
        job_type: str,
        handler_fn: Callable,
        executor_name: Optional[str] = None
    ) -> None:
        """
        Register a handler function for a job type.
        
        Args:
            job_type: Type of job
            handler_fn: Async function that handles the job
            executor_name: Name of the executor to use (defaults to default executor)
            
        Raises:
            ValueError: If the executor is not registered
        """
        executor_name = executor_name or self.default_executor
        
        if executor_name not in self.executors:
            raise ValueError(f"Executor '{executor_name}' is not registered")
            
        executor = self.executors[executor_name]
        
        if isinstance(executor, LocalJobExecutor):
            await executor.register_handler(job_type, handler_fn)
        else:
            raise ValueError(f"Executor '{executor_name}' does not support handler registration")
    
    async def create_job(
        self,
        job_type: str,
        parameters: Dict[str, Any],
        executor_name: Optional[str] = None,
        name: Optional[str] = None,
        dataset_id: Optional[Union[str, UUID]] = None,
        environment_id: Optional[Union[str, UUID]] = None,
        created_by: Optional[str] = None,
        is_recurring: bool = False,
        schedule: Optional[str] = None
    ) -> Job:
        """
        Create a new job and queue it for execution.
        
        Args:
            job_type: Type of job to create
            parameters: Job parameters
            executor_name: Name of the executor to use (defaults to default executor)
            name: Name of the job (defaults to job_type-uuid)
            dataset_id: Associated dataset ID
            environment_id: Associated environment ID
            created_by: Who created the job
            is_recurring: Whether the job is recurring
            schedule: Schedule for recurring jobs
            
        Returns:
            Created job object
            
        Raises:
            ValueError: If the job type is not supported by the executor
        """
        if not self._initialized:
            await self.initialize()
            
        # Use default executor if none specified
        executor_name = executor_name or self.default_executor
        
        if executor_name not in self.executors:
            raise ValueError(f"Executor '{executor_name}' is not registered")
            
        executor = self.executors[executor_name]
        
        # Check if job type is supported
        if job_type not in executor.supported_job_types and not isinstance(executor, LocalJobExecutor):
            raise ValueError(f"Job type '{job_type}' is not supported by executor '{executor_name}'")
            
        # Generate job name if not provided
        if not name:
            name = f"{job_type}-job"
            
        # Create job in database
        async with AsyncSessionLocal() as session:
            job_data = {
                "name": name,
                "job_type": job_type,
                "status": JobStatus.PENDING.value,
                "progress": 0.0,
                "executor": executor_name,
                "parameters": parameters,
                "created_by": created_by or "system",
                "is_recurring": is_recurring,
                "schedule": schedule
            }
            
            if dataset_id:
                job_data["dataset_id"] = dataset_id
                
            if environment_id:
                job_data["environment_id"] = environment_id
                
            job = await create_job(session, job_data)
            
        # Queue the job for execution
        await self.queue_job(job.id)
        
        return job
    
    async def queue_job(self, job_id: Union[str, UUID]) -> None:
        """
        Queue a job for execution.
        
        Args:
            job_id: Job ID
        """
        if isinstance(job_id, str):
            job_id = UUID(job_id)
            
        # Get job from database
        async with AsyncSessionLocal() as session:
            job = await get_job(session, job_id)
            
            if not job:
                logger.error(f"Job not found: {job_id}")
                return
                
            if job.status != JobStatus.PENDING.value:
                logger.warning(f"Job {job_id} is not in PENDING status: {job.status}")
                return
                
            # Get the executor
            executor_name = job.executor
            executor = self.executors.get(executor_name)
            
            if not executor:
                logger.error(f"Executor '{executor_name}' not found for job {job_id}")
                await update_job_status(
                    session,
                    job_id,
                    JobStatus.FAILED.value,
                    error=f"Executor '{executor_name}' not found"
                )
                return
                
            # Create log callback
            async def log_callback(message: str) -> None:
                await append_job_logs(session, job_id, message)
                
            # Start the job
            if isinstance(executor, LocalJobExecutor):
                # For local executor, we use the built-in background task mechanism
                await executor.start_job(
                    job_id,
                    job.job_type,
                    job.parameters,
                    log_callback
                )
                
                # Update job status to running
                await update_job_status(
                    session,
                    job_id,
                    JobStatus.RUNNING.value,
                    progress=0.0
                )
            else:
                # For remote executors, we execute directly and update status accordingly
                try:
                    # Update job status to running
                    await update_job_status(
                        session,
                        job_id,
                        JobStatus.RUNNING.value,
                        progress=0.0
                    )
                    
                    # Execute job
                    result = await executor.execute_job(
                        job_id,
                        job.job_type,
                        job.parameters,
                        log_callback
                    )
                    
                    # Update job status to completed
                    await update_job_status(
                        session,
                        job_id,
                        JobStatus.COMPLETED.value,
                        progress=100.0,
                        result=result
                    )
                    
                except Exception as e:
                    logger.error(f"Error executing job {job_id}: {str(e)}")
                    await update_job_status(
                        session,
                        job_id,
                        JobStatus.FAILED.value,
                        error=str(e)
                    )
    
    async def cancel_job(self, job_id: Union[str, UUID]) -> bool:
        """
        Cancel a running job.
        
        Args:
            job_id: Job ID
            
        Returns:
            True if the job was cancelled, False otherwise
        """
        if isinstance(job_id, str):
            job_id = UUID(job_id)
            
        # Get job from database
        async with AsyncSessionLocal() as session:
            job = await get_job(session, job_id)
            
            if not job:
                logger.error(f"Job not found: {job_id}")
                return False
                
            if job.status != JobStatus.RUNNING.value:
                logger.warning(f"Job {job_id} is not in RUNNING status: {job.status}")
                return False
                
            # Get the executor
            executor_name = job.executor
            executor = self.executors.get(executor_name)
            
            if not executor:
                logger.error(f"Executor '{executor_name}' not found for job {job_id}")
                return False
                
            # Cancel the job
            if await executor.cancel_job(job_id):
                # Update job status
                await update_job_status(
                    session,
                    job_id,
                    JobStatus.CANCELLED.value
                )
                return True
                
            return False
    
    async def get_job_status(self, job_id: Union[str, UUID]) -> Optional[str]:
        """
        Get the status of a job.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status string or None if job not found
        """
        if isinstance(job_id, str):
            job_id = UUID(job_id)
            
        # Get job from database
        async with AsyncSessionLocal() as session:
            job = await get_job(session, job_id)
            
            if not job:
                logger.error(f"Job not found: {job_id}")
                return None
                
            return job.status
    
    async def get_jobs(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
        dataset_id: Optional[Union[str, UUID]] = None,
        environment_id: Optional[Union[str, UUID]] = None,
        created_by: Optional[str] = None
    ) -> List[Job]:
        """
        Get a list of jobs with optional filtering.
        
        Args:
            skip: Number of jobs to skip
            limit: Maximum number of jobs to return
            status: Filter by job status
            job_type: Filter by job type
            dataset_id: Filter by dataset ID
            environment_id: Filter by environment ID
            created_by: Filter by creator
            
        Returns:
            List of job objects
        """
        async with AsyncSessionLocal() as session:
            return await get_jobs(
                session,
                skip=skip,
                limit=limit,
                status=status,
                job_type=job_type,
                dataset_id=dataset_id,
                environment_id=environment_id,
                created_by=created_by
            )


# Singleton instance
_job_manager: Optional[JobManager] = None


def get_job_manager() -> JobManager:
    """
    Get the job manager instance.
    
    Returns:
        The job manager singleton
    """
    global _job_manager
    
    if _job_manager is None:
        _job_manager = JobManager()
        
    return _job_manager