"""
Base Job Executor for MLPie.

This module defines the core interfaces and base classes for MLPie's job execution system.
All job executors in the system inherit from these base classes to ensure consistent behavior.
"""

import abc
import logging
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from mlpie.db.models.job import JobStatus


logger = logging.getLogger(__name__)


class JobExecutor(abc.ABC):
    """Base interface for job executors."""
    
    @abc.abstractmethod
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """
        Initialize the executor with configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if initialization was successful, False otherwise
        """
        pass
    
    @abc.abstractmethod
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
        """
        pass
    
    @abc.abstractmethod
    async def cancel_job(self, job_id: UUID) -> bool:
        """
        Cancel a running job.
        
        Args:
            job_id: ID of the job to cancel
            
        Returns:
            True if the job was cancelled, False otherwise
        """
        pass
    
    @abc.abstractmethod
    async def get_job_status(self, job_id: UUID) -> str:
        """
        Get the status of a job.
        
        Args:
            job_id: ID of the job
            
        Returns:
            Job status string
        """
        pass
    
    @property
    @abc.abstractmethod
    def supported_job_types(self) -> List[str]:
        """
        Get the job types supported by this executor.
        
        Returns:
            List of supported job type strings
        """
        pass 