# Frontend Integration Validation Checklist

**Purpose:** Catch frontend-backend communication issues before they reach production

**Version:** 1.0 (Post Phase 13 Debugging)

---

## 🚀 PHASE 0: Pre-Flight Checks

### Backend Readiness
- [ ] Backend starts without errors: `npm run dev`
- [ ] Backend logs: "Server running on http://localhost:3000"
- [ ] Verify port 3000 is listening: `netstat -ano | findstr :3000`
- [ ] Backend database/services initialized

### Frontend Readiness
- [ ] Frontend starts without errors: `npm run dev`
- [ ] Frontend logs: "VITE v5.x.x dev server running"
- [ ] Verify port 5173 is listening: `netstat -ano | findstr :5173`
- [ ] Browser loads http://localhost:5173 (should NOT show Vite 404)

---

## 🔌 PHASE 1: Proxy Configuration Validation

### Vite Proxy Config Check
- [ ] `frontend/vite.config.js` EXISTS (not just .ts)
- [ ] `server.proxy['/api']` is configured
- [ ] `target: 'http://localhost:3000'` is correct
- [ ] `changeOrigin: true` is set
- [ ] `logLevel: 'debug'` for troubleshooting enabled

### Proxy Activation
- [ ] Browser DevTools → Network tab shows proxy requests
- [ ] Proxy requests start with `/api/` path
- [ ] NO 404 errors in Network tab for API calls
- [ ] Proxy debug logs appear in Vite terminal (if logLevel: debug)

---

## 🧪 PHASE 2: API Response Validation

### Direct Backend Test (Bypass Proxy)
```powershell
# Test backend directly on port 3000
Invoke-WebRequest http://localhost:3000/api/logs | Select-Object StatusCode
# Expected: 200

# Check response is JSON, not HTML
$response = Invoke-WebRequest http://localhost:3000/api/backup/list
$response.Content | ConvertFrom-Json
# Should NOT error with "JSON parse error" or "<!doctype"
```

- [ ] Backend returns 200 for all core endpoints
- [ ] Backend responses are valid JSON (not HTML)
- [ ] Response includes `data` wrapper
- [ ] No 304 Not Modified responses (always fresh data)

### Proxy Pass-Through Test
```powershell
# Test via Vite proxy on port 5173
$response = Invoke-WebRequest http://localhost:5173/api/backup/list
$response.StatusCode
# Expected: 200

# Verify not HTML error page
[string]$content = $response.Content
if ($content -contains "<!doctype") { Write-Host "ERROR: Got HTML!" }
```

- [ ] Proxy forwards requests to backend (not returning 404)
- [ ] Proxy responses are JSON (not HTML error pages)
- [ ] Proxy does NOT modify response format

---

## 🎨 PHASE 3: Frontend Component Testing

### Browser Console Check (Critical!)
```javascript
// Open browser DevTools: F12
// Check Console tab for errors:
// - "Unexpected token '<'" → HTML instead of JSON
// - "404 Not Found" → Proxy not working
// - JSON.parse errors → Response format issue
```

- [ ] Console has NO JSON parse errors
- [ ] Console has NO "Unexpected token '<'" errors
- [ ] Console has NO 404 errors for `/api/` requests
- [ ] Console shows component logs (e.g., "[useBackup] Backups loaded")

### Component-by-Component Testing

#### Help Component
```
URL: http://localhost:5173/workbench
Nav: Click "Help" → Help Browser
Expected Console:
  [useHelp] Manual loaded: 9 chapters
Expected UI:
  - Glossary entries visible
  - Manual chapters visible
  - No error messages
```

- [ ] Help page loads without errors
- [ ] Glossary data appears in UI
- [ ] Manual chapters display correctly
- [ ] Console: `[useHelp] Manual loaded: 9 chapters`

#### Logs Component
```
URL: http://localhost:5173/workbench
Nav: Click "Logs" → Log Browser
Expected Console:
  [LogBrowser] Fetching logs with filter: {...}
Expected UI:
  - Log entries visible
  - Timestamps display
  - No error messages
```

- [ ] Logs page loads without errors
- [ ] Log entries appear in table
- [ ] Timestamps format correctly
- [ ] No "No data" error messages

#### Backup Component
```
URL: http://localhost:5173/workbench
Nav: Click "Backup" → Backup Manager
Expected Console:
  [BackupManager] Backups loaded successfully
  [useBackup] Backup totalSize: XXX bytes
Expected UI:
  - Backup list visible
  - "Create Backup" button works
  - File sizes display (not 0.00)
```

- [ ] Backup list loads without errors
- [ ] Backup sizes display (not 0.00 MB)
- [ ] Create backup button creates backups
- [ ] Console: `[useBackup] Backup totalSize: XXX bytes`

#### Config Component
```
URL: http://localhost:5173/workbench
Nav: Click "Config" → Config Editor
Expected Console:
  [ConfigEditor] Loading config...
Expected UI:
  - Config fields visible
  - Settings load
  - No error messages
```

- [ ] Config page loads without errors
- [ ] Configuration fields are populated
- [ ] Settings are readable
- [ ] No parse errors

#### Learning Component (Baseline)
```
URL: http://localhost:5173/workbench/learning
Expected:
  "No result ID provided. Use ?result=xxx"
This is CORRECT behavior (not an error!)
```

- [ ] Shows "No result ID provided" message (EXPECTED)
- [ ] NOT showing JSON parse error
- [ ] NOT showing 404 error

---

## 🔧 PHASE 4: Cache & Performance Check

### Cache Headers Validation
```powershell
# Check response headers
$response = Invoke-WebRequest http://localhost:5173/api/backup/list -Headers @{"Cache-Control"="no-store"}
$response.Headers | Format-List

# Expected headers:
# - Cache-Control: no-store, no-cache, must-revalidate
# - Pragma: no-cache
# - Expires: 0
```

- [ ] API responses include Cache-Control headers
- [ ] Cache-Control set to `no-store` (not allowing 304)
- [ ] No 304 Not Modified responses
- [ ] Fresh data on every request

### Response Format Consistency
```javascript
// In browser console, check response structure
// Open Network tab, click on API request, Preview tab

// Should look like:
{
  "data": {
    "backups": [...],
    "total": 5,
    "limit": 50
  },
  "timestamp": "2026-07-08T...",
  "path": "/api"
}

// NOT: { "backups": [...] } (missing "data" wrapper)
```

- [ ] All responses wrapped in `{data: {...}}`
- [ ] All responses include `timestamp`
- [ ] Response structure is consistent
- [ ] Frontend parsing handles structure correctly

---

## 📊 PHASE 5: Integration Flow Test

### Full Workflow Test
1. [ ] Load http://localhost:5173/workbench
2. [ ] All 4 components load without errors
3. [ ] Create a Backup via UI (verify in list)
4. [ ] View Logs (verify entries appear)
5. [ ] View Help (verify sections load)
6. [ ] View Config (verify fields populate)
7. [ ] Check console: NO red error messages

### Network Traffic Analysis
```
Expected Network Tab Pattern:
- GET /api/backup/list → 200 OK (JSON response)
- POST /api/backup/create → 200 OK (JSON response)
- GET /api/logs → 200 OK (JSON response)
- GET /api/help/glossary → 200 OK (JSON response)
- GET /api/config → 200 OK (JSON response)

NOT:
- Any endpoint returning HTML (should be JSON only)
- Any endpoint with 404 (proxy issue)
- Any endpoint with 304 (cache issue)
```

- [ ] All API calls return 200 OK
- [ ] All responses are JSON format
- [ ] No 404 responses
- [ ] No 304 Not Modified responses
- [ ] No HTML error pages

---

## 🚨 COMMON ISSUES - Quick Diagnosis

### Symptom: "Unexpected token '<', "<!doctype""
**Root Cause:** Backend returning HTML instead of JSON
**Check:**
- [ ] Vite proxy configured correctly
- [ ] Backend API actually returns JSON
- [ ] Test: `curl http://localhost:3000/api/logs`

### Symptom: "404 Not Found" in Network tab
**Root Cause:** Vite proxy not routing request
**Check:**
- [ ] `vite.config.js` (not `.ts`) has proxy config
- [ ] Frontend dev server restarted
- [ ] Port 5173 actually listening

### Symptom: Empty responses (0 bytes)
**Root Cause:** Cache issue (304 Not Modified)
**Check:**
- [ ] Response includes Cache-Control headers
- [ ] Fetch calls include `cache: 'no-store'`
- [ ] No 304 responses in Network tab

### Symptom: Components show "No Data"
**Root Cause:** Response format mismatch
**Check:**
- [ ] Frontend expects `data.data.items` vs actual `data.items`
- [ ] Check Network tab response format
- [ ] Verify hook parsing logic

---

## ✅ Sign-Off

**Test Date:** ________________

**Tested By:** ________________

**All Phases Passed:** ☐ YES ☐ NO

**Notes:**
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

**Issues Found & Fixed:**
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

## 📝 Automation Opportunities

These checks can be automated:

1. **Startup Validation Script**
   ```powershell
   # Check both ports listening
   # Validate vite.config.js proxy
   # Test API responses
   ```

2. **Browser Automation (Playwright)**
   ```
   - Load each component page
   - Check console for errors
   - Validate UI elements render
   - Verify data loads
   ```

3. **CI/CD Pipeline Integration**
   ```
   - Run checks on every deployment
   - Fail pipeline if checks fail
   - Generate report
   ```
