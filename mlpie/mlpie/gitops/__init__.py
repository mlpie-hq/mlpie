"""
GitOps interaction package.

This package provides tools for interacting with Git repositories.
"""

from mlpie.gitops.repository_manager import RepositoryManager, get_repository_manager

__all__ = ["RepositoryManager", "get_repository_manager"] 