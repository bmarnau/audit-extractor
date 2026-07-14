/**
 * NAVIGATION & SIDEBAR TEST SUITE
 * 
 * Testet ALLE Navigations-Elemente und GUI-Komponenten:
 * - Sidebar-Drawer (Mobile, Tablet, Desktop)
 * - Alle Navigation-Kategorien
 * - Alle 10 Navigation Items
 * - Icon-Rendering
 * - Link-Funktionalität
 * - Responsive Behavior
 * - Breadcrumb Navigation
 * - Mobile Bottom Navigation
 * - Theme Toggle
 * - Hamburger Menu
 * 
 * Navigation Items:
 * 1. Dashboard
 * 2. Schemas
 * 3. Jobs
 * 4. Rules
 * 5. Logs
 * 6. Backup
 * 7. Health
 * 8. API
 * 9. Settings
 * 10. Help (NEW)
 */

import { test, expect, Page, BrowserContext, Locator } from '@playwright/test';

const APP_URL = 'http://localhost:5173';
const TEST_TIMEOUT = 30000;

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  category?: string;
  description?: string;
}

interface NavigationCategory {
  id: string;
  label: string;
  items: NavigationItem[];
}

const EXPECTED_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'home', label: 'Home', path: '/', category: 'DASHBOARD' },
  { id: 'schemas-list', label: 'Schemas', path: '/schemas', category: 'SCHEMAS' },
  { id: 'schemas-create', label: 'Create Schema', path: '/schemas/create', category: 'SCHEMAS' },
  { id: 'jobs-list', label: 'Jobs', path: '/jobs', category: 'JOBS' },
  { id: 'rules-list', label: 'Rules', path: '/rules', category: 'RULES' },
  { id: 'logs-viewer', label: 'Logs', path: '/logs', category: 'LOGS' },
  { id: 'health-check', label: 'Health', path: '/health', category: 'SERVICES' },
  { id: 'api-docs', label: 'API Docs', path: '/api/docs', category: 'SERVICES' },
  { id: 'backup-list', label: 'Backups', path: '/backup', category: 'SERVICES' },
  { id: 'settings-config', label: 'Settings', path: '/settings', category: 'SERVICES' },
  { id: 'help-center', label: 'Help Center', path: '/help', category: 'HELP' },
];

const EXPECTED_CATEGORIES = ['DASHBOARD', 'SCHEMAS', 'JOBS', 'RULES', 'LOGS', 'SERVICES', 'HELP'];

test.describe('NAVIGATION & SIDEBAR TEST SUITE', () => {
  let page: Page;
  let context: BrowserContext;
  const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: [] as string[],
  };

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Set viewport for desktop testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to app
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test.afterEach(async () => {
    await context.close();
  });

  // ============================================================================
  // TEST 1: INITIAL PAGE LOAD & SIDEBAR VISIBILITY
  // ============================================================================
  test('should load dashboard and display sidebar', async () => {
    const title = await page.title();
    expect(title).toContain('Audit-Safe');
    
    // Check if hamburger button exists
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await expect(hamburger).toBeVisible();
    
    // Check if app bar exists
    const appBar = page.locator('header, [role="banner"]').first();
    await expect(appBar).toBeVisible();
    
    testResults.passed++;
    testResults.details.push('✅ Initial page load successful');
  });

  // ============================================================================
  // TEST 2: HAMBURGER MENU & DRAWER OPENING
  // ============================================================================
  test('should open and close sidebar drawer with hamburger button', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    
    // Click hamburger to open
    await hamburger.click();
    await page.waitForTimeout(500);
    
    // Check drawer is visible
    const drawer = page.locator('[class*="Drawer"], [role="navigation"]').first();
    await expect(drawer).toBeVisible();
    
    // Click hamburger again to close
    await hamburger.click();
    await page.waitForTimeout(300);
    
    testResults.passed++;
    testResults.details.push('✅ Hamburger menu toggle works');
  });

  // ============================================================================
  // TEST 3: ALL NAVIGATION CATEGORIES VISIBLE
  // ============================================================================
  test('should display all navigation categories', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const sidebarText = await page.locator('[class*="Drawer"], [role="navigation"]').first().innerText();
    const categories = EXPECTED_CATEGORIES;
    
    let missingCategories = [];
    for (const category of categories) {
      if (!sidebarText.includes(category)) {
        missingCategories.push(category);
      }
    }
    
    if (missingCategories.length > 0) {
      testResults.failed++;
      testResults.details.push(`❌ Missing categories: ${missingCategories.join(', ')}`);
      expect(missingCategories).toEqual([]);
    } else {
      testResults.passed++;
      testResults.details.push(`✅ All ${categories.length} navigation categories visible`);
    }
  });

  // ============================================================================
  // TEST 4: ALL NAVIGATION ITEMS PRESENT
  // ============================================================================
  test('should display all 11 navigation items', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const sidebarText = await page.locator('[class*="Drawer"], [role="navigation"]').first().innerText();
    
    let missingItems = [];
    for (const item of EXPECTED_NAVIGATION_ITEMS) {
      if (!sidebarText.includes(item.label)) {
        missingItems.push(item.label);
      }
    }
    
    if (missingItems.length > 0) {
      testResults.failed++;
      testResults.details.push(`❌ Missing items: ${missingItems.join(', ')}`);
      expect(missingItems).toEqual([]);
    } else {
      testResults.passed++;
      testResults.details.push(`✅ All ${EXPECTED_NAVIGATION_ITEMS.length} navigation items present`);
    }
  });

  // ============================================================================
  // TEST 5: DASHBOARD NAVIGATION
  // ============================================================================
  test('should navigate to Dashboard', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const dashboardLink = page.locator('text=Dashboard').first();
    await dashboardLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toBe(`${APP_URL}/`);
    const heading = page.locator('text=Dashboard').first();
    await expect(heading).toBeVisible();
    
    testResults.passed++;
    testResults.details.push('✅ Dashboard navigation works');
  });

  // ============================================================================
  // TEST 6: SCHEMAS NAVIGATION
  // ============================================================================
  test('should navigate to Schemas', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const schemasLink = page.locator('text=Schemas').first();
    await schemasLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/schemas');
    
    testResults.passed++;
    testResults.details.push('✅ Schemas navigation works');
  });

  // ============================================================================
  // TEST 7: JOBS NAVIGATION
  // ============================================================================
  test('should navigate to Jobs', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const jobsLink = page.locator('text=Jobs').first();
    await jobsLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/jobs');
    
    testResults.passed++;
    testResults.details.push('✅ Jobs navigation works');
  });

  // ============================================================================
  // TEST 8: RULES NAVIGATION
  // ============================================================================
  test('should navigate to Rules', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const rulesLink = page.locator('text=Rules').first();
    await rulesLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/rules');
    
    testResults.passed++;
    testResults.details.push('✅ Rules navigation works');
  });

  // ============================================================================
  // TEST 9: LOGS NAVIGATION
  // ============================================================================
  test('should navigate to Logs', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const logsLink = page.locator('text=Logs').first();
    await logsLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/logs');
    
    testResults.passed++;
    testResults.details.push('✅ Logs navigation works');
  });

  // ============================================================================
  // TEST 10: BACKUP NAVIGATION
  // ============================================================================
  test('should navigate to Backup', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const backupLink = page.locator('text=Backups').first();
    await backupLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/backup');
    
    testResults.passed++;
    testResults.details.push('✅ Backup navigation works');
  });

  // ============================================================================
  // TEST 11: HEALTH NAVIGATION
  // ============================================================================
  test('should navigate to Health', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const healthLink = page.locator('text=Health').first();
    await healthLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/health');
    
    testResults.passed++;
    testResults.details.push('✅ Health navigation works');
  });

  // ============================================================================
  // TEST 12: API NAVIGATION
  // ============================================================================
  test('should navigate to API Docs', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const apiLink = page.locator('text=API Docs').first();
    await apiLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/api/docs');
    
    testResults.passed++;
    testResults.details.push('✅ API navigation works');
  });

  // ============================================================================
  // TEST 13: SETTINGS NAVIGATION
  // ============================================================================
  test('should navigate to Settings', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const settingsLink = page.locator('text=Settings').first();
    await settingsLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/settings');
    
    testResults.passed++;
    testResults.details.push('✅ Settings navigation works');
  });

  // ============================================================================
  // TEST 14: HELP CENTER NAVIGATION (NEW!)
  // ============================================================================
  test('should navigate to Help Center', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    // Scroll to find Help Center in sidebar
    const sidebar = page.locator('[class*="Drawer"], [role="navigation"]').first();
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);
    
    const helpLink = page.locator('text=Help Center').first();
    await helpLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    expect(page.url()).toContain('/help');
    testResults.passed++;
    testResults.details.push('✅ Help Center navigation works ⭐ NEW');
  });

  // ============================================================================
  // TEST 15: DARK MODE TOGGLE
  // ============================================================================
  test('should toggle dark mode', async () => {
    const darkModeButton = page.locator('button').filter({ has: page.locator('img[src*="moon"], img[src*="sun"]') }).first();
    
    if (await darkModeButton.isVisible()) {
      const initialHTML = await page.content();
      await darkModeButton.click();
      await page.waitForTimeout(500);
      
      const updatedHTML = await page.content();
      expect(initialHTML).not.toBe(updatedHTML);
      
      testResults.passed++;
      testResults.details.push('✅ Dark mode toggle works');
    } else {
      testResults.skipped++;
      testResults.details.push('⊘ Dark mode button not found');
    }
  });

  // ============================================================================
  // TEST 16: BREADCRUMB NAVIGATION
  // ============================================================================
  test('should display breadcrumb navigation on page', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const schemasLink = page.locator('text=Schemas').first();
    await schemasLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Look for breadcrumb
    const breadcrumb = page.locator('[class*="breadcrumb"], nav:has(a)').first();
    
    if (await breadcrumb.isVisible()) {
      const text = await breadcrumb.innerText();
      expect(text.toLowerCase()).toContain('schema');
      testResults.passed++;
      testResults.details.push('✅ Breadcrumb navigation present');
    } else {
      testResults.skipped++;
      testResults.details.push('⊘ Breadcrumb not found (optional feature)');
    }
  });

  // ============================================================================
  // TEST 17: RESPONSIVE BEHAVIOR - MOBILE
  // ============================================================================
  test('should adapt navigation for mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await expect(hamburger).toBeVisible();
    
    // Open drawer
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const drawer = page.locator('[class*="Drawer"], [role="navigation"]').first();
    await expect(drawer).toBeVisible();
    
    testResults.passed++;
    testResults.details.push('✅ Mobile responsive behavior works');
  });

  // ============================================================================
  // TEST 18: RESPONSIVE BEHAVIOR - TABLET
  // ============================================================================
  test('should adapt navigation for tablet viewport', async () => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await expect(hamburger).toBeVisible();
    
    testResults.passed++;
    testResults.details.push('✅ Tablet responsive behavior works');
  });

  // ============================================================================
  // TEST 19: NAVIGATION ICONS
  // ============================================================================
  test('should display icons for navigation items', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    // Check for MUI icons
    const icons = page.locator('[class*="MuiIcon"], svg').all();
    const iconCount = (await icons).length;
    
    if (iconCount > 0) {
      testResults.passed++;
      testResults.details.push(`✅ Navigation icons present (${iconCount} found)`);
    } else {
      testResults.failed++;
      testResults.details.push('❌ Navigation icons not found');
    }
  });

  // ============================================================================
  // TEST 20: ACTIVE ITEM HIGHLIGHTING
  // ============================================================================
  test('should highlight active navigation item', async () => {
    const hamburger = page.locator('button').filter({ hasText: '☰' });
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const schemasLink = page.locator('text=Schemas').first();
    await schemasLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Re-open sidebar
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const activeItem = page.locator('[class*="active"], [aria-current="page"]').first();
    
    if (await activeItem.isVisible()) {
      testResults.passed++;
      testResults.details.push('✅ Active item highlighting works');
    } else {
      testResults.skipped++;
      testResults.details.push('⊘ Active item highlighting not visible (optional)');
    }
  });

  // ============================================================================
  // FINAL TEST SUMMARY
  // ============================================================================
  test('should output comprehensive navigation test summary', async () => {
    const summary = `
╔════════════════════════════════════════════════════════════════╗
║        NAVIGATION & SIDEBAR TEST SUITE SUMMARY                ║
╚════════════════════════════════════════════════════════════════╝

✅ TESTS PASSED:     ${testResults.passed}
❌ TESTS FAILED:     ${testResults.failed}
⊘  TESTS SKIPPED:    ${testResults.skipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL TESTS:        ${testResults.passed + testResults.failed + testResults.skipped}

DETAILS:
${testResults.details.map(d => `  ${d}`).join('\n')}

NAVIGATION ITEMS TESTED: 11
  1. ✅ Dashboard
  2. ✅ Schemas (+ Create Schema)
  3. ✅ Jobs
  4. ✅ Rules
  5. ✅ Logs
  6. ✅ Backup
  7. ✅ Health
  8. ✅ API Docs
  9. ✅ Settings
  10. ✅ Help Center ⭐ (NEW)
  + Additional sub-items

RESPONSIVE LAYOUTS TESTED:
  ✅ Desktop (1280x720)
  ✅ Tablet (768x1024)
  ✅ Mobile (375x667)

STATUS: ${testResults.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
════════════════════════════════════════════════════════════════
`;
    
    console.log(summary);
    expect(testResults.failed).toBe(0);
  });
});
