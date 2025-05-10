"""
API Routes for dataset operations.

This module defines the API endpoints for managing datasets and data profiling.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.connection import get_session
from mlpie.db.crud.dataset import (
    get_dataset_by_id,
    get_all_datasets as get_datasets,
    create_dataset,
    update_dataset,
    delete_dataset
)
from mlpie.profilers.service import get_profiler_service
from mlpie.profilers.base import ProfileConfig


# Create router
router = APIRouter(
    prefix="/datasets",
    tags=["datasets"],
)


@router.get("/", response_model=List[Dict[str, Any]])
async def list_datasets(
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[UUID] = None,
):
    """
    List all datasets.
    
    Args:
        session: Database session
        skip: Number of items to skip
        limit: Maximum number of items to return
        project_id: Filter datasets by project ID
        
    Returns:
        List of dataset dictionaries
    """
    datasets = await get_datasets(session, skip=skip, limit=limit, project_id=project_id)
    return [dataset.__dict__ for dataset in datasets]


@router.get("/{dataset_id}", response_model=Dict[str, Any])
async def get_dataset_by_id_route(
    dataset_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get a dataset by ID.
    
    Args:
        dataset_id: Dataset ID
        session: Database session
        
    Returns:
        Dataset dictionary
    """
    dataset = await get_dataset_by_id(session, dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} not found"
        )
    return dataset.__dict__


@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_new_dataset(
    dataset_data: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new dataset.
    
    Args:
        dataset_data: Dataset data
        session: Database session
        
    Returns:
        Created dataset dictionary
    """
    dataset = await create_dataset(session, dataset_data)
    return dataset.__dict__


@router.put("/{dataset_id}", response_model=Dict[str, Any])
async def update_dataset_by_id(
    dataset_id: UUID,
    dataset_data: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
):
    """
    Update a dataset.
    
    Args:
        dataset_id: Dataset ID
        dataset_data: Updated dataset data
        session: Database session
        
    Returns:
        Updated dataset dictionary
    """
    dataset = await get_dataset_by_id(session, dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} not found"
        )
    
    updated_dataset = await update_dataset(session, dataset, dataset_data)
    return updated_dataset.__dict__


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset_by_id(
    dataset_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a dataset.
    
    Args:
        dataset_id: Dataset ID
        session: Database session
    """
    dataset = await get_dataset_by_id(session, dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} not found"
        )
    
    await delete_dataset(session, dataset)


@router.get("/profilers/available", response_model=List[Dict[str, Any]])
async def get_available_profilers():
    """
    Get a list of available data profilers.
    
    Returns:
        List of profiler metadata
    """
    profiler_service = get_profiler_service()
    profilers = await profiler_service.get_available_profilers()
    return profilers


@router.post("/{dataset_id}/profile", response_model=Dict[str, Any])
async def profile_dataset(
    dataset_id: UUID,
    profiler_name: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Profile a dataset using the specified profiler.
    
    Args:
        dataset_id: Dataset ID
        profiler_name: Name of the profiler to use (optional)
        config: Profiler configuration options
        session: Database session
        
    Returns:
        Profiling results
    """
    profiler_service = get_profiler_service()
    
    # Profile the dataset
    result = await profiler_service.profile_dataset(
        session=session,
        dataset_id=dataset_id,
        profiler_name=profiler_name,
        config=config
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to profile dataset"
        )
    
    return result.to_dict()


@router.post("/{dataset_id}/profile/preview", response_model=Dict[str, Any])
async def profile_dataset_preview(
    dataset_id: UUID,
    profiler_name: Optional[str] = None,
    sample_size: int = Query(1000, ge=1, le=10000),
    session: AsyncSession = Depends(get_session),
):
    """
    Generate a quick profile preview for a dataset.
    
    Args:
        dataset_id: Dataset ID
        profiler_name: Name of the profiler to use (optional)
        sample_size: Number of rows to sample
        session: Database session
        
    Returns:
        Preview profiling results
    """
    profiler_service = get_profiler_service()
    
    # Profile the dataset preview
    result = await profiler_service.profile_dataset_preview(
        session=session,
        dataset_id=dataset_id,
        profiler_name=profiler_name,
        sample_size=sample_size
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate profile preview"
        )
    
    return result.to_dict()


@router.put("/{dataset_id}/profiler", response_model=Dict[str, Any])
async def configure_dataset_profiler(
    dataset_id: UUID,
    profiler_config: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
):
    """
    Configure the profiler settings for a dataset.
    
    Args:
        dataset_id: Dataset ID
        profiler_config: Profiler configuration dictionary
        session: Database session
        
    Returns:
        Updated dataset
    """
    dataset = await get_dataset_by_id(session, dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} not found"
        )
    
    # Update profiler configuration
    update_data = {
        "profiler_name": profiler_config.get("profiler_name"),
        "auto_profile": profiler_config.get("auto_profile", False),
        "profile_config": profiler_config.get("config", {})
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    # Update the dataset
    updated_dataset = await update_dataset(session, dataset, update_data)
    
    return updated_dataset.__dict__ 