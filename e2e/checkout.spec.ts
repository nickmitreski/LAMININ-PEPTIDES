import { test, expect } from '@playwright/test';
import { bypassEntryGate, sampleCartItem, seedCart } from './helpers';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await bypassEntryGate(page);
    await seedCart(page, [sampleCartItem]);
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.locator('#firstName')).toBeFocused({ timeout: 5_000 });
    await expect(page.getByText('Required').first()).toBeVisible();
  });

  test('order summary reflects cart item', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText(sampleCartItem.name)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled();
  });

  test('redirects to cart when cart is empty', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('laminin-cart', '[]'));
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /cart is empty/i })).toBeVisible();
  });
});
