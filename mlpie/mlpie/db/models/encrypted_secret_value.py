"""
Encrypted Secret Value Database Model.

This model stores the actual encrypted key-value bundle for a SecretDefinition when
the EncryptedDBProvider is active. It is managed exclusively by that provider.
"""
import uuid
from datetime import datetime, UTC

from sqlalchemy import Column, Text, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from mlpie.db.base import Base
# Removed: from mlpie.db.models.secret_definition import SecretDefinition # Avoid circular import if not strictly needed for typing here

class EncryptedSecretValue(Base):
    __tablename__ = "encrypted_secret_values"
    __table_args__ = {"extend_existing": True}

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Establishes a one-to-one relationship with SecretDefinition
    secret_definition_id = Column(PG_UUID(as_uuid=True), ForeignKey("secret_definitions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Using LargeBinary for encrypted content is generally better than Text for arbitrary bytes.
    # If we ensure the encrypted output is base64-encoded string, Text could also work.
    # For Fernet, the output is bytes, so LargeBinary is more direct.
    encrypted_bundle = Column(LargeBinary, nullable=False) 

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationship back to SecretDefinition
    # The 'secret_definition' attribute will be on this model, 
    # and 'encrypted_value' will be on the SecretDefinition model.
    secret_definition = relationship("SecretDefinition", back_populates="encrypted_value")

    def __repr__(self):
        return f"<EncryptedSecretValue(id='{self.id}', secret_definition_id='{self.secret_definition_id}')>" 