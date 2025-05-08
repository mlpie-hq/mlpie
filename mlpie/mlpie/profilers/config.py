"""
Profiler Configuration Module.

This module defines schemas and utilities for profiler configurations.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass
class ProfilerSecretRef:
    """Reference to a secret for profiler authentication."""
    name: str
    key_map: Dict[str, str] = field(default_factory=dict)


@dataclass
class ProfilerAuth:
    """Authentication configuration for profilers."""
    secret_ref: Optional[ProfilerSecretRef] = None
    # Additional direct auth fields could be added here if needed


@dataclass
class ProfilerConfig:
    """Base configuration for a data profiler."""
    name: str
    type: str
    config: Dict[str, Any] = field(default_factory=dict)
    auth: Optional[ProfilerAuth] = None
    enabled: bool = True

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProfilerConfig':
        """
        Create a ProfilerConfig from a dictionary.
        
        Args:
            data: Dictionary containing profiler configuration
            
        Returns:
            ProfilerConfig instance
        """
        auth_data = data.get('auth')
        auth = None
        
        if auth_data:
            secret_ref_data = auth_data.get('secretRef')
            secret_ref = None
            
            if secret_ref_data:
                secret_ref = ProfilerSecretRef(
                    name=secret_ref_data.get('name', ''),
                    key_map={k: v for k, v in secret_ref_data.items() if k != 'name'}
                )
                
            auth = ProfilerAuth(secret_ref=secret_ref)
            
        return cls(
            name=data.get('name', ''),
            type=data.get('type', ''),
            config=data.get('config', {}),
            auth=auth,
            enabled=data.get('enabled', True)
        )


def get_profiler_config_from_environment(environment_spec: Dict[str, Any], profiler_name: Optional[str] = None) -> Optional[ProfilerConfig]:
    """
    Extract profiler configuration from an environment specification.
    
    Args:
        environment_spec: Environment specification dictionary
        profiler_name: Name of the profiler to get, or None for default
        
    Returns:
        ProfilerConfig if found, None otherwise
    """
    profilers_spec = environment_spec.get('profilers', {})
    
    # If no specific profiler requested, use the default
    if not profiler_name:
        profiler_name = profilers_spec.get('default')
        if not profiler_name:
            return None
    
    # Find the requested profiler config
    configs = profilers_spec.get('configurations', [])
    for config_data in configs:
        if config_data.get('name') == profiler_name:
            return ProfilerConfig.from_dict(config_data)
    
    return None


def get_available_profilers_from_environment(environment_spec: Dict[str, Any]) -> List[str]:
    """
    Get list of available profiler names from an environment specification.
    
    Args:
        environment_spec: Environment specification dictionary
        
    Returns:
        List of profiler names
    """
    profilers_spec = environment_spec.get('profilers', {})
    configs = profilers_spec.get('configurations', [])
    return [config.get('name') for config in configs if config.get('name') and config.get('enabled', True)]


def get_default_profiler_from_environment(environment_spec: Dict[str, Any]) -> Optional[str]:
    """
    Get default profiler name from an environment specification.
    
    Args:
        environment_spec: Environment specification dictionary
        
    Returns:
        Default profiler name or None if not specified
    """
    profilers_spec = environment_spec.get('profilers', {})
    return profilers_spec.get('default') 