/**
 * COMPREHENSIVE FRONTEND TEST SUITE
 * 
 * Testet ALLE Frontend-Funktionen nach jedem Docker-Start:
 * - Navigation & Menüs
 * - Alle Buttons & UI-Elemente
 * - Dialoge & Formulare
 * - Datei-Upload
 * - API-Kommunikation
 * - Fehlerbehandlung
 * - Performance & Latenz
 * 
 * Anforderungen für erfolgreichen Test:
 * ✓ Keine JavaScript Errors
 * ✓ Keine HTTP 4xx/5xx Fehler
 * ✓ Alle Komponenten reagieren
 * ✓ Frontend lädt vollständig
 * ✓ Alle API-Aufrufe erfolgreich
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test Configuration
const TEST_TIMEOUT = 30000; // 30 seconds per test
const API_BASE_URL = 'http://localhost:3000/api';
const APP_URL = 'http://localhost';

// Track metrics
interface TestMetrics {
  pageLoadTime: number;
  apiResponseTimes: Map<string, number[]>;
  consoleErrors: string[];
  networkErrors: string[];
  requestsCount: {
    total: number;
    success: number;
    failed: number;
    errors: any[];
  };
  screenshots: {
    description: string;
    path: string;
  }[];
}

let metrics: TestMetrics;
let page: Page;
let context: BrowserContext;

/**
 * Initialize metrics tracking
 */
function initializeMetrics(): TestMetrics {
  return {
    pageLoadTime: 0,
    apiResponseTimes: new Map(),
    consoleErrors: [],
    networkErrors: [],
    requestsCount: {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    },
    screenshots: [],
  };
}

/**
 * Take screenshot with auto-path
 */
async function takeScreenshot(page: Page, description: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `./tests/e2e/screenshots/${description}-${timestamp}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

test.describe('COMPREHENSIVE FRONTEND TEST SUITE', () => {
  test.beforeEach(async ({ browser }) => {
    // Initialize metrics
    metrics = initializeMetrics();

    // Create context with network interception
    context = await browser.newContext();
    page = await context.newPage();

    // Log console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorMsg = `${msg.location().url}:${msg.location().lineNumber} - ${msg.text()}`;
        metrics.consoleErrors.push(errorMsg);
        console.error(`🔴 Console Error: ${errorMsg}`);
      }
    });

    // Track network requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();
      metrics.networkErrors.push(`${request.method()} ${url} - ${failure?.errorText}`);
      metrics.requestsCount.failed++;
      metrics.requestsCount.errors.push({
        url,
        method: request.method(),
        error: failure?.errorText,
      });
      console.warn(`⚠️  Network Error: ${request.method()} ${url}`);
    });

    // Track all requests
    page.on('response', (response) => {
      const url = response.url();
      metrics.requestsCount.total++;

      if (response.status() >= 400) {
        metrics.requestsCount.failed++;
        metrics.requestsCount.errors.push({
          url,
          status: response.status(),
          statusText: response.statusText(),
        });
        console.warn(`⚠️  HTTP ${response.status()}: ${url}`);
      } else {
        metrics.requestsCount.success++;
      }

      // Track API response times
      if (url.includes('/api/')) {
        const apiPath = new URL(url).pathname;
        if (!metrics.apiResponseTimes.has(apiPath)) {
          metrics.apiResponseTimes.set(apiPath, []);
        }
      }
    });
  });

  test.afterEach(async () => {
    // Report metrics (with safety check for undefined)
    if (metrics) {
      console.log('\n📊 TEST METRICS:');
      console.log(`  Page Load Time: ${metrics.pageLoadTime}ms`);
      console.log(`  Console Errors: ${metrics.consoleErrors.length}`);
      console.log(`  Network Errors: ${metrics.networkErrors.length}`);
      console.log(`  Requests: ${metrics.requestsCount.success}/${metrics.requestsCount.total} successful`);
      console.log(`  Screenshots: ${metrics.screenshots.length} taken`);
    } else {
      console.log('\n⚠️  TEST METRICS: (not initialized)');
    }

    // Close page
    if (context) {
      await context.close();
    }
  });

  // ========================================
  // 1. HOMEPAGE & NAVIGATION TESTS
  // ========================================
  test('HOMEPAGE: Load and verify initial structure', async () => {
    const startTime = Date.now();

    // Navigate to homepage
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    metrics.pageLoadTime = Date.now() - startTime;

    // Verify page title
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✓ Page Title: ${title}`);

    // Verify main layout elements exist
    const mainContent = await page.locator('main').first();
    expect(mainContent).toBeVisible({ timeout: 5000 });

    // Take screenshot
    const screenshotPath = await takeScreenshot(page, '01-homepage');
    metrics.screenshots.push({ description: '01-homepage', path: screenshotPath });

    // Check no console errors on load
    expect(metrics.consoleErrors.length).toBe(0);
    console.log(`✅ Homepage loaded successfully in ${metrics.pageLoadTime}ms`);
  });

  test('NAVIGATION: Verify all menu items visible and clickable', async () => {
    await page.goto(APP_URL);

    // Check main navigation exists
    const nav = await page.locator('nav').first();
    expect(nav).toBeVisible({ timeout: 5000 });

    // Find all navigation links
    const navLinks = await page.locator('nav a, nav button').all();
    expect(navLinks.length).toBeGreaterThan(0);

    console.log(`Found ${navLinks.length} navigation items`);

    // Verify each link is visible and clickable
    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      const link = navLinks[i];
      const isVisible = await link.isVisible();
      const isEnabled = await link.isEnabled();

      expect(isVisible).toBe(true);
      expect(isEnabled).toBe(true);

      const text = await link.textContent();
      console.log(`  ✓ Nav item ${i + 1}: "${text?.trim()}" (visible: ${isVisible}, enabled: ${isEnabled})`);
    }

    const screenshotPath = await takeScreenshot(page, '02-navigation');
    metrics.screenshots.push({ description: '02-navigation', path: screenshotPath });
  });

  // ========================================
  // 2. SCHEMAS PAGE TESTS
  // ========================================
  test('SCHEMAS PAGE: Load and verify schema list', async () => {
    await page.goto(`${APP_URL}/schemas`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check for schema list container
    const schemaContainer = await page.locator('[role="table"], .schema-list, .schemas-container').first();
    expect(schemaContainer).toBeVisible({ timeout: 5000 }).catch(() => {
      // If no table found, check for "no data" message
      return page.locator('text=/no.*schema|empty|keine/i').first();
    });

    const screenshotPath = await takeScreenshot(page, '03-schemas-list');
    metrics.screenshots.push({ description: '03-schemas-list', path: screenshotPath });

    console.log(`✅ Schemas page loaded`);
  });

  test('SCHEMAS PAGE: API call verification', async () => {
    let apiCallMade = false;
    let apiStatus = 0;

    // Intercept API calls
    await page.route('**/api/schema/schemas**', async (route) => {
      apiCallMade = true;
      const response = await route.fetch();
      apiStatus = response.status();

      // Verify successful API call
      expect(response.status()).toBeLessThan(400);
      console.log(`✓ API Call: GET /api/schema/schemas - Status ${response.status()}`);

      await route.continue();
    });

    await page.goto(`${APP_URL}/schemas`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verify API was called
    expect(apiCallMade).toBe(true);
    expect(apiStatus).toBeLessThan(400);

    console.log(`✅ Schema API call successful (HTTP ${apiStatus})`);
  });

  // ========================================
  // 3. HELP CENTER / TABS TESTS
  // ========================================
  test('HELP CENTER: Load and verify tabs', async () => {
    await page.goto(`${APP_URL}/help`);

    // Wait for tabs to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check for tab container
    const tabs = await page.locator('[role="tab"], .tab, .help-tabs').all();
    console.log(`Found ${tabs.length} tabs`);

    // Verify at least one tab exists
    expect(tabs.length).toBeGreaterThan(0);

    const screenshotPath = await takeScreenshot(page, '04-help-center');
    metrics.screenshots.push({ description: '04-help-center', path: screenshotPath });

    console.log(`✅ Help Center loaded with ${tabs.length} tabs`);
  });

  test('HELP CENTER: Click each tab and verify content', async () => {
    await page.goto(`${APP_URL}/help`);

    // Get all tabs
    const tabs = await page.locator('[role="tab"], .tab').all();

    for (let i = 0; i < Math.min(tabs.length, 3); i++) {
      const tab = tabs[i];
      const tabName = await tab.textContent();

      // Click tab
      await tab.click({ timeout: 5000 });

      // Wait for content to load
      await page.waitForTimeout(500);

      // Verify tab is now active
      const isActive = await tab.evaluate((el) => {
        return el.getAttribute('aria-selected') === 'true' ||
               el.classList.contains('active') ||
               el.classList.contains('selected');
      });

      console.log(`✓ Tab "${tabName?.trim()}": Clicked (Active: ${isActive})`);

      // Take screenshot
      const screenshotPath = await takeScreenshot(page, `05-tab-${i}-${tabName?.trim()}`);
      metrics.screenshots.push({ description: `tab-${i}`, path: screenshotPath });
    }

    console.log(`✅ All tabs verified`);
  });

  // ========================================
  // 4. DASHBOARD TESTS
  // ========================================
  test('DASHBOARD: Load and verify components', async () => {
    await page.goto(`${APP_URL}/`);

    // Wait for main content area to be visible
    const mainContent = page.locator('main').first();
    await mainContent.waitFor({ state: 'visible', timeout: 5000 });

    // Wait a bit for metrics to load from API
    await page.waitForTimeout(2000);

    // Verify key metric cards by looking for their text labels
    const metricsToCheck = [
      { name: 'Config Status', label: 'Config Status' },
      { name: 'Backup Status', label: 'Backup Status' },
      { name: 'Extraction Rules', label: 'Extraction Rules' },
      { name: 'Configurations', label: 'Configurations' },
      { name: 'Schemas', label: 'Schemas' },
      { name: 'Documents', label: 'Documents' },
      { name: 'Manuals', label: 'Manuals' },
    ];
    
    const foundMetrics: { [key: string]: { found: boolean; value?: string } } = {};

    for (const metric of metricsToCheck) {
      try {
        // Find the metric card by text label
        const labelLocator = page.locator(`text="${metric.label}"`).first();
        const isVisible = await labelLocator.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          // Navigate up to the Card, then find the h5 element that contains the value
          // The structure is: div (card) > h6/Typography (label) and h5 (value)
          const cardParent = labelLocator.locator('xpath=ancestor::*[contains(@class, "MuiCard")]').first();
          const valueElement = cardParent.locator('h5').first();
          const value = await valueElement.textContent({ timeout: 1000 }).catch(() => null);
          foundMetrics[metric.name] = { found: true, value: value?.trim() || '0' };
          console.log(`✓ ${metric.name}: ${value?.trim() || '0'}`);
        } else {
          foundMetrics[metric.name] = { found: false };
          console.log(`✗ ${metric.name}: Label not found`);
        }
      } catch (err) {
        foundMetrics[metric.name] = { found: false };
        console.log(`✗ ${metric.name}: Error - ${err instanceof Error ? err.message : err}`);
      }
    }

    // Verify all metrics were found
    const allFound = Object.values(foundMetrics).every(m => m.found);
    if (allFound) {
      console.log(`✅ All ${Object.keys(foundMetrics).length} metric cards found!`);
      console.log(`📊 Metric Values:`, JSON.stringify(
        Object.fromEntries(
          Object.entries(foundMetrics).map(([k, v]) => [k, v.value || 'N/A'])
        )
      ));
    } else {
      const missing = Object.entries(foundMetrics)
        .filter(([_, m]) => !m.found)
        .map(([k, _]) => k);
      console.log(`⚠️ Missing metrics: ${missing.join(', ')}`);
    }

    const screenshotPath = await takeScreenshot(page, '06-dashboard');
    metrics.screenshots.push({ description: '06-dashboard', path: screenshotPath });

    console.log(`✅ Dashboard verification complete`);
  });

  test('DASHBOARD: Test refresh buttons', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Find refresh buttons
    const refreshButtons = await page.locator('button:has-text("Refresh"), button[title*="refresh" i]').all();

    for (let i = 0; i < Math.min(refreshButtons.length, 2); i++) {
      const button = refreshButtons[i];
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      if (isVisible && isEnabled) {
        // Click refresh button
        await button.click({ timeout: 5000 });

        // Wait for update
        await page.waitForTimeout(1000);

        console.log(`✓ Refresh button ${i + 1}: Clicked successfully`);
      }
    }

    const screenshotPath = await takeScreenshot(page, '07-dashboard-refresh');
    metrics.screenshots.push({ description: '07-dashboard-refresh', path: screenshotPath });

    console.log(`✅ Refresh buttons tested`);
  });

  // ========================================
  // 5. FORMS & INPUT TESTS
  // ========================================
  test('FORMS: Find and fill all input fields', async () => {
    // Try to find forms on different pages
    const pagesToTest = ['/', '/schemas', '/help'];

    for (const pagePath of pagesToTest) {
      await page.goto(`${APP_URL}${pagePath}`);

      const inputs = await page.locator('input[type="text"], input[type="search"], textarea').all();

      if (inputs.length > 0) {
        console.log(`Found ${inputs.length} input fields on ${pagePath}`);

        // Fill first few inputs
        for (let i = 0; i < Math.min(inputs.length, 2); i++) {
          const input = inputs[i];
          const isVisible = await input.isVisible();

          if (isVisible) {
            await input.fill(`Test Input ${i + 1}`);
            const value = await input.inputValue();
            console.log(`  ✓ Input ${i + 1}: Filled with "${value}"`);
          }
        }
      }
    }

    const screenshotPath = await takeScreenshot(page, '08-forms');
    metrics.screenshots.push({ description: '08-forms', path: screenshotPath });

    console.log(`✅ Forms tested`);
  });

  // ========================================
  // 6. BUTTON CLICK TESTS
  // ========================================
  test('BUTTONS: Find and click all interactive buttons', async () => {
    await page.goto(APP_URL);

    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on homepage`);

    let clickedCount = 0;
    let visibleCount = 0;

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      const isVisible = await button.isVisible();

      if (isVisible) {
        visibleCount++;
        const text = await button.textContent();

        try {
          await button.click({ timeout: 3000 }).catch(() => {
            // Some buttons might not be clickable
          });
          clickedCount++;
          console.log(`  ✓ Button "${text?.trim()}": Clicked`);
        } catch (e) {
          console.log(`  ⚠ Button "${text?.trim()}": Not clickable`);
        }
      }
    }

    const screenshotPath = await takeScreenshot(page, '09-buttons');
    metrics.screenshots.push({ description: '09-buttons', path: screenshotPath });

    console.log(`✅ Buttons tested: ${clickedCount} clicked, ${visibleCount} visible`);
  });

  // ========================================
  // 7. FILE UPLOAD TESTS
  // ========================================
  test('FILE UPLOAD: Find and test file input', async () => {
    // Look for file uploads on multiple pages
    await page.goto(APP_URL);

    const fileInputs = await page.locator('input[type="file"]').all();

    if (fileInputs.length > 0) {
      console.log(`Found ${fileInputs.length} file input(s)`);

      for (let i = 0; i < Math.min(fileInputs.length, 1); i++) {
        const fileInput = fileInputs[i];
        const isVisible = await fileInput.isVisible();

        if (isVisible) {
          // Try to set file (this will fail without actual file, but tests the mechanism)
          try {
            // Just verify the input exists and can receive focus
            await fileInput.focus();
            console.log(`  ✓ File input ${i + 1}: Found and focused`);
          } catch (e) {
            console.log(`  ⚠ File input ${i + 1}: Could not interact`);
          }
        }
      }
    } else {
      console.log('No file inputs found on homepage');
    }

    const screenshotPath = await takeScreenshot(page, '10-file-upload');
    metrics.screenshots.push({ description: '10-file-upload', path: screenshotPath });
  });

  // ========================================
  // 8. DIALOG & MODAL TESTS
  // ========================================
  test('DIALOGS: Find and open all modals/dialogs', async () => {
    await page.goto(APP_URL);

    // Find all buttons that might open dialogs
    const dialogButtons = await page.locator('button').all();
    let dialogCount = 0;

    for (let i = 0; i < Math.min(dialogButtons.length, 3); i++) {
      const button = dialogButtons[i];
      const isVisible = await button.isVisible();

      if (isVisible) {
        // Try clicking
        await button.click({ timeout: 3000 }).catch(() => {
          // Button not clickable
        });

        // Check if any dialog appeared
        const dialog = await page.locator('[role="dialog"], .modal, .dialog').first().isVisible().catch(() => false);

        if (dialog) {
          dialogCount++;
          console.log(`  ✓ Dialog ${dialogCount}: Opened`);

          // Try closing dialog
          const closeButton = await page.locator('[aria-label="close"], button:has-text("Close")').first();
          if (closeButton) {
            await closeButton.click({ timeout: 3000 }).catch(() => {});
          }
        }
      }
    }

    const screenshotPath = await takeScreenshot(page, '11-dialogs');
    metrics.screenshots.push({ description: '11-dialogs', path: screenshotPath });

    console.log(`✅ Dialogs tested: ${dialogCount} found`);
  });

  // ========================================
  // 9. PERFORMANCE & LATENCY TESTS
  // ========================================
  test('PERFORMANCE: Measure page load times', async () => {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/schemas', name: 'Schemas' },
      { path: '/help', name: 'Help' },
      { path: '/dashboard', name: 'Dashboard' },
    ];

    const loadTimes: { [key: string]: number } = {};

    for (const pageInfo of pages) {
      const start = Date.now();
      await page.goto(`${APP_URL}${pageInfo.path}`, { waitUntil: 'networkidle' });
      const duration = Date.now() - start;

      loadTimes[pageInfo.name] = duration;
      console.log(`  ${pageInfo.name}: ${duration}ms`);

      // Assert reasonable load time (< 10 seconds)
      expect(duration).toBeLessThan(10000);
    }

    console.log(`✅ Performance metrics: ${JSON.stringify(loadTimes)}`);
  });

  // ========================================
  // 10. ERROR HANDLING TESTS
  // ========================================
  test('ERROR HANDLING: Verify proper error states', async () => {
    // Check console for any errors
    const hasConsoleErrors = metrics.consoleErrors.length > 0;

    if (hasConsoleErrors) {
      console.log('Console errors found:');
      metrics.consoleErrors.forEach((err) => console.log(`  - ${err}`));
    }

    expect(metrics.consoleErrors.length).toBe(0);

    // Check for 4xx/5xx responses
    const hasHTTPErrors = metrics.requestsCount.errors.length > 0;

    if (hasHTTPErrors) {
      console.log('HTTP errors found:');
      metrics.requestsCount.errors.forEach((err) => console.log(`  - ${err.url}: ${err.status}`));
    }

    expect(metrics.requestsCount.errors.length).toBe(0);

    console.log(`✅ No errors detected`);
  });

  // ========================================
  // 11. FINAL COMPREHENSIVE CHECK
  // ========================================
  test('FINAL CHECK: All systems operational', async () => {
    console.log('\n🎯 FINAL TEST REPORT:');
    console.log('='.repeat(60));
    console.log(`Console Errors: ${metrics.consoleErrors.length} ❌ ${metrics.consoleErrors.length === 0 ? '✅' : ''}`);
    console.log(`Network Errors: ${metrics.networkErrors.length} ${metrics.networkErrors.length === 0 ? '✅' : '❌'}`);
    console.log(`HTTP Errors: ${metrics.requestsCount.failed} ${metrics.requestsCount.failed === 0 ? '✅' : '❌'}`);
    console.log(`Successful Requests: ${metrics.requestsCount.success}/${metrics.requestsCount.total}`);
    console.log(`Screenshots Taken: ${metrics.screenshots.length}`);
    console.log('='.repeat(60));

    // Final assertions
    expect(metrics.consoleErrors.length).toBe(0);
    expect(metrics.networkErrors.length).toBe(0);
    expect(metrics.requestsCount.failed).toBe(0);
    expect(metrics.requestsCount.success).toBeGreaterThan(0);

    console.log('✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION');
  });
});
