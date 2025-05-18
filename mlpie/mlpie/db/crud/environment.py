"""
CRUD operations for environment entities.

This module provides functions for creating, reading, updating, and deleting environment entities in the database.
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, UTC

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError

from mlpie.db.models.environment import Environment
from mlpie.db.models.project import Project

logger = logging.getLogger(__name__)


async def create_environment(session: AsyncSession, environment_data: Dict[Any, Any]) -> Environment:
    """
    Create a new environment in the database.
    
    Args:
        session: Database session
        environment_data: Environment data dictionary
        
    Returns:
        Environment: Created environment object
    """
    # Create environment instance from YAML spec
    environment = Environment.from_yaml_spec(environment_data)
    
    # Add to session and commit
    session.add(environment)
    await session.commit()
    await session.refresh(environment)
    return environment


async def get_environment_by_id(session: AsyncSession, environment_id: UUID) -> Optional[Environment]:
    """
    Get an environment by ID.
    
    Args:
        session: Database session
        environment_id: Environment ID
        
    Returns:
        Environment instance or None if not found
    """
    result = await session.execute(select(Environment).where(Environment.id == environment_id))
    return result.scalars().first()


async def get_environment_by_name(session: AsyncSession, name: str) -> Optional[Environment]:
    """
    Get an environment by name.
    
    Args:
        session: Database session
        name: Environment name
        
    Returns:
        Environment instance or None if not found
    """
    result = await session.execute(select(Environment).where(Environment.name == name))
    return result.scalars().first()


async def get_environment_by_context(session: AsyncSession, name: str, project_name: Optional[str] = None) -> Optional[Environment]:
    """
    Get an environment by its full context (name and project).
    
    Args:
        session: Database session
        name: Environment name
        project_name: Project name (optional)
        
    Returns:
        Environment instance or None if not found
    """
    query = select(Environment).where(Environment.name == name)
    
    if project_name:
        query = query.where(Environment.project_name == project_name)
        
    result = await session.execute(query)
    return result.scalars().first()


async def get_environments(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    project_name: Optional[str] = None
) -> List[Environment]:
    """
    Get a list of environments.
    
    Args:
        session: Database session
        skip: Number of environments to skip
        limit: Maximum number of environments to return
        project_name: Filter by project name
        
    Returns:
        List of environment objects
    """
    query = select(Environment)
    
    if project_name:
        query = query.where(Environment.project_name == project_name)
        
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def update_environment_from_spec(
    session: AsyncSession,
    environment_id: UUID,
    environment_data: Dict[str, Any]
) -> Optional[Environment]:
    """
    Update an environment from a YAML specification.
    
    Args:
        session: Database session
        environment_id: Environment ID
        environment_data: Environment data dictionary
        
    Returns:
        Updated environment object if found, None otherwise
    """
    environment = await get_environment_by_id(session, environment_id)
    if not environment:
        return None
    
    # Update core fields from spec
    metadata = environment_data.get("metadata", {})
    environment.name = metadata.get("name", environment.name)
    environment.description = metadata.get("description", environment.description)
    environment.version = metadata.get("version", environment.version)
    environment.labels = metadata.get("labels", environment.labels)
    
    # Store the complete specification
    environment.spec = environment_data
    
    await session.commit()
    await session.refresh(environment)
    return environment


async def update_environment(session: AsyncSession, environment: Environment) -> Environment:
    """
    Update an environment.
    
    Args:
        session: Database session
        environment: Environment object to update
        
    Returns:
        Updated environment object
    """
    await session.commit()
    await session.refresh(environment)
    return environment


async def delete_environment(session: AsyncSession, name: str) -> bool:
    """
    Delete an environment.
    
    Args:
        session: Database session
        name: Environment name
        
    Returns:
        True if environment was deleted, False if not found
    """
    result = await session.execute(delete(Environment).where(Environment.name == name))
    await session.commit()
    return result.rowcount > 0


async def reconcile_environments(
    session: AsyncSession,
    scanned_environments: List[Environment]
) -> Dict[str, int]:
    """
    Reconcile scanned environments with database state.
    Environment names are unique within a project.
    
    Args:
        session: Database session
        scanned_environments: List of environments from scanning (these are new model instances)
        
    Returns:
        Dictionary with counts of created/updated/unchanged/skipped environments
    """
    counters = {
        "created": 0,
        "updated": 0,
        "unchanged": 0,
        "skipped_bad_project_ref": 0,
        "skipped_on_add_error": 0, # For errors during flush
        "deleted": 0
    }
    
    from mlpie.db.crud.project import get_project_by_name
    
    processed_yaml_keys = set() # Tracks 'project_name:name' from successfully processed YAMLs

    for environment_from_yaml in scanned_environments:
        yaml_name = environment_from_yaml.name
        yaml_project_name = environment_from_yaml.project_name
        
        # This key uniquely identifies an environment instance based on the new constraint
        current_yaml_key = f"{yaml_project_name or 'none'}:{yaml_name}"

        # Attempt to find an existing environment by its project context (project_name, name)
        existing_env = await get_environment_by_context(session, yaml_name, yaml_project_name)

        if existing_env:
            # Environment with the same (project_name, name) already exists. This is an update.
            if (existing_env.description != environment_from_yaml.description or
                existing_env.version != environment_from_yaml.version or
                existing_env.labels != environment_from_yaml.labels or
                existing_env.spec != environment_from_yaml.spec or
                existing_env.source_path != environment_from_yaml.source_path):

                existing_env.description = environment_from_yaml.description
                existing_env.version = environment_from_yaml.version
                existing_env.labels = environment_from_yaml.labels
                existing_env.spec = environment_from_yaml.spec
                existing_env.status = "Ready"
                existing_env.active = True
                existing_env.source_path = environment_from_yaml.source_path
                existing_env.updated_at = datetime.now(UTC)
                counters["updated"] += 1
            else:
                counters["unchanged"] += 1
            processed_yaml_keys.add(current_yaml_key) # Successfully updated or unchanged
        else:
            # No environment with this (project_name, name) exists. This is a new environment.
            if yaml_project_name:
                project = await get_project_by_name(session, yaml_project_name)
                if not project:
                    logger.error(
                        f"Environment '{yaml_name}' (project: '{yaml_project_name}') in YAML references a non-existent project. Skipping."
                    )
                    counters["skipped_bad_project_ref"] += 1
                    continue # Skip this environment from YAML
            else:
                # project_name is required for an environment by DB constraint (nullable=False)
                logger.error(
                    f"Environment '{yaml_name}' in YAML is missing the required 'project' field. Skipping."
                )
                counters["skipped_bad_project_ref"] += 1 # Or a new category like "skipped_missing_project"
                continue # Skip this environment from YAML

            environment_from_yaml.updated_at = datetime.now(UTC)
            session.add(environment_from_yaml)
            try:
                # Flush is still useful to catch potential duplicate (project_name,name) within the same batch 
                # if scanned_environments somehow had the exact same entry twice.
                await session.flush()
                counters["created"] += 1
                processed_yaml_keys.add(current_yaml_key) # Successfully created
            except IntegrityError as e:
                # This would now typically be a genuine unexpected DB issue or a duplicate (project,name)
                # that wasn't caught by get_environment_by_context (e.g. race with another transaction if not using serializable isolation)
                # or a violation of other constraints (e.g. FK if project_name was invalid despite earlier check - less likely).
                logger.error(f"IntegrityError during flush for environment '{yaml_name}' (project: '{yaml_project_name}'): {e}. Skipping.")
                counters["skipped_on_add_error"] += 1
                # As before, a failed flush makes the session problematic. Consider rollback strategy for the whole batch.
                # For now, just logging and skipping the add to processed_yaml_keys.

    # Deletion logic: Environments in DB not found in the latest scan (for this scan scope)
    all_db_envs_stmt = await session.execute(select(Environment))
    all_db_environments = all_db_envs_stmt.scalars().all()

    for db_env in all_db_environments:
        # The key for DB environments must match the format of processed_yaml_keys
        db_env_key = f"{db_env.project_name or 'none'}:{db_env.name}"
        
        # IMPORTANT: The deletion logic's scope is critical.
        # If `scanned_environments` represents the complete desired state from a specific source
        # (e.g., files in a particular repo/path being scanned now),
        # then we should only delete DB entries that originate FROM THAT SAME SOURCE
        # and are no longer present in `processed_yaml_keys`.
        # A simple check like `db_env_key not in processed_yaml_keys` will delete any environment
        # not in the current scan, which could be wrong if multiple sources manage environments.
        # This requires `source_path` on `Environment` to be reliably set and used here.
        # For now, the code below uses the broad `db_env_key not in processed_yaml_keys`.
        # This implies that `scanned_environments` must be the global list of all environments.
        # If that's not true, this deletion is too aggressive.
        # TODO: Refine deletion logic based on scan source if necessary.
        
        if db_env_key not in processed_yaml_keys:
            logger.info(f"Deleting environment '{db_env.name}' (project: {db_env.project_name}) as it's no longer found in scanned sources for this reconciliation cycle.")
            await session.delete(db_env)
            counters["deleted"] += 1
            
    await session.commit()
    
    return counters 