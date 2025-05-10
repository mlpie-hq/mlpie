"""
Secret Definition Database Model.

This model stores metadata about a secret bundle defined for a project.
It specifies the existence and name of a secret bundle, but not its sensitive values.
The actual values are managed by the globally configured SecretProvider.
"""
import uuid
from datetime import datetime, UTC

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID # For consistency if using Postgres later

from mlpie.db.base import Base
from mlpie.db.models.project import Project # To link and for relationship typing

class SecretDefinition(Base):
    __tablename__ = "secret_definitions"
    __table_args__ = (
        UniqueConstraint('project_name', 'name', name='uq_project_secret_name'),
        {"extend_existing": True}
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(255), ForeignKey(Project.name, ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True) # User-defined name for the secret bundle
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationship to Project
    project = relationship("Project", back_populates="secret_definitions")

    # Relationship to its encrypted value (one-to-one)
    # This assumes the value is stored in a separate table managed by EncryptedDBProvider
    encrypted_value = relationship("EncryptedSecretValue", back_populates="secret_definition", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SecretDefinition(id='{self.id}', project_name='{self.project_name}', name='{self.name}')>" 