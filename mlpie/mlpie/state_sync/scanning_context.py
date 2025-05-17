"""
Repository Scanning Context.

This module defines data structures for tracking context during hierarchical repository scanning.
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class ScanningContext:
    """
    Context information for repository scanning jobs.
    
    This tracks the hierarchical context of what a scan is looking for, ensuring
    scans only process entities relevant to their hierarchy position.
    """
    
    # Repository metadata
    repository_id: Optional[UUID] = None
    repository_url: Optional[str] = None
    
    # Hierarchical context
    project_name: Optional[str] = None
    environment_name: Optional[str] = None
    
    # What types of entities this scan should look for
    resource_types: List[str] = field(default_factory=list)
    
    # Additional context data
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_relevant_project(self, project_name: str) -> bool:
        """
        Check if a project is relevant to this scanning context.
        
        Args:
            project_name: Name of the project to check
            
        Returns:
            True if the project is relevant, False otherwise
        """
        # If no project filter is set, all projects are relevant
        if self.project_name is None:
            return True
        
        # Otherwise, only the specified project is relevant
        return project_name == self.project_name
    
    def is_relevant_environment(self, project_name: str, environment_name: str) -> bool:
        """
        Check if an environment is relevant to this scanning context.
        
        Args:
            project_name: Name of the project for the environment
            environment_name: Name of the environment to check
            
        Returns:
            True if the environment is relevant, False otherwise
        """
        # First check if the project is relevant
        if not self.is_relevant_project(project_name):
            return False
        
        # If no environment filter is set, all environments for the relevant project are relevant
        if self.environment_name is None:
            return True
        
        # Otherwise, only the specified environment is relevant
        return environment_name == self.environment_name
    
    def is_relevant_resource(self, project_name: str, environment_name: str, resource_type: str) -> bool:
        """
        Check if a resource is relevant to this scanning context.
        
        Args:
            project_name: Name of the project for the resource
            environment_name: Name of the environment for the resource
            resource_type: Type of the resource to check ('dataset', 'pipeline', etc.)
            
        Returns:
            True if the resource is relevant, False otherwise
        """
        # First check if the environment is relevant
        if not self.is_relevant_environment(project_name, environment_name):
            return False
        
        # If no resource types are specified, all resource types are relevant
        if not self.resource_types:
            return True
        
        # Otherwise, only specified resource types are relevant
        return resource_type in self.resource_types or '*' in self.resource_types
    
    def create_child_context_for_project(self, project_name: str) -> 'ScanningContext':
        """
        Create a new context for scanning a project's environment repository.
        
        Args:
            project_name: Name of the project
            
        Returns:
            New scanning context for the project's environment repository
        """
        return ScanningContext(
            project_name=project_name,
            resource_types=self.resource_types.copy(),
            metadata={
                **self.metadata,
                'parent_context_repository_id': self.repository_id,
                'parent_context_repository_url': self.repository_url
            }
        )
    
    def create_child_context_for_environment(
        self, 
        project_name: str, 
        environment_name: str,
        resource_types: List[str]
    ) -> 'ScanningContext':
        """
        Create a new context for scanning an environment's resource repository.
        
        Args:
            project_name: Name of the project
            environment_name: Name of the environment
            resource_types: Types of resources to scan for
            
        Returns:
            New scanning context for the environment's resource repository
        """
        return ScanningContext(
            project_name=project_name,
            environment_name=environment_name,
            resource_types=resource_types,
            metadata={
                **self.metadata,
                'parent_context_repository_id': self.repository_id,
                'parent_context_repository_url': self.repository_url
            }
        ) 