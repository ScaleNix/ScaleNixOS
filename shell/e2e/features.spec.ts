import { test, expect } from '@playwright/test';
import { login, waitForDesktop, openLauncher, TEST_PASSWORD } from './helpers';

/** Open an app from the launcher by searching for it */
async function openAppBySearch(page: import('@playwright/test').Page, searchText: string) {
  await openLauncher(page);
  await page.fill('input[placeholder="Rechercher une application..."]', searchText);
  // Wait for search results and click the first app icon
  await page.waitForTimeout(300);
  await page.locator('.grid button').first().click();
}

test.describe('New Features — Admin (malik)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  test('Calculator opens and computes', async ({ page }) => {
    await openAppBySearch(page, 'Calcul');
    const calcDisplay = page.locator('[data-testid="calc-display"]');
    await expect(calcDisplay).toBeVisible({ timeout: 5000 });
    // Focus the calculator and use keyboard
    await page.locator('[data-testid="calc-display"]').click();
    await page.keyboard.press('7');
    await page.keyboard.press('+');
    await page.keyboard.press('3');
    await page.keyboard.press('Enter');
    await expect(calcDisplay).toHaveText('10');
  });

  test('World Clock opens with default zones', async ({ page }) => {
    await openAppBySearch(page, 'Horloge');
    await expect(page.locator('text=Paris').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Tokyo').first()).toBeVisible();
  });

  test('Task Manager opens', async ({ page }) => {
    await openAppBySearch(page, 'Gestionnaire');
    // Should show the task manager header
    await expect(page.locator('text=Gestionnaire de taches').or(page.locator('text=fenetres ouvertes')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Kanban board opens with default columns', async ({ page }) => {
    await openAppBySearch(page, 'Kanban');
    await expect(page.locator('text=A faire').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=En cours').first()).toBeVisible();
  });

  test('RSS Reader opens with sample feeds', async ({ page }) => {
    await openAppBySearch(page, 'RSS');
    await expect(page.locator('text=Tous les articles').or(page.locator('text=articles')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Text Editor opens', async ({ page }) => {
    await openAppBySearch(page, 'Editeur de texte');
    // Monaco or welcome content should be visible
    await page.waitForTimeout(3000);
    // Check for editor or welcome text
    const editor = page.locator('.monaco-editor').or(page.locator('text=Bienvenue'));
    await expect(editor.first()).toBeVisible({ timeout: 10000 });
  });

  test('Workspace switcher buttons are functional', async ({ page }) => {
    const ws1 = page.locator('button[title*="Bureau 1"]');
    const ws2 = page.locator('button[title*="Bureau 2"]');
    await expect(ws1).toBeVisible();
    await expect(ws2).toBeVisible();
    await ws2.click();
    await expect(ws2).toBeVisible();
  });

  test('Lock screen activates and dismisses', async ({ page }) => {
    await page.keyboard.press('Control+Alt+l');
    await page.waitForTimeout(500);
    // Lock screen should show unlock text
    const lockText = page.locator('text=deverrouiller').or(page.locator('text=Cliquez'));
    await expect(lockText.first()).toBeVisible({ timeout: 5000 });
    // Click to unlock
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await waitForDesktop(page);
  });

  test('Notification bell is visible in top bar', async ({ page }) => {
    await expect(page.locator('button[title="Notifications"]')).toBeVisible({ timeout: 5000 });
  });

  test('Lock button is visible in top bar', async ({ page }) => {
    await expect(page.locator('button[title*="Verrouiller"]')).toBeVisible({ timeout: 5000 });
  });

  test('Settings has theme management', async ({ page }) => {
    await openAppBySearch(page, 'Preferences');
    // Should have theme section
    await expect(page.locator('text=Theme').first()).toBeVisible({ timeout: 5000 });
  });

  test('App registry includes all new apps', async ({ page }) => {
    const response = await page.request.get('/apps/registry.json');
    const apps = await response.json();
    const ids = apps.map((a: any) => a.id);
    expect(ids).toContain('calculator');
    expect(ids).toContain('world-clock');
    expect(ids).toContain('task-manager');
    expect(ids).toContain('text-editor');
    expect(ids).toContain('screen-capture');
    expect(ids).toContain('kanban');
    expect(ids).toContain('rss-reader');
    expect(ids).toContain('clipboard-history');
    expect(ids).toContain('trash');
    expect(apps.length).toBeGreaterThanOrEqual(25);
  });
});
