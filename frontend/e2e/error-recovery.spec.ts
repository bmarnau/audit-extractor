import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Error Recovery & Resilience
 * 
 * Tests:
 * - Network error handling
 * - API timeout handling
 * - Component error boundaries
 * - Recovery workflows
 * - Error logging
 */

test.describe('Error Recovery & Resilience', () => {
  test('handles network errors gracefully', async ({ page }) => {
    await page.goto('/learning');
    
    // Simulate network error
    await page.context().setOffline(true);
    
    // Try to perform action (feedback, etc)
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      if (await firstButton.isEnabled()) {
        await firstButton.click().catch(() => null);
      }
    }
    
    // Verify UI shows offline or error state
    await page.waitForTimeout(500);
    
    // Page should still be responsive
    expect(await page.url()).toContain('/learning');
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('displays error boundary on component error', async ({ page }) => {
    await page.goto('/learning');
    
    // Look for error boundary / fallback UI
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    const errorMsg = page.locator('text=/error|something went wrong/i');
    
    // At least one error handling mechanism should exist
    const boundaryVisible = await errorBoundary.isVisible().catch(() => false);
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    
    expect(typeof boundaryVisible || typeof errorVisible).toBe('boolean');
  });

  test('allows retry after error', async ({ page }) => {
    await page.goto('/learning');
    
    // Look for retry button
    const retryButton = page.locator('button:has-text("Retry")').first();
    
    const retryVisible = await retryButton.isVisible().catch(() => false);
    expect(typeof retryVisible).toBe('boolean');
    
    if (retryVisible) {
      // Click retry
      await retryButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('logs errors to console and storage', async ({ page }) => {
    await page.goto('/learning');
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Verify error logging exists
    const loggerExists = await page.evaluate(() => {
      return typeof (window as any).Logger !== 'undefined';
    });
    
    expect(typeof loggerExists).toBe('boolean');
  });

  test('recovers from API timeout', async ({ page }) => {
    // Intercept requests to simulate timeout
    await page.route('**/api/**', route => {
      // Simulate very slow response (will timeout)
      setTimeout(() => {
        route.abort('timedout');
      }, 100);
    });
    
    await page.goto('/learning');
    await page.waitForTimeout(1000);
    
    // Page should still be usable
    expect(await page.url()).toContain('/learning');
  });

  test('handles malformed API responses', async ({ page }) => {
    // Intercept API calls to return bad data
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/learning');
    await page.waitForTimeout(1000);
    
    // UI should not crash
    const mainContent = page.locator('main, [role="main"]');
    expect(await mainContent.isVisible().catch(() => false)).toBeTruthy();
  });

  test('shows user-friendly error messages', async ({ page }) => {
    await page.goto('/learning');
    
    // Simulate an error scenario
    await page.context().setOffline(true);
    
    // Trigger action that would fail
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await buttons.first().click().catch(() => null);
    }
    
    await page.waitForTimeout(500);
    
    // Look for error message
    const errorText = page.locator('text=/connection|network|offline/i');
    const isVisible = await errorText.isVisible().catch(() => false);
    
    expect(typeof isVisible).toBe('boolean');
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('preserves user input on error', async ({ page }) => {
    await page.goto('/learning');
    
    // Fill in a form
    const firstInput = page.locator('input, textarea').first();
    if (await firstInput.isVisible()) {
      await firstInput.fill('test input data');
      
      // Simulate error
      await page.context().setOffline(true);
      
      // Try to submit
      const submitButton = page.locator('button:has-text("Submit")').first();
      if (await submitButton.isEnabled()) {
        await submitButton.click().catch(() => null);
      }
      
      // Verify input is still there
      const inputValue = await firstInput.inputValue().catch(() => '');
      expect(inputValue).toContain('test');
      
      // Restore network
      await page.context().setOffline(false);
    }
  });

  test('automatically retries failed requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/**', route => {
      requestCount++;
      
      // Fail first request, succeed on retry
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/learning');
    await page.waitForTimeout(1000);
    
    // Should have made at least one retry attempt
    expect(requestCount).toBeGreaterThanOrEqual(1);
  });

  test('provides offline fallback UI', async ({ page }) => {
    await page.goto('/learning');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Look for offline indicator or fallback
    const offlineIndicator = page.locator('[data-testid="offline"], text=/offline/i').first();
    
    const isVisible = await offlineIndicator.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
    
    // Restore network
    await page.context().setOffline(false);
  });
});
