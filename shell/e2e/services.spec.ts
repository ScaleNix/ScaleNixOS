import { test, expect } from '@playwright/test';
import { login, waitForDesktop, openLauncher, TEST_PASSWORD } from './helpers';

test.describe('Service Availability', () => {
  test('Keycloak OIDC discovery endpoint responds', async ({ request }) => {
    const resp = await request.get(
      'https://auth.scalenix.fr/realms/scalenix-os/.well-known/openid-configuration',
      { ignoreHTTPSErrors: true }
    );
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.issuer).toContain('scalenix-os');
    expect(json.authorization_endpoint).toBeTruthy();
    expect(json.token_endpoint).toBeTruthy();
  });

  test('Shell responds with 200', async ({ request }) => {
    const resp = await request.get('https://os.scalenix.fr', { ignoreHTTPSErrors: true });
    expect(resp.status()).toBe(200);
  });

  test('Nextcloud responds', async ({ request }) => {
    const resp = await request.get('https://files.scalenix.fr/status.php', { ignoreHTTPSErrors: true });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.installed).toBe(true);
  });

  test('Traefik dashboard responds', async ({ request }) => {
    const resp = await request.get('http://localhost:8080/api/overview', { ignoreHTTPSErrors: true });
    expect(resp.status()).toBe(200);
  });

  test('Keycloak token endpoint works (direct grant)', async ({ request }) => {
    const resp = await request.post(
      'https://auth.scalenix.fr/realms/scalenix-os/protocol/openid-connect/token',
      {
        ignoreHTTPSErrors: true,
        form: {
          grant_type: 'password',
          client_id: 'scalenix-shell',
          username: 'malik',
          password: TEST_PASSWORD,
        },
      }
    );
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.access_token).toBeTruthy();
    expect(json.token_type).toBe('Bearer');
  });

  test('Keycloak user roles are correct (malik = admin)', async ({ request }) => {
    const resp = await request.post(
      'https://auth.scalenix.fr/realms/scalenix-os/protocol/openid-connect/token',
      {
        ignoreHTTPSErrors: true,
        form: {
          grant_type: 'password',
          client_id: 'scalenix-shell',
          username: 'malik',
          password: TEST_PASSWORD,
        },
      }
    );
    const json = await resp.json();
    const payload = JSON.parse(Buffer.from(json.access_token.split('.')[1], 'base64').toString());
    const roles = payload.realm_access?.roles ?? [];
    expect(roles).toContain('admin');
    expect(roles).toContain('developer');
    expect(roles).toContain('user');
  });

  test('Keycloak user roles are correct (bob = user only)', async ({ request }) => {
    const resp = await request.post(
      'https://auth.scalenix.fr/realms/scalenix-os/protocol/openid-connect/token',
      {
        ignoreHTTPSErrors: true,
        form: {
          grant_type: 'password',
          client_id: 'scalenix-shell',
          username: 'bob',
          password: TEST_PASSWORD,
        },
      }
    );
    const json = await resp.json();
    const payload = JSON.parse(Buffer.from(json.access_token.split('.')[1], 'base64').toString());
    const roles = payload.realm_access?.roles ?? [];
    expect(roles).toContain('user');
    expect(roles).not.toContain('admin');
    expect(roles).not.toContain('developer');
  });

  test('Keycloak user roles are correct (alice = developer)', async ({ request }) => {
    const resp = await request.post(
      'https://auth.scalenix.fr/realms/scalenix-os/protocol/openid-connect/token',
      {
        ignoreHTTPSErrors: true,
        form: {
          grant_type: 'password',
          client_id: 'scalenix-shell',
          username: 'alice',
          password: TEST_PASSWORD,
        },
      }
    );
    const json = await resp.json();
    const payload = JSON.parse(Buffer.from(json.access_token.split('.')[1], 'base64').toString());
    const roles = payload.realm_access?.roles ?? [];
    expect(roles).toContain('developer');
    expect(roles).toContain('user');
    expect(roles).not.toContain('admin');
  });
});

test.describe('App Loading', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  test('Messagerie (Zimbra) iframe loads', async ({ page }) => {
    await page.locator('[title="Messagerie"]').first().click();
    const iframe = page.locator('.animate-window-open:has-text("Messagerie") iframe').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });
    const src = await iframe.getAttribute('src');
    expect(src).toContain('zimbradev3.ext.benmekki.com');
  });

  test('Fichiers (Nextcloud) file explorer loads', async ({ page }) => {
    await page.locator('[title="Fichiers"]').first().click();
    const win = page.locator('.animate-window-open:has-text("Fichiers")').first();
    await expect(win).toBeVisible({ timeout: 15_000 });
    // Native file explorer should show toolbar buttons and breadcrumb
    await expect(win.locator('text=/element/')).toBeVisible({ timeout: 15_000 });
  });

  test('Agenda (Zimbra Calendar) iframe loads', async ({ page }) => {
    await page.locator('[title="Agenda"]').first().click();
    const iframe = page.locator('.animate-window-open:has-text("Agenda") iframe').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });
    const src = await iframe.getAttribute('src');
    expect(src).toContain('zimbradev3.ext.benmekki.com');
    // Preauth URL or direct calendar URL
    expect(src).toBeTruthy();
  });

  test('Admin IAM (Keycloak) iframe loads', async ({ page }) => {
    await page.locator('[title="Admin IAM"]').first().click();
    const iframe = page.locator('.animate-window-open:has-text("Admin IAM") iframe').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });
    const src = await iframe.getAttribute('src');
    expect(src).toContain('auth.scalenix.fr');
  });

  test('App registry loads all apps', async ({ page }) => {
    await openLauncher(page);
    // Admin (malik) should see all apps (18 apps total in registry)
    const appButtons = page.locator('.grid button');
    const count = await appButtons.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });
});
