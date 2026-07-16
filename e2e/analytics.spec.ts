import { test, expect } from '@playwright/test';
import { bypassEntryGate, sampleCartItem, seedCart } from './helpers';

test.describe('Analytics admin', () => {
  test('redirects unauthenticated users from analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Mobile storefront', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await bypassEntryGate(page);
    await seedCart(page, [sampleCartItem]);
  });

  test('checkout form inputs are tappable on mobile', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    const email = page.locator('#email');
    await expect(email).toBeVisible();
    const box = await email.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
