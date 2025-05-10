"""
Profile Dataset Job Handler.

This module provides the job handler for profiling datasets.
"""

import logging
from typing import Any, Dict, Optional, Callable
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.connection import get_session
from mlpie.db.crud.environment import get_environment_by_id
from mlpie.db.crud.dataset import get_dataset_by_id
from mlpie.profilers.service import get_profiler_service
from mlpie.profilers.config import ProfilerConfig
from mlpie.db.models.job import Job


logger = logging.getLogger(__name__)


async def handle_profile_dataset_job(
    parameters: Dict[str, Any],
    log_callback: Optional[Callable] = None
) -> Dict[str, Any]:
    """
    Handle a profile_dataset job.
    
    Args:
        parameters: Job parameters including dataset_id and profiler_name
        log_callback: Optional callback for logging
        
    Returns:
        Dictionary with job results
    """
    # Extract parameters
    dataset_id = parameters.get("dataset_id")
    if not dataset_id:
        logger.error("Missing required parameter: dataset_id")
        raise ValueError("Missing required parameter: dataset_id")
        
    profiler_name = parameters.get("profiler_name")
    environment_id = parameters.get("environment_id")
    config = parameters.get("config", {})
    
    if log_callback:
        await log_callback(f"Starting profiling of dataset {dataset_id} with profiler {profiler_name or 'default'}")
    
    # Get profiler service
    profiler_service = get_profiler_service()
    
    # Create async session
    async with get_session() as session:
        # Get dataset if needed
        dataset = None
        if not config.get("path"):
            dataset = await get_dataset_by_id(session, UUID(dataset_id))
            if not dataset:
                error_msg = f"Dataset {dataset_id} not found"
                if log_callback:
                    await log_callback(error_msg)
                raise ValueError(error_msg)
        
        # Get environment-specific profiler configuration
        environment = None
        profiler_config = None
        
        if environment_id:
            if log_callback:
                await log_callback(f"Using environment {environment_id} for profiler configuration")
            
            environment = await get_environment_by_id(session, environment_id)
            if environment:
                # Get profiler config from environment
                profiler_config = environment.get_profiler_config(profiler_name)
                
                # If no specific profiler was requested, use the environment's default
                if not profiler_name and environment.get_default_profiler():
                    profiler_name = environment.get_default_profiler()
                    if log_callback:
                        await log_callback(f"Using default profiler from environment: {profiler_name}")
        
        # Merge config from environment with provided config
        if profiler_config:
            # Environment config serves as base, user-provided config overrides it
            merged_config = profiler_config.config.copy()
            merged_config.update(config)
            config = merged_config
            
            # If no profiler_name was specified, use the type from the config
            if not profiler_name:
                profiler_name = profiler_config.type
        
        if log_callback:
            await log_callback(f"Invoking profiler service with profiler: {profiler_name}")
            
        # Profile the dataset
        result = await profiler_service.profile_dataset(
            session=session,
            dataset_id=dataset_id,
            profiler_name=profiler_name,
            config=config
        )
        
        if not result:
            error_msg = f"Failed to profile dataset {dataset_id}"
            if log_callback:
                await log_callback(error_msg)
            raise ValueError(error_msg)
            
        # Log success
        if log_callback:
            await log_callback(f"Profiling completed successfully")
            await log_callback(f"Generated profile with {result.row_count} rows and {result.column_count} columns")
            
        # Return results
        return {
            "success": True,
            "dataset_id": dataset_id,
            "profiler_name": result.profiler_name,
            "row_count": result.row_count,
            "column_count": result.column_count,
            "profiling_duration_seconds": result.profiling_duration_seconds
        }
        

async def register_profile_dataset_handler(job_manager):
    """
    Register the profile_dataset handler with the job manager.
    
    Args:
        job_manager: JobManager instance
    """
    await job_manager.register_job_handler(
        job_type="profile_dataset",
        handler_fn=handle_profile_dataset_job
    )
    logger.info("Registered profile_dataset job handler") 