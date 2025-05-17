"""
CRUD operations for Dataset models.

This module provides database operations for datasets.
"""

import logging
import uuid
from typing import List, Optional, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.dataset import Dataset

logger = logging.getLogger(__name__)


async def get_dataset_by_name(session: AsyncSession, name: str) -> Optional[Dataset]:
    """
    Get a dataset by name.
    
    Args:
        session: Database session
        name: Dataset name
        
    Returns:
        Dataset instance or None if not found
    """
    result = await session.execute(select(Dataset).where(Dataset.name == name))
    return result.scalars().first()


async def get_dataset_by_id(session: AsyncSession, dataset_id: uuid.UUID) -> Optional[Dataset]:
    """
    Get a dataset by ID.
    
    Args:
        session: Database session
        dataset_id: Dataset ID
        
    Returns:
        Dataset instance or None if not found
    """
    result = await session.execute(select(Dataset).where(Dataset.id == dataset_id))
    return result.scalars().first()


async def get_datasets_by_project(session: AsyncSession, project_id: uuid.UUID) -> List[Dataset]:
    """
    Get all datasets associated with a project.
    
    Args:
        session: Database session
        project_id: Project ID
        
    Returns:
        List of Dataset instances
    """
    result = await session.execute(
        select(Dataset).where(Dataset.project_id == project_id)
    )
    return result.scalars().all()


async def get_all_datasets(session: AsyncSession) -> List[Dataset]:
    """
    Get all datasets.
    
    Args:
        session: Database session
        
    Returns:
        List of Dataset instances
    """
    result = await session.execute(select(Dataset))
    return result.scalars().all()


async def get_available_datasets(session: AsyncSession) -> List[Dataset]:
    """
    Get all available datasets.
    
    Args:
        session: Database session
        
    Returns:
        List of available Dataset instances
    """
    result = await session.execute(
        select(Dataset).where(Dataset.active == True)
    )
    return result.scalars().all()


async def get_datasets(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    project_name: Optional[str] = None
) -> List[Dataset]:
    """
    Get a list of datasets.
    
    Args:
        session: Database session
        skip: Number of datasets to skip
        limit: Maximum number of datasets to return
        project_name: Filter by project name
        
    Returns:
        List of dataset objects
    """
    query = select(Dataset)
    
    if project_name:
        query = query.where(Dataset.project_name == project_name)
        
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def create_dataset(session: AsyncSession, dataset_data: Dict[str, Any]) -> Dataset:
    """
    Create a new dataset.
    
    Args:
        session: Database session
        dataset_data: Dataset data dictionary
        
    Returns:
        Created dataset object
        
    Raises:
        ValueError: If required fields are missing or if referenced entities don't exist
    """
    # Validate required fields
    if not dataset_data.get("environment_name"):
        raise ValueError("Environment reference (environment_name) is required for dataset")
        
    # Import here to avoid circular imports
    from mlpie.db.crud.environment import get_environment_by_name
    from mlpie.db.crud.project import get_project_by_name
    
    # Verify that the referenced environment exists
    environment_name = dataset_data.get("environment_name")
    environment = await get_environment_by_name(session, environment_name)
    if not environment:
        raise ValueError(f"Dataset references non-existent environment '{environment_name}'")
    
    # Verify that the referenced project exists (if specified)
    project_name = dataset_data.get("project_name")
    if project_name:
        project = await get_project_by_name(session, project_name)
        if not project:
            raise ValueError(f"Dataset references non-existent project '{project_name}'")
    
    # Create and save the dataset
    dataset = Dataset(**dataset_data)
    session.add(dataset)
    await session.commit()
    await session.refresh(dataset)
    return dataset


async def update_dataset(session: AsyncSession, dataset: Dataset) -> Dataset:
    """
    Update a dataset.
    
    Args:
        session: Database session
        dataset: Dataset object to update
        
    Returns:
        Updated dataset object
    """
    await session.commit()
    await session.refresh(dataset)
    return dataset


async def delete_dataset(session: AsyncSession, name: str) -> bool:
    """
    Delete a dataset.
    
    Args:
        session: Database session
        name: Dataset name
        
    Returns:
        True if dataset was deleted, False if not found
    """
    result = await session.execute(delete(Dataset).where(Dataset.name == name))
    await session.commit()
    return result.rowcount > 0


async def reconcile_datasets(
    session: AsyncSession,
    scanned_datasets: List[Dataset]
) -> Dict[str, int]:
    """
    Reconcile scanned datasets with database state.
    
    Args:
        session: Database session
        scanned_datasets: List of datasets from scanning
        
    Returns:
        Dictionary with counts of created/updated/unchanged datasets
    """
    counters = {
        "created": 0,
        "updated": 0,
        "unchanged": 0,
        "skipped": 0
    }
    
    # Import here to avoid circular imports
    from mlpie.db.crud.environment import get_environment_by_name
    from mlpie.db.crud.project import get_project_by_name
    
    # Track processed datasets by name for potential cleanup
    processed_names = set()
    
    # Process each scanned dataset
    for dataset in scanned_datasets:
        name = dataset.name
        processed_names.add(name)
        
        # Validate required environment reference
        if not dataset.environment_name:
            logger.error(f"Dataset {name} is missing required environmentRef.name field - skipping")
            counters["skipped"] += 1
            continue
            
        # Verify that the referenced environment exists
        environment = await get_environment_by_name(session, dataset.environment_name)
        if not environment:
            logger.error(f"Dataset {name} references non-existent environment '{dataset.environment_name}' - skipping")
            counters["skipped"] += 1
            continue
            
        # Verify that the referenced project exists (if specified)
        if dataset.project_name:
            project = await get_project_by_name(session, dataset.project_name)
            if not project:
                logger.error(f"Dataset {name} references non-existent project '{dataset.project_name}' - skipping")
                counters["skipped"] += 1
                continue
        
        # Check if dataset exists
        existing_dataset = await get_dataset_by_name(session, name)
        
        if existing_dataset:
            # Check if anything actually changed before updating
            needs_update = False
            
            # Compare fields
            if existing_dataset.spec != dataset.spec:
                existing_dataset.spec = dataset.spec
                needs_update = True
                
            if existing_dataset.description != dataset.description:
                existing_dataset.description = dataset.description
                needs_update = True
                
            if existing_dataset.format != dataset.format:
                existing_dataset.format = dataset.format
                needs_update = True
                
            if existing_dataset.source_type != dataset.source_type:
                existing_dataset.source_type = dataset.source_type
                needs_update = True
                
            if existing_dataset.host != dataset.host:
                existing_dataset.host = dataset.host
                needs_update = True
                
            if existing_dataset.port != dataset.port:
                existing_dataset.port = dataset.port
                needs_update = True
                
            if existing_dataset.database != dataset.database:
                existing_dataset.database = dataset.database
                needs_update = True
                
            if existing_dataset.active != dataset.active:
                existing_dataset.active = dataset.active
                needs_update = True
                
            if existing_dataset.project_name != dataset.project_name:
                existing_dataset.project_name = dataset.project_name
                needs_update = True
                
            if existing_dataset.environment_name != dataset.environment_name:
                existing_dataset.environment_name = dataset.environment_name
                needs_update = True
                
            if existing_dataset.labels != dataset.labels:
                existing_dataset.labels = dataset.labels
                needs_update = True
                
            if existing_dataset.credentials_secret_name != dataset.credentials_secret_name:
                existing_dataset.credentials_secret_name = dataset.credentials_secret_name
                needs_update = True
                
            if existing_dataset.credentials_username_key != dataset.credentials_username_key:
                existing_dataset.credentials_username_key = dataset.credentials_username_key
                needs_update = True
                
            if existing_dataset.credentials_password_key != dataset.credentials_password_key:
                existing_dataset.credentials_password_key = dataset.credentials_password_key
                needs_update = True
                
            # Update repository source info if available
            if hasattr(dataset, 'source_repository_url') and hasattr(existing_dataset, 'source_repository_url'):
                if existing_dataset.source_repository_url != dataset.source_repository_url:
                    existing_dataset.source_repository_url = dataset.source_repository_url
                    needs_update = True
                    
            if hasattr(dataset, 'source_repository_path') and hasattr(existing_dataset, 'source_repository_path'):
                if existing_dataset.source_repository_path != dataset.source_repository_path:
                    existing_dataset.source_repository_path = dataset.source_repository_path
                    needs_update = True
                
            # Only update if something changed
            if needs_update:
                await update_dataset(session, existing_dataset)
                counters["updated"] += 1
            else:
                counters["unchanged"] += 1
        else:
            # Create new dataset
            dataset_data = {
                "name": dataset.name,
                "spec": dataset.spec,
                "description": dataset.description,
                "format": dataset.format,
                "source_type": dataset.source_type,
                "host": dataset.host,
                "port": dataset.port,
                "database": dataset.database,
                "active": dataset.active,
                "project_name": dataset.project_name,
                "environment_name": dataset.environment_name,
                "labels": dataset.labels,
                "credentials_secret_name": dataset.credentials_secret_name,
                "credentials_username_key": dataset.credentials_username_key,
                "credentials_password_key": dataset.credentials_password_key
            }
            
            # Add source repository info if available
            if hasattr(dataset, 'source_repository_url'):
                dataset_data["source_repository_url"] = dataset.source_repository_url
                
            if hasattr(dataset, 'source_repository_path'):
                dataset_data["source_repository_path"] = dataset.source_repository_path
                
            await create_dataset(session, dataset_data)
            counters["created"] += 1
    
    # Optional: Mark datasets not found in scan for cleanup
    # This would depend on your reconciliation strategy
    
    return counters

async def _resolve_project_references(session: AsyncSession, datasets: List[Dataset]):
    """
    Resolve project references in datasets.
    
    This function looks at the projectRef in each dataset's spec and 
    resolves it to a project_id by looking up the project by name.
    
    Args:
        session: Database session
        datasets: List of datasets to process
    """
    from mlpie.db.crud.project import get_project_by_name
    
    for dataset in datasets:
        try:
            # Get project reference from spec
            spec_dict = dataset.spec if isinstance(dataset.spec, dict) else {}
            project_ref = spec_dict.get("spec", {}).get("projectRef")
            
            if project_ref and isinstance(project_ref, dict) and project_ref.get("name"):
                project_name = project_ref["name"]
                
                # Look up project by name
                project = await get_project_by_name(session, project_name)
                if project:
                    dataset.project_id = project.id
                    logger.info(f"Resolved project reference for dataset {dataset.name} to project {project_name} (ID: {project.id})")
                else:
                    logger.warning(f"Could not resolve project reference '{project_name}' for dataset {dataset.name}")
        except Exception as e:
            logger.exception(f"Error resolving project reference for dataset {dataset.name}", exc_info=e) 