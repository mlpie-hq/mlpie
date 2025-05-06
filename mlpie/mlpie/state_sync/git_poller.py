"""
Git Repository Polling Services.

Handles the polling of Git repositories for changes to be managed by the application.
"""

import asyncio
import logging
import os
from pathlib import Path
from datetime import datetime, UTC

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
    get_or_create_repository_state, update_after_git_pull, set_sync_status
)
from mlpie.db.models.repository import SyncStatus
from mlpie.state_sync.entity_scanner import ProjectScanner, DatasetScanner


async def poll_git_repository():
    """
    Polls the Git repository for changes.
    
    This function is called on a regular interval by the scheduler.
    It checks for any changes in the configured Git repository and
    triggers necessary actions if changes are detected.
    """
    logger.info("Starting Git repository polling...")
    
    if not GIT_AVAILABLE:
        logger.error("GitPython library not available. Git operations cannot be performed.")
        return
    
    try:
        # Retrieve configuration settings
        config_manager = get_config_manager()
        if not config_manager:
            logger.warning("Config manager not available. Skipping Git polling.")
            return
            
        settings = config_manager.get_root_settings()
        
        # Get configuration values
        repo_path = settings.REPOSITORY_CLONE_PATH if hasattr(settings, 'REPOSITORY_CLONE_PATH') else None
        if not repo_path:
            # Fallback to old setting if new one is not available
            repo_path = settings.REPOSITORY_PATH if hasattr(settings, 'REPOSITORY_PATH') else None
            
        repo_url = settings.git.REPO_URL if hasattr(settings, 'git') and hasattr(settings.git, 'REPO_URL') else None
        
        if not repo_path:
            logger.warning("Repository path not configured. Skipping Git polling.")
            return
            
        if not repo_url:
            logger.warning("Repository URL not configured. Skipping Git polling.")
            return
        
        # Convert to absolute path if it's relative
        repo_path = os.path.abspath(repo_path)
        logger.info(f"Polling Git repository at: {repo_path}")
        
        changes_detected = False
        error_message = None
        
        # Get database session
        async for session in get_session():
            try:
                # Initialize or get repository state
                await set_sync_status(session, repo_url, SyncStatus.SYNCING)
                
                # Create initial repository state if it doesn't exist
                repo_state = await get_or_create_repository_state(
                    session=session,
                    repository_url=repo_url,
                    repository_path=repo_path
                )
                
                # Check if repository exists
                if not os.path.exists(os.path.join(repo_path, '.git')):
                    logger.info(f"Repository does not exist at {repo_path}. Will attempt to clone.")
                    
                    success = await clone_repository(settings, repo_path)
                    if success:
                        # If clone succeeded, get repository details
                        repo = Repo(repo_path)
                        current_sha = repo.head.commit.hexsha
                        current_branch = repo.active_branch.name
                        commit_message = repo.head.commit.message
                        commit_author = f"{repo.head.commit.author.name} <{repo.head.commit.author.email}>"
                        commit_date = datetime.fromtimestamp(repo.head.commit.committed_date, UTC)
                        
                        # Update repository state
                        await update_after_git_pull(
                            session=session,
                            repository_url=repo_url,
                            was_pulled=True,
                            current_sha=current_sha,
                            is_local_repo_valid=True,
                            current_branch=current_branch,
                            commit_message=commit_message,
                            commit_author=commit_author,
                            commit_date=commit_date
                        )
                        
                        changes_detected = True
                    else:
                        await set_sync_status(
                            session=session,
                            repository_url=repo_url,
                            status=SyncStatus.ERROR,
                            error_message="Failed to clone repository"
                        )
                else:
                    logger.info(f"Repository exists at {repo_path}. Checking for updates.")
                    
                    # Perform pull operation and get results
                    was_pulled, current_sha, previous_sha, pull_details = await pull_repository_changes(settings, repo_path)
                    
                    # Check if this is a fresh repository state
                    is_first_run = repo_state.commit_sha is None
                    
                    # Update database with results
                    await update_after_git_pull(
                        session=session,
                        repository_url=repo_url,
                        was_pulled=was_pulled,
                        current_sha=current_sha,
                        is_local_repo_valid=True,
                        current_branch=pull_details.get('current_branch'),
                        commit_message=pull_details.get('commit_message'),
                        commit_author=pull_details.get('commit_author'),
                        commit_date=pull_details.get('commit_date'),
                        error_message=pull_details.get('error')
                    )
                    
                    # Force changes_detected to True if this is first run after DB reset
                    changes_detected = was_pulled or is_first_run
                    if is_first_run:
                        logger.info("First run after database reset. Forcing full project scan.")
                
                # If changes were detected, trigger necessary actions
                if changes_detected:
                    logger.info("Changes detected in repository. Triggering sync actions...")
                    await process_repository_changes(repo_path, settings)
                else:
                    logger.info("No changes detected in repository. No action needed.")
            
            except Exception as e:
                logger.exception("Error updating repository state in database", exc_info=e)
                error_message = str(e)
                
                # Update sync status to error
                await set_sync_status(
                    session=session,
                    repository_url=repo_url,
                    status=SyncStatus.ERROR,
                    error_message=error_message
                )
                
        logger.info("Git repository polling completed.")
    except Exception as e:
        logger.exception("Error during Git repository polling", exc_info=e)


async def clone_repository(settings, repo_path):
    """
    Clone the repository to the specified path.
    
    Args:
        settings: Application settings with Git configuration
        repo_path: Path where the repository should be cloned
    
    Returns:
        bool: True if clone was successful, False otherwise
    """
    if not GIT_AVAILABLE:
        logger.error("GitPython library not available. Cannot clone repository.")
        return False
    
    try:
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(repo_path), exist_ok=True)
        
        # Get repository URL from settings
        repo_url = settings.git.REPO_URL
        
        # Determine authentication method
        auth_type = settings.git.AUTH_TYPE.lower()
        
        if auth_type == 'token' and settings.git.REPO_TOKEN:
            # Format URL with token
            if 'github.com' in repo_url:
                # GitHub format
                if 'https://' in repo_url:
                    auth_url = repo_url.replace('https://', f'https://{settings.git.REPO_TOKEN}@')
                else:
                    auth_url = f'https://{settings.git.REPO_TOKEN}@github.com/{repo_url.split("github.com/")[1]}'
        elif auth_type == 'password' and settings.git.REPO_PASSWORD:
            if 'https://' in repo_url:
                # Add username and password
                auth_url = repo_url.replace('https://', f'https://{settings.git.REPO_USERNAME}:{settings.git.REPO_PASSWORD}@')
        else:
            # No authentication info provided
            auth_url = repo_url
        
        logger.info(f"Cloning repository from {auth_url.split('@')[1] if '@' in auth_url else auth_url}")
        
        try:
            # Try authenticated clone first
            Repo.clone_from(auth_url, repo_path)
            logger.info(f"Repository successfully cloned to {repo_path}")
            return True
        except git.GitCommandError as e:
            if "Invalid username or password" in str(e) or "Authentication failed" in str(e):
                # Authentication failed, try without authentication for public repos
                logger.warning("Authentication failed, trying without credentials for public repository...")
                try:
                    # Try public URL without auth
                    Repo.clone_from(repo_url, repo_path)
                    logger.info(f"Repository successfully cloned to {repo_path} (public access)")
                    return True
                except Exception as e2:
                    logger.exception(f"Failed to clone repository without authentication", exc_info=e2)
                    return False
            else:
                # Some other error occurred
                raise
    except Exception as e:
        logger.exception(f"Failed to clone repository to {repo_path}", exc_info=e)
        return False


async def pull_repository_changes(settings, repo_path):
    """
    Pull changes from the remote repository.
    
    Args:
        settings: Application settings
        repo_path: Path to the local repository
    
    Returns:
        tuple: (was_pulled, current_sha, previous_sha, details)
            was_pulled: Whether changes were pulled
            current_sha: Current commit SHA
            previous_sha: Previous commit SHA
            details: Dictionary with additional details
    """
    if not GIT_AVAILABLE:
        logger.error("GitPython library not available. Cannot pull repository changes.")
        return False, None, None, {'error': 'GitPython not available'}
    
    details = {}
    
    try:
        # Open the repository
        repo = Repo(repo_path)
        
        # Get current HEAD SHA
        previous_sha = repo.head.commit.hexsha
        current_branch = repo.active_branch.name
        
        details['current_branch'] = current_branch
        details['commit_message'] = repo.head.commit.message
        details['commit_author'] = f"{repo.head.commit.author.name} <{repo.head.commit.author.email}>"
        details['commit_date'] = datetime.fromtimestamp(repo.head.commit.committed_date, UTC)
        
        logger.info(f"Current repository state: branch={current_branch}, sha={previous_sha[:8]}")
        
        # Set Git identity for potential merge conflict resolution
        repo.git.config('user.name', settings.git.REPO_USERNAME)
        repo.git.config('user.email', settings.git.REPO_EMAIL)
        
        # Fetch latest changes
        logger.info("Fetching latest changes from remote...")
        for remote in repo.remotes:
            remote.fetch()
        
        # Get remote tracking branch
        tracking_branch = repo.active_branch.tracking_branch()
        if not tracking_branch:
            logger.warning(f"Branch {current_branch} has no tracking branch. Setting up tracking.")
            # Set up tracking to origin/current_branch
            repo.git.branch(f"--set-upstream-to=origin/{current_branch}", current_branch)
            tracking_branch = repo.active_branch.tracking_branch()
        
        # Get remote HEAD SHA
        remote_sha = repo.git.rev_parse(tracking_branch.name)
        
        # Compare local and remote SHAs
        if previous_sha != remote_sha:
            logger.info(f"Repository is behind remote. Local: {previous_sha[:8]}, Remote: {remote_sha[:8]}")
            
            # Pull changes
            logger.info("Pulling changes from remote...")
            pull_info = repo.git.pull()
            
            # Get new HEAD SHA
            current_sha = repo.head.commit.hexsha
            
            # Update details with new commit info
            details['commit_message'] = repo.head.commit.message
            details['commit_author'] = f"{repo.head.commit.author.name} <{repo.head.commit.author.email}>"
            details['commit_date'] = datetime.fromtimestamp(repo.head.commit.committed_date, UTC)
            
            # Log changes
            commits_behind = list(repo.iter_commits(f"{previous_sha}..{current_sha}"))
            logger.info(f"Pulled {len(commits_behind)} commits. New HEAD: {current_sha[:8]}")
            
            # Log commit messages
            for commit in commits_behind:
                logger.info(f"Commit {commit.hexsha[:8]}: {commit.summary}")
            
            return True, current_sha, previous_sha, details
        else:
            logger.info("Repository is up to date with remote.")
            return False, previous_sha, previous_sha, details
    except git.GitCommandError as e:
        logger.exception(f"Git command error while pulling repository", exc_info=e)
        details['error'] = str(e)
        return False, None, None, details
    except Exception as e:
        logger.exception(f"Error pulling repository changes", exc_info=e)
        details['error'] = str(e)
        return False, None, None, details


async def process_repository_changes(repo_path, settings):
    """
    Process the changes in the repository and trigger necessary actions.
    
    Args:
        repo_path: Path to the repository
        settings: Application settings
    """
    try:
        logger.info("Processing repository changes...")
        
        # Create repository scanners
        project_scanner = ProjectScanner(repo_path)
        dataset_scanner = DatasetScanner(repo_path)
        
        # Scan for entities in the repository
        async for session in get_session():
            try:
                # Get repository state to access SHAs
                repo_url = settings.git.REPO_URL
                repo_state = await get_or_create_repository_state(
                    session=session,
                    repository_url=repo_url,
                    repository_path=repo_path
                )
                
                # Scan for entities using git diff if we have previous state
                previous_sha = None
                current_sha = None
                
                if repo_state:
                    previous_sha = repo_state.commit_sha
                    # Current SHA is obtained from the local repository
                    repo = Repo(repo_path)
                    current_sha = repo.head.commit.hexsha
                    
                # Scan the repository for projects
                projects = await project_scanner.scan_repository(
                    previous_sha=previous_sha,
                    current_sha=current_sha
                )
                
                if not projects:
                    logger.info("No projects found in the repository.")
                else:
                    logger.info(f"Found {len(projects)} projects in the repository.")
                    
                    # Reconcile projects with database
                    result = await project_scanner.reconcile_entities(session, projects)
                    logger.info(f"Project reconciliation: {result}")
                
                # Scan the repository for datasets
                datasets = await dataset_scanner.scan_repository(
                    previous_sha=previous_sha,
                    current_sha=current_sha
                )
                
                if not datasets:
                    logger.info("No datasets found in the repository.")
                else:
                    logger.info(f"Found {len(datasets)} datasets in the repository.")
                    
                    # Reconcile datasets with database
                    result = await dataset_scanner.reconcile_entities(session, datasets)
                    logger.info(f"Dataset reconciliation: {result}")
                
                logger.info("Repository changes processed successfully.")
                break
            except Exception as e:
                logger.exception("Error during entity reconciliation", exc_info=e)
        
    except Exception as e:
        logger.exception("Error processing repository changes", exc_info=e) 