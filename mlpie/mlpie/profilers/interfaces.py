"""
Interfaces for data profiling in MLPie.

This module defines the interfaces that all profiler plugins must implement.
"""

import abc
from typing import Any, Dict, List, Optional, Union

from mlpie.plugins.base import Plugin
from mlpie.profilers.base import ProfileConfig, ProfileResult


class DataProfilerInterface(abc.ABC):
    """Interface for data profiler plugins."""
    
    @abc.abstractmethod
    async def profile_data(
        self, 
        data_source: Union[str, Any], 
        config: Optional[ProfileConfig] = None
    ) -> ProfileResult:
        """
        Profile a dataset and generate a ProfileResult.
        
        Args:
            data_source: Path to the data file or a data object (e.g., pandas DataFrame)
            config: Configuration options for profiling
            
        Returns:
            ProfileResult containing the profiling results
        """
        pass
    
    @abc.abstractmethod
    async def get_supported_formats(self) -> List[str]:
        """
        Get the list of file formats supported by this profiler.
        
        Returns:
            List of supported format strings (e.g., 'csv', 'parquet', etc.)
        """
        pass
    
    @abc.abstractmethod
    async def can_handle_source(self, data_source: Union[str, Any]) -> bool:
        """
        Check if this profiler can handle the given data source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            True if the profiler can handle this data source, False otherwise
        """
        pass
    
    @abc.abstractmethod
    async def profile_preview(
        self, 
        data_source: Union[str, Any], 
        sample_size: int = 1000
    ) -> ProfileResult:
        """
        Generate a quick profile preview using a sample of the data.
        
        Args:
            data_source: Path to the data file or a data object
            sample_size: Number of rows to sample
            
        Returns:
            ProfileResult containing the preview results
        """
        pass 