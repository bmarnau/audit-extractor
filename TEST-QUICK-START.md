# 🚀 QUICK START: Comprehensive Tests

## ⚡ 30-Second Setup

```bash
# 1. Install dependencies
npm install
npx playwright install

# 2. Build backend
npm run build

# 3. Set PowerShell execution policy (Windows only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎯 Run Tests (Pick One)

### Option 1: Playwright Frontend Tests (~10 min)
```bash
npm run test:e2e:frontend
```
✓ Tests all UI components, navigation, forms, API integration  
✓ Captures screenshots on failure  
✓ Generates HTML report  

### Option 2: Docker Startup Analysis (~2 min)
```bash
npm run test:analyze:startup
```
✓ Monitors container startup sequence  
✓ Identifies timing issues  
✓ Generates markdown report  

### Option 3: Quick Stability Test (~12 min / 10 cycles)
```bash
npm run test:stability:10
```
✓ Tests 10 complete Docker lifecycles  
✓ Checks for crashes/failures  
✓ Generates stability report  

### Option 4: Full Stability Test (~120 min / 100 cycles)
```bash
npm run test:stability:100
```
✓ Tests 100 complete Docker lifecycles  
✓ Calculates MTBF (Mean Time Between Failures)  
✓ Generates comprehensive report  

### Option 5: RUN ALL TESTS (~3 hours)
```bash
npm run test:all:comprehensive
```
✓ Runs ALL test suites sequentially  
✓ Full validation before Phase B  
✓ Consolidated report generation  

---

## 📊 Expected Results

### ✅ Success Indicators

**Playwright Tests:**
```
✓ 11/11 test categories pass
✓ 0 console errors
✓ 0 HTTP 4xx/5xx responses
✓ All pages load < 5s
✓ All API calls succeed
```

**Startup Analysis:**
```
✓ PostgreSQL healthy: ~8s
✓ Redis healthy: ~10s
✓ Backend healthy: ~45s
✓ Frontend healthy: ~50s
✓ API responding: ~48s
```

**Stability Test (100 cycles):**
```
✓ 100/100 cycles successful
✓ No container crashes
✓ No API failures
✓ Success rate: 100%
✓ MTBF: ∞ (infinite)
```

---

## 📁 Report Locations

### Playwright
```
./playwright-report/index.html     # Open in browser
./test-results.json                # Raw data
./junit-results.xml                # CI/CD compatible
```

### Startup Analysis
```
./startup-analysis-results/startup-report-[TIMESTAMP].md
./startup-analysis-results/startup-analysis-[TIMESTAMP].json
```

### Stability Test
```
./stability-test-results/stability-report-[TIMESTAMP].md
./stability-test-results/stability-test-[TIMESTAMP].json
```

---

## ⚠️ Troubleshooting

### Tests Won't Start

**Check Docker:**
```bash
docker ps
docker-compose up -d
```

**Check ports:**
```bash
netstat -ano | findstr "80 3000 5432 6379"
```

**Clear Docker:**
```bash
docker-compose down -v
docker system prune
```

### Playwright Install Issue

```bash
npx playwright install --with-deps
```

### PowerShell Execution Policy

```bash
# Allow scripts in current session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## ✅ Phase B Approval Checklist

**Before Phase B (Production Security Hardening):**

- [ ] `npm run build` → 0 errors
- [ ] `npm run test:e2e:frontend` → All pass ✅
- [ ] `npm run test:analyze:startup` → No race conditions ✅
- [ ] `npm run test:stability:100` → 100/100 cycles ✅

**When ALL checks pass:** Ready for Phase B 🎉

---

## 📖 Full Documentation

See `TEST-DOCUMENTATION.md` for:
- Detailed test categories
- Architecture analysis
- Configuration reference
- CI/CD integration
- Performance benchmarks
- Troubleshooting guide

---

## 🔍 What Tests Verify

### Playwright Frontend Tests
- ✓ Page loading & rendering
- ✓ Navigation & routing
- ✓ All UI components visible
- ✓ Forms & input handling
- ✓ Buttons & dialogs
- ✓ File upload capability
- ✓ API communication
- ✓ Response times
- ✓ Error handling
- ✓ Console/network errors

### Docker Startup Analysis
- ✓ Container initialization timing
- ✓ Service dependencies
- ✓ Healthcheck progression
- ✓ Race condition windows
- ✓ First API response
- ✓ Startup sequence verification

### 100-Cycle Stability Test
- ✓ Complete Docker lifecycle (100x)
- ✓ Container start/stop reliability
- ✓ API availability
- ✓ Frontend responsiveness
- ✓ Error detection & logging
- ✓ System stability metrics
- ✓ MTBF calculation

---

## 🎬 Next Steps

**1. Run quick validation:**
```bash
npm run build && npm run test:e2e:frontend
```

**2. Check startup timing:**
```bash
npm run test:analyze:startup
```

**3. Verify stability:**
```bash
npm run test:stability:100
```

**4. Review reports & approve Phase B**

---

## 💡 Pro Tips

### Save Test Results
```bash
# Run with timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
npm run test:e2e:frontend | Tee-Object -FilePath "test-run-$timestamp.log"
```

### Run Specific Test
```bash
npm run test:e2e:frontend -- -g "SCHEMAS PAGE"
```

### Debug Mode
```bash
npx playwright test --debug
```

### Watch Playwright
```bash
npx playwright test --headed --slow-mo=1000
```

---

## 📞 Support

**Issues?** Check:
1. `TEST-DOCUMENTATION.md` - Troubleshooting section
2. Docker logs: `docker logs extractor-backend`
3. Browser console: F12 in open page
4. Test reports in respective directories

---

**Ready to test? Start with:**
```bash
npm run build && npm run test:e2e:frontend
```

**Questions? See:** `TEST-DOCUMENTATION.md`

**Ready for Phase B? Run:** `npm run test:all:comprehensive`

Good luck! 🚀
