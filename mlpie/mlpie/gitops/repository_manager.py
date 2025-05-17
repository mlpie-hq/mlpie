"""
Repository Management Service.

This module provides functionality for managing Git repositories,
including cloning, authentication, and path management.
"""

import os
import logging
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union, List
from uuid import UUID

import git
from git import Repo

from mlpie.db.models.repository import Repository, AuthType, EntityType, SyncStatus
from mlpie.db.connection import get_session
from mlpie.config import get_config_manager
from sqlalchemy import text

logger = logging.getLogger(__name__)


class RepositoryManager:
    """
    Service for managing Git repositories.
    
    This service handles operations like repository cloning, authentication,
    path management, and repository inheritance.
    """
    
    def __init__(self):
        """Initialize the repository manager."""
        self.config_manager = get_config_manager()
        self.settings = self.config_manager.get_root_settings()
        self.base_repo_path = getattr(self.settings, 'REPOSITORIES_BASE_PATH', 
                                    os.path.join(os.getcwd(), 'repos'))
        
        # Create base directory if it doesn't exist
        os.makedirs(self.base_repo_path, exist_ok=True)
        
    def get_local_path(self, repository: Repository) -> str:
        """
        Generate a unique local path for a repository.
        
        This function ensures that repositories with the same URL but different
        owners get unique local paths to avoid conflicts.
        
        Args:
            repository: Repository object
            
        Returns:
            String path where the repository should be cloned
        """
        # Create a unique identifier based on URL and entity info
        unique_id = f"{repository.url}:{repository.entity_type}:{repository.entity_id}"
        # Hash it to create a directory name - use first 10 chars of hash
        dir_hash = hashlib.md5(unique_id.encode()).hexdigest()[:10]
        
        # Extract repo name from URL
        repo_name = repository.url.split('/')[-1]
        if repo_name.endswith('.git'):
            repo_name = repo_name[:-4]
            
        # Create path: base_path/entity_type/entity_id/repo_name-hash
        entity_type_dir = repository.entity_type.lower()
        entity_id = repository.entity_id or 'unknown'
        
        if entity_type_dir == EntityType.MASTER.lower():
            # Master repo has a special path
            return os.path.join(self.base_repo_path, 'master', f"{repo_name}-{dir_hash}")
        else:
            return os.path.join(self.base_repo_path, entity_type_dir, entity_id, f"{repo_name}-{dir_hash}")
            
    async def get_auth_url(self, repository: Repository) -> str:
        """
        Get the authenticated URL for a repository.
        
        This function handles different authentication methods and returns
        a URL that includes authentication information if needed.
        
        Args:
            repository: Repository object
            
        Returns:
            URL with authentication information if needed
        """
        repo_url = repository.url
        auth_type = repository.auth_type
        
        if auth_type == AuthType.NONE:
            # No authentication needed
            return repo_url
            
        elif auth_type == AuthType.USE_MASTER:
            # Use master repository credentials - needs to retrieve master repo
            master_repo = await self.get_master_repository()
            if master_repo:
                # Use a temporary repository object with master auth info but original URL
                temp_repo = Repository(
                    url=repo_url,
                    auth_type=master_repo.auth_type,
                    secret_ref=master_repo.secret_ref,
                    token_secret_key=master_repo.token_secret_key,
                    username_secret_key=master_repo.username_secret_key,
                    password_secret_key=master_repo.password_secret_key,
                    ssh_key_secret_key=master_repo.ssh_key_secret_key
                )
                return await self.get_auth_url(temp_repo)
            else:
                logger.warning("USE_MASTER auth type specified but no master repository found")
                return repo_url
                
        elif auth_type == AuthType.TOKEN:
            # Token-based authentication
            token = await self.get_secret_value(repository.secret_ref, repository.token_secret_key)
            if not token:
                logger.warning(f"No token found for repository {repo_url}")
                return repo_url
                
            # Add token to URL
            if 'github.com' in repo_url:
                if repo_url.startswith('https://'):
                    return repo_url.replace('https://', f'https://{token}@')
                else:
                    return f'https://{token}@github.com/{repo_url.split("github.com/")[1]}'
            elif 'gitlab.com' in repo_url:
                if repo_url.startswith('https://'):
                    return repo_url.replace('https://', f'https://oauth2:{token}@')
                else:
                    return f'https://oauth2:{token}@gitlab.com/{repo_url.split("gitlab.com/")[1]}'
            else:
                # Generic approach - might not work for all Git providers
                if repo_url.startswith('https://'):
                    return repo_url.replace('https://', f'https://{token}@')
                else:
                    logger.warning(f"Cannot apply token auth to non-HTTPS URL: {repo_url}")
                    return repo_url
                    
        elif auth_type == AuthType.USERNAME_PASSWORD:
            # Username and password authentication
            username = await self.get_secret_value(repository.secret_ref, repository.username_secret_key)
            password = await self.get_secret_value(repository.secret_ref, repository.password_secret_key)
            
            if not username or not password:
                logger.warning(f"Incomplete credentials for repository {repo_url}")
                return repo_url
                
            # Add username and password to URL
            if repo_url.startswith('https://'):
                parts = repo_url.split('https://')
                return f'https://{username}:{password}@{parts[1]}'
            else:
                logger.warning(f"Cannot apply username/password auth to non-HTTPS URL: {repo_url}")
                return repo_url
                
        elif auth_type == AuthType.SSH_KEY:
            # SSH key authentication
            # We don't modify the URL for SSH key auth, as it's handled by the SSH agent
            if not repo_url.startswith('git@'):
                logger.warning(f"SSH key auth specified but URL is not SSH: {repo_url}")
            return repo_url
            
        else:
            logger.warning(f"Unknown auth type: {auth_type}")
            return repo_url
    
    async def get_secret_value(self, secret_ref: Optional[str], secret_key: Optional[str]) -> Optional[str]:
        """
        Get a secret value from the secret store.
        
        Args:
            secret_ref: Name of the secret
            secret_key: Key within the secret
            
        Returns:
            Secret value or None if not found
        """
        if not secret_ref or not secret_key:
            return None
            
        # In the future, this will use a proper secrets management system
        # For now, we'll use a simple implementation that reads from settings
        secret_value = None
        
        # Check if we have secrets in settings
        if hasattr(self.settings, 'secrets') and secret_ref in self.settings.secrets:
            secret = self.settings.secrets.get(secret_ref)
            if secret and secret_key in secret:
                secret_value = secret.get(secret_key)
                
        return secret_value
            
    async def clone_repository(self, repository: Repository) -> Tuple[bool, Optional[str]]:
        """
        Clone a repository to its local path.
        
        Args:
            repository: Repository object
            
        Returns:
            Tuple of (success, error_message)
        """
        if not repository.local_path:
            repository.local_path = self.get_local_path(repository)
            
        # Check if repository already exists
        if os.path.exists(os.path.join(repository.local_path, '.git')):
            logger.info(f"Repository already exists at {repository.local_path}")
            return True, None
            
        # Create parent directory if needed
        os.makedirs(os.path.dirname(repository.local_path), exist_ok=True)
        
        try:
            # Get authenticated URL
            auth_url = await self.get_auth_url(repository)
            
            # Hide sensitive info in logs
            log_url = auth_url
            if '@' in auth_url:
                # Only show domain part
                log_url = f"https://***:***@{auth_url.split('@', 1)[1]}"
                
            logger.info(f"Cloning repository from {log_url} to {repository.local_path}")
            
            # Clone repository
            Repo.clone_from(auth_url, repository.local_path, branch=repository.ref)
            logger.info(f"Repository successfully cloned to {repository.local_path}")
            
            return True, None
            
        except git.GitCommandError as e:
            error_msg = str(e)
            
            # Try without authentication if this is an auth error
            if "authentication failed" in error_msg.lower() or "could not read username" in error_msg.lower():
                try:
                    logger.warning("Authentication failed, trying without credentials for public repository...")
                    Repo.clone_from(repository.url, repository.local_path, branch=repository.ref)
                    logger.info(f"Repository successfully cloned to {repository.local_path} (public access)")
                    return True, None
                except Exception as e2:
                    logger.exception(f"Failed to clone repository without authentication", exc_info=e2)
                    return False, f"Authentication failed and public access failed: {str(e2)}"
            
            logger.exception(f"Failed to clone repository", exc_info=e)
            return False, str(e)
            
        except Exception as e:
            logger.exception(f"Unexpected error cloning repository", exc_info=e)
            return False, str(e)
            
    async def pull_repository(self, repository: Repository) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
        """
        Pull changes from a repository.
        
        Args:
            repository: Repository object
            
        Returns:
            Tuple of (success, error_message, current_sha, previous_sha)
        """
        if not repository.local_path:
            repository.local_path = self.get_local_path(repository)
            
        # Check if repository exists
        if not os.path.exists(os.path.join(repository.local_path, '.git')):
            logger.warning(f"Repository does not exist at {repository.local_path}, cannot pull")
            return False, "Repository not cloned", None, None
            
        try:
            # Open repository
            repo = Repo(repository.local_path)
            
            # Get current SHA before pull
            previous_sha = repo.head.commit.hexsha
            
            # Set git identity for potential merge conflicts
            username = await self.get_secret_value(repository.secret_ref, repository.username_secret_key) or "mlpie-system"
            email = "mlpie-system@example.com"  # Default email
            repo.git.config('user.name', username)
            repo.git.config('user.email', email)
                
            # Fetch from origin
            origin = repo.remotes.origin
            origin.fetch()
            
            # Get tracking branch
            tracking_branch = repo.active_branch.tracking_branch()
            if not tracking_branch:
                # Set up tracking
                branch = repo.active_branch.name
                repo.git.branch(f"--set-upstream-to=origin/{branch}", branch)
                tracking_branch = repo.active_branch.tracking_branch()
                
            # Get remote SHA
            remote_sha = repo.git.rev_parse(tracking_branch.name)
            
            # If we're behind, pull changes
            if previous_sha != remote_sha:
                logger.info(f"Repository is behind remote. Local: {previous_sha[:8]}, Remote: {remote_sha[:8]}")
                repo.git.pull()
                current_sha = repo.head.commit.hexsha
                
                # Log changes
                commits_behind = list(repo.iter_commits(f"{previous_sha}..{current_sha}"))
                logger.info(f"Pulled {len(commits_behind)} commits. New HEAD: {current_sha[:8]}")
                
                return True, None, current_sha, previous_sha
            else:
                logger.info("Repository is up to date with remote")
                return False, None, previous_sha, previous_sha
                
        except git.GitCommandError as e:
            logger.exception(f"Git command error while pulling repository", exc_info=e)
            return False, str(e), None, None
            
        except Exception as e:
            logger.exception(f"Unexpected error pulling repository", exc_info=e)
            return False, str(e), None, None
    
    async def get_master_repository(self) -> Optional[Repository]:
        """
        Get the master repository.
        
        This is a singleton repository for the whole application.
        
        Returns:
            Repository object or None if not found
        """
        async for session in get_session():
            try:
                # Query for master repository
                result = await session.execute(
                    text("SELECT * FROM repositories WHERE entity_type = :entity_type LIMIT 1"),
                    {"entity_type": "master"}
                )
                master_repo_row = result.fetchone()
                
                if master_repo_row:
                    # Convert row to Repository object
                    master_repo = Repository()
                    for key, value in master_repo_row.items():
                        setattr(master_repo, key, value)
                    
                    return master_repo
                else:
                    # Check if master repo is defined in settings
                    if (hasattr(self.settings, 'git') and 
                        hasattr(self.settings.git, 'REPO_URL')):
                        # Create a master repository from settings
                        master_repo = Repository(
                            entity_type=EntityType.MASTER.value,
                            entity_id="master",
                            url=self.settings.git.REPO_URL,
                            ref=getattr(self.settings.git, 'REPO_BRANCH', 'main'),
                            name="Master Repository",
                            auth_type=AuthType(getattr(self.settings.git, 'AUTH_TYPE', 'none').lower()),
                            secret_ref=None  # No secret reference for now
                        )
                        
                        # Set token or username/password if provided
                        if hasattr(self.settings.git, 'REPO_TOKEN'):
                            master_repo.token_secret_key = 'token'
                        elif hasattr(self.settings.git, 'REPO_USERNAME'):
                            master_repo.username_secret_key = 'username'
                            master_repo.password_secret_key = 'password'
                            
                        # Add to database
                        session.add(master_repo)
                        await session.commit()
                        
                        return master_repo
                    
                    return None
            except Exception as e:
                logger.exception("Error getting master repository", exc_info=e)
                return None
            
    async def get_repositories_for_entity(self, entity_type: str, entity_id: str) -> List[Repository]:
        """
        Get all repositories for a specific entity.
        
        Args:
            entity_type: Type of entity (project, environment, etc.)
            entity_id: ID of the entity
            
        Returns:
            List of Repository objects
        """
        repositories = []
        
        async for session in get_session():
            try:
                # Query for repositories by entity
                result = await session.execute(
                    text("SELECT * FROM repositories WHERE entity_type = :entity_type AND entity_id = :entity_id"),
                    {"entity_type": entity_type, "entity_id": entity_id}
                )
                repo_rows = result.fetchall()
                
                # Convert rows to Repository objects
                for row in repo_rows:
                    repo = Repository()
                    for key, value in row.items():
                        setattr(repo, key, value)
                    repositories.append(repo)
                    
                return repositories
            except Exception as e:
                logger.exception(f"Error getting repositories for {entity_type} {entity_id}", exc_info=e)
                return []
            
    async def get_repository_for_resource(
        self,
        resource_type: str,
        resource_id: str,
        environment_id: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> Optional[Repository]:
        """
        Get the appropriate repository for a resource based on inheritance rules.
        
        The lookup order is:
        1. Environment's resource-specific repositories
        2. Environment's general repository
        3. Project's resource-specific repositories
        4. Project's general repository
        5. Master repository
        
        Args:
            resource_type: Type of resource ("dataset", "pipeline", etc.)
            resource_id: ID of the resource
            environment_id: ID of the environment (optional)
            project_name: Name of the project (optional)
            
        Returns:
            Repository object or None if not found
        """
        # First check environment-level repositories if environment_id is provided
        if environment_id:
            # Get all environment repositories
            env_repos = await self.get_repositories_for_entity(EntityType.ENVIRONMENT.value, environment_id)
            
            # Look for a resource-specific repository
            for repo in env_repos:
                if repo.manages_resource_type(resource_type):
                    logger.info(f"Found environment-level repository for {resource_type} {resource_id}")
                    return repo
                    
        # If no environment repo or no environment specified, try project-level
        if project_name:
            # Get all project repositories
            project_repos = await self.get_repositories_for_entity(EntityType.PROJECT.value, project_name)
            
            # Look for a resource-specific repository
            for repo in project_repos:
                if repo.manages_resource_type(resource_type):
                    logger.info(f"Found project-level repository for {resource_type} {resource_id}")
                    return repo
                    
        # If no project repo or no project specified, use master repo
        master_repo = await self.get_master_repository()
        if master_repo:
            logger.info(f"Using master repository for {resource_type} {resource_id}")
            return master_repo
            
        # No repository found
        logger.warning(f"No repository found for {resource_type} {resource_id}")
        return None

    async def find_repository_for_resource(
        self,
        resource_type: str,
        resource_id: str,
        resource_spec: Optional[Dict[str, Any]] = None,
        environment_id: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> Tuple[Optional[Repository], Optional[str]]:
        """
        Find the appropriate repository for a resource with enhanced resolution rules.
        
        This method implements a multi-level repository resolution strategy:
        1. Resource's own repository specification (if exists in resource_spec)
        2. Environment's resource-specific repository
        3. Project's resource-specific repository
        4. Master repository
        
        Args:
            resource_type: Type of resource ("dataset", "pipeline", etc.)
            resource_id: ID of the resource
            resource_spec: Resource specification (optional)
            environment_id: ID of the environment (optional)
            project_name: Name of the project (optional)
            
        Returns:
            Tuple of (Repository object, path within repository) or (None, None) if not found
        """
        # Check if the resource defines its own repository
        if resource_spec and "repository" in resource_spec:
            repo_spec = resource_spec.get("repository")
            if isinstance(repo_spec, dict) and "url" in repo_spec:
                logger.info(f"Resource {resource_id} has its own repository specification")
                # Create a temporary repository object - we don't save this to DB
                temp_repo = Repository(
                    url=repo_spec.get("url"),
                    ref=repo_spec.get("ref", "main"),
                    path_in_repo=repo_spec.get("path"),
                    auth_type=repo_spec.get("auth", {}).get("type", AuthType.NONE),
                    entity_type=EntityType.MASTER.value,  # Temporary value
                    entity_id="temp",  # Temporary value
                    resource_types=[resource_type]
                )
                return temp_repo, repo_spec.get("path")
        
        # Try the hierarchical resolution logic
        repo = await self.get_repository_for_resource(
            resource_type=resource_type,
            resource_id=resource_id,
            environment_id=environment_id,
            project_name=project_name
        )
        
        if repo:
            return repo, repo.path_in_repo
        
        return None, None


# Global instance
_repository_manager = None


def get_repository_manager() -> RepositoryManager:
    """Get the repository manager instance."""
    global _repository_manager
    if _repository_manager is None:
        _repository_manager = RepositoryManager()
    return _repository_manager 