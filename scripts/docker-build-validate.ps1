# Docker Build Wrapper with Validation (PowerShell)
# 1. Pre-Build Validation
# 2. Docker Build
# 3. Post-Build File Verification
# 4. Detailed Reporting

param(
    [switch]$NoCache = $true,
    [string]$ProjectRoot = ".",
    [switch]$VerboseOutput = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "docker-build-report_$timestamp.txt"

function Log {
    param([string]$Message, [string]$Level = "INFO")
    $prefix = switch ($Level) {
        "INFO" { "[*] " }
        "SUCCESS" { "[+] " }
        "ERROR" { "[!] " }
        "WARNING" { "[?] " }
        default { "    " }
    }
    
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    
    $msg = "$prefix $Message"
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $reportFile -Value $msg
}

function SectionHeader {
    param([string]$Title)
    $line = "=" * 60
    Log $line
    Log "[>>] $Title" "INFO"
    Log $line
}

# Initialize report
Write-Host "[*] Docker Build Validation Report" -ForegroundColor Cyan
Write-Host "[*] Report: $reportFile" -ForegroundColor Gray
Write-Host ""

@"
Docker Build Validation Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Project Root: $ProjectRoot
No Cache: $NoCache
Verbose: $VerboseOutput

" | Out-File -FilePath $reportFile

# ============================================================================
# STEP 1: PRE-BUILD VALIDATION
# ============================================================================
SectionHeader "STEP 1: PRE-BUILD VALIDATION"

Log "Running pre-build checks..." "INFO"

$preCheckScript = Join-Path $ProjectRoot "scripts\pre-build-check.ps1"
if (-not (Test-Path $preCheckScript)) {
    Log "Pre-build check script not found: $preCheckScript" "ERROR"
    exit 1
}

try {
    & $preCheckScript -ProjectRoot $ProjectRoot
    if ($LASTEXITCODE -eq 0) {
        Log "Pre-build validation passed" "SUCCESS"
    }
    else {
        Log "Pre-build validation failed" "ERROR"
        exit 1
    }
}
catch {
    Log "Pre-build validation error: $_" "ERROR"
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: DOCKER BUILD
# ============================================================================
SectionHeader "STEP 2: DOCKER BUILD EXECUTION"

Log "Starting Docker build..." "INFO"
Log "Command: docker compose build $(if ($NoCache) { '--no-cache' } else { '' })" "INFO"

$buildStart = Get-Date
$buildLogFile = "docker-build_$timestamp.log"

try {
    if ($NoCache) {
        docker compose build --no-cache *> $buildLogFile
    }
    else {
        docker compose build *> $buildLogFile
    }
    
    $buildExitCode = $LASTEXITCODE
    $buildEnd = Get-Date
    $buildDuration = ($buildEnd - $buildStart).TotalSeconds
    
    if ($buildExitCode -eq 0) {
        Log "Docker build completed successfully in $buildDuration seconds" "SUCCESS"
        Log "Build log: $buildLogFile" "INFO"
    }
    else {
        Log "Docker build failed with exit code $buildExitCode" "ERROR"
        Log "Build log: $buildLogFile" "INFO"
        
        # Show last 30 lines of build log
        Write-Host ""
        Write-Host "Last 30 lines of build output:" -ForegroundColor Yellow
        Get-Content $buildLogFile -Tail 30 | ForEach-Object { Write-Host "  $_" }
        
        exit 1
    }
}
catch {
    Log "Docker build error: $_" "ERROR"
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 3: CONTAINER STARTUP
# ============================================================================
SectionHeader "STEP 3: STARTING CONTAINERS"

Log "Starting Docker Compose services..." "INFO"

try {
    docker compose up -d
    Start-Sleep -Seconds 10
    
    # Check container status
    $containers = docker compose ps --format "json" | ConvertFrom-Json
    $healthyCount = ($containers | Where-Object { $_.State -eq "running" }).Count
    $totalCount = $containers.Count
    
    Log "Containers running: $healthyCount / $totalCount" "INFO"
    
    foreach ($container in $containers) {
        $statusIcon = if ($container.State -eq "running") { "✅" } else { "❌" }
        Log "$statusIcon $($container.Service): $($container.State)" "INFO"
    }
}
catch {
    Log "Error starting containers: $_" "ERROR"
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 4: POST-BUILD VERIFICATION
# ============================================================================
SectionHeader "STEP 4: POST-BUILD FILE VERIFICATION"

Log "Waiting for backend container to be ready..." "INFO"
Start-Sleep -Seconds 10

$verifyScript = Join-Path $ProjectRoot "scripts\verify-docker-copy.ps1"
if (-not (Test-Path $verifyScript)) {
    Log "Verification script not found: $verifyScript" "ERROR"
    exit 1
}

try {
    & $verifyScript -ContainerName "extractor-backend"
    $verifyExitCode = $LASTEXITCODE
    
    if ($verifyExitCode -eq 0) {
        Log "File verification passed - all critical files present" "SUCCESS"
    }
    else {
        Log "File verification failed - some files missing" "ERROR"
        exit 1
    }
}
catch {
    Log "File verification error: $_" "ERROR"
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 5: API HEALTH CHECK
# ============================================================================
SectionHeader "STEP 5: API HEALTH CHECK"

Log "Checking backend API health..." "INFO"

$maxAttempts = 10
$attempt = 0
$healthOk = $false

while ($attempt -lt $maxAttempts -and -not $healthOk) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Log "✅ Backend API is healthy (200 OK)" "SUCCESS"
            $healthOk = $true
        }
    }
    catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Log "Attempt $attempt/$maxAttempts: API not ready yet, retrying..." "INFO"
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $healthOk) {
    Log "Backend API health check failed after $maxAttempts attempts" "WARNING"
}

Log "Checking help/release-notes endpoint..." "INFO"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/help/release-notes" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $data = $response.Content | ConvertFrom-Json
    $noteCount = $data.data.notes.Count
    Log "✅ Release notes endpoint responding with $noteCount notes" "SUCCESS"
}
catch {
    Log "⚠️ Release notes endpoint check failed: $_" "WARNING"
}

Write-Host ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
SectionHeader "BUILD SUMMARY"

Log "✅ Docker build and validation completed successfully!" "SUCCESS"
Log "Report saved to: $reportFile" "INFO"
Log "Build log saved to: $buildLogFile" "INFO"
Log ""
Log "Next steps:" "INFO"
Log "  - Visit http://localhost:5173 for frontend" "INFO"
Log "  - Backend API: http://localhost:3000/api" "INFO"
Log "  - PgAdmin: http://localhost:5050" "INFO"

Write-Host ""
Write-Host "✅ BUILD PROCESS COMPLETE" -ForegroundColor Green
