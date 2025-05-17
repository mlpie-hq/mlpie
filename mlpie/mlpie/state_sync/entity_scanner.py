"""
Entity Scanner for Git Repositories.

Provides tools for efficiently scanning git repositories for entity definition files
using git diff to limit scanning to changed files.
"""

import os
import logging
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional, Type, TypeVar, Generic

from git import Repo
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.base import Base

logger = logging.getLogger(__name__)

# Type variable for entity models
T = TypeVar('T', bound=Base)


class EntityScanner(Generic[T]):
    """
    Base class for scanning repositories for entity definition files.
    
    This scanner uses git diff to efficiently find changes between commits,
    only scanning files that have been modified.
    """
    
    # Class variables to be defined by subclasses
    entity_name: str = "entity"
    file_patterns: List[str] = ["*.yaml", "*.yml"]
    model_class: Type[T] = None
    
    def __init__(self, repo_path: str):
        """
        Initialize the scanner.
        
        Args:
            repo_path: Path to the repository
        """
        self.repo_path = repo_path
        
    async def scan_repository(self, 
                              previous_sha: Optional[str] = None, 
                              current_sha: Optional[str] = None) -> List[T]:
        """
        Scan the repository for entity definitions.
        
        If previous_sha and current_sha are provided, only scan files that changed
        between those commits. Otherwise, scan the entire repository.
        
        Args:
            previous_sha: Previous commit SHA
            current_sha: Current commit SHA
            
        Returns:
            List of entity instances
        """
        logger.info(f"Scanning repository for {self.entity_name} definitions...")
        
        try:
            if previous_sha and current_sha and previous_sha != current_sha:
                # Scan only changed files
                files_to_scan = self._get_changed_files(previous_sha, current_sha)
                logger.info(f"Found {len(files_to_scan)} changed files to scan")
            else:
                # Scan all matching files in the repository
                files_to_scan = self._get_all_matching_files()
                logger.info(f"Found {len(files_to_scan)} files to scan")
            
            # Parse entity files
            entities = []
            for file_path in files_to_scan:
                try:
                    entity = self._parse_entity_file(file_path)
                    if entity:
                        entities.append(entity)
                except Exception as e:
                    logger.warning(f"Error parsing {self.entity_name} file {file_path}: {str(e)}")
            
            logger.info(f"Found {len(entities)} {self.entity_name} definitions")
            return entities
            
        except Exception as e:
            logger.exception(f"Error scanning repository for {self.entity_name} definitions", exc_info=e)
            return []
    
    def _get_changed_files(self, previous_sha: str, current_sha: str) -> List[str]:
        """
        Get files that changed between commits and match our patterns.
        
        Args:
            previous_sha: Previous commit SHA
            current_sha: Current commit SHA
            
        Returns:
            List of file paths
        """
        try:
            repo = Repo(self.repo_path)
            
            # Get list of changed files
            diff_index = repo.git.diff("--name-only", previous_sha, current_sha).splitlines()
            
            # Filter for matching file patterns
            matching_files = []
            for file_path in diff_index:
                full_path = os.path.join(self.repo_path, file_path)
                if self._matches_file_patterns(full_path):
                    matching_files.append(full_path)
            
            return matching_files
            
        except Exception as e:
            logger.exception("Error getting changed files from git", exc_info=e)
            return []
    
    def _get_all_matching_files(self) -> List[str]:
        """
        Get all files in the repository that match our patterns.
        
        Returns:
            List of file paths
        """
        matching_files = []
        
        for root, dirs, files in os.walk(self.repo_path):
            # Skip .git directory
            if '.git' in dirs:
                dirs.remove('.git')
                
            for file in files:
                full_path = os.path.join(root, file)
                if self._matches_file_patterns(full_path):
                    matching_files.append(full_path)
        
        return matching_files
    
    def _matches_file_patterns(self, file_path: str) -> bool:
        """
        Check if a file path matches any of our patterns.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if the file matches, False otherwise
        """
        path = Path(file_path)
        return any(path.match(pattern) for pattern in self.file_patterns)
    
    def _parse_entity_file(self, file_path: str) -> Optional[T]:
        """
        Parse an entity definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Entity instance or None if the file doesn't define a valid entity
        """
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                return None
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                return None
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None
                
            # Create entity from spec
            if hasattr(self.model_class, 'from_yaml_spec'):
                return self.model_class.from_yaml_spec(content, source_path=rel_path)
            else:
                logger.warning(f"Model class {self.model_class.__name__} missing from_yaml_spec method")
                return None
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Error processing entity file {file_path}", exc_info=e)
            return None
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Validate if this YAML defines our entity type.
        
        Subclasses should override this to check for specific kind/apiVersion.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is our entity type, False otherwise
        """
        return False
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T]) -> Dict[str, int]:
        """
        Reconcile scanned entities with database state.
        
        This method should be implemented by subclasses to handle 
        entity-specific reconciliation logic.
        
        Args:
            session: Database session
            entities: List of entities found by scanning
            
        Returns:
            Dictionary with counts of created/updated/deleted entities
        """
        raise NotImplementedError("Subclasses must implement reconcile_entities")


class ProjectScanner(EntityScanner):
    """
    Scanner for Project definitions.
    """
    
    entity_name = "project"
    file_patterns = ["**/projects/*.yaml", "**/projects/*.yml"]
    
    def __init__(self, repo_path: str):
        from mlpie.db.models.project import Project
        super().__init__(repo_path)
        self.model_class = Project
        self.repository = None  # Will be set by caller if scanning from a specific repository
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Validate if this YAML defines a project.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is a project, False otherwise
        """
        return kind and kind.lower() == "project"
    
    def _parse_entity_file(self, file_path: str) -> Optional[T]:
        """
        Parse a project definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Project instance or None if the file doesn't define a valid project
        """
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                return None
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                return None
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None
                
            # If we're scanning from a repository, extract repository info to store with project
            source_repo_url = None
            source_repo_path = None
            
            if hasattr(self, "repository") and self.repository:
                source_repo_url = self.repository.url
                source_repo_path = self.repository.path_in_repo
            
            # Create project from spec
            project = self.model_class.from_yaml_spec(
                content, 
                source_path=rel_path
            )
            
            # Store repository info as attributes
            if project and source_repo_url:
                project.source_repository_url = source_repo_url
                project.source_repository_path = source_repo_path
                
            return project
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Error processing project file {file_path}", exc_info=e)
            return None
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T]) -> Dict[str, int]:
        """
        Reconcile scanned projects with database state.
        
        Args:
            session: Database session
            entities: List of projects found by scanning
            
        Returns:
            Dictionary with counts of created/updated/deleted projects
        """
        from mlpie.db.crud.project import reconcile_projects
        
        try:
            # Use the project reconciliation function
            return await reconcile_projects(session, entities)
        except Exception as e:
            logger.exception("Error reconciling projects", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e)
            }


class DatasetScanner(EntityScanner):
    """
    Scanner for Dataset definitions.
    """
    
    entity_name = "dataset"
    file_patterns = ["**/datasets/*.yaml", "**/datasets/*.yml"]
    
    def __init__(self, repo_path: str):
        from mlpie.db.models.dataset import Dataset
        super().__init__(repo_path)
        self.model_class = Dataset
        self.repository = None  # Will be set by caller if scanning from a specific repository
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Check if this is a Dataset definition.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is a Dataset, False otherwise
        """
        return kind == "Dataset" and api_version.startswith("mlpie.ai/")
    
    def _parse_entity_file(self, file_path: str) -> Optional[T]:
        """
        Parse a dataset definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dataset instance or None if the file doesn't define a valid dataset
        """
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                return None
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                return None
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None
                
            # If we're scanning from a repository, extract repository info to store with dataset
            source_repo_url = None
            source_repo_path = None
            
            if hasattr(self, "repository") and self.repository:
                source_repo_url = self.repository.url
                source_repo_path = self.repository.path_in_repo
            
            # Create dataset from spec
            return self.model_class.from_yaml_spec(
                content, 
                source_path=rel_path,
                source_repo_url=source_repo_url,
                source_repo_path=source_repo_path
            )
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Error processing dataset file {file_path}", exc_info=e)
            return None
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T]) -> Dict[str, int]:
        """
        Reconcile scanned datasets with database state.
        
        Args:
            session: Database session
            entities: List of datasets found by scanning
            
        Returns:
            Dictionary with counts of created/updated/deleted datasets
        """
        from mlpie.db.crud.dataset import reconcile_datasets
        
        try:
            # Use the dataset reconciliation function
            return await reconcile_datasets(session, entities)
        except Exception as e:
            logger.exception("Error reconciling datasets", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e)
            }


class PipelineScanner(EntityScanner):
    """
    Scanner for Pipeline definitions.
    """
    
    entity_name = "pipeline"
    file_patterns = ["**/pipelines/*.yaml", "**/pipelines/*.yml"]
    
    def __init__(self, repo_path: str):
        from mlpie.db.models.pipeline import Pipeline
        super().__init__(repo_path)
        self.model_class = Pipeline
        self.repository = None  # Will be set by caller if scanning from a specific repository
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Validate if this YAML defines a pipeline.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is a pipeline, False otherwise
        """
        return kind and kind.lower() == "pipeline"
    
    def _parse_entity_file(self, file_path: str) -> Optional[T]:
        """
        Parse a pipeline definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Pipeline instance or None if the file doesn't define a valid pipeline
        """
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                return None
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                return None
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None
            
            # If we're scanning from a repository, extract repository info to store with pipeline
            source_repo_url = None
            source_repo_path = None
            
            if hasattr(self, "repository") and self.repository:
                source_repo_url = self.repository.url
                source_repo_path = self.repository.path_in_repo
            
            # Create pipeline from spec
            return self.model_class.from_yaml_spec(
                content, 
                source_path=rel_path,
                source_repo_url=source_repo_url,
                source_repo_path=source_repo_path
            )
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Error processing pipeline file {file_path}", exc_info=e)
            return None
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T]) -> Dict[str, int]:
        """
        Reconcile scanned pipelines with database state.
        
        Args:
            session: Database session
            entities: List of pipelines found by scanning
            
        Returns:
            Dictionary with counts of created/updated/deleted pipelines
        """
        from mlpie.db.crud.pipeline import reconcile_pipelines
        
        try:
            # Use the pipeline reconciliation function
            return await reconcile_pipelines(session, entities)
        except Exception as e:
            logger.exception("Error reconciling pipelines", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e)
            }


class EnvironmentScanner(EntityScanner):
    """
    Scanner for Environment definitions.
    """
    
    entity_name = "environment"
    file_patterns = ["**/environments/*.yaml", "**/environments/*.yml"]
    
    def __init__(self, repo_path: str):
        from mlpie.db.models.environment import Environment
        super().__init__(repo_path)
        self.model_class = Environment
        self.repository = None  # Will be set by caller if scanning from a specific repository
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Validate if this YAML defines an environment.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is an environment, False otherwise
        """
        return kind and kind.lower() == "environment"
    
    def _parse_entity_file(self, file_path: str) -> Optional[T]:
        """
        Parse an environment definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Environment instance or None if the file doesn't define a valid environment
        """
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                return None
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                return None
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None
                
            # If we're scanning from a repository, extract repository info to store with environment
            source_repo_url = None
            source_repo_path = None
            
            if hasattr(self, "repository") and self.repository:
                source_repo_url = self.repository.url
                source_repo_path = self.repository.path_in_repo
            
            # Create environment from spec
            environment = self.model_class.from_yaml_spec(
                content, 
                source_path=rel_path
            )
            
            # Store repository info
            if environment and source_repo_url:
                environment.source_repository_url = source_repo_url
                environment.source_repository_path = source_repo_path
                
            return environment
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Error processing environment file {file_path}", exc_info=e)
            return None
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T]) -> Dict[str, int]:
        """
        Reconcile scanned environments with database state.
        
        Args:
            session: Database session
            entities: List of environments found by scanning
            
        Returns:
            Dictionary with counts of created/updated/deleted environments
        """
        from mlpie.db.crud.environment import reconcile_environments
        
        try:
            # Use the environment reconciliation function
            return await reconcile_environments(session, entities)
        except Exception as e:
            logger.exception("Error reconciling environments", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e)
            } 