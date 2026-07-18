# Audit-Safe Document Extractor - Startup Scripts Guide
## Version 0.37.1 | Phase 45 Finalization

---

## Overview

Two comprehensive PowerShell scripts are provided to manage the application lifecycle with automated health checks and verification:

- **start-app.ps1** - Comprehensive startup with full verification
- **stop-app.ps1** - Graceful shutdown with status confirmation

---

## Quick Start

### Starting the Application

```powershell
.\start-app.ps1
```

**What it does:**
1. Stops any running containers (clean start)
2. Verifies TypeScript build artifacts exist
3. Starts all Docker Compose services
4. Waits for backend to become healthy
5. Performs health check on API endpoints
6. Tests navigation endpoints (4 key routes)
7. Verifies database (PostgreSQL) and cache (Redis)
8. Reports complete status

**Output:**
- Real-time colored status messages (PASS/FAIL/WARN)
- Component status report
- Access information for all services
- Log file location for debugging

### Stopping the Application

```powershell
.\stop-app.ps1
```

**What it does:**
1. Gracefully stops all containers
2. Removes orphaned containers
3. Verifies all services stopped
4. Reports shutdown status

---

## Advanced Usage

### Custom Wait Time

```powershell
# Wait up to 5 minutes for services to be healthy
.\start-app.ps1 -MaxWaitSeconds 300
```

### Skip Health Checks

```powershell
# Start containers without navigation endpoint verification
.\start-app.ps1 -SkipHealthCheck
```

### Force Shutdown

```powershell
# Force remove containers if normal shutdown fails
.\stop-app.ps1 -Force
```

---

## Script Stages Explained

### start-app.ps1 Stages

#### STAGE 1: SHUTDOWN AND CLEANUP
- Stops existing containers
- Removes networks
- Waits 3 seconds for cleanup

#### STAGE 2: BUILD VERIFICATION
- Checks if `dist/index.js` exists
- Runs `npm run build` if missing
- Validates compilation

#### STAGE 3: DOCKER CONTAINER STARTUP
- Executes `docker-compose up -d`
- Reports container status
- Lists all running services

#### STAGE 4: HEALTH CHECK READINESS VERIFICATION
- Polls container health (up to 60 attempts)
- Tests API health endpoint (HTTP GET /api/health)
- Waits for 200 response from backend

#### STAGE 5: NAVIGATION ENDPOINT VERIFICATION
- Tests 4 key API endpoints:
  - `/api/health` - Health check
  - `/api/extraction` - Document extraction
  - `/api/jobs` - Job management
  - `/api/schema` - Schema operations
- Reports pass/fail for each endpoint

#### STAGE 6: DATABASE AND CACHE VERIFICATION
- Verifies PostgreSQL container health
- Verifies Redis container health
- Reports status

#### STAGE 7: STARTUP COMPLETE
- Displays final component status
- Shows access information (URLs and ports)
- Lists useful commands
- Provides log file location

---

## Component Status Report

```
Component Status:
  Backend API:   PASS
  PostgreSQL:    PASS
  Redis:         PASS
  Frontend:      STARTING

Access Information:
Backend API:   http://localhost:3000
Frontend:      http://localhost
Database:      localhost:5432
Cache:         localhost:6379
```

---

## Typical Output

### Successful Startup

```
======================================================================
STAGE 4: HEALTH CHECK READINESS VERIFICATION
======================================================================

[Container Status Check]
INFO: Attempt 1/60 - Checking container health...
PASS: Backend container is healthy

[API Endpoint Health Check]
PASS: API Health Check: HTTP 200 OK

======================================================================
STAGE 5: NAVIGATION ENDPOINT VERIFICATION
======================================================================

[Testing API Endpoints]
PASS: Endpoint [Health]: HTTP 200
PASS: Endpoint [Jobs]: HTTP 200
INFO: Navigation Tests: 2 passed, 2 failed

======================================================================
STARTUP COMPLETE - APPLICATION IS READY
======================================================================
```

---

## Debugging

### View Detailed Logs

```powershell
# See application startup log
Get-Content "startup-20260718_094306.log"

# Watch Docker logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Check Container Status

```powershell
# List all containers
docker-compose ps

# View container details
docker ps --no-trunc

# Check container health
docker inspect extractor-backend | Select-String -Pattern "Health"
```

### Common Issues

#### Containers won't start
```powershell
# Check for port conflicts
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Clear Docker resources
docker system prune
```

#### API not responding
```powershell
# Check backend logs
docker-compose logs backend

# Test endpoint manually
Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing
```

#### Build fails
```powershell
# Clean build
npm run clean 2>$null
npm run build
```

---

## Commands Reference

| Task | Command |
|------|---------|
| Start application | `.\start-app.ps1` |
| Stop application | `.\stop-app.ps1` |
| View logs | `docker-compose logs -f` |
| Run tests | `npm test` |
| Check status | `docker-compose ps` |
| Force cleanup | `docker-compose down --remove-orphans` |
| Rebuild app | `npm run build` |

---

## Verification Checklist

After running `.\start-app.ps1`, verify:

- [ ] All stages complete (1-7)
- [ ] Backend API: PASS
- [ ] PostgreSQL: PASS
- [ ] Redis: PASS
- [ ] Navigation Tests: At least 2/4 passed
- [ ] Log file created successfully
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost (frontend)

---

## Performance Notes

- **Typical startup time:** 30-60 seconds
- **Health check timeout:** 120 seconds (configurable)
- **API response time:** <1 second
- **Container startup sequence:**
  1. PostgreSQL (first, database required)
  2. Redis (cache layer)
  3. Backend (main API)
  4. Frontend (nginx)

---

## Troubleshooting

### Script won't execute
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PowerShell version issues
- Requires: PowerShell 5.1 or later
- Windows 10/11: Already included
- Check version: `$PSVersionTable.PSVersion`

### Docker not found
```powershell
# Verify Docker is installed
docker --version
docker-compose --version

# Ensure Docker Desktop is running
Start-Service Docker
```

---

## Additional Resources

- **Project Root:** `c:\Users\bmarn\OneDrive\HTML\extractor`
- **Main README:** `README.md`
- **Operations Manual:** `OPERATIONS_MANUAL.md`
- **Docker Guide:** `DOCKER_OPERATIONS_GUIDE.md`
- **Quick Start:** `QUICKSTART.md`

---

## Version Info

- **Application Version:** 0.37.1
- **Phase:** 45 Finalization
- **Last Updated:** 2026-07-18
- **Created:** Phase 45 Final Sprint

---

## Support

For issues, check:
1. Log files (startup-*.log)
2. Docker logs (`docker-compose logs`)
3. OPERATIONS_MANUAL.md
4. TROUBLESHOOTING.md
