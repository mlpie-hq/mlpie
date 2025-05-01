"""
Database Bootstrap Utilities.

This module provides utilities for bootstrapping the database connection
without relying on the configuration manager, to avoid circular imports.
"""

import logging
import os
from functools import lru_cache
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

logger = logging.getLogger(__name__)


def get_db_config_from_env() -> Dict[str, Any]:
    """Get database configuration from environment variables.
    
    Environment variables:
        MLPIE_DB_URL: Database connection URL
        MLPIE_DB_ECHO: Whether to echo SQL statements (default: False)
    
    Returns:
        Dictionary with database configuration
    """
    db_url = os.environ.get(
        "MLPIE_DB_URL", 
        "sqlite+aiosqlite:///data/mlpie.db"
    )
    
    # Special case for in-memory SQLite database
    if db_url == "sqlite+aiosqlite:///:memory:":
        # Don't modify in-memory path
        pass
    # Handle relative SQLite paths only, not absolute paths
    elif db_url.startswith("sqlite") and "///" in db_url:
        # Extract the path part
        prefix, path = db_url.split("///", 1)
        
        # Check if it's a relative path (not starting with / or ~)
        if not path.startswith("/") and not path.startswith("~"):
            # Get the project root directory
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_url = f"{prefix}///{os.path.join(root_dir, path)}"
    
    db_echo = os.environ.get("MLPIE_DB_ECHO", "False").lower() in ("true", "1", "yes")
    
    return {
        "db_url": db_url,
        "db_echo": db_echo,
    }


@lru_cache()
def create_db_engine() -> AsyncEngine:
    """Create the database engine.
    
    This function is separate from the main database connection module
    to avoid circular imports with the configuration manager.
    
    Returns:
        AsyncEngine: SQLAlchemy async engine instance
    """
    config = get_db_config_from_env()
    
    engine = create_async_engine(
        config["db_url"],
        echo=config["db_echo"],
        pool_pre_ping=True,  # Check connection before using it
    )
    
    logger.info(f"Database engine initialized with URL: {config['db_url']}")
    
    return engine 