"""
CRUD operations for Pipeline models.

This module provides database operations for pipelines.
"""

import logging
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


async def get_pipelines(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    project_name: Optional[str] = None
) -> List[Pipeline]:
    """
    Get a list of pipelines.
    
    Args:
        session: Database session
        skip: Number of pipelines to skip
        limit: Maximum number of pipelines to return
        project_name: Filter by project name
        
    Returns:
        List of pipeline objects
    """
    query = select(Pipeline)
    
    if project_name:
        query = query.where(Pipeline.project_name == project_name)
        
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def create_pipeline(session: AsyncSession, pipeline_data: Dict[str, Any]) -> Pipeline:
    """
    Create a new pipeline.
    
    Args:
        session: Database session
        pipeline_data: Pipeline data dictionary
        
    Returns:
        Created pipeline object
    """
    # Create and save the pipeline
    pipeline = Pipeline(**pipeline_data)
    session.add(pipeline)
    await session.commit()
    await session.refresh(pipeline)
    return pipeline


async def update_pipeline(session: AsyncSession, pipeline: Pipeline) -> Pipeline:
    """
    Update a pipeline.
    
    Args:
        session: Database session
        pipeline: Pipeline object to update
        
    Returns:
        Updated pipeline object
    """
    await session.commit()
    await session.refresh(pipeline)
    return pipeline


async def delete_pipeline(session: AsyncSession, name: str) -> bool:
    """
    Delete a pipeline.
    
    Args:
        session: Database session
        name: Pipeline name
        
    Returns:
        True if pipeline was deleted, False if not found
    """
    result = await session.execute(delete(Pipeline).where(Pipeline.name == name))
    await session.commit()
    return result.rowcount > 0


async def get_pipeline_by_context(session: AsyncSession, name: str, environment_name: str, project_name: Optional[str] = None) -> Optional[Pipeline]:
    """
    Get a pipeline by its full context (name, environment, and optionally project).
    
    Args:
        session: Database session
        name: Pipeline name
        environment_name: Environment name
        project_name: Project name (optional)
        
    Returns:
        Pipeline instance or None if not found
    """
    query = select(Pipeline).where(
        (Pipeline.name == name) & 
        (Pipeline.environment_name == environment_name)
    )
    
    if project_name:
        query = query.where(Pipeline.project_name == project_name)
        
    result = await session.execute(query)
    return result.scalars().first()


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
        "unchanged": 0,
        "skipped": 0
    }
    
    # Import here to avoid circular imports
    from mlpie.db.crud.environment import get_environment_by_context
    from mlpie.db.crud.project import get_project_by_name
    
    # Track processed pipelines by unique key for potential cleanup
    processed_keys = set()
    
    # Process each scanned pipeline
    for pipeline in scanned_pipelines:
        name = pipeline.name
        environment_name = pipeline.environment_name
        project_name = pipeline.project_name
        
        # Create a unique identifier for this pipeline based on its context
        context_key = f"{name}:{environment_name}:{project_name or 'none'}"
        processed_keys.add(context_key)
        
        # Validate required environment reference
        if not environment_name:
            logger.error(f"Pipeline {name} is missing required environmentRef.name field - skipping")
            counters["skipped"] += 1
            continue
        
        # Verify that the referenced project exists (if specified)
        if project_name:
            project = await get_project_by_name(session, project_name)
            if not project:
                logger.error(f"Pipeline {name} references non-existent project '{project_name}' - skipping")
                counters["skipped"] += 1
                continue
            
        # Verify that the referenced environment exists in the proper context
        environment = await get_environment_by_context(session, environment_name, project_name)
        if not environment:
            project_context = f" in project '{project_name}'" if project_name else ""
            logger.error(f"Pipeline {name} references non-existent environment '{environment_name}'{project_context} - skipping")
            counters["skipped"] += 1
            continue
        
        # Check if pipeline exists in the same context (environment and project)
        existing_pipeline = await get_pipeline_by_context(session, name, environment_name, project_name)
        
        if existing_pipeline:
            # Update existing pipeline
            # We need to preserve created_at
            created_at = existing_pipeline.created_at
            
            # Update fields from new pipeline
            existing_pipeline.spec = pipeline.spec
            existing_pipeline.description = pipeline.description
            existing_pipeline.version = pipeline.version
            existing_pipeline.engine = pipeline.engine
            existing_pipeline.code = pipeline.code
            existing_pipeline.labels = pipeline.labels
            existing_pipeline.active = pipeline.active
            existing_pipeline.project_name = pipeline.project_name
            existing_pipeline.environment_name = pipeline.environment_name
            
            # Update in database
            await update_pipeline(session, existing_pipeline)
            counters["updated"] += 1
        else:
            # Create new pipeline
            await create_pipeline(session, {
                "name": pipeline.name,
                "spec": pipeline.spec,
                "description": pipeline.description,
                "version": pipeline.version,
                "engine": pipeline.engine,
                "code": pipeline.code,
                "labels": pipeline.labels,
                "active": pipeline.active,
                "project_name": pipeline.project_name,
                "environment_name": pipeline.environment_name
            })
            counters["created"] += 1
    
    # Optional: Mark pipelines not found in scan for cleanup
    # This would depend on your reconciliation strategy
    
    return counters


async def _resolve_project_references(session: AsyncSession, pipelines: List[Pipeline]):
    """
    Resolve project references in pipelines.
    
    This function looks at the projectRef in each pipeline's spec and 
    resolves it to a project name by looking up the project by name.
    
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
                    pipeline.project_name = project.name
                    logger.info(f"Resolved project reference for pipeline {pipeline.name} to project {project_name}")
                else:
                    logger.warning(f"Could not resolve project reference '{project_name}' for pipeline {pipeline.name}")
        except Exception as e:
            logger.exception(f"Error resolving project reference for pipeline {pipeline.name}", exc_info=e) 