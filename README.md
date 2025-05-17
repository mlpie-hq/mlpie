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

# MLPie Hierarchical Repository Management

This directory contains example configurations for different hierarchical repository management patterns in MLPie. Each scenario demonstrates a different approach to organizing ML resources across repositories.

## Available Scenarios

### [Scenario 1](./scenario1/): All Resources in Master Repository
- All entities (projects, environments, datasets, pipelines) live in a single master repository
- Simple architecture with centralized management
- Suitable for small teams or early-stage projects

### [Scenario 2](./scenario2/): Split Resources by Environment
- Projects and environments defined in master repository
- Resources (datasets and pipelines) in environment-specific repositories
- Balances simplicity with resource isolation
- Good for medium-sized teams with environment-specific resources

### [Scenario 3](./scenario3/): Full Hierarchical Delegation
- Projects defined in master repository
- Environments defined in project-specific repositories
- Resources defined in environment-specific repositories
- Maximum isolation and team autonomy
- Ideal for large organizations with multiple dedicated teams

## Implementing Repository Scanning

The hierarchical scanning process must:

1. Track the context of each repository scan (project, environment)
2. Pass this context to child scanning jobs
3. Tag discovered entities with their hierarchical information
4. Respect parent-child relationships during reconciliation

## Job Scheduling Flow

```
Master Repo Scan
  └── Discovers Projects
      ├── Project 1 → Discover Environments (local or in project repo)
      │   └── Environment A → Discover Resources (local or in env repo)
      │       ├── Datasets
      │       └── Pipelines
      └── Project 2 → Discover Environments (local or in project repo)
          ├── Environment B → Discover Resources (local or in env repo)
          │   ├── Datasets
          │   └── Pipelines
          └── Environment C → Discover Resources (local or in env repo)
              ├── Datasets
              └── Pipelines
```

## Choosing the Right Pattern

- **Scenario 1** provides simplicity but limited isolation
- **Scenario 2** balances simplicity with resource isolation
- **Scenario 3** offers maximum isolation but with more complexity

Choose the pattern that best fits your organization's size, team structure, and governance requirements. 