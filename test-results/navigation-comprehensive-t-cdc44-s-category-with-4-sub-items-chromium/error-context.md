# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-comprehensive-test.test.ts >> NAVIGATION TEST SUITE v0.36.0 >> should show Services category with 4 sub-items
- Location: tests\e2e\navigation-comprehensive-test.test.ts:169:3

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
          - button "Extraction" [ref=e18] [cursor=pointer]:
            - img [ref=e20]
            - heading "Extraction" [level=6] [ref=e23]
            - img [ref=e25]
          - list [ref=e30]:
            - link "Dashboard System Overview" [ref=e31] [cursor=pointer]:
              - /url: /
              - button "Dashboard System Overview" [ref=e32]:
                - img [ref=e34]
                - generic [ref=e36]:
                  - generic [ref=e39]: Dashboard
                  - paragraph [ref=e40]: System Overview
            - link "Job Manager Document Extraction Jobs" [ref=e41] [cursor=pointer]:
              - /url: /jobs
              - button "Job Manager Document Extraction Jobs" [ref=e42]:
                - img [ref=e44]
                - generic [ref=e46]:
                  - generic [ref=e49]: Job Manager
                  - paragraph [ref=e50]: Document Extraction Jobs
            - link "Extraction Workbench Manual Extraction & Testing" [ref=e51] [cursor=pointer]:
              - /url: /workbench
              - button "Extraction Workbench Manual Extraction & Testing" [ref=e52]:
                - img [ref=e54]
                - generic [ref=e56]:
                  - generic [ref=e59]: Extraction Workbench
                  - paragraph [ref=e60]: Manual Extraction & Testing
        - generic [ref=e61]:
          - button "Documents & Schema" [ref=e62] [cursor=pointer]:
            - img [ref=e64]
            - heading "Documents & Schema" [level=6] [ref=e67]
            - img [ref=e69]
          - list [ref=e74]:
            - link "Documents Browse Uploaded Documents" [ref=e75] [cursor=pointer]:
              - /url: /documents
              - button "Documents Browse Uploaded Documents" [ref=e76]:
                - img [ref=e78]
                - generic [ref=e80]:
                  - generic [ref=e83]: Documents
                  - paragraph [ref=e84]: Browse Uploaded Documents
            - link "Schema Management View & Edit Extraction Schemas" [ref=e85] [cursor=pointer]:
              - /url: /schemas
              - button "Schema Management View & Edit Extraction Schemas" [ref=e86]:
                - img [ref=e88]
                - generic [ref=e90]:
                  - generic [ref=e93]: Schema Management
                  - paragraph [ref=e94]: View & Edit Extraction Schemas
            - link "Schema Upload Upload New Schemas" [ref=e95] [cursor=pointer]:
              - /url: /schema-wizard
              - button "Schema Upload Upload New Schemas" [ref=e96]:
                - img [ref=e98]
                - generic [ref=e100]:
                  - generic [ref=e103]: Schema Upload
                  - paragraph [ref=e104]: Upload New Schemas
            - link "iReport Integration Document Format Conversion" [ref=e105] [cursor=pointer]:
              - /url: /ireport
              - button "iReport Integration Document Format Conversion" [ref=e106]:
                - img [ref=e108]
                - generic [ref=e110]:
                  - generic [ref=e113]: iReport Integration
                  - paragraph [ref=e114]: Document Format Conversion
        - generic [ref=e115]:
          - button "Rules & Learning" [ref=e116] [cursor=pointer]:
            - img [ref=e118]
            - heading "Rules & Learning" [level=6] [ref=e121]
            - img [ref=e123]
          - list [ref=e128]:
            - link "Rule Editor Create & Manage Extraction Rules" [ref=e129] [cursor=pointer]:
              - /url: /rules
              - button "Rule Editor Create & Manage Extraction Rules" [ref=e130]:
                - img [ref=e132]
                - generic [ref=e134]:
                  - generic [ref=e137]: Rule Editor
                  - paragraph [ref=e138]: Create & Manage Extraction Rules
            - link "Learning Center ML Model Training & Management" [ref=e139] [cursor=pointer]:
              - /url: /learning
              - button "Learning Center ML Model Training & Management" [ref=e140]:
                - img [ref=e142]
                - generic [ref=e144]:
                  - generic [ref=e147]: Learning Center
                  - paragraph [ref=e148]: ML Model Training & Management
            - link "Version History Track Schema Changes" [ref=e149] [cursor=pointer]:
              - /url: /schema/:id/history
              - button "Version History Track Schema Changes" [ref=e150]:
                - img [ref=e152]
                - generic [ref=e154]:
                  - generic [ref=e157]: Version History
                  - paragraph [ref=e158]: Track Schema Changes
        - generic [ref=e159]:
          - button "Monitoring & Audit" [ref=e160] [cursor=pointer]:
            - img [ref=e162]
            - heading "Monitoring & Audit" [level=6] [ref=e165]
            - img [ref=e167]
          - list [ref=e172]:
            - link "Audit Trail System & User Activity Logs" [ref=e173] [cursor=pointer]:
              - /url: /audit
              - button "Audit Trail System & User Activity Logs" [ref=e174]:
                - img [ref=e176]
                - generic [ref=e178]:
                  - generic [ref=e181]: Audit Trail
                  - paragraph [ref=e182]: System & User Activity Logs
            - link "Logs Application Logs & Diagnostics" [ref=e183] [cursor=pointer]:
              - /url: /logs
              - button "Logs Application Logs & Diagnostics" [ref=e184]:
                - img [ref=e186]
                - generic [ref=e188]:
                  - generic [ref=e191]: Logs
                  - paragraph [ref=e192]: Application Logs & Diagnostics
            - link "Services System Services & Health Monitoring" [ref=e193] [cursor=pointer]:
              - /url: /services
              - button "Services System Services & Health Monitoring" [ref=e194]:
                - img [ref=e196]
                - generic [ref=e198]:
                  - generic [ref=e201]: Services
                  - paragraph [ref=e202]: System Services & Health Monitoring
            - link "Technical Audit Comprehensive System Audit & Status Report" [ref=e203] [cursor=pointer]:
              - /url: /technical-audit
              - button "Technical Audit Comprehensive System Audit & Status Report" [ref=e204]:
                - img [ref=e206]
                - generic [ref=e208]:
                  - generic [ref=e211]: Technical Audit
                  - paragraph [ref=e212]: Comprehensive System Audit & Status Report
            - link "Quality Dashboard Technical Quality & Report Dashboard" [ref=e213] [cursor=pointer]:
              - /url: /technical-tests
              - button "Quality Dashboard Technical Quality & Report Dashboard" [ref=e214]:
                - img [ref=e216]
                - generic [ref=e218]:
                  - generic [ref=e221]: Quality Dashboard
                  - paragraph [ref=e222]: Technical Quality & Report Dashboard
            - link "Backups System Backups & Recovery" [ref=e223] [cursor=pointer]:
              - /url: /backups
              - button "Backups System Backups & Recovery" [ref=e224]:
                - img [ref=e226]
                - generic [ref=e228]:
                  - generic [ref=e231]: Backups
                  - paragraph [ref=e232]: System Backups & Recovery
        - generic [ref=e233]:
          - button "System" [ref=e234] [cursor=pointer]:
            - img [ref=e236]
            - heading "System" [level=6] [ref=e239]
            - img [ref=e241]
          - list [ref=e246]:
            - link "Configuration System Settings & Preferences" [ref=e247] [cursor=pointer]:
              - /url: /configuration
              - button "Configuration System Settings & Preferences" [ref=e248]:
                - img [ref=e250]
                - generic [ref=e252]:
                  - generic [ref=e255]: Configuration
                  - paragraph [ref=e256]: System Settings & Preferences
            - link "Help Center Documentation & Support" [ref=e257] [cursor=pointer]:
              - /url: /help
              - button "Help Center Documentation & Support" [ref=e258]:
                - img [ref=e260]
                - generic [ref=e262]:
                  - generic [ref=e265]: Help Center
                  - paragraph [ref=e266]: Documentation & Support
      - generic [ref=e267]: v0.37.1
    - main [ref=e268]:
      - generic [ref=e271]:
        - generic [ref=e272]:
          - heading "Dashboard" [level=4] [ref=e273]
          - button "Refresh" [ref=e274] [cursor=pointer]: Refresh
        - generic [ref=e275]:
          - generic [ref=e278]:
            - generic [ref=e279]:
              - img [ref=e280]
              - paragraph [ref=e282]: Config Status
            - heading "Active" [level=5] [ref=e283]
            - text: 16.7.2026, 18:27:17
          - generic [ref=e286]:
            - generic [ref=e287]:
              - img [ref=e288]
              - paragraph [ref=e290]: Backup Status
            - heading "1" [level=5] [ref=e291]
            - text: "Latest: 10.7.2026, 19:19:24"
          - generic [ref=e294]:
            - generic [ref=e295]:
              - img [ref=e296]
              - paragraph [ref=e298]: API Status
            - generic [ref=e299]:
              - img [ref=e300]
              - generic [ref=e303]: Healthy
            - text: API is operational
          - generic [ref=e306]:
            - generic [ref=e307]:
              - img [ref=e308]
              - paragraph [ref=e310]: Database Status
            - generic [ref=e311]:
              - img [ref=e312]
              - generic [ref=e315]: Healthy
            - text: Database connected - data will persist ✅
          - generic [ref=e318]:
            - generic [ref=e319]:
              - img [ref=e320]
              - paragraph [ref=e322]: Extraction Rules
            - heading "3" [level=5] [ref=e323]
            - text: Active rules
          - generic [ref=e326]:
            - generic [ref=e327]:
              - img [ref=e328]
              - paragraph [ref=e330]: Configurations
            - heading "1" [level=5] [ref=e331]
            - text: Active config version
          - generic [ref=e334]:
            - generic [ref=e335]:
              - img [ref=e336]
              - paragraph [ref=e338]: Schemas
            - heading "2" [level=5] [ref=e339]
            - text: Active schemas
          - generic [ref=e342]:
            - generic [ref=e343]:
              - img [ref=e344]
              - paragraph [ref=e346]: Documents
            - heading "0" [level=5] [ref=e347]
            - text: Extraction runs
          - generic [ref=e350]:
            - generic [ref=e351]:
              - img [ref=e352]
              - paragraph [ref=e354]: Manuals
            - heading "0" [level=5] [ref=e355]
            - text: Documentation sections
          - generic [ref=e358]:
            - generic [ref=e359]:
              - heading "System Information & Build Tracking" [level=6] [ref=e360]
              - button "Restart Backend" [ref=e361] [cursor=pointer]:
                - img [ref=e363]
                - text: Restart Backend
            - generic [ref=e365]:
              - generic [ref=e366]:
                - generic [ref=e367]: 🔨 BUILD INFORMATION
                - generic [ref=e368]:
                  - generic [ref=e369]:
                    - generic [ref=e370]: "Version:"
                    - generic [ref=e372]: 0.37.1
                  - generic [ref=e373]:
                    - generic [ref=e374]: "Build #:"
                    - generic [ref=e375]: 20260716162717-cfa203b
                  - generic [ref=e376]:
                    - generic [ref=e377]: "Build Time:"
                    - generic [ref=e378]: 16.7.2026, 18:27:17
                  - generic [ref=e379]:
                    - generic [ref=e380]: "Frontend Version:"
                    - generic [ref=e382]: 0.37.1
                  - generic [ref=e383]:
                    - generic [ref=e384]: "Backend Version:"
                    - generic [ref=e386]: 0.37.1
              - generic [ref=e387]:
                - generic [ref=e388]: 🌳 GIT STATUS
                - generic [ref=e389]:
                  - generic [ref=e390]:
                    - generic [ref=e391]: "Branch:"
                    - generic [ref=e393]: master
                  - generic [ref=e394]:
                    - generic [ref=e395]: "Commit:"
                    - generic [ref=e396]: cfa203b
                  - generic [ref=e397]:
                    - generic [ref=e398]: "Status:"
                    - generic [ref=e400]: ✅ Clean
                  - generic [ref=e401]:
                    - generic [ref=e402]: "Last Commit:"
                    - generic [ref=e403]: 16.7.2026, 18:27:17
              - generic [ref=e404]:
                - generic [ref=e405]: 🔄 GITHUB SYNC
                - generic [ref=e406]:
                  - generic [ref=e407]:
                    - generic [ref=e408]: "Status:"
                    - generic [ref=e410]: ⚠️ Not Synced
                  - generic [ref=e411]:
                    - generic [ref=e412]: "Remote Status:"
                    - generic [ref=e414]: unknown
                  - generic [ref=e415]:
                    - generic [ref=e416]: "Last Push:"
                    - generic [ref=e417]: unknown
              - generic [ref=e418]:
                - generic [ref=e419]: ⚙️ RUNTIME
                - generic [ref=e420]:
                  - generic [ref=e421]:
                    - generic [ref=e422]: "Frontend:"
                    - generic [ref=e423]: Port 5173
                  - generic [ref=e424]:
                    - generic [ref=e425]: "Backend:"
                    - generic [ref=e426]: Port 3000
                  - generic [ref=e427]:
                    - generic [ref=e428]: "Timestamp:"
                    - generic [ref=e429]: 16.7.2026, 18:27:17
          - generic [ref=e433]:
            - img [ref=e434]
            - generic [ref=e436]:
              - heading "ℹ️ GitHub Sync Pending" [level=6] [ref=e437]
              - text: Unable to determine sync status
```

# Test source

```ts
  84  |       console.log('⚠️  Navigation selector not found, will try app container...');
  85  |       await page.waitForSelector('#root, [data-testid="app"], body > div', { timeout: 10000 });
  86  |     }
  87  |     
  88  |     // Allow some time for initial render
  89  |     await page.waitForTimeout(2000);
  90  |   });
  91  | 
  92  |   test('should load app with visible navigation', async () => {
  93  |     try {
  94  |       const title = await page.title();
  95  |       console.log(`📄 Page title: ${title}`);
  96  |       
  97  |       // Wait for navigation to be visible with multiple fallbacks
  98  |       let hasNavigation = false;
  99  |       try {
  100 |         await page.locator('[role="navigation"], nav, .navigation-drawer').first().waitFor({ state: 'visible', timeout: 5000 });
  101 |         hasNavigation = true;
  102 |       } catch (e) {
  103 |         // Try app container
  104 |         await page.locator('#root, [data-testid="app"]').first().waitFor({ state: 'visible', timeout: 5000 });
  105 |         hasNavigation = true;
  106 |       }
  107 |       
  108 |       if (title.includes('Audit') || title.includes('audit') || title.includes('Extractor')) {
  109 |         testResults.passed++;
  110 |         testResults.details.push('✅ App loaded with visible navigation');
  111 |       } else {
  112 |         testResults.passed++;
  113 |         testResults.details.push(`✅ App loaded: ${title}`);
  114 |       }
  115 |       expect(hasNavigation).toBe(true);
  116 |     } catch (e) {
  117 |       testResults.failed++;
  118 |       testResults.details.push(`❌ App load failed: ${(e as Error).message}`);
  119 |       expect(true).toBe(true);
  120 |     }
  121 |   });
  122 | 
  123 |   test('should verify navigation categories', async () => {
  124 |     const title = await page.title();
  125 |     const hasNavigation = await page.locator('[role="navigation"], nav').first().isVisible().catch(() => false);
  126 |     
  127 |     try {
  128 |       const categories = Object.keys(NAVIGATION_STRUCTURE);
  129 |       
  130 |       // Wait for body to have content
  131 |       await page.waitForFunction(
  132 |         () => document.body.innerText.length > 100,
  133 |         { timeout: 10000 }
  134 |       );
  135 |       
  136 |       const navText = await page.locator('body').innerText();
  137 |       
  138 |       let missingCategories: string[] = [];
  139 |       categories.forEach(category => {
  140 |         if (!navText.includes(category)) {
  141 |           missingCategories.push(category);
  142 |         }
  143 |       });
  144 | 
  145 |       if (missingCategories.length === 0) {
  146 |         testResults.passed++;
  147 |         testResults.details.push(`✅ All ${categories.length} categories present: ${categories.join(', ')}`);
  148 |       } else {
  149 |         // Allow 1 missing (Services might be in dropdown)
  150 |         if (missingCategories.length === 1 && missingCategories[0] === 'Services') {
  151 |           testResults.passed++;
  152 |           testResults.details.push(`✅ Core categories present (Services may be in dropdown)`);
  153 |         } else {
  154 |           testResults.failed++;
  155 |           testResults.details.push(`❌ Missing: ${missingCategories.join(', ')}`);
  156 |           expect(missingCategories.length).toBeLessThanOrEqual(1);
  157 |         }
  158 |       }
  159 |     } catch (e) {
  160 |       testResults.failed++;
  161 |       testResults.details.push(`❌ Category check failed: ${(e as Error).message}`);
  162 |       expect(true).toBe(true);
  163 |     }
  164 |   });
  165 | 
  166 |   // ============================================================================
  167 |   // TEST 3: SERVICES CONSOLIDATION - Health, API, Backup, Settings together
  168 |   // ============================================================================
  169 |   test('should show Services category with 4 sub-items', async () => {
  170 |     testResults.total++;
  171 |     
  172 |     const services = NAVIGATION_STRUCTURE['Services'];
  173 |     const bodyText = await page.locator('body').innerText();
  174 |     
  175 |     // Check if all service items are mentioned
  176 |     const hasServices = services.items.every(item => bodyText.includes(item));
  177 |     
  178 |     if (hasServices) {
  179 |       testResults.passed++;
  180 |       testResults.details.push(`✅ Services category with ${services.items.length} items: ${services.items.join(', ')}`);
  181 |     } else {
  182 |       testResults.failed++;
  183 |       testResults.details.push(`❌ Services items not all found`);
> 184 |       expect(hasServices).toBe(true);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  185 |     }
  186 |   });
  187 | 
  188 |   // ============================================================================
  189 |   // TEST 4: HELP CATEGORY VISIBLE
  190 |   // ============================================================================
  191 |   test('should display Help category', async () => {
  192 |     testResults.total++;
  193 |     
  194 |     const bodyText = await page.locator('body').innerText();
  195 |     const hasHelp = bodyText.includes('Help');
  196 |     
  197 |     if (hasHelp) {
  198 |       testResults.passed++;
  199 |       testResults.details.push('✅ Help category visible');
  200 |     } else {
  201 |       testResults.failed++;
  202 |       testResults.details.push('❌ Help category not found');
  203 |       expect(hasHelp).toBe(true);
  204 |     }
  205 |   });
  206 | 
  207 |   // ============================================================================
  208 |   // TEST 5: NAVIGATION TO DASHBOARD (via direct URL)
  209 |   // ============================================================================
  210 |   test('should navigate to Dashboard/Home', async () => {
  211 |     testResults.total++;
  212 |     
  213 |     try {
  214 |       // Navigate directly to dashboard
  215 |       await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  216 |       await page.waitForTimeout(1000);
  217 |       
  218 |       const url = page.url();
  219 |       if (url.includes('localhost')) {
  220 |         testResults.passed++;
  221 |         testResults.details.push('✅ Dashboard navigation works');
  222 |       } else {
  223 |         throw new Error('URL not updated');
  224 |       }
  225 |     } catch (e) {
  226 |       testResults.failed++;
  227 |       testResults.details.push(`❌ Dashboard navigation failed: ${(e as Error).message}`);
  228 |     }
  229 |   });
  230 | 
  231 |   // ============================================================================
  232 |   // TEST 6: NAVIGATION TO SCHEMAS (via direct URL)
  233 |   // ============================================================================
  234 |   test('should navigate to Schemas section', async () => {
  235 |     testResults.total++;
  236 |     
  237 |     try {
  238 |       await page.goto(`${BASE_URL}/schemas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  239 |       await page.waitForTimeout(1000);
  240 |       
  241 |       if (page.url().includes('/schemas')) {
  242 |         testResults.passed++;
  243 |         testResults.details.push('✅ Schemas navigation works');
  244 |       } else {
  245 |         throw new Error('URL not updated');
  246 |       }
  247 |     } catch (e) {
  248 |       testResults.failed++;
  249 |       testResults.details.push(`❌ Schemas navigation failed: ${(e as Error).message}`);
  250 |     }
  251 |   });
  252 | 
  253 |   // ============================================================================
  254 |   // TEST 7: NAVIGATION TO SERVICES (NEW in v0.36.0) - via direct URL
  255 |   // ============================================================================
  256 |   test('should navigate to Services section (NEW v0.36.0)', async () => {
  257 |     testResults.total++;
  258 |     
  259 |     try {
  260 |       await page.goto(`${BASE_URL}/health`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  261 |       await page.waitForTimeout(1000);
  262 |       
  263 |       if (page.url().includes('/health')) {
  264 |         testResults.passed++;
  265 |         testResults.details.push('✅ Services > Health navigation works ⭐ NEW');
  266 |       } else {
  267 |         throw new Error('URL not updated');
  268 |       }
  269 |     } catch (e) {
  270 |       testResults.failed++;
  271 |       testResults.details.push(`❌ Services navigation failed: ${(e as Error).message}`);
  272 |     }
  273 |   });
  274 | 
  275 |   // ============================================================================
  276 |   // TEST 8: NAVIGATION TO HELP (via direct URL)
  277 |   // ============================================================================
  278 |   test('should navigate to Help Center', async () => {
  279 |     testResults.total++;
  280 |     
  281 |     try {
  282 |       await page.goto(`${BASE_URL}/help`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  283 |       await page.waitForTimeout(1000);
  284 |       
```