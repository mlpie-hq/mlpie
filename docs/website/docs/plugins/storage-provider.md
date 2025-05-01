---
sidebar_position: 3
title: Storage Provider Plugins
description: Learn how to create plugins for storage integration in MLPie
---

# Creating Storage Provider Plugins

Storage Provider plugins allow MLPie to interact with various object storage services and file systems, providing a unified interface for storing and retrieving data and model artifacts.

## Interface

Storage Provider plugins must implement the `StorageProviderInterface` which defines methods for interacting with storage backends:

```python
class StorageProviderInterface(abc.ABC):
    @abc.abstractmethod
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload a file to storage."""
        pass
    
    @abc.abstractmethod
    async def download_file(self, remote_path: str, local_path: str) -> str:
        """Download a file from storage."""
        pass
    
    @abc.abstractmethod
    async def list_files(self, prefix: str = "") -> List[str]:
        """List files in storage with optional prefix."""
        pass
    
    @abc.abstractmethod
    async def file_exists(self, remote_path: str) -> bool:
        """Check if a file exists in storage."""
        pass
    
    @abc.abstractmethod
    async def delete_file(self, remote_path: str) -> bool:
        """Delete a file from storage."""
        pass
    
    @abc.abstractmethod
    async def get_file_url(self, remote_path: str, expiration: int = 3600) -> str:
        """Get a pre-signed URL for accessing a file."""
        pass
```

## Example Implementation

Here's a simplified example of a Storage Provider plugin that uses a local file system:

```python
import os
import shutil
from typing import Any, Dict, List
from pathlib import Path

from mlpie.storage.interfaces import StorageProviderInterface
from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin

@register_plugin
class LocalStorageProvider(StorageProviderInterface, Plugin):
    """Local File System Storage Provider."""
    
    # Plugin metadata
    metadata = PluginMetadata(
        name="local",
        version="0.1.0",
        description="Store files in the local file system",
        plugin_type=PluginType.STORAGE_PROVIDER,
        author="Your Name",
        capabilities=["file_storage"],
    )
    
    def __init__(self):
        Plugin.__init__(self)
        self.base_path = ""
        self.initialized = False
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration."""
        self.base_path = config.get("base_path", os.path.expanduser("~/mlpie_storage"))
        
        # Ensure the base directory exists
        os.makedirs(self.base_path, exist_ok=True)
        
        self.initialized = True
        return True
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration."""
        errors = {}
        
        base_path = config.get("base_path")
        if base_path and not os.path.isdir(os.path.dirname(os.path.expanduser(base_path))):
            errors["base_path"] = "Parent directory does not exist"
            
        return errors
    
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload a file to the local storage."""
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Local file not found: {local_path}")
            
        dest_path = os.path.join(self.base_path, remote_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        shutil.copy2(local_path, dest_path)
        return remote_path
    
    async def download_file(self, remote_path: str, local_path: str) -> str:
        """Download a file from the local storage."""
        src_path = os.path.join(self.base_path, remote_path)
        
        if not os.path.exists(src_path):
            raise FileNotFoundError(f"Remote file not found: {remote_path}")
            
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        shutil.copy2(src_path, local_path)
        return local_path
    
    async def list_files(self, prefix: str = "") -> List[str]:
        """List files in the local storage with optional prefix."""
        base_dir = os.path.join(self.base_path, prefix)
        if not os.path.exists(base_dir):
            return []
            
        files = []
        prefix_len = len(self.base_path) + 1  # +1 for the separator
        
        for root, _, filenames in os.walk(base_dir):
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = full_path[prefix_len:]
                files.append(rel_path)
                
        return files
    
    async def file_exists(self, remote_path: str) -> bool:
        """Check if a file exists in the local storage."""
        full_path = os.path.join(self.base_path, remote_path)
        return os.path.exists(full_path) and os.path.isfile(full_path)
    
    async def delete_file(self, remote_path: str) -> bool:
        """Delete a file from the local storage."""
        full_path = os.path.join(self.base_path, remote_path)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            os.remove(full_path)
            return True
        return False
    
    async def get_file_url(self, remote_path: str, expiration: int = 3600) -> str:
        """Get a URL for accessing a file (in this case, a file:// URL)."""
        full_path = os.path.join(self.base_path, remote_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {remote_path}")
            
        # For local files, we just return a file:// URL
        return f"file://{os.path.abspath(full_path)}"
    
    async def shutdown(self) -> None:
        """Clean up resources."""
        # No cleanup needed for local storage
        pass
```

## Configuration

Storage Provider plugins are configured in the MLPie configuration under the `plugins.storage_provider` section:

```yaml
plugins:
  storage_provider:
    type: local
    config:
      base_path: "~/mlpie_data"
```

## Best Practices

When developing Storage Provider plugins:

1. **Error Handling**: Provide clear error messages for file operations
2. **Path Handling**: Use consistent path handling and normalization
3. **Performance**: Consider implementing batch operations for efficiency
4. **Security**: Validate paths to prevent directory traversal attacks
5. **Concurrency**: Ensure thread safety for file operations

## Common Storage Backends

Common storage backends to implement include:

- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- MinIO
- SFTP
- Hadoop Distributed File System (HDFS)

## Package Structure

A typical Storage Provider plugin package might look like:

```
mlpie-storage-provider-mybackend/
├── mlpie_storage_provider_mybackend/
│   ├── __init__.py
│   └── provider.py
├── tests/
│   ├── __init__.py
│   └── test_provider.py
├── README.md
├── setup.py
└── pyproject.toml
``` 