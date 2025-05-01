"""
MLPie API Client.

This module provides a client for interacting with the MLPie API.
"""

from typing import Any, Dict, List, Optional, Union
from urllib.parse import urljoin
from uuid import UUID

import httpx

from mlpie.config import get_settings
from mlpie.api.schemas import (
    ConfigValueResponse,
    PluginResponse,
)


class MLPieClient:
    """Client for interacting with the MLPie API."""
    
    def __init__(self, base_url: Optional[str] = None, timeout: float = 10.0):
        """Initialize the MLPie API client.
        
        Args:
            base_url: Base URL for the API. If not provided, will use the one from settings.
            timeout: Request timeout in seconds.
        """
        settings = get_settings()
        self.base_url = base_url or settings.api.BASE_URL
        self.timeout = timeout
    
    def _url(self, path: str) -> str:
        """Build a full URL from the given path.
        
        Args:
            path: API endpoint path
            
        Returns:
            Full URL
        """
        # Ensure path starts with a slash
        if not path.startswith('/'):
            path = '/' + path
            
        return urljoin(self.base_url, path)
    
    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """Make an HTTP request to the API.
        
        Args:
            method: HTTP method
            path: API endpoint path
            params: Query parameters
            json: JSON body
            headers: HTTP headers
            
        Returns:
            Response data
            
        Raises:
            httpx.HTTPStatusError: If the response has an error status code
        """
        url = self._url(path)
        
        # Set default headers
        if headers is None:
            headers = {}
        
        # Add content type for requests with body
        if json is not None and 'Content-Type' not in headers:
            headers['Content-Type'] = 'application/json'
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json,
                headers=headers,
            )
            
            # Raise for error status codes
            response.raise_for_status()
            
            return response.json()
    
    # Configuration API methods
    async def get_config_value(self, key: str) -> Dict[str, Any]:
        """Get a configuration value.
        
        Args:
            key: Configuration key
            
        Returns:
            Configuration value response
        """
        return await self._request('GET', f'/config/values/{key}')
    
    async def list_config_values(self, prefix: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """List configuration values.
        
        Args:
            prefix: Optional prefix to filter by
            
        Returns:
            Dictionary of configuration values
        """
        params = {}
        if prefix:
            params['prefix'] = prefix
            
        response = await self._request('GET', '/config/values', params=params)
        return response.get('configs', {})
    
    async def set_config_value(
        self,
        key: str,
        value: Any,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Set a configuration value.
        
        Args:
            key: Configuration key
            value: Configuration value
            description: Optional description
            
        Returns:
            Status response
        """
        return await self._request(
            'PUT',
            f'/config/values/{key}',
            json={
                'value': value,
                'description': description
            }
        )
    
    async def delete_config_value(self, key: str) -> Dict[str, Any]:
        """Delete a configuration value.
        
        Args:
            key: Configuration key
            
        Returns:
            Status response
        """
        return await self._request('DELETE', f'/config/values/{key}')
    
    # Plugin API methods
    async def list_plugins(
        self,
        plugin_type: Optional[str] = None,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List installed plugins.
        
        Args:
            plugin_type: Optional plugin type to filter by
            active_only: Whether to return only active plugins
            
        Returns:
            List of plugin records
        """
        params = {}
        if plugin_type:
            params['plugin_type'] = plugin_type
        if active_only:
            params['active_only'] = 'true'
            
        response = await self._request('GET', '/config/plugins', params=params)
        return response.get('plugins', [])
    
    async def get_plugin(self, plugin_id: Union[str, UUID]) -> Dict[str, Any]:
        """Get a plugin by ID.
        
        Args:
            plugin_id: Plugin ID
            
        Returns:
            Plugin record
        """
        return await self._request('GET', f'/config/plugins/{plugin_id}')
    
    async def update_plugin_config(
        self,
        plugin_id: Union[str, UUID],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a plugin's configuration.
        
        Args:
            plugin_id: Plugin ID
            config: New configuration
            
        Returns:
            Status response
        """
        return await self._request(
            'PUT',
            f'/config/plugins/{plugin_id}/config',
            json={'config': config}
        )
    
    async def update_plugin_status(
        self,
        plugin_id: Union[str, UUID],
        activate: bool
    ) -> Dict[str, Any]:
        """Activate or deactivate a plugin.
        
        Args:
            plugin_id: Plugin ID
            activate: Whether to activate or deactivate
            
        Returns:
            Status response
        """
        return await self._request(
            'PUT',
            f'/config/plugins/{plugin_id}/status',
            params={'activate': str(activate).lower()}
        )
    
    async def sync_plugins(self) -> Dict[str, int]:
        """Synchronize available plugins with the database.
        
        Returns:
            Dictionary with counts of plugins added, updated, and removed
        """
        return await self._request('POST', '/config/plugins/sync')


# Client factory
_client: Optional[MLPieClient] = None


def get_client(base_url: Optional[str] = None) -> MLPieClient:
    """Get or create a MLPie API client.
    
    Args:
        base_url: Optional base URL for the API
        
    Returns:
        MLPieClient instance
    """
    global _client
    
    if _client is None or base_url is not None:
        _client = MLPieClient(base_url=base_url)
    
    return _client 