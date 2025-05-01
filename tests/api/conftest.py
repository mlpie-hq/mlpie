"""
API test fixtures.

This module provides pytest fixtures for API tests.
"""

import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from mlpie.api.main import app as main_app
from mlpie.api.controllers import config


@pytest.fixture
def app():
    """Get a test FastAPI application."""
    return main_app


@pytest.fixture
def client(app):
    """Get a test client for the FastAPI application."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client(app, test_session, mock_db_dependency):
    """Get an asynchronous test client with database dependency overridden."""
    
    # Delayed import to avoid circular import
    from mlpie.db.connection import get_session
    
    # Override the get_session dependency
    app.dependency_overrides[get_session] = mock_db_dependency
    
    # Use explicit ASGITransport instead of the deprecated app shortcut
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    # Clear the dependency override after the test
    app.dependency_overrides.clear() 