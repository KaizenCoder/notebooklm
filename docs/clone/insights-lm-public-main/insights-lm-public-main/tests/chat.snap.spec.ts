import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test('notebook chat visual snapshot', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  await page.waitForLoadState('networkidle');
  // Focus on main chat area snapshot to reduce noise
  const chatHeader = await page.getByRole('heading', { name: 'Chat' });
  await expect(chatHeader).toBeVisible();
  await expect(page).toHaveScreenshot({ fullPage: false });
});
