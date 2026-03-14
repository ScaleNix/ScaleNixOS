/**
 * ScaleNix OS — Showcase Screenshot Suite
 *
 * Takes comprehensive screenshots of every app, feature, widget,
 * and desktop state for use in documentation and landing pages.
 *
 * Usage:
 *   E2E_PASSWORD=<password> npx playwright test e2e/showcase.spec.ts --project chromium
 *
 * Output: shell/showcase/ (PNG screenshots)
 */
import { test, expect, type Page } from '@playwright/test';
import { login, TEST_PASSWORD } from './helpers';

const SCREENSHOT_DIR = 'showcase';
const PAUSE = 800;  // ms to wait for animations
const LONG_PAUSE = 2000;

async function shot(page: Page, name: string) {
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
}

async function shotFull(page: Page, name: string) {
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

/** Clear localStorage widgets to get fresh default layout */
async function resetWidgets(page: Page) {
  await page.evaluate(() => localStorage.removeItem('scalenix-widgets'));
}

/** Open an app via Spotlight search */
async function openApp(page: Page, searchText: string) {
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(400);
  const input = page.locator('input[placeholder*="Rechercher"]').last();
  await input.fill(searchText);
  await page.waitForTimeout(400);
  await page.locator(`text=${searchText}`).first().click();
  await page.waitForTimeout(LONG_PAUSE);
}

/** Close all windows by clicking close buttons */
async function closeAllWindows(page: Page) {
  const closeButtons = page.locator('[title="Fermer"]');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click();
    await page.waitForTimeout(300);
  }
}

/** Dismiss onboarding if shown */
async function dismissOnboarding(page: Page) {
  try {
    const skipBtn = page.locator('button:has-text("Passer")');
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await page.waitForTimeout(500);
  } catch { /* not shown */ }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 1: DESKTOP & SHELL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('01 — Desktop & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('01-desktop-clean', async ({ page }) => {
    // Hide all widgets for clean desktop
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '01-desktop-clean');
  });

  test('02-desktop-with-widgets', async ({ page }) => {
    // Widgets should auto-load from defaults
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '02-desktop-widgets');
  });

  test('03-taskbar-detail', async ({ page }) => {
    // Crop taskbar area (h-[44px] bar at the bottom)
    const taskbar = page.locator('.h-\\[44px\\]').first();
    if (await taskbar.isVisible()) {
      await taskbar.screenshot({ path: `${SCREENSHOT_DIR}/03-taskbar.png` });
    } else {
      await shot(page, '03-taskbar');
    }
  });

  test('04-launcher', async ({ page }) => {
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, '04-launcher-full');
  });

  test('05-launcher-categories', async ({ page }) => {
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);

    // Click each category tab
    const categories = ['Communication', 'Productivit', 'Outils', 'Multim', 'Syst'];
    for (const cat of categories) {
      const tab = page.locator(`text=${cat}`).first();
      if (await tab.isVisible()) {
        await tab.click({ force: true });
        await page.waitForTimeout(400);
        const safeName = cat.replace(/[^a-z]/gi, '').toLowerCase();
        await shot(page, `05-launcher-${safeName}`);
      }
    }
  });

  test('06-spotlight-search', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    await shot(page, '06-spotlight-empty');

    const input = page.locator('input[placeholder*="Rechercher"]').last();
    await input.fill('Cal');
    await page.waitForTimeout(400);
    await shot(page, '06-spotlight-search');
  });

  test('07-notification-center', async ({ page }) => {
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, '07-notifications');
  });

  test('08-quick-settings', async ({ page }) => {
    const qs = page.locator('button[title*="Param"]').or(page.locator('button[title*="param"]'));
    if (await qs.first().isVisible()) {
      await qs.first().click();
      await page.waitForTimeout(PAUSE);
      await shot(page, '08-quick-settings');
    }
  });

  test('09-calendar-popup', async ({ page }) => {
    // Click the clock/time in taskbar
    const calBtn = page.locator('button[title*="Calendrier"]');
    if (await calBtn.first().isVisible()) {
      await calBtn.first().click();
      await page.waitForTimeout(PAUSE);
      await shot(page, '09-calendar-popup');
    }
  });

  test('10-volume-popup', async ({ page }) => {
    const vol = page.locator('button[title*="Volume"]').or(page.locator('button[title*="volume"]'));
    if (await vol.first().isVisible()) {
      await vol.first().click();
      await page.waitForTimeout(PAUSE);
      await shot(page, '10-volume-popup');
    }
  });

  test('11-right-click-menu', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 400, y: 300 } });
    await page.waitForTimeout(PAUSE);
    await shot(page, '11-context-menu');
  });

  test('12-onboarding', async ({ page }) => {
    // Clear onboarding flag and reload
    await page.evaluate(() => localStorage.removeItem('scalenix-onboarding-done'));
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(LONG_PAUSE);
    const welcome = page.locator('text=Bienvenue');
    if (await welcome.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await shot(page, '12-onboarding-step1');

      const nextBtn = page.locator('button:has-text("Suivant")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(PAUSE);
        await shot(page, '12-onboarding-step2');
        await nextBtn.click();
        await page.waitForTimeout(PAUSE);
        await shot(page, '12-onboarding-step3');
      }
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 2: NATIVE APPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('02 — Native Apps', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    // Hide widgets to get clean app screenshots
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('20-file-explorer', async ({ page }) => {
    await openApp(page, 'Explorateur');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '20-file-explorer');
  });

  test('21-calculator', async ({ page }) => {
    await openApp(page, 'Calculatrice');
    // Type some calculation
    await page.waitForTimeout(PAUSE);
    await page.keyboard.type('42*3.14');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(PAUSE);
    await shot(page, '21-calculator');
  });

  test('22-text-editor', async ({ page }) => {
    await openApp(page, 'Editeur de texte');
    await page.waitForTimeout(LONG_PAUSE * 2);
    await shot(page, '22-text-editor');
  });

  test('23-kanban-board', async ({ page }) => {
    await openApp(page, 'Kanban');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '23-kanban');
  });

  test('24-settings', async ({ page }) => {
    await openApp(page, 'Preferences');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '24-settings');
  });

  test('25-rss-reader', async ({ page }) => {
    await openApp(page, 'RSS');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '25-rss-reader');
  });

  test('26-world-clock', async ({ page }) => {
    await openApp(page, 'Horloge');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '26-world-clock');
  });

  test('27-task-manager', async ({ page }) => {
    await openApp(page, 'Gestionnaire');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '27-task-manager');
  });

  test('28-clipboard-history', async ({ page }) => {
    await page.keyboard.press('Control+Shift+V');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '28-clipboard-history');
  });

  test('29-screen-capture', async ({ page }) => {
    await openApp(page, 'Capture');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '29-screen-capture');
  });

  test('30-audio-mixer', async ({ page }) => {
    await openApp(page, 'Audio');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '30-audio-mixer');
  });

  test('31-user-profile', async ({ page }) => {
    await openApp(page, 'Profil');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '31-user-profile');
  });

  test('32-directory', async ({ page }) => {
    await openApp(page, 'Annuaire');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '32-directory');
  });

  test('33-app-store', async ({ page }) => {
    await openApp(page, 'App Store');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '33-app-store');
  });

  test('34-trash', async ({ page }) => {
    await openApp(page, 'Corbeille');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '34-trash');
  });

  test('35-widget-manager', async ({ page }) => {
    await openApp(page, 'Widgets');
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '35-widget-manager');
  });

  test('36-shortcut-settings', async ({ page }) => {
    // Open Settings, look for shortcuts section
    await openApp(page, 'Preferences');
    await page.waitForTimeout(LONG_PAUSE);
    // Try to find keyboard shortcuts section
    const shortcutsTab = page.locator('text=Raccourcis').or(page.locator('text=Shortcuts'));
    if (await shortcutsTab.first().isVisible()) {
      await shortcutsTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, '36-shortcuts');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 3: IFRAME APPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('03 — Iframe Apps', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('40-zimbra-mail', async ({ page }) => {
    const btn = page.locator('[title="Messagerie"]').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(5000); // Zimbra loads slowly
      await shot(page, '40-zimbra-mail');
    }
  });

  test('41-zimbra-calendar', async ({ page }) => {
    await openApp(page, 'Agenda');
    await page.waitForTimeout(5000);
    await shot(page, '41-zimbra-calendar');
  });

  test('42-nextcloud-files', async ({ page }) => {
    await openApp(page, 'Editeur');
    await page.waitForTimeout(5000);
    await shot(page, '42-onlyoffice');
  });

  test('43-matrix-chat', async ({ page }) => {
    await openApp(page, 'Chat');
    await page.waitForTimeout(5000);
    await shot(page, '43-matrix-chat');
  });

  test('44-grist', async ({ page }) => {
    await openApp(page, 'Grist');
    await page.waitForTimeout(5000);
    await shot(page, '44-grist');
  });

  test('45-visio', async ({ page }) => {
    await openApp(page, 'Visio');
    await page.waitForTimeout(5000);
    await shot(page, '45-visio');
  });

  test('46-terminal', async ({ page }) => {
    await openApp(page, 'Terminal');
    await page.waitForTimeout(5000);
    await shot(page, '46-terminal');
  });

  test('47-code-server', async ({ page }) => {
    await openApp(page, 'Code');
    await page.waitForTimeout(5000);
    await shot(page, '47-code-server');
  });

  test('48-outline', async ({ page }) => {
    await openApp(page, 'Notes');
    await page.waitForTimeout(5000);
    await shot(page, '48-outline');
  });

  test('49-ghost-blog', async ({ page }) => {
    await openApp(page, 'Blog');
    await page.waitForTimeout(5000);
    await shot(page, '49-ghost-blog');
  });

  test('50-vaultwarden', async ({ page }) => {
    await openApp(page, 'Mots de passe');
    await page.waitForTimeout(5000);
    await shot(page, '50-vaultwarden');
  });

  test('51-admin-keycloak', async ({ page }) => {
    await openApp(page, 'Admin IAM');
    await page.waitForTimeout(5000);
    await shot(page, '51-keycloak-admin');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 4: WINDOW MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('04 — Window Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('60-multi-window', async ({ page }) => {
    // Open several apps at once
    await openApp(page, 'Calculatrice');
    await openApp(page, 'Horloge');
    await openApp(page, 'Kanban');
    await page.waitForTimeout(PAUSE);
    await shot(page, '60-multi-window');
  });

  test('61-window-snap-left', async ({ page }) => {
    await openApp(page, 'Calculatrice');
    await page.waitForTimeout(PAUSE);
    // Drag window to left edge to snap
    const titleBar = page.locator('.cursor-grab').first();
    const box = await titleBar.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(5, 400, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(PAUSE);
      await shot(page, '61-snap-left');
    }
  });

  test('62-alt-tab', async ({ page }) => {
    await openApp(page, 'Calculatrice');
    await openApp(page, 'Horloge');
    await openApp(page, 'Kanban');
    // Alt+Tab
    await page.keyboard.down('Alt');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(PAUSE);
    await shot(page, '62-alt-tab');
    await page.keyboard.up('Alt');
  });

  test('63-maximized-window', async ({ page }) => {
    await openApp(page, 'Kanban');
    await page.waitForTimeout(PAUSE);
    // Double-click title bar to maximize
    const titleBar = page.locator('.cursor-grab').first();
    if (await titleBar.isVisible()) {
      await titleBar.dblclick();
      await page.waitForTimeout(PAUSE);
      await shot(page, '63-maximized');
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 5: WIDGETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('05 — Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('70-all-default-widgets', async ({ page }) => {
    // Reset to defaults and reload
    await resetWidgets(page);
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '70-widgets-default');
  });

  test('71-weather-widget', async ({ page }) => {
    // Add weather widget via Widget Manager
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      const widgets = raw ? JSON.parse(raw) : [];
      widgets.push({ id: 'showcase-weather', type: 'weather', x: 100, y: 100, w: 300, h: 240, visible: true, data: {} });
      localStorage.setItem('scalenix-widgets', JSON.stringify(widgets));
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '71-weather-widget');
  });

  test('72-pomodoro-widget', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      const widgets = raw ? JSON.parse(raw) : [];
      widgets.push({ id: 'showcase-pomodoro', type: 'pomodoro', x: 100, y: 100, w: 260, h: 240, visible: true, data: {} });
      localStorage.setItem('scalenix-widgets', JSON.stringify(widgets));
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '72-pomodoro-widget');
  });

  test('73-quote-widget', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      const widgets = raw ? JSON.parse(raw) : [];
      widgets.push({ id: 'showcase-quote', type: 'quote', x: 100, y: 100, w: 320, h: 180, visible: true, data: {} });
      localStorage.setItem('scalenix-widgets', JSON.stringify(widgets));
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '73-quote-widget');
  });

  test('74-quick-links-widget', async ({ page }) => {
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      const widgets = raw ? JSON.parse(raw) : [];
      widgets.push({ id: 'showcase-links', type: 'quick-links', x: 100, y: 100, w: 300, h: 260, visible: true, data: {} });
      localStorage.setItem('scalenix-widgets', JSON.stringify(widgets));
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '74-quick-links');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 6: THEMES & PERSONALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('06 — Themes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
  });

  test('80-dark-theme', async ({ page }) => {
    // Ensure dark theme
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-theme');
      if (raw) {
        const theme = JSON.parse(raw);
        theme.state.mode = 'dark';
        localStorage.setItem('scalenix-theme', JSON.stringify(theme));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);

    // Open launcher on dark
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, '80-dark-launcher');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Open an app on dark
    await openApp(page, 'Calculatrice');
    await shot(page, '80-dark-calculator');
  });

  test('81-light-theme', async ({ page }) => {
    // Switch to light theme
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-theme');
      if (raw) {
        const theme = JSON.parse(raw);
        theme.state.mode = 'light';
        localStorage.setItem('scalenix-theme', JSON.stringify(theme));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '81-light-desktop');

    // Launcher in light
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, '81-light-launcher');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await openApp(page, 'Calculatrice');
    await shot(page, '81-light-calculator');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 7: i18n
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('07 — Languages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('scalenix-widgets');
      if (raw) {
        const widgets = JSON.parse(raw);
        const hidden = widgets.map((w: any) => ({ ...w, visible: false }));
        localStorage.setItem('scalenix-widgets', JSON.stringify(hidden));
      }
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
  });

  const languages = [
    { code: 'fr', name: 'french' },
    { code: 'en', name: 'english' },
    { code: 'it', name: 'italian' },
    { code: 'es', name: 'spanish' },
    { code: 'de', name: 'german' },
  ];

  for (const lang of languages) {
    test(`90-launcher-${lang.name}`, async ({ page }) => {
      // Set language
      await page.evaluate((l) => {
        const raw = localStorage.getItem('scalenix-i18n');
        if (raw) {
          const store = JSON.parse(raw);
          store.state.lang = l;
          localStorage.setItem('scalenix-i18n', JSON.stringify(store));
        } else {
          localStorage.setItem('scalenix-i18n', JSON.stringify({ state: { lang: l }, version: 0 }));
        }
      }, lang.code);
      await page.reload();
      await expect(page.locator('[title*="Application"]').or(page.locator('[title*="Anwendungen"]'))).toBeVisible({ timeout: 60_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(LONG_PAUSE);

      // Open launcher
      const appBtn = page.locator('[title*="Application"]')
        .or(page.locator('[title*="Anwendungen"]'))
        .or(page.locator('[title*="Aplicaciones"]'))
        .or(page.locator('[title*="Applicazioni"]'));
      await appBtn.first().click();
      await page.waitForTimeout(PAUSE);
      await shot(page, `90-launcher-${lang.name}`);
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 8: HERO SHOTS (COMPOSITES)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('08 — Hero Shots', () => {
  test('99-hero-multi-app', async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    // Reset widgets for clean look
    await resetWidgets(page);
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(LONG_PAUSE);

    // Open several apps with good positioning
    await openApp(page, 'Calculatrice');
    await page.waitForTimeout(500);
    await openApp(page, 'Kanban');
    await page.waitForTimeout(500);

    // Take the hero shot with widgets + apps
    await page.waitForTimeout(LONG_PAUSE);
    await shot(page, '99-hero-desktop');
  });
});
