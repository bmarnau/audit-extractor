# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-frontend-test.spec.ts >> COMPREHENSIVE FRONTEND TEST SUITE >> NAVIGATION: Verify all menu items visible and clickable
- Location: tests\e2e\comprehensive-frontend-test.spec.ts:185:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav').first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav').first()

```

```yaml
- banner:
  - heading "Document Extraction System" [level=6]
  - button
- heading "Audit-Safe Extractor" [level=6]
- list:
  - link "Dashboard":
    - /url: /
  - link "Schema Upload":
    - /url: /schema-wizard
  - link "Schema Management":
    - /url: /schemas
  - link "Documents":
    - /url: /documents
  - link "Extraction Workbench":
    - /url: /workbench
  - link "Rule Editor":
    - /url: /rules
  - link "Learning":
    - /url: /learning
  - link "Audit Trail":
    - /url: /audit
  - link "Logs":
    - /url: /logs
  - link "Configuration":
    - /url: /configuration
  - link "Backups":
    - /url: /backups
  - link "Help":
    - /url: /help
- main:
  - heading "Dashboard" [level=4]
  - button "Refresh"
  - paragraph: Config Status
  - heading "Active" [level=5]
  - text: 9.7.2026, 20:03:39
  - paragraph: Backup Status
  - heading "0" [level=5]
  - text: No backups yet
  - paragraph: API Status
  - text: Healthy API is operational
  - paragraph: Extraction Rules
  - heading "0" [level=5]
  - text: Active rules
  - paragraph: Configurations
  - heading "1" [level=5]
  - text: Active config version
  - paragraph: Schemas
  - heading "0" [level=5]
  - text: Active schemas
  - paragraph: Documents
  - heading "0" [level=5]
  - text: Extraction runs
  - paragraph: Manuals
  - heading "7" [level=5]
  - text: Documentation sections
  - heading "System Information" [level=6]
  - text: "Frontend: Running on port 5173 Backend: Running on port 3000 Timestamp: 9.7.2026, 20:03:39"
```

# Test source

```ts
  90  |       if (msg.type() === 'error') {
  91  |         const errorMsg = `${msg.location().url}:${msg.location().lineNumber} - ${msg.text()}`;
  92  |         metrics.consoleErrors.push(errorMsg);
  93  |         console.error(`🔴 Console Error: ${errorMsg}`);
  94  |       }
  95  |     });
  96  | 
  97  |     // Track network requests
  98  |     page.on('requestfailed', (request) => {
  99  |       const url = request.url();
  100 |       const failure = request.failure();
  101 |       metrics.networkErrors.push(`${request.method()} ${url} - ${failure?.errorText}`);
  102 |       metrics.requestsCount.failed++;
  103 |       metrics.requestsCount.errors.push({
  104 |         url,
  105 |         method: request.method(),
  106 |         error: failure?.errorText,
  107 |       });
  108 |       console.warn(`⚠️  Network Error: ${request.method()} ${url}`);
  109 |     });
  110 | 
  111 |     // Track all requests
  112 |     page.on('response', (response) => {
  113 |       const url = response.url();
  114 |       metrics.requestsCount.total++;
  115 | 
  116 |       if (response.status() >= 400) {
  117 |         metrics.requestsCount.failed++;
  118 |         metrics.requestsCount.errors.push({
  119 |           url,
  120 |           status: response.status(),
  121 |           statusText: response.statusText(),
  122 |         });
  123 |         console.warn(`⚠️  HTTP ${response.status()}: ${url}`);
  124 |       } else {
  125 |         metrics.requestsCount.success++;
  126 |       }
  127 | 
  128 |       // Track API response times
  129 |       if (url.includes('/api/')) {
  130 |         const apiPath = new URL(url).pathname;
  131 |         if (!metrics.apiResponseTimes.has(apiPath)) {
  132 |           metrics.apiResponseTimes.set(apiPath, []);
  133 |         }
  134 |       }
  135 |     });
  136 |   });
  137 | 
  138 |   test.afterEach(async () => {
  139 |     // Report metrics (with safety check for undefined)
  140 |     if (metrics) {
  141 |       console.log('\n📊 TEST METRICS:');
  142 |       console.log(`  Page Load Time: ${metrics.pageLoadTime}ms`);
  143 |       console.log(`  Console Errors: ${metrics.consoleErrors.length}`);
  144 |       console.log(`  Network Errors: ${metrics.networkErrors.length}`);
  145 |       console.log(`  Requests: ${metrics.requestsCount.success}/${metrics.requestsCount.total} successful`);
  146 |       console.log(`  Screenshots: ${metrics.screenshots.length} taken`);
  147 |     } else {
  148 |       console.log('\n⚠️  TEST METRICS: (not initialized)');
  149 |     }
  150 | 
  151 |     // Close page
  152 |     if (context) {
  153 |       await context.close();
  154 |     }
  155 |   });
  156 | 
  157 |   // ========================================
  158 |   // 1. HOMEPAGE & NAVIGATION TESTS
  159 |   // ========================================
  160 |   test('HOMEPAGE: Load and verify initial structure', async () => {
  161 |     const startTime = Date.now();
  162 | 
  163 |     // Navigate to homepage
  164 |     await page.goto(APP_URL, { waitUntil: 'networkidle' });
  165 |     metrics.pageLoadTime = Date.now() - startTime;
  166 | 
  167 |     // Verify page title
  168 |     const title = await page.title();
  169 |     expect(title).toBeTruthy();
  170 |     console.log(`✓ Page Title: ${title}`);
  171 | 
  172 |     // Verify main layout elements exist
  173 |     const mainContent = await page.locator('main').first();
  174 |     expect(mainContent).toBeVisible({ timeout: 5000 });
  175 | 
  176 |     // Take screenshot
  177 |     const screenshotPath = await takeScreenshot(page, '01-homepage');
  178 |     metrics.screenshots.push({ description: '01-homepage', path: screenshotPath });
  179 | 
  180 |     // Check no console errors on load
  181 |     expect(metrics.consoleErrors.length).toBe(0);
  182 |     console.log(`✅ Homepage loaded successfully in ${metrics.pageLoadTime}ms`);
  183 |   });
  184 | 
  185 |   test('NAVIGATION: Verify all menu items visible and clickable', async () => {
  186 |     await page.goto(APP_URL);
  187 | 
  188 |     // Check main navigation exists
  189 |     const nav = await page.locator('nav').first();
> 190 |     expect(nav).toBeVisible({ timeout: 5000 });
      |                 ^ Error: expect(locator).toBeVisible() failed
  191 | 
  192 |     // Find all navigation links
  193 |     const navLinks = await page.locator('nav a, nav button').all();
  194 |     expect(navLinks.length).toBeGreaterThan(0);
  195 | 
  196 |     console.log(`Found ${navLinks.length} navigation items`);
  197 | 
  198 |     // Verify each link is visible and clickable
  199 |     for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
  200 |       const link = navLinks[i];
  201 |       const isVisible = await link.isVisible();
  202 |       const isEnabled = await link.isEnabled();
  203 | 
  204 |       expect(isVisible).toBe(true);
  205 |       expect(isEnabled).toBe(true);
  206 | 
  207 |       const text = await link.textContent();
  208 |       console.log(`  ✓ Nav item ${i + 1}: "${text?.trim()}" (visible: ${isVisible}, enabled: ${isEnabled})`);
  209 |     }
  210 | 
  211 |     const screenshotPath = await takeScreenshot(page, '02-navigation');
  212 |     metrics.screenshots.push({ description: '02-navigation', path: screenshotPath });
  213 |   });
  214 | 
  215 |   // ========================================
  216 |   // 2. SCHEMAS PAGE TESTS
  217 |   // ========================================
  218 |   test('SCHEMAS PAGE: Load and verify schema list', async () => {
  219 |     await page.goto(`${APP_URL}/schemas`);
  220 | 
  221 |     // Wait for page to load
  222 |     await page.waitForLoadState('networkidle', { timeout: 10000 });
  223 | 
  224 |     // Check for schema list container
  225 |     const schemaContainer = await page.locator('[role="table"], .schema-list, .schemas-container').first();
  226 |     expect(schemaContainer).toBeVisible({ timeout: 5000 }).catch(() => {
  227 |       // If no table found, check for "no data" message
  228 |       return page.locator('text=/no.*schema|empty|keine/i').first();
  229 |     });
  230 | 
  231 |     const screenshotPath = await takeScreenshot(page, '03-schemas-list');
  232 |     metrics.screenshots.push({ description: '03-schemas-list', path: screenshotPath });
  233 | 
  234 |     console.log(`✅ Schemas page loaded`);
  235 |   });
  236 | 
  237 |   test('SCHEMAS PAGE: API call verification', async () => {
  238 |     let apiCallMade = false;
  239 |     let apiStatus = 0;
  240 | 
  241 |     // Intercept API calls
  242 |     await page.route('**/api/schema/schemas**', async (route) => {
  243 |       apiCallMade = true;
  244 |       const response = await route.fetch();
  245 |       apiStatus = response.status();
  246 | 
  247 |       // Verify successful API call
  248 |       expect(response.status()).toBeLessThan(400);
  249 |       console.log(`✓ API Call: GET /api/schema/schemas - Status ${response.status()}`);
  250 | 
  251 |       await route.continue();
  252 |     });
  253 | 
  254 |     await page.goto(`${APP_URL}/schemas`);
  255 |     await page.waitForLoadState('networkidle', { timeout: 10000 });
  256 | 
  257 |     // Verify API was called
  258 |     expect(apiCallMade).toBe(true);
  259 |     expect(apiStatus).toBeLessThan(400);
  260 | 
  261 |     console.log(`✅ Schema API call successful (HTTP ${apiStatus})`);
  262 |   });
  263 | 
  264 |   // ========================================
  265 |   // 3. HELP CENTER / TABS TESTS
  266 |   // ========================================
  267 |   test('HELP CENTER: Load and verify tabs', async () => {
  268 |     await page.goto(`${APP_URL}/help`);
  269 | 
  270 |     // Wait for tabs to load
  271 |     await page.waitForLoadState('networkidle', { timeout: 10000 });
  272 | 
  273 |     // Check for tab container
  274 |     const tabs = await page.locator('[role="tab"], .tab, .help-tabs').all();
  275 |     console.log(`Found ${tabs.length} tabs`);
  276 | 
  277 |     // Verify at least one tab exists
  278 |     expect(tabs.length).toBeGreaterThan(0);
  279 | 
  280 |     const screenshotPath = await takeScreenshot(page, '04-help-center');
  281 |     metrics.screenshots.push({ description: '04-help-center', path: screenshotPath });
  282 | 
  283 |     console.log(`✅ Help Center loaded with ${tabs.length} tabs`);
  284 |   });
  285 | 
  286 |   test('HELP CENTER: Click each tab and verify content', async () => {
  287 |     await page.goto(`${APP_URL}/help`);
  288 | 
  289 |     // Get all tabs
  290 |     const tabs = await page.locator('[role="tab"], .tab').all();
```