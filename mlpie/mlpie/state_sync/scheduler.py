"""
Scheduler Service for the MLPie Platform.

Handles background tasks like Git repository polling.
"""

import logging
logger = logging.getLogger(__name__)

# Initialize module-level variables
_scheduler = None
APSCHEDULER_AVAILABLE = False

try:
    # Try to import APScheduler
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    APSCHEDULER_AVAILABLE = True
except ImportError:
    logger.warning("APScheduler not available. Scheduler will be disabled.")
    # Create a placeholder class to avoid TypeErrors
    class AsyncIOScheduler:
        """Placeholder for AsyncIOScheduler when APScheduler is not available."""
        def __init__(self, **kwargs):
            self.running = False
        def add_job(self, *args, **kwargs):
            pass
        def start(self):
            pass
        def shutdown(self):
            pass

# Import other required modules
from mlpie.config import RootSettings

# Define a placeholder polling function in case import fails
async def dummy_poll_git_repository():
    """Placeholder function when git_poller is not available."""
    logger.warning("Git polling skipped - module not available.")

# Try to import the actual polling function
try:
    from .git_poller import poll_git_repository
except ImportError:
    logger.warning("Git poller module not available. Using dummy implementation.")
    poll_git_repository = dummy_poll_git_repository


async def initialize_scheduler(settings: RootSettings):
    """Initialize and start the background scheduler."""
    global _scheduler
    
    if not APSCHEDULER_AVAILABLE:
        logger.warning("Scheduler initialization skipped - APScheduler not available.")
        return
        
    if _scheduler is not None and getattr(_scheduler, 'running', False):
        logger.info("Scheduler already running.")
        return
        
    logger.info("Initializing background scheduler...")
    
    try:
        # Create simple scheduler with default settings
        _scheduler = AsyncIOScheduler()
        
        # Add jobs
        interval = getattr(settings, 'REPO_SCAN_INTERVAL_SECONDS', 30)
        logger.info(f"Adding Git poll job with interval: {interval} seconds")
        
        _scheduler.add_job(
            poll_git_repository,
            'interval',
            seconds=interval,
            id='git_poll_job',
            replace_existing=True
        )
        logger.info("Git poll job added successfully.")
        
        # Start the scheduler
        _scheduler.start()
        logger.info("Scheduler started successfully.")
    except Exception as e:
        logger.exception("Failed to initialize scheduler", exc_info=e)
        _scheduler = None


async def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    global _scheduler
    
    if not _scheduler:
        return
        
    if getattr(_scheduler, 'running', False):
        logger.info("Shutting down scheduler...")
        try:
            _scheduler.shutdown()
            logger.info("Scheduler shut down successfully.")
        except Exception as e:
            logger.exception("Error shutting down scheduler", exc_info=e)
    
    _scheduler = None


def get_scheduler():
    """Get the scheduler instance."""
    return _scheduler 