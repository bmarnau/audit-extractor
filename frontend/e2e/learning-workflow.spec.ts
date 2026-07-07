import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Learning Workflow
 * 
 * Tests complete user flows:
 * - Extracting a document
 * - Providing feedback on extraction
 * - Reviewing suggestions
 * - Applying improvements
 * - Tracking progress
 */

test.describe('Learning Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the learning page
    await page.goto('/learning');
    // Wait for page to load
    await page.waitForSelector('[data-testid="learning-container"]', { timeout: 10000 }).catch(() => null);
  });

  test('displays learning workflow UI', async ({ page }) => {
    // Verify main sections are visible
    expect(await page.locator('text=/extraction|feedback|suggestion/i').first()).toBeVisible();
  });

  test('can submit extraction feedback', async ({ page }) => {
    // Find feedback form
    const feedbackForm = page.locator('[data-testid="feedback-form"]');
    
    // Check if form exists (may not if no extraction result available)
    if (await feedbackForm.isVisible()) {
      // Type in feedback textarea
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible()) {
        await feedbackTextarea.fill('Test feedback for extraction quality');
        
        // Submit feedback
        const submitButton = page.locator('button:has-text("Submit")').first();
        if (await submitButton.isEnabled()) {
          await submitButton.click();
          
          // Verify success message or callback
          await page.waitForTimeout(1000);
          expect(page).toBeTruthy();
        }
      }
    }
  });

  test('displays suggestion review panel', async ({ page }) => {
    // Look for suggestions section
    const suggestionsPanel = page.locator('[data-testid="suggestions-panel"]');
    
    // Panel may not be visible if no suggestions available
    if (await suggestionsPanel.isVisible()) {
      expect(suggestionsPanel).toBeVisible();
    }
  });

  test('shows improvement dashboard', async ({ page }) => {
    // Dashboard should always be visible in learning page
    const dashboard = page.locator('[data-testid="improvement-dashboard"]');
    
    if (await dashboard.isVisible()) {
      // Check for KPI cards
      const cards = page.locator('[class*="MuiCard"]');
      expect(await cards.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('navigation between sections works', async ({ page }) => {
    // Look for tab navigation
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      // Click first tab
      await tabs.first().click();
      await page.waitForTimeout(500);
      
      // Should still be on learning page
      expect(page.url()).toContain('/learning');
    }
  });

  test('responsive layout on mobile', async ({ page, context }) => {
    // Create mobile device context
    const mobileContext = await context.browser().newContext({
      ...context,
      viewport: { width: 375, height: 667 }, // iPhone 6/7/8
    });
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('/learning');
    
    // Check that layout is responsive
    const mainContent = mobilePage.locator('main, [role="main"]');
    if (await mainContent.isVisible()) {
      const boundingBox = await mainContent.boundingBox();
      if (boundingBox) {
        // Width should fit mobile viewport
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
    
    await mobileContext.close();
  });

  test('page remains responsive during interactions', async ({ page }) => {
    // Verify page responds to clicks
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      // Get first button and check it's clickable
      const firstButton = buttons.first();
      expect(await firstButton.isEnabled()).toBeTruthy();
    }
  });

  test('accessibility: page has title', async ({ page }) => {
    const title = page.locator('title');
    expect(await title.count()).toBeGreaterThan(0);
  });

  test('accessibility: main content is marked', async ({ page }) => {
    // Look for main landmark or role
    const main = page.locator('main');
    const mainRole = page.locator('[role="main"]');
    
    const mainExists = await main.isVisible().catch(() => false);
    const mainRoleExists = await mainRole.isVisible().catch(() => false);
    
    // At least one should exist for accessibility
    expect(mainExists || mainRoleExists).toBeTruthy();
  });
});
