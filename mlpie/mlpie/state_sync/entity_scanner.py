"""
Entity Scanner for Git Repositories.

Provides tools for efficiently scanning git repositories for entity definition files
using git diff to limit scanning to changed files.
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Type, TypeVar, Generic, Tuple

from git import Repo
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from mlpie.db.base import Base
from mlpie.state_sync.scanning_context import ScanningContext
from mlpie.schemas.yaml_utils import parse_entity_from_yaml
from mlpie.schemas.base import EntityBase

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
    
    def __init__(self, repo_path: str, context: Optional[ScanningContext] = None):
        """
        Initialize the scanner.
        
        Args:
            repo_path: Path to the repository
            context: Scanning context for hierarchical filtering
        """
        self.repo_path = repo_path
        self.context = context or ScanningContext()  # Use empty context if none provided
        
    async def scan_repository(self, 
                              session: AsyncSession,
                              previous_sha: Optional[str] = None, 
                              current_sha: Optional[str] = None) -> Tuple[List[T], Dict[str, List[Dict[str, str]]]]:
        """
        Scan the repository for entity definitions.
        
        If previous_sha and current_sha are provided, only scan files that changed
        between those commits. Otherwise, scan the entire repository.
        
        Args:
            session: Database session for validating references
            previous_sha: Previous commit SHA
            current_sha: Current commit SHA
            
        Returns:
            Tuple containing:
                - List of relevant entity instances
                - Dictionary of validation errors by file
        """
        # Section for scanning entities
        logger.section(f"{self.entity_name.capitalize()} Scanning")
        logger.info(f"Scanning repository for {self.entity_name} definitions...")
        logger.debug(f"Scanning context: project={self.context.project_name}, environment={self.context.environment_name}")
        
        validation_errors = {}
        
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
            filtered_out = 0
            for file_path in files_to_scan:
                try:
                    entity, errors = await self._parse_entity_file(file_path, session)
                    
                    if errors:
                        # Track validation errors
                        rel_path = os.path.relpath(file_path, self.repo_path)
                        validation_errors[rel_path] = errors
                        logger.warning(f"Validation errors in {rel_path}: {errors}")
                        continue
                        
                    if entity:
                        # Filter based on context
                        if self._is_entity_relevant(entity):
                            entities.append(entity)
                        else:
                            filtered_out += 1
                            logger.debug(f"Filtered out {self.entity_name} from {file_path} - not relevant to current context")
                except Exception as e:
                    logger.warning(f"Error parsing {self.entity_name} file {file_path}: {str(e)}")
                    # Track unexpected errors
                    rel_path = os.path.relpath(file_path, self.repo_path)
                    validation_errors[rel_path] = [{"error": "unexpected_error", "message": str(e)}]
            
            # Log summary information
            if validation_errors:
                error_count = len(validation_errors)
                logger.section(f"Validation Errors ({error_count})")
                logger.warning(f"Found {error_count} {self.entity_name} files with validation errors")
                
                for file_path, errors in validation_errors.items():
                    for error in errors:
                        error_type = error.get("error", "unknown")
                        error_msg = error.get("message", "No message provided")
                        logger.warning(f"  • {file_path}: [{error_type}] {error_msg}")
                
                logger.end_section()
                
            valid_count = len(entities)
            error_count = len(validation_errors)
            logger.info(f"Found {valid_count} valid and {error_count} invalid {self.entity_name} definitions (filtered out {filtered_out})")
            
            logger.end_section(success=True)
            return entities, validation_errors
            
        except Exception as e:
            logger.exception(f"Error scanning repository for {self.entity_name} definitions", exc_info=e)
            logger.end_section(success=False)
            return [], {f"scanner_error": [{"error": "Scanner error", "message": str(e)}]}
    
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
    
    async def _parse_entity_file(self, file_path: str, session: AsyncSession) -> Tuple[Optional[T], List[Dict[str, str]]]:
        """
        Parse an entity definition file using Pydantic models.
        
        Args:
            file_path: Path to the file
            session: Database session for reference validation
            
        Returns:
            Tuple containing:
                - Entity instance or None if the file doesn't define a valid entity
                - List of validation errors (empty if no errors)
        """
        # Use Pydantic model to parse the YAML file
        pydantic_entity, validation_errors = parse_entity_from_yaml(file_path)
        
        if validation_errors or not pydantic_entity:
            return None, validation_errors
            
        # Validate that this is the right entity type for this scanner
        if not self._validate_entity_type(pydantic_entity.kind, pydantic_entity.apiVersion):
            return None, []  # Not an error, just not the right entity type
        
        # Validate entity references
        reference_errors = await self._validate_entity_references(session, pydantic_entity, file_path)
        if reference_errors:
            return None, reference_errors
            
        # Convert Pydantic model to SQLAlchemy model
        if self.model_class:
            try:
                db_dict = pydantic_entity.to_db_dict()
                entity = self.model_class(**db_dict)
                return entity, []
            except Exception as e:
                return None, [{
                    "error": "db_model_error",
                    "message": f"Error converting to database model: {str(e)}"
                }]
        else:
            return None, [{
                "error": "model_class_error",
                "message": f"No model class defined for {self.entity_name} scanner"
            }]
    
    def _validate_entity_type(self, kind: str, api_version: str) -> bool:
        """
        Validate if this YAML defines our entity type.
        
        Args:
            kind: Entity kind
            api_version: API version
            
        Returns:
            True if this is our entity type, False otherwise
        """
        # Default implementation - subclasses should override
        return False
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned entities with the database.
        
        Args:
            session: Database session
            entities: List of entities
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with reconciliation results
        """
        # Default implementation - subclasses should override
        return {
            "scanned": len(entities),
            "updated": 0,
            "created": 0,
            "deleted": 0,
            "unchanged": 0,
            "skipped": 0,
            "validation_errors": len(validation_errors) if validation_errors else 0
        }
    
    def _is_entity_relevant(self, entity: T) -> bool:
        """
        Check if an entity is relevant to the current scanning context.
        
        Args:
            entity: Entity to check
            
        Returns:
            True if the entity is relevant, False otherwise
        """
        # Default implementation - all entities are relevant
        return True
        
    async def _validate_entity_references(self, session: AsyncSession, entity: EntityBase, file_path: str) -> List[Dict[str, str]]:
        """
        Validate references to other entities.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            List of validation errors, empty if no errors
        """
        # Default implementation - subclasses should override for entity-specific validation
        return []
                    

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
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned projects with database state.
        
        Args:
            session: Database session
            entities: List of projects found by scanning
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with counts of created/updated/deleted projects and errors
        """
        from mlpie.db.crud.project import reconcile_projects
        
        try:
            # Use the project reconciliation function
            result = await reconcile_projects(session, entities)
            
            # Add validation errors if any
            if validation_errors:
                result["validation_errors"] = len(validation_errors)
                result["invalid_files"] = list(validation_errors.keys())
                
            # Log detailed reconciliation results
            logger.info(f"Project reconciliation results:")
            if result.get("created", 0) > 0:
                logger.info(f"  • Created: {result['created']} new projects")
            if result.get("updated", 0) > 0:
                logger.info(f"  • Updated: {result['updated']} existing projects")
            if result.get("unchanged", 0) > 0:
                logger.info(f"  • Unchanged: {result['unchanged']} projects")
            if result.get("deleted", 0) > 0:
                logger.info(f"  • Deleted: {result['deleted']} projects")
            if result.get("validation_errors", 0) > 0:
                logger.warning(f"  • Skipped: {result['validation_errors']} files due to validation errors")
                
            return result
        except Exception as e:
            logger.exception("Error reconciling projects", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e),
                "validation_errors": len(validation_errors) if validation_errors else 0
            }

    async def _validate_entity_references(self, session: AsyncSession, entity: T, file_path: str) -> List[Dict[str, str]]:
        """
        Validate references to other entities.
        
        For projects, there are no references to validate.
        """
        return []


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
        Validate if this YAML defines a dataset.
        
        Args:
            kind: Kind field from YAML
            api_version: apiVersion field from YAML
            
        Returns:
            True if this is a dataset, False otherwise
        """
        return kind and kind.lower() == "dataset"
    
    async def _validate_entity_references(self, session: AsyncSession, entity: T, file_path: str) -> List[Dict[str, str]]:
        """
        Log entity references - actual validation is handled by foreign keys.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            Empty list as we rely on foreign keys for validation
        """
        rel_path = os.path.relpath(file_path, self.repo_path)
        
        # Just log the entity references
        if hasattr(entity, 'environment_name'):
            logger.debug(f"Dataset in {rel_path} references environment '{entity.environment_name}'")
        
        if hasattr(entity, 'project_name') and entity.project_name:
            logger.debug(f"Dataset in {rel_path} references project '{entity.project_name}'")
        
        # Return empty list as we rely on foreign keys
        return []
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned datasets with database state.
        
        Args:
            session: Database session
            entities: List of datasets found by scanning
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with counts of created/updated/deleted datasets and errors
        """
        from mlpie.db.crud.dataset import reconcile_datasets
        
        try:
            # Use the dataset reconciliation function
            result = await reconcile_datasets(session, entities)
            
            # Add validation errors if any
            if validation_errors:
                result["validation_errors"] = len(validation_errors)
                result["invalid_files"] = list(validation_errors.keys())
                
            # Log detailed reconciliation results
            logger.info(f"Dataset reconciliation results:")
            if result.get("created", 0) > 0:
                logger.info(f"  • Created: {result['created']} new datasets")
            if result.get("updated", 0) > 0:
                logger.info(f"  • Updated: {result['updated']} existing datasets")
            if result.get("unchanged", 0) > 0:
                logger.info(f"  • Unchanged: {result['unchanged']} datasets")
            if result.get("deleted", 0) > 0:
                logger.info(f"  • Deleted: {result['deleted']} datasets")
            if result.get("skipped", 0) > 0:
                logger.warning(f"  • Skipped: {result['skipped']} datasets due to reference validation failures")
            if result.get("validation_errors", 0) > 0:
                logger.warning(f"  • Skipped: {result['validation_errors']} files due to validation errors")
                
            return result
        except Exception as e:
            logger.exception("Error reconciling datasets", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e),
                "validation_errors": len(validation_errors) if validation_errors else 0
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
    
    async def _validate_entity_references(self, session: AsyncSession, entity: T, file_path: str) -> List[Dict[str, str]]:
        """
        Log entity references - actual validation is handled by foreign keys.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            Empty list as we rely on foreign keys for validation
        """
        rel_path = os.path.relpath(file_path, self.repo_path)
        
        # Just log the entity references
        if hasattr(entity, 'environment_name'):
            logger.debug(f"Pipeline in {rel_path} references environment '{entity.environment_name}'")
        
        if hasattr(entity, 'project_name') and entity.project_name:
            logger.debug(f"Pipeline in {rel_path} references project '{entity.project_name}'")
        
        # Return empty list as we rely on foreign keys
        return []
        
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned pipelines with database state.
        
        Args:
            session: Database session
            entities: List of pipelines found by scanning
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with counts of created/updated/deleted pipelines and errors
        """
        from mlpie.db.crud.pipeline import reconcile_pipelines
        
        try:
            # Use the pipeline reconciliation function
            result = await reconcile_pipelines(session, entities)
            
            # Add validation errors if any
            if validation_errors:
                result["validation_errors"] = len(validation_errors)
                result["invalid_files"] = list(validation_errors.keys())
                
            # Log detailed reconciliation results
            logger.info(f"Pipeline reconciliation results:")
            if result.get("created", 0) > 0:
                logger.info(f"  • Created: {result['created']} new pipelines")
            if result.get("updated", 0) > 0:
                logger.info(f"  • Updated: {result['updated']} existing pipelines")
            if result.get("unchanged", 0) > 0:
                logger.info(f"  • Unchanged: {result['unchanged']} pipelines")
            if result.get("deleted", 0) > 0:
                logger.info(f"  • Deleted: {result['deleted']} pipelines")
            if result.get("skipped", 0) > 0:
                logger.warning(f"  • Skipped: {result['skipped']} pipelines due to reference validation failures")
            if result.get("validation_errors", 0) > 0:
                logger.warning(f"  • Skipped: {result['validation_errors']} files due to validation errors")
                
            return result
        except Exception as e:
            logger.exception("Error reconciling pipelines", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e),
                "validation_errors": len(validation_errors) if validation_errors else 0
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
    
    async def _validate_entity_references(self, session: AsyncSession, entity: T, file_path: str) -> List[Dict[str, str]]:
        """
        Log entity references - actual validation is handled by foreign keys.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            Empty list as we rely on foreign keys for validation
        """
        rel_path = os.path.relpath(file_path, self.repo_path)
        
        # Just log the entity references
        if hasattr(entity, 'project_name') and entity.project_name:
            logger.debug(f"Environment in {rel_path} references project '{entity.project_name}'")
        
        # Return empty list as we rely on foreign keys
        return []
    
    async def reconcile_entities(self, 
                                session: AsyncSession, 
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned environments with database state.
        
        Args:
            session: Database session
            entities: List of environments found by scanning
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with counts of created/updated/deleted environments and errors
        """
        from mlpie.db.crud.environment import reconcile_environments
        
        try:
            # Use the environment reconciliation function
            result = await reconcile_environments(session, entities)
            
            # Add validation errors if any
            if validation_errors:
                result["validation_errors"] = len(validation_errors)
                result["invalid_files"] = list(validation_errors.keys())
                
            # Log detailed reconciliation results
            logger.info(f"Environment reconciliation results:")
            if result.get("created", 0) > 0:
                logger.info(f"  • Created: {result['created']} new environments")
            if result.get("updated", 0) > 0:
                logger.info(f"  • Updated: {result['updated']} existing environments")
            if result.get("unchanged", 0) > 0:
                logger.info(f"  • Unchanged: {result['unchanged']} environments")
            if result.get("deleted", 0) > 0:
                logger.info(f"  • Deleted: {result['deleted']} environments")
            if result.get("validation_errors", 0) > 0:
                logger.warning(f"  • Skipped: {result['validation_errors']} files due to validation errors")
                
            return result
        except Exception as e:
            logger.exception("Error reconciling environments", exc_info=e)
            return {
                "created": 0,
                "updated": 0,
                "error": str(e),
                "validation_errors": len(validation_errors) if validation_errors else 0
            } 