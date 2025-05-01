# MLPie Database Module

This module provides database connection and management utilities for the MLPie platform.

## Database Configuration

The database connection is configured using environment variables to avoid circular dependencies with the configuration management system. The following environment variables are supported:

- `MLPIE_DB_URL`: Database connection URL (default: `sqlite+aiosqlite:///data/mlpie.db`)
- `MLPIE_DB_ECHO`: Whether to echo SQL statements (default: `False`)

Example `.env` file:

```
# Database Configuration
MLPIE_DB_URL=sqlite+aiosqlite:///data/mlpie.db
MLPIE_DB_ECHO=False
```

## Architecture

The database module is structured to avoid circular dependencies:

1. `bootstrap.py`: Low-level initialization that reads from environment variables
2. `connection.py`: Connection management using the bootstrapped engine
3. `models/`: SQLAlchemy model definitions
4. `crud/`: Database operations for different entities

## Bootstrap Pattern

The database uses a bootstrap pattern to initialize:

1. Environment variables provide core database settings
2. `bootstrap.py` creates the engine without depending on config manager
3. `connection.py` uses the bootstrapped engine
4. Config manager can then use the database to store/retrieve other configurations

This pattern breaks the circular dependency between database connection and configuration management.

## Solving the Circular Dependency

The previous architecture had a circular dependency:

```
mlpie.db.connection 
  → imports mlpie.config (to get settings)
    → imports mlpie.config.manager
      → imports mlpie.db.connection (for DB access)
        → circular import!
```

The bootstrap solution:

1. Separated core database configuration from the config management system
2. Created a new `bootstrap.py` module that gets basic settings from environment variables
3. `connection.py` now uses `bootstrap.py` instead of depending on the config manager
4. Other modules can still use the configuration manager for more complex settings

This keeps basic database settings environment-driven, while allowing other application settings to be stored and managed in the database.

## Usage

```python
from mlpie.db.connection import setup_database, get_session

# Initialize database at application startup
setup_database()

# Use as FastAPI dependency
@app.get("/items")
async def get_items(session: AsyncSession = Depends(get_session)):
    # Use session for database operations
    ...
``` 