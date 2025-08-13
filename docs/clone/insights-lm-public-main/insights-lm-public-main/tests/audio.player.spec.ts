import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test('audio player renders and has controls', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  // Player is in StudioSidebar when audio URL present; here we assert component mounts via selector fallback
  await expect(page.locator('audio')).toHaveCount(1);
});
