import { test, expect } from '@playwright/test';
import { login, waitForDesktop, TEST_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  test('redirects to Keycloak login page', async ({ page }) => {
    await page.goto('/');
    // Should redirect to auth.scalenix.fr Keycloak login
    await expect(page).toHaveURL(/auth\.scalenix\.fr/, { timeout: 30_000 });
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#kc-login')).toBeVisible();
  });

  test('login as admin (malik)', async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
    // Taskbar system tray shows username
    await expect(page.locator('text=malik')).toBeVisible();
  });

  test('login as developer (alice)', async ({ page }) => {
    await login(page, 'alice');
    await waitForDesktop(page);
    await expect(page.locator('text=alice')).toBeVisible();
  });

  test('login as user (bob)', async ({ page }) => {
    await login(page, 'bob');
    await waitForDesktop(page);
    await expect(page.locator('text=bob')).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#username', { timeout: 30_000 });
    await page.fill('#username', 'malik');
    await page.fill('#password', 'wrongpassword');
    await page.click('#kc-login');
    // Keycloak shows error message
    await expect(page.locator('.alert-error, #input-error, .kc-feedback-text')).toBeVisible({ timeout: 10_000 });
  });
});
