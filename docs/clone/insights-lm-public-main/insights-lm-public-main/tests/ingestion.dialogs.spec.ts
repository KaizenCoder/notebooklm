import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test('ingestion dialogs render and accept file selection', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  await expect(page.getByRole('button', { name: /upload a source/i })).toBeVisible();
  await page.getByRole('button', { name: /upload a source/i }).click();
  await expect(page.getByText(/add sources/i)).toBeVisible();
  // verify upload area and inputs
  await expect(page.getByText(/upload sources/i)).toBeVisible();
  await expect(page.getByText(/supported file types/i)).toBeVisible();
});
