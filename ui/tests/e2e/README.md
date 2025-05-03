# End-to-End Tests for MLPie UI

This directory contains end-to-end tests using Playwright that verify the frontend UI works correctly.

## Structure

- `settings/` - Tests for different sections of the settings page
  - `secrets.spec.ts` - Tests for the Secrets tab in settings
  - `screenshots/` - Screenshots captured during test runs
- `common/` - Reusable test utilities and fixtures (future)

## Running Tests

Make sure both backend and frontend dependencies are installed:

```bash
# Install UI dependencies
cd ui
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run all tests

```bash
# From the ui directory
npm run test:e2e
```

### Run tests with browser UI visible

```bash
npm run test:headed
```

### Debug tests interactively

```bash
npm run test:debug
```

### View test report

```bash
npm run test:report
```

## Testing Strategy & Best Practices

These end-to-end tests focus on testing the complete user flows and UI interactions:

1. **Complete User Flows**: Tests verify that users can accomplish key tasks from beginning to end.

2. **Error Detection**: Tests expect the UI to function correctly without errors. Tests will fail if error messages appear in the UI.

3. **Visual Documentation**: Tests capture screenshots at key points for documentation and debugging purposes.

4. **Independent Tests**: Each test should be able to run independently of others.

## Notes

- Tests require both the backend API server (port 8000) and frontend server (port 3002) to be running.
- Screenshots are stored in the `screenshots` directory adjacent to the relevant test files. 