# Test info

- Name: Secrets settings >> should display the secrets configuration UI without errors
- Location: /Users/mohsen/Documents/me/mlpie/ui/tests/e2e/settings/secrets.spec.ts:21:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('select#provider')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('select#provider')

    at /Users/mohsen/Documents/me/mlpie/ui/tests/e2e/settings/secrets.spec.ts:34:51
```

# Page snapshot

```yaml
- complementary:
  - text: ML
  - heading "MLPie" [level=1]
  - navigation:
    - text: Main
    - list:
      - listitem:
        - link "Projects":
          - /url: /
          - img
          - text: Projects
      - listitem:
        - link "Pipelines":
          - /url: /pipelines
          - img
          - text: Pipelines
      - listitem:
        - link "Models":
          - /url: /models
          - img
          - text: Models
      - listitem:
        - link "Experiments":
          - /url: /models/experiments
          - img
          - text: Experiments
      - listitem:
        - link "Datasets":
          - /url: /datasets
          - img
          - text: Datasets
      - listitem:
        - link "Prompts":
          - /url: /prompts
          - img
          - text: Prompts
      - listitem:
        - link "Monitoring":
          - /url: /monitoring
          - img
          - text: Monitoring
      - listitem:
        - link "Plugins":
          - /url: /plugins
          - img
          - text: Plugins
      - listitem:
        - link "Settings":
          - /url: /settings
          - img
          - text: Settings
  - link "UD Demo User user@example.com":
    - /url: /settings
    - text: UD
    - paragraph: Demo User
    - paragraph: user@example.com
- main:
  - navigation "Breadcrumb":
    - list:
      - listitem:
        - link "Home":
          - /url: /
      - listitem: settings
  - heading "Settings" [level=1]
  - navigation "Tabs":
    - button "Profile"
    - button "Notifications"
    - button "API Keys"
    - button "Secrets"
    - button "Master Repository"
    - button "Appearance"
    - button "Security"
  - heading "Secret Provider Configuration" [level=2]
  - paragraph: Configure how the system manages and stores secrets like API keys, passwords, and tokens.
  - img
  - paragraph:
    - strong: "Note:"
    - text: The default secret provider can be configured at bootstrap time using environment variables. This UI allows changing the provider after deployment.
  - paragraph:
    - text: "Environment variables:"
    - code: MLPIE_SECRETS_PROVIDER
    - text: ","
    - code: MLPIE_SECRETS_FILE
    - text: ","
    - code: MLPIE_SECRETS_PASSWORD
    - text: ","
    - code: MLPIE_ENV_PREFIX
  - text: Loading Configuration...
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | /**
   4 |  * End-to-end tests for the Secrets settings page
   5 |  *
   6 |  * These tests interact with the actual backend API and
   7 |  * verify the entire user flow works correctly.
   8 |  */
   9 | test.describe("Secrets settings", () => {
   10 |   test.beforeEach(async ({ page }) => {
   11 |     // Go to the settings page
   12 |     await page.goto("/settings");
   13 |
   14 |     // Click on the Secrets tab
   15 |     await page.locator('button:has-text("Secrets")').click();
   16 |
   17 |     // Wait for the tab to load
   18 |     await page.waitForSelector('h2:has-text("Secret Provider Configuration")');
   19 |   });
   20 |
   21 |   test("should display the secrets configuration UI without errors", async ({
   22 |     page,
   23 |   }) => {
   24 |     // Verify the title is present
   25 |     await expect(
   26 |       page.locator('h2:has-text("Secret Provider Configuration")')
   27 |     ).toBeVisible();
   28 |
   29 |     // The error banner should not be visible
   30 |     const errorElement = page.locator("text=Failed to load secret providers");
   31 |     await expect(errorElement).not.toBeVisible();
   32 |
   33 |     // Verify the provider dropdown exists
>  34 |     await expect(page.locator("select#provider")).toBeVisible();
      |                                                   ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   35 |
   36 |     // Take a screenshot for documentation
   37 |     await page.screenshot({
   38 |       path: "tests/e2e/settings/screenshots/secrets-settings.png",
   39 |     });
   40 |   });
   41 |
   42 |   test("should be able to change between provider types", async ({ page }) => {
   43 |     // Make sure no error is present first
   44 |     const errorElement = page.locator("text=Failed to load secret providers");
   45 |     await expect(errorElement).not.toBeVisible();
   46 |
   47 |     const providerSelect = page.locator("select#provider");
   48 |
   49 |     // Switch to environment provider
   50 |     await providerSelect.selectOption("env");
   51 |     await expect(
   52 |       page.locator('label:has-text("Environment Variable Prefix")')
   53 |     ).toBeVisible();
   54 |     await page.screenshot({
   55 |       path: "tests/e2e/settings/screenshots/env-provider-selected.png",
   56 |     });
   57 |
   58 |     // Switch to database provider
   59 |     await providerSelect.selectOption("db");
   60 |     await expect(
   61 |       page.locator("text=Database provider uses the system database")
   62 |     ).toBeVisible();
   63 |     await page.screenshot({
   64 |       path: "tests/e2e/settings/screenshots/db-provider-selected.png",
   65 |     });
   66 |
   67 |     // Switch back to file provider
   68 |     await providerSelect.selectOption("file");
   69 |     await expect(page.locator('label:has-text("File Path")')).toBeVisible();
   70 |     await page.screenshot({
   71 |       path: "tests/e2e/settings/screenshots/file-provider-selected.png",
   72 |     });
   73 |   });
   74 |
   75 |   test("should be able to save file provider configuration", async ({
   76 |     page,
   77 |   }) => {
   78 |     // Make sure no error is present first
   79 |     const errorElement = page.locator("text=Failed to load secret providers");
   80 |     await expect(errorElement).not.toBeVisible();
   81 |
   82 |     // Select file provider
   83 |     await page.locator("select#provider").selectOption("file");
   84 |
   85 |     // Get the current path value
   86 |     const filePathInput = page.locator("input#filePath");
   87 |     await expect(filePathInput).toBeVisible();
   88 |
   89 |     // Update with a test path
   90 |     await filePathInput.clear();
   91 |     await filePathInput.fill("/test/path/secrets.yml");
   92 |     await page.screenshot({
   93 |       path: "tests/e2e/settings/screenshots/before-save-config.png",
   94 |     });
   95 |
   96 |     // Click save
   97 |     await page.locator('button:has-text("Save Configuration")').click();
   98 |
   99 |     // Check for success message
  100 |     const successElement = page.locator("text=Secret provider updated");
  101 |     await expect(successElement).toBeVisible({ timeout: 5000 });
  102 |
  103 |     // Take a screenshot of the success state
  104 |     await page.screenshot({
  105 |       path: "tests/e2e/settings/screenshots/after-save-config.png",
  106 |     });
  107 |   });
  108 | });
  109 |
```