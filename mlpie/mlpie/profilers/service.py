"""
Data Profiling Service for MLPie.

This module provides a central service for profiling datasets using various profiler plugins.
"""

import logging
from typing import Any, Dict, List, Optional, Union, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.models.dataset import Dataset
from mlpie.plugins import PluginType, get_plugin_registry
from mlpie.profilers.interfaces import DataProfilerInterface
from mlpie.profilers.base import ProfileConfig, ProfileResult


logger = logging.getLogger(__name__)


class ProfilerService:
    """Central service for managing data profiling operations."""
    
    def __init__(self):
        """Initialize the profiler service."""
        self.registry = get_plugin_registry()
    
    async def get_available_profilers(self) -> List[Dict[str, Any]]:
        """
        Get a list of all available profiler plugins.
        
        Returns:
            List of profiler metadata dictionaries
        """
        try:
            plugin_classes = self.registry.get_plugin_classes(PluginType.CUSTOM)
            
            profilers = []
            for name, plugin_class in plugin_classes.items():
                # Only include plugins that implement DataProfilerInterface
                if hasattr(plugin_class, "__mro__") and DataProfilerInterface in plugin_class.__mro__:
                    metadata = plugin_class.get_metadata()
                    profilers.append({
                        "name": metadata.name,
                        "description": metadata.description,
                        "version": metadata.version,
                        "author": metadata.author,
                        "capabilities": metadata.capabilities,
                    })
            
            return profilers
            
        except Exception as e:
            logger.error(f"Error getting available profilers: {str(e)}")
            return []
    
    async def profile_dataset(
        self, 
        session: AsyncSession,
        dataset_id: Union[str, UUID],
        profiler_name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[ProfileResult]:
        """
        Profile a dataset using the specified profiler.
        
        Args:
            session: Database session
            dataset_id: ID of the dataset to profile
            profiler_name: Name of the profiler to use (if None, use dataset's configured profiler)
            config: Profiler configuration options
            
        Returns:
            ProfileResult containing the profiling results, or None if profiling failed
        """
        from mlpie.db.crud.dataset import get_dataset
        
        try:
            # Get the dataset
            dataset = await get_dataset(session, dataset_id)
            if not dataset:
                logger.error(f"Dataset not found: {dataset_id}")
                return None
            
            # Determine which profiler to use
            profile_plugin_name = profiler_name or dataset.profiler_name
            if not profile_plugin_name:
                logger.error(f"No profiler specified for dataset {dataset.name}")
                return None
            
            # Get the profiler configuration
            profile_config = ProfileConfig(**(config or dataset.profile_config or {}))
            
            # Get the profiler plugin
            profiler = await self._get_profiler(profile_plugin_name)
            if not profiler:
                logger.error(f"Profiler not found: {profile_plugin_name}")
                return None
            
            # Get data source path from dataset
            data_source = self._get_data_source_from_dataset(dataset)
            if not data_source:
                logger.error(f"Could not determine data source for dataset {dataset.name}")
                return None
            
            # Check if profiler can handle this data source
            can_handle = await profiler.can_handle_source(data_source)
            if not can_handle:
                logger.error(f"Profiler {profile_plugin_name} cannot handle data source for dataset {dataset.name}")
                return None
            
            # Profile the dataset
            logger.info(f"Profiling dataset {dataset.name} with profiler {profile_plugin_name}")
            result = await profiler.profile_data(data_source, profile_config)
            
            # Update dataset with profile results
            dataset.last_profiled_at = result.timestamp
            dataset.profile_results = result.to_dict()
            
            # Also update dataset row count if available
            if result.row_count and not dataset.record_count:
                dataset.record_count = result.row_count
            
            # Save changes to database
            session.add(dataset)
            await session.commit()
            
            return result
            
        except Exception as e:
            logger.exception(f"Error profiling dataset {dataset_id}: {str(e)}")
            await session.rollback()
            return None
    
    async def profile_dataset_preview(
        self, 
        session: AsyncSession,
        dataset_id: Union[str, UUID],
        profiler_name: Optional[str] = None,
        sample_size: int = 1000
    ) -> Optional[ProfileResult]:
        """
        Generate a quick profile preview for a dataset.
        
        Args:
            session: Database session
            dataset_id: ID of the dataset to profile
            profiler_name: Name of the profiler to use (if None, use dataset's configured profiler)
            sample_size: Number of rows to sample
            
        Returns:
            ProfileResult containing the preview results, or None if profiling failed
        """
        from mlpie.db.crud.dataset import get_dataset
        
        try:
            # Get the dataset
            dataset = await get_dataset(session, dataset_id)
            if not dataset:
                logger.error(f"Dataset not found: {dataset_id}")
                return None
            
            # Determine which profiler to use
            profile_plugin_name = profiler_name or dataset.profiler_name
            if not profile_plugin_name:
                logger.error(f"No profiler specified for dataset {dataset.name}")
                return None
            
            # Get the profiler plugin
            profiler = await self._get_profiler(profile_plugin_name)
            if not profiler:
                logger.error(f"Profiler not found: {profile_plugin_name}")
                return None
            
            # Get data source path from dataset
            data_source = self._get_data_source_from_dataset(dataset)
            if not data_source:
                logger.error(f"Could not determine data source for dataset {dataset.name}")
                return None
            
            # Check if profiler can handle this data source
            can_handle = await profiler.can_handle_source(data_source)
            if not can_handle:
                logger.error(f"Profiler {profile_plugin_name} cannot handle data source for dataset {dataset.name}")
                return None
            
            # Profile the dataset preview
            logger.info(f"Generating profile preview for dataset {dataset.name} with profiler {profile_plugin_name}")
            result = await profiler.profile_preview(data_source, sample_size)
            
            return result
            
        except Exception as e:
            logger.exception(f"Error profiling dataset preview {dataset_id}: {str(e)}")
            return None
    
    async def _get_profiler(self, profiler_name: str) -> Optional[DataProfilerInterface]:
        """
        Get a profiler plugin by name.
        
        Args:
            profiler_name: Name of the profiler to get
            
        Returns:
            DataProfilerInterface instance or None if not found
        """
        try:
            # Since profilers are registered as CUSTOM plugin type
            plugin = await self.registry.get_plugin(PluginType.CUSTOM, profiler_name)
            
            # Check if it's a valid profiler (implements DataProfilerInterface)
            if isinstance(plugin, DataProfilerInterface):
                return cast(DataProfilerInterface, plugin)
            else:
                logger.error(f"Plugin {profiler_name} is not a valid profiler")
                return None
                
        except Exception as e:
            logger.error(f"Error getting profiler {profiler_name}: {str(e)}")
            return None
    
    def _get_data_source_from_dataset(self, dataset: Dataset) -> Optional[str]:
        """
        Extract the data source path from a dataset.
        
        Args:
            dataset: The dataset
            
        Returns:
            String containing the data source path, or None if not available
        """
        # The logic here will depend on how datasets store their data location
        # This is a simplified implementation
        if dataset.spec and isinstance(dataset.spec, dict):
            # Try to get source from K8s-style spec
            source = dataset.spec.get("spec", {}).get("source", {})
            if source and isinstance(source, dict):
                return source.get("path") or source.get("location") or source.get("uri")
                
        # Fallback to direct location field (if it exists in your model)
        return dataset.spec.get("location")


# Singleton instance
_profiler_service: Optional[ProfilerService] = None


def get_profiler_service() -> ProfilerService:
    """
    Get the profiler service instance.
    
    Returns:
        The profiler service singleton instance
    """
    global _profiler_service
    
    if _profiler_service is None:
        _profiler_service = ProfilerService()
    
    return _profiler_service 