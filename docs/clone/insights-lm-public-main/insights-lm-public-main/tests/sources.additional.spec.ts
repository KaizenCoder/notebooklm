import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test('copied-text dialog flow', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  await page.getByRole('button', { name: /upload a source/i }).click();
  await page.getByRole('button', { name: /paste text - copied text/i }).click();
  await expect(page.getByText(/add copied text/i)).toBeVisible();
});

test('multiple-websites dialog flow', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  await page.getByRole('button', { name: /upload a source/i }).click();
  await page.getByRole('button', { name: /link - website/i }).click();
  await expect(page.getByText(/add multiple website urls/i)).toBeVisible();
});
