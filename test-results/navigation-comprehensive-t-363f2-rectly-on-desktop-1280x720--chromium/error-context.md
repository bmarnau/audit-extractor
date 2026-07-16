# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-comprehensive-test.test.ts >> NAVIGATION TEST SUITE v0.34.0 >> should render correctly on desktop (1280x720)
- Location: tests\e2e\navigation-comprehensive-test.test.ts:264:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
            - text: 16.7.2026, 11:41:57
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
                    - generic [ref=e289]: 20260716094157-cfa203b
                  - generic [ref=e290]:
                    - generic [ref=e291]: "Build Time:"
                    - generic [ref=e292]: 16.7.2026, 11:41:57
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
                    - generic [ref=e317]: 16.7.2026, 11:41:57
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
                    - generic [ref=e343]: 16.7.2026, 11:41:57
          - generic [ref=e347]:
            - img [ref=e348]
            - generic [ref=e350]:
              - heading "ℹ️ GitHub Sync Pending" [level=6] [ref=e351]
              - text: Unable to determine sync status
```

# Test source

```ts
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
  225 |       
  226 |       if (page.url().includes('/health')) {
  227 |         testResults.passed++;
  228 |         testResults.details.push('✅ Services > Health navigation works ⭐ NEW');
  229 |       } else {
  230 |         throw new Error('URL not updated');
  231 |       }
  232 |     } catch (e) {
  233 |       testResults.skipped++;
  234 |       testResults.details.push('⊘ Services navigation skipped');
  235 |     }
  236 |   });
  237 | 
  238 |   // ============================================================================
  239 |   // TEST 8: NAVIGATION TO HELP
  240 |   // ============================================================================
  241 |   test('should navigate to Help Center', async () => {
  242 |     testResults.total++;
  243 |     
  244 |     try {
  245 |       const helpLink = page.locator('text=/Help Center|help/i').first();
  246 |       await helpLink.click();
  247 |       await page.waitForNavigation({ waitUntil: 'networkidle' });
  248 |       
  249 |       if (page.url().includes('/help')) {
  250 |         testResults.passed++;
  251 |         testResults.details.push('✅ Help Center navigation works');
  252 |       } else {
  253 |         throw new Error('URL not updated');
  254 |       }
  255 |     } catch (e) {
  256 |       testResults.skipped++;
  257 |       testResults.details.push('⊘ Help Center navigation skipped');
  258 |     }
  259 |   });
  260 | 
  261 |   // ============================================================================
  262 |   // TEST 9: RESPONSIVE DESKTOP VIEW
  263 |   // ============================================================================
  264 |   test('should render correctly on desktop (1280x720)', async () => {
  265 |     testResults.total++;
  266 |     
  267 |     await page.setViewportSize({ width: 1280, height: 720 });
  268 |     await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  269 |     
  270 |     const navElements = await page.locator('[role="navigation"], nav').count();
  271 |     
  272 |     if (navElements > 0) {
  273 |       testResults.passed++;
  274 |       testResults.details.push('✅ Desktop layout responsive');
  275 |     } else {
  276 |       testResults.failed++;
  277 |       testResults.details.push('❌ Desktop layout issues');
> 278 |       expect(navElements).toBeGreaterThan(0);
      |                           ^ Error: expect(received).toBeGreaterThan(expected)
  279 |     }
  280 |   });
  281 | 
  282 |   // ============================================================================
  283 |   // TEST 10: RESPONSIVE MOBILE VIEW
  284 |   // ============================================================================
  285 |   test('should render correctly on mobile (375x667)', async () => {
  286 |     testResults.total++;
  287 |     
  288 |     await page.setViewportSize({ width: 375, height: 667 });
  289 |     await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  290 |     
  291 |     // Check for hamburger menu or mobile nav
  292 |     const hamburgerOrMobileNav = await page.locator('button').count().catch(() => 0);
  293 |     
  294 |     if (hamburgerOrMobileNav > 0) {
  295 |       testResults.passed++;
  296 |       testResults.details.push('✅ Mobile layout responsive');
  297 |     } else {
  298 |       testResults.skipped++;
  299 |       testResults.details.push('⊘ Mobile navigation check skipped');
  300 |     }
  301 |   });
  302 | 
  303 |   // ============================================================================
  304 |   // PHASE 40 VERIFICATION: Manual Version v0.35.0
  305 |   // ============================================================================
  306 |   test('should display Manual with correct version 0.35.0 (Phase 40 Fix #1)', async () => {
  307 |     testResults.total++;
  308 |     
  309 |     try {
  310 |       // Navigate to Help page
  311 |       await page.goto(`${BASE_URL}/help`, { waitUntil: 'networkidle', timeout: 10000 });
  312 |       await page.waitForTimeout(1000);
  313 | 
  314 |       // Click Manual tab
  315 |       const manualTab = page.locator('button').filter({ hasText: /^Manual \(\d+\)$/ }).first();
  316 |       await manualTab.click();
  317 |       await page.waitForTimeout(500);
  318 | 
  319 |       // Check that chapter content contains v0.35.0
  320 |       const pageText = await page.locator('body').innerText();
  321 |       
  322 |       const hasCorrectVersion = pageText.includes('0.35.0') && pageText.includes('Überblick: Was ist neu');
  323 |       const hasWrongVersion = pageText.includes('0.18.0');
  324 | 
  325 |       if (hasCorrectVersion && !hasWrongVersion) {
  326 |         testResults.passed++;
  327 |         testResults.details.push('✅ PHASE 40 FIX #1: Manual shows version 0.35.0 (NOT 0.18.0)');
  328 |       } else {
  329 |         testResults.failed++;
  330 |         testResults.details.push(`❌ PHASE 40 FIX #1 FAILED: Manual version incorrect (0.35.0: ${hasCorrectVersion}, 0.18.0: ${hasWrongVersion})`);
  331 |         expect(hasCorrectVersion).toBe(true);
  332 |         expect(hasWrongVersion).toBe(false);
  333 |       }
  334 |     } catch (e) {
  335 |       testResults.failed++;
  336 |       testResults.details.push(`❌ PHASE 40 FIX #1 ERROR: ${e}`);
  337 |       throw e;
  338 |     }
  339 |   });
  340 | 
  341 |   // ============================================================================
  342 |   // PHASE 40 VERIFICATION: Release Notes Visible on Health Page
  343 |   // ============================================================================
  344 |   test('should display Release Notes card on Health page (Phase 40 Fix #2)', async () => {
  345 |     testResults.total++;
  346 |     
  347 |     try {
  348 |       // Navigate to Health page
  349 |       await page.goto(`${BASE_URL}/health`, { waitUntil: 'networkidle', timeout: 10000 });
  350 |       await page.waitForTimeout(1500);
  351 | 
  352 |       // Check for Release Notes card visibility
  353 |       const releaseNotesCard = page.locator('button, div, section').filter({ hasText: /Release Notes|RELEASE NOTES/ }).first();
  354 |       const isVisible = await releaseNotesCard.isVisible().catch(() => false);
  355 | 
  356 |       // Check for version content in page
  357 |       const pageText = await page.locator('body').innerText();
  358 |       const hasVersion035 = pageText.includes('0.35.0') || pageText.includes('v0.35.0');
  359 |       const hasPhase37a = pageText.includes('Phase 37a') || pageText.includes('Phase 37');
  360 | 
  361 |       if (isVisible && hasVersion035) {
  362 |         testResults.passed++;
  363 |         testResults.details.push('✅ PHASE 40 FIX #2: Release Notes card visible on /health page with version 0.35.0');
  364 |       } else {
  365 |         testResults.failed++;
  366 |         testResults.details.push(`❌ PHASE 40 FIX #2 FAILED: Card visible: ${isVisible}, Version 0.35.0: ${hasVersion035}, Phase 37a: ${hasPhase37a}`);
  367 |         expect(isVisible).toBe(true);
  368 |         expect(hasVersion035).toBe(true);
  369 |       }
  370 |     } catch (e) {
  371 |       testResults.failed++;
  372 |       testResults.details.push(`❌ PHASE 40 FIX #2 ERROR: ${e}`);
  373 |       throw e;
  374 |     }
  375 |   });
  376 | 
  377 |   // ============================================================================
  378 |   // PHASE 40 VERIFICATION: Create Schema Button Always Visible
```