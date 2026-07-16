import { test, expect } from '@playwright/test';
import { bypassEntryGate } from './helpers';

test.describe('Storefront', () => {
  test.beforeEach(async ({ page }) => {
    await bypassEntryGate(page);
  });

  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /browse library/i })).toBeVisible();
  });

  test('library page loads and shows products', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: /compound catalogue/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /add to cart|choose options/i }).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('cart empty state', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });
});

test.describe('Entry gate', () => {
  test('blocks until confirmed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Enter site' })).toBeDisabled();
    await page.getByRole('button', { name: 'I am 18 or over' }).click();
    await page.getByRole('checkbox').check();
    await expect(page.getByRole('button', { name: 'Enter site' })).toBeEnabled();
  });
});
