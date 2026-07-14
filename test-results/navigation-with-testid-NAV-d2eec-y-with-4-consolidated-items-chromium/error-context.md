# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-with-testid.test.ts >> NAVIGATION TEST SUITE v0.35.0 (Phase 37a) >> should show Services category with 4 consolidated items
- Location: tests\e2e\navigation-with-testid.test.ts:69:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - heading "Audit-Safe Extractor" [level=6] [ref=e6]
      - button "toggle dark mode" [ref=e7] [cursor=pointer]:
        - img [ref=e8]
  - generic [ref=e10]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Audit-Safe" [level=6] [ref=e15]
        - text: Document Extraction
      - list [ref=e16]:
        - generic [ref=e17]:
          - button "Dashboard" [ref=e18] [cursor=pointer]:
            - img [ref=e20]
            - heading "Dashboard" [level=6] [ref=e23]
            - img [ref=e25]
          - list [ref=e30]:
            - link "Home Dashboard overview" [ref=e31] [cursor=pointer]:
              - /url: /
              - button "Home Dashboard overview" [ref=e32]:
                - generic [ref=e33]:
                  - generic [ref=e36]: Home
                  - paragraph [ref=e37]: Dashboard overview
        - generic [ref=e38]:
          - button "Schemas" [ref=e39] [cursor=pointer]:
            - img [ref=e41]
            - heading "Schemas" [level=6] [ref=e44]
            - img [ref=e46]
          - list [ref=e51]:
            - link "Schemas View and manage schemas" [ref=e52] [cursor=pointer]:
              - /url: /schemas
              - button "Schemas View and manage schemas" [ref=e53]:
                - generic [ref=e54]:
                  - generic [ref=e57]: Schemas
                  - paragraph [ref=e58]: View and manage schemas
            - link "Create Schema Create new schema" [ref=e59] [cursor=pointer]:
              - /url: /schemas/create
              - button "Create Schema Create new schema" [ref=e60]:
                - generic [ref=e61]:
                  - generic [ref=e64]: Create Schema
                  - paragraph [ref=e65]: Create new schema
        - generic [ref=e66]:
          - button "Jobs" [ref=e67] [cursor=pointer]:
            - img [ref=e69]
            - heading "Jobs" [level=6] [ref=e72]
            - img [ref=e74]
          - list [ref=e79]:
            - link "Jobs View job history" [ref=e80] [cursor=pointer]:
              - /url: /jobs
              - button "Jobs View job history" [ref=e81]:
                - generic [ref=e82]:
                  - generic [ref=e85]: Jobs
                  - paragraph [ref=e86]: View job history
        - button "Rules" [ref=e88] [cursor=pointer]:
          - img [ref=e90]
          - heading "Rules" [level=6] [ref=e93]
          - img [ref=e95]
        - generic [ref=e97]:
          - button "Logs" [ref=e98] [cursor=pointer]:
            - img [ref=e100]
            - heading "Logs" [level=6] [ref=e103]
            - img [ref=e105]
          - list [ref=e110]:
            - link "Logs System activity logs" [ref=e111] [cursor=pointer]:
              - /url: /logs
              - button "Logs System activity logs" [ref=e112]:
                - generic [ref=e113]:
                  - generic [ref=e116]: Logs
                  - paragraph [ref=e117]: System activity logs
        - button "Services" [active] [ref=e119] [cursor=pointer]:
          - img [ref=e121]
          - heading "Services" [level=6] [ref=e124]
          - img [ref=e126]
        - generic [ref=e128]:
          - button "Help" [ref=e129] [cursor=pointer]:
            - img [ref=e131]
            - heading "Help" [level=6] [ref=e134]
            - img [ref=e136]
          - list [ref=e141]:
            - link "Help Center Help documentation and guides" [ref=e142] [cursor=pointer]:
              - /url: /help
              - button "Help Center Help documentation and guides" [ref=e143]:
                - generic [ref=e144]:
                  - generic [ref=e147]: Help Center
                  - paragraph [ref=e148]: Help documentation and guides
      - generic [ref=e149]: v0.35.0
    - main [ref=e150]:
      - generic [ref=e153]:
        - generic [ref=e154]:
          - heading "Dashboard" [level=4] [ref=e155]
          - button "Refresh" [ref=e156] [cursor=pointer]: Refresh
        - generic [ref=e157]:
          - generic [ref=e160]:
            - generic [ref=e161]:
              - img [ref=e162]
              - paragraph [ref=e164]: Config Status
            - heading "Active" [level=5] [ref=e165]
            - text: 14.7.2026, 10:44:25
          - generic [ref=e168]:
            - generic [ref=e169]:
              - img [ref=e170]
              - paragraph [ref=e172]: Backup Status
            - heading "1" [level=5] [ref=e173]
            - text: "Latest: 10.7.2026, 19:19:24"
          - generic [ref=e176]:
            - generic [ref=e177]:
              - img [ref=e178]
              - paragraph [ref=e180]: API Status
            - generic [ref=e181]:
              - img [ref=e182]
              - generic [ref=e185]: Healthy
            - text: API is operational
          - generic [ref=e188]:
            - generic [ref=e189]:
              - img [ref=e190]
              - paragraph [ref=e192]: Database Status
            - generic [ref=e193]:
              - img [ref=e194]
              - generic [ref=e197]: Healthy
            - text: Database connected - data will persist ✅
          - generic [ref=e200]:
            - generic [ref=e201]:
              - img [ref=e202]
              - paragraph [ref=e204]: Extraction Rules
            - heading "3" [level=5] [ref=e205]
            - text: Active rules
          - generic [ref=e208]:
            - generic [ref=e209]:
              - img [ref=e210]
              - paragraph [ref=e212]: Configurations
            - heading "1" [level=5] [ref=e213]
            - text: Active config version
          - generic [ref=e216]:
            - generic [ref=e217]:
              - img [ref=e218]
              - paragraph [ref=e220]: Schemas
            - heading "4" [level=5] [ref=e221]
            - text: Active schemas
          - generic [ref=e224]:
            - generic [ref=e225]:
              - img [ref=e226]
              - paragraph [ref=e228]: Documents
            - heading "0" [level=5] [ref=e229]
            - text: Extraction runs
          - generic [ref=e232]:
            - generic [ref=e233]:
              - img [ref=e234]
              - paragraph [ref=e236]: Manuals
            - heading "7" [level=5] [ref=e237]
            - text: Documentation sections
          - generic [ref=e240]:
            - generic [ref=e241]:
              - heading "System Information & Build Tracking" [level=6] [ref=e242]
              - button "Restart Backend" [ref=e243] [cursor=pointer]:
                - img [ref=e245]
                - text: Restart Backend
            - generic [ref=e247]:
              - generic [ref=e248]:
                - generic [ref=e249]: 🔨 BUILD INFORMATION
                - generic [ref=e250]:
                  - generic [ref=e251]:
                    - generic [ref=e252]: "Version:"
                    - generic [ref=e254]: 0.34.0
                  - generic [ref=e255]:
                    - generic [ref=e256]: "Build #:"
                    - generic [ref=e257]: 20260714084425-cfa203b
                  - generic [ref=e258]:
                    - generic [ref=e259]: "Build Time:"
                    - generic [ref=e260]: 14.7.2026, 10:44:25
                  - generic [ref=e261]:
                    - generic [ref=e262]: "Frontend Version:"
                    - generic [ref=e264]: 0.34.0
                  - generic [ref=e265]:
                    - generic [ref=e266]: "Backend Version:"
                    - generic [ref=e268]: 0.34.0
              - generic [ref=e269]:
                - generic [ref=e270]: 🌳 GIT STATUS
                - generic [ref=e271]:
                  - generic [ref=e272]:
                    - generic [ref=e273]: "Branch:"
                    - generic [ref=e275]: master
                  - generic [ref=e276]:
                    - generic [ref=e277]: "Commit:"
                    - generic [ref=e278]: cfa203b
                  - generic [ref=e279]:
                    - generic [ref=e280]: "Status:"
                    - generic [ref=e282]: ✅ Clean
                  - generic [ref=e283]:
                    - generic [ref=e284]: "Last Commit:"
                    - generic [ref=e285]: 14.7.2026, 10:44:25
              - generic [ref=e286]:
                - generic [ref=e287]: 🔄 GITHUB SYNC
                - generic [ref=e288]:
                  - generic [ref=e289]:
                    - generic [ref=e290]: "Status:"
                    - generic [ref=e292]: ⚠️ Not Synced
                  - generic [ref=e293]:
                    - generic [ref=e294]: "Remote Status:"
                    - generic [ref=e296]: unknown
                  - generic [ref=e297]:
                    - generic [ref=e298]: "Last Push:"
                    - generic [ref=e299]: unknown
              - generic [ref=e300]:
                - generic [ref=e301]: ⚙️ RUNTIME
                - generic [ref=e302]:
                  - generic [ref=e303]:
                    - generic [ref=e304]: "Frontend:"
                    - generic [ref=e305]: Port 5173
                  - generic [ref=e306]:
                    - generic [ref=e307]: "Backend:"
                    - generic [ref=e308]: Port 3000
                  - generic [ref=e309]:
                    - generic [ref=e310]: "Timestamp:"
                    - generic [ref=e311]: 14.7.2026, 10:44:27
          - generic [ref=e315]:
            - img [ref=e316]
            - generic [ref=e318]:
              - heading "ℹ️ GitHub Sync Pending" [level=6] [ref=e319]
              - text: Unable to determine sync status
```

# Test source

```ts
  1   | /**
  2   |  * IMPROVED NAVIGATION TEST SUITE v0.35.0
  3   |  * 
  4   |  * Phase 37a: Refactored with data-testid selectors for reliable testing
  5   |  * Tests the consolidated Services navigation category (Health, API, Backup, Settings)
  6   |  * 
  7   |  * Key Improvements:
  8   |  * - Uses data-testid attributes for deterministic element targeting
  9   |  * - No flaky text-based selectors
  10  |  * - Validates all 7 navigation categories
  11  |  * - Tests Services consolidation feature
  12  |  */
  13  | 
  14  | import { test, expect, Page } from '@playwright/test';
  15  | 
  16  | const BASE_URL = 'http://localhost:5173';
  17  | 
  18  | test.describe('NAVIGATION TEST SUITE v0.35.0 (Phase 37a)', () => {
  19  |   let page: Page;
  20  | 
  21  |   test.beforeAll(async ({ browser }) => {
  22  |     const context = await browser.newContext();
  23  |     page = await context.newPage();
  24  |   });
  25  | 
  26  |   test.beforeEach(async () => {
  27  |     await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  28  |     await page.waitForTimeout(500);
  29  |   });
  30  | 
  31  |   test.afterAll(async () => {
  32  |     await page.context().close();
  33  |   });
  34  | 
  35  |   // ============================================================================
  36  |   // TEST 1: APP LOADS WITH NAVIGATION DRAWER
  37  |   // ============================================================================
  38  |   test('should load application with navigation drawer', async () => {
  39  |     const drawer = page.locator('[data-testid="navigation-drawer-content"]');
  40  |     
  41  |     expect(await drawer.isVisible()).toBe(true);
  42  |     expect(await page.locator('[data-testid="navigation-header"]').isVisible()).toBe(true);
  43  |     expect(await page.locator('[data-testid="navigation-list"]').isVisible()).toBe(true);
  44  |   });
  45  | 
  46  |   // ============================================================================
  47  |   // TEST 2: ALL 7 NAVIGATION CATEGORIES PRESENT
  48  |   // ============================================================================
  49  |   test('should display all 7 navigation categories', async () => {
  50  |     const expectedCategories = [
  51  |       'dashboard',
  52  |       'schemas',
  53  |       'jobs',
  54  |       'rules',
  55  |       'logs',
  56  |       'services',
  57  |       'help'
  58  |     ];
  59  | 
  60  |     for (const categoryId of expectedCategories) {
  61  |       const categoryButton = page.locator(`[data-testid="nav-category-${categoryId}"]`);
  62  |       expect(await categoryButton.isVisible()).toBe(true, `Category ${categoryId} should be visible`);
  63  |     }
  64  |   });
  65  | 
  66  |   // ============================================================================
  67  |   // TEST 3: SERVICES CATEGORY HAS 4 SUB-ITEMS
  68  |   // ============================================================================
  69  |   test('should show Services category with 4 consolidated items', async () => {
  70  |     const servicesCategory = page.locator('[data-testid="nav-category-services"]');
  71  |     expect(await servicesCategory.isVisible()).toBe(true);
  72  | 
  73  |     // Expected service items: health, api, backup, settings
  74  |     const expectedItems = ['health-check', 'api-docs', 'backup-list', 'settings-config'];
  75  |     
  76  |     for (const itemId of expectedItems) {
  77  |       const item = page.locator(`[data-testid="nav-item-${itemId}"]`);
  78  |       // Expand services category first to see items
  79  |       await servicesCategory.click();
  80  |       await page.waitForTimeout(300);
  81  |       
  82  |       // Check if item exists (within Services)
  83  |       const itemExists = await item.count() > 0;
> 84  |       expect(itemExists).toBe(true, `Service item ${itemId} should exist`);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  85  |     }
  86  |   });
  87  | 
  88  |   // ============================================================================
  89  |   // TEST 4: DASHBOARD CATEGORY NAVIGATION
  90  |   // ============================================================================
  91  |   test('should navigate to Dashboard via category', async () => {
  92  |     const dashboardCategory = page.locator('[data-testid="nav-category-dashboard"]');
  93  |     expect(await dashboardCategory.isVisible()).toBe(true);
  94  | 
  95  |     const homeItem = page.locator('[data-testid="nav-item-home"]');
  96  |     await homeItem.click();
  97  |     
  98  |     await page.waitForTimeout(500);
  99  |     expect(page.url()).toContain('/');
  100 |   });
  101 | 
  102 |   // ============================================================================
  103 |   // TEST 5: SCHEMAS CATEGORY VISIBLE AND CLICKABLE
  104 |   // ============================================================================
  105 |   test('should access Schemas category items', async () => {
  106 |     const schemasCategory = page.locator('[data-testid="nav-category-schemas"]');
  107 |     expect(await schemasCategory.isVisible()).toBe(true);
  108 | 
  109 |     // Click category to ensure it's expanded
  110 |     await schemasCategory.click();
  111 |     await page.waitForTimeout(300);
  112 | 
  113 |     const schemasItem = page.locator('[data-testid="nav-item-schemas"]');
  114 |     expect(await schemasItem.count()).toBeGreaterThanOrEqual(0);
  115 |   });
  116 | 
  117 |   // ============================================================================
  118 |   // TEST 6: HEALTH CHECK IN SERVICES ACCESSIBLE
  119 |   // ============================================================================
  120 |   test('should navigate to Health Check via Services', async () => {
  121 |     const servicesCategory = page.locator('[data-testid="nav-category-services"]');
  122 |     
  123 |     // Expand Services
  124 |     await servicesCategory.click();
  125 |     await page.waitForTimeout(300);
  126 | 
  127 |     const healthItem = page.locator('[data-testid="nav-item-health-check"]');
  128 |     await healthItem.click();
  129 |     
  130 |     await page.waitForTimeout(500);
  131 |     expect(page.url()).toContain('/health');
  132 |   });
  133 | 
  134 |   // ============================================================================
  135 |   // TEST 7: API DOCS IN SERVICES ACCESSIBLE
  136 |   // ============================================================================
  137 |   test('should navigate to API Docs via Services', async () => {
  138 |     const servicesCategory = page.locator('[data-testid="nav-category-services"]');
  139 |     
  140 |     await servicesCategory.click();
  141 |     await page.waitForTimeout(300);
  142 | 
  143 |     const apiItem = page.locator('[data-testid="nav-item-api-docs"]');
  144 |     await apiItem.click();
  145 |     
  146 |     await page.waitForTimeout(500);
  147 |     expect(page.url()).toContain('/api');
  148 |   });
  149 | 
  150 |   // ============================================================================
  151 |   // TEST 8: BACKUP MANAGER IN SERVICES ACCESSIBLE
  152 |   // ============================================================================
  153 |   test('should navigate to Backup via Services', async () => {
  154 |     const servicesCategory = page.locator('[data-testid="nav-category-services"]');
  155 |     
  156 |     await servicesCategory.click();
  157 |     await page.waitForTimeout(300);
  158 | 
  159 |     const backupItem = page.locator('[data-testid="nav-item-backup-list"]');
  160 |     await backupItem.click();
  161 |     
  162 |     await page.waitForTimeout(500);
  163 |     expect(page.url()).toContain('/backup');
  164 |   });
  165 | 
  166 |   // ============================================================================
  167 |   // TEST 9: SETTINGS IN SERVICES ACCESSIBLE
  168 |   // ============================================================================
  169 |   test('should navigate to Settings via Services', async () => {
  170 |     const servicesCategory = page.locator('[data-testid="nav-category-services"]');
  171 |     
  172 |     await servicesCategory.click();
  173 |     await page.waitForTimeout(300);
  174 | 
  175 |     const settingsItem = page.locator('[data-testid="nav-item-settings-config"]');
  176 |     await settingsItem.click();
  177 |     
  178 |     await page.waitForTimeout(500);
  179 |     expect(page.url()).toContain('/settings');
  180 |   });
  181 | 
  182 |   // ============================================================================
  183 |   // TEST 10: HELP CATEGORY VISIBLE
  184 |   // ============================================================================
```