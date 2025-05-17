"""
Git Repository Polling Services.

Handles the polling of Git repositories for changes to be managed by the application.
"""

import asyncio
import logging
import os
from pathlib import Path
from datetime import datetime, UTC
from uuid import UUID
from typing import Dict, Any, Union

logger = logging.getLogger(__name__)

try:
    import git
    from git import Repo
    GIT_AVAILABLE = True
except ImportError:
    logger.warning("GitPython not available. Git operations will be limited.")
    GIT_AVAILABLE = False

try:
    from mlpie.config import get_config_manager
except ImportError:
    logger.warning("Config manager not available. Git polling will be limited.")
    def get_config_manager():
        return None

# Import database session and CRUD operations
from mlpie.db.connection import get_session
from mlpie.db.crud.repository import (
    get_repository, get_repository_state, create_repository_state, update_repository_state
)
from mlpie.db.models.repository import Repository, SyncStatus, EntityType
from mlpie.state_sync.entity_scanner import ProjectScanner, DatasetScanner, PipelineScanner, EnvironmentScanner
from mlpie.gitops.repository_manager import get_repository_manager
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession


async def poll_git_repository():
    """
    Polls the master Git repository for changes.
    
    This function is called on a regular interval by the scheduler.
    It checks for any changes in the configured master Git repository and
    triggers necessary actions if changes are detected.
    """
    logger.section("Master Git Repository Polling")
    logger.info("Starting master Git repository polling...")
    
    if not GIT_AVAILABLE:
        logger.error("GitPython library not available. Git operations cannot be performed.")
        logger.end_section(success=False)
        return
    
    try:
        # Retrieve configuration settings
        config_manager = get_config_manager()
        if not config_manager:
            logger.warning("Config manager not available. Skipping Git polling.")
            logger.end_section(success=False)
            return
            
        settings = config_manager.get_root_settings()
        
        # Get configuration values
        repo_url = settings.git.REPO_URL if hasattr(settings, 'git') and hasattr(settings.git, 'REPO_URL') else None
        
        if not repo_url:
            logger.warning("Repository URL not configured. Skipping Git polling.")
            logger.end_section(success=False)
            return
        
        # Get master repository (or create it)
        async for session in get_session():
            try:
                # Query for master repository using SQLAlchemy's select instead of raw SQL
                result = await session.execute(
                    select(Repository).where(Repository.entity_type == EntityType.MASTER.value)
                )
                master_repo = result.scalars().first()
                
                if master_repo:
                    # Use the existing Repository object directly
                    await poll_single_repository(master_repo.id)
                else:
                    logger.warning("No master repository found in database. Creating one from settings.")
                    
                    # Create a master repository from settings
                    master_repo = Repository(
                        entity_type=EntityType.MASTER.value,
                        entity_id="master",
                        url=repo_url,
                        ref=getattr(settings.git, 'REPO_BRANCH', 'main'),
                        name="Master Repository",
                        auth_type=getattr(settings.git, 'AUTH_TYPE', 'none').lower(),
                        resource_types=["*"]  # Master repo covers all resource types
                    )
                    
                    # Add to database
                    session.add(master_repo)
                    await session.commit()
                    await session.refresh(master_repo)
                    
                    # Poll this repository
                    await poll_single_repository(master_repo.id)
            except Exception as e:
                logger.exception("Error handling master repository", exc_info=e)
                
        logger.info("Master Git repository polling completed.")
        logger.end_section(success=True)
    except Exception as e:
        logger.exception("Error during master Git repository polling", exc_info=e)
        logger.end_section(success=False)


async def poll_single_repository(repository_id):
    """
    Poll a specific repository for changes.
    
    Args:
        repository_id: UUID of the repository to poll
    """
    logger.section(f"Repository Polling [{repository_id}]")
    logger.info(f"Polling repository {repository_id}...")
    
    if not GIT_AVAILABLE:
        logger.error("GitPython library not available. Git operations cannot be performed.")
        logger.end_section(success=False)
        return
    
    try:
        repository_manager = get_repository_manager()
        
        # Get repository from database
        async for session in get_session():
            try:
                # Get repository
                repository = await get_repository(session, repository_id)
                
                if not repository:
                    logger.error(f"Repository with ID {repository_id} not found.")
                    logger.end_section(success=False)
                    return
                
                # Update repository state to SYNCING
                await update_repository_state(
                    session=session,
                    repository_id=repository.id,
                    sync_status=SyncStatus.SYNCING
                )
                
                # Get or set local path
                if not repository.local_path:
                    repository.local_path = repository_manager.get_local_path(repository)
                    await session.commit()
                
                # Check if repository exists locally
                if not os.path.exists(os.path.join(repository.local_path, '.git')):
                    logger.info(f"Repository does not exist at {repository.local_path}. Will attempt to clone.")
                    
                    logger.section("Repository Cloning")
                    # Clone repository
                    success, error_message = await repository_manager.clone_repository(repository)
                    
                    if success:
                        logger.info(f"Repository successfully cloned to {repository.local_path}")
                        # If clone succeeded, get repository details
                        repo = Repo(repository.local_path)
                        current_sha = repo.head.commit.hexsha
                        current_branch = repo.active_branch.name
                        commit_message = repo.head.commit.message
                        commit_author = f"{repo.head.commit.author.name} <{repo.head.commit.author.email}>"
                        commit_date = datetime.fromtimestamp(repo.head.commit.committed_date, UTC)
                        
                        # Update repository state
                        await create_repository_state(
                            session=session,
                            repository_id=repository.id,
                            commit_sha=current_sha,
                            commit_short_sha=current_sha[:10],
                            commit_message=commit_message,
                            commit_author=commit_author,
                            commit_date=commit_date,
                            sync_status=SyncStatus.IDLE,
                            is_local_repo_valid=True
                        )
                        
                        logger.end_section(success=True)
                        
                        # Process repository changes
                        await process_repository_changes(repository)
                    else:
                        logger.error(f"Failed to clone repository: {error_message}")
                        # Update repository state with error
                        await update_repository_state(
                            session=session,
                            repository_id=repository.id,
                            sync_status=SyncStatus.ERROR,
                            sync_error=error_message
                        )
                        logger.end_section(success=False)
                else:
                    logger.info(f"Repository exists at {repository.local_path}. Checking for updates.")
                    
                    logger.section("Repository Updating")
                    # Pull changes from repository
                    was_pulled, error_message, current_sha, previous_sha = await repository_manager.pull_repository(repository)
                    
                    # Get repository state
                    repo_state = await get_repository_state(session, repository.id)
                    
                    # Check if this is a fresh repository state
                    is_first_run = repo_state is None or repo_state.commit_sha is None
                    
                    if was_pulled or is_first_run:
                        # Changes were pulled or this is first run
                        if current_sha:
                            logger.info(f"Repository updated to commit {current_sha[:8]}")
                            # Get commit details
                            repo = Repo(repository.local_path)
                            commit = repo.commit(current_sha)
                            commit_message = commit.message
                            commit_author = f"{commit.author.name} <{commit.author.email}>"
                            commit_date = datetime.fromtimestamp(commit.committed_date, UTC)
                            
                            # Update repository state
                            await create_repository_state(
                                session=session,
                                repository_id=repository.id,
                                commit_sha=current_sha,
                                commit_short_sha=current_sha[:10],
                                commit_message=commit_message,
                                commit_author=commit_author,
                                commit_date=commit_date,
                                sync_status=SyncStatus.IDLE,
                                is_local_repo_valid=True
                            )
                            
                            logger.end_section(success=True)
                            
                            # Process repository changes
                            await process_repository_changes(repository)
                        else:
                            logger.error(f"Failed to update repository: {error_message or 'Unknown error'}")
                            # Update repository state with error
                            await update_repository_state(
                                session=session,
                                repository_id=repository.id,
                                sync_status=SyncStatus.ERROR,
                                sync_error=error_message or "Unknown error"
                            )
                            logger.end_section(success=False)
                    else:
                        # No changes detected
                        logger.info(f"No changes detected in repository {repository.id}.")
                        
                        # Update last sync time but keep state the same
                        await update_repository_state(
                            session=session,
                            repository_id=repository.id,
                            sync_status=SyncStatus.IDLE
                        )
                        logger.end_section(success=True)
                
                logger.end_section(success=True)
            except Exception as e:
                logger.exception(f"Error polling repository {repository_id}", exc_info=e)
                
                # Update repository state with error
                try:
                    await update_repository_state(
                        session=session,
                        repository_id=repository_id,
                        sync_status=SyncStatus.ERROR,
                        sync_error=str(e)
                    )
                except Exception:
                    pass
                
                logger.end_section(success=False)
    except Exception as e:
        logger.exception(f"Error during repository polling", exc_info=e)
        logger.end_section(success=False)


async def process_repository_changes(repository: Repository):
    """
    Process the changes in a repository and trigger necessary actions.
    
    Args:
        repository: Repository object
    """
    # Start a section for this repository processing
    logger.section(f"Repository Processing [{repository.id}]")
    
    try:
        logger.info(f"Processing changes in repository {repository.id}...")
        
        # Get configuration settings
        config_manager = get_config_manager()
        if not config_manager:
            logger.warning("Config manager not available. Skipping repository processing.")
            logger.end_section(success=False)
            return
            
        settings = config_manager.get_root_settings()
        
        # Determine which types of entities to scan based on repository type and resource_types
        entity_types_to_scan = []
        
        if repository.entity_type == EntityType.MASTER.value:
            # Master repository scans all entity types by default
            entity_types_to_scan = ['project', 'environment', 'dataset', 'pipeline']
        elif repository.entity_type == EntityType.PROJECT.value:
            # Project repository can scan environments and their resources
            if '*' in repository.resource_types or 'environment' in repository.resource_types:
                entity_types_to_scan.append('environment')
            if '*' in repository.resource_types or 'dataset' in repository.resource_types:
                entity_types_to_scan.append('dataset')
            if '*' in repository.resource_types or 'pipeline' in repository.resource_types:
                entity_types_to_scan.append('pipeline')
        elif repository.entity_type == EntityType.ENVIRONMENT.value:
            # Environment repository can scan datasets and pipelines
            if '*' in repository.resource_types or 'dataset' in repository.resource_types:
                entity_types_to_scan.append('dataset')
            if '*' in repository.resource_types or 'pipeline' in repository.resource_types:
                entity_types_to_scan.append('pipeline')
                
        # Path within repository
        repo_path = repository.local_path
        if repository.path_in_repo:
            repo_path = os.path.join(repo_path, repository.path_in_repo)
            
        # Create repository scanners as needed
        scanners = {}
        if 'project' in entity_types_to_scan:
            scanners['project'] = ProjectScanner(repo_path)
            if hasattr(scanners['project'], 'repository'):
                scanners['project'].repository = repository
        if 'environment' in entity_types_to_scan:
            scanners['environment'] = EnvironmentScanner(repo_path)
            if hasattr(scanners['environment'], 'repository'):
                scanners['environment'].repository = repository
        if 'dataset' in entity_types_to_scan:
            scanners['dataset'] = DatasetScanner(repo_path)
            if hasattr(scanners['dataset'], 'repository'):
                scanners['dataset'].repository = repository
        if 'pipeline' in entity_types_to_scan:
            scanners['pipeline'] = PipelineScanner(repo_path)
            if hasattr(scanners['pipeline'], 'repository'):
                scanners['pipeline'].repository = repository
        
        # Scan for entities in the repository
        async for session in get_session():
            try:
                # Get repository state to access SHAs
                repo_state = await get_repository_state(session, repository.id)
                
                if not repo_state:
                    logger.warning(f"No state found for repository {repository.id}. Cannot determine previous SHA.")
                    logger.end_section(success=False)
                    return
                    
                # Get previous and current SHA
                previous_sha = None
                current_sha = repo_state.commit_sha
                
                # Scan for entities using each scanner
                for entity_type, scanner in scanners.items():
                    # Create a subsection for this entity type scan
                    logger.section(f"Scanning {entity_type.capitalize()} Entities")
                    
                    # The scan_repository now returns a tuple of (entities, validation_errors)
                    scan_result = await scanner.scan_repository(
                        session=session,
                        previous_sha=previous_sha,
                        current_sha=current_sha
                    )
                    
                    # Unpack the scan results
                    entities, validation_errors = scan_result
                    
                    if validation_errors:
                        error_count = len(validation_errors)
                        logger.warning(f"Found {error_count} {entity_type} files with validation errors in repository {repository.id}")
                        for file_path, errors in validation_errors.items():
                            for error in errors:
                                logger.warning(f"  - {file_path}: {error['message']}")
                    
                    if not entities:
                        if validation_errors:
                            logger.info(f"No valid {entity_type} entities found in repository {repository.id} (found {len(validation_errors)} invalid files).")
                        else:
                            logger.info(f"No {entity_type} entities found in repository {repository.id}.")
                        logger.end_section(success=True)  # Still consider it success if we just didn't find any entities
                    else:
                        logger.info(f"Found {len(entities)} valid {entity_type} entities in repository {repository.id}.")
                        
                        # Add source repository info to entities if they support it
                        for entity in entities:
                            if hasattr(entity, 'source_repository_url'):
                                entity.source_repository_url = repository.url
                            if hasattr(entity, 'source_repository_path'):
                                entity.source_repository_path = repository.path_in_repo
                        
                        # Create a reconciliation subsection
                        logger.section(f"Reconciling {entity_type.capitalize()} Entities")
                        
                        # Reconcile entities with database, passing validation errors
                        result = await scanner.reconcile_entities(session, entities, validation_errors)
                        logger.info(f"{entity_type.capitalize()} reconciliation: {result}")
                        
                        logger.end_section(success=True)
                
                logger.info(f"Repository changes for {repository.id} processed successfully.")
                logger.end_section(success=True)
                
            except Exception as e:
                logger.exception(f"Error during entity reconciliation", exc_info=e)
                logger.end_section(success=False)
        
    except Exception as e:
        logger.exception(f"Error processing repository changes", exc_info=e)
        logger.end_section(success=False) 