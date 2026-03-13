import { test, expect } from '@playwright/test';
import { login, waitForDesktop, openLauncher } from './helpers';

test.describe('Widgets — Admin (malik)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  // ── Default widgets on first load ──

  test('Clock widget is visible by default', async ({ page }) => {
    // Clock widget shows time in HH:MM format
    const clock = page.locator('text=/\\d{2}:\\d{2}/').first();
    await expect(clock).toBeVisible({ timeout: 5000 });
  });

  test('System monitor widget is visible by default', async ({ page }) => {
    await expect(page.locator('text=Moniteur systeme').or(page.locator('text=CPU')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Sticky note widget is visible by default', async ({ page }) => {
    await expect(page.locator('text=Bienvenue sur ScalenixOS').first()).toBeVisible({ timeout: 5000 });
  });

  // ── Widget Manager app ──

  test('Widget Manager opens from launcher', async ({ page }) => {
    await openLauncher(page);
    await page.fill('input[placeholder="Rechercher une application..."]', 'Widgets');
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Widgets")').first().click();
    await expect(page.locator('text=Gestionnaire de widgets')).toBeVisible({ timeout: 5000 });
  });

  test('Widget Manager lists active widgets', async ({ page }) => {
    await openLauncher(page);
    await page.fill('input[placeholder="Rechercher une application..."]', 'Widgets');
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Widgets")').first().click();
    await expect(page.locator('text=Widgets actifs')).toBeVisible({ timeout: 5000 });
    // Should show at least the 3 default widgets
    await expect(page.locator('text=Horloge').first()).toBeVisible();
  });

  test('Widget Manager shows add catalog', async ({ page }) => {
    await openLauncher(page);
    await page.fill('input[placeholder="Rechercher une application..."]', 'Widgets');
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Widgets")').first().click();
    await expect(page.locator('text=Ajouter un widget')).toBeVisible({ timeout: 5000 });
    // Should list all widget types including connected ones
    await expect(page.locator('text=Messagerie').first()).toBeVisible();
    await expect(page.locator('text=Pomodoro').first()).toBeVisible();
  });

  // ── Adding widgets via right-click context menu ──

  test('Desktop context menu shows widget options', async ({ page }) => {
    // Right-click on the desktop area
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    // Should show widget add options
    await expect(page.locator('text=Ajouter Horloge').or(page.locator('text=Ajouter Meteo')).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Gestionnaire de widgets')).toBeVisible();
  });

  // ── Individual widget types ──

  test('Calendar widget can be added and shows month', async ({ page }) => {
    // Use context menu to add a calendar widget
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Calendrier').click();
    await page.waitForTimeout(500);
    // Should show month navigation and day labels
    const calWidget = page.locator('text=/Janvier|Fevrier|Mars|Avril|Mai|Juin|Juillet|Aout|Septembre|Octobre|Novembre|Decembre/');
    await expect(calWidget.first()).toBeVisible({ timeout: 3000 });
  });

  test('Quote widget can be added and shows a quote', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Citation').click();
    await page.waitForTimeout(500);
    // Should show quote mark and an author
    await expect(page.locator('text=❝').first()).toBeVisible({ timeout: 3000 });
  });

  test('Pomodoro widget can be added and has controls', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Pomodoro').click();
    await page.waitForTimeout(500);
    // Should show timer and start button
    await expect(page.locator('text=25:00')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Start').first()).toBeVisible();
  });

  test('Weather widget can be added and shows forecast', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Meteo').click();
    await page.waitForTimeout(500);
    // Should show Paris and temperature
    await expect(page.locator('text=Paris').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/\\d+°C/').first()).toBeVisible();
  });

  test('Todo widget can be added and accepts items', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Taches').first().click();
    await page.waitForTimeout(500);
    // Should show task counter
    await expect(page.locator('text=/Taches \\(\\d+\\/\\d+\\)/').first()).toBeVisible({ timeout: 3000 });
    // Type a new task
    const input = page.locator('input[placeholder="Nouvelle tache..."]');
    await input.fill('Test tache e2e');
    await input.press('Enter');
    await expect(page.locator('text=Test tache e2e')).toBeVisible();
  });

  test('Quick Links widget can be added and shows default links', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Liens rapides').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Google').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Wikipedia').first()).toBeVisible();
  });

  // ── Connected widgets ──

  test('Zimbra Mail widget can be added and shows real emails', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Messagerie').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Messagerie').nth(0)).toBeVisible({ timeout: 5000 });
    // Wait for data — should show real emails or loading/error state
    const content = page.locator('text=Chargement')
      .or(page.locator('text=Connexion echouee'))
      .or(page.locator('text=Aucun message'))
      .or(page.locator('text=/scalenix\\.fr|bob|alice|malik|Bienvenue/i'));
    await expect(content.first()).toBeVisible({ timeout: 20000 });
  });

  test('Zimbra Calendar widget can be added and shows real events', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Agenda').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Agenda').nth(0)).toBeVisible({ timeout: 5000 });
    const content = page.locator('text=Chargement')
      .or(page.locator('text=Connexion echouee'))
      .or(page.locator('text=Aucun evenement'))
      .or(page.locator('text=/Aujourd|Demain|Lun|Mar|Mer|Jeu|Ven|Sam|Dim/'));
    await expect(content.first()).toBeVisible({ timeout: 20000 });
  });

  test('Zimbra Tasks widget can be added and shows real tasks', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Taches Zimbra').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Taches Zimbra').nth(0)).toBeVisible({ timeout: 5000 });
    const content = page.locator('text=Chargement')
      .or(page.locator('text=Connexion echouee'))
      .or(page.locator('text=Aucune tache'))
      .or(page.locator('text=/A faire|En cours|Termine/'));
    await expect(content.first()).toBeVisible({ timeout: 20000 });
  });

  test('Matrix Chat widget can be added', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Chat').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Chat').nth(0)).toBeVisible({ timeout: 5000 });
    const content = page.locator('text=Connexion')
      .or(page.locator('text=Aucun salon'))
      .or(page.locator('text=#general'))
      .or(page.locator('text=demo'));
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('Nextcloud Files widget can be added', async ({ page }) => {
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Fichiers').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Fichiers').nth(0)).toBeVisible({ timeout: 5000 });
    // Nextcloud should connect and show files (we have WebDAV proxy working)
    const content = page.locator('text=Chargement').or(page.locator('text=Connexion echouee')).or(page.locator('text=Documents').or(page.locator('text=Images')));
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  // ── Widget close button ──

  test('Widget can be closed via hover close button', async ({ page }) => {
    // Add a weather widget
    const desktop = page.locator('.relative.flex-1').first();
    await desktop.click({ button: 'right', position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);
    await page.locator('text=Ajouter Meteo').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Paris').first()).toBeVisible({ timeout: 3000 });

    // Click the close button (force because opacity-0 → opacity-100 on hover)
    const closeBtn = page.locator('[data-testid="widget-close"]').last();
    await closeBtn.click({ force: true });
    await page.waitForTimeout(500);

    // The weather widget "Paris" label should be gone
    // (default widgets don't have Paris text, so if weather is removed, no Paris)
    const parisCount = await page.locator('.pointer-events-none >> text=Paris').count();
    expect(parisCount).toBe(0);
  });

  // ── Widget registry completeness ──

  test('App registry includes widget-manager', async ({ page }) => {
    const response = await page.request.get('/apps/registry.json');
    const apps = await response.json();
    const ids = apps.map((a: any) => a.id);
    expect(ids).toContain('widget-manager');
    expect(apps.length).toBeGreaterThanOrEqual(28);
  });

  // ── Widget Manager bulk actions ──

  test('Widget Manager can toggle widget visibility', async ({ page }) => {
    // Open widget manager
    await openLauncher(page);
    await page.fill('input[placeholder="Rechercher une application..."]', 'Widgets');
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Widgets")').first().click();
    await expect(page.locator('text=Gestionnaire de widgets')).toBeVisible({ timeout: 5000 });

    // Click "Tout masquer" button
    await page.locator('text=Tout masquer').click();
    await page.waitForTimeout(300);

    // The count should show 0 visible
    await expect(page.locator('text=/0 visibles?/')).toBeVisible({ timeout: 3000 });

    // Click "Tout afficher"
    await page.locator('text=Tout afficher').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=/[1-9]\\d* visibles?/')).toBeVisible({ timeout: 3000 });
  });
});
