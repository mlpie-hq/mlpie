"""
Secrets Controller - Provider Information.

This module provides REST endpoints for querying secret provider information.
Actual secret CRUD operations are handled under the /projects/{project_id}/secrets/ path.
"""

from typing import Dict, List, Optional, Any
from uuid import UUID # Added for SecretDefinitionResponseModel
from datetime import datetime # Added for SecretDefinitionResponseModel

from fastapi import APIRouter, HTTPException, status, Depends # Added Depends
from pydantic import BaseModel, Field # Added Field

from mlpie.db.models.project import Project # Added for project existence check
from mlpie.db.connection import get_session, AsyncSession # Added for DB session
from mlpie.secrets import (
    SecretError,
    SecretNotFoundError,
    get_secret_manager,
) # Added SecretError, SecretNotFoundError
from mlpie.secrets.manager import SecretManager # Added SecretManager
from mlpie.config.settings import get_root_settings # To show active provider config

import logging
logger = logging.getLogger(__name__)

# --- Pydantic Models for this controller --- 
class ActiveProviderInfoResponse(BaseModel):
    active_provider_type: Optional[str]
    configuration_summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class AvailableProvidersResponse(BaseModel):
    available_provider_types: List[str]
    error: Optional[str] = None

# --- Pydantic Models for Project-Scoped Secret CRUD --- 
class SecretCreateRequest(BaseModel):
    """Request to define a new secret bundle and its initial values for a project."""
    secret_name: str = Field(
        ...,
        description="User-defined name for the secret bundle (e.g., 'DatabaseCredentials'). Unique within the project.",
    )
    values: Dict[str, str] = Field(..., description="The initial dictionary of key-value secret data.")
    description: Optional[str] = Field(
        None, description="Optional description for the secret bundle."
    )

class SecretDefinitionResponseModel(BaseModel):
    """Response model for a secret definition metadata."""
    id: UUID
    project_name: str
    name: str  # Changed from secret_name to align with SQLAlchemy model attribute
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SecretValuesUpdateRequest(BaseModel):
    """Request model to set/update the key-value pairs for a secret bundle."""
    values: Dict[str, str] = Field(..., description="The dictionary of key-value secret data.")

class SecretValuesResponseModel(BaseModel):
    """Response model for retrieving the key-value pairs of a secret bundle."""
    project_name: str
    secret_name: str
    values: Dict[str, str]

class ProjectSecretOperationResponse(BaseModel):
    """Generic success/failure response for secret operations."""
    success: bool
    message: str

# Create router
router = APIRouter(
    prefix="/secrets", # General prefix for this utility controller
    tags=["Secrets Utilities"], # Renamed tag for clarity
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal Server Error"}
    },
)

@router.get("/providers", response_model=AvailableProvidersResponse)
async def list_available_provider_types():
    """List all registered secret provider plugin types (e.g., 'EncryptedDBProvider')."""
    logger.debug("Endpoint called: /secrets/providers")
    try:
        secret_mgr = get_secret_manager()
        provider_types = await secret_mgr.get_available_provider_types() 
        return AvailableProvidersResponse(available_provider_types=provider_types)
    except Exception as e:
        logger.error(f"Error listing available secret provider types: {e}", exc_info=True)
        # Return a 500 error as this is an unexpected server-side issue
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Could not retrieve available provider types due to an internal error."
        )

@router.get("/active-provider", response_model=ActiveProviderInfoResponse)
async def get_active_provider_config_info():
    """Get information about the currently active global secret provider."""
    logger.debug("Endpoint called: /secrets/active-provider")
    try:
        secret_mgr = get_secret_manager()
        settings = get_root_settings().secrets
        
        active_type = secret_mgr.get_active_provider_type()
        config_summary = {}
        if active_type == "EncryptedDBProvider" and settings.encrypted_db_provider:
            # Example: only indicate if key is set, not the key itself
            config_summary = {"encryption_key_configured": True if settings.encrypted_db_provider.encryption_key else False}
        # Add more cases here if other providers are added and have non-sensitive config to summarize
        
        return ActiveProviderInfoResponse(
            active_provider_type=active_type,
            configuration_summary=config_summary
        )
    except Exception as e:
        logger.error(f"Error retrieving active secret provider info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Could not retrieve active provider information due to an internal error."
        )

# --- Project-Scoped Secret CRUD Endpoints --- 

async def _get_project_or_404(project_name: str, session: AsyncSession) -> Project:
    """Helper to get a project by name or raise HTTPException 404."""
    project = await session.get(Project, project_name)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with name '{project_name}' not found."
        )
    return project

@router.post(
    "/project/{project_name}", 
    response_model=SecretDefinitionResponseModel, 
    status_code=status.HTTP_201_CREATED,
    summary="Create a Secret Bundle with Values for a Project"
)
async def create_project_secret(
    project_name: str,
    secret_data: SecretCreateRequest,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Creates a new secret bundle (definition and initial values) for a specific project."""
    await _get_project_or_404(project_name, session) # Ensure project exists
    try:
        defined_secret = await secret_mgr.create_secret_bundle_with_values(
            project_name=project_name,
            secret_name=secret_data.secret_name,
            values=secret_data.values,
            description=secret_data.description
        )
        return defined_secret
    except SecretError as e:
        if "already defined" in str(e) or "already exists" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        logger.error(f"Error creating secret bundle '{secret_data.secret_name}' for project {project_name}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create secret bundle: {e}")
    except Exception as e:
        logger.error(f"Unexpected error creating secret bundle '{secret_data.secret_name}' for project {project_name}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred while creating the secret bundle.")

@router.get("/project/{project_name}", response_model=List[SecretDefinitionResponseModel], summary="List Secret Bundles for a Project")
async def list_project_secret_bundle_definitions(
    project_name: str,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Lists all secret bundle definitions for a specific project."""
    logger.debug(f"Listing secret bundle definitions for project {project_name}")
    await _get_project_or_404(project_name, session) # Ensure project exists
    try:
        definitions = await secret_mgr.list_secret_bundle_definitions(project_name=project_name)
        return definitions
    except Exception as e:
        logger.error(f"Error listing secret definitions for project {project_name}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not list secret definitions.")

@router.get("/project/{project_name}/bundle/{secret_bundle_name}", response_model=SecretDefinitionResponseModel, summary="Get a Specific Secret Bundle Definition")
async def get_project_secret_bundle_definition(
    project_name: str,
    secret_bundle_name: str,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Gets a specific secret bundle definition for a project."""
    await _get_project_or_404(project_name, session) # Ensure project exists
    definition = await secret_mgr.get_secret_bundle_definition(project_name=project_name, secret_name=secret_bundle_name)
    if not definition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret bundle '{secret_bundle_name}' not defined for project '{project_name}'."
        )
    return definition

@router.put("/project/{project_name}/bundle/{secret_bundle_name}/values", response_model=ProjectSecretOperationResponse, summary="Set/Update Values for a Secret Bundle")
async def set_project_secret_bundle_values(
    project_name: str,
    secret_bundle_name: str,
    values_data: SecretValuesUpdateRequest,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Sets or updates the key-value pairs for a specific secret bundle in a project."""
    await _get_project_or_404(project_name, session) # Ensure project exists
    try:
        success = await secret_mgr.set_secret_values(
            project_name=project_name, 
            secret_name=secret_bundle_name, 
            values=values_data.values
        )
        if success:
            return ProjectSecretOperationResponse(success=True, message=f"Values for secret bundle '{secret_bundle_name}' in project '{project_name}' stored successfully.")
        else:
            # This case might indicate a provider-level issue not raising an exception
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to store values for secret bundle '{secret_bundle_name}'. Provider reported failure.")
    except SecretNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except SecretError as e:
        logger.error(f"Error setting values for secret '{secret_bundle_name}' in project {project_name}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not set secret values: {e}")

@router.get("/project/{project_name}/bundle/{secret_bundle_name}/values", response_model=SecretValuesResponseModel, summary="Get Values for a Secret Bundle")
async def get_project_secret_bundle_values(
    project_name: str,
    secret_bundle_name: str,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Retrieves the key-value pairs for a specific secret bundle in a project."""
    await _get_project_or_404(project_name, session) # Ensure project exists
    try:
        values = await secret_mgr.get_secret_values(project_name=project_name, secret_name=secret_bundle_name)
        if values is None:
            # This means the bundle is defined, but no values are set, or provider returned None without error
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Values for secret bundle '{secret_bundle_name}' not found in project '{project_name}'. It might be defined but have no values set.")
        return SecretValuesResponseModel(project_name=project_name, secret_name=secret_bundle_name, values=values)
    except SecretNotFoundError: # Should ideally be caught if bundle definition itself is missing by get_secret_values or its prerequisites
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Secret bundle '{secret_bundle_name}' not defined or values not found for project '{project_name}'.")
    except SecretError as e:
        logger.error(f"Error getting values for secret '{secret_bundle_name}' in project {project_name}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not get secret values: {e}")

@router.delete("/project/{project_name}/bundle/{secret_bundle_name}", response_model=ProjectSecretOperationResponse, summary="Delete a Secret Bundle")
async def delete_project_secret_bundle(
    project_name: str,
    secret_bundle_name: str,
    session: AsyncSession = Depends(get_session),
    secret_mgr: SecretManager = Depends(get_secret_manager)
):
    """Deletes an entire secret bundle (both its definition and its stored values) for a project."""
    await _get_project_or_404(project_name, session) # Ensure project exists
    try:
        success = await secret_mgr.delete_entire_secret(project_name=project_name, secret_name=secret_bundle_name)
        if success:
            return ProjectSecretOperationResponse(success=True, message=f"Secret bundle '{secret_bundle_name}' and its values deleted successfully from project '{project_name}'.")
        else:
            # This case could mean the secret definition was not found for deletion in the DB by secret_mgr
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Secret bundle '{secret_bundle_name}' not found for deletion in project '{project_name}'.")
    except SecretError as e:
        logger.error(f"Error deleting secret bundle '{secret_bundle_name}' for project {project_name}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not delete secret bundle: {e}")

# All project-scoped secret CRUD operations previously in this file (list_secrets, get_secret, create_secret, delete_secret)
# are now intended to be implemented in the projects controller (e.g., projects.py) 
# under a path like /api/v1/projects/{project_id}/secrets/ 