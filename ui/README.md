# MLPie UI

Frontend for the MLPie MLOps platform.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## End-to-End Testing

The UI includes end-to-end tests using Playwright to help identify issues with the UI components and their interaction with the backend API.

### Setting up the testing environment

To set up the Playwright testing environment:

```bash
# Run the setup script
./tests/setup-e2e-tests.sh

# Or manually install
npm install
npx playwright install
npm install --save-dev ts-node
```

### Running tests

```bash
# Run all tests
npm test

# Run tests with browser UI visible
npm run test:headed

# Run only the secrets tests
npm run test:secrets

# Debug tests interactively
npm run test:debug

# View test report
npm run test:report

# Run tests with analysis (helps identify issues)
npm run test:analyze
```

### Test structure

- `tests/secrets/` - Contains tests for the Secrets tab in the settings page
  - `secrets-tab.spec.ts` - General functionality tests
  - `error-handling.spec.ts` - Tests for error conditions
  - `mock-success.spec.ts` - Tests with mocked successful API responses
- `tests/setupMocks.ts` - Utilities for mocking API responses
- `tests/run-e2e-tests.ts` - Script to run tests and analyze results for issues

### Mocking backend APIs

Tests use request interception to mock backend API responses. This allows testing the UI components in isolation and simulating various success and error conditions.

- For success cases: `setupApiMocks()` mocks successful API responses
- For error cases: `setupFailureScenarios()` mocks API error responses

### Analyzing test results

The `npm run test:analyze` command not only runs tests but also analyzes the results to help identify issues in the application. It specifically looks for common issues with the secret provider functionality and provides suggestions for fixing them.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
