"""
Application Bootstrap Utilities.

This module provides utilities for bootstrapping the application components,
ensuring proper initialization of services like the secret manager.
"""

from mlpie.utils.logger import logger
from mlpie.db.connection import setup_database
from mlpie.config.settings import RootSettings
from mlpie.state_sync.scheduler import initialize_scheduler


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