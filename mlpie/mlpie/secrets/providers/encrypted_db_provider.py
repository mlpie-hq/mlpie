"""
Encrypted Database Secret Provider.

This provider stores secret bundles as encrypted JSON blobs in a dedicated
database table (EncryptedSecretValue), linked to a SecretDefinition.
It uses Fernet encryption from the 'cryptography' library.
"""
import json
import logging
from typing import Any, Dict, Optional, Type
import uuid # For converting string UUID to UUID object

from pydantic import BaseModel, Field
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload # Potentially needed for eager loading

from mlpie.db.connection import get_session_factory # Corrected import
from mlpie.db.models import SecretDefinition, EncryptedSecretValue
from mlpie.plugins.base import PluginMetadata, PluginType, register_plugin
from mlpie.secrets.providers.base import SecretProviderPlugin
# from mlpie.secrets.exceptions import SecretError, SecretNotFoundError # Not typically raised by provider

logger = logging.getLogger(__name__)

class EncryptedDBProviderSettings(BaseModel):
    encryption_key: str = Field(..., description="Base64-encoded Fernet key for encrypting/decrypting secrets.")

@register_plugin
class EncryptedDBProvider(SecretProviderPlugin):
    metadata: PluginMetadata = PluginMetadata(
        name="EncryptedDBProvider",
        version="0.1.0",
        description="Stores secrets encrypted in the application database.",
        plugin_type=PluginType.SECRET_PROVIDER,
        author="MLPie Core Team",
        config_schema=EncryptedDBProviderSettings.model_json_schema()
    )

    def __init__(self):
        super().__init__()
        self.fernet: Optional[Fernet] = None
        self.settings: Optional[EncryptedDBProviderSettings] = None
        self._session_factory = None # To store the factory

    async def initialize(self, config: Dict[str, Any]) -> bool:
        try:
            self.settings = EncryptedDBProviderSettings(**config)
            if not self.settings.encryption_key:
                logger.error("Encryption key is missing for EncryptedDBProvider.")
                self.initialized = False
                return False
            self.fernet = Fernet(self.settings.encryption_key.encode('utf-8'))
            self._session_factory = get_session_factory() # Get and store session factory
            self.initialized = True
            logger.info("EncryptedDBProvider initialized successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize EncryptedDBProvider: {e}", exc_info=True)
            self.initialized = False
            return False

    async def store_bundle(
        self, 
        secret_definition_id_str: str, # This is SecretDefinition.id (as string UUID)
        secret_name_for_log: str,    # Used for logging/context only
        data: Dict[str, str]
    ) -> bool:
        if not self.initialized or not self.fernet or not self._session_factory:
            logger.error("EncryptedDBProvider is not properly initialized for store_bundle.")
            return False
        
        try:
            def_id_uuid = uuid.UUID(secret_definition_id_str) # Convert to UUID for DB query

            json_data = json.dumps(data)
            encrypted_data_bundle = self.fernet.encrypt(json_data.encode('utf-8'))

            async with self._session_factory() as session:
                async with session.begin(): # Start a transaction
                    stmt_select = select(EncryptedSecretValue).where(EncryptedSecretValue.secret_definition_id == def_id_uuid)
                    result = await session.execute(stmt_select)
                    existing_value = result.scalar_one_or_none()

                    if existing_value:
                        existing_value.encrypted_bundle = encrypted_data_bundle
                        logger.info(f"Updated encrypted bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}').")
                    else:
                        new_value = EncryptedSecretValue(
                            secret_definition_id=def_id_uuid,
                            encrypted_bundle=encrypted_data_bundle
                        )
                        session.add(new_value)
                        logger.info(f"Stored new encrypted bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}').")
            return True
        except Exception as e:
            logger.error(f"Failed to store secret bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}'): {e}", exc_info=True)
            return False

    async def retrieve_bundle(
        self, 
        secret_definition_id_str: str, 
        secret_name_for_log: str
    ) -> Optional[Dict[str, str]]:
        if not self.initialized or not self.fernet or not self._session_factory:
            logger.error("EncryptedDBProvider is not properly initialized for retrieve_bundle.")
            return None

        try:
            def_id_uuid = uuid.UUID(secret_definition_id_str)
            async with self._session_factory() as session:
                async with session.begin(): # Start a transaction (read-only but good practice)
                    stmt = select(EncryptedSecretValue.encrypted_bundle).where(EncryptedSecretValue.secret_definition_id == def_id_uuid)
                    result = await session.execute(stmt)
                    encrypted_data_bundle = result.scalar_one_or_none()

                if not encrypted_data_bundle:
                    logger.info(f"No encrypted bundle found for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}').")
                    return None 
                
                decrypted_data_bytes = self.fernet.decrypt(encrypted_data_bundle)
                json_data_string = decrypted_data_bytes.decode('utf-8')
                data_dict = json.loads(json_data_string)
                return data_dict
        except InvalidToken:
            logger.error(f"Failed to decrypt secret bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}'). Invalid token or key.")
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve secret bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}'): {e}", exc_info=True)
            return None

    async def delete_bundle(
        self, 
        secret_definition_id_str: str, 
        secret_name_for_log: str 
    ) -> bool:
        if not self.initialized or not self._session_factory:
            logger.error("EncryptedDBProvider is not properly initialized for delete_bundle.")
            return False
        
        try:
            def_id_uuid = uuid.UUID(secret_definition_id_str)
            async with self._session_factory() as session:
                async with session.begin(): # Start a transaction
                    stmt = delete(EncryptedSecretValue).where(EncryptedSecretValue.secret_definition_id == def_id_uuid)
                    result = await session.execute(stmt)
            return True 
        except Exception as e:
            logger.error(f"Failed to delete secret bundle for secret_definition_id '{secret_definition_id_str}' (name: '{secret_name_for_log}'): {e}", exc_info=True)
            return False

    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        try:
            EncryptedDBProviderSettings(**config)
            return {}
        except Exception as e:
            return {"config_error": str(e)}

    async def shutdown(self) -> None:
        self.fernet = None
        self.initialized = False
        self._session_factory = None # Clear session factory
        logger.info("EncryptedDBProvider shut down.") 