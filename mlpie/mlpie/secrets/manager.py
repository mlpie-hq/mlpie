"""
Secret Manager for the MLPie platform.

This manager orchestrates secret operations. It interacts with:
1. The main database for SecretDefinition metadata (what secret bundles are defined).
2. A single, globally configured SecretProvider plugin for storing/retrieving actual secret values.
"""

import logging
from typing import Any, Dict, List, Optional, Type, cast

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, NoResultFound

from mlpie.plugins import PluginType, plugin_registry
from mlpie.secrets.providers.base import SecretProviderPlugin
from mlpie.secrets.exceptions import SecretError, ProviderNotFoundError, SecretNotFoundError
from mlpie.config.settings import SecretsSettings # For type hinting config passed to initialize
from mlpie.db.connection import get_session_factory # Corrected import
from mlpie.db.models import Project, SecretDefinition # For DB operations

logger = logging.getLogger(__name__)

class SecretManager:
    """
    Manages secret definitions (metadata) and delegates value storage/retrieval
    to a single, globally configured secret provider plugin.
    """
    
    def __init__(self):
        self._initialized: bool = False
        self.active_provider: Optional[SecretProviderPlugin] = None
        self.active_provider_type: Optional[str] = None
        self._session_factory = None # To store the session factory

    async def initialize(self, config: SecretsSettings) -> bool:
        """
        Initialize the SecretManager with the globally configured secret provider.
        
        Args:
            config: The SecretsSettings section from the application's root configuration.
                
        Returns:
            True if initialization was successful, False otherwise.
        """
        if self._initialized:
            logger.info("SecretManager already initialized.")
            return True
            
        self.active_provider_type = config.PROVIDER_TYPE
        logger.info(f"Attempting to initialize SecretManager with provider: {self.active_provider_type}")

        provider_specific_config = {}
        if self.active_provider_type == "EncryptedDBProvider":
            if config.encrypted_db_provider:
                provider_specific_config = config.encrypted_db_provider.model_dump()
            else:
                 # Should not happen if settings has default_factory, but defensive
                logger.warning("EncryptedDBProvider config section is missing in SecretsSettings.")
        else:
            logger.warning(f"No specific configuration model logic in SecretManager for provider type '{self.active_provider_type}'. Using empty config.")

        try:
            provider_instance = await plugin_registry.get_plugin(
                plugin_type=PluginType.SECRET_PROVIDER,
                plugin_name=self.active_provider_type,
                config=provider_specific_config
            )
            self.active_provider = cast(SecretProviderPlugin, provider_instance)
            
            if not self.active_provider or not self.active_provider.initialized:
                logger.error(f"Failed to get or initialize active secret provider: {self.active_provider_type}")
                self._initialized = False
                return False
            
            # Get session factory after provider is initialized (in case provider needs DB too)
            try:
                self._session_factory = get_session_factory()
                logger.info("SecretManager obtained session factory.")
            except Exception as e:
                logger.error(f"SecretManager failed to obtain session factory: {e}", exc_info=True)
                self._initialized = False 
                return False
            
            self._initialized = True
            logger.info(f"SecretManager initialized successfully with active provider: {self.active_provider_type}")
            return True
            
        except ProviderNotFoundError:
            logger.error(f"Configured secret provider plugin '{self.active_provider_type}' not found in registry.")
            self._initialized = False
            return False
        except Exception as e:
            logger.error(f"Error initializing SecretManager with provider '{self.active_provider_type}': {e}", exc_info=True)
            self._initialized = False
            return False
    
    def _ensure_initialized(self) -> None:
        if not self._initialized or not self.active_provider or not self._session_factory:
            raise SecretError("SecretManager is not properly initialized (provider or session factory missing).")

    # --- SecretDefinition Metadata Operations (interacting with main DB) ---

    async def define_secret_bundle(
        self, 
        project_name: str,
        secret_name: str, 
        description: Optional[str] = None
    ) -> SecretDefinition:
        self._ensure_initialized()
        try:
            async with self._session_factory() as session:
                async with session.begin():
                    project_check_stmt = select(Project.name).where(Project.name == project_name) # Select name for check, as Project.id does not exist
                    project_exists_result = await session.execute(project_check_stmt)
                    if not project_exists_result.scalar_one_or_none():
                        raise SecretNotFoundError(f"Project with name '{project_name}' not found.")

                    new_definition = SecretDefinition(
                        project_name=project_name,
                        name=secret_name,
                        description=description
                    )
                    session.add(new_definition)
                    await session.flush() # Use flush to get potential IntegrityError before commit
                    await session.refresh(new_definition) # Refresh after implicit commit by session.begin()
                    logger.info(f"Defined secret bundle '{secret_name}' for project '{project_name}'.")
                    return new_definition
        except IntegrityError:
            logger.warning(f"Attempt to define secret bundle '{secret_name}' for project '{project_name}' failed due to integrity constraint (e.g., already exists).")
            raise SecretError(f"Secret bundle '{secret_name}' already defined for this project or other integrity issue.")
        except SecretNotFoundError: 
            raise
        except Exception as e:
            logger.error(f"Error defining secret bundle '{secret_name}' for project '{project_name}': {e}", exc_info=True)
            raise SecretError(f"Could not define secret bundle: {e}")

    async def get_secret_bundle_definition(
        self, 
        project_name: str,
        secret_name: str
    ) -> Optional[SecretDefinition]:
        self._ensure_initialized()
        async with self._session_factory() as session:
            async with session.begin(): 
                stmt = select(SecretDefinition).where(
                    SecretDefinition.project_name == project_name,
                    SecretDefinition.name == secret_name
                )
                result = await session.execute(stmt)
                return result.scalar_one_or_none()

    async def list_secret_bundle_definitions(self, project_name: str) -> List[SecretDefinition]:
        self._ensure_initialized()
        async with self._session_factory() as session:
            async with session.begin():
                stmt = select(SecretDefinition).where(SecretDefinition.project_name == project_name).order_by(SecretDefinition.name)
                result = await session.execute(stmt)
                return list(result.scalars().all())

    async def delete_secret_bundle_definition(self, project_name: str, secret_name: str) -> bool:
        """Deletes only the metadata. Values must be deleted separately if desired."""
        self._ensure_initialized()
        deleted_id = None
        async with self._session_factory() as session:
            async with session.begin():
                stmt = delete(SecretDefinition).where(
                    SecretDefinition.project_name == project_name,
                    SecretDefinition.name == secret_name
                ).returning(SecretDefinition.id)
                result = await session.execute(stmt)
                deleted_id = result.scalar_one_or_none()
            
        if deleted_id:
            logger.info(f"Deleted secret bundle definition '{secret_name}' for project '{project_name}'.")
            return True
        logger.info(f"Secret bundle definition '{secret_name}' not found for project '{project_name}'. No action taken.")
        return False

    # --- Secret Value Operations (delegating to active_provider) ---

    async def set_secret_values(
        self, 
        project_name: str, 
        secret_name: str, 
        values: Dict[str, str]
    ) -> bool:
        self._ensure_initialized()
        definition = await self.get_secret_bundle_definition(project_name, secret_name)
        if not definition or not definition.id:
            raise SecretNotFoundError(f"Secret bundle definition '{secret_name}' not found for project '{project_name}'. Define it first.")
        
        return await self.active_provider.store_bundle(
            secret_definition_id_str=str(definition.id),
            secret_name_for_log=secret_name,
            data=values
        )

    async def get_secret_values(self, project_name: str, secret_name: str) -> Optional[Dict[str, str]]:
        self._ensure_initialized()
        definition = await self.get_secret_bundle_definition(project_name, secret_name)
        if not definition or not definition.id:
            logger.info(f"Secret bundle definition '{secret_name}' not found for project '{project_name}'. Cannot get values.")
            return None 
        return await self.active_provider.retrieve_bundle(
            secret_definition_id_str=str(definition.id),
            secret_name_for_log=secret_name
        )

    async def delete_secret_values(self, project_name: str, secret_name: str) -> bool:
        self._ensure_initialized()
        definition = await self.get_secret_bundle_definition(project_name, secret_name)
        if not definition or not definition.id:
            logger.info(f"Secret bundle definition '{secret_name}' not found for project '{project_name}'. No values to delete.")
            return True # Nothing to delete for the provider
        return await self.active_provider.delete_bundle(
            secret_definition_id_str=str(definition.id),
            secret_name_for_log=secret_name
        )

    async def delete_entire_secret(self, project_name: str, secret_name: str) -> bool:
        self._ensure_initialized()
        logger.info(f"Attempting to delete entire secret '{secret_name}' for project '{project_name}'.")
        
        definition = await self.get_secret_bundle_definition(project_name, secret_name)
        values_deleted_successfully = True # Assume success if no definition to avoid provider call with no ID

        if definition and definition.id:
            values_deleted_successfully = await self.active_provider.delete_bundle(
                secret_definition_id_str=str(definition.id),
                secret_name_for_log=secret_name
            )
            if not values_deleted_successfully:
                logger.error(f"Provider reported an issue deleting values for secret_definition_id '{definition.id}' (name '{secret_name}', project '{project_name}').")
        else:
            logger.info(f"Secret bundle definition '{secret_name}' not found for project '{project_name}'. No values to delete via provider.")

        definition_deleted_successfully = await self.delete_secret_bundle_definition(project_name, secret_name)
        
        if definition_deleted_successfully:
            logger.info(f"Successfully deleted secret definition for '{secret_name}' in project '{project_name}'. Value deletion status: {values_deleted_successfully}")
        else:
             logger.info(f"Secret definition for '{secret_name}' in project '{project_name}' was not found or not deleted. Value deletion status: {values_deleted_successfully}")
        return definition_deleted_successfully

    async def get_available_provider_types(self) -> List[str]:
        """Gets a list of registered secret provider plugin types."""
        self._ensure_initialized() # or not, if this is purely from registry
        try:
            provider_classes = plugin_registry.get_plugin_classes(PluginType.SECRET_PROVIDER)
            return list(provider_classes.keys())
        except Exception as e:
            logger.error(f"Error getting available secret provider types: {e}")
            return [] # Fallback
            
    def get_active_provider_type(self) -> Optional[str]:
        self._ensure_initialized()
        return self.active_provider_type
    
    async def shutdown(self) -> None:
        if self.active_provider and hasattr(self.active_provider, 'shutdown'):
            logger.info(f"Shutting down active secret provider: {self.active_provider_type}")
            await self.active_provider.shutdown()
        self._initialized = False
        self.active_provider = None
        self.active_provider_type = None
        self._session_factory = None # Clear session factory
        logger.info("SecretManager shut down.")

    async def create_secret_bundle_with_values(
        self,
        project_name: str,
        secret_name: str,
        values: Dict[str, str],
        description: Optional[str] = None
    ) -> SecretDefinition:
        """ 
        Creates a secret bundle definition and stores its initial values.
        If storing values fails after definition creation, attempts to roll back the definition.
        """
        self._ensure_initialized()

        definition: Optional[SecretDefinition] = None
        try:
            # 1. Define the secret bundle (metadata)
            # This existing method handles DB session, project check, and IntegrityError for duplicates.
            definition = await self.define_secret_bundle(
                project_name=project_name,
                secret_name=secret_name,
                description=description
            )
        except SecretError as e: # Catch errors from define_secret_bundle (e.g. already exists, DB error)
            logger.error(f"Failed to define secret bundle '{secret_name}' for project '{project_name}' during initial step of create_secret_bundle_with_values: {e}")
            raise # Re-raise the original, more specific error
        except Exception as e: # Catch any other unexpected error during definition
            logger.error(f"Unexpected error defining secret bundle '{secret_name}' for project '{project_name}': {e}", exc_info=True)
            raise SecretError(f"Unexpected error defining secret bundle '{secret_name}': {e}")

        # Ensure definition was created and has an ID
        if not definition or not definition.id:
            # This case should ideally not be reached if define_secret_bundle works as expected (raises on failure)
            logger.error(f"Secret definition for '{secret_name}' in project '{project_name}' was not properly created or lacks an ID before value storage.")
            raise SecretError(f"Failed to obtain a valid secret definition for '{secret_name}'.")

        # 2. Store the actual secret values using the provider
        try:
            success = await self.active_provider.store_bundle(
                secret_definition_id_str=str(definition.id),
                secret_name_for_log=secret_name,
                data=values
            )
            if not success:
                logger.error(f"Provider failed to store values for secret '{secret_name}' (definition ID: {definition.id}). Attempting to delete definition.")
                try:
                    await self.delete_secret_bundle_definition(project_name, secret_name)
                    logger.info(f"Successfully rolled back (deleted) definition for '{secret_name}' after value storage failure.")
                except Exception as del_e:
                    logger.error(f"Failed to roll back (delete) definition for '{secret_name}' after value storage failure: {del_e}. Manual cleanup may be required.")
                raise SecretError(f"Failed to store values for secret bundle '{secret_name}'. Provider reported failure. Definition rollback attempted.")
            
            logger.info(f"Successfully created secret bundle '{secret_name}' and stored its values for project '{project_name}'.")
            return definition # Return the created definition

        except Exception as e:
            logger.error(f"Error storing values for secret '{secret_name}' (definition ID: {definition.id}): {e}. Attempting to delete definition.", exc_info=True)
            try:
                await self.delete_secret_bundle_definition(project_name, secret_name)
                logger.info(f"Successfully rolled back (deleted) definition for '{secret_name}' after value storage error.")
            except Exception as del_e:
                logger.error(f"Failed to roll back (delete) definition for '{secret_name}' after value storage error: {del_e}. Manual cleanup may be required.")
            
            if isinstance(e, SecretError): # If it's already a SecretError, re-raise it
                raise
            else: # Wrap other exceptions
                raise SecretError(f"An error occurred while storing values for secret '{secret_name}': {e}") 