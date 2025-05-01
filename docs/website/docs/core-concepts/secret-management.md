---
sidebar_position: 4
---

# Secret Management

The MLPie platform includes a robust secret management system for securely storing and retrieving sensitive information such as API keys, database credentials, and other secrets.

## Overview

The secret management system provides a unified interface for handling secrets across different storage backends through a plugin-based architecture. This approach allows you to choose the most appropriate storage method for your environment while maintaining a consistent API.

## Key Features

- **Plugin-based Architecture**: Support for multiple storage backends
- **Secure Storage**: Encryption of sensitive data
- **Flexible API**: Consistent interface regardless of backend
- **Integration with Platform**: Seamless usage across the platform

## Supported Storage Backends

The system currently supports the following storage backends:

### File Provider

The File Provider stores secrets in an encrypted file:

```python
from mlpie.secrets.factory import create_file_provider

# Create a file-based provider
provider = await create_file_provider(
    file_path="/path/to/secrets.dat",
    password="secure-password"
)

# Set a secret
await provider.set_secret("api_key", "my-api-key-value")

# Get a secret
api_key = await provider.get_secret("api_key")
```

### Environment Provider

The Environment Provider uses environment variables:

```python
from mlpie.secrets.factory import create_env_provider

# Create an environment-based provider
provider = await create_env_provider(
    prefix="MLPIE_SECRET_"  # Will store as MLPIE_SECRET_your_key_name
)

# Set a secret (will set MLPIE_SECRET_API_KEY)
await provider.set_secret("api_key", "my-api-key-value")

# Get a secret (will get MLPIE_SECRET_API_KEY)
api_key = await provider.get_secret("api_key")
```

## Using the Secret Manager

The Secret Manager provides a unified interface to all providers:

```python
from mlpie.secrets.factory import create_secret_manager

# Create a manager with a default provider
manager = await create_secret_manager(
    default_provider_type="file",
    default_provider_config={
        "file_path": "/path/to/secrets.dat",
        "password": "secure-password"
    },
    additional_providers={
        "env": {
            "prefix": "MLPIE_SECRET_"
        }
    }
)

# Set a secret using the default provider
await manager.set_secret("api_key", "my-api-key-value")

# Get a secret from the default provider
api_key = await manager.get_secret("api_key")

# Set a secret using a specific provider
await manager.set_secret("db_password", "database-password", provider_name="env")

# Get a secret from a specific provider
db_password = await manager.get_secret("db_password", provider_name="env")
```

## Extending with Custom Providers

You can create custom secret providers by implementing the `SecretProviderInterface`:

```python
from mlpie.secrets.interfaces import SecretProviderInterface

class CustomSecretProvider(SecretProviderInterface):
    async def initialize(self, config):
        # Initialize your provider
        pass
        
    async def get_secret(self, key):
        # Retrieve a secret
        pass
        
    async def set_secret(self, key, value):
        # Store a secret
        pass
        
    # Implement other required methods...
```

## Security Considerations

- Protect secret storage files with appropriate permissions
- Use strong, unique passwords for encrypted storage
- Rotate secrets regularly
- Limit access to production secrets

The secret management system is designed to be secure by default, but always follow security best practices when managing sensitive information. 