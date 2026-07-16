import { test, expect } from '@playwright/test';

test.describe('Admin', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: 'Admin login' })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('analytics redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email/i).fill('not-an-admin@example.com');
    await page.getByLabel(/password/i).fill('wrong-password-123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(
      page.getByText(/invalid email|not configured|not marked as admin/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});
