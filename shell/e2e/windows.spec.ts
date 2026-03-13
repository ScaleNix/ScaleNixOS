import { test, expect, type Page } from '@playwright/test';
import { login, waitForDesktop } from './helpers';

/** Open Messagerie (Zimbra Mail) from desktop icon and return the window element. */
async function openMessagerieWindow(page: Page) {
  // Double-click the desktop icon
  await page.locator('button:has-text("Messagerie")').first().dblclick();
  // Wait for window to appear
  const win = page.locator('.animate-window-open:has-text("Messagerie")').first();
  await expect(win).toBeVisible({ timeout: 10_000 });
  return win;
}

test.describe('Window Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  test('open window from taskbar', async ({ page }) => {
    const win = await openMessagerieWindow(page);
    // Window has title bar with app name
    await expect(win.locator('.truncate:has-text("Messagerie")')).toBeVisible();
    // Window has close/minimize/maximize buttons
    await expect(win.locator('[aria-label="Fermer"]')).toBeVisible();
    await expect(win.locator('[aria-label="Minimiser"]')).toBeVisible();
  });

  test('open window from desktop icon (double-click)', async ({ page }) => {
    // Double-click "Fichiers" desktop icon
    const icon = page.locator('button:has-text("Fichiers")').first();
    await icon.dblclick();
    // Wait for window
    await expect(page.locator('.animate-window-open:has-text("Fichiers")').first()).toBeVisible({ timeout: 10_000 });
  });

  test('close window', async ({ page }) => {
    await openMessagerieWindow(page);
    // Click close button
    await page.locator('[aria-label="Fermer"]').first().click();
    // Window should disappear
    await expect(page.locator('.animate-window-open:has-text("Messagerie")')).not.toBeVisible({ timeout: 5_000 });
  });

  test('minimize and maximize buttons exist on window', async ({ page }) => {
    // Open Fichiers from desktop icon
    await page.locator('button:has-text("Fichiers")').first().dblclick();
    const win = page.locator('.animate-window-open:has-text("Fichiers")').first();
    await expect(win).toBeVisible({ timeout: 10_000 });
    // Verify minimize/maximize/close buttons exist
    await expect(win.locator('[aria-label="Minimiser"]')).toBeVisible();
    await expect(win.locator('[aria-label="Maximiser"]')).toBeVisible();
    await expect(win.locator('[aria-label="Fermer"]')).toBeVisible();
    // Click minimize
    await win.locator('[aria-label="Minimiser"]').click();
    // Window should disappear from view
    await expect(win).not.toBeVisible({ timeout: 5_000 });
  });

  test('maximize and restore window', async ({ page }) => {
    const win = await openMessagerieWindow(page);
    const initialBox = await win.boundingBox();
    expect(initialBox).not.toBeNull();

    // Click maximize (green dot)
    await page.locator('[aria-label="Maximiser"]').first().click();
    await page.waitForTimeout(300);

    const maximizedBox = await win.boundingBox();
    expect(maximizedBox).not.toBeNull();
    // Maximized should be larger than initial
    expect(maximizedBox!.width).toBeGreaterThan(initialBox!.width);
    expect(maximizedBox!.height).toBeGreaterThan(initialBox!.height);

    // Click restore (green dot again, now labeled "Restaurer")
    await page.locator('[aria-label="Restaurer"]').first().click();
    await page.waitForTimeout(300);

    const restoredBox = await win.boundingBox();
    expect(restoredBox).not.toBeNull();
    // Should be back to roughly initial size (within 100px tolerance)
    expect(Math.abs(restoredBox!.width - initialBox!.width)).toBeLessThan(100);
    expect(Math.abs(restoredBox!.height - initialBox!.height)).toBeLessThan(100);
  });

  test('drag window', async ({ page }) => {
    const win = await openMessagerieWindow(page);
    const initialBox = await win.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag the title bar
    const titleBar = win.locator('.cursor-grab').first();
    const titleBox = await titleBar.boundingBox();
    expect(titleBox).not.toBeNull();

    const startX = titleBox!.x + titleBox!.width / 2;
    const startY = titleBox!.y + titleBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50, { steps: 10 });
    await page.mouse.up();

    const movedBox = await win.boundingBox();
    expect(movedBox).not.toBeNull();
    // Window should have moved (within 50px tolerance for sub-pixel/DPI)
    expect(Math.abs(movedBox!.x - (initialBox!.x + 100))).toBeLessThan(50);
    expect(Math.abs(movedBox!.y - (initialBox!.y + 50))).toBeLessThan(50);
  });

  test('multiple windows — focus on click', async ({ page }) => {
    // Open Messagerie from desktop icon
    await page.locator('button:has-text("Messagerie")').first().dblclick();
    await expect(page.locator('.animate-window-open:has-text("Messagerie")').first()).toBeVisible({ timeout: 10_000 });

    // Open Fichiers from desktop icon
    await page.locator('button:has-text("Fichiers")').first().dblclick();
    await expect(page.locator('.animate-window-open:has-text("Fichiers")').first()).toBeVisible({ timeout: 10_000 });

    // Click on Messagerie window's title bar to bring it to front (avoid iframe interception)
    const msgWin = page.locator('.animate-window-open:has-text("Messagerie")').first();
    await msgWin.locator('.cursor-grab').first().click();

    // Verify Messagerie window has higher z-index (it's now focused)
    const msgZIndex = await msgWin.evaluate((el) => parseInt(el.style.zIndex));
    const filesWin = page.locator('.animate-window-open:has-text("Fichiers")').first();
    const filesZIndex = await filesWin.evaluate((el) => parseInt(el.style.zIndex));
    expect(msgZIndex).toBeGreaterThan(filesZIndex);
  });

  test('window contains iframe', async ({ page }) => {
    await openMessagerieWindow(page);
    // The window should contain an iframe
    const iframe = page.locator('.animate-window-open:has-text("Messagerie") iframe').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });
    // iframe src should point to Zimbra
    const src = await iframe.getAttribute('src');
    expect(src).toContain('zimbradev3.ext.benmekki.com');
  });
});
