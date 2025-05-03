"""
Logging utilities for the MLPie platform.
"""

import logging
import sys

# Set up default logger
logger = logging.getLogger("mlpie")

# Configure root logger if not already configured
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Export the logger
__all__ = ["logger"] 