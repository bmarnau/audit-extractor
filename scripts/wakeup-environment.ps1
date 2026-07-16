<#
.SYNOPSIS
    Environment Wakeup Script - Systeminitialisierung nach Pause
    
.DESCRIPTION
    Startet die gesamte Umgebung (Docker, Services, Browser) mit einem Befehl.
    9-Step-Prozess fuer vollstaendige Systeminitialisierung.
    
.PARAMETER NoWakeupCall
    Ueberspringe POST /api/system/wakeup Aufruf
    
.PARAMETER NoBrowser
    Ueberspringe Browser-Launch
    
.EXAMPLE
    .\wakeup-environment.ps1
    .\wakeup-environment.ps1 -NoBrowser
#>

param(
    [switch]$NoWakeupCall,
    [switch]$NoBrowser
)

# Configuration
$BackendUrl = "http://localhost:3000"
$FrontendUrl = "http://localhost"
$TechnicalAuditUrl = "http://localhost/technical-audit"

# Symbols (ASCII-safe)
$Symbols = @{
    Check   = '[OK]'
    Cross   = '[X]'
    Warning = '[!]'
    Arrow   = '==>'
    Waiting = '...'
}

# Colors
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
    Waiting = 'DarkGray'
    Arrow   = 'Cyan'
    Skipped = 'DarkGray'
}

# Helper Functions
function Write-Status {
    param(
        [string]$Message,
        [string]$Status = 'Info'
    )
    
    $symbol = switch($Status) {
        'Success' { $Symbols.Check; break }
        'Error'   { $Symbols.Cross; break }
        'Warning' { $Symbols.Warning; break }
        'Waiting' { $Symbols.Waiting; break }
        'Arrow'   { $Symbols.Arrow; break }
        default   { '-' }
    }
    
    $color = $Colors[$Status]
    if (-not $color) { $color = 'White' }
    Write-Host "$symbol $Message" -ForegroundColor $color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Wait-ForEndpoint {
    param(
        [string]$Url,
        [int]$MaxRetries = 40,
        [int]$RetryDelay = 1
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "$Url/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Quiet - service not ready yet
        }
        
        $retries++
        if ($retries % 5 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        Start-Sleep -Seconds $RetryDelay
    }
    return $false
}

function Test-Docker {
    try {
        $output = docker version 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerRunning {
    try {
        $output = docker ps 2>&1
        return $true
    }
    catch {
        return $false
    }
}

# Main Process
Write-Section "ENVIRONMENT WAKEUP - Phase 40+"

$startTime = Get-Date
$steps = @()

# Step 1: Check Docker
Write-Status "Step 1: Checking Docker installation..." "Arrow"
$step1Start = Get-Date
if (Test-Docker) {
    Write-Status "Docker found" "Success"
    $steps += @{
        name    = "Docker Check"
        status  = "Success"
        duration = ((Get-Date) - $step1Start).TotalSeconds
    }
}
else {
    Write-Status "Docker not found" "Warning"
    $steps += @{
        name    = "Docker Check"
        status  = "Warning"
        details = "Docker not available in PATH"
        duration = ((Get-Date) - $step1Start).TotalSeconds
    }
}

# Step 2: Verify Docker Engine
Write-Status "Step 2: Verifying Docker engine..." "Arrow"
$step2Start = Get-Date
$dockerRetries = 0
while ($dockerRetries -lt 10 -and -not (Test-DockerRunning)) {
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 2
    $dockerRetries++
}

if (Test-DockerRunning) {
    Write-Status "Docker engine responsive" "Success"
    $steps += @{
        name     = "Docker Engine"
        status   = "Success"
        duration = ((Get-Date) - $step2Start).TotalSeconds
    }
}
else {
    Write-Status "Docker engine not responding" "Error"
    $steps += @{
        name     = "Docker Engine"
        status   = "Error"
        details  = "Could not connect to Docker daemon"
        duration = ((Get-Date) - $step2Start).TotalSeconds
    }
    exit 1
}

# Step 3: Start Containers
Write-Status "Step 3: Starting Docker containers..." "Arrow"
$step3Start = Get-Date
try {
    Write-Host "  Running: docker compose up -d"
    docker compose up -d 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Status "Containers started" "Success"
    $steps += @{
        name     = "Container Startup"
        status   = "Success"
        duration = ((Get-Date) - $step3Start).TotalSeconds
    }
}
catch {
    Write-Status "Failed to start containers: $_" "Error"
    $steps += @{
        name     = "Container Startup"
        status   = "Error"
        error    = $_
        duration = ((Get-Date) - $step3Start).TotalSeconds
    }
}

# Step 4: Wait for Backend
Write-Status "Step 4: Waiting for backend service..." "Arrow"
$step4Start = Get-Date
Write-Host "  Polling $BackendUrl/health" -ForegroundColor Gray
if (Wait-ForEndpoint $BackendUrl 40 1) {
    Write-Status "Backend is healthy" "Success"
    $steps += @{
        name     = "Backend Health"
        status   = "Success"
        duration = ((Get-Date) - $step4Start).TotalSeconds
    }
}
else {
    Write-Status "Backend did not become healthy within timeout" "Warning"
    $steps += @{
        name     = "Backend Health"
        status   = "Warning"
        details  = "Timeout waiting for backend"
        duration = ((Get-Date) - $step4Start).TotalSeconds
    }
}

# Step 5: Wait for Frontend
Write-Status "Step 5: Waiting for frontend service..." "Arrow"
$step5Start = Get-Date
Write-Host "  Polling $FrontendUrl/health" -ForegroundColor Gray
if (Wait-ForEndpoint $FrontendUrl 20 1) {
    Write-Status "Frontend is healthy" "Success"
    $steps += @{
        name     = "Frontend Health"
        status   = "Success"
        duration = ((Get-Date) - $step5Start).TotalSeconds
    }
}
else {
    Write-Status "Frontend did not become healthy within timeout" "Warning"
    $steps += @{
        name     = "Frontend Health"
        status   = "Warning"
        details  = "Timeout waiting for frontend"
        duration = ((Get-Date) - $step5Start).TotalSeconds
    }
}

# Step 6: System Wakeup Call
if (-not $NoWakeupCall) {
    Write-Status "Step 6: Triggering system wakeup..." "Arrow"
    $step6Start = Get-Date
    try {
        Write-Host "  POST $BackendUrl/api/system/wakeup" -ForegroundColor Gray
        $wakeupResponse = Invoke-WebRequest `
            -Uri "$BackendUrl/api/system/wakeup" `
            -Method Post `
            -ContentType "application/json" `
            -TimeoutSec 30 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($wakeupResponse.StatusCode -eq 200) {
            $wakeupData = $wakeupResponse.Content | ConvertFrom-Json
            $wakeupDuration = $wakeupData.duration
            Write-Status "System wakeup complete (${wakeupDuration}ms)" "Success"
            $steps += @{
                name     = "System Wakeup"
                status   = "Success"
                duration = ((Get-Date) - $step6Start).TotalSeconds
                details  = "Wakeup took ${wakeupDuration}ms"
            }
        }
    }
    catch {
        Write-Status "System wakeup call failed: $_" "Warning"
        $steps += @{
            name     = "System Wakeup"
            status   = "Warning"
            error    = $_
            duration = ((Get-Date) - $step6Start).TotalSeconds
        }
    }
}
else {
    Write-Status "Step 6: Skipped (NoWakeupCall parameter)" "Warning"
    $steps += @{
        name     = "System Wakeup"
        status   = "Skipped"
        duration = 0
    }
}

# Step 7: Verify System Status
Write-Status "Step 7: Verifying system status..." "Arrow"
$step7Start = Get-Date
try {
    Write-Host "  GET $BackendUrl/api/system/wakeup/status" -ForegroundColor Gray
    $statusResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/system/wakeup/status" `
        -Method Get `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $statusData = $statusResponse.Content | ConvertFrom-Json
    $components = $statusData.components.PSObject.Properties
    $activeCount = ($components | Where-Object { $_.Value.status -eq "active" } | Measure-Object).Count
    $totalCount = ($components | Measure-Object).Count
    
    if ($totalCount -gt 0) {
        $qualityPercent = [math]::Round(($activeCount / $totalCount) * 100, 0)
    } else {
        $qualityPercent = 0
    }
    
    Write-Status "System status: ${qualityPercent}% quality (${activeCount}/${totalCount} components active)" "Success"
    $steps += @{
        name     = "Status Verification"
        status   = "Success"
        duration = ((Get-Date) - $step7Start).TotalSeconds
        details  = "$qualityPercent% quality"
    }
}
catch {
    Write-Status "Could not retrieve system status: $_" "Warning"
    $steps += @{
        name     = "Status Verification"
        status   = "Warning"
        error    = $_
        duration = ((Get-Date) - $step7Start).TotalSeconds
    }
}

# Step 8: Launch Browser
if (-not $NoBrowser) {
    Write-Status "Step 8: Launching browser..." "Arrow"
    $step8Start = Get-Date
    try {
        Write-Host "  Opening $TechnicalAuditUrl" -ForegroundColor Gray
        Start-Process $TechnicalAuditUrl
        Start-Sleep -Seconds 2
        Write-Status "Browser launched" "Success"
        $steps += @{
            name     = "Browser Launch"
            status   = "Success"
            duration = ((Get-Date) - $step8Start).TotalSeconds
        }
    }
    catch {
        Write-Status "Could not launch browser: $_" "Warning"
        $steps += @{
            name     = "Browser Launch"
            status   = "Warning"
            error    = $_
            duration = ((Get-Date) - $step8Start).TotalSeconds
        }
    }
}
else {
    Write-Status "Step 8: Skipped (NoBrowser parameter)" "Warning"
    $steps += @{
        name     = "Browser Launch"
        status   = "Skipped"
        duration = 0
    }
}

# Step 9: Summary Report
Write-Status "Step 9: Generating summary..." "Arrow"
$totalTime = ((Get-Date) - $startTime).TotalSeconds
$successCount = ($steps | Where-Object { $_.status -eq "Success" }).Count
$warningCount = ($steps | Where-Object { $_.status -eq "Warning" }).Count
$errorCount = ($steps | Where-Object { $_.status -eq "Error" }).Count

Write-Section "WAKEUP SUMMARY"
Write-Host ""
Write-Host "Total Duration: ${totalTime}s" -ForegroundColor Cyan
Write-Host "Results: $successCount successful, $warningCount warnings, $errorCount errors" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step Details:" -ForegroundColor Cyan
foreach ($step in $steps) {
    $statusColor = switch($step.status) {
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
        'Skipped' { 'Gray' }
        default   { 'White' }
    }
    $duration = [math]::Round($step.duration, 2)
    Write-Host "  [$($step.status)] $($step.name) (${duration}s)" -ForegroundColor $statusColor
    if ($step.details) { Write-Host "        -> $($step.details)" -ForegroundColor Gray }
    if ($step.error) { Write-Host "        -> Error: $($step.error)" -ForegroundColor Gray }
}
Write-Host ""

# Final Status
Write-Section "READY"
if ($errorCount -eq 0) {
    Write-Host "Environment is ready for use!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend:         $FrontendUrl" -ForegroundColor White
    Write-Host "  Backend API:      $BackendUrl" -ForegroundColor White
    Write-Host "  Technical Audit:  $TechnicalAuditUrl" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "Some services may not be fully operational" -ForegroundColor Yellow
}

Write-Host ""
