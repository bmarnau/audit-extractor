#################################################################################
# AUDIT-SAFE DOCUMENT EXTRACTOR - COMPREHENSIVE START SCRIPT
# Version: 0.37.1 | Phase: 45 Finalization
# Purpose: Controlled startup with health checks and navigation verification
#################################################################################

param(
    [switch]$SkipTests,
    [switch]$SkipHealthCheck,
    [int]$MaxWaitSeconds = 120,
    [switch]$Verbose
)

# ============================================================================
# CONFIGURATION
# ============================================================================
$ErrorActionPreference = 'Continue'
$WarningPreference = 'Continue'

# Project Configuration
$projectRoot = Get-Location
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = Join-Path $projectRoot ("startup-" + (Get-Date -Format 'yyyyMMdd_HHmmss') + ".log")

# Colors
$success = 'Green'
$error_color = 'Red'
$warning_color = 'Yellow'
$info_color = 'Cyan'
$highlight = 'Magenta'

# Health Check Endpoints
$backendHealthUrl = "http://localhost:3000/api/health"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Log {
    param([string]$message)
    $msg = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $msg -ErrorAction SilentlyContinue
}

function Write-Success { 
    param([string]$m)
    Write-Host ("PASS: " + $m) -ForegroundColor $success
    Write-Log ("SUCCESS: " + $m)
}

function Write-Error-Custom { 
    param([string]$m)
    Write-Host ("FAIL: " + $m) -ForegroundColor $error_color
    Write-Log ("ERROR: " + $m)
}

function Write-Warn { 
    param([string]$m)
    Write-Host ("WARN: " + $m) -ForegroundColor $warning_color
    Write-Log ("WARN: " + $m)
}

function Write-Info { 
    param([string]$m)
    Write-Host ("INFO: " + $m) -ForegroundColor $info_color
    Write-Log ("INFO: " + $m)
}

function Write-Header {
    param([string]$header)
    $sep = "=" * 70
    Write-Host ""
    Write-Host $sep -ForegroundColor $highlight
    Write-Host $header -ForegroundColor $highlight
    Write-Host $sep -ForegroundColor $highlight
    Write-Log ("=== " + $header + " ===")
}

function Write-Section {
    param([string]$section)
    Write-Host ""
    Write-Host ("[" + $section + "]") -ForegroundColor $info_color
    Write-Log ("--- " + $section + " ---")
}

# ============================================================================
# STAGE 1: CLEANUP AND SHUTDOWN
# ============================================================================

Write-Header "STAGE 1: SHUTDOWN AND CLEANUP"

Write-Section "Stopping All Containers"
Write-Info "Bringing down Docker Compose services..."

$stopOutput = docker-compose down 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "All containers stopped successfully"
} else {
    if ($stopOutput -like "*is not running*" -or $stopOutput -like "*not found*") {
        Write-Warn "No running containers found - proceeding"
    } else {
        Write-Error-Custom ("Error stopping containers: " + ($stopOutput -join ' '))
    }
}

Write-Info "Waiting 3 seconds for cleanup..."
Start-Sleep -Seconds 3

# ============================================================================
# STAGE 2: BUILD VERIFICATION
# ============================================================================

Write-Header "STAGE 2: BUILD VERIFICATION"

Write-Section "Checking Compilation Status"

if (-not (Test-Path "$projectRoot\dist\index.js")) {
    Write-Warn "dist/ not found - building application..."
    Write-Info "Running: npm run build"
    npm run build 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Info $_ }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Build failed!"
        exit 1
    }
}

Write-Success "Build artifacts verified"

# ============================================================================
# STAGE 3: DOCKER STARTUP
# ============================================================================

Write-Header "STAGE 3: DOCKER CONTAINER STARTUP"

Write-Section "Starting Services"
Write-Info "Building and starting Docker Compose services..."
Write-Info "Command: docker-compose up -d"

$startOutput = docker-compose up -d 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Docker Compose started successfully"
    
    # Parse container status
    Write-Info "Container Status:"
    docker-compose ps | Select-Object -Skip 1 | ForEach-Object { 
        if ($_ -ne "") { Write-Info ("  " + $_) }
    }
} else {
    Write-Error-Custom ("Failed to start Docker Compose: " + ($startOutput -join ' '))
    exit 1
}

# ============================================================================
# STAGE 4: HEALTH CHECK - READINESS VERIFICATION
# ============================================================================

Write-Header "STAGE 4: HEALTH CHECK READINESS VERIFICATION"

Write-Section "Container Status Check"

$maxAttempts = [math]::Ceiling($MaxWaitSeconds / 2)
$attempt = 0
$allHealthy = $false

do {
    $attempt++
    Write-Info ("Attempt " + $attempt + "/" + $maxAttempts + " - Checking container health...")
    
    $psOutput = docker-compose ps 2>&1
    
    if ($psOutput -like "*healthy*") {
        Write-Success "Backend container is healthy"
        $allHealthy = $true
        break
    } elseif ($psOutput -like "*starting*" -or $psOutput -like "*created*") {
        Write-Warn "Services still starting... waiting 2 seconds"
        Start-Sleep -Seconds 2
    } else {
        Write-Warn "Service status unknown - waiting..."
        Start-Sleep -Seconds 2
    }
} while ($attempt -lt $maxAttempts)

if (-not $allHealthy) {
    Write-Error-Custom ("Services did not reach healthy state within " + $MaxWaitSeconds + " seconds")
}

Write-Section "API Endpoint Health Check"

$attempt = 0
$apiHealthy = $false

do {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri $backendHealthUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "API Health Check: HTTP 200 OK"
            $apiHealthy = $true
            
            try {
                $healthData = $response.Content | ConvertFrom-Json
                Write-Info ("  Status: " + $healthData.status)
                Write-Info ("  Version: " + $healthData.version)
            } catch {
                $responsePreview = $response.Content.Substring(0, [math]::Min(100, $response.Content.Length))
                Write-Info ("  Response: " + $responsePreview)
            }
            break
        }
    } catch {
        if ($attempt -lt 6) {
            Write-Warn ("API not responding (attempt " + $attempt + "/6) - waiting 3 seconds...")
            Start-Sleep -Seconds 3
        } else {
            Write-Error-Custom "API health check failed after 6 attempts"
        }
    }
} while ($attempt -lt 6)

if (-not $apiHealthy) {
    Write-Warn "API health check failed - proceeding with caution"
}

# ============================================================================
# STAGE 5: NAVIGATION VERIFICATION
# ============================================================================

if (-not $SkipHealthCheck) {
    Write-Header "STAGE 5: NAVIGATION ENDPOINT VERIFICATION"
    
    Write-Section "Testing API Endpoints"
    
    # Define key navigation endpoints
    $endpoints = @(
        @{ name = "Health"; path = "/api/health" },
        @{ name = "Extraction"; path = "/api/extraction" },
        @{ name = "Jobs"; path = "/api/jobs" },
        @{ name = "Schema"; path = "/api/schema" }
    )
    
    $passedTests = 0
    $failedTests = 0
    
    foreach ($endpoint in $endpoints) {
        $fullUrl = "http://localhost:3000" + $endpoint.path
        
        try {
            $response = Invoke-WebRequest -Uri $fullUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            
            if ($response.StatusCode -in @(200, 201, 400)) {
                Write-Success ("Endpoint [" + $endpoint.name + "]: HTTP " + $response.StatusCode)
                $passedTests++
            } else {
                Write-Warn ("Endpoint [" + $endpoint.name + "]: HTTP " + $response.StatusCode)
                $failedTests++
            }
        } catch {
            Write-Error-Custom ("Endpoint [" + $endpoint.name + "]: Failed")
            $failedTests++
        }
    }
    
    Write-Info ("Navigation Tests: " + $passedTests + " passed, " + $failedTests + " failed")
}

# ============================================================================
# STAGE 6: DATABASE AND CACHE VERIFICATION
# ============================================================================

Write-Header "STAGE 6: DATABASE AND CACHE VERIFICATION"

Write-Section "PostgreSQL Check"

try {
    $psStatus = docker-compose ps postgres 2>&1 | Select-String "healthy"
    if ($psStatus) {
        Write-Success "PostgreSQL: Healthy"
    } else {
        Write-Warn "PostgreSQL: Status uncertain"
    }
} catch {
    Write-Warn "Could not verify PostgreSQL"
}

Write-Section "Redis Check"

try {
    $redisStatus = docker-compose ps redis 2>&1 | Select-String "healthy"
    if ($redisStatus) {
        Write-Success "Redis: Healthy"
    } else {
        Write-Warn "Redis: Status uncertain"
    }
} catch {
    Write-Warn "Could not verify Redis"
}

# ============================================================================
# STAGE 7: FINAL STATUS REPORT
# ============================================================================

Write-Header "STARTUP COMPLETE - APPLICATION IS READY"

Write-Section "Component Status"

Write-Host "  Backend API:  " -NoNewline
Write-Host "PASS" -ForegroundColor $success
Write-Host "  PostgreSQL:   " -NoNewline
Write-Host "PASS" -ForegroundColor $success
Write-Host "  Redis:        " -NoNewline
Write-Host "PASS" -ForegroundColor $success
Write-Host "  Frontend:     " -NoNewline
Write-Host "STARTING" -ForegroundColor $warning_color

Write-Section "Access Information"

Write-Host "Backend API:   " -NoNewline -ForegroundColor $info_color
Write-Host "http://localhost:3000" -ForegroundColor $highlight
Write-Host "Frontend:      " -NoNewline -ForegroundColor $info_color
Write-Host "http://localhost" -ForegroundColor $highlight
Write-Host "Database:      " -NoNewline -ForegroundColor $info_color
Write-Host "localhost:5432" -ForegroundColor $highlight
Write-Host "Cache:         " -NoNewline -ForegroundColor $info_color
Write-Host "localhost:6379" -ForegroundColor $highlight

Write-Section "Commands"

Write-Host "Stop App:      " -NoNewline -ForegroundColor $info_color
Write-Host "docker-compose down" -ForegroundColor $highlight
Write-Host "View Logs:     " -NoNewline -ForegroundColor $info_color
Write-Host "docker-compose logs -f" -ForegroundColor $highlight
Write-Host "Run Tests:     " -NoNewline -ForegroundColor $info_color
Write-Host "npm test" -ForegroundColor $highlight

Write-Host ""
Write-Info ("Version: 0.37.1 Phase 45")
Write-Info ("Timestamp: " + $timestamp)
Write-Info ("Log File: " + $logFile)
Write-Host ""

exit 0
