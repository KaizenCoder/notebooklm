import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

// Chat minimal smoke
test('chat minimal flow', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  // Wait UI
  await expect(page.getByText('Chat')).toBeVisible();
  const input = page.getByPlaceholder('Start typing...');
  await input.fill('Hello');
  await page.getByRole('button', { name: /send/i }).click();
  await expect(page.getByText(/Echo:/)).toBeVisible();
});

// Ingestion minimal smoke (UI trigger; relies on Edge mock)
test('ingestion minimal trigger', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  await expect(page.getByText('Chat')).toBeVisible();
  // Ensure UI is rendered; ingestion dialogs would be covered in detailed tests.
  // Here we simply assert page structure for sanity.
  await expect(page.getByText(/sources?/i)).toBeVisible();
});
