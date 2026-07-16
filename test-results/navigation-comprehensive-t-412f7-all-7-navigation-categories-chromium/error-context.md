# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-comprehensive-test.test.ts >> NAVIGATION TEST SUITE v0.34.0 >> should display all 7 navigation categories
- Location: tests\e2e\navigation-comprehensive-test.test.ts:105:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
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
        - generic [ref=e118]:
          - button "Services" [ref=e119] [cursor=pointer]:
            - img [ref=e121]
            - heading "Services" [level=6] [ref=e124]
            - img [ref=e126]
          - list [ref=e131]:
            - link "Health System health status" [ref=e132] [cursor=pointer]:
              - /url: /health
              - button "Health System health status" [ref=e133]:
                - generic [ref=e134]:
                  - generic [ref=e137]: Health
                  - paragraph [ref=e138]: System health status
            - link "API Docs API documentation and discovery" [ref=e139] [cursor=pointer]:
              - /url: /api/docs
              - button "API Docs API documentation and discovery" [ref=e140]:
                - generic [ref=e141]:
                  - generic [ref=e144]: API Docs
                  - paragraph [ref=e145]: API documentation and discovery
            - link "Backups Backup and restore management" [ref=e146] [cursor=pointer]:
              - /url: /backups
              - button "Backups Backup and restore management" [ref=e147]:
                - generic [ref=e148]:
                  - generic [ref=e151]: Backups
                  - paragraph [ref=e152]: Backup and restore management
            - link "Settings System configuration settings" [ref=e153] [cursor=pointer]:
              - /url: /settings
              - button "Settings System configuration settings" [ref=e154]:
                - generic [ref=e155]:
                  - generic [ref=e158]: Settings
                  - paragraph [ref=e159]: System configuration settings
        - generic [ref=e160]:
          - button "Help" [ref=e161] [cursor=pointer]:
            - img [ref=e163]
            - heading "Help" [level=6] [ref=e166]
            - img [ref=e168]
          - list [ref=e173]:
            - link "Help Center Help documentation and guides" [ref=e174] [cursor=pointer]:
              - /url: /help
              - button "Help Center Help documentation and guides" [ref=e175]:
                - generic [ref=e176]:
                  - generic [ref=e179]: Help Center
                  - paragraph [ref=e180]: Help documentation and guides
      - generic [ref=e181]: v0.35.0
    - main [ref=e182]:
      - generic [ref=e185]:
        - generic [ref=e186]:
          - heading "Dashboard" [level=4] [ref=e187]
          - button "Refresh" [ref=e188] [cursor=pointer]: Refresh
        - generic [ref=e189]:
          - generic [ref=e192]:
            - generic [ref=e193]:
              - img [ref=e194]
              - paragraph [ref=e196]: Config Status
            - heading "Active" [level=5] [ref=e197]
            - text: 16.7.2026, 11:39:39
          - generic [ref=e200]:
            - generic [ref=e201]:
              - img [ref=e202]
              - paragraph [ref=e204]: Backup Status
            - heading "1" [level=5] [ref=e205]
            - text: "Latest: 10.7.2026, 19:19:24"
          - generic [ref=e208]:
            - generic [ref=e209]:
              - img [ref=e210]
              - paragraph [ref=e212]: API Status
            - generic [ref=e213]:
              - img [ref=e214]
              - generic [ref=e217]: Healthy
            - text: API is operational
          - generic [ref=e220]:
            - generic [ref=e221]:
              - img [ref=e222]
              - paragraph [ref=e224]: Database Status
            - generic [ref=e225]:
              - img [ref=e226]
              - generic [ref=e229]: Healthy
            - text: Database connected - data will persist ✅
          - generic [ref=e232]:
            - generic [ref=e233]:
              - img [ref=e234]
              - paragraph [ref=e236]: Extraction Rules
            - heading "3" [level=5] [ref=e237]
            - text: Active rules
          - generic [ref=e240]:
            - generic [ref=e241]:
              - img [ref=e242]
              - paragraph [ref=e244]: Configurations
            - heading "1" [level=5] [ref=e245]
            - text: Active config version
          - generic [ref=e248]:
            - generic [ref=e249]:
              - img [ref=e250]
              - paragraph [ref=e252]: Schemas
            - heading "2" [level=5] [ref=e253]
            - text: Active schemas
          - generic [ref=e256]:
            - generic [ref=e257]:
              - img [ref=e258]
              - paragraph [ref=e260]: Documents
            - heading "0" [level=5] [ref=e261]
            - text: Extraction runs
          - generic [ref=e264]:
            - generic [ref=e265]:
              - img [ref=e266]
              - paragraph [ref=e268]: Manuals
            - heading "9" [level=5] [ref=e269]
            - text: Documentation sections
          - generic [ref=e272]:
            - generic [ref=e273]:
              - heading "System Information & Build Tracking" [level=6] [ref=e274]
              - button "Restart Backend" [ref=e275] [cursor=pointer]:
                - img [ref=e277]
                - text: Restart Backend
            - generic [ref=e279]:
              - generic [ref=e280]:
                - generic [ref=e281]: 🔨 BUILD INFORMATION
                - generic [ref=e282]:
                  - generic [ref=e283]:
                    - generic [ref=e284]: "Version:"
                    - generic [ref=e286]: 0.35.0
                  - generic [ref=e287]:
                    - generic [ref=e288]: "Build #:"
                    - generic [ref=e289]: 20260716093939-cfa203b
                  - generic [ref=e290]:
                    - generic [ref=e291]: "Build Time:"
                    - generic [ref=e292]: 16.7.2026, 11:39:39
                  - generic [ref=e293]:
                    - generic [ref=e294]: "Frontend Version:"
                    - generic [ref=e296]: 0.35.0
                  - generic [ref=e297]:
                    - generic [ref=e298]: "Backend Version:"
                    - generic [ref=e300]: 0.35.0
              - generic [ref=e301]:
                - generic [ref=e302]: 🌳 GIT STATUS
                - generic [ref=e303]:
                  - generic [ref=e304]:
                    - generic [ref=e305]: "Branch:"
                    - generic [ref=e307]: master
                  - generic [ref=e308]:
                    - generic [ref=e309]: "Commit:"
                    - generic [ref=e310]: cfa203b
                  - generic [ref=e311]:
                    - generic [ref=e312]: "Status:"
                    - generic [ref=e314]: ✅ Clean
                  - generic [ref=e315]:
                    - generic [ref=e316]: "Last Commit:"
                    - generic [ref=e317]: 16.7.2026, 11:39:39
              - generic [ref=e318]:
                - generic [ref=e319]: 🔄 GITHUB SYNC
                - generic [ref=e320]:
                  - generic [ref=e321]:
                    - generic [ref=e322]: "Status:"
                    - generic [ref=e324]: ⚠️ Not Synced
                  - generic [ref=e325]:
                    - generic [ref=e326]: "Remote Status:"
                    - generic [ref=e328]: unknown
                  - generic [ref=e329]:
                    - generic [ref=e330]: "Last Push:"
                    - generic [ref=e331]: unknown
              - generic [ref=e332]:
                - generic [ref=e333]: ⚙️ RUNTIME
                - generic [ref=e334]:
                  - generic [ref=e335]:
                    - generic [ref=e336]: "Frontend:"
                    - generic [ref=e337]: Port 5173
                  - generic [ref=e338]:
                    - generic [ref=e339]: "Backend:"
                    - generic [ref=e340]: Port 3000
                  - generic [ref=e341]:
                    - generic [ref=e342]: "Timestamp:"
                    - generic [ref=e343]: 16.7.2026, 11:39:39
          - generic [ref=e347]:
            - img [ref=e348]
            - generic [ref=e350]:
              - heading "ℹ️ GitHub Sync Pending" [level=6] [ref=e351]
              - text: Unable to determine sync status
```

# Test source

```ts
  24  |     paths: ['/'],
  25  |     description: 'System overview'
  26  |   },
  27  |   'Schemas': { 
  28  |     items: ['Schemas', 'Create Schema'],
  29  |     paths: ['/schemas', '/schemas/create'],
  30  |     description: 'Schema management'
  31  |   },
  32  |   'Jobs': { 
  33  |     items: ['Jobs'],
  34  |     paths: ['/jobs'],
  35  |     description: 'Job monitoring'
  36  |   },
  37  |   'Rules': { 
  38  |     items: ['Rules'],
  39  |     paths: ['/rules'],
  40  |     description: 'Extraction rules'
  41  |   },
  42  |   'Logs': { 
  43  |     items: ['Logs'],
  44  |     paths: ['/logs'],
  45  |     description: 'Activity logs'
  46  |   },
  47  |   'Services': { 
  48  |     items: ['Health', 'API Docs', 'Backups', 'Settings'],
  49  |     paths: ['/health', '/api/docs', '/backup', '/settings'],
  50  |     description: 'System services (NEW v0.34.0)',
  51  |     isNew: true
  52  |   },
  53  |   'Help': { 
  54  |     items: ['Help Center'],
  55  |     paths: ['/help'],
  56  |     description: 'Documentation'
  57  |   }
  58  | };
  59  | 
  60  | test.describe('NAVIGATION TEST SUITE v0.34.0', () => {
  61  |   let page: Page;
  62  |   let testResults = {
  63  |     total: 0,
  64  |     passed: 0,
  65  |     failed: 0,
  66  |     skipped: 0,
  67  |     details: [] as string[]
  68  |   };
  69  | 
  70  |   test.beforeEach(async ({ browser }) => {
  71  |     const context = await browser.newContext();
  72  |     page = await context.newPage();
  73  |     
  74  |     // Navigate to app
  75  |     await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  76  |     await page.waitForTimeout(1500);
  77  |   });
  78  | 
  79  |   test.afterEach(async () => {
  80  |     await page.context().close();
  81  |   });
  82  | 
  83  |   // ============================================================================
  84  |   // TEST 1: APP LOADS & NAVIGATION VISIBLE
  85  |   // ============================================================================
  86  |   test('should load application and display navigation', async () => {
  87  |     testResults.total++;
  88  |     
  89  |     const title = await page.title();
  90  |     const hasNavigation = await page.locator('[role="navigation"], nav').first().isVisible().catch(() => false);
  91  |     
  92  |     if (title.includes('Audit') && hasNavigation) {
  93  |       testResults.passed++;
  94  |       testResults.details.push('✅ App loaded with visible navigation');
  95  |     } else {
  96  |       testResults.failed++;
  97  |       testResults.details.push('❌ App or navigation not found');
  98  |       expect(false).toBe(true);
  99  |     }
  100 |   });
  101 | 
  102 |   // ============================================================================
  103 |   // TEST 2: NAVIGATION CATEGORIES PRESENT (7 total)
  104 |   // ============================================================================
  105 |   test('should display all 7 navigation categories', async () => {
  106 |     testResults.total++;
  107 |     
  108 |     const categories = Object.keys(NAVIGATION_STRUCTURE);
  109 |     const navText = await page.locator('body').innerText();
  110 |     
  111 |     let missingCategories: string[] = [];
  112 |     categories.forEach(category => {
  113 |       if (!navText.includes(category)) {
  114 |         missingCategories.push(category);
  115 |       }
  116 |     });
  117 | 
  118 |     if (missingCategories.length === 0) {
  119 |       testResults.passed++;
  120 |       testResults.details.push(`✅ All ${categories.length} categories present: ${categories.join(', ')}`);
  121 |     } else {
  122 |       testResults.failed++;
  123 |       testResults.details.push(`❌ Missing: ${missingCategories.join(', ')}`);
> 124 |       expect(missingCategories.length).toBe(0);
      |                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  125 |     }
  126 |   });
  127 | 
  128 |   // ============================================================================
  129 |   // TEST 3: SERVICES CONSOLIDATION - Health, API, Backup, Settings together
  130 |   // ============================================================================
  131 |   test('should show Services category with 4 sub-items', async () => {
  132 |     testResults.total++;
  133 |     
  134 |     const services = NAVIGATION_STRUCTURE['Services'];
  135 |     const bodyText = await page.locator('body').innerText();
  136 |     
  137 |     // Check if all service items are mentioned
  138 |     const hasServices = services.items.every(item => bodyText.includes(item));
  139 |     
  140 |     if (hasServices) {
  141 |       testResults.passed++;
  142 |       testResults.details.push(`✅ Services category with ${services.items.length} items: ${services.items.join(', ')}`);
  143 |     } else {
  144 |       testResults.failed++;
  145 |       testResults.details.push(`❌ Services items not all found`);
  146 |       expect(hasServices).toBe(true);
  147 |     }
  148 |   });
  149 | 
  150 |   // ============================================================================
  151 |   // TEST 4: HELP CATEGORY VISIBLE
  152 |   // ============================================================================
  153 |   test('should display Help category', async () => {
  154 |     testResults.total++;
  155 |     
  156 |     const bodyText = await page.locator('body').innerText();
  157 |     const hasHelp = bodyText.includes('Help');
  158 |     
  159 |     if (hasHelp) {
  160 |       testResults.passed++;
  161 |       testResults.details.push('✅ Help category visible');
  162 |     } else {
  163 |       testResults.failed++;
  164 |       testResults.details.push('❌ Help category not found');
  165 |       expect(hasHelp).toBe(true);
  166 |     }
  167 |   });
  168 | 
  169 |   // ============================================================================
  170 |   // TEST 5: NAVIGATION TO DASHBOARD
  171 |   // ============================================================================
  172 |   test('should navigate to Dashboard/Home', async () => {
  173 |     testResults.total++;
  174 |     
  175 |     try {
  176 |       const homeLink = page.locator('text=/Dashboard|Home/i').first();
  177 |       await homeLink.click();
  178 |       await page.waitForNavigation({ waitUntil: 'networkidle' });
  179 |       
  180 |       if (page.url().includes('/')) {
  181 |         testResults.passed++;
  182 |         testResults.details.push('✅ Dashboard navigation works');
  183 |       } else {
  184 |         throw new Error('URL not updated');
  185 |       }
  186 |     } catch (e) {
  187 |       testResults.skipped++;
  188 |       testResults.details.push('⊘ Dashboard navigation skipped (element not found)');
  189 |     }
  190 |   });
  191 | 
  192 |   // ============================================================================
  193 |   // TEST 6: NAVIGATION TO SCHEMAS
  194 |   // ============================================================================
  195 |   test('should navigate to Schemas section', async () => {
  196 |     testResults.total++;
  197 |     
  198 |     try {
  199 |       const schemasLink = page.locator('text=/^Schemas$/').first();
  200 |       await schemasLink.click();
  201 |       await page.waitForNavigation({ waitUntil: 'networkidle' });
  202 |       
  203 |       if (page.url().includes('/schemas')) {
  204 |         testResults.passed++;
  205 |         testResults.details.push('✅ Schemas navigation works');
  206 |       } else {
  207 |         throw new Error('URL not updated');
  208 |       }
  209 |     } catch (e) {
  210 |       testResults.skipped++;
  211 |       testResults.details.push('⊘ Schemas navigation skipped');
  212 |     }
  213 |   });
  214 | 
  215 |   // ============================================================================
  216 |   // TEST 7: NAVIGATION TO SERVICES (NEW in v0.34.0)
  217 |   // ============================================================================
  218 |   test('should navigate to Services section (NEW v0.34.0)', async () => {
  219 |     testResults.total++;
  220 |     
  221 |     try {
  222 |       const healthLink = page.locator('text=/Health|health/i').first();
  223 |       await healthLink.click();
  224 |       await page.waitForNavigation({ waitUntil: 'networkidle' });
```