from contextlib import asynccontextmanager
import logging
import sys # Add sys for exiting

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError # Import ValidationError

from mlpie.api.controllers import config, secrets
from mlpie.bootstrap import bootstrap_application
from mlpie.config.manager import get_config_manager
from mlpie.state_sync.scheduler import shutdown_scheduler # Import scheduler shutdown

# Set up logger
logger = logging.getLogger(__name__)

# Load settings and handle potential validation errors gracefully
try:
    settings = get_config_manager().get_root_settings()
except ValidationError as e:
    logger.critical(
        f"Failed to load application settings due to validation errors:\n{e}\n"
        f"Please check your environment variables or configuration files."
    )
    sys.exit(1) # Exit if settings are invalid

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for FastAPI application."""
    # --- Startup --- 
    logger.info("Application starting up...")
    # Initialize all application components on startup
    bootstrap_success = await bootstrap_application(settings)
    if not bootstrap_success:
        # Log error but continue - individual components will handle their errors
        logger.error("Application bootstrap had errors - some features may not work correctly")
        # Consider if we should prevent startup entirely if bootstrap fails critically
    
    yield # Application is running
    
    # --- Shutdown --- 
    logger.info("Application shutting down...")
    # Clean up resources
    await shutdown_scheduler() # Shut down the scheduler
    # Add other cleanup steps here (e.g., close db connections if not handled by lifespan)
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="MLPie Platform API",
    description="API for the MLPie MLOps Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS using settings
origins = settings.api.CORS_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.get("/health", tags=["Health"], summary="Check API Health")
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}


# Register routers
app.include_router(config.router)
app.include_router(secrets.router)

# Placeholder for mounting routers
# from .routers import projects, models, ...
# app.include_router(projects.router)
# app.include_router(models.router)
# ...

# Add other middleware, exception handlers, etc. here if needed

# Example of a simple root endpoint
@app.get("/", tags=["Root"], include_in_schema=False)
async def read_root():
    return {"message": "Welcome to the MLPie API"} 