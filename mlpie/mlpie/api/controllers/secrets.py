"""
Secrets Management API Controller.

This module provides REST endpoints for managing secrets.
"""

from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from mlpie.secrets import SecretError, ProviderNotFoundError, SecretNotFoundError
from mlpie.secrets.setup import get_secret_manager


# Define API models
class SecretListResponse(BaseModel):
    """Response model for listing secrets."""
    secrets: List[str]


class SecretModel(BaseModel):
    """Model for a secret."""
    key: str
    value: str
    namespace: Optional[str] = "default"


class SecretCreateModel(BaseModel):
    """Model for creating a secret."""
    key: str
    value: str
    namespace: Optional[str] = "default"
    provider: Optional[str] = None


class SecretResponse(BaseModel):
    """Response model for secret operations."""
    success: bool
    message: str


# Create router
router = APIRouter(
    prefix="/api/secrets",
    tags=["Secrets"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=Dict[str, List[str]])
async def list_secrets(namespace: str = "default", provider: Optional[str] = None):
    """List all secrets in the specified namespace."""
    try:
        secret_mgr = get_secret_manager()
        secrets = await secret_mgr.list_secrets(prefix=namespace, provider_name=provider)
        return {"secrets": secrets}
    except ProviderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider not found: {str(e)}"
        )
    except SecretError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing secrets: {str(e)}"
        )


@router.get("/{key}", response_model=Dict[str, Optional[str]])
async def get_secret(key: str, namespace: str = "default", provider: Optional[str] = None):
    """Get a secret by key."""
    try:
        secret_mgr = get_secret_manager()
        value = await secret_mgr.get_secret(key, provider_name=provider)
        
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Secret '{key}' not found"
            )
            
        return {"value": value}
    except ProviderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Provider not found: {str(e)}"
        )
    except SecretError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving secret: {str(e)}"
        )


@router.post("/", response_model=SecretResponse)
async def create_secret(secret: SecretCreateModel):
    """Create or update a secret."""
    try:
        secret_mgr = get_secret_manager()
        success = await secret_mgr.set_secret(
            secret.key, 
            secret.value, 
            provider_name=secret.provider
        )
        
        if success:
            return {
                "success": True,
                "message": f"Secret '{secret.key}' stored successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store secret"
            )
    except ProviderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider not found: {str(e)}"
        )
    except SecretError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error storing secret: {str(e)}"
        )


@router.delete("/{key}", response_model=SecretResponse)
async def delete_secret(key: str, namespace: str = "default", provider: Optional[str] = None):
    """Delete a secret."""
    try:
        secret_mgr = get_secret_manager()
        success = await secret_mgr.delete_secret(key, provider_name=provider)
        
        if success:
            return {
                "success": True,
                "message": f"Secret '{key}' deleted successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Secret '{key}' not found"
            )
    except ProviderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider not found: {str(e)}"
        )
    except SecretError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting secret: {str(e)}"
        )


@router.get("/providers/list", response_model=Dict[str, List[str]])
async def list_providers():
    """List all available secret providers."""
    try:
        # Try to get the secret manager
        secret_mgr = get_secret_manager()
        providers = await secret_mgr.get_available_providers()
        return {"providers": providers}
    except Exception as e:
        # Log the error but return a default list of available providers
        # This allows the UI to still function even if the secret manager is not initialized
        import logging
        logging.error(f"Error listing providers, returning defaults: {str(e)}")
        
        # Return the default providers that we know are available
        # This matches the providers we register in setup_secret_manager
        return {"providers": ["file", "env", "db"]} 