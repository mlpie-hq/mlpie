"""
CRUD operations for Pipeline models.

This module provides database operations for pipelines.
"""

import logging
import uuid
from typing import List, Optional, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.pipeline import Pipeline

logger = logging.getLogger(__name__)


async def get_pipeline_by_name(session: AsyncSession, name: str) -> Optional[Pipeline]:
    """
    Get a pipeline by name.
    
    Args:
        session: Database session
        name: Pipeline name
        
    Returns:
        Pipeline instance or None if not found
    """
    result = await session.execute(select(Pipeline).where(Pipeline.name == name))
    return result.scalars().first()


async def get_pipeline_by_id(session: AsyncSession, pipeline_id: uuid.UUID) -> Optional[Pipeline]:
    """
    Get a pipeline by ID.
    
    Args:
        session: Database session
        pipeline_id: Pipeline ID
        
    Returns:
        Pipeline instance or None if not found
    """
    result = await session.execute(select(Pipeline).where(Pipeline.id == pipeline_id))
    return result.scalars().first()


async def get_pipelines_by_project(session: AsyncSession, project_id: uuid.UUID) -> List[Pipeline]:
    """
    Get all pipelines associated with a project.
    
    Args:
        session: Database session
        project_id: Project ID
        
    Returns:
        List of Pipeline instances
    """
    result = await session.execute(
        select(Pipeline).where(Pipeline.project_id == project_id)
    )
    return result.scalars().all()


async def get_all_pipelines(session: AsyncSession) -> List[Pipeline]:
    """
    Get all pipelines.
    
    Args:
        session: Database session
        
    Returns:
        List of Pipeline instances
    """
    result = await session.execute(select(Pipeline))
    return result.scalars().all()


async def get_active_pipelines(session: AsyncSession) -> List[Pipeline]:
    """
    Get all active pipelines.
    
    Args:
        session: Database session
        
    Returns:
        List of active Pipeline instances
    """
    result = await session.execute(
        select(Pipeline).where(Pipeline.active == True)
    )
    return result.scalars().all()


async def create_pipeline(session: AsyncSession, pipeline: Pipeline) -> Pipeline:
    """
    Create a new pipeline.
    
    Args:
        session: Database session
        pipeline: Pipeline instance
        
    Returns:
        Created Pipeline instance
    """
    session.add(pipeline)
    await session.commit()
    await session.refresh(pipeline)
    return pipeline


async def update_pipeline(session: AsyncSession, pipeline: Pipeline) -> Pipeline:
    """
    Update an existing pipeline.
    
    Args:
        session: Database session
        pipeline: Pipeline instance with updated values
        
    Returns:
        Updated Pipeline instance
    """
    await session.commit()
    await session.refresh(pipeline)
    return pipeline


async def delete_pipeline(session: AsyncSession, pipeline_id: uuid.UUID) -> bool:
    """
    Delete a pipeline.
    
    Args:
        session: Database session
        pipeline_id: ID of the pipeline to delete
        
    Returns:
        True if pipeline was deleted, False if not found
    """
    result = await session.execute(delete(Pipeline).where(Pipeline.id == pipeline_id))
    await session.commit()
    return result.rowcount > 0


async def reconcile_pipelines(
    session: AsyncSession, 
    scanned_pipelines: List[Pipeline]
) -> Dict[str, int]:
    """
    Reconcile scanned pipelines with database state.
    
    Args:
        session: Database session
        scanned_pipelines: List of pipelines from scanning
        
    Returns:
        Dictionary with counts of created/updated/unchanged pipelines
    """
    counters = {
        "created": 0,
        "updated": 0,
        "unchanged": 0
    }
    
    # Track processed pipelines by name for potential cleanup
    processed_names = set()
    
    # Resolve project references
    await _resolve_project_references(session, scanned_pipelines)
    
    # Process each scanned pipeline
    for pipeline in scanned_pipelines:
        name = pipeline.name
        processed_names.add(name)
        
        # Check if pipeline exists
        existing_pipeline = await get_pipeline_by_name(session, name)
        
        if existing_pipeline:
            # Update existing pipeline
            # We need to preserve ID and created_at
            created_at = existing_pipeline.created_at
            
            # Update fields from new pipeline
            existing_pipeline.spec = pipeline.spec
            existing_pipeline.description = pipeline.description
            existing_pipeline.version = pipeline.version
            existing_pipeline.engine = pipeline.engine
            existing_pipeline.code = pipeline.code
            existing_pipeline.labels = pipeline.labels
            existing_pipeline.active = pipeline.active
            existing_pipeline.project_id = pipeline.project_id
            
            # Update in database
            await update_pipeline(session, existing_pipeline)
            counters["updated"] += 1
        else:
            # Create new pipeline
            await create_pipeline(session, pipeline)
            counters["created"] += 1
    
    # Optional: Mark pipelines not found in scan for cleanup
    # This would depend on your reconciliation strategy
    
    return counters


async def _resolve_project_references(session: AsyncSession, pipelines: List[Pipeline]):
    """
    Resolve project references in pipelines.
    
    This function looks at the projectRef in each pipeline's spec and 
    resolves it to a project_id by looking up the project by name.
    
    Args:
        session: Database session
        pipelines: List of pipelines to process
    """
    from mlpie.db.crud.project import get_project_by_name
    
    for pipeline in pipelines:
        try:
            # Get project reference from spec
            spec_dict = pipeline.spec if isinstance(pipeline.spec, dict) else {}
            project_ref = spec_dict.get("spec", {}).get("projectRef")
            
            if project_ref and isinstance(project_ref, dict) and project_ref.get("name"):
                project_name = project_ref["name"]
                
                # Look up project by name
                project = await get_project_by_name(session, project_name)
                if project:
                    pipeline.project_id = project.id
                    logger.info(f"Resolved project reference for pipeline {pipeline.name} to project {project_name} (ID: {project.id})")
                else:
                    logger.warning(f"Could not resolve project reference '{project_name}' for pipeline {pipeline.name}")
        except Exception as e:
            logger.exception(f"Error resolving project reference for pipeline {pipeline.name}", exc_info=e) 