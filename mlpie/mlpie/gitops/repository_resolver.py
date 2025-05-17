"""
Repository Resolution Utilities.

This module provides helper functions for resolving repositories in the hierarchical structure.
"""

import logging
from typing import Optional, Dict, Any, Tuple, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.repository import Repository
from mlpie.db.models.dataset import Dataset
from mlpie.db.models.pipeline import Pipeline
from mlpie.db.models.environment import Environment
from mlpie.db.models.project import Project
from mlpie.gitops.repository_manager import get_repository_manager

logger = logging.getLogger(__name__)


async def resolve_repository_for_dataset(
    dataset: Dataset,
    session: Optional[AsyncSession] = None
) -> Tuple[Optional[Repository], Optional[str]]:
    """
    Resolve the appropriate repository for a dataset.
    
    Uses the hierarchical resolution strategy:
    1. Dataset's own repository specification
    2. Environment's dataset-specific repository
    3. Project's dataset-specific repository
    4. Master repository
    
    Args:
        dataset: Dataset object
        session: Database session (optional)
        
    Returns:
        Tuple of (Repository object, path within repository) or (None, None) if not found
    """
    # Get repository manager
    repo_manager = get_repository_manager()
    
    # Get dataset's environment and project
    environment_id = None
    project_name = dataset.project_name
    
    # Resolve repository
    return await repo_manager.find_repository_for_resource(
        resource_type="dataset",
        resource_id=str(dataset.id),
        resource_spec=dataset.spec.get("spec", {}),
        environment_id=environment_id,
        project_name=project_name
    )


async def resolve_repository_for_pipeline(
    pipeline: Pipeline,
    session: Optional[AsyncSession] = None
) -> Tuple[Optional[Repository], Optional[str]]:
    """
    Resolve the appropriate repository for a pipeline.
    
    Uses the hierarchical resolution strategy:
    1. Pipeline's own repository specification
    2. Environment's pipeline-specific repository
    3. Project's pipeline-specific repository
    4. Master repository
    
    Args:
        pipeline: Pipeline object
        session: Database session (optional)
        
    Returns:
        Tuple of (Repository object, path within repository) or (None, None) if not found
    """
    # Get repository manager
    repo_manager = get_repository_manager()
    
    # Get pipeline's environment and project
    environment_id = None
    project_name = pipeline.project_name
    
    # Resolve repository
    return await repo_manager.find_repository_for_resource(
        resource_type="pipeline",
        resource_id=str(pipeline.id),
        resource_spec=pipeline.spec.get("spec", {}),
        environment_id=environment_id,
        project_name=project_name
    )


async def resolve_repository_for_environment(
    environment: Environment,
    session: Optional[AsyncSession] = None
) -> Tuple[Optional[Repository], Optional[str]]:
    """
    Resolve the appropriate repository for an environment.
    
    Uses the hierarchical resolution strategy:
    1. Environment's own repository specification
    2. Project's environment-specific repository
    3. Master repository
    
    Args:
        environment: Environment object
        session: Database session (optional)
        
    Returns:
        Tuple of (Repository object, path within repository) or (None, None) if not found
    """
    # Get repository manager
    repo_manager = get_repository_manager()
    
    # Get environment's project
    project_name = environment.project_name
    
    # Resolve repository
    return await repo_manager.find_repository_for_resource(
        resource_type="environment",
        resource_id=str(environment.id),
        resource_spec=environment.spec.get("spec", {}),
        project_name=project_name
    )


async def resolve_repository_for_project(
    project: Project,
    session: Optional[AsyncSession] = None
) -> Tuple[Optional[Repository], Optional[str]]:
    """
    Resolve the appropriate repository for a project.
    
    Uses the hierarchical resolution strategy:
    1. Project's own repository specification
    2. Master repository
    
    Args:
        project: Project object
        session: Database session (optional)
        
    Returns:
        Tuple of (Repository object, path within repository) or (None, None) if not found
    """
    # Get repository manager
    repo_manager = get_repository_manager()
    
    # Resolve repository
    return await repo_manager.find_repository_for_resource(
        resource_type="project",
        resource_id=project.name,
        resource_spec=project.spec.get("spec", {})
    )


async def get_resource_repository_info(
    resource_type: str,
    resource_id: Union[str, UUID],
    session: AsyncSession
) -> Dict[str, Any]:
    """
    Get repository information for a resource.
    
    This function returns complete information about the repository used for a resource,
    including details about which level in the hierarchy provided the repository.
    
    Args:
        resource_type: Type of resource ("dataset", "pipeline", "environment", "project")
        resource_id: ID of the resource
        session: Database session
        
    Returns:
        Dictionary with repository information
    """
    # Find the resource
    resource = None
    repository = None
    source = "unknown"
    
    try:
        if resource_type == "dataset":
            # Get dataset
            result = await session.execute(
                "SELECT * FROM datasets WHERE id = :id", 
                {"id": str(resource_id)}
            )
            row = result.fetchone()
            if row:
                # Convert to Dataset object
                from mlpie.db.models.dataset import Dataset
                resource = Dataset()
                for key, value in row.items():
                    setattr(resource, key, value)
                
                # Resolve repository
                repository, path = await resolve_repository_for_dataset(resource, session)
                
        elif resource_type == "pipeline":
            # Get pipeline
            result = await session.execute(
                "SELECT * FROM pipelines WHERE id = :id",
                {"id": str(resource_id)}
            )
            row = result.fetchone()
            if row:
                # Convert to Pipeline object
                from mlpie.db.models.pipeline import Pipeline
                resource = Pipeline()
                for key, value in row.items():
                    setattr(resource, key, value)
                
                # Resolve repository
                repository, path = await resolve_repository_for_pipeline(resource, session)
                
        elif resource_type == "environment":
            # Get environment
            result = await session.execute(
                "SELECT * FROM environments WHERE id = :id",
                {"id": str(resource_id)}
            )
            row = result.fetchone()
            if row:
                # Convert to Environment object
                from mlpie.db.models.environment import Environment
                resource = Environment()
                for key, value in row.items():
                    setattr(resource, key, value)
                
                # Resolve repository
                repository, path = await resolve_repository_for_environment(resource, session)
                
        elif resource_type == "project":
            # Get project
            result = await session.execute(
                "SELECT * FROM projects WHERE name = :name",
                {"name": str(resource_id)}
            )
            row = result.fetchone()
            if row:
                # Convert to Project object
                from mlpie.db.models.project import Project
                resource = Project()
                for key, value in row.items():
                    setattr(resource, key, value)
                
                # Resolve repository
                repository, path = await resolve_repository_for_project(resource, session)
    except Exception as e:
        logger.exception(f"Error resolving repository for {resource_type} {resource_id}", exc_info=e)
        return {
            "success": False,
            "error": str(e)
        }
    
    if not resource:
        return {
            "success": False,
            "error": f"{resource_type} with ID {resource_id} not found"
        }
    
    if not repository:
        return {
            "success": False,
            "error": f"No repository found for {resource_type} {resource_id}"
        }
    
    # Determine the source of the repository
    if repository.entity_type == "master":
        source = "master"
    elif repository.entity_type == "project":
        source = "project"
    elif repository.entity_type == "environment":
        source = "environment"
    elif repository.entity_type == "temp":
        source = "resource"
    
    # Return repository information
    return {
        "success": True,
        "resource_type": resource_type,
        "resource_id": str(resource_id),
        "repository": {
            "id": str(repository.id) if hasattr(repository, 'id') and repository.id else None,
            "url": repository.url,
            "ref": repository.ref,
            "path_in_repo": repository.path_in_repo,
            "source": source,
            "entity_type": repository.entity_type,
            "entity_id": repository.entity_id
        }
    } 