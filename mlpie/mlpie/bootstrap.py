"""
Application Bootstrap Utilities.

This module provides utilities for bootstrapping the application components,
ensuring proper initialization of services like the secret manager.
"""

from mlpie.utils.logger import logger
from mlpie.db.connection import setup_database
from mlpie.config.settings import RootSettings
from mlpie.state_sync.scheduler import initialize_scheduler
from mlpie.plugins.bootstrap import initialize_plugins
from mlpie.secrets.setup import setup_secret_manager
import logging


async def bootstrap_application(settings: RootSettings):
    """Initialize all application components.

    This function should be called during application startup to ensure
    all required components are properly initialized, including:
    - Database connection
    - Scheduler service
    - Plugins
    - Secret manager
    - Config manager
    - Other services

    Returns:
        bool: True if bootstrap was successful, False otherwise
    """
    success = True
    
    # Start the main bootstrap section
    logger.section("Application Bootstrap")
    
    try:
        # Initialize database
        logger.section("Database Initialization")
        logger.info("Initializing database connection...")
        setup_database(settings)
        logger.end_section()

        # Initialize scheduler
        logger.section("Scheduler Initialization")
        logger.info("Initializing background scheduler...")
        await initialize_scheduler(settings)
        logger.end_section()

        # Initialize plugins (discover and register)
        logger.section("Plugins Initialization")
        try:
            await initialize_plugins()
            logger.end_section(success=True)
        except Exception as e:
            logger.error(f"Failed to initialize plugins: {str(e)}", exc_info=True)
            logger.end_section(success=False)
            success = False
            # If plugin initialization fails, we might not want to proceed
            # depending on how critical plugins are for basic operation.
            # For now, we'll mark as failed and continue to see if secret manager can init.

        # THEN initialize secret manager (after ALL plugins are discovered and registered)
        # This is critical because the secret manager might depend on a plugin provider.
        if success: # Only attempt if previous steps (like plugin init) were okay
            logger.section("Secret Manager Initialization")
            try:
                await setup_secret_manager()
                logger.end_section(success=True)
            except Exception as e:
                logger.error(f"Failed to initialize secret manager: {str(e)}", exc_info=True)
                logger.end_section(success=False)
                success = False
        else:
            logger.warning("Skipping secret manager initialization due to earlier bootstrap failures.")

        # Add other initialization steps here as needed

        # End the main bootstrap section
        logger.end_section(success=success)

        return success

    except Exception as e:
        logger.error(f"Critical error during application bootstrap: {str(e)}", exc_info=True)
        logger.end_section(success=False)
        # If scheduler initialization fails, it logs the error internally
        # We still return False here as bootstrap failed
        return False
