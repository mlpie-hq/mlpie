from contextlib import asynccontextmanager

from fastapi import FastAPI
from mlpie.db.connection import setup_database
from mlpie.api.controllers import config


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for FastAPI application."""
    # Initialize database and other resources on startup
    setup_database()
    yield
    # Clean up resources if needed


app = FastAPI(
    title="MLPie Platform API",
    description="API for the MLPie MLOps Platform",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["Health"], summary="Check API Health")
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}


# Register routers
app.include_router(config.router)

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