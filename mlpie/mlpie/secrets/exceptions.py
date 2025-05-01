"""
Exceptions for the MLPie Secret Management System.

This module defines custom exceptions used by the secret management system.
"""


class SecretError(Exception):
    """Base exception for all secret-related errors."""
    pass


class ProviderNotFoundError(SecretError):
    """Raised when a requested secret provider is not found."""
    pass


class SecretNotFoundError(SecretError):
    """Raised when a requested secret is not found."""
    pass


class SecretAccessError(SecretError):
    """Raised when there is an error accessing a secret."""
    pass


class ProviderInitializationError(SecretError):
    """Raised when a provider cannot be initialized."""
    pass


class ProviderExistsError(SecretError):
    """Raised when attempting to register a provider that already exists."""
    pass 