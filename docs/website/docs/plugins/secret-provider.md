---
sidebar_position: 2
title: Secret Provider Plugins
description: Learn how to create plugins for managing secrets in MLPie
---

# Creating Secret Provider Plugins

Secret Provider plugins allow MLPie to securely manage and access credentials, API keys, and other sensitive information from various backends.

## Interface

Secret Provider plugins must implement the `SecretProviderInterface` which defines the following methods:

```python
class SecretProviderInterface(abc.ABC):
    @abc.abstractmethod
    async def get_secret(self, name: str) -> str:
        """Get a secret by name."""
        pass
        
    @abc.abstractmethod
    async def set_secret(self, name: str, value: str) -> bool:
        """Set a secret value."""
        pass
        
    @abc.abstractmethod
    async def delete_secret(self, name: str) -> bool:
        """Delete a secret."""
        pass
        
    @abc.abstractmethod
    async def list_secrets(self) -> List[str]:
        """List all available secrets."""
        pass
```

## Example Implementation

Here's a minimal example of a Secret Provider plugin that stores secrets in environment variables:

```python
from typing import Any, Dict, List

from mlpie.secrets.interfaces import SecretProviderInterface
from mlpie.plugins.base import Plugin, PluginMetadata, PluginType, register_plugin

@register_plugin
class EnvSecretProvider(SecretProviderInterface, Plugin):
    """Environment Variable Secret Provider."""
    
    # Plugin metadata
    metadata = PluginMetadata(
        name="env",
        version="0.1.0",
        description="Store secrets in environment variables",
        plugin_type=PluginType.SECRET_PROVIDER,
        author="Your Name",
        capabilities=["environment"],
    )
    
    def __init__(self):
        Plugin.__init__(self)
        self.prefix = ""
        self.initialized = False
    
    async def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialize the plugin with configuration."""
        self.prefix = config.get("prefix", "")
        self.initialized = True
        return True
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, str]:
        """Validate the plugin configuration."""
        # No special validation needed for this plugin
        return {}
    
    async def get_secret(self, name: str) -> str:
        """Get a secret from environment variables."""
        import os
        env_name = f"{self.prefix}{name}" if self.prefix else name
        value = os.environ.get(env_name)
        if value is None:
            raise SecretNotFoundError(f"Secret '{name}' not found in environment variables")
        return value
    
    async def set_secret(self, name: str, value: str) -> bool:
        """Set a secret in environment variables."""
        import os
        env_name = f"{self.prefix}{name}" if self.prefix else name
        os.environ[env_name] = value
        return True
    
    async def delete_secret(self, name: str) -> bool:
        """Delete a secret from environment variables."""
        import os
        env_name = f"{self.prefix}{name}" if self.prefix else name
        if env_name in os.environ:
            del os.environ[env_name]
            return True
        return False
    
    async def list_secrets(self) -> List[str]:
        """List all secrets stored in environment variables."""
        import os
        if not self.prefix:
            # Cannot safely list all environment variables as secrets
            return []
        
        secrets = []
        prefix_len = len(self.prefix)
        for key in os.environ:
            if key.startswith(self.prefix):
                secrets.append(key[prefix_len:])
        return secrets
    
    async def shutdown(self) -> None:
        """Clean up resources."""
        # No cleanup needed
        pass
```

## Configuration

Secret Provider plugins are configured in the MLPie configuration under the `plugins.secret_provider` section:

```yaml
plugins:
  secret_provider:
    type: env  # The name of your plugin
    config:
      prefix: MLPIE_  # Plugin-specific configuration
```

## Best Practices

When developing Secret Provider plugins:

1. **Security**: Always follow best practices for handling sensitive information
2. **Error Handling**: Provide clear error messages when secrets cannot be accessed
3. **Validation**: Validate configuration during initialization
4. **Scope**: Consider using prefixes to isolate MLPie secrets from other secrets
5. **Performance**: Implement caching if appropriate for your backend

## Package Structure

A typical Secret Provider plugin package might look like:

```
mlpie-secret-provider-mybackend/
├── mlpie_secret_provider_mybackend/
│   ├── __init__.py
│   └── provider.py
├── tests/
│   ├── __init__.py
│   └── test_provider.py
├── README.md
├── setup.py
└── pyproject.toml
``` 