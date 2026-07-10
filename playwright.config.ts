import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive E2E Test Configuration
 * 
 * Configuration for Playwright tests that cover:
 * - All frontend pages
 * - All UI components
 * - API communication
 * - Error handling
 * - Performance metrics
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid port conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent Docker port conflicts
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // webServer disabled - assuming Docker stack is already running
  // Start manually with: docker-compose up -d

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 30 * 1000,
  globalTimeout: 30 * 60 * 1000, // 30 minutes total
  outputFolder: 'test-results',
});
