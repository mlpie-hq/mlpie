---
sidebar_position: 1
---

# Introduction to MLPie

Welcome to MLPie, a comprehensive **MLOps Platform** designed to streamline machine learning operations and experiment tracking.

## What is MLPie?

MLPie is an open-source MLOps platform built to help data scientists and ML engineers manage the complete lifecycle of machine learning models. It provides a GitOps-based approach for managing ML resources, with a lightweight database for performance optimization and synchronization between Git repositories and the database.

Key features include:

- **GitOps-based** approach for managing ML resources
- **Lightweight database** for performance optimization
- **Synchronization** between Git repositories and database
- **Modular design** with a plugins system
- **RESTful API** for integration with other systems
- **CLI** for easy command-line operations

## Getting Started

Get started by installing MLPie:

```bash
# Clone the repository
git clone https://github.com/mlpie-ai/mlpie.git
cd mlpie

# Install dependencies
make install

# Run the API
make run-api
```

### Prerequisites

To use MLPie, you'll need:

- **Python 3.13** or higher
- **Poetry** for dependency management
- **Git** for version control
- **PostgreSQL** (optional, for production deployments)

## Core Concepts

MLPie organizes machine learning workflows around several core concepts:

- **Experiments**: Track individual ML training runs with metrics and parameters
- **Models**: Register and version ML models
- **Datasets**: Manage and version datasets
- **Environments**: Define reproducible environments for experiments

## Architecture

MLPie follows a modular architecture with:

- **API Layer**: FastAPI-based backend services
- **Storage Layer**: Database and file storage systems
- **Plugin System**: Extensible system for custom integrations
- **Secret Management**: Secure storage for credentials and tokens
- **GitOps Engine**: Synchronization with Git repositories

Explore the documentation to learn more about how MLPie can help you streamline your ML workflows!
