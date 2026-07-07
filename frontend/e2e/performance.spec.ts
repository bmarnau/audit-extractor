/**
 * Performance Profiling Script
 * 
 * Measures:
 * - Initial page load time
 * - Component render times
 * - Memory usage
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 * - First Input Delay (FID)
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Profiling', () => {
  test('measures page load performance', async ({ page }) => {
    // Start performance measuring
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        domInteractive: timing.domInteractive - timing.fetchStart,
        redirectTime: timing.redirectEnd - timing.redirectStart,
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        tcpTime: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
      };
    });

    console.log('Navigation Timing:', navigationTiming);

    // DOM Content Loaded should be reasonable
    expect(navigationTiming.domContentLoaded).toBeLessThan(5000);
    expect(navigationTiming.loadComplete).toBeLessThan(10000);
  });

  test('measures Web Vitals', async ({ page }) => {
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};

        // Get LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          metrics.lcp = entries[entries.length - 1].startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Get FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!metrics.fid) {
              metrics.fid = entry.processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Get CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              metrics.cls = clsValue;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Resolve after a delay to collect metrics
        setTimeout(() => {
          resolve({
            lcp: metrics.lcp || null,
            fid: metrics.fid || null,
            cls: metrics.cls || 0,
          });
        }, 3000);
      });
    });

    console.log('Web Vitals:', vitals);

    // LCP should be < 2.5s
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500);
    }

    // CLS should be < 0.1
    expect(vitals.cls).toBeLessThan(0.1);
  });

  test('measures component render time', async ({ page }) => {
    await page.goto('/learning');

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');

    // Measure time to render improvement dashboard
    const renderTime = await page.evaluate(() => {
      const start = performance.now();

      // Simulate component interaction
      const buttons = document.querySelectorAll('button');
      if (buttons.length > 0) {
        buttons[0].click();
      }

      const end = performance.now();
      return end - start;
    });

    console.log('Component render time:', renderTime, 'ms');

    // Rendering should be fast
    expect(renderTime).toBeLessThan(500);
  });

  test('measures memory usage', async ({ page }) => {
    await page.goto('/learning');

    const memoryUsage = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryUsage) {
      console.log('Memory Usage:', {
        usedMB: (memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2),
        totalMB: (memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limitMB: (memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      });

      // Heap usage should be reasonable
      expect(memoryUsage.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }
  });

  test('measures bundle size impact', async ({ page }) => {
    const resourceMetrics: any = {};

    // Collect resource timing data
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        decodedSize: entry.decodedBodySize,
        initiatorType: entry.initiatorType,
      }));
    });

    console.log('Resource Metrics:', resources.slice(0, 10)); // First 10 resources

    // Calculate total transfer size
    const totalTransfer = resources.reduce((sum: number, r: any) => sum + (r.size || 0), 0);
    const totalDecoded = resources.reduce((sum: number, r: any) => sum + (r.decodedSize || 0), 0);

    console.log('Total Transfer Size:', (totalTransfer / 1024).toFixed(2), 'KB');
    console.log('Total Decoded Size:', (totalDecoded / 1024).toFixed(2), 'KB');

    // Bundle size should be reasonable for learning page
    expect(totalTransfer).toBeLessThan(2 * 1024 * 1024); // < 2MB
  });

  test('measures API response times', async ({ page }) => {
    const apiMetrics: any = [];

    // Intercept API calls and measure response time
    await page.route('**/api/**', async (route) => {
      const start = Date.now();
      await route.continue();
      const duration = Date.now() - start;
      apiMetrics.push({
        url: route.request().url(),
        method: route.request().method(),
        duration,
      });
    });

    await page.goto('/learning');
    await page.waitForLoadState('networkidle');

    console.log('API Metrics:', apiMetrics);

    // All API calls should complete quickly
    apiMetrics.forEach((metric: any) => {
      expect(metric.duration).toBeLessThan(5000); // < 5s per API call
    });
  });

  test('measures offline performance', async ({ page }) => {
    await page.goto('/learning');

    // Go offline
    await page.context().setOffline(true);

    const start = Date.now();

    // Try to interact with page
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await buttons.first().click().catch(() => null);
    }

    const interactionTime = Date.now() - start;

    console.log('Offline interaction time:', interactionTime, 'ms');

    // UI should still respond quickly even offline
    expect(interactionTime).toBeLessThan(1000);

    // Restore network
    await page.context().setOffline(false);
  });
});
