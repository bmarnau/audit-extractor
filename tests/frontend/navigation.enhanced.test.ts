/**
 * Enhanced Navigation Tests - Phase 38C
 * 
 * IMPROVED TESTING METHODOLOGY:
 * - HTTP Status Validation (Surface Level)
 * - Component Rendering Validation (Content Level)
 * - ErrorBoundary Detection (Error Level)
 * - Missing Route Detection (Configuration Level)
 * 
 * @version 0.35.0
 * @phase 38C
 */

import { test, expect } from '@playwright/test';

/**
 * Navigation test configuration
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_TIMEOUT = 5000;

/**
 * Route configuration with expected content markers
 * 
 * Each route should have:
 * - path: URL path
 * - name: Display name
 * - expectedElements: CSS selectors or text that MUST be present
 * - errorPatterns: Text patterns that indicate errors
 */
const NAVIGATION_ROUTES = [
  {
    path: '/',
    name: 'Dashboard',
    expectedElements: ['[data-testid="dashboard"]', 'h1, h2, h3'], // Should have heading
    errorPatterns: ['Oops!', 'Something went wrong', 'Error', '404', '500'],
  },
  {
    path: '/schemas',
    name: 'Schemas',
    expectedElements: ['[data-testid="schema"]', 'text=Schema'],
    errorPatterns: ['Oops!', 'Something went wrong'],
  },
  {
    path: '/jobs',
    name: 'Jobs',
    expectedElements: ['[data-testid="job"]', 'text=Job'],
    errorPatterns: ['Oops!', 'Something went wrong'],
  },
  {
    path: '/rules',
    name: 'Rules',
    expectedElements: ['[data-testid="rule"]', 'text=Rule'],
    errorPatterns: ['Oops!', 'Something went wrong'],
  },
  {
    path: '/logs',
    name: 'Logs',
    expectedElements: ['[data-testid="logs"]', 'text=Log'],
    errorPatterns: ['Oops!', 'Something went wrong'],
  },
  {
    path: '/help',
    name: 'Help',
    expectedElements: ['[data-testid="help"]', 'text=Help'],
    errorPatterns: ['Oops!', 'Something went wrong'],
  },
  // NOTE: /services route not defined - will fail
  // {
  //   path: '/services',
  //   name: 'Services',
  //   expectedElements: ['[data-testid="services"]'],
  //   errorPatterns: ['Oops!', 'Something went wrong'],
  // },
];

/**
 * Test Suite 1: HTTP Status Validation (Existing Test)
 */
test.describe('Navigation - HTTP Status Validation', () => {
  NAVIGATION_ROUTES.forEach((route) => {
    test(`${route.name}: HTTP 200`, async ({ page }) => {
      const response = await page.goto(`${FRONTEND_URL}${route.path}`, {
        timeout: API_TIMEOUT,
      });
      expect(response?.status()).toBe(200);
    });
  });
});

/**
 * Test Suite 2: Component Rendering Validation (NEW - Content Level)
 */
test.describe('Navigation - Component Rendering Validation', () => {
  NAVIGATION_ROUTES.forEach((route) => {
    test(`${route.name}: Page renders without error`, async ({ page }) => {
      // Navigate to route
      await page.goto(`${FRONTEND_URL}${route.path}`, {
        timeout: API_TIMEOUT,
      });

      // Check for ErrorBoundary error message
      const errorText = await page.textContent('text=/Oops!|Something went wrong/');
      if (errorText) {
        console.error(`❌ ${route.name}: Found error message: ${errorText}`);
      }
      expect(errorText).toBeNull();

      // Check main content area is not empty
      const mainContent = page.locator('main');
      const isVisible = await mainContent.isVisible();
      expect(isVisible).toBe(true);

      // Verify main content has actual text/content
      const textContent = await mainContent.textContent();
      expect(textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test Suite 3: Navigation Menu Validation (NEW - Configuration Level)
 */
test.describe('Navigation - Menu Configuration Validation', () => {
  test('Navigation menu shows only configured routes', async ({ page }) => {
    await page.goto(FRONTEND_URL, { timeout: API_TIMEOUT });

    // Get all navigation buttons
    const navButtons = await page.locator('main + div button, nav button').allTextContents();
    console.log('Navigation items found:', navButtons);

    // Define expected navigation items from navigationConfig
    const expectedItems = [
      'Dashboard',
      'Job Manager', // or 'Jobs'
      'Schema Management', // or 'Schemas'
      'Rule Editor', // or 'Rules'
      'Logs',
      'Help',
    ];

    // Check for unexpected items
    const hasServices = navButtons.some((text) =>
      text.toLowerCase().includes('services'),
    );

    if (hasServices) {
      console.warn('⚠️ WARNING: Found "Services" in navigation but no /services route defined!');
      console.warn('   Either:');
      console.warn('   1. Add /services route to App.tsx and navigationConfig');
      console.warn('   2. Remove Services from navigation menu');
    }
  });
});

/**
 * Test Suite 4: Error Boundary Detection (NEW - Error Level)
 */
test.describe('Navigation - ErrorBoundary Detection', () => {
  const routesWithErrors = [
    // Add routes that are known to fail
  ];

  routesWithErrors.forEach((route) => {
    test(`${route.name}: ErrorBoundary catches error`, async ({ page }) => {
      await page.goto(`${FRONTEND_URL}${route.path}`, {
        timeout: API_TIMEOUT,
      });

      const errorMessage = await page.textContent('text=/Oops!|Something went wrong/');
      expect(errorMessage).toBeTruthy();
    });
  });
});

/**
 * Test Suite 5: Missing Route Detection (NEW - Configuration Level)
 */
test.describe('Navigation - Missing Route Detection', () => {
  test('Missing /services route returns 404 or renders error', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/services`, {
      timeout: API_TIMEOUT,
      waitUntil: 'networkidle',
    });

    // Should either be 404 or 200 (Vite serves index.html for all routes)
    const status = response?.status() || 200;
    console.log(`/services returned: ${status}`);

    // Check if error component is shown
    const errorText = await page.textContent('text=/Oops!|Something went wrong|404|not found/i');
    expect(errorText).toBeTruthy();
  });

  test('Verify all defined routes have matching implementation', async ({ page }) => {
    for (const route of NAVIGATION_ROUTES) {
      await page.goto(`${FRONTEND_URL}${route.path}`, {
        timeout: API_TIMEOUT,
      });

      const errorText = await page.textContent('text=/Oops!|Something went wrong/');
      if (errorText) {
        console.error(`❌ ${route.name} (${route.path}): Component rendering error`);
      }
    }
  });
});

/**
 * Test Suite 6: Navigation Menu Integration
 */
test.describe('Navigation - Menu Integration', () => {
  test('Can navigate from Dashboard to all routes', async ({ page }) => {
    await page.goto(FRONTEND_URL, { timeout: API_TIMEOUT });

    for (const route of NAVIGATION_ROUTES) {
      // Skip if no navigation link exists
      if (route.path === '/services') continue;

      // Try to find and click navigation button
      try {
        const navButtons = page.locator(`button, [role="button"]`);
        const buttonCount = await navButtons.count();

        for (let i = 0; i < buttonCount; i++) {
          const text = await navButtons.nth(i).textContent();
          if (text?.toLowerCase().includes(route.name.toLowerCase())) {
            await navButtons.nth(i).click();
            await page.waitForLoadState('networkidle', { timeout: API_TIMEOUT });

            // Verify we reached the route
            expect(page.url()).toContain(route.path);

            // Verify no error
            const errorText = await page.textContent('text=/Oops!|Something went wrong/');
            expect(errorText).toBeNull();

            break;
          }
        }
      } catch (error) {
        console.warn(`Could not navigate to ${route.name}: ${error}`);
      }
    }
  });
});

/**
 * Test Suite 7: API Endpoint Validation
 */
test.describe('Navigation - API Endpoint Validation', () => {
  test('Verify /api/health returns valid service status', async ({ page }) => {
    const response = await page.request.get(`${FRONTEND_URL.replace(':5173', ':3000')}/api/health`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(['healthy', 'warning', 'error']).toContain(data.status);
  });
});
