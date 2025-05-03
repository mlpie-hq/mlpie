# Secret Management System

This module provides a flexible secret management system for the MLPie platform. It allows storing and retrieving secrets using different providers.

## Configuration

The secret management system can be configured in two ways:

1. Via environment variables (recommended for production)
2. Via the settings API (UI)

### Environment Variables

For production deployments, it's recommended to configure the secret manager using environment variables. These take precedence over settings in the database.

| Environment Variable | Description | Default |
| --- | --- | --- |
| `MLPIE_SECRETS_PROVIDER` | Secret provider type (`file`, `env`, `db`) | `file` |
| `MLPIE_SECRETS_FILE` | Path to secrets file (for `file` provider) | `data/secrets.dat` |
| `MLPIE_SECRETS_PASSWORD` | Password for encrypting secrets (for `file` and `db` providers) | Random (not persisted) |
| `MLPIE_SECRETS_ENV_PREFIX` | Prefix for environment variables (for `env` provider) | `MLPIE_SECRET_` |
| `MLPIE_SECRETS_ENCRYPTION_KEY` | Encryption key (for `db` provider) | N/A |
| `MLPIE_SECRETS_SALT` | Salt for key derivation (for `db` provider with password) | N/A |

### Provider Types

#### File Provider

Stores secrets in an encrypted file on disk.

```bash
# Example configuration for file provider
export MLPIE_SECRETS_PROVIDER=file
export MLPIE_SECRETS_FILE=/path/to/secrets.dat
export MLPIE_SECRETS_PASSWORD=your-secure-password
```

#### Environment Provider

Reads secrets from environment variables with a specific prefix.

```bash
# Example configuration for environment provider
export MLPIE_SECRETS_PROVIDER=env
export MLPIE_SECRETS_ENV_PREFIX=MLPIE_SECRET_

# Example secrets
export MLPIE_SECRET_database_password=db-password-here
export MLPIE_SECRET_api_token=api-token-here
```

#### Database Provider

Stores encrypted secrets in the application database.

```bash
# Example configuration for database provider
export MLPIE_SECRETS_PROVIDER=db
export MLPIE_SECRETS_PASSWORD=your-secure-password
# or
export MLPIE_SECRETS_ENCRYPTION_KEY=your-base64-encoded-key
```

## Bootstrap Process

During application startup, the secret manager is initialized with the following process:

1. Check for environment variables first
2. Fall back to configured settings if environment variables not set
3. Initialize the appropriate secret provider

This bootstrap process happens in `mlpie/bootstrap.py` and ensures that the application can start with a properly configured secret manager.

## API Access

You can access the secret manager in your code using:

```python
from mlpie.secrets.setup import get_secret_manager

# Get a secret
secret_mgr = get_secret_manager()
value = await secret_mgr.get_secret("your-secret-key")

# Set a secret
await secret_mgr.set_secret("your-secret-key", "your-secret-value")
``` 