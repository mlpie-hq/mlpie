"""
YAML Utilities.

This module provides utilities for working with YAML entity definitions.
"""

import yaml
from typing import Dict, Any, Optional, Type, Tuple, List, Union
from pathlib import Path
import logging
from pydantic import ValidationError

from mlpie.schemas.base import EntityBase, EntityKind
from mlpie.schemas.project import ProjectSpec
from mlpie.schemas.environment import EnvironmentSpec
from mlpie.schemas.dataset import DatasetSpec
from mlpie.schemas.pipeline import PipelineSpec

logger = logging.getLogger(__name__)

# Type mapping from entity kind to Pydantic model
ENTITY_TYPE_MAPPING = {
    EntityKind.PROJECT: ProjectSpec,
    EntityKind.ENVIRONMENT: EnvironmentSpec,
    EntityKind.DATASET: DatasetSpec,
    EntityKind.PIPELINE: PipelineSpec,
}


def load_yaml_file(file_path: str) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, str]]]:
    """
    Load a YAML file and perform basic validation.
    
    Args:
        file_path: Path to the YAML file
        
    Returns:
        Tuple of:
            - YAML content as dict if valid, None otherwise
            - List of validation errors
    """
    validation_errors = []
    
    try:
        with open(file_path, 'r') as f:
            content = yaml.safe_load(f)
            
        if not content:
            validation_errors.append({
                "error": "empty_file", 
                "message": "File is empty or contains no YAML content"
            })
            return None, validation_errors
            
        if not isinstance(content, dict):
            validation_errors.append({
                "error": "invalid_structure", 
                "message": "YAML must define a dictionary/object"
            })
            return None, validation_errors
            
        # Check for expected K8s-like structure
        if 'kind' not in content:
            validation_errors.append({
                "error": "missing_kind", 
                "message": "Required field 'kind' is missing"
            })
            return None, validation_errors
            
        if 'apiVersion' not in content:
            validation_errors.append({
                "error": "missing_api_version", 
                "message": "Required field 'apiVersion' is missing"
            })
            return None, validation_errors
        
        return content, []
        
    except yaml.YAMLError as e:
        validation_errors.append({
            "error": "yaml_syntax_error", 
            "message": str(e)
        })
        return None, validation_errors
        
    except Exception as e:
        validation_errors.append({
            "error": "unexpected_error", 
            "message": str(e)
        })
        return None, validation_errors


def parse_entity_from_yaml(file_path: str) -> Tuple[Optional[EntityBase], List[Dict[str, str]]]:
    """
    Parse an entity from a YAML file.
    
    Args:
        file_path: Path to the YAML file
        
    Returns:
        Tuple of:
            - Entity instance if valid, None otherwise
            - List of validation errors
    """
    # Load and do basic validation
    content, validation_errors = load_yaml_file(file_path)
    if validation_errors or not content:
        return None, validation_errors
    
    kind = content.get('kind')
    
    # Determine the correct schema to use
    schema_class = ENTITY_TYPE_MAPPING.get(kind)
    if not schema_class:
        # Not an error - just not a recognized entity type
        return None, []
    
    # Parse with the appropriate schema
    try:
        entity = schema_class(**content)
        return entity, []
        
    except ValidationError as e:
        # Format Pydantic validation errors
        validation_errors = []
        for error in e.errors():
            loc = '.'.join(str(x) for x in error['loc'])
            validation_errors.append({
                "error": "validation_error",
                "field": loc,
                "message": error['msg']
            })
        return None, validation_errors
        
    except Exception as e:
        validation_errors.append({
            "error": "unexpected_error",
            "message": str(e)
        })
        return None, validation_errors


def entity_to_yaml(entity: EntityBase) -> str:
    """
    Convert an entity to YAML.
    
    Args:
        entity: Entity to convert
        
    Returns:
        YAML representation of the entity
    """
    # Convert to dict and then to YAML
    entity_dict = entity.model_dump()
    return yaml.dump(entity_dict, sort_keys=False)


def create_entity_from_dict(kind: str, data: Dict[str, Any]) -> Tuple[Optional[EntityBase], List[Dict[str, str]]]:
    """
    Create an entity from a dictionary.
    
    Args:
        kind: Entity kind
        data: Dictionary data
        
    Returns:
        Tuple of:
            - Entity instance if valid, None otherwise
            - List of validation errors
    """
    # Make sure kind and apiVersion are set
    full_data = {
        "kind": kind,
        "apiVersion": "mlpie/v1",
        **data
    }
    
    # Determine the correct schema to use
    schema_class = ENTITY_TYPE_MAPPING.get(kind)
    if not schema_class:
        return None, [{
            "error": "unknown_entity_type",
            "message": f"Unknown entity type: {kind}"
        }]
    
    # Parse with the appropriate schema
    try:
        entity = schema_class(**full_data)
        return entity, []
        
    except ValidationError as e:
        # Format Pydantic validation errors
        validation_errors = []
        for error in e.errors():
            loc = '.'.join(str(x) for x in error['loc'])
            validation_errors.append({
                "error": "validation_error",
                "field": loc,
                "message": error['msg']
            })
        return None, validation_errors
        
    except Exception as e:
        return None, [{
            "error": "unexpected_error",
            "message": str(e)
        }] 