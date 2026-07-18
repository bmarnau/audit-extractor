#################################################################################
# AUDIT-SAFE DOCUMENT EXTRACTOR - STOP SCRIPT
# Version: 0.37.1 | Phase: 45 Finalization
# Purpose: Graceful shutdown of all containers with status verification
#################################################################################

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'

# Project Configuration
$projectRoot = Get-Location
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Colors
$success = 'Green'
$error_color = 'Red'
$warning_color = 'Yellow'
$info_color = 'Cyan'

# Helper Functions
function Write-Success { 
    Write-Host ("PASS: " + $args[0]) -ForegroundColor $success
}

function Write-Error-Custom { 
    Write-Host ("FAIL: " + $args[0]) -ForegroundColor $error_color
}

function Write-Warn { 
    Write-Host ("WARN: " + $args[0]) -ForegroundColor $warning_color
}

function Write-Info { 
    Write-Host ("INFO: " + $args[0]) -ForegroundColor $info_color
}

function Write-Header {
    param([string]$header)
    $sep = "=" * 70
    Write-Host ""
    Write-Host $sep -ForegroundColor Magenta
    Write-Host $header -ForegroundColor Magenta
    Write-Host $sep -ForegroundColor Magenta
}

# ============================================================================
# SHUTDOWN PROCESS
# ============================================================================

Write-Header "AUDIT-SAFE EXTRACTOR - SHUTDOWN PROCESS"

Write-Info "Version: 0.37.1 (Phase 45)"
Write-Info "Timestamp: $timestamp"
Write-Info "Location: $projectRoot"

Write-Host ""
Write-Host "[Stopping Services]" -ForegroundColor $info_color

# Check current status
Write-Info "Checking current Docker Compose status..."
$psOutput = docker-compose ps 2>&1

if ($psOutput -like "*extractor-*") {
    Write-Info "Found running containers - proceeding with shutdown"
} else {
    Write-Warn "No containers found - already stopped"
    exit 0
}

# Perform shutdown
Write-Info "Stopping all containers..."

if ($Force) {
    Write-Warn "Force shutdown enabled"
    docker-compose down --remove-orphans 2>&1 | ForEach-Object { Write-Host "  $_" }
} else {
    docker-compose down 2>&1 | ForEach-Object { Write-Host "  $_" }
}

if ($LASTEXITCODE -eq 0) {
    Write-Success "Shutdown completed successfully"
} else {
    Write-Warn "Shutdown returned non-zero exit code"
}

# Verify shutdown
Write-Info "Verifying all containers stopped..."
Start-Sleep -Seconds 2

$finalStatus = docker-compose ps 2>&1
if ($finalStatus -like "*No services running*" -or $finalStatus -like "*Status*" -and -not ($finalStatus -like "*Up*")) {
    Write-Success "All containers successfully stopped"
} else {
    Write-Warn "Some containers may still be stopping"
}

Write-Host ""
Write-Info "Resources:"
Write-Info "  View Docker logs: docker-compose logs [service]"
Write-Info "  Restart services: .\start-app.ps1"
Write-Info "  Force cleanup: .\stop-app.ps1 -Force"

Write-Host ""
Write-Success "Shutdown complete"
Write-Host ""

exit 0
