import { test, expect } from "@playwright/test";

/**
 * End-to-end tests for the Secrets settings page
 *
 * These tests interact with the actual backend API and
 * verify the entire user flow works correctly.
 */
test.describe("Secrets settings", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the settings page
    await page.goto("/settings");

    // Click on the Secrets tab
    await page.locator('button:has-text("Secrets")').click();

    // Wait for the tab to load
    await page.waitForSelector('h2:has-text("Secret Provider Configuration")');
  });

  test("should display the secrets configuration UI without errors", async ({
    page,
  }) => {
    // Verify the title is present
    await expect(
      page.locator('h2:has-text("Secret Provider Configuration")')
    ).toBeVisible();

    // The error banner should not be visible
    const errorElement = page.locator("text=Failed to load secret providers");
    await expect(errorElement).not.toBeVisible();

    // Verify the provider dropdown exists
    await expect(page.locator("select#provider")).toBeVisible();

    // Take a screenshot for documentation
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/secrets-settings.png",
    });
  });

  test("should be able to change between provider types", async ({ page }) => {
    // Make sure no error is present first
    const errorElement = page.locator("text=Failed to load secret providers");
    await expect(errorElement).not.toBeVisible();

    const providerSelect = page.locator("select#provider");

    // Switch to environment provider
    await providerSelect.selectOption("env");
    await expect(
      page.locator('label:has-text("Environment Variable Prefix")')
    ).toBeVisible();
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/env-provider-selected.png",
    });

    // Switch to database provider
    await providerSelect.selectOption("db");
    await expect(
      page.locator("text=Database provider uses the system database")
    ).toBeVisible();
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/db-provider-selected.png",
    });

    // Switch back to file provider
    await providerSelect.selectOption("file");
    await expect(page.locator('label:has-text("File Path")')).toBeVisible();
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/file-provider-selected.png",
    });
  });

  test("should be able to save file provider configuration", async ({
    page,
  }) => {
    // Make sure no error is present first
    const errorElement = page.locator("text=Failed to load secret providers");
    await expect(errorElement).not.toBeVisible();

    // Select file provider
    await page.locator("select#provider").selectOption("file");

    // Get the current path value
    const filePathInput = page.locator("input#filePath");
    await expect(filePathInput).toBeVisible();

    // Update with a test path
    await filePathInput.clear();
    await filePathInput.fill("/test/path/secrets.yml");
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/before-save-config.png",
    });

    // Click save
    await page.locator('button:has-text("Save Configuration")').click();

    // Check for success message
    const successElement = page.locator("text=Secret provider updated");
    await expect(successElement).toBeVisible({ timeout: 5000 });

    // Take a screenshot of the success state
    await page.screenshot({
      path: "tests/e2e/settings/screenshots/after-save-config.png",
    });
  });
});
