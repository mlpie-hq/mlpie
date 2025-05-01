# MLPie - MLOps Platform

MLPie is a comprehensive MLOps platform designed to streamline the management of machine learning models, experiments, and artifacts.

## Features

- GitOps-based approach for managing ML resources
- Lightweight database for performance optimization
- Synchronization between Git repositories and database
- Modular design with plugins system
- RESTful API for integration with other systems
- CLI for easy command-line operations

## Installation

```bash
# Install dependencies
make install

# Run the API
make run-api
```

## Development

```bash
# Install development dependencies
make install-dev

# Run tests
make test

# Run linting
make lint
```

## Architecture

The project follows a modular structure:
- `/ui` - Frontend components
- `/mlpie` - Backend package
  - `/api` - FastAPI application
  - `/cli` - Command-line interface
  - `/db` - Database interactions
  - `/gitops` - Git repository management
  - `/sync` - Reconciliation logic
  - `/plugins` - Plugin system
  - `/config` - Configuration management 