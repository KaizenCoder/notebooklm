import { test, expect } from '@playwright/test';

const NOTEBOOK_ID = '00000000-0000-0000-0000-000000000010';

// Basic a11y smoke placeholder (no axe integration in clone)
// Ensures the page renders key landmarks used by FE flows.
test('Notebook page renders key sections', async ({ page }) => {
  await page.goto(`/notebook/${NOTEBOOK_ID}`);
  await expect(page.getByText('Chat')).toBeVisible();
  await expect(page.getByText(/sources?/i)).toBeVisible();
});
