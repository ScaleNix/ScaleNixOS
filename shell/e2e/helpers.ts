import { type Page, expect } from '@playwright/test';

export const TEST_PASSWORD = process.env.E2E_PASSWORD || 'changeme';

/**
 * Login to ScalenixOS via Keycloak.
 * Keycloak redirects to its login form; we fill creds and submit.
 */
export async function login(page: Page, username: string, password: string = TEST_PASSWORD) {
  await page.goto('/');
  // Keycloak login form — may take time to redirect
  await page.waitForSelector('#username', { timeout: 60_000 });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#kc-login');
  // Wait for desktop to load — Taskbar shows the Applications button
  await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
  // Dismiss onboarding wizard if visible (it overlays everything on first launch)
  try {
    const skipBtn = page.locator('button:has-text("Passer")');
    await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
    await skipBtn.click();
    await page.waitForTimeout(500);
  } catch {
    // Onboarding not shown — already completed
  }
}

/** Wait until the desktop is fully loaded (app registry fetched). */
export async function waitForDesktop(page: Page) {
  // Taskbar should have the Applications launcher button
  await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 15_000 });
}

/** Open the launcher overlay. */
export async function openLauncher(page: Page) {
  await page.click('[title="Applications (Meta+Space)"]');
  await expect(page.locator('input[placeholder="Rechercher une application..."]')).toBeVisible();
}

/** Open an app by clicking its pinned icon in the taskbar. */
export async function openAppFromTaskbar(page: Page, appLabel: string) {
  const taskbar = page.locator('[title="' + appLabel + '"]').first();
  await taskbar.click();
}
