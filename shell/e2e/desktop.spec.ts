import { test, expect } from '@playwright/test';
import { login, waitForDesktop, openLauncher } from './helpers';

test.describe('Desktop — Admin (malik)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  test('Taskbar shows time and user info', async ({ page }) => {
    // Time format: HH:MM visible in taskbar
    await expect(page.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible();
    // Username shown in system tray
    await expect(page.locator('text=malik')).toBeVisible();
  });

  test('Desktop icons are visible', async ({ page }) => {
    await expect(page.locator('text=Fichiers')).toBeVisible();
    await expect(page.locator('text=Messagerie')).toBeVisible();
    await expect(page.locator('text=Agenda')).toBeVisible();
  });

  test('Launcher opens and closes', async ({ page }) => {
    await openLauncher(page);
    const searchInput = page.locator('input[placeholder="Rechercher une application..."]');
    await expect(searchInput).toBeVisible();
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });

  test('Launcher search filters apps', async ({ page }) => {
    await openLauncher(page);
    const searchInput = page.locator('input[placeholder="Rechercher une application..."]');
    await searchInput.fill('Terminal');
    // Should show Terminal in launcher list
    await expect(page.locator('button:has-text("Terminal")').first()).toBeVisible();
    // Clear and search for non-existent
    await searchInput.fill('nonexistent_xyz');
    await expect(page.locator('text=Aucune application trouvee')).toBeVisible();
  });

  test('Launcher category filters work', async ({ page }) => {
    await openLauncher(page);
    // Click "Communication" filter in sidebar
    await page.click('text=Communication');
    // Should show Messagerie and Agenda
    await expect(page.locator('button:has-text("Messagerie")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Agenda")').first()).toBeVisible();
  });

  test('Launcher shows admin apps for admin user', async ({ page }) => {
    await openLauncher(page);
    const searchInput = page.locator('input[placeholder="Rechercher une application..."]');
    // Admin should see Terminal
    await searchInput.fill('Terminal');
    await expect(page.locator('button:has-text("Terminal")').first()).toBeVisible();
    // Admin should see Admin IAM
    await searchInput.fill('Admin');
    await expect(page.locator('button:has-text("Admin IAM")').first()).toBeVisible();
  });

  test('Workspace switcher is visible', async ({ page }) => {
    // Should see workspace buttons 1, 2, 3
    await expect(page.locator('button[title*="Bureau 1"]')).toBeVisible();
    await expect(page.locator('button[title*="Bureau 2"]')).toBeVisible();
    await expect(page.locator('button[title*="Bureau 3"]')).toBeVisible();
  });
});

test.describe('Desktop — User (bob)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'bob');
    await waitForDesktop(page);
  });

  test('Launcher does NOT show Terminal or Admin IAM for regular user', async ({ page }) => {
    await openLauncher(page);
    const searchInput = page.locator('input[placeholder="Rechercher une application..."]');
    await searchInput.fill('Terminal');
    await expect(page.locator('text=Aucune application trouvee')).toBeVisible();
    await searchInput.fill('Admin IAM');
    await expect(page.locator('text=Aucune application trouvee')).toBeVisible();
  });

  test('Desktop icons do NOT show Terminal for regular user', async ({ page }) => {
    const desktopTerminal = page.locator('button:has-text("Terminal")').first();
    await expect(desktopTerminal).not.toBeVisible();
  });
});

test.describe('Desktop — Developer (alice)', () => {
  test('Developer sees Terminal but not Admin IAM in launcher', async ({ page }) => {
    await login(page, 'alice');
    await waitForDesktop(page);
    await openLauncher(page);
    const searchInput = page.locator('input[placeholder="Rechercher une application..."]');
    await searchInput.fill('Terminal');
    await expect(page.locator('button:has-text("Terminal")').first()).toBeVisible();
    await searchInput.fill('Admin IAM');
    await expect(page.locator('text=Aucune application trouvee')).toBeVisible();
  });
});
