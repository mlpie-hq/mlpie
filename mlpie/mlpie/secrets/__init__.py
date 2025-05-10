"""
Secret Management System for MLPie.

This module provides a secure way to store and retrieve sensitive information
used throughout the application, such as API keys, passwords, and tokens.
"""

from .manager import SecretManager
from .interfaces import SecretProvider

from .exceptions import (
    SecretError,
    ProviderNotFoundError,
    SecretNotFoundError,
    SecretAccessError,
    ProviderInitializationError,
)
from .setup import (
    setup_secret_manager,
    get_secret_manager,
)

__all__ = [
    "SecretManager",
    "SecretProvider",
    "setup_secret_manager",
    "get_secret_manager",
    "SecretError",
    "ProviderNotFoundError",
    "SecretNotFoundError",
    "SecretAccessError",
    "ProviderInitializationError",
] 