# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-frontend-test.spec.ts >> COMPREHENSIVE FRONTEND TEST SUITE >> FINAL CHECK: All systems operational
- Location: tests\e2e\comprehensive-frontend-test.spec.ts:628:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Test source

```ts
  542 |       if (isVisible) {
  543 |         // Try clicking
  544 |         await button.click({ timeout: 3000 }).catch(() => {
  545 |           // Button not clickable
  546 |         });
  547 | 
  548 |         // Check if any dialog appeared
  549 |         const dialog = await page.locator('[role="dialog"], .modal, .dialog').first().isVisible().catch(() => false);
  550 | 
  551 |         if (dialog) {
  552 |           dialogCount++;
  553 |           console.log(`  ✓ Dialog ${dialogCount}: Opened`);
  554 | 
  555 |           // Try closing dialog
  556 |           const closeButton = await page.locator('[aria-label="close"], button:has-text("Close")').first();
  557 |           if (closeButton) {
  558 |             await closeButton.click({ timeout: 3000 }).catch(() => {});
  559 |           }
  560 |         }
  561 |       }
  562 |     }
  563 | 
  564 |     const screenshotPath = await takeScreenshot(page, '11-dialogs');
  565 |     metrics.screenshots.push({ description: '11-dialogs', path: screenshotPath });
  566 | 
  567 |     console.log(`✅ Dialogs tested: ${dialogCount} found`);
  568 |   });
  569 | 
  570 |   // ========================================
  571 |   // 9. PERFORMANCE & LATENCY TESTS
  572 |   // ========================================
  573 |   test('PERFORMANCE: Measure page load times', async () => {
  574 |     const pages = [
  575 |       { path: '/', name: 'Homepage' },
  576 |       { path: '/schemas', name: 'Schemas' },
  577 |       { path: '/help', name: 'Help' },
  578 |       { path: '/dashboard', name: 'Dashboard' },
  579 |     ];
  580 | 
  581 |     const loadTimes: { [key: string]: number } = {};
  582 | 
  583 |     for (const pageInfo of pages) {
  584 |       const start = Date.now();
  585 |       await page.goto(`${APP_URL}${pageInfo.path}`, { waitUntil: 'networkidle' });
  586 |       const duration = Date.now() - start;
  587 | 
  588 |       loadTimes[pageInfo.name] = duration;
  589 |       console.log(`  ${pageInfo.name}: ${duration}ms`);
  590 | 
  591 |       // Assert reasonable load time (< 10 seconds)
  592 |       expect(duration).toBeLessThan(10000);
  593 |     }
  594 | 
  595 |     console.log(`✅ Performance metrics: ${JSON.stringify(loadTimes)}`);
  596 |   });
  597 | 
  598 |   // ========================================
  599 |   // 10. ERROR HANDLING TESTS
  600 |   // ========================================
  601 |   test('ERROR HANDLING: Verify proper error states', async () => {
  602 |     // Check console for any errors
  603 |     const hasConsoleErrors = metrics.consoleErrors.length > 0;
  604 | 
  605 |     if (hasConsoleErrors) {
  606 |       console.log('Console errors found:');
  607 |       metrics.consoleErrors.forEach((err) => console.log(`  - ${err}`));
  608 |     }
  609 | 
  610 |     expect(metrics.consoleErrors.length).toBe(0);
  611 | 
  612 |     // Check for 4xx/5xx responses
  613 |     const hasHTTPErrors = metrics.requestsCount.errors.length > 0;
  614 | 
  615 |     if (hasHTTPErrors) {
  616 |       console.log('HTTP errors found:');
  617 |       metrics.requestsCount.errors.forEach((err) => console.log(`  - ${err.url}: ${err.status}`));
  618 |     }
  619 | 
  620 |     expect(metrics.requestsCount.errors.length).toBe(0);
  621 | 
  622 |     console.log(`✅ No errors detected`);
  623 |   });
  624 | 
  625 |   // ========================================
  626 |   // 11. FINAL COMPREHENSIVE CHECK
  627 |   // ========================================
  628 |   test('FINAL CHECK: All systems operational', async () => {
  629 |     console.log('\n🎯 FINAL TEST REPORT:');
  630 |     console.log('='.repeat(60));
  631 |     console.log(`Console Errors: ${metrics.consoleErrors.length} ❌ ${metrics.consoleErrors.length === 0 ? '✅' : ''}`);
  632 |     console.log(`Network Errors: ${metrics.networkErrors.length} ${metrics.networkErrors.length === 0 ? '✅' : '❌'}`);
  633 |     console.log(`HTTP Errors: ${metrics.requestsCount.failed} ${metrics.requestsCount.failed === 0 ? '✅' : '❌'}`);
  634 |     console.log(`Successful Requests: ${metrics.requestsCount.success}/${metrics.requestsCount.total}`);
  635 |     console.log(`Screenshots Taken: ${metrics.screenshots.length}`);
  636 |     console.log('='.repeat(60));
  637 | 
  638 |     // Final assertions
  639 |     expect(metrics.consoleErrors.length).toBe(0);
  640 |     expect(metrics.networkErrors.length).toBe(0);
  641 |     expect(metrics.requestsCount.failed).toBe(0);
> 642 |     expect(metrics.requestsCount.success).toBeGreaterThan(0);
      |                                           ^ Error: expect(received).toBeGreaterThan(expected)
  643 | 
  644 |     console.log('✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION');
  645 |   });
  646 | });
  647 | 
```