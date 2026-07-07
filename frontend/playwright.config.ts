import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Tests: Learning workflow, offline persistence, GDPR consent, error recovery
 * Base URL: http://localhost:3000 (development)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid state conflicts
  forbidOnly: !!process.env.CI, // Fail in CI if test.only() is present
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 2, // Use single worker in CI for stability
  reporter: 'html', // Generate HTML report
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // Trace on first retry for debugging
    screenshot: 'only-on-failure', // Screenshot on failure
    video: 'retain-on-failure', // Video on failure
  },

  // Web server configuration - start dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse server if not in CI
    timeout: 120000, // 2 minutes to start
  },

  // Browsers to test
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Timeouts
  timeout: 30000, // Per test timeout
  expect: {
    timeout: 5000, // Per assertion timeout
  },
});
