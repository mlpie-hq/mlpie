"""
Local Job Executor for MLPie.

This module provides a job executor that runs jobs locally in the same process or in subprocesses.
"""

import asyncio
import logging
import traceback
from typing import Any, Dict, List, Optional, Union, Callable
from uuid import UUID

from mlpie.db.models.job import JobStatus
from mlpie.jobs.executors.base import JobExecutor


logger = logging.getLogger(__name__)


class LocalJobExecutor(JobExecutor):
    """Execute jobs locally in the same process or in subprocesses."""
    
    def __init__(self):
        """Initialize the local job executor."""
        self._handlers: Dict[str, Callable] = {}
        self._running_jobs: Dict[str, asyncio.Task] = {}
        self._job_statuses: Dict[str, str] = {}
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """
        Initialize the executor with configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if initialization was successful
        """
        logger.info("Initializing local job executor")
        return True
    
    async def register_handler(self, job_type: str, handler_fn: Callable) -> None:
        """
        Register a handler function for a job type.
        
        Args:
            job_type: Type of job
            handler_fn: Async function that handles the job
        """
        logger.info(f"Registering handler for job type: {job_type}")
        self._handlers[job_type] = handler_fn
    
    @property
    def supported_job_types(self) -> List[str]:
        """
        Get the job types supported by this executor.
        
        Returns:
            List of supported job type strings
        """
        return list(self._handlers.keys())
    
    async def execute_job(
        self, 
        job_id: UUID,
        job_type: str, 
        parameters: Dict[str, Any],
        log_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Execute a job and return its result.
        
        Args:
            job_id: ID of the job being executed
            job_type: Type of job to execute
            parameters: Job parameters
            log_callback: Optional callback for logging
            
        Returns:
            Dictionary with job results
            
        Raises:
            ValueError: If no handler is registered for the job type
        """
        job_id_str = str(job_id)
        handler = self._handlers.get(job_type)
        
        if not handler:
            error_msg = f"No handler registered for job type: {job_type}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Update job status
        self._job_statuses[job_id_str] = JobStatus.RUNNING.value
        
        # Log start
        if log_callback:
            await log_callback(f"Starting job execution with type: {job_type}")
        
        try:
            # Execute handler
            result = await handler(parameters, log_callback=log_callback)
            
            # Update job status
            self._job_statuses[job_id_str] = JobStatus.COMPLETED.value
            
            # Log completion
            if log_callback:
                await log_callback(f"Job execution completed successfully")
            
            return result
            
        except asyncio.CancelledError:
            # Job was cancelled
            self._job_statuses[job_id_str] = JobStatus.CANCELLED.value
            
            if log_callback:
                await log_callback(f"Job execution was cancelled")
            
            raise
            
        except Exception as e:
            # Job failed
            error_msg = f"Job execution failed: {str(e)}"
            stack_trace = traceback.format_exc()
            
            self._job_statuses[job_id_str] = JobStatus.FAILED.value
            
            if log_callback:
                await log_callback(error_msg)
                await log_callback(f"Stack trace: {stack_trace}")
            
            logger.error(f"Error executing job {job_id}: {error_msg}")
            logger.debug(f"Stack trace: {stack_trace}")
            
            raise
    
    async def _run_job_task(
        self,
        job_id: UUID,
        job_type: str,
        parameters: Dict[str, Any],
        log_callback: Optional[callable] = None
    ) -> None:
        """
        Run a job in a separate task.
        
        Args:
            job_id: ID of the job
            job_type: Type of job
            parameters: Job parameters
            log_callback: Function for logging
        """
        job_id_str = str(job_id)
        
        try:
            await self.execute_job(job_id, job_type, parameters, log_callback)
        except Exception:
            # Errors are already logged in execute_job
            pass
        finally:
            # Remove from running jobs
            if job_id_str in self._running_jobs:
                del self._running_jobs[job_id_str]
    
    async def start_job(
        self,
        job_id: UUID,
        job_type: str,
        parameters: Dict[str, Any],
        log_callback: Optional[callable] = None
    ) -> None:
        """
        Start a job in a background task.
        
        Args:
            job_id: ID of the job
            job_type: Type of job
            parameters: Job parameters
            log_callback: Function for logging
        """
        job_id_str = str(job_id)
        
        # Create a task
        task = asyncio.create_task(
            self._run_job_task(job_id, job_type, parameters, log_callback)
        )
        
        # Store the task
        self._running_jobs[job_id_str] = task
    
    async def cancel_job(self, job_id: UUID) -> bool:
        """
        Cancel a running job.
        
        Args:
            job_id: ID of the job to cancel
            
        Returns:
            True if the job was cancelled, False otherwise
        """
        job_id_str = str(job_id)
        
        if job_id_str in self._running_jobs:
            task = self._running_jobs[job_id_str]
            task.cancel()
            
            try:
                await task
            except asyncio.CancelledError:
                pass
                
            # Update status
            self._job_statuses[job_id_str] = JobStatus.CANCELLED.value
            
            # Remove from running jobs
            del self._running_jobs[job_id_str]
            
            return True
            
        return False
    
    async def get_job_status(self, job_id: UUID) -> str:
        """
        Get the status of a job.
        
        Args:
            job_id: ID of the job
            
        Returns:
            Job status string
        """
        job_id_str = str(job_id)
        
        # Check if the job is running
        if job_id_str in self._running_jobs:
            task = self._running_jobs[job_id_str]
            
            if task.done():
                if task.cancelled():
                    return JobStatus.CANCELLED.value
                else:
                    try:
                        task.result()
                        return JobStatus.COMPLETED.value
                    except Exception:
                        return JobStatus.FAILED.value
            else:
                return JobStatus.RUNNING.value
                
        # Return cached status if available
        return self._job_statuses.get(job_id_str, JobStatus.PENDING.value) 