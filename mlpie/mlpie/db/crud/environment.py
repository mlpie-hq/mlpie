"""
CRUD operations for environment entities.

This module provides functions for creating, reading, updating, and deleting environment entities in the database.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from mlpie.db.models.environment import Environment
from mlpie.db.models.project import Project


def create_environment(db: Session, environment_data: Dict[Any, Any]) -> Environment:
    """
    Create a new environment in the database.
    
    Args:
        db (Session): Database session
        environment_data (Dict[Any, Any]): Environment data dictionary
        
    Returns:
        Environment: Created environment object
    """
    # If there's a project reference, link to the project
    project_name = None
    if "spec" in environment_data and "projectRef" in environment_data["spec"]:
        project_name = environment_data["spec"]["projectRef"].get("name")
    
    project_id = None
    if project_name:
        project = db.query(Project).filter(Project.name == project_name).first()
        if project:
            project_id = project.id
    
    # Create environment instance from YAML spec
    environment = Environment.from_yaml_spec(environment_data)
    
    # Set project ID if found
    if project_id:
        environment.project_id = project_id
    
    db.add(environment)
    db.commit()
    db.refresh(environment)
    return environment


def get_environment(db: Session, environment_id: UUID) -> Optional[Environment]:
    """
    Get an environment by ID.
    
    Args:
        db (Session): Database session
        environment_id (UUID): Environment ID
        
    Returns:
        Optional[Environment]: Environment object if found, None otherwise
    """
    return db.query(Environment).filter(Environment.id == environment_id).first()


def get_environment_by_name(db: Session, name: str) -> Optional[Environment]:
    """
    Get an environment by name.
    
    Args:
        db (Session): Database session
        name (str): Environment name
        
    Returns:
        Optional[Environment]: Environment object if found, None otherwise
    """
    return db.query(Environment).filter(Environment.name == name).first()


def get_environments(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    project_id: Optional[UUID] = None
) -> List[Environment]:
    """
    Get a list of environments.
    
    Args:
        db (Session): Database session
        skip (int): Number of environments to skip
        limit (int): Maximum number of environments to return
        project_id (Optional[UUID]): Filter by project ID
        
    Returns:
        List[Environment]: List of environment objects
    """
    query = db.query(Environment)
    
    if project_id:
        query = query.filter(Environment.project_id == project_id)
    
    return query.offset(skip).limit(limit).all()


def update_environment(
    db: Session, 
    environment_id: UUID, 
    environment_data: Dict[Any, Any]
) -> Optional[Environment]:
    """
    Update an environment.
    
    Args:
        db (Session): Database session
        environment_id (UUID): Environment ID
        environment_data (Dict[Any, Any]): Updated environment data
        
    Returns:
        Optional[Environment]: Updated environment object if found, None otherwise
    """
    environment = get_environment(db, environment_id)
    if not environment:
        return None
    
    # If there's a project reference, update the project link
    project_name = None
    if "spec" in environment_data and "projectRef" in environment_data["spec"]:
        project_name = environment_data["spec"]["projectRef"].get("name")
    
    if project_name:
        project = db.query(Project).filter(Project.name == project_name).first()
        if project:
            environment.project_id = project.id
    
    # Update core fields from spec
    metadata = environment_data.get("metadata", {})
    environment.name = metadata.get("name", environment.name)
    environment.description = metadata.get("description", environment.description)
    environment.version = metadata.get("version", environment.version)
    environment.labels = metadata.get("labels", environment.labels)
    
    # Store the complete specification
    environment.spec = environment_data
    
    db.commit()
    db.refresh(environment)
    return environment


def delete_environment(db: Session, environment_id: UUID) -> bool:
    """
    Delete an environment.
    
    Args:
        db (Session): Database session
        environment_id (UUID): Environment ID
        
    Returns:
        bool: True if the environment was deleted, False otherwise
    """
    environment = get_environment(db, environment_id)
    if not environment:
        return False
    
    db.delete(environment)
    db.commit()
    return True


async def reconcile_environments(session: AsyncSession, 
                                environments: List[Environment]) -> Dict[str, int]:
    """
    Reconcile environment entities from files with the database.
    
    This function:
    1. Updates existing environments with new specs
    2. Creates new environments not in the database
    3. Links environments to projects based on project references
    
    Args:
        session: Database session
        environments: List of environment instances from the scanner
        
    Returns:
        Dict: Counts of created, updated, and deleted environments
    """
    created_count = 0
    updated_count = 0
    
    # Get all existing environments by name
    result = await session.execute(select(Environment))
    existing_environments = {env.name: env for env in result.scalars().all()}
    
    # Get all projects by name (for resolving project references)
    result = await session.execute(select(Project))
    projects = {project.name: project for project in result.scalars().all()}
    
    # Process all environments from files
    for environment in environments:
        # Get project reference if any
        project_name = None
        if hasattr(environment, 'spec') and environment.spec:
            spec = environment.spec.get('spec', {})
            project_ref = spec.get('projectRef', {})
            if project_ref and isinstance(project_ref, dict):
                project_name = project_ref.get('name')
        
        # Set project ID if project exists
        if project_name and project_name in projects:
            environment.project_id = projects[project_name].id
        
        if environment.name in existing_environments:
            # Update existing environment
            existing_env = existing_environments[environment.name]
            
            # Update fields
            existing_env.description = environment.description
            existing_env.version = environment.version
            existing_env.spec = environment.spec
            existing_env.labels = environment.labels
            existing_env.project_id = environment.project_id
            
            # Mark as processed
            existing_environments.pop(environment.name)
            updated_count += 1
        else:
            # Create new environment
            session.add(environment)
            created_count += 1
    
    # Commit changes
    await session.commit()
    
    return {
        "created": created_count,
        "updated": updated_count,
        "total": created_count + updated_count
    } 