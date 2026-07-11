# 🧪 Frontend & Backend Testing Guide - v0.18.0

**Version**: 0.18.0  
**Date**: 8.7.2026  
**Purpose**: How to test and verify Frontend and Backend

---

## ⚡ Quick Test (5 Minutes)

### 1. Start the System

```bash
# Option A: Windows CMD
start-docker.cmd

# Option B: PowerShell
.\start-docker.ps1

# Option C: Manual
docker-compose up -d
```

Wait ~20 seconds for services to fully start.

### 2. Verify All Services Running

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
extractor-backend       Up (healthy)        0.0.0.0:3000->3000/tcp
extractor-frontend      Up (healthy)        0.0.0.0:80->80/tcp
extractor-postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
extractor-redis         Up (healthy)        0.0.0.0:6379->6379/tcp
extractor-pgadmin       Up                  0.0.0.0:5050->80/tcp
```

All should show `Up` with `healthy` status.

---

## 🌐 Frontend Testing

### Test 1: Frontend Loads

**URL**: http://localhost

**Expected**:
- React application loads
- No console errors (F12 → Console tab)
- Page title: "Audit-Safe Document Extractor"
- Navigation menu visible

**Verify**:
```bash
curl -I http://localhost
```

Expected response:
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

### Test 2: Frontend Components

1. **Open**: http://localhost
2. **Check Elements**:
   - [ ] Header visible
   - [ ] Navigation menu appears
   - [ ] Main content area renders
   - [ ] No CSS errors (styling looks correct)

### Test 3: Console Errors

1. Open: http://localhost
2. Press `F12` (Developer Tools)
3. Go to **Console** tab
4. **Expected**: No red errors
5. **OK**: Warnings about deprecated APIs are normal

### Test 4: API Connectivity

1. Open DevTools (F12)
2. Go to **Network** tab
3. Trigger any action that calls API (if applicable)
4. **Expected**: API requests succeed (status 200, 201, etc.)
5. **Not OK**: 404, 500 errors

### Test 5: Responsive Design

1. Open: http://localhost
2. Resize browser window to test different sizes:
   - [ ] Desktop (1920x1080)
   - [ ] Tablet (768x1024)
   - [ ] Mobile (375x667)
3. **Expected**: Layout adapts, no broken elements

---

## 🔌 Backend Testing

### Test 1: Backend is Running

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-07-08T12:34:56.789Z",
  "uptime": 45.2
}
```

### Test 2: Backend Logs

```bash
docker-compose logs backend | tail -20
```

**Expected**:
- No `ERROR` messages
- Server started message visible
- Database connection established

### Test 3: Database Connection

**Via psql CLI**:
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db -c "\dt"
```

**Expected**:
- List of tables displays (may be empty if no data)
- No connection errors

**Via pgAdmin UI**:
1. Open: http://localhost:5050
2. Login: admin@extractor.local / admin-pass
3. Register new server:
   - Name: `extractor-postgres`
   - Host: `postgres`
   - User: `extractor_user`
   - Password: `extractor_pass`
4. **Expected**: Connection successful, can browse tables

### Test 4: API Endpoints

#### Health Check
```bash
curl http://localhost:3000/api/health
```
Expected: `{"status":"ok"}`

#### List Schemas (Phase 16+)
```bash
curl http://localhost:3000/api/schemas
```
Expected: JSON array of schemas

#### Check Error Handling
```bash
curl http://localhost:3000/api/invalid-endpoint
```
Expected: `404` status with error message

### Test 5: Backend Performance

```bash
# Test response time
time curl http://localhost:3000/api/health

# Load test (10 requests)
for i in {1..10}; do curl -s http://localhost:3000/api/health > /dev/null && echo "Request $i: OK" || echo "Request $i: FAILED"; done
```

**Expected**:
- Response time < 100ms
- All requests succeed
- No timeouts

### Test 6: Docker Container Health

```bash
# Check backend container health
docker inspect --format='{{.State.Health.Status}}' extractor-backend

# Check frontend container health  
docker inspect --format='{{.State.Health.Status}}' extractor-frontend

# Check PostgreSQL container health
docker inspect --format='{{.State.Health.Status}}' extractor-postgres
```

**Expected**: All show `healthy`

---

## 🔄 Integration Testing (Frontend + Backend)

### Test 1: Frontend → Backend Communication

1. Open Frontend: http://localhost
2. Open DevTools (F12)
3. Go to **Network** tab
4. Perform any action that calls backend
5. **Verify**:
   - [ ] Network request appears
   - [ ] URL starts with `/api/`
   - [ ] Status is `200` or similar success code
   - [ ] Response data is JSON

### Test 2: Error Handling

1. Stop backend:
   ```bash
   docker-compose stop backend
   ```

2. Try to use frontend
3. **Expected**: Error message displays (not blank page)

4. Restart backend:
   ```bash
   docker-compose restart backend
   ```

5. Frontend should recover

### Test 3: Data Persistence

1. Create some data via frontend
2. Stop container:
   ```bash
   docker-compose down
   ```

3. Restart:
   ```bash
   docker-compose up -d
   ```

4. **Expected**: Data still exists (persisted in PostgreSQL)

---

## 📊 Detailed Backend Testing

### Test Suite: Core Endpoints

```bash
# 1. Health Check
echo "=== Health Check ==="
curl http://localhost:3000/api/health

# 2. List Schemas
echo -e "\n=== List Schemas ==="
curl http://localhost:3000/api/schemas

# 3. List Extraction Rules  
echo -e "\n=== List Rules ==="
curl http://localhost:3000/api/extraction-rules

# 4. List Revisions
echo -e "\n=== List Revisions ==="
curl http://localhost:3000/api/revisions

# 5. Check Logs
echo -e "\n=== Get Logs ==="
curl http://localhost:3000/api/logs
```

### Load Testing

```bash
# Simple load test (100 requests)
echo "Running 100 requests..."
for i in {1..100}; do
  curl -s http://localhost:3000/api/health > /dev/null
  if (( i % 10 == 0 )); then echo "$i completed"; fi
done
echo "Load test completed"
```

### Stress Testing

```bash
# Concurrent requests using Apache Bench (if installed)
ab -n 1000 -c 100 http://localhost:3000/api/health

# Or using wrk (if installed)
wrk -t4 -c100 -d30s http://localhost:3000/api/health
```

---

## 🐛 Debugging Frontend Issues

### Issue: "Cannot reach API"

```bash
# Step 1: Check if backend is running
curl http://localhost:3000/api/health

# Step 2: Check Docker logs
docker-compose logs backend | tail -50

# Step 3: Check network connectivity
docker-compose exec frontend curl http://backend:3000/api/health

# Step 4: Restart frontend
docker-compose restart frontend
```

### Issue: "Blank page in browser"

```bash
# Step 1: Check Nginx logs
docker-compose logs frontend

# Step 2: Check if files are there
docker-compose exec frontend ls -la /usr/share/nginx/html

# Step 3: Check Nginx configuration
docker-compose exec frontend nginx -t

# Step 4: Rebuild frontend
docker-compose build --no-cache frontend && docker-compose up -d frontend
```

### Issue: "Styling is broken"

```bash
# Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
# Then reload page

# Or restart frontend
docker-compose restart frontend

# Or rebuild frontend
docker-compose build --no-cache frontend && docker-compose up -d frontend
```

---

## 🐛 Debugging Backend Issues

### Issue: "500 Internal Server Error"

```bash
# Check backend logs
docker-compose logs backend | tail -50 | grep -i error

# Look for database connection errors
docker-compose logs backend | grep -i "database\|postgres"

# Restart backend
docker-compose restart backend

# Check database is running
docker-compose ps postgres
```

### Issue: "Cannot connect to database"

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database credentials
docker-compose exec postgres psql -U extractor_user -d extractor_db -c "SELECT 1"

# Check CONNECTION_STRING in backend logs
docker-compose logs backend | grep -i "DATABASE_URL\|connection"

# Restart PostgreSQL
docker-compose restart postgres && docker-compose restart backend
```

### Issue: "API returns 404"

```bash
# Check if route is implemented
docker-compose logs backend | grep -i "404\|route"

# Check backend is responding at all
curl http://localhost:3000/api/health

# Verify API prefix is correct
curl http://localhost:3000/api/  # Note the trailing slash

# Rebuild backend if routes were changed
docker-compose build --no-cache backend && docker-compose up -d backend
```

---

## ✅ Complete Verification Checklist

- [ ] All Docker containers running (`docker-compose ps`)
- [ ] All containers show `healthy` status
- [ ] Frontend loads at http://localhost
- [ ] Backend responds to health check
- [ ] No console errors (F12 → Console)
- [ ] pgAdmin accessible at http://localhost:5050
- [ ] PostgreSQL responding
- [ ] Redis responding
- [ ] Frontend + Backend can communicate
- [ ] Response times < 100ms

---

## 📈 Performance Benchmarks

### Expected Performance

| Metric | Expected |
|--------|----------|
| Frontend Load Time | < 2 seconds |
| API Response | < 100ms |
| Health Check | < 50ms |
| Backend Startup | < 5 seconds |
| Database Query | < 100ms |
| Total System Startup | < 20 seconds |

### How to Measure

```bash
# Frontend load time
time curl -s http://localhost | wc -c

# API response time
time curl http://localhost:3000/api/health

# Multiple requests average
time for i in {1..10}; do curl -s http://localhost:3000/api/health > /dev/null; done
```

---

## 📞 Troubleshooting Resources

1. **Quick Fixes**: See [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)
2. **Detailed Guide**: See [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) → Troubleshooting
3. **Operations Manual**: See [MANUAL-0.18.0.md](MANUAL-0.18.0.md) → Troubleshooting

---

## 🎯 Next Steps After Testing

### If Everything Works ✅
- System is production-ready
- You can now deploy to cloud
- Proceed with Phase 19 (optional)

### If Issues Found ❌
1. Check the specific error in troubleshooting above
2. Review logs: `docker-compose logs -f`
3. Rebuild container: `docker-compose build --no-cache <service>`
4. Restart: `docker-compose restart`

---

**Happy Testing! 🚀**
