# Secret Management Tests

This directory contains tests for the secrets management system. The tests are organized into the following structure:

- `providers/` - Tests for individual secret providers
  - `test_env_provider.py` - Tests for environment variable-based storage
  - `test_file_provider.py` - Tests for file-based storage
- `test_manager.py` - Tests for the SecretManager

## Running Tests

Tests can be run using Pytest:

```bash
# Run all tests
make test

# Run only unit tests
make test-unit

# Run only secret management tests
make test-secrets
```

## Test Categories

Tests are categorized with markers:
- `unit` - Unit tests that don't require external services
- `integration` - Tests that require external services
- `slow` - Tests that take a long time to run

## Test Notes

### Temporary Directory Management

The tests for the secret manager use a temporary directory to store the file-based secrets. We've implemented proper directory and file lifecycle management to ensure the tests run reliably.

### Plugin Mocking

For testing the `SecretManager` with mocked providers, we've implemented a comprehensive mocking approach that:
1. Mocks the plugin discovery system
2. Creates mock plugin classes with appropriate metadata
3. Patches the plugin registry to return our custom providers

## Future Improvements

To further improve the test suite, consider the following enhancements:

1. **Create Test Helpers**: Develop a set of reusable test helpers to make mocking the plugin system more consistent.

2. **Add Integration Tests**: Implement integration tests for each provider using actual external services (when appropriate).

3. **Pydantic Warning Fixes**: Update the code to use the Pydantic V2 style `@field_validator` instead of `@validator` to resolve the warnings. 