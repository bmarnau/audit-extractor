# Safe Startup Routine for Docker + Backend + Frontend
# ASCII only - no Unicode characters

Write-Host ""
Write-Host "================================"
Write-Host "Safe Startup Routine"
Write-Host "================================"
Write-Host ""

# Step 1: Check Docker status
Write-Host "Step 1: Checking Docker status..."
try {
    docker version 2>&1 | Out-Null
    Write-Host "[OK] Docker is running"
} catch {
    Write-Host "[WARN] Docker not available - starting Docker Desktop..."
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "[INFO] Waiting 30 seconds for Docker to start..."
        Start-Sleep -Seconds 30
    } else {
        Write-Host "[ERROR] Docker not found at $dockerPath"
        exit 1
    }
}

# Step 2: Start docker-compose services
Write-Host ""
Write-Host "Step 2: Starting Docker containers..."

cd c:\Users\bmarn\OneDrive\HTML\extractor

Write-Host "[INFO] Stopping old containers..."
docker-compose down 2>&1 | Out-Null

Write-Host "[INFO] Starting new containers..."
docker-compose up -d 2>&1 | Out-Null

Write-Host "[INFO] Waiting 15 seconds for containers to stabilize..."
Start-Sleep -Seconds 15

# Step 3: Validate containers are running
Write-Host ""
Write-Host "Step 3: Validating containers..."

$containers = docker ps --format "table {{.Names}}"
$backend_ok = $containers -match "extractor-backend"
$postgres_ok = $containers -match "extractor-postgres"

if ($backend_ok) { 
    Write-Host "[OK] Backend container is running" 
} else { 
    Write-Host "[WARN] Backend container not found" 
}

if ($postgres_ok) { 
    Write-Host "[OK] PostgreSQL container is running" 
} else { 
    Write-Host "[WARN] PostgreSQL container not found" 
}

# Step 4: Backend health check
Write-Host ""
Write-Host "Step 4: Waiting for backend health check..."

$maxAttempts = 60
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health/build" `
            -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Backend is healthy and responding"
            $healthy = $true
            break
        }
    } catch {
        $attempt++
        if ($attempt % 10 -eq 0) {
            Write-Host "[INFO] Still waiting... ($attempt/$maxAttempts seconds)"
        }
        Start-Sleep -Seconds 1
    }
}

if (!$healthy) {
    Write-Host ""
    Write-Host "[ERROR] Backend health check timeout after 60 seconds"
    Write-Host ""
    Write-Host "Troubleshooting steps:"
    Write-Host "1. Check backend logs: docker-compose logs backend --tail=50"
    Write-Host "2. Check port mapping: docker ps"
    Write-Host "3. Verify port 3000 is listening: netstat -ano | findstr :3000"
    Write-Host ""
    exit 1
}

# Success!
Write-Host ""
Write-Host "================================"
Write-Host "SUCCESS - Startup Complete"
Write-Host "================================"
Write-Host ""
Write-Host "Services ready:"
Write-Host "  * Frontend: http://localhost:5173"
Write-Host "  * Backend API: http://localhost:3000"
Write-Host "  * Database: localhost:5432"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. In new terminal: cd frontend && npm run dev"
Write-Host "  2. Open http://localhost:5173 in browser"
Write-Host "  3. Check Dashboard for Phase 22 features"
Write-Host ""
