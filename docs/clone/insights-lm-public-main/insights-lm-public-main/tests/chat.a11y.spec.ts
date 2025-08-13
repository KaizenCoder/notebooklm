import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

// A11y audit on Notebook chat page (serious+ violations must be 0)
test('notebook chat a11y - no serious violations', async ({ page }) => {
  await page.goto(`${BASE_URL}/notebook/00000000-0000-0000-0000-000000000010`);
  // Scope to main app content
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .include('main, #root')
    .analyze();

  const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact || 'minor'));
  expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
});
