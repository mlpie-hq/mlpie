"""
Application Bootstrap Utilities.

This module provides utilities for bootstrapping the application components,
ensuring proper initialization of services like the secret manager.
"""

from mlpie.utils.logger import logger
from mlpie.db.connection import setup_database
from mlpie.config.settings import RootSettings
from mlpie.state_sync.scheduler import initialize_scheduler
from mlpie.plugins import discover_plugins_from_entry_points, discover_module_providers


async def bootstrap_application(settings: RootSettings):
    """Initialize all application components.
    
    This function should be called during application startup to ensure
    all required components are properly initialized, including:
    - Database connection
    - Scheduler service
    - Secret manager
    - Config manager
    - Other services
    
    Returns:
        bool: True if bootstrap was successful, False otherwise
    """
    success = True
    try:
        # Initialize database first
        logger.info("Initializing database connection...")
        setup_database(settings)
        
        # Initialize scheduler
        logger.info("Initializing background scheduler...")
        await initialize_scheduler(settings)
        
        # Discover and register plugins
        logger.info("Discovering plugins...")
        
        # First, try to discover external plugins from entry points
        external_plugins = discover_plugins_from_entry_points()
        logger.info(f"Discovered {len(external_plugins)} external plugins")
        
        # Next, discover built-in plugins from modules
        built_in_plugins = discover_module_providers([
            "mlpie.profilers"  # Include profiler plugins
        ])
        logger.info(f"Discovered {len(built_in_plugins)} built-in plugins")
        
        # Add other initialization steps here as needed
        
        if success:
            logger.info("Application bootstrap completed successfully")
        else:
            logger.error("Application bootstrap failed")
        
        return success
        
    except Exception as e:
        logger.error(f"Error during application bootstrap: {str(e)}")
        # If scheduler initialization fails, it logs the error internally
        # We still return False here as bootstrap failed
        return False 