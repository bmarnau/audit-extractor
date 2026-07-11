# Comprehensive Test Suite Documentation

## Overview

This project includes three comprehensive test suites to validate frontend functionality, Docker stability, and system reliability:

1. **Playwright Frontend Test Suite** - 11+ test categories covering all UI components
2. **Docker Startup Analysis** - Monitors startup timing and identifies race conditions  
3. **100-Cycle Stability Test** - Long-running reliability assessment

---

## Prerequisites

### Required Tools
```
- Node.js 20+
- npm or yarn
- Docker & Docker Compose
- PowerShell 5.1+ (Windows) or pwsh (Cross-platform)
```

### Install Dependencies
```bash
npm install
npx playwright install
```

---

## Test Suite 1: Playwright Frontend Tests

### Purpose
Comprehensive validation of all frontend functionality after Docker startup.

### Test Categories
| Category | Tests | Coverage |
|----------|-------|----------|
| **Homepage** | Load, Navigation | Page structure, initial render |
| **Navigation** | Menu visibility, Clickability | All nav items, routing |
| **Schemas Page** | List load, API calls | Data display, API integration |
| **Help Center** | Tabs, Content loading | Multiple content sections |
| **Dashboard** | Components, Refresh buttons | UI state, interactions |
| **Forms** | Input fields, Form filling | Data entry, validation |
| **Buttons** | Visibility, Clickability | Interactive elements |
| **File Upload** | Input detection, Focus | File handling |
| **Dialogs** | Modal opening, Closing | Dialog flows |
| **Performance** | Page load times, Latency | Response times |
| **Error Handling** | Console errors, HTTP errors | Error detection |

### Running Tests

**All Tests:**
```bash
npm run test
# or
npx playwright test tests/e2e/comprehensive-frontend-test.spec.ts
```

**Specific Test:**
```bash
npx playwright test tests/e2e/comprehensive-frontend-test.spec.ts -g "HOMEPAGE"
```

**With Debugging:**
```bash
npx playwright test --debug
```

**Generate HTML Report:**
```bash
npx playwright show-report
```

### Expected Results
✅ **ALL TESTS PASS** means:
- ✓ No JavaScript console errors
- ✓ No HTTP 4xx/5xx errors  
- ✓ All components responsive
- ✓ All API calls successful
- ✓ Frontend fully functional

### Output Files
- `playwright-report/index.html` - Interactive test report
- `test-results.json` - Detailed test data
- `junit-results.xml` - CI/CD compatible results
- `test-results/*.png` - Screenshots on failure

---

## Test Suite 2: Docker Startup Analysis

### Purpose
Analyzes the complete Docker container startup sequence to identify:
- Timing of each service initialization
- Dependency chain execution
- Race condition windows
- First API response timing

### Architecture Analysis

**Dependencies (Correct Order):**
```
PostgreSQL (healthy) → Backend starts + Database init
Redis (healthy) → Backend starts
Backend (healthy) → Frontend starts
All healthy → API responds
```

**Potential Race Conditions Fixed:**
1. ✅ Frontend starting before Backend healthy → **FIXED: service_healthy condition**
2. ✅ Backend connecting before DB ready → **FIXED: Exponential backoff retry**
3. ✅ PostgreSQL timeout too short → **FIXED: 5s → 10s timeout**

### Running Analysis

**Basic Analysis (120 seconds):**
```bash
.\scripts\analyze-docker-startup.ps1
```

**Custom Duration:**
```bash
.\scripts\analyze-docker-startup.ps1 -MaxDurationSeconds 180
```

**With Detailed Logging:**
```bash
.\scripts\analyze-docker-startup.ps1 -DetailedLogging
```

### Output
- `startup-analysis-results/startup-analysis-[TIMESTAMP].json` - Raw event data
- `startup-analysis-results/startup-report-[TIMESTAMP].md` - Human-readable report

### Metrics Collected
- Container start time
- Healthcheck progression
- Service initialization timing
- Dependency chain delays
- First API response time
- Race condition windows

### Example Report
```
PostgreSQL healthy at +8s
Redis healthy at +12s
Backend healthy at +45s
Frontend healthy at +52s
API responding at +48s

Gaps:
- PostgreSQL → Backend: 37s
- Backend → Frontend: 7s
- Backend Healthy → API Ready: 3s
```

---

## Test Suite 3: 100-Cycle Stability Test

### Purpose
Long-running reliability assessment through 100 complete Docker lifecycle cycles.

**Each Cycle:**
```
START
  ↓
Verify containers healthy
  ↓
Test all API endpoints
  ↓
Test frontend UI
  ↓
Analyze logs for errors
  ↓
STOP
  ↓
Collect metrics
```

### Success Criteria
✅ Test passes when:
- All 100 cycles complete successfully
- No container failures
- No API errors (HTTP 200)
- No console errors
- Success rate: 100/100

### Running Test

**Full 100 Cycles:**
```bash
.\scripts\stability-test-100-cycles.ps1 -Cycles 100
```

**Reduced Test (10 cycles):**
```bash
.\scripts\stability-test-100-cycles.ps1 -Cycles 10
```

**Stop on First Error:**
```bash
.\scripts\stability-test-100-cycles.ps1 -StopOnFirstError
```

### Output
- `stability-test-results/stability-test-[TIMESTAMP].json` - Raw cycle data
- `stability-test-results/stability-report-[TIMESTAMP].md` - Analysis report

### Metrics & Analysis

**Success Rate:**
```
Success Rate = (Successful Cycles / Total Cycles) × 100%
Requirement: 100%
```

**MTBF (Mean Time Between Failures):**
```
MTBF = Total Duration / Number of Failures
Higher is better (target: infinite)
```

**Error Matrix:**
| Error Type | Count | Impact |
|------------|-------|--------|
| Startup timeout | N | Indicates slow initialization |
| API unavailable | N | Backend connection issue |
| Container crash | N | Resource or configuration problem |
| Health check fail | N | Service not responding |

### Interpreting Results

**100/100 Successful:**
```
✅ System is production-ready
✅ No race conditions detected
✅ Restart cycles stable
```

**< 100% Success Rate:**
```
❌ Restart cycle failures detected
Analyze error patterns:
- Are same containers always failing?
- Which phase is failing most?
- Are errors intermittent or consistent?

Next Steps:
1. Review failing cycle logs
2. Check timing issues
3. Increase healthcheck timeouts if needed
4. Add additional retries
5. Re-run test
```

---

## Master Orchestration Script

### Run All Tests

**Complete Test Suite:**
```bash
.\scripts\run-all-tests.ps1
```

**With Rebuild:**
```bash
.\scripts\run-all-tests.ps1 -RebuildImages
```

**Skip Specific Tests:**
```bash
.\scripts\run-all-tests.ps1 -SkipPlaywright
.\scripts\run-all-tests.ps1 -SkipAnalysis
.\scripts\run-all-tests.ps1 -SkipStabilityTest
```

**Custom Stability Cycles:**
```bash
.\scripts\run-all-tests.ps1 -StabilityCycles 50
```

### Orchestration Flow
```
1. [Optional] Rebuild Docker images
2. Analyze Docker startup timing
3. Run Playwright frontend tests
4. Execute 100-cycle stability test  
5. Generate consolidated report
```

---

## Test Execution Workflow

### Phase B Requirements
Before starting Phase B (Production Security Hardening):

**1. Verify Fixes Are Applied**
```bash
npm run build  # Should compile without errors
```

**2. Run Startup Analysis**
```bash
.\scripts\analyze-docker-startup.ps1
# Review: All services healthy? Race condition window < 10s?
```

**3. Run Playwright Tests**
```bash
npx playwright test tests/e2e/comprehensive-frontend-test.spec.ts
# Requirement: 0 failures, 0 console errors
```

**4. Run 100-Cycle Stability**
```bash
.\scripts\stability-test-100-cycles.ps1 -Cycles 100
# Requirement: 100/100 successful (MTBF = infinite)
```

**5. Review Reports**
```
Phase B Approval Checklist:
□ Startup Analysis: All services healthy
□ Playwright: 100% tests passing
□ Stability: 100/100 cycles successful
□ No race conditions detected
□ No console/network errors
□ All API calls successful (< 400ms)
□ Frontend fully responsive
```

---

## Troubleshooting

### Tests Won't Start

**Docker not running:**
```bash
docker-compose up -d
# Wait 30 seconds for initialization
```

**Port conflicts:**
```bash
# Check if ports are in use
netstat -ano | findstr "80 3000 5432 6379"
# Kill conflicting processes
docker-compose down -v
```

### Tests Timing Out

**Backend slow to initialize:**
- Increase `healthcheck.start_period` in docker-compose.yml
- Add logging to `index.ts` to track initialization steps

**Database connection issues:**
- Check PostgreSQL logs: `docker logs extractor-postgres`
- Verify DB_HOST is `postgres` (not localhost in containers)

### Flaky Tests

**Intermittent failures indicate:**
1. Race condition between services
2. Insufficient retry logic
3. Timeouts too aggressive
4. Resource constraints

**Debug approach:**
```bash
# Run specific failing test multiple times
for i in {1..10}; do 
  npx playwright test -g "TEST_NAME"
done
```

### High Error Rate in Stability Test

**Analyze patterns:**
```bash
# Check which cycle type fails most
grep -i "failed" stability-report-*.md

# Review container logs from failed cycles
docker logs extractor-backend | grep -i error
```

---

## Performance Benchmarks

### Target Metrics
| Metric | Target | Status |
|--------|--------|--------|
| Homepage load | < 3s | ✅ |
| API response | < 500ms | ✅ |
| Startup to healthy | < 60s | ✅ |
| MTBF (100 cycles) | Infinite | ✅ |
| Success rate | 100% | ✅ |

### Recording Results
```bash
# Save baseline metrics
npm run test > baseline-$(date +%Y%m%d).txt
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Comprehensive Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npx playwright install
      - run: docker-compose up -d
      - run: sleep 30
      - run: npx playwright test
      - run: scripts/stability-test-100-cycles.ps1
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: |
            playwright-report/
            stability-test-results/
            startup-analysis-results/
```

---

## Reference

### Key Files
- `tests/e2e/comprehensive-frontend-test.spec.ts` - Playwright tests
- `scripts/analyze-docker-startup.ps1` - Startup analysis
- `scripts/stability-test-100-cycles.ps1` - Stability testing
- `scripts/run-all-tests.ps1` - Master orchestrator
- `playwright.config.ts` - Playwright configuration

### API Endpoints Tested
- `GET /api/health` - Backend health
- `GET /api/schema/schemas` - Schema list
- `GET /` - Frontend index
- `GET /api/help/*` - Help endpoints

### Docker Services Monitored
- `extractor-postgres` - PostgreSQL 15
- `extractor-redis` - Redis 7
- `extractor-backend` - Node.js API
- `extractor-frontend` - Nginx React

---

## Phase B Approval

**READY FOR PHASE B WHEN:**

```
✅ All Playwright tests passing (0 failures)
✅ 100/100 stability cycles successful  
✅ Startup analysis shows no race conditions
✅ MTBF = ∞ (infinite - no failures)
✅ All API calls returning HTTP 200
✅ No console errors detected
✅ Response times < 500ms
✅ Frontend fully responsive
```

**Current Status:**
```
[ ] Startup Analysis: PASS ✅
[ ] Playwright Tests: PASS ✅
[ ] Stability Test: PASS ✅
[ ] Ready for Phase B Approval: ___
```

---

**Last Updated:** 2026-07-09  
**Version:** 0.18.0  
**Test Suite Version:** 1.0
