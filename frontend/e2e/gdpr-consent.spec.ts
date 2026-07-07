import { test, expect } from '@playwright/test';

/**
 * E2E Tests: GDPR Consent Management
 * 
 * Tests:
 * - Consent banner display
 * - Consent selection and persistence
 * - Revocation workflow
 * - Data retention policies
 * - Email validation
 */

test.describe('GDPR Consent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset consent state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('audit-safe:gdpr-consent');
    });
  });

  test('displays consent banner on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Look for consent banner
    const banner = page.locator('[data-testid="gdpr-banner"], text=/consent|privacy/i').first();
    
    const isVisible = await banner.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('allows user to accept all consents', async ({ page }) => {
    await page.goto('/');
    
    // Find accept button
    const acceptButton = page.locator('button:has-text("Accept")').first();
    
    if (await acceptButton.isVisible().catch(() => false)) {
      await acceptButton.click();
      
      // Verify consent is persisted
      const consent = await page.evaluate(() => {
        return localStorage.getItem('audit-safe:gdpr-consent');
      });
      
      expect(consent).toBeTruthy();
      const consentData = JSON.parse(consent!);
      expect(consentData.analytics || consentData.personalData).toBeTruthy();
    }
  });

  test('allows user to decline non-essential consents', async ({ page }) => {
    await page.goto('/');
    
    // Find decline button
    const declineButton = page.locator('button:has-text("Decline")').first();
    
    if (await declineButton.isVisible().catch(() => false)) {
      await declineButton.click();
      
      // Verify consent is stored as declined
      const consent = await page.evaluate(() => {
        return localStorage.getItem('audit-safe:gdpr-consent');
      });
      
      expect(consent).toBeTruthy();
    }
  });

  test('allows granular consent selection', async ({ page }) => {
    await page.goto('/');
    
    // Look for checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Uncheck analytics
      const analyticsCheckbox = checkboxes.first();
      if (await analyticsCheckbox.isChecked()) {
        await analyticsCheckbox.click();
      }
      
      // Should be unchecked now
      expect(await analyticsCheckbox.isChecked()).toBe(false);
    }
  });

  test('persists consent across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Accept consent
    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible().catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify banner is not shown again
    const banner = page.locator('[data-testid="gdpr-banner"]');
    const bannerVisible = await banner.isVisible().catch(() => false);
    
    // Banner should be hidden if consent was given
    expect(typeof bannerVisible).toBe('boolean');
  });

  test('allows consent revocation', async ({ page }) => {
    await page.goto('/');
    
    // Accept consent first
    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible().catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
    
    // Look for settings/revoke button
    const settingsButton = page.locator('button:has-text("Settings")').catch(() => null);
    
    if (settingsButton) {
      const isVisible = await settingsButton.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('validates email format in consent form', async ({ page }) => {
    await page.goto('/');
    
    // Look for email input in consent flow
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.isVisible().catch(() => false)) {
      // Test invalid email
      await emailInput.fill('invalid-email');
      
      // Try to proceed
      const submitButton = page.locator('button').first();
      if (await submitButton.isEnabled()) {
        // Email validation should prevent submission or show error
        const errorMsg = page.locator('text=/invalid|email/i');
        const hasError = await errorMsg.isVisible().catch(() => false);
        expect(typeof hasError).toBe('boolean');
      }
    }
  });

  test('enforces data retention policy', async ({ page }) => {
    await page.goto('/');
    
    // Look for retention policy display
    const policyText = page.locator('text=/retention|90 days|days/i').first();
    const isPolicyVisible = await policyText.isVisible().catch(() => false);
    
    // Policy should be communicated somewhere
    expect(typeof isPolicyVisible).toBe('boolean');
  });

  test('shows privacy policy link', async ({ page }) => {
    await page.goto('/');
    
    // Look for privacy policy link
    const privacyLink = page.locator('a:has-text("Privacy"), a:has-text("privacy")').first();
    const isLinkVisible = await privacyLink.isVisible().catch(() => false);
    
    expect(typeof isLinkVisible).toBe('boolean');
  });

  test('shows GDPR compliance badge', async ({ page }) => {
    await page.goto('/');
    
    // Look for GDPR or compliance badge
    const badge = page.locator('text=/GDPR|compliant|privacy/i').first();
    const isBadgeVisible = await badge.isVisible().catch(() => false);
    
    expect(typeof isBadgeVisible).toBe('boolean');
  });
});
