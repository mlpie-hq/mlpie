"""
Pandas-based data profiler for MLPie.

This module provides a data profiler implementation using pandas.
"""

import os
import time
from typing import Any, Dict, List, Optional, Union, cast

import pandas as pd
import numpy as np

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin
from mlpie.profilers.interfaces import DataProfilerInterface
from mlpie.profilers.base import ProfileConfig, ProfileResult


@register_plugin
class PandasProfiler(DataProfilerInterface, Plugin):
    """Pandas-based data profiler for small to medium datasets."""
    
    # Define plugin metadata
    metadata = PluginMetadata(
        name="pandas_profiler",
        version="0.1.0",
        description="Data profiler based on pandas for small to medium datasets",
        plugin_type=PluginType.CUSTOM,
        author="MLPie Team",
        capabilities=["data_profiling", "small_data", "basic_statistics"],
    )
    
    def __init__(self):
        """Initialize the profiler."""
        Plugin.__init__(self)
        self.initialized = False
        self.max_memory_size = 1024 * 1024 * 1024  # 1GB default
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if initialization was successful
        """
        self.max_memory_size = config.get("max_memory_size", self.max_memory_size)
        self.initialized = True
        return True
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dictionary of validation errors, empty if valid
        """
        errors = {}
        
        if "max_memory_size" in config:
            try:
                max_size = int(config["max_memory_size"])
                if max_size <= 0:
                    errors["max_memory_size"] = "Must be a positive integer"
            except (ValueError, TypeError):
                errors["max_memory_size"] = "Must be an integer"
                
        return errors
    
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin."""
        self.initialized = False
    
    async def get_supported_formats(self) -> List[str]:
        """Get the list of file formats supported by this profiler.
        
        Returns:
            List of supported format strings
        """
        return [
            "csv", "parquet", "json", "excel", "xls", "xlsx", 
            "hdf", "feather", "pickle", "pkl"
        ]
    
    async def can_handle_source(self, data_source: Union[str, Any]) -> bool:
        """Check if this profiler can handle the given data source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            True if the profiler can handle this data source, False otherwise
        """
        # Check if it's a pandas DataFrame already
        if isinstance(data_source, pd.DataFrame):
            # Check size limits
            memory_usage = data_source.memory_usage(deep=True).sum()
            return memory_usage <= self.max_memory_size
            
        # Check if it's a file path
        if isinstance(data_source, str) and os.path.isfile(data_source):
            file_size = os.path.getsize(data_source)
            
            # Simple heuristic: file size should be less than max memory
            # This is conservative as the loaded DataFrame might be larger
            if file_size > self.max_memory_size:
                return False
                
            # Check file extension
            _, ext = os.path.splitext(data_source)
            ext = ext.lower().lstrip('.')
            return ext in await self.get_supported_formats()
            
        return False
    
    async def _load_data(self, data_source: Union[str, Any]) -> pd.DataFrame:
        """Load data from the given source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            Pandas DataFrame with the loaded data
            
        Raises:
            ValueError: If the data source cannot be loaded
        """
        # If it's already a DataFrame, just return it
        if isinstance(data_source, pd.DataFrame):
            return data_source
            
        # Handle file paths
        if isinstance(data_source, str) and os.path.isfile(data_source):
            _, ext = os.path.splitext(data_source)
            ext = ext.lower().lstrip('.')
            
            try:
                if ext in ["csv", "txt"]:
                    return pd.read_csv(data_source)
                elif ext in ["parquet"]:
                    return pd.read_parquet(data_source)
                elif ext in ["json"]:
                    return pd.read_json(data_source)
                elif ext in ["xls", "xlsx", "excel"]:
                    return pd.read_excel(data_source)
                elif ext in ["pkl", "pickle"]:
                    return pd.read_pickle(data_source)
                elif ext in ["feather"]:
                    return pd.read_feather(data_source)
                elif ext in ["hdf", "h5"]:
                    return pd.read_hdf(data_source)
                else:
                    raise ValueError(f"Unsupported file format: {ext}")
            except Exception as e:
                raise ValueError(f"Failed to load data from {data_source}: {str(e)}")
                
        raise ValueError(f"Unsupported data source type: {type(data_source)}")
    
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
            
        Raises:
            ValueError: If the data source cannot be profiled
        """
        if not self.initialized:
            raise ValueError("Profiler is not initialized")
            
        # Use default config if none provided
        if config is None:
            config = ProfileConfig()
            
        # Load the data
        start_time = time.time()
        df = await self._load_data(data_source)
        
        # Create profile result
        result = ProfileResult(
            dataset_name=self._get_dataset_name(data_source),
            profiler_name=self.metadata.name,
            row_count=len(df),
            column_count=len(df.columns),
            memory_usage=df.memory_usage(deep=True).sum(),
        )
        
        # Collect basic statistics for each column
        result.column_stats = await self._analyze_columns(df, config)
        
        # Analyze missing values
        result.missing_values = {
            col: int(df[col].isna().sum()) for col in df.columns
        }
        result.missing_values["total"] = int(df.isna().sum().sum())
        result.missing_values["percentage"] = float(df.isna().mean().mean() * 100)
        
        # Perform correlation analysis
        if config.correlation_analysis and len(df.columns) > 1:
            result.correlations = await self._calculate_correlations(df)
            
        # Add visualization data if requested
        if config.include_histograms:
            result.visualization_data = await self._generate_visualization_data(df, config)
            
        # Calculate profiling duration
        result.profiling_duration_seconds = time.time() - start_time
        
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
        # Load the data
        df = await self._load_data(data_source)
        
        # Sample the data
        if len(df) > sample_size:
            df = df.sample(sample_size, random_state=42)
            
        # Create a config for preview with limited features
        config = ProfileConfig(
            correlation_analysis=True,
            include_summary_stats=True,
            include_histograms=True,
            sample_size=sample_size,
            text_length_analysis=False,
            datetime_range_analysis=False,
        )
        
        # Profile the sampled data
        result = await self.profile_data(df, config)
        result.additional_data["is_preview"] = True
        result.additional_data["sample_size"] = sample_size
        
        return result
    
    def _get_dataset_name(self, data_source: Union[str, Any]) -> str:
        """Extract dataset name from data source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            Dataset name
        """
        if isinstance(data_source, str) and os.path.isfile(data_source):
            return os.path.basename(data_source)
        elif isinstance(data_source, pd.DataFrame):
            return "dataframe"
        else:
            return "unknown"
    
    async def _analyze_columns(
        self, 
        df: pd.DataFrame, 
        config: ProfileConfig
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze columns and collect statistics.
        
        Args:
            df: DataFrame to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        column_stats = {}
        
        for col in df.columns:
            col_stats = {
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isna().sum()),
                "null_percentage": float(df[col].isna().mean() * 100),
                "unique_count": int(df[col].nunique()),
            }
            
            # Determine column type for specific analysis
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stats.update(await self._analyze_numeric_column(df[col], config))
            elif pd.api.types.is_datetime64_dtype(df[col]):
                col_stats.update(await self._analyze_datetime_column(df[col], config))
            elif pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
                col_stats.update(await self._analyze_text_column(df[col], config))
            elif pd.api.types.is_bool_dtype(df[col]):
                col_stats.update(await self._analyze_boolean_column(df[col]))
                
            column_stats[col] = col_stats
            
        return column_stats
    
    async def _analyze_numeric_column(
        self, 
        series: pd.Series, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a numeric column.
        
        Args:
            series: Series to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        stats = {}
        
        # Basic statistics
        if config.include_summary_stats:
            stats.update({
                "min": float(series.min()) if not pd.isna(series.min()) else None,
                "max": float(series.max()) if not pd.isna(series.max()) else None,
                "mean": float(series.mean()) if not pd.isna(series.mean()) else None,
                "median": float(series.median()) if not pd.isna(series.median()) else None,
                "std": float(series.std()) if not pd.isna(series.std()) else None,
            })
            
            # Add percentiles
            try:
                percentiles = series.quantile([0.25, 0.5, 0.75, 0.9, 0.95, 0.99])
                stats["percentiles"] = {
                    f"p{int(p*100)}": float(percentiles[p]) for p in [0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
                }
            except:
                # Some numeric columns might not support quantiles
                pass
                
        # Distribution analysis
        if config.numerical_distribution_analysis:
            stats["is_normal"] = await self._test_normality(series)
            stats["skewness"] = float(series.skew()) if not pd.isna(series.skew()) else None
            stats["kurtosis"] = float(series.kurtosis()) if not pd.isna(series.kurtosis()) else None
            
        return stats
    
    async def _analyze_text_column(
        self, 
        series: pd.Series, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a text column.
        
        Args:
            series: Series to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        stats = {}
        
        # Convert to string type and remove NaNs
        str_series = series.astype(str).replace('nan', np.nan).dropna()
        
        # Most common values
        if config.categorical_cardinality_analysis:
            unique_count = series.nunique()
            stats["is_categorical"] = unique_count <= 20 or (unique_count / len(series) < 0.05)
            
            # Get most common values
            try:
                value_counts = series.value_counts().head(10)
                stats["top_values"] = {
                    str(k): int(v) for k, v in value_counts.items() if pd.notna(k)
                }
            except:
                pass
                
        # Text length analysis
        if config.text_length_analysis:
            try:
                str_series = str_series.astype(str)
                lengths = str_series.str.len()
                stats["text_length"] = {
                    "min": int(lengths.min()) if not pd.isna(lengths.min()) else None,
                    "max": int(lengths.max()) if not pd.isna(lengths.max()) else None,
                    "mean": float(lengths.mean()) if not pd.isna(lengths.mean()) else None,
                    "median": float(lengths.median()) if not pd.isna(lengths.median()) else None,
                }
            except:
                # Might fail if column contains complex objects
                pass
                
        return stats
    
    async def _analyze_datetime_column(
        self, 
        series: pd.Series, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a datetime column.
        
        Args:
            series: Series to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        stats = {}
        
        # Basic range
        if config.datetime_range_analysis:
            min_date = series.min()
            max_date = series.max()
            
            if pd.notna(min_date) and pd.notna(max_date):
                stats["min_date"] = min_date.isoformat()
                stats["max_date"] = max_date.isoformat()
                stats["date_range_days"] = (max_date - min_date).days
                
                # Extract patterns in the dates
                year_counts = series.dt.year.value_counts().to_dict()
                month_counts = series.dt.month.value_counts().to_dict()
                weekday_counts = series.dt.dayofweek.value_counts().to_dict()
                
                stats["year_distribution"] = {str(k): int(v) for k, v in year_counts.items()}
                stats["month_distribution"] = {str(k): int(v) for k, v in month_counts.items()}
                stats["weekday_distribution"] = {str(k): int(v) for k, v in weekday_counts.items()}
                
        return stats
    
    async def _analyze_boolean_column(self, series: pd.Series) -> Dict[str, Any]:
        """Analyze a boolean column.
        
        Args:
            series: Series to analyze
            
        Returns:
            Dictionary of column statistics
        """
        stats = {}
        
        # Count True and False values
        value_counts = series.value_counts().to_dict()
        stats["true_count"] = int(value_counts.get(True, 0))
        stats["false_count"] = int(value_counts.get(False, 0))
        stats["true_percentage"] = float(100 * stats["true_count"] / (stats["true_count"] + stats["false_count"])) if (stats["true_count"] + stats["false_count"]) > 0 else 0.0
        stats["false_percentage"] = float(100 * stats["false_count"] / (stats["true_count"] + stats["false_count"])) if (stats["true_count"] + stats["false_count"]) > 0 else 0.0
        
        return stats
    
    async def _calculate_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate correlations between columns.
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            Dictionary with correlation matrix
        """
        # Extract numeric columns
        numeric_df = df.select_dtypes(include=["number"])
        
        if len(numeric_df.columns) < 2:
            return {}
            
        # Calculate correlation matrix
        try:
            corr_matrix = numeric_df.corr().fillna(0).round(4)
            
            # Convert to nested dictionary format
            result = {}
            
            # Get the column names
            columns = corr_matrix.columns.tolist()
            
            # Create the matrix as a nested dictionary
            for col1 in columns:
                result[col1] = {}
                for col2 in columns:
                    result[col1][col2] = float(corr_matrix.loc[col1, col2])
                    
            # Find highly correlated pairs (|corr| > 0.7)
            high_correlations = []
            
            for i, col1 in enumerate(columns):
                for j, col2 in enumerate(columns):
                    if i < j:  # Only check each pair once
                        corr_value = abs(corr_matrix.loc[col1, col2])
                        if corr_value > 0.7:
                            high_correlations.append({
                                "column1": col1,
                                "column2": col2,
                                "correlation": float(corr_matrix.loc[col1, col2])
                            })
                            
            # Sort by absolute correlation value
            high_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
            
            return {
                "matrix": result,
                "high_correlations": high_correlations
            }
            
        except Exception:
            return {}
    
    async def _test_normality(self, series: pd.Series) -> bool:
        """Test if a series follows a normal distribution.
        
        Args:
            series: Series to test
            
        Returns:
            True if the series is likely normally distributed
        """
        # Simple normality test based on skewness and kurtosis
        # More sophisticated tests could be added here
        clean_series = series.dropna()
        
        if len(clean_series) < 20:
            return False
            
        skewness = abs(float(clean_series.skew()))
        kurtosis = abs(float(clean_series.kurtosis()))
        
        # Approximately normal if skewness < 0.5 and kurtosis < 0.5
        return skewness < 0.5 and kurtosis < 0.5
    
    async def _generate_visualization_data(
        self, 
        df: pd.DataFrame, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Generate data for visualizations.
        
        Args:
            df: DataFrame to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary with visualization data
        """
        viz_data = {}
        
        # Generate histogram data for numeric columns
        histograms = {}
        
        for col in df.select_dtypes(include=["number"]).columns:
            try:
                # Calculate histogram
                counts, bin_edges = np.histogram(df[col].dropna(), bins='auto')
                
                # Create histogram data
                histograms[col] = {
                    "counts": [int(c) for c in counts],
                    "bin_edges": [float(e) for e in bin_edges],
                    "bin_centers": [float((bin_edges[i] + bin_edges[i+1])/2) for i in range(len(bin_edges)-1)]
                }
            except:
                # Skip columns that fail
                pass
                
        viz_data["histograms"] = histograms
        
        return viz_data 