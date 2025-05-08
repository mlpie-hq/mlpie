"""
Base classes for data profiling in MLPie.

This module defines the core data structures used by profiler plugins.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4


@dataclass
class ProfileConfig:
    """Configuration options for data profiling."""
    
    # General profiling options
    correlation_analysis: bool = True
    include_summary_stats: bool = True
    include_histograms: bool = True
    sample_size: Optional[int] = None
    
    # Options for specific column types
    text_length_analysis: bool = True
    categorical_cardinality_analysis: bool = True
    numerical_distribution_analysis: bool = True
    datetime_range_analysis: bool = True
    
    # Additional custom parameters for specific profilers
    additional_params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProfileResult:
    """Result of data profiling operation."""
    
    # Basic metadata
    id: str = field(default_factory=lambda: str(uuid4()))
    dataset_id: Optional[str] = None
    dataset_name: str = ""
    profiler_name: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Overall statistics
    row_count: int = 0
    column_count: int = 0
    memory_usage: Optional[int] = None
    profiling_duration_seconds: float = 0.0
    
    # Column statistics (varies by profiler)
    column_stats: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    
    # Correlation analysis
    correlations: Optional[Dict[str, Any]] = None
    
    # Missing values analysis
    missing_values: Dict[str, Union[int, float]] = field(default_factory=dict)
    
    # For storing any profiler-specific results
    additional_data: Dict[str, Any] = field(default_factory=dict)
    
    # Full report in profiler's native format (if available)
    raw_report: Optional[Any] = None
    
    # Visualization components (if available)
    visualization_data: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile result to a dictionary."""
        result = {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "dataset_name": self.dataset_name,
            "profiler_name": self.profiler_name,
            "timestamp": self.timestamp.isoformat(),
            "row_count": self.row_count,
            "column_count": self.column_count,
            "profiling_duration_seconds": self.profiling_duration_seconds,
            "column_stats": self.column_stats,
            "missing_values": self.missing_values,
        }
        
        if self.memory_usage is not None:
            result["memory_usage"] = self.memory_usage
            
        if self.correlations is not None:
            result["correlations"] = self.correlations
            
        if self.additional_data:
            result["additional_data"] = self.additional_data
            
        if self.visualization_data is not None:
            result["visualization_data"] = self.visualization_data
        
        # Don't include raw_report in the dict (potentially too large)
        
        return result 