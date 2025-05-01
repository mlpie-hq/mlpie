# Makefile for MLPie Platform Development

# Variables
PYTHON_VERSION = 3.13
PYTHON_INTERPRETER = python$(PYTHON_VERSION)
PACKAGE_NAME = mlpie
ROOT_DIR = $(shell pwd)
BACKEND_DIR = $(ROOT_DIR)/$(PACKAGE_NAME)

# Default target (runs when you just type 'make')
.DEFAULT_GOAL := help

# Phony targets (targets that don't represent files)
.PHONY: help install setup format lint check test test-unit test-integration test-secrets test-cov test-cov-html test-cov-integration test-cov-secrets run-api run-cli db-revision db-migrate db-upgrade clean

help:
	@echo "Available commands:"
	@echo "  make install        Install dependencies using Poetry."
	@echo "  make setup          Install dependencies and setup pre-commit hook (if exists)."
	@echo "  make format         Format code using Ruff."
	@echo "  make lint           Lint code using Ruff."
	@echo "  make check          Run linting and type checking (Mypy)."
	@echo "  make test           Run all tests using Pytest."
	@echo "  make test-unit      Run only unit tests."
	@echo "  make test-integration Run only integration tests."
	@echo "  make test-secrets   Run only secret management tests."
	@echo "  make test-cov       Run tests with coverage report."
	@echo "  make test-cov-html  Run tests and generate HTML coverage report."
	@echo "  make test-cov-integration Run only integration tests with coverage report."
	@echo "  make test-cov-secrets Run only secret management tests with coverage report."
	@echo "  make run-api        Run the FastAPI development server (uvicorn)."
	@echo "  make run-cli        Run the CLI application entry point."
	@echo "  make db-revision    Create a new Alembic database migration revision."
	@echo "  make db-migrate     Alias for db-upgrade."
	@echo "  make db-upgrade     Apply pending Alembic database migrations."
	@echo "  make clean          Remove build artifacts and cache files."

# Installation & Setup
install:
	@echo "Installing dependencies with Poetry..."
	@poetry install --with dev

setup: install
	@echo "Project setup complete."
	# Add pre-commit setup if used: @poetry run pre-commit install

# Code Quality
format:
	@echo "Formatting code with Ruff..."
	@poetry run ruff format $(BACKEND_DIR) tests

lint:
	@echo "Linting code with Ruff..."
	@poetry run ruff check $(BACKEND_DIR) tests

check: lint
	@echo "Running type checking with Mypy..."
	@poetry run mypy $(BACKEND_DIR)

# Testing
test:
	@echo "Running all tests with Pytest..."
	@poetry run pytest

test-unit:
	@echo "Running unit tests..."
	@poetry run pytest -m unit

test-integration:
	@echo "Running integration tests..."
	@poetry run pytest -m integration

test-secrets:
	@echo "Running secret management tests..."
	@poetry run pytest tests/secrets/

# Test Coverage
test-cov:
	@echo "Running tests with coverage report..."
	@poetry run pytest --cov=$(PACKAGE_NAME) --cov-report term-missing

test-cov-html:
	@echo "Running tests with HTML coverage report..."
	@poetry run pytest --cov=$(PACKAGE_NAME) --cov-report html
	@echo "HTML coverage report generated in htmlcov/ directory"
	@echo "Open htmlcov/index.html in your browser to view the report"

test-cov-integration:
	@echo "Running integration tests with coverage report..."
	@poetry run pytest -m integration --cov=$(PACKAGE_NAME) --cov-report term-missing

test-cov-secrets:
	@echo "Running secret management tests with coverage report..."
	@poetry run pytest tests/secrets/ --cov=$(PACKAGE_NAME).secrets --cov-report term-missing

# Running Applications
run-api:
	@echo "Starting FastAPI development server on http://localhost:8000 ..."
	@cd mlpie && poetry run uvicorn mlpie.api.main:app --reload --host 0.0.0.0 --port 8000 --log-level info


run-cli:
	@echo "Running CLI application... (Use --help for options)"
	@poetry run $(PACKAGE_NAME)-cli --help # Run entry point defined in pyproject.toml

# Database Migrations (Alembic)
db-revision:
	@echo "Creating new Alembic revision... (Provide a message with -m)"
	@poetry run alembic revision --autogenerate -m "Describe changes here"

db-migrate: db-upgrade # Alias

db-upgrade:
	@echo "Applying database migrations..."
	@poetry run alembic upgrade head

# Cleaning
clean:
	@echo "Cleaning up build artifacts and cache files..."
	@find . -type f -name "*.py[co]" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@find . -type d -name ".mypy_cache" -exec rm -rf {} +
	@rm -f .coverage*
	@rm -rf htmlcov/
	@rm -rf build/
	@rm -rf dist/
	@rm -rf *.egg-info
