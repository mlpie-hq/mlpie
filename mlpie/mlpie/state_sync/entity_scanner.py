"""
Entity Scanner for Git Repositories.

Provides tools for efficiently scanning git repositories for entity definition files
using git diff to limit scanning to changed files.
"""

import os
import logging
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional, Type, TypeVar, Generic, Tuple

from git import Repo
from sqlalchemy.ext.asyncio import AsyncSession

from mlpie.db.base import Base
from mlpie.state_sync.scanning_context import ScanningContext

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
                    entity, errors = self._parse_entity_file(file_path)
                    if errors:
                        # Track validation errors
                        rel_path = os.path.relpath(file_path, self.repo_path)
                        validation_errors[rel_path] = errors
                        logger.warning(f"Validation errors in {rel_path}: {errors}")
                        continue
                        
                    if entity:
                        # Filter based on context
                        if self._is_entity_relevant(entity):
                            # Validate references to other entities
                            reference_errors = await self._validate_entity_references(session, entity, file_path)
                            if reference_errors:
                                rel_path = os.path.relpath(file_path, self.repo_path)
                                validation_errors[rel_path] = reference_errors
                                continue
                            
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
    
    def _parse_entity_file(self, file_path: str) -> Tuple[Optional[T], List[Dict[str, str]]]:
        """
        Parse an entity definition file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Tuple containing:
                - Entity instance or None if the file doesn't define a valid entity
                - List of validation errors (empty if no errors)
        """
        validation_errors = []
        
        try:
            # Get relative path from repo root
            rel_path = os.path.relpath(file_path, self.repo_path)
            
            # Load YAML file
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                
            # Validate basic structure
            if not content:
                logger.debug(f"Empty YAML file: {rel_path}")
                validation_errors.append({"error": "empty_file", "message": "File is empty or contains no YAML content"})
                return None, validation_errors
                
            if not isinstance(content, dict):
                logger.warning(f"Invalid YAML structure in {rel_path}: not a dictionary")
                validation_errors.append({"error": "invalid_structure", "message": "YAML must define a dictionary/object"})
                return None, validation_errors
                
            # Check for expected K8s-like structure
            kind = content.get('kind')
            api_version = content.get('apiVersion')
            
            if not kind:
                validation_errors.append({"error": "missing_kind", "message": "Required field 'kind' is missing"})
                return None, validation_errors
                
            if not api_version:
                validation_errors.append({"error": "missing_api_version", "message": "Required field 'apiVersion' is missing"})
                return None, validation_errors
                
            if not self._validate_entity_type(kind, api_version):
                # Not our entity type or missing required fields
                return None, []  # No validation errors, just not relevant
                
            # Validate references in the spec
            spec = content.get('spec', {})
            
            # Check for environment reference
            if kind.lower() in ["pipeline", "dataset"]:
                env_ref = spec.get("environmentRef")
                if not (env_ref and isinstance(env_ref, dict) and env_ref.get("name")):
                    validation_errors.append({
                        "error": "missing_environment_ref", 
                        "message": f"{kind} requires environmentRef.name in K8s reference format"
                    })
                    return None, validation_errors
                
            # Check for project reference
            project_ref = spec.get("projectRef")
            if project_ref:
                if not (isinstance(project_ref, dict) and project_ref.get("name")):
                    validation_errors.append({
                        "error": "invalid_project_ref", 
                        "message": f"projectRef must use K8s reference format with name field"
                    })
                    return None, validation_errors
                
            # Create entity from spec
            try:
                if hasattr(self.model_class, 'from_yaml_spec'):
                    # Get repository info if applicable
                    source_repo_url = None
                    source_repo_path = None
                    
                    if hasattr(self, "repository") and self.repository:
                        source_repo_url = self.repository.url
                        source_repo_path = self.repository.path_in_repo
                    
                    # Check what parameters the from_yaml_spec method accepts
                    import inspect
                    from_yaml_spec_params = inspect.signature(self.model_class.from_yaml_spec).parameters
                    
                    # Create kwargs dict based on accepted parameters
                    kwargs = {'spec_dict': content, 'source_path': rel_path}
                    
                    # Only add source repository parameters if the method accepts them
                    if 'source_repo_url' in from_yaml_spec_params and source_repo_url:
                        kwargs['source_repo_url'] = source_repo_url
                    if 'source_repo_path' in from_yaml_spec_params and source_repo_path:
                        kwargs['source_repo_path'] = source_repo_path
                    
                    # Create entity from spec with appropriate parameters
                    entity = self.model_class.from_yaml_spec(**kwargs)
                    
                    # If entity doesn't have repository info but we have it, try to set it directly
                    if entity and source_repo_url:
                        if hasattr(entity, 'source_repository_url') and 'source_repo_url' not in from_yaml_spec_params:
                            entity.source_repository_url = source_repo_url
                        if hasattr(entity, 'source_repository_path') and 'source_repo_path' not in from_yaml_spec_params:
                            entity.source_repository_path = source_repo_path
                    
                    return entity, []
                else:
                    logger.warning(f"Model class {self.model_class.__name__} missing from_yaml_spec method")
                    validation_errors.append({"error": "model_class_error", "message": f"Model class {self.model_class.__name__} cannot parse YAML specifications"})
                    return None, validation_errors
            except ValueError as e:
                # This is a validation error from the model
                validation_errors.append({"error": "validation_error", "message": str(e)})
                return None, validation_errors
                
        except yaml.YAMLError as e:
            logger.warning(f"Error parsing YAML file {file_path}: {str(e)}")
            validation_errors.append({"error": "yaml_syntax_error", "message": str(e)})
            return None, validation_errors
        except Exception as e:
            logger.exception(f"Error processing entity file {file_path}", exc_info=e)
            validation_errors.append({"error": "unexpected_error", "message": str(e)})
            return None, validation_errors
    
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
                                entities: List[T],
                                validation_errors: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Reconcile scanned entities with database state.
        
        This method should be implemented by subclasses to handle 
        entity-specific reconciliation logic.
        
        Args:
            session: Database session
            entities: List of entities found by scanning
            validation_errors: Dictionary of validation errors by file path
            
        Returns:
            Dictionary with counts of created/updated/deleted entities and errors
        """
        raise NotImplementedError("Subclasses must implement reconcile_entities")

    def _is_entity_relevant(self, entity: T) -> bool:
        """
        Check if an entity is relevant to the current scanning context.
        
        This method should be overridden by subclasses to implement
        entity-specific context filtering.
        
        Args:
            entity: Entity to check
            
        Returns:
            True if entity is relevant to the current context, False otherwise
        """
        # By default, all entities are relevant
        # Subclasses should override this method to implement specific filtering
        return True

    async def _validate_entity_references(self, session: AsyncSession, entity: T, file_path: str) -> List[Dict[str, str]]:
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
        Validate references to other entities.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            List of validation errors, empty if no errors
        """
        from mlpie.db.crud.environment import get_environment_by_name
        from mlpie.db.crud.project import get_project_by_name
        
        errors = []
        rel_path = os.path.relpath(file_path, self.repo_path)
        
        # Validate required environment reference
        if hasattr(entity, 'environment_name') and entity.environment_name:
            environment = await get_environment_by_name(session, entity.environment_name)
            if not environment:
                errors.append({
                    "error": "invalid_environment_ref", 
                    "message": f"Dataset references non-existent environment '{entity.environment_name}'"
                })
                logger.warning(f"Dataset in {rel_path} references non-existent environment '{entity.environment_name}'")
        else:
            errors.append({
                "error": "missing_environment_ref", 
                "message": "Dataset requires environmentRef.name field"
            })
        
        # Validate optional project reference
        if hasattr(entity, 'project_name') and entity.project_name:
            project = await get_project_by_name(session, entity.project_name)
            if not project:
                errors.append({
                    "error": "invalid_project_ref", 
                    "message": f"Dataset references non-existent project '{entity.project_name}'"
                })
                logger.warning(f"Dataset in {rel_path} references non-existent project '{entity.project_name}'")
        
        return errors
    
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
        Validate references to other entities.
        
        Args:
            session: Database session
            entity: Entity to validate
            file_path: Path to the entity file
            
        Returns:
            List of validation errors, empty if no errors
        """
        from mlpie.db.crud.environment import get_environment_by_name
        from mlpie.db.crud.project import get_project_by_name
        
        errors = []
        rel_path = os.path.relpath(file_path, self.repo_path)
        
        # Validate required environment reference
        if hasattr(entity, 'environment_name') and entity.environment_name:
            environment = await get_environment_by_name(session, entity.environment_name)
            if not environment:
                errors.append({
                    "error": "invalid_environment_ref", 
                    "message": f"Pipeline references non-existent environment '{entity.environment_name}'"
                })
                logger.warning(f"Pipeline in {rel_path} references non-existent environment '{entity.environment_name}'")
        else:
            errors.append({
                "error": "missing_environment_ref", 
                "message": "Pipeline requires environmentRef.name field"
            })
        
        # Validate optional project reference
        if hasattr(entity, 'project_name') and entity.project_name:
            project = await get_project_by_name(session, entity.project_name)
            if not project:
                errors.append({
                    "error": "invalid_project_ref", 
                    "message": f"Pipeline references non-existent project '{entity.project_name}'"
                })
                logger.warning(f"Pipeline in {rel_path} references non-existent project '{entity.project_name}'")
        
        return errors
        
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