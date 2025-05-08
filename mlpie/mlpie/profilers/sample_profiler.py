"""
Sample data profiler plugin for MLPie.

This is a simple example plugin to demonstrate how to implement custom profilers.
"""

import os
import time
from typing import Any, Dict, List, Optional, Union

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin
from mlpie.profilers.interfaces import DataProfilerInterface
from mlpie.profilers.base import ProfileConfig, ProfileResult


@register_plugin
class SampleProfiler(DataProfilerInterface, Plugin):
    """Sample data profiler for demonstration purposes."""
    
    # Define plugin metadata
    metadata = PluginMetadata(
        name="sample_profiler",
        version="0.1.0",
        description="A simple example profiler plugin",
        plugin_type=PluginType.CUSTOM,
        author="MLPie Team",
        capabilities=["data_profiling", "demo"],
    )
    
    def __init__(self):
        """Initialize the profiler."""
        Plugin.__init__(self)
        self.initialized = False
        self.config = {}
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if initialization was successful
        """
        self.config = config
        self.initialized = True
        return True
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dictionary of validation errors, empty if valid
        """
        # This simple example doesn't have any configuration requirements
        return {}
    
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin."""
        self.initialized = False
    
    async def get_supported_formats(self) -> List[str]:
        """Get the list of file formats supported by this profiler.
        
        Returns:
            List of supported format strings
        """
        return ["csv", "txt"]
    
    async def can_handle_source(self, data_source: Union[str, Any]) -> bool:
        """Check if this profiler can handle the given data source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            True if the profiler can handle this data source, False otherwise
        """
        # This sample profiler only handles CSV files
        if isinstance(data_source, str) and os.path.isfile(data_source):
            _, ext = os.path.splitext(data_source)
            ext = ext.lower().lstrip('.')
            return ext in ["csv", "txt"]
            
        return False
    
    async def profile_data(
        self, 
        data_source: Union[str, Any], 
        config: Optional[ProfileConfig] = None
    ) -> ProfileResult:
        """Profile a dataset and generate a ProfileResult.
        
        Args:
            data_source: Path to the data file or a data object
            config: Configuration options for profiling
            
        Returns:
            ProfileResult containing the profiling results
        """
        if not self.initialized:
            raise ValueError("Profiler is not initialized")
            
        # For demonstration purposes, this profiler just creates a basic result
        # with minimal information
        
        start_time = time.time()
        
        # Get file size
        file_size = os.path.getsize(data_source) if isinstance(data_source, str) else 0
        
        # Count lines in the file (very basic approach)
        row_count = 0
        column_count = 0
        
        if isinstance(data_source, str) and os.path.isfile(data_source):
            with open(data_source, 'r') as f:
                # Read the first line to get column count
                first_line = f.readline().strip()
                column_count = len(first_line.split(','))
                row_count = 1  # Already counted the first line
                
                # Count remaining lines
                for _ in f:
                    row_count += 1
        
        # Create a basic profile result
        result = ProfileResult(
            dataset_name=os.path.basename(data_source) if isinstance(data_source, str) else "unknown",
            profiler_name=self.metadata.name,
            row_count=row_count,
            column_count=column_count,
            memory_usage=file_size,
        )
        
        # Add some dummy column stats
        result.column_stats = {
            f"column_{i}": {
                "name": f"column_{i}",
                "dtype": "string",
                "null_count": 0,
                "null_percentage": 0.0,
                "unique_count": row_count // 2,  # Dummy value
            } for i in range(column_count)
        }
        
        # Add dummy missing values stats
        result.missing_values = {
            f"column_{i}": 0 for i in range(column_count)
        }
        result.missing_values["total"] = 0
        result.missing_values["percentage"] = 0.0
        
        # Calculate profiling duration
        result.profiling_duration_seconds = time.time() - start_time
        
        # Add message that this is a demo profiler
        result.additional_data["note"] = "This is a demonstration profiler that provides minimal analysis."
        
        return result
    
    async def profile_preview(
        self, 
        data_source: Union[str, Any], 
        sample_size: int = 1000
    ) -> ProfileResult:
        """Generate a quick profile preview using a sample of the data.
        
        Args:
            data_source: Path to the data file or a data object
            sample_size: Number of rows to sample
            
        Returns:
            ProfileResult containing the preview results
        """
        # For this simple demo, just use the regular profile
        result = await self.profile_data(data_source)
        result.additional_data["is_preview"] = True
        result.additional_data["sample_size"] = min(sample_size, result.row_count)
        
        return result 