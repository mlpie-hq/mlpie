"""
PySpark-based data profiler for MLPie.

This module provides a data profiler implementation using Apache Spark,
suitable for profiling large datasets.
"""

import os
import time
from typing import Any, Dict, List, Optional, Tuple, Union

from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin
from mlpie.profilers.interfaces import DataProfilerInterface
from mlpie.profilers.base import ProfileConfig, ProfileResult


@register_plugin
class PySparkProfiler(DataProfilerInterface, Plugin):
    """PySpark-based data profiler for large datasets."""
    
    # Define plugin metadata
    metadata = PluginMetadata(
        name="pyspark_profiler",
        version="0.1.0",
        description="Data profiler based on Apache Spark for large datasets",
        plugin_type=PluginType.CUSTOM,
        author="MLPie Team",
        capabilities=["data_profiling", "large_data", "distributed_computing"],
    )
    
    def __init__(self):
        """Initialize the profiler."""
        Plugin.__init__(self)
        self.initialized = False
        self.spark = None
        self.spark_config = {}
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if initialization was successful
        """
        try:
            # Import PySpark here to avoid dependency for users who don't need it
            from pyspark.sql import SparkSession
            
            # Get Spark configuration
            self.spark_config = config.get("spark_config", {})
            app_name = self.spark_config.pop("app_name", "MLPie Data Profiler")
            
            # Create Spark session
            builder = SparkSession.builder.appName(app_name)
            
            # Apply additional configurations
            for key, value in self.spark_config.items():
                builder = builder.config(key, value)
            
            # Create the session
            self.spark = builder.getOrCreate()
            
            self.initialized = True
            return True
            
        except ImportError:
            # PySpark not installed
            raise ImportError(
                "PySpark is not installed. Please install it with 'pip install pyspark'"
            )
        except Exception as e:
            # Other initialization error
            raise RuntimeError(f"Failed to initialize PySpark profiler: {str(e)}")
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dictionary of validation errors, empty if valid
        """
        errors = {}
        
        # Validate spark_config if provided
        if "spark_config" in config and not isinstance(config["spark_config"], dict):
            errors["spark_config"] = "Must be a dictionary"
            
        return errors
    
    async def shutdown(self) -> None:
        """Perform cleanup when shutting down the plugin."""
        if self.spark:
            self.spark.stop()
        self.initialized = False
    
    async def get_supported_formats(self) -> List[str]:
        """Get the list of file formats supported by this profiler.
        
        Returns:
            List of supported format strings
        """
        return [
            "csv", "parquet", "json", "orc", "avro", "jdbc", 
            "text", "delta", "libsvm", "hive"
        ]
    
    async def can_handle_source(self, data_source: Union[str, Any]) -> bool:
        """Check if this profiler can handle the given data source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            True if the profiler can handle this data source, False otherwise
        """
        # Check if it's a Spark DataFrame already
        if hasattr(data_source, "rdd") and hasattr(data_source, "sparkSession"):
            return True
            
        # Check if it's a file path
        if isinstance(data_source, str) and os.path.exists(data_source):
            # Check file extension
            if os.path.isfile(data_source):
                _, ext = os.path.splitext(data_source)
                ext = ext.lower().lstrip('.')
                return ext in await self.get_supported_formats()
            # Check if it's a directory (could be partitioned parquet or other formats)
            elif os.path.isdir(data_source):
                # Try to infer format from files in directory
                for ext in ["parquet", "orc", "delta", "csv", "json"]:
                    if any(f.endswith(f".{ext}") for f in os.listdir(data_source)):
                        return True
                return False
                
        return False
    
    async def _load_data(self, data_source: Union[str, Any]) -> Any:
        """Load data from the given source.
        
        Args:
            data_source: Path to the data file or a data object
            
        Returns:
            Spark DataFrame with the loaded data
            
        Raises:
            ValueError: If the data source cannot be loaded
        """
        if not self.initialized or not self.spark:
            raise ValueError("PySpark profiler is not initialized")
            
        # If it's already a Spark DataFrame, just return it
        if hasattr(data_source, "rdd") and hasattr(data_source, "sparkSession"):
            return data_source
            
        # Handle file paths
        if isinstance(data_source, str) and os.path.exists(data_source):
            try:
                # Try to infer the format
                if os.path.isdir(data_source):
                    # Check for common formats in directory
                    for ext in ["parquet", "orc", "delta"]:
                        if any(f.endswith(f".{ext}") for f in os.listdir(data_source)):
                            if ext == "parquet":
                                return self.spark.read.parquet(data_source)
                            elif ext == "orc":
                                return self.spark.read.orc(data_source)
                            elif ext == "delta":
                                return self.spark.read.format("delta").load(data_source)
                    
                    # Default to parquet for directories
                    return self.spark.read.parquet(data_source)
                else:
                    # For files, infer from extension
                    _, ext = os.path.splitext(data_source)
                    ext = ext.lower().lstrip('.')
                    
                    if ext in ["csv", "txt"]:
                        return self.spark.read.csv(data_source, header=True, inferSchema=True)
                    elif ext == "parquet":
                        return self.spark.read.parquet(data_source)
                    elif ext == "json":
                        return self.spark.read.json(data_source)
                    elif ext == "orc":
                        return self.spark.read.orc(data_source)
                    elif ext == "avro":
                        return self.spark.read.format("avro").load(data_source)
                    else:
                        # Try a generic format approach
                        return self.spark.read.format(ext).load(data_source)
                        
            except Exception as e:
                raise ValueError(f"Failed to load data from {data_source}: {str(e)}")
                
        # Try to convert from pandas DataFrame
        if hasattr(data_source, "to_pandas") or hasattr(data_source, "toPandas"):
            try:
                return self.spark.createDataFrame(data_source)
            except Exception as e:
                raise ValueError(f"Failed to convert data to Spark DataFrame: {str(e)}")
                
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
        if not self.initialized or not self.spark:
            raise ValueError("PySpark profiler is not initialized")
            
        # Use default config if none provided
        if config is None:
            config = ProfileConfig()
            
        # Load the data
        start_time = time.time()
        df = await self._load_data(data_source)
        
        # Get basic statistics
        row_count = df.count()
        column_count = len(df.columns)
        
        # Create profile result
        result = ProfileResult(
            dataset_name=self._get_dataset_name(data_source),
            profiler_name=self.metadata.name,
            row_count=row_count,
            column_count=column_count
        )
        
        # Collect statistics for columns
        result.column_stats = await self._analyze_columns(df, config)
        
        # Analyze missing values
        result.missing_values = await self._analyze_missing_values(df)
        
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
        sampled_df = df.limit(sample_size)
        
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
        result = await self.profile_data(sampled_df, config)
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
        if isinstance(data_source, str) and os.path.exists(data_source):
            if os.path.isfile(data_source):
                return os.path.basename(data_source)
            else:
                return os.path.basename(os.path.normpath(data_source))
        else:
            return "spark_dataframe"
    
    async def _analyze_columns(
        self, 
        df: Any, 
        config: ProfileConfig
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze columns and collect statistics.
        
        Args:
            df: Spark DataFrame to analyze
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        try:
            from pyspark.sql import functions as F
            from pyspark.sql.types import (
                StringType, DoubleType, IntegerType, LongType, 
                BooleanType, TimestampType, DateType
            )
            
            column_stats = {}
            
            # Get schema
            schema = df.schema
            
            # For each column in the DataFrame
            for field in schema.fields:
                col_name = field.name
                col_type = field.dataType
                
                # Basic statistics
                col_stats = {
                    "name": col_name,
                    "dtype": str(col_type),
                }
                
                # Count null values
                null_count_df = df.select(
                    F.count(F.when(F.col(col_name).isNull(), 1)).alias("null_count"),
                    F.count(F.lit(1)).alias("total_count")
                ).collect()[0]
                
                null_count = null_count_df["null_count"]
                total_count = null_count_df["total_count"]
                
                col_stats["null_count"] = null_count
                col_stats["null_percentage"] = 100 * null_count / total_count if total_count > 0 else 0
                
                # Get unique count
                unique_count = df.select(col_name).distinct().count()
                col_stats["unique_count"] = unique_count
                
                # Analyze by data type
                if isinstance(col_type, (DoubleType, IntegerType, LongType)):
                    # Numeric column
                    if config.include_summary_stats:
                        numeric_stats = await self._analyze_numeric_column(df, col_name, config)
                        col_stats.update(numeric_stats)
                elif isinstance(col_type, StringType):
                    # String column
                    string_stats = await self._analyze_string_column(df, col_name, config)
                    col_stats.update(string_stats)
                elif isinstance(col_type, BooleanType):
                    # Boolean column
                    bool_stats = await self._analyze_boolean_column(df, col_name)
                    col_stats.update(bool_stats)
                elif isinstance(col_type, (TimestampType, DateType)):
                    # Date/Timestamp column
                    if config.datetime_range_analysis:
                        date_stats = await self._analyze_datetime_column(df, col_name, config)
                        col_stats.update(date_stats)
                        
                column_stats[col_name] = col_stats
                
            return column_stats
            
        except Exception as e:
            # In case of error, return limited stats
            return {
                col: {"name": col, "error": str(e)} for col in df.columns
            }
    
    async def _analyze_numeric_column(
        self, 
        df: Any, 
        col_name: str, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a numeric column.
        
        Args:
            df: Spark DataFrame
            col_name: Column name
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        from pyspark.sql import functions as F
        
        stats = {}
        
        # Compute basic statistics
        numeric_stats = df.select(
            F.min(col_name).alias("min"),
            F.max(col_name).alias("max"),
            F.mean(col_name).alias("mean"),
            F.stddev(col_name).alias("std"),
            F.percentile_approx(col_name, [0.25, 0.5, 0.75, 0.9, 0.95, 0.99], 10000).alias("percentiles")
        ).collect()[0]
        
        # Add statistics to result
        stats["min"] = float(numeric_stats["min"]) if numeric_stats["min"] is not None else None
        stats["max"] = float(numeric_stats["max"]) if numeric_stats["max"] is not None else None
        stats["mean"] = float(numeric_stats["mean"]) if numeric_stats["mean"] is not None else None
        stats["std"] = float(numeric_stats["std"]) if numeric_stats["std"] is not None else None
        
        # Add percentiles
        percentiles = numeric_stats["percentiles"]
        stats["percentiles"] = {
            "p25": float(percentiles[0]) if percentiles[0] is not None else None,
            "p50": float(percentiles[1]) if percentiles[1] is not None else None,
            "p75": float(percentiles[2]) if percentiles[2] is not None else None,
            "p90": float(percentiles[3]) if percentiles[3] is not None else None,
            "p95": float(percentiles[4]) if percentiles[4] is not None else None,
            "p99": float(percentiles[5]) if percentiles[5] is not None else None,
        }
        
        return stats
    
    async def _analyze_string_column(
        self, 
        df: Any, 
        col_name: str, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a string column.
        
        Args:
            df: Spark DataFrame
            col_name: Column name
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        from pyspark.sql import functions as F
        
        stats = {}
        
        # Check if categorical (relatively low cardinality)
        row_count = df.count()
        unique_count = df.select(col_name).distinct().count()
        is_categorical = unique_count <= 20 or (unique_count / row_count < 0.05)
        
        stats["is_categorical"] = is_categorical
        
        # Get top values for categorical variables
        if is_categorical or config.categorical_cardinality_analysis:
            top_values = {}
            value_counts = df.groupBy(col_name).count().orderBy(F.desc("count")).limit(10)
            for row in value_counts.collect():
                value = row[col_name]
                count = row["count"]
                if value is not None:
                    top_values[str(value)] = int(count)
            stats["top_values"] = top_values
            
        # Length analysis
        if config.text_length_analysis:
            length_stats = df.select(
                F.min(F.length(F.col(col_name))).alias("min_length"),
                F.max(F.length(F.col(col_name))).alias("max_length"),
                F.mean(F.length(F.col(col_name))).alias("mean_length")
            ).collect()[0]
            
            stats["text_length"] = {
                "min": int(length_stats["min_length"]) if length_stats["min_length"] is not None else None,
                "max": int(length_stats["max_length"]) if length_stats["max_length"] is not None else None,
                "mean": float(length_stats["mean_length"]) if length_stats["mean_length"] is not None else None,
            }
            
        return stats
    
    async def _analyze_boolean_column(self, df: Any, col_name: str) -> Dict[str, Any]:
        """Analyze a boolean column.
        
        Args:
            df: Spark DataFrame
            col_name: Column name
            
        Returns:
            Dictionary of column statistics
        """
        from pyspark.sql import functions as F
        
        stats = {}
        
        # Count True and False values
        bool_counts = df.groupBy(col_name).count().collect()
        
        true_count = 0
        false_count = 0
        
        for row in bool_counts:
            if row[col_name] is True:
                true_count = row["count"]
            elif row[col_name] is False:
                false_count = row["count"]
                
        total = true_count + false_count
        
        stats["true_count"] = int(true_count)
        stats["false_count"] = int(false_count)
        stats["true_percentage"] = float(100 * true_count / total) if total > 0 else 0.0
        stats["false_percentage"] = float(100 * false_count / total) if total > 0 else 0.0
        
        return stats
    
    async def _analyze_datetime_column(
        self, 
        df: Any, 
        col_name: str, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Analyze a datetime column.
        
        Args:
            df: Spark DataFrame
            col_name: Column name
            config: Profiling configuration
            
        Returns:
            Dictionary of column statistics
        """
        from pyspark.sql import functions as F
        
        stats = {}
        
        # Get min/max dates
        date_range = df.select(
            F.min(col_name).alias("min_date"),
            F.max(col_name).alias("max_date")
        ).collect()[0]
        
        min_date = date_range["min_date"]
        max_date = date_range["max_date"]
        
        if min_date is not None and max_date is not None:
            stats["min_date"] = min_date.isoformat()
            stats["max_date"] = max_date.isoformat()
            
            # Calculate range in days
            stats["date_range_days"] = (max_date - min_date).days
            
            # Extract distributions for years and months
            year_counts = df.groupBy(F.year(F.col(col_name)).alias("year")).count().collect()
            month_counts = df.groupBy(F.month(F.col(col_name)).alias("month")).count().collect()
            
            stats["year_distribution"] = {str(row["year"]): int(row["count"]) for row in year_counts if row["year"] is not None}
            stats["month_distribution"] = {str(row["month"]): int(row["count"]) for row in month_counts if row["month"] is not None}
            
        return stats
    
    async def _analyze_missing_values(self, df: Any) -> Dict[str, Union[int, float]]:
        """Analyze missing values in the DataFrame.
        
        Args:
            df: Spark DataFrame
            
        Returns:
            Dictionary with missing value statistics
        """
        from pyspark.sql import functions as F
        
        missing_values = {}
        
        # Count total rows
        total_rows = df.count()
        
        # Count nulls per column
        null_counts = []
        
        for col_name in df.columns:
            null_count = df.filter(F.col(col_name).isNull()).count()
            null_counts.append((col_name, null_count))
            missing_values[col_name] = int(null_count)
            
        # Calculate total and percentage
        total_nulls = sum(count for _, count in null_counts)
        missing_values["total"] = int(total_nulls)
        
        # Percentage of missing values overall
        total_cells = total_rows * len(df.columns)
        missing_values["percentage"] = float(100 * total_nulls / total_cells) if total_cells > 0 else 0.0
        
        return missing_values
    
    async def _calculate_correlations(self, df: Any) -> Dict[str, Any]:
        """Calculate correlations between numeric columns.
        
        Args:
            df: Spark DataFrame
            
        Returns:
            Dictionary with correlation matrix
        """
        try:
            # Use Spark's correlation functionality
            from pyspark.ml.feature import VectorAssembler
            from pyspark.ml.stat import Correlation
            from pyspark.sql.types import DoubleType, IntegerType, LongType, FloatType
            import numpy as np
            
            # Extract numeric columns
            numeric_cols = []
            for field in df.schema.fields:
                if isinstance(field.dataType, (DoubleType, IntegerType, LongType, FloatType)):
                    numeric_cols.append(field.name)
                    
            if len(numeric_cols) < 2:
                return {}
                
            # Assemble features vector
            assembler = VectorAssembler(
                inputCols=numeric_cols,
                outputCol="features",
                handleInvalid="skip"
            )
            
            # Transform data
            assembled_df = assembler.transform(df)
            
            # Calculate correlation matrix
            corr_matrix = Correlation.corr(assembled_df, "features").collect()[0][0]
            
            # Convert to nested dictionary format
            result = {}
            corr_values = corr_matrix.toArray().tolist()
            
            # Create the matrix as a nested dictionary
            for i, col1 in enumerate(numeric_cols):
                result[col1] = {}
                for j, col2 in enumerate(numeric_cols):
                    result[col1][col2] = float(corr_values[i][j])
                    
            # Find highly correlated pairs (|corr| > 0.7)
            high_correlations = []
            
            for i, col1 in enumerate(numeric_cols):
                for j, col2 in enumerate(numeric_cols):
                    if i < j:  # Only check each pair once
                        corr_value = abs(corr_values[i][j])
                        if corr_value > 0.7:
                            high_correlations.append({
                                "column1": col1,
                                "column2": col2,
                                "correlation": float(corr_values[i][j])
                            })
                            
            # Sort by absolute correlation value
            high_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
            
            return {
                "matrix": result,
                "high_correlations": high_correlations
            }
            
        except Exception as e:
            # If correlation calculation fails, return empty dictionary
            return {"error": str(e)}
    
    async def _generate_visualization_data(
        self, 
        df: Any, 
        config: ProfileConfig
    ) -> Dict[str, Any]:
        """Generate data for visualizations.
        
        Args:
            df: Spark DataFrame
            config: Profiling configuration
            
        Returns:
            Dictionary with visualization data
        """
        from pyspark.sql import functions as F
        from pyspark.sql.types import DoubleType, IntegerType, LongType, FloatType
        
        viz_data = {}
        
        # Generate histogram data for numeric columns
        histograms = {}
        
        # Extract numeric columns
        numeric_cols = []
        for field in df.schema.fields:
            if isinstance(field.dataType, (DoubleType, IntegerType, LongType, FloatType)):
                numeric_cols.append(field.name)
                
        # Generate histograms for numeric columns
        for col in numeric_cols:
            try:
                # Get min and max
                min_max = df.select(
                    F.min(col).alias("min"),
                    F.max(col).alias("max")
                ).collect()[0]
                
                min_val = min_max["min"]
                max_val = max_max["max"]
                
                # Skip if min/max are None or equal
                if min_val is None or max_val is None or min_val == max_val:
                    continue
                    
                # Calculate number of bins (capped at 20)
                num_bins = min(20, df.select(col).distinct().count())
                if num_bins < 2:
                    continue
                    
                # Calculate bin width
                bin_width = (max_val - min_val) / num_bins
                
                # Create bins
                bin_edges = [min_val + i * bin_width for i in range(num_bins + 1)]
                bin_centers = [min_val + (i + 0.5) * bin_width for i in range(num_bins)]
                
                # Use Spark to calculate histogram
                hist_data = (
                    df.select(col)
                    .filter(F.col(col).isNotNull())
                    .rdd
                    .flatMap(lambda x: x)
                    .histogram(bin_edges)
                )
                
                # Extract bin counts
                bin_counts = hist_data[1]
                
                # Create histogram data
                histograms[col] = {
                    "counts": [int(c) for c in bin_counts],
                    "bin_edges": [float(e) for e in bin_edges],
                    "bin_centers": [float(c) for c in bin_centers]
                }
                
            except Exception:
                # Skip columns that fail
                continue
                
        viz_data["histograms"] = histograms
        
        return viz_data 