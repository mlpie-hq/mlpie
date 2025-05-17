"""
Scheduler Service for the MLPie Platform.

Handles background tasks like Git repository polling.
"""

import logging
logger = logging.getLogger(__name__)

# Initialize module-level variables
_scheduler = None
APSCHEDULER_AVAILABLE = False

# Define placeholders first so imports don't fail
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

# Try to import APScheduler with proper error handling
try:
    # Import APScheduler components
    from apscheduler.schedulers.asyncio import AsyncIOScheduler as _RealAsyncIOScheduler
    # Replace our placeholder with the real one
    AsyncIOScheduler = _RealAsyncIOScheduler
    APSCHEDULER_AVAILABLE = True
    logger.info("APScheduler successfully imported")
except ImportError:
    logger.warning("APScheduler not available. Scheduler will be disabled.")

# Import other required modules
from mlpie.config import RootSettings
from mlpie.db.connection import get_session
from mlpie.db.models.repository import Repository, EntityType
from sqlalchemy import text

# Define a placeholder polling function in case import fails
async def dummy_poll_git_repository(*args, **kwargs):
    """Placeholder function when git_poller is not available."""
    logger.warning("Git polling skipped - module not available.")

# Try to import the actual polling functions
try:
    from .git_poller import poll_git_repository, poll_single_repository
except ImportError:
    logger.warning("Git poller module not available. Using dummy implementation.")
    poll_git_repository = dummy_poll_git_repository
    poll_single_repository = dummy_poll_git_repository

class SchedulerJobRegistry:
    """Registry to keep track of scheduled jobs."""
    
    def __init__(self):
        self.repository_jobs = {}  # Map of repository ID to job ID
        
    def register_repository_job(self, repository_id, job_id):
        """Register a repository polling job."""
        self.repository_jobs[str(repository_id)] = job_id
        
    def get_repository_job_id(self, repository_id):
        """Get job ID for a repository."""
        return self.repository_jobs.get(str(repository_id))
        
    def remove_repository_job(self, repository_id):
        """Remove a repository job from registry."""
        if str(repository_id) in self.repository_jobs:
            del self.repository_jobs[str(repository_id)]

# Create global registry
_job_registry = SchedulerJobRegistry()

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
        
        # Add default master repo job
        master_interval = getattr(settings, 'REPO_SCAN_INTERVAL_SECONDS', 60)
        logger.info(f"Adding master Git poll job with interval: {master_interval} seconds")
        
        _scheduler.add_job(
            poll_git_repository,
            'interval',
            seconds=master_interval,
            id='master_git_poll_job',
            replace_existing=True
        )
        logger.info("Master Git poll job added successfully.")
        
        # Add jobs for all repositories in database
        await schedule_repository_jobs()
        
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


async def schedule_repository_jobs():
    """Schedule polling jobs for all repositories in the database."""
    if not _scheduler:
        logger.warning("Scheduler not initialized. Cannot schedule repository jobs.")
        return
        
    # Get all repositories
    async for session in get_session():
        try:
            # Use SQLAlchemy's text() function for raw SQL
            result = await session.execute(text("SELECT * FROM repositories"))
            repositories = result.mappings().all()
            
            for repo_data in repositories:
                # Skip master repository (handled separately)
                if repo_data['entity_type'] == EntityType.MASTER.value:
                    continue
                    
                # Convert to Repository object
                repo = Repository()
                for key, value in repo_data.items():
                    setattr(repo, key, value)
                    
                # Schedule job for this repository
                await schedule_repository_job(repo)
                
        except Exception as e:
            logger.exception("Error scheduling repository jobs", exc_info=e)


async def schedule_repository_job(repository: Repository):
    """
    Schedule a polling job for a specific repository.
    
    Args:
        repository: Repository object to schedule
    """
    if not _scheduler:
        logger.warning("Scheduler not initialized. Cannot schedule repository job.")
        return
        
    # Check if job already exists
    job_id = _job_registry.get_repository_job_id(repository.id)
    if job_id:
        # Remove existing job
        _scheduler.remove_job(job_id)
        _job_registry.remove_repository_job(repository.id)
        
    # Determine polling interval
    interval = repository.scan_interval_seconds or 300  # Default 5 minutes
    
    # Create job ID
    job_id = f"repo_poll_{repository.id}"
    
    # Add job
    logger.info(f"Scheduling repository poll job for {repository.name or repository.url} with interval {interval} seconds")
    _scheduler.add_job(
        poll_single_repository,
        'interval',
        seconds=interval,
        id=job_id,
        replace_existing=True,
        args=[repository.id]
    )
    
    # Register job
    _job_registry.register_repository_job(repository.id, job_id)
    
    
async def remove_repository_job(repository_id):
    """
    Remove a polling job for a repository.
    
    Args:
        repository_id: ID of the repository
    """
    if not _scheduler:
        return
        
    job_id = _job_registry.get_repository_job_id(repository_id)
    if job_id:
        try:
            _scheduler.remove_job(job_id)
            _job_registry.remove_repository_job(repository_id)
            logger.info(f"Removed polling job for repository {repository_id}")
        except Exception as e:
            logger.exception(f"Error removing polling job for repository {repository_id}", exc_info=e) 