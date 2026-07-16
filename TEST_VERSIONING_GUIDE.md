# Navigation Test Versioning System - 0.37.0
## Phase 41: Automatic Test Version Synchronization

### 📋 Overview

The Navigation Test Versioning System automatically synchronizes test suite versions with the application version. This ensures that:

1. **Tests stay synchronized** with app changes
2. **API endpoints are validated** for each version
3. **New features are tested** automatically
4. **Deprecations are handled** properly
5. **Version history is tracked** for auditing

---

## 🚀 Quick Start

### Run Navigation Tests

```bash
# Run comprehensive navigation tests
npm run test:nav

# Run API endpoint & version verification tests
npm run test:nav:api

# Run both test suites
npm run test:nav:all

# Synchronize test versions with app version, then run tests
npm run test:nav:verify
```

### Update Test Versions (Manual)

```bash
# Manually sync test versions with package.json
npm run sync:tests

# This script:
# - Reads version from package.json
# - Updates tests/e2e/navigation-test.config.ts
# - Updates tests/e2e/navigation-comprehensive-test.test.ts
# - Prints summary report
```

---

## 📊 Test Coverage Matrix - 0.37.0

| Test Suite | Tests | Coverage | New Features |
|------------|-------|----------|--------------|
| **Navigation Routes** | 14 | 11 routes | Jobs, Rules, Logs nav tests |
| **API Endpoints** | 8 | All endpoints | API Docs, Settings |
| **Version Sync** | 1 | Version sync | Automatic validation |
| **Total** | **18** | **100%** | **5 new in 0.37.0** |

### Navigation Items Tested (11/11)

✅ Home (/) ✅ Schemas (/schemas) ✅ Create Schema (/schemas/create)  
✅ Jobs (/jobs) ✅ Rules (/rules) ✅ Logs (/logs)  
✅ Health (/health) ✅ API Docs (/api/docs)  
✅ Backups (/backups) ✅ Settings (/settings) ✅ Help (/help)

### API Endpoints Tested (9 total)

**Critical (5):**
- ✅ `/api/health` - System health
- ✅ `/api/schemas` - Schema management
- ✅ `/api/jobs` - Job execution
- ✅ `/api/rules` - Rule management
- ✅ `/api/logs` - Log retrieval

**Optional (2):**
- ✅ `/api/docs` - API documentation (NEW 0.37.0)
- ✅ `/api/settings` - Application settings (NEW 0.37.0)

---

## 🔄 Version Synchronization Workflow

### Step 1: Update package.json Version

When releasing a new version, update the version in `package.json`:

```json
{
  "version": "0.37.0"  // Updated from 0.37.0
}
```

### Step 2: Run Sync Script

```bash
npm run sync:tests
```

Output:
```
╔════════════════════════════════════════════════════════════════╗
║        Navigation Tests Version Auto-Sync System               ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📋 Step 1: Reading application version...                    ║
║     ✓ Application Version: 0.37.0                             ║
║                                                                ║
║  📋 Step 2: Updating test configuration...                    ║
║     ✅ Updated: tests/e2e/navigation-test.config.ts           ║
║                                                                ║
║  📋 Step 3: Updating test files...                            ║
║     ✅ Updated: tests/e2e/navigation-comprehensive-test.test.ts║
║                                                                ║
║  📋 Step 4: Verifying updates...                              ║
║     ✅ Test configuration synchronized to 0.37.0             ║
║                                                                ║
║  Updated Files:                                               ║
║  ✅ tests/e2e/navigation-test.config.ts                       ║
║  ✅ tests/e2e/navigation-comprehensive-test.test.ts           ║
║                                                                ║
║  New Version: 0.37.0                                          ║
║  Timestamp: 2026-07-16T11:30:00.000Z                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Step 3: Verify Changes

```bash
npm run test:nav:verify
```

This will:
1. Sync test versions
2. Run navigation tests
3. Run API verification tests
4. Generate reports

---

## 📁 Configuration Files

### `tests/e2e/navigation-test.config.ts`
Master configuration file for all navigation tests

**Contains:**
- `TEST_VERSION` - App and test version info
- `NAVIGATION_ENDPOINTS` - All routes and their API endpoints
- `API_ENDPOINTS_VERIFICATION` - Critical vs optional endpoints
- `TEST_COVERAGE` - Coverage matrix
- `VERSION_COMPATIBILITY` - Version-specific features

**Updated by:** `sync-test-versions.js`

### `tests/e2e/navigation-comprehensive-test.test.ts`
Main navigation test suite (18 tests)

**Tests:**
- TEST 1-10: Navigation route tests
- TEST 11-14: Service navigation tests
- TEST 15-17: Missing routes tests (Jobs, Rules, Logs)
- TEST 18: Complete accessibility check

**Updated by:** `sync-test-versions.js`

### `tests/e2e/navigation-api-version.test.ts`
API endpoints and version verification (8 tests)

**Tests:**
- TEST 1: Version synchronization
- TEST 2: Critical endpoints availability
- TEST 3: Optional endpoints (new features)
- TEST 4: Navigation routes & API mapping
- TEST 5: New features test coverage
- TEST 6: Test coverage completeness
- TEST 7: API response validation
- TEST 8: Deprecated routes check

**Updated by:** Manual (inherits config from navigation-test.config.ts)

---

## 🔧 Adding New Features to Navigation

### Example: Adding a new "Audit" navigation item in 0.37.0

#### Step 1: Update navigationConfig.ts

```typescript
// frontend/src/config/navigationConfig.ts
{
  id: 'audit',
  label: 'Audit',
  icon: AuditIcon,
  path: '/audit',
  category: 'services'
}
```

#### Step 2: Add Route in App.tsx

```typescript
// frontend/src/App.tsx
<Route path="/audit" element={<AuditPage />} />
```

#### Step 3: Update Test Configuration

```typescript
// tests/e2e/navigation-test.config.ts
{
  name: 'Audit',
  path: '/audit',
  category: 'services',
  version: '0.37.0',  // Mark as new in this version
  apiEndpoints: [
    { method: 'GET', path: '/api/audit', description: 'Audit logs' },
  ],
}
```

#### Step 4: Add Test Case

```typescript
// tests/e2e/navigation-comprehensive-test.test.ts
test('should navigate to Audit page', async () => {
  const auditLink = page.locator('text=/^Audit$/').first();
  // ... test logic
});
```

#### Step 5: Sync and Test

```bash
npm run sync:tests  # Auto-updates version to 0.37.0
npm run test:nav:verify
```

---

## 📈 Version History

### 0.37.0 (Current)
**Release Date:** 2026-07-16  
**Changes:**
- ✅ Added `/api/docs` endpoint
- ✅ Added `/settings` endpoint
- ✅ Added Jobs navigation test
- ✅ Added Rules navigation test
- ✅ Added Logs navigation test
- ✅ Removed deprecated `/backup` route
- ✅ Added comprehensive route accessibility test
- ✅ Implemented version synchronization system
- **Test Cases:** 18/18 ✅
- **Routes:** 11/11 ✅
- **API Endpoints:** 9/9 ✅

### 0.37.0
**Release Date:** 2026-07-15
**Changes:**
- Original navigation test implementation
- 10 test cases
- Basic navigation verification

---

## 🚨 Troubleshooting

### Problem: Tests fail after version update

**Solution:**
```bash
# 1. Run sync script
npm run sync:tests

# 2. Rebuild frontend
npm run build

# 3. Start Docker
docker-compose up -d

# 4. Run tests
npm run test:nav:verify
```

### Problem: API endpoints not responding

**Check:**
```bash
# 1. Verify backend is running
docker-compose ps

# 2. Check backend logs
docker logs extractor-backend

# 3. Manually test endpoint
curl http://localhost:3000/api/health

# 4. Verify frontend can reach backend
curl -H "Origin: http://localhost:5173" http://localhost:3000/api/health
```

### Problem: Test version doesn't match app version

**Solution:**
```bash
# Check current versions
cat package.json | grep '"version"'
grep 'APP_VERSION' tests/e2e/navigation-test.config.ts

# Re-sync
npm run sync:tests
```

---

## 🔐 Best Practices

### 1. Always Run Sync Before Release
```bash
npm run sync:tests
# Verify output shows updated version
```

### 2. Test Before Deploying
```bash
npm run test:nav:verify
# All 18 tests should pass
```

### 3. Document API Changes
When adding new endpoints, update:
- `NAVIGATION_ENDPOINTS.ROUTES` - Add route info
- `API_ENDPOINTS_VERIFICATION` - Mark as critical/optional
- Test case - Add validation test

### 4. Maintain Version Comments
```typescript
// Mark new features with version
version: '0.37.0',  // NEW in 0.37.0
```

### 5. Use Semantic Versioning
- **MAJOR** (0.→1.0): Breaking changes (e.g., new nav structure)
- **MINOR** (0.35.→0.37.0): Features added (e.g., new routes)
- **PATCH** (0.37.0→0.37.0): Bug fixes (e.g., fixed routes)

---

## 📊 Monitoring & Reports

### Generate HTML Report
```bash
npm run test:nav -- --reporter=html
# Report saved in: playwright-report/
```

### View Test Results
```bash
npm run test:nav -- --reporter=list
```

### API Verification Report
```bash
npm run test:nav:api -- --reporter=html
```

---

## 🔗 Related Files

- `frontend/src/config/navigationConfig.ts` - Navigation structure
- `frontend/src/App.tsx` - Route definitions
- `scripts/sync-test-versions.js` - Auto-sync script
- `package.json` - Version and npm scripts
- `tests/e2e/navigation-comprehensive-test.test.ts` - Navigation tests
- `tests/e2e/navigation-api-version.test.ts` - API tests
- `tests/e2e/navigation-test.config.ts` - Test configuration

---

## 📞 Questions?

For issues or questions about the versioning system:

1. Check the test configuration: `tests/e2e/navigation-test.config.ts`
2. Review the sync script: `scripts/sync-test-versions.js`
3. Run with verbose output: `npm run sync:tests`

---

**Last Updated:** 2026-07-16  
**Phase:** 41 - Navigation & API Validation  
**Version:** 0.37.0  
**Status:** ✅ Complete and Automated
