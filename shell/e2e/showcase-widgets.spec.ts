/**
 * ScaleNix OS — Comprehensive Widget & Desktop Screenshot Suite
 *
 * 200+ screenshots covering every widget type, combination, theme,
 * notification state, and desktop configuration.
 *
 * Usage:
 *   E2E_PASSWORD=<password> npx playwright test e2e/showcase-widgets.spec.ts --project chromium
 *
 * Output: shell/showcase/ (PNG screenshots, prefixed by section)
 */
import { test, expect, type Page } from '@playwright/test';
import { login, TEST_PASSWORD } from './helpers';

const DIR = 'showcase';
const PAUSE = 600;
const LONG = 1500;

// Desktop icons occupy ~4 columns × 4 rows in the top-left (up to ~400px × ~400px).
// Widgets must be placed to the right to avoid overlapping.
const ICON_SAFE_X = 400; // Minimum X for widgets to avoid icon overlap

// ─── Helpers ────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
}

async function dismissOnboarding(page: Page) {
  try {
    const btn = page.locator('button:has-text("Passer")');
    await btn.waitFor({ state: 'visible', timeout: 3000 });
    await btn.click();
    await page.waitForTimeout(400);
  } catch { /* not shown */ }
}

/** Set theme via localStorage and reload */
async function setTheme(page: Page, themeId: string) {
  await page.evaluate((id) => {
    localStorage.setItem('scalenix-theme', JSON.stringify({
      themeId: id, accentOverride: null, customWallpaper: null,
      taskbarPosition: 'bottom', taskbarSize: 'medium', taskbarAutoHide: false,
      animationsEnabled: true, animationSpeed: 'normal', autoTheme: 'off',
    }));
  }, themeId);
  await page.reload();
  await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
  await dismissOnboarding(page);
  await page.waitForTimeout(LONG);
}

/** Set widgets via localStorage and reload */
async function setWidgets(page: Page, widgets: any[]) {
  await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), widgets);
  await page.reload();
  await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
  await dismissOnboarding(page);
  await page.waitForTimeout(LONG);
}

/** Hide all widgets */
async function hideWidgets(page: Page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('scalenix-widgets');
    if (raw) {
      const w = JSON.parse(raw).map((x: any) => ({ ...x, visible: false }));
      localStorage.setItem('scalenix-widgets', JSON.stringify(w));
    }
  });
  await page.reload();
  await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
  await dismissOnboarding(page);
  await page.waitForTimeout(LONG);
}

/** Push a notification via store evaluate */
async function pushNotif(page: Page, type: string, title: string, message: string, category?: string) {
  await page.evaluate(({ t, ti, m, c }) => {
    const store = (window as any).__notifStore;
    if (store) {
      store.push({ type: t, title: ti, message: m, duration: 15000, category: c });
    }
  }, { t: type, m: message, ti: title, c: category });
  await page.waitForTimeout(300);
}

/** Open app via Spotlight */
async function openApp(page: Page, searchText: string) {
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(400);
  const input = page.locator('input[placeholder*="Rechercher"]').last();
  await input.fill(searchText);
  await page.waitForTimeout(400);
  await page.locator(`text=${searchText}`).first().click();
  await page.waitForTimeout(LONG);
}

// ─── Widget factory helpers ─────────────────────────────────────────

function w(id: string, type: string, x: number, y: number, w_: number, h: number, data: any = {}) {
  return { id, type, x, y, w: w_, h, visible: true, data };
}

// Standard centered position for solo widget screenshots
const CX = 490, CY = 200;

// ═══════════════════════════════════════════════════════════════
// SECTION W1: INDIVIDUAL WIDGETS — Solo shots of each type
// ═══════════════════════════════════════════════════════════════

test.describe('W1 — Individual Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  // ── Clock ──
  test('w100-clock-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'clock', CX, CY, 280, 150)]);
    await shot(page, 'w100-clock-default');
  });

  test('w101-clock-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'clock', 400, 150, 380, 200)]);
    await shot(page, 'w101-clock-large');
  });

  // ── Sticky Notes (4 colors) ──
  test('w110-sticky-yellow', async ({ page }) => {
    await setWidgets(page, [w('w1', 'sticky-note', CX, CY, 260, 220, { content: 'Welcome to ScaleNix OS!\n\nThis is a yellow sticky note.\nPerfect for quick reminders.', color: 'yellow' })]);
    await shot(page, 'w110-sticky-yellow');
  });

  test('w111-sticky-green', async ({ page }) => {
    await setWidgets(page, [w('w1', 'sticky-note', CX, CY, 260, 220, { content: 'Sprint objectives:\n- Deploy Traefik v3\n- Configure Keycloak SSO\n- Test WebDAV proxy', color: 'green' })]);
    await shot(page, 'w111-sticky-green');
  });

  test('w112-sticky-blue', async ({ page }) => {
    await setWidgets(page, [w('w1', 'sticky-note', CX, CY, 260, 220, { content: 'Meeting notes:\n\nDiscussed new auth flow.\nAction: update OIDC config.\nDeadline: Friday.', color: 'blue' })]);
    await shot(page, 'w112-sticky-blue');
  });

  test('w113-sticky-pink', async ({ page }) => {
    await setWidgets(page, [w('w1', 'sticky-note', CX, CY, 260, 220, { content: 'Ideas:\n\n• Dark mode improvements\n• Mobile responsive layout\n• Notification sounds', color: 'pink' })]);
    await shot(page, 'w113-sticky-pink');
  });

  test('w114-sticky-all-colors', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'sticky-note', 450, 80, 240, 200, { content: 'Yellow note\nDefault color', color: 'yellow' }),
      w('w2', 'sticky-note', 710, 80, 240, 200, { content: 'Green note\nFor tasks', color: 'green' }),
      w('w3', 'sticky-note', 580, 80, 240, 200, { content: 'Blue note\nFor ideas', color: 'blue' }),
      w('w4', 'sticky-note', 840, 80, 240, 200, { content: 'Pink note\nFor reminders', color: 'pink' }),
    ]);
    await shot(page, 'w114-sticky-all-colors');
  });

  // ── System Monitor ──
  test('w120-sysmon-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'system-monitor', CX, CY, 260, 190)]);
    await shot(page, 'w120-sysmon-default');
  });

  test('w121-sysmon-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'system-monitor', 400, 150, 360, 240)]);
    await shot(page, 'w121-sysmon-large');
  });

  // ── Weather ──
  test('w130-weather-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'weather', CX, CY, 300, 240)]);
    await shot(page, 'w130-weather-default');
  });

  test('w131-weather-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'weather', 770, 120, 400, 300)]);
    await shot(page, 'w131-weather-large');
  });

  // ── Calendar ──
  test('w140-calendar-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'calendar', CX, CY - 30, 280, 320)]);
    await shot(page, 'w140-calendar-default');
  });

  test('w141-calendar-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'calendar', 400, 80, 360, 400)]);
    await shot(page, 'w141-calendar-large');
  });

  // ── Todo List (various states) ──
  test('w150-todo-empty', async ({ page }) => {
    await setWidgets(page, [w('w1', 'todo-list', CX, CY, 260, 300, { items: [] })]);
    await shot(page, 'w150-todo-empty');
  });

  test('w151-todo-mixed', async ({ page }) => {
    await setWidgets(page, [w('w1', 'todo-list', CX, CY - 30, 280, 360, {
      items: [
        { id: 't1', text: 'Configure VPN for remote access', done: false },
        { id: 't2', text: 'Review Nextcloud module PR', done: false },
        { id: 't3', text: 'Test Keycloak SSO on mobile', done: false },
        { id: 't4', text: 'Update TLS certificates', done: true },
        { id: 't5', text: 'Deploy Traefik v3 reverse proxy', done: true },
        { id: 't6', text: 'Prepare client demo', done: false },
        { id: 't7', text: 'Write integration tests', done: true },
        { id: 't8', text: 'Document API endpoints', done: false },
      ]
    })]);
    await shot(page, 'w151-todo-mixed');
  });

  test('w152-todo-all-done', async ({ page }) => {
    await setWidgets(page, [w('w1', 'todo-list', CX, CY, 260, 300, {
      items: [
        { id: 't1', text: 'Setup CI/CD pipeline', done: true },
        { id: 't2', text: 'Deploy staging environment', done: true },
        { id: 't3', text: 'Run security audit', done: true },
        { id: 't4', text: 'Update documentation', done: true },
        { id: 't5', text: 'Release v4.0', done: true },
      ]
    })]);
    await shot(page, 'w152-todo-all-done');
  });

  // ── Quote ──
  test('w160-quote-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'quote', CX, CY, 340, 180)]);
    await shot(page, 'w160-quote-default');
  });

  test('w161-quote-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'quote', 740, 180, 440, 220)]);
    await shot(page, 'w161-quote-large');
  });

  // ── Pomodoro ──
  test('w170-pomodoro-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'pomodoro', CX, CY, 260, 240)]);
    await shot(page, 'w170-pomodoro-default');
  });

  test('w171-pomodoro-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'pomodoro', 420, 140, 340, 300)]);
    await shot(page, 'w171-pomodoro-large');
  });

  // ── Quick Links ──
  test('w180-quicklinks-default', async ({ page }) => {
    await setWidgets(page, [w('w1', 'quick-links', CX, CY, 300, 260)]);
    await shot(page, 'w180-quicklinks-default');
  });

  test('w181-quicklinks-custom', async ({ page }) => {
    await setWidgets(page, [w('w1', 'quick-links', CX, CY - 30, 320, 320, {
      links: [
        { id: 'l1', label: 'GitHub', url: 'https://github.com' },
        { id: 'l2', label: 'Wikipedia', url: 'https://wikipedia.org' },
        { id: 'l3', label: 'Google', url: 'https://google.com' },
        { id: 'l4', label: 'Nextcloud', url: 'https://nextcloud.com' },
        { id: 'l5', label: 'MDN Docs', url: 'https://developer.mozilla.org' },
        { id: 'l6', label: 'StackOverflow', url: 'https://stackoverflow.com' },
      ]
    })]);
    await shot(page, 'w181-quicklinks-custom');
  });

  // ── Zimbra Mail Widget ──
  test('w190-zimbra-mail', async ({ page }) => {
    await setWidgets(page, [w('w1', 'zimbra-mail', CX, CY - 50, 320, 360)]);
    await shot(page, 'w190-zimbra-mail');
  });

  // ── Zimbra Calendar Widget ──
  test('w191-zimbra-calendar', async ({ page }) => {
    await setWidgets(page, [w('w1', 'zimbra-calendar', CX, CY - 50, 300, 340)]);
    await shot(page, 'w191-zimbra-calendar');
  });

  // ── Zimbra Tasks Widget ──
  test('w192-zimbra-tasks', async ({ page }) => {
    await setWidgets(page, [w('w1', 'zimbra-tasks', CX, CY - 50, 300, 320)]);
    await shot(page, 'w192-zimbra-tasks');
  });

  // ── Matrix Chat Widget ──
  test('w193-matrix-chat', async ({ page }) => {
    await setWidgets(page, [w('w1', 'matrix-chat', CX, CY - 50, 320, 360)]);
    await shot(page, 'w193-matrix-chat');
  });

  test('w194-matrix-chat-large', async ({ page }) => {
    await setWidgets(page, [w('w1', 'matrix-chat', 740, 60, 420, 480)]);
    await shot(page, 'w194-matrix-chat-large');
  });

  // ── Nextcloud Files Widget ──
  test('w195-nextcloud-files', async ({ page }) => {
    await setWidgets(page, [w('w1', 'nextcloud-files', CX, CY - 50, 300, 340)]);
    await shot(page, 'w195-nextcloud-files');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W2: WIDGET PAIRS — Two widgets side by side
// ═══════════════════════════════════════════════════════════════

test.describe('W2 — Widget Pairs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w200-clock-calendar', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 420, 100, 280, 150),
      w('w2', 'calendar', 740, 100, 280, 320),
    ]);
    await shot(page, 'w200-clock-calendar');
  });

  test('w201-weather-clock', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'weather', 420, 100, 300, 240),
      w('w2', 'clock', 760, 100, 280, 150),
    ]);
    await shot(page, 'w201-weather-clock');
  });

  test('w202-todo-sticky', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'todo-list', 420, 80, 280, 360, {
        items: [
          { id: 't1', text: 'Deploy v4.0 release', done: false },
          { id: 't2', text: 'Update documentation', done: true },
          { id: 't3', text: 'Configure monitoring', done: false },
          { id: 't4', text: 'Setup backup scripts', done: true },
        ]
      }),
      w('w2', 'sticky-note', 740, 80, 260, 220, { content: 'Important:\n\nRelease deadline: Friday\nContact: malik@scalenix.fr\n\nDon\'t forget the demo!', color: 'yellow' }),
    ]);
    await shot(page, 'w202-todo-sticky');
  });

  test('w203-sysmon-pomodoro', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'system-monitor', 420, 120, 260, 190),
      w('w2', 'pomodoro', 720, 120, 260, 240),
    ]);
    await shot(page, 'w203-sysmon-pomodoro');
  });

  test('w204-chat-mail', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'matrix-chat', 420, 60, 320, 380),
      w('w2', 'zimbra-mail', 780, 60, 320, 380),
    ]);
    await shot(page, 'w204-chat-mail');
  });

  test('w205-quote-links', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'quote', 420, 120, 320, 180),
      w('w2', 'quick-links', 780, 120, 300, 260),
    ]);
    await shot(page, 'w205-quote-links');
  });

  test('w206-calendar-todo', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'calendar', 420, 80, 280, 340),
      w('w2', 'todo-list', 740, 80, 280, 340, {
        items: [
          { id: 't1', text: 'Team standup 10:00', done: true },
          { id: 't2', text: 'Code review session', done: false },
          { id: 't3', text: 'Update infrastructure', done: false },
          { id: 't4', text: 'Client presentation', done: false },
          { id: 't5', text: 'Deploy staging', done: true },
        ]
      }),
    ]);
    await shot(page, 'w206-calendar-todo');
  });

  test('w207-weather-quote', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'weather', 420, 120, 300, 240),
      w('w2', 'quote', 760, 140, 340, 180),
    ]);
    await shot(page, 'w207-weather-quote');
  });

  test('w208-mail-tasks', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'zimbra-mail', 420, 60, 320, 380),
      w('w2', 'zimbra-tasks', 780, 60, 300, 340),
    ]);
    await shot(page, 'w208-mail-tasks');
  });

  test('w209-files-calendar', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'nextcloud-files', 420, 80, 300, 340),
      w('w2', 'zimbra-calendar', 760, 80, 300, 340),
    ]);
    await shot(page, 'w209-files-calendar');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W3: WIDGET GROUPS — 3-6 widgets together
// ═══════════════════════════════════════════════════════════════

test.describe('W3 — Widget Groups', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w300-productivity-trio', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'todo-list', 450, 60, 280, 340, {
        items: [
          { id: 't1', text: 'Review pull requests', done: false },
          { id: 't2', text: 'Update dependencies', done: true },
          { id: 't3', text: 'Fix CSS regression', done: false },
          { id: 't4', text: 'Write unit tests', done: true },
          { id: 't5', text: 'Deploy to staging', done: false },
        ]
      }),
      w('w2', 'pomodoro', 770, 60, 260, 240),
      w('w3', 'sticky-note', 680, 60, 240, 200, { content: 'Focus mode!\n\nNo meetings until 14:00.\nFinish the PR review first.', color: 'green' }),
    ]);
    await shot(page, 'w300-productivity-trio');
  });

  test('w301-communication-hub', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'matrix-chat', 420, 40, 300, 380),
      w('w2', 'zimbra-mail', 740, 40, 300, 380),
      w('w3', 'zimbra-calendar', 420, 440, 280, 200),
    ]);
    await shot(page, 'w301-communication-hub');
  });

  test('w302-dashboard-layout', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 420, 30, 260, 130),
      w('w2', 'weather', 420, 180, 260, 200),
      w('w3', 'system-monitor', 700, 30, 240, 180),
      w('w4', 'todo-list', 700, 230, 240, 280, {
        items: [
          { id: 't1', text: 'Morning standup', done: true },
          { id: 't2', text: 'Deploy new features', done: false },
          { id: 't3', text: 'Update monitoring', done: false },
        ]
      }),
      w('w5', 'quote', 960, 30, 280, 140),
      w('w6', 'calendar', 960, 190, 260, 300),
    ]);
    await shot(page, 'w302-dashboard-layout');
  });

  test('w303-all-sticky-notes', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'sticky-note', 420, 40, 220, 190, { content: 'Project Alpha\n\n- Frontend ready\n- Backend WIP\n- Tests: 80%', color: 'yellow' }),
      w('w2', 'sticky-note', 660, 40, 220, 190, { content: 'Meeting Notes\n\nClient wants:\n- SSO integration\n- Mobile support', color: 'green' }),
      w('w3', 'sticky-note', 900, 40, 220, 190, { content: 'Bug Report\n\nIssue #42:\nCalendar not syncing\nafter timezone change', color: 'blue' }),
      w('w4', 'sticky-note', 420, 250, 220, 190, { content: 'Reminder\n\n- Team lunch Friday\n- Deploy Monday 9AM\n- Backup at midnight', color: 'pink' }),
      w('w5', 'sticky-note', 660, 250, 220, 190, { content: 'Infrastructure\n\n- Traefik v3 ✓\n- Keycloak 24 ✓\n- Nextcloud 29 ✓', color: 'yellow' }),
      w('w6', 'sticky-note', 900, 250, 220, 190, { content: 'Tech Debt\n\n- Refactor auth flow\n- Update TypeScript\n- Clean up imports', color: 'green' }),
    ]);
    await shot(page, 'w303-all-sticky-notes');
  });

  test('w304-info-dashboard', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 420, 30, 280, 140),
      w('w2', 'weather', 420, 190, 280, 220),
      w('w3', 'quote', 740, 30, 340, 160),
      w('w4', 'quick-links', 740, 210, 300, 260),
    ]);
    await shot(page, 'w304-info-dashboard');
  });

  test('w305-work-layout', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'zimbra-mail', 420, 30, 300, 360),
      w('w2', 'zimbra-calendar', 740, 30, 260, 280),
      w('w3', 'zimbra-tasks', 740, 330, 260, 260),
      w('w4', 'sticky-note', 1020, 30, 220, 190, { content: 'Today\'s priority:\n\n1. Review emails\n2. Attend sync\n3. Update tasks', color: 'yellow' }),
      w('w5', 'pomodoro', 1020, 240, 220, 200),
    ]);
    await shot(page, 'w305-work-layout');
  });

  test('w306-dev-dashboard', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'system-monitor', 420, 30, 260, 190),
      w('w2', 'todo-list', 420, 240, 260, 300, {
        items: [
          { id: 't1', text: 'git pull origin main', done: true },
          { id: 't2', text: 'npm run test', done: true },
          { id: 't3', text: 'Fix failing e2e', done: false },
          { id: 't4', text: 'git push feature/v4', done: false },
          { id: 't5', text: 'Open PR for review', done: false },
        ]
      }),
      w('w3', 'matrix-chat', 700, 30, 300, 340),
      w('w4', 'quick-links', 1020, 30, 240, 240, {
        links: [
          { id: 'l1', label: 'GitHub', url: 'https://github.com' },
          { id: 'l2', label: 'CI/CD', url: 'https://ci.scalenix.fr' },
          { id: 'l3', label: 'Grafana', url: 'https://grafana.scalenix.fr' },
          { id: 'l4', label: 'Docs', url: 'https://docs.scalenix.fr' },
        ]
      }),
    ]);
    await shot(page, 'w306-dev-dashboard');
  });

  test('w307-minimal-setup', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 280, 140),
      w('w2', 'quote', 860, 190, 340, 160),
    ]);
    await shot(page, 'w307-minimal-setup');
  });

  test('w308-full-desktop-widgets', async ({ page }) => {
    await setWidgets(page, [
      // Row 1
      w('w1', 'clock', 420, 15, 240, 120),
      w('w2', 'weather', 680, 15, 260, 200),
      w('w3', 'system-monitor', 960, 15, 230, 170),
      w('w4', 'pomodoro', 960, 200, 230, 200),
      // Row 2
      w('w5', 'sticky-note', 420, 150, 230, 170, { content: 'Sprint Week 12\n\nFocus: stability\nand performance', color: 'yellow' }),
      w('w6', 'calendar', 420, 340, 240, 280),
      w('w7', 'todo-list', 680, 230, 250, 280, {
        items: [
          { id: 't1', text: 'Deploy v4.0', done: false },
          { id: 't2', text: 'Run load tests', done: true },
          { id: 't3', text: 'Update docs', done: false },
        ]
      }),
      w('w8', 'quote', 680, 530, 280, 120),
      w('w9', 'quick-links', 960, 420, 240, 230),
      w('w10', 'matrix-chat', 900, 260, 300, 360),
    ]);
    await shot(page, 'w308-full-desktop-widgets');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W4: THEMED WIDGETS — Same layout across all themes
// ═══════════════════════════════════════════════════════════════

test.describe('W4 — Themed Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  const SHOWCASE_WIDGETS = [
    w('w1', 'clock', 420, 30, 260, 130),
    w('w2', 'weather', 700, 30, 280, 220),
    w('w3', 'sticky-note', 1000, 30, 220, 190, { content: 'ScaleNix OS\n\nTheme showcase!', color: 'yellow' }),
    w('w4', 'todo-list', 420, 180, 260, 280, {
      items: [
        { id: 't1', text: 'Try all themes', done: true },
        { id: 't2', text: 'Pick your favorite', done: false },
        { id: 't3', text: 'Customize accent', done: false },
      ]
    }),
    w('w5', 'system-monitor', 700, 270, 260, 180),
    w('w6', 'pomodoro', 1000, 240, 220, 210),
  ];

  const themes = [
    'midnight', 'ocean', 'aurora', 'forest', 'sunset', 'light', 'rose',
  ];

  for (const theme of themes) {
    test(`w40x-theme-${theme}`, async ({ page }) => {
      await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), SHOWCASE_WIDGETS);
      await setTheme(page, theme);
      await shot(page, `w40x-theme-${theme}`);
    });
  }

  // Individual widget types per theme — key combinations
  const widgetThemeCombos = [
    { theme: 'ocean', widgets: [w('w1', 'calendar', CX, CY - 50, 300, 360)], name: 'calendar-ocean' },
    { theme: 'aurora', widgets: [w('w1', 'matrix-chat', CX, CY - 60, 340, 400)], name: 'chat-aurora' },
    { theme: 'forest', widgets: [w('w1', 'todo-list', CX, CY, 300, 360, {
      items: [
        { id: 't1', text: 'Plant monitoring setup', done: true },
        { id: 't2', text: 'Water sensor config', done: false },
        { id: 't3', text: 'Deploy green dashboard', done: false },
      ]
    })], name: 'todo-forest' },
    { theme: 'sunset', widgets: [w('w1', 'weather', CX, CY, 320, 260)], name: 'weather-sunset' },
    { theme: 'rose', widgets: [w('w1', 'quote', CX, CY, 360, 200)], name: 'quote-rose' },
    { theme: 'light', widgets: [w('w1', 'clock', CX, CY, 300, 160)], name: 'clock-light' },
    { theme: 'ocean', widgets: [w('w1', 'pomodoro', CX, CY, 280, 260)], name: 'pomodoro-ocean' },
    { theme: 'aurora', widgets: [w('w1', 'system-monitor', CX, CY, 280, 200)], name: 'sysmon-aurora' },
    { theme: 'forest', widgets: [
      w('w1', 'sticky-note', 420, 120, 250, 220, { content: 'Forest theme\n\nNature-inspired\ngreen tones', color: 'green' }),
      w('w2', 'quick-links', 710, 120, 300, 260),
    ], name: 'sticky-links-forest' },
    { theme: 'sunset', widgets: [
      w('w1', 'zimbra-mail', 420, 60, 310, 380),
      w('w2', 'zimbra-tasks', 770, 60, 290, 320),
    ], name: 'zimbra-sunset' },
    { theme: 'light', widgets: [
      w('w1', 'sticky-note', 420, 80, 230, 200, { content: 'Light mode!\n\nClean and bright.', color: 'blue' }),
      w('w2', 'calendar', 670, 80, 260, 320),
      w('w3', 'weather', 950, 80, 280, 240),
    ], name: 'trio-light' },
    { theme: 'rose', widgets: [
      w('w1', 'matrix-chat', 420, 50, 310, 380),
      w('w2', 'zimbra-calendar', 770, 50, 290, 340),
    ], name: 'comms-rose' },
    { theme: 'midnight', widgets: [w('w1', 'nextcloud-files', CX, CY - 60, 320, 360)], name: 'files-midnight' },
  ];

  for (const combo of widgetThemeCombos) {
    test(`w41x-${combo.name}`, async ({ page }) => {
      await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), combo.widgets);
      await setTheme(page, combo.theme);
      await shot(page, `w41x-${combo.name}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// SECTION W5: NOTIFICATIONS — All types, stacked, center
// ═══════════════════════════════════════════════════════════════

test.describe('W5 — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await hideWidgets(page);
  });

  // Expose notif store to page context
  async function exposeNotifStore(page: Page) {
    await page.evaluate(() => {
      // Find the zustand store from React internals
      // We'll use direct DOM manipulation to trigger notifications instead
    });
  }

  test('w500-notif-info', async ({ page }) => {
    await page.evaluate(() => {
      // Dispatch a custom event that the app can listen to
      window.dispatchEvent(new CustomEvent('scalenix-notif', {
        detail: { type: 'info', title: 'Mise a jour disponible', message: 'ScaleNix OS v4.1 est disponible. Cliquez pour mettre a jour.' }
      }));
    });
    // Wait for notification polling to create some notifications
    await page.waitForTimeout(3000);
    await shot(page, 'w500-notif-info');
  });

  test('w501-notif-center-open', async ({ page }) => {
    // Wait for auto-generated notifications
    await page.waitForTimeout(5000);
    // Open notification center
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    await shot(page, 'w501-notif-center-open');
  });

  test('w502-notif-center-mail', async ({ page }) => {
    await page.waitForTimeout(5000);
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    // Click mail filter tab
    const mailTab = page.locator('text=Messagerie').or(page.locator('text=Mail'));
    if (await mailTab.first().isVisible()) {
      await mailTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w502-notif-center-mail');
  });

  test('w503-notif-center-chat', async ({ page }) => {
    await page.waitForTimeout(5000);
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    const chatTab = page.locator('text=Chat');
    if (await chatTab.first().isVisible()) {
      await chatTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w503-notif-center-chat');
  });

  test('w504-notif-center-files', async ({ page }) => {
    await page.waitForTimeout(5000);
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    const filesTab = page.locator('text=Fichiers');
    if (await filesTab.first().isVisible()) {
      await filesTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w504-notif-center-files');
  });

  test('w505-notif-center-system', async ({ page }) => {
    await page.waitForTimeout(5000);
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    const sysTab = page.locator('text=Systeme').or(page.locator('text=System'));
    if (await sysTab.first().isVisible()) {
      await sysTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w505-notif-center-system');
  });

  test('w506-notif-center-calendar', async ({ page }) => {
    await page.waitForTimeout(5000);
    await page.click('button[title="Notifications"]');
    await page.waitForTimeout(LONG);
    const calTab = page.locator('text=Agenda').or(page.locator('text=Calendrier'));
    if (await calTab.first().isVisible()) {
      await calTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w506-notif-center-calendar');
  });

  test('w507-notif-with-widgets', async ({ page }) => {
    // Show widgets + wait for notifications
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 280, 140),
      w('w2', 'todo-list', 900, 190, 260, 300, {
        items: [
          { id: 't1', text: 'Check notifications', done: false },
          { id: 't2', text: 'Read emails', done: false },
        ]
      }),
    ]);
    await page.waitForTimeout(5000);
    await shot(page, 'w507-notif-with-widgets');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W6: WIDGET + APP combinations
// ═══════════════════════════════════════════════════════════════

test.describe('W6 — Widgets + Apps', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w600-calculator-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 260, 130),
      w('w2', 'sticky-note', 900, 180, 220, 180, { content: 'Quick calc:\n42 × 3.14', color: 'yellow' }),
    ]);
    await openApp(page, 'Calculatrice');
    await page.waitForTimeout(PAUSE);
    await page.keyboard.type('42*3.14');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w600-calculator-with-widgets');
  });

  test('w601-kanban-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'pomodoro', 920, 30, 240, 220),
      w('w2', 'system-monitor', 920, 270, 240, 180),
    ]);
    await openApp(page, 'Kanban');
    await page.waitForTimeout(LONG);
    await shot(page, 'w601-kanban-with-widgets');
  });

  test('w602-settings-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 430, 30, 260, 130),
      w('w2', 'weather', 430, 180, 260, 200),
    ]);
    await openApp(page, 'Preferences');
    await page.waitForTimeout(LONG);
    await shot(page, 'w602-settings-with-widgets');
  });

  test('w603-editor-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'todo-list', 920, 30, 260, 280, {
        items: [
          { id: 't1', text: 'Write code', done: true },
          { id: 't2', text: 'Test changes', done: false },
          { id: 't3', text: 'Commit & push', done: false },
        ]
      }),
      w('w2', 'quote', 920, 330, 260, 140),
    ]);
    await openApp(page, 'Editeur de texte');
    await page.waitForTimeout(LONG * 2);
    await shot(page, 'w603-editor-with-widgets');
  });

  test('w604-rss-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'weather', 900, 30, 280, 220),
      w('w2', 'clock', 900, 270, 260, 130),
    ]);
    await openApp(page, 'RSS');
    await page.waitForTimeout(LONG);
    await shot(page, 'w604-rss-with-widgets');
  });

  test('w605-worldclock-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'calendar', 900, 30, 260, 300),
      w('w2', 'sticky-note', 900, 350, 240, 180, { content: 'Time zones:\n\nParis +1\nNew York -5\nTokyo +9', color: 'blue' }),
    ]);
    await openApp(page, 'Horloge');
    await page.waitForTimeout(LONG);
    await shot(page, 'w605-worldclock-with-widgets');
  });

  test('w606-multiapp-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 920, 30, 260, 130),
      w('w2', 'system-monitor', 920, 180, 240, 180),
    ]);
    await openApp(page, 'Calculatrice');
    await openApp(page, 'Kanban');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w606-multiapp-with-widgets');
  });

  test('w607-taskmanager-with-sysmon', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'system-monitor', 900, 30, 260, 200),
    ]);
    await openApp(page, 'Gestionnaire');
    await page.waitForTimeout(LONG);
    await shot(page, 'w607-taskmanager-with-sysmon');
  });

  test('w608-appstore-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'quick-links', 920, 30, 260, 240),
    ]);
    await openApp(page, 'App Store');
    await page.waitForTimeout(LONG);
    await shot(page, 'w608-appstore-with-widgets');
  });

  test('w609-directory-with-chat', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'matrix-chat', 880, 30, 300, 360),
    ]);
    await openApp(page, 'Annuaire');
    await page.waitForTimeout(LONG);
    await shot(page, 'w609-directory-with-chat');
  });

  test('w610-profile-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'sticky-note', 920, 30, 240, 180, { content: 'Profile check:\n\n- Update avatar\n- Set status\n- Check permissions', color: 'pink' }),
    ]);
    await openApp(page, 'Profil');
    await page.waitForTimeout(LONG);
    await shot(page, 'w610-profile-with-widgets');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W7: DESKTOP LAYOUTS — Various full-desktop configs
// ═══════════════════════════════════════════════════════════════

test.describe('W7 — Desktop Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w700-right-column-layout', async ({ page }) => {
    const col = 940;
    await setWidgets(page, [
      w('w1', 'clock', col, 20, 280, 140),
      w('w2', 'calendar', col, 176, 280, 300),
      w('w3', 'matrix-chat', col, 492, 280, 160),
    ]);
    await shot(page, 'w700-right-column-layout');
  });

  test('w701-left-column-layout', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 410, 20, 280, 140),
      w('w2', 'weather', 410, 176, 280, 220),
      w('w3', 'todo-list', 410, 412, 280, 240, {
        items: [
          { id: 't1', text: 'Morning tasks', done: true },
          { id: 't2', text: 'Afternoon review', done: false },
        ]
      }),
    ]);
    await shot(page, 'w701-left-column-layout');
  });

  test('w702-two-column-layout', async ({ page }) => {
    await setWidgets(page, [
      // Left column
      w('w1', 'clock', 420, 20, 280, 140),
      w('w2', 'weather', 420, 176, 280, 220),
      w('w3', 'quote', 420, 412, 280, 140),
      // Right column
      w('w4', 'calendar', 930, 20, 280, 300),
      w('w5', 'todo-list', 930, 336, 280, 240, {
        items: [
          { id: 't1', text: 'Check all widgets', done: true },
          { id: 't2', text: 'Take screenshots', done: true },
          { id: 't3', text: 'Push to GitHub', done: false },
        ]
      }),
    ]);
    await shot(page, 'w702-two-column-layout');
  });

  test('w703-top-bar-layout', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 410, 20, 240, 120),
      w('w2', 'weather', 670, 20, 260, 120),
      w('w3', 'system-monitor', 560, 20, 220, 120),
      w('w4', 'quote', 800, 20, 400, 120),
    ]);
    await shot(page, 'w703-top-bar-layout');
  });

  test('w704-centered-layout', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 460, 40, 320, 160),
      w('w2', 'weather', 730, 220, 240, 200),
      w('w3', 'todo-list', 600, 220, 260, 280, {
        items: [
          { id: 't1', text: 'Configure widgets', done: true },
          { id: 't2', text: 'Set wallpaper', done: true },
          { id: 't3', text: 'Choose theme', done: false },
        ]
      }),
    ]);
    await shot(page, 'w704-centered-layout');
  });

  test('w705-grid-3x2', async ({ page }) => {
    await setWidgets(page, [
      // Row 1
      w('w1', 'clock', 450, 20, 280, 140),
      w('w2', 'weather', 760, 20, 280, 220),
      w('w3', 'system-monitor', 680, 20, 260, 190),
      // Row 2
      w('w4', 'calendar', 450, 240, 260, 300),
      w('w5', 'pomodoro', 740, 260, 240, 220),
      w('w6', 'quick-links', 620, 240, 280, 260),
    ]);
    await shot(page, 'w705-grid-3x2');
  });

  test('w706-grid-4x3', async ({ page }) => {
    await setWidgets(page, [
      // Row 1
      w('w1', 'clock', 420, 10, 240, 120),
      w('w2', 'weather', 680, 10, 240, 200),
      w('w3', 'system-monitor', 550, 10, 220, 170),
      w('w4', 'quote', 790, 10, 300, 140),
      // Row 2
      w('w5', 'calendar', 420, 150, 240, 260),
      w('w6', 'todo-list', 680, 230, 240, 260, {
        items: [
          { id: 't1', text: 'Task A', done: true },
          { id: 't2', text: 'Task B', done: false },
          { id: 't3', text: 'Task C', done: false },
        ]
      }),
      w('w7', 'pomodoro', 550, 200, 220, 200),
      w('w8', 'quick-links', 790, 170, 260, 220),
      // Row 3
      w('w9', 'sticky-note', 420, 430, 220, 180, { content: 'Notes here', color: 'yellow' }),
      w('w10', 'matrix-chat', 660, 510, 280, 140),
      w('w11', 'zimbra-mail', 570, 420, 280, 230),
      w('w12', 'nextcloud-files', 870, 410, 240, 240),
    ]);
    await shot(page, 'w706-grid-4x3');
  });

  test('w707-sidebar-right-dense', async ({ page }) => {
    const x = 960;
    const g = 8;
    await setWidgets(page, [
      w('w1', 'clock', x, 10, 260, 110),
      w('w2', 'weather', x, 10 + 110 + g, 260, 180),
      w('w3', 'system-monitor', x, 10 + 110 + g + 180 + g, 260, 150),
      w('w4', 'pomodoro', x, 10 + 110 + g + 180 + g + 150 + g, 260, 180),
    ]);
    await shot(page, 'w707-sidebar-right-dense');
  });

  test('w708-clean-desktop-no-widgets', async ({ page }) => {
    await setWidgets(page, []);
    await shot(page, 'w708-clean-desktop-no-widgets');
  });

  test('w709-single-clock-corner', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 960, 20, 260, 130),
    ]);
    await shot(page, 'w709-single-clock-corner');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W8: WIDGET MANAGER APP
// ═══════════════════════════════════════════════════════════════

test.describe('W8 — Widget Manager', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
    await hideWidgets(page);
  });

  test('w800-widget-manager-open', async ({ page }) => {
    await openApp(page, 'Widgets');
    await page.waitForTimeout(LONG);
    await shot(page, 'w800-widget-manager-open');
  });

  test('w801-widget-manager-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 260, 130),
      w('w2', 'weather', 900, 180, 260, 200),
      w('w3', 'todo-list', 900, 400, 260, 240, {
        items: [{ id: 't1', text: 'Manage widgets', done: false }]
      }),
    ]);
    await openApp(page, 'Widgets');
    await page.waitForTimeout(LONG);
    await shot(page, 'w801-widget-manager-with-widgets');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W9: SPECIAL DESKTOP STATES
// ═══════════════════════════════════════════════════════════════

test.describe('W9 — Special States', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w900-launcher-over-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 260, 130),
      w('w2', 'calendar', 900, 180, 260, 300),
      w('w3', 'sticky-note', 450, 60, 240, 180, { content: 'Launcher open', color: 'yellow' }),
    ]);
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w900-launcher-over-widgets');
  });

  test('w901-spotlight-over-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'weather', 450, 30, 280, 220),
      w('w2', 'todo-list', 450, 270, 280, 280, {
        items: [
          { id: 't1', text: 'Search for apps', done: false },
          { id: 't2', text: 'Use Ctrl+K', done: true },
        ]
      }),
      w('w3', 'clock', 900, 30, 260, 130),
    ]);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    const input = page.locator('input[placeholder*="Rechercher"]').last();
    await input.fill('Kanban');
    await page.waitForTimeout(400);
    await shot(page, 'w901-spotlight-over-widgets');
  });

  test('w902-context-menu-over-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 500, 200, 260, 130),
      w('w2', 'weather', 500, 350, 280, 220),
    ]);
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 300, y: 250 } });
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w902-context-menu-over-widgets');
  });

  test('w903-quick-settings-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 260, 130),
      w('w2', 'system-monitor', 900, 180, 240, 180),
    ]);
    const qs = page.locator('button[title*="Parametres rapides"]');
    if (await qs.first().isVisible()) {
      await qs.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w903-quick-settings-with-widgets');
  });

  test('w904-calendar-popup-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'calendar', 450, 60, 260, 300),
      w('w2', 'clock', 450, 380, 260, 130),
    ]);
    const calBtn = page.locator('button[title*="Calendrier"]');
    if (await calBtn.first().isVisible()) {
      await calBtn.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w904-calendar-popup-with-widgets');
  });

  test('w905-volume-popup-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'pomodoro', 450, 200, 240, 220),
    ]);
    const vol = page.locator('button[title*="Volume"]');
    if (await vol.first().isVisible()) {
      await vol.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w905-volume-popup-with-widgets');
  });

  test('w906-alt-tab-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 920, 30, 260, 130),
      w('w2', 'sticky-note', 920, 180, 240, 180, { content: 'Alt+Tab active!', color: 'pink' }),
    ]);
    await openApp(page, 'Calculatrice');
    await openApp(page, 'Kanban');
    await page.keyboard.down('Alt');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w906-alt-tab-with-widgets');
    await page.keyboard.up('Alt');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W10: THEMED DESKTOP + WIDGETS HERO SHOTS
// ═══════════════════════════════════════════════════════════════

test.describe('W10 — Hero Themed Desktops', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  const HERO_WIDGETS = [
    w('hw1', 'clock', 930, 20, 280, 140),
    w('hw2', 'calendar', 930, 176, 280, 300),
    w('hw3', 'sticky-note', 640, 20, 240, 200, { content: 'ScaleNix OS\n\nYour cloud desktop\nin your browser!', color: 'yellow' }),
    w('hw4', 'todo-list', 640, 240, 260, 280, {
      items: [
        { id: 't1', text: 'Login to your workspace', done: true },
        { id: 't2', text: 'Explore 30+ apps', done: true },
        { id: 't3', text: 'Customize your desktop', done: false },
        { id: 't4', text: 'Invite your team', done: false },
      ]
    }),
    w('hw5', 'system-monitor', 930, 492, 260, 160),
  ];

  test('w1000-hero-midnight', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'midnight');
    await shot(page, 'w1000-hero-midnight');
  });

  test('w1001-hero-ocean', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'ocean');
    await shot(page, 'w1001-hero-ocean');
  });

  test('w1002-hero-aurora', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'aurora');
    await shot(page, 'w1002-hero-aurora');
  });

  test('w1003-hero-forest', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'forest');
    await shot(page, 'w1003-hero-forest');
  });

  test('w1004-hero-sunset', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'sunset');
    await shot(page, 'w1004-hero-sunset');
  });

  test('w1005-hero-light', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'light');
    await shot(page, 'w1005-hero-light');
  });

  test('w1006-hero-rose', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'rose');
    await shot(page, 'w1006-hero-rose');
  });

  // Hero with launcher open
  test('w1010-hero-launcher-midnight', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'midnight');
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w1010-hero-launcher-midnight');
  });

  test('w1011-hero-launcher-light', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'light');
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w1011-hero-launcher-light');
  });

  test('w1012-hero-launcher-aurora', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'aurora');
    await page.click('[title="Applications (Meta+Space)"]');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w1012-hero-launcher-aurora');
  });

  // Hero with app open
  test('w1020-hero-kanban-ocean', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'ocean');
    await openApp(page, 'Kanban');
    await page.waitForTimeout(LONG);
    await shot(page, 'w1020-hero-kanban-ocean');
  });

  test('w1021-hero-calculator-forest', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'forest');
    await openApp(page, 'Calculatrice');
    await page.waitForTimeout(PAUSE);
    await page.keyboard.type('256*1024');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w1021-hero-calculator-forest');
  });

  test('w1022-hero-settings-sunset', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'sunset');
    await openApp(page, 'Preferences');
    await page.waitForTimeout(LONG);
    await shot(page, 'w1022-hero-settings-sunset');
  });

  test('w1023-hero-editor-rose', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), HERO_WIDGETS);
    await setTheme(page, 'rose');
    await openApp(page, 'Editeur de texte');
    await page.waitForTimeout(LONG * 2);
    await shot(page, 'w1023-hero-editor-rose');
  });

  // Hero multi-app
  test('w1030-hero-multi-app', async ({ page }) => {
    await page.evaluate((w) => localStorage.setItem('scalenix-widgets', JSON.stringify(w)), [
      w('hw1', 'clock', 940, 20, 260, 120),
      w('hw2', 'system-monitor', 940, 156, 260, 160),
    ]);
    await setTheme(page, 'midnight');
    await openApp(page, 'Calculatrice');
    await openApp(page, 'Kanban');
    await openApp(page, 'Horloge');
    await page.waitForTimeout(PAUSE);
    await shot(page, 'w1030-hero-multi-app');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W11: ONBOARDING STEPS
// ═══════════════════════════════════════════════════════════════

test.describe('W11 — Onboarding', () => {
  test('w1100-onboarding-all-steps', async ({ page }) => {
    await login(page, 'malik');
    // Clear onboarding flag to show it
    await page.evaluate(() => {
      localStorage.removeItem('scalenix-onboarding-done');
      localStorage.removeItem('scalenix-widgets');
    });
    await page.reload();
    await expect(page.locator('[title="Applications (Meta+Space)"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(LONG);

    // Take screenshot of each step
    const welcome = page.locator('text=Bienvenue');
    if (await welcome.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await shot(page, 'w1100-onboarding-step1-welcome');

      const nextBtn = page.locator('button:has-text("Suivant")');
      for (let i = 2; i <= 7; i++) {
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(PAUSE);
          await shot(page, `w110${i - 1}-onboarding-step${i}`);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W12: CLIPBOARD, SCREEN CAPTURE, AUDIO
// ═══════════════════════════════════════════════════════════════

test.describe('W12 — Utility Apps', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  test('w1200-clipboard-with-widgets', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'sticky-note', 900, 30, 240, 180, { content: 'Clipboard active!\n\nCtrl+Shift+V', color: 'green' }),
    ]);
    await page.keyboard.press('Control+Shift+V');
    await page.waitForTimeout(LONG);
    await shot(page, 'w1200-clipboard-with-widgets');
  });

  test('w1201-screen-capture', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'clock', 900, 30, 260, 130),
    ]);
    await openApp(page, 'Capture');
    await page.waitForTimeout(LONG);
    await shot(page, 'w1201-screen-capture');
  });

  test('w1202-audio-mixer', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'pomodoro', 900, 30, 240, 220),
    ]);
    await openApp(page, 'Audio');
    await page.waitForTimeout(LONG);
    await shot(page, 'w1202-audio-mixer');
  });

  test('w1203-shortcuts-view', async ({ page }) => {
    await setWidgets(page, [
      w('w1', 'quick-links', 900, 30, 260, 240),
    ]);
    await openApp(page, 'Preferences');
    await page.waitForTimeout(LONG);
    // Navigate to shortcuts tab
    const shortcutsTab = page.locator('text=Raccourcis');
    if (await shortcutsTab.first().isVisible()) {
      await shortcutsTab.first().click();
      await page.waitForTimeout(PAUSE);
    }
    await shot(page, 'w1203-shortcuts-view');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION W13: LANGUAGE VARIANTS WITH WIDGETS
// ═══════════════════════════════════════════════════════════════

test.describe('W13 — Languages + Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await dismissOnboarding(page);
  });

  const LANG_WIDGETS = [
    w('lw1', 'clock', 920, 20, 280, 140),
    w('lw2', 'todo-list', 920, 176, 280, 280, {
      items: [
        { id: 't1', text: 'Configure language', done: true },
        { id: 't2', text: 'Test all widgets', done: false },
      ]
    }),
    w('lw3', 'weather', 620, 20, 280, 220),
  ];

  const langs = [
    { code: 'fr', name: 'french' },
    { code: 'en', name: 'english' },
    { code: 'it', name: 'italian' },
    { code: 'es', name: 'spanish' },
    { code: 'de', name: 'german' },
  ];

  for (const lang of langs) {
    test(`w130x-desktop-${lang.name}`, async ({ page }) => {
      await page.evaluate(({ widgets, langCode }) => {
        localStorage.setItem('scalenix-widgets', JSON.stringify(widgets));
        const raw = localStorage.getItem('scalenix-i18n');
        if (raw) {
          const store = JSON.parse(raw);
          store.state.lang = langCode;
          localStorage.setItem('scalenix-i18n', JSON.stringify(store));
        } else {
          localStorage.setItem('scalenix-i18n', JSON.stringify({ state: { lang: langCode }, version: 0 }));
        }
      }, { widgets: LANG_WIDGETS, langCode: lang.code });
      await page.reload();
      await expect(
        page.locator('[title*="Application"]')
          .or(page.locator('[title*="Anwendungen"]'))
          .or(page.locator('[title*="Aplicaciones"]'))
          .or(page.locator('[title*="Applicazioni"]'))
      ).toBeVisible({ timeout: 60_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(LONG);
      await shot(page, `w130x-desktop-${lang.name}`);
    });

    test(`w131x-launcher-${lang.name}`, async ({ page }) => {
      await page.evaluate(({ langCode }) => {
        const raw = localStorage.getItem('scalenix-i18n');
        if (raw) {
          const store = JSON.parse(raw);
          store.state.lang = langCode;
          localStorage.setItem('scalenix-i18n', JSON.stringify(store));
        } else {
          localStorage.setItem('scalenix-i18n', JSON.stringify({ state: { lang: langCode }, version: 0 }));
        }
      }, { langCode: lang.code });
      await page.reload();
      await expect(
        page.locator('[title*="Application"]')
          .or(page.locator('[title*="Anwendungen"]'))
          .or(page.locator('[title*="Aplicaciones"]'))
          .or(page.locator('[title*="Applicazioni"]'))
      ).toBeVisible({ timeout: 60_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(LONG);
      const appBtn = page.locator('[title*="Application"]')
        .or(page.locator('[title*="Anwendungen"]'))
        .or(page.locator('[title*="Aplicaciones"]'))
        .or(page.locator('[title*="Applicazioni"]'));
      await appBtn.first().click();
      await page.waitForTimeout(PAUSE);
      await shot(page, `w131x-launcher-${lang.name}`);
    });
  }
});
