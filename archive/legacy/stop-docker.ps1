# ============================================================
# Audit-Safe Document Extractor - Docker Stop Script (PowerShell)
# Version: 0.18.0
# Purpose: Stop Docker Compose containers with PowerShell options
# ============================================================

param(
    [switch]$RemoveVolumes = $false,
    [switch]$Verbose = $false
)

function Write-Success {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " $args"
}

function Write-Error-Custom {
    Write-Host "[ERR]" -ForegroundColor Red -NoNewline
    Write-Host " $args"
}

function Write-Warning-Custom {
    Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline
    Write-Host " $args"
}

function Write-Info {
    Write-Host "[INFO]" -ForegroundColor Cyan -NoNewline
    Write-Host " $args"
}

function Write-Waiting {
    Write-Host "[WAIT]" -ForegroundColor Magenta -NoNewline
    Write-Host " $args"
}

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $ScriptDir

Write-Host ""
Write-Info "Stopping Docker Compose containers..."
Write-Host ""

# Check if Docker is available
$DockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if (-not $DockerAvailable) {
    Write-Error-Custom "Docker not found in PATH"
    Pop-Location
    exit 1
}

# Check if compose is running
try {
    $ComposeStatus = docker-compose ps 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Docker Compose not running or Docker Desktop unavailable"
        Pop-Location
        exit 0
    }
} catch {
    Write-Error-Custom "Failed to check Docker Compose status"
    Pop-Location
    exit 1
}

# Graceful shutdown
Write-Waiting "Sending shutdown signal to containers..."

if ($RemoveVolumes) {
    docker-compose down -v
} else {
    docker-compose down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Success "Docker Compose stopped successfully"
    Write-Info "All containers have been stopped"
    Write-Host ""
    
    if ($RemoveVolumes) {
        Write-Info "Volumes have been removed"
    } else {
        Write-Host "[TIP]" -ForegroundColor Magenta -NoNewline
        Write-Host " To remove volumes: stop-docker.ps1 -RemoveVolumes"
    }
} else {
    Write-Host ""
    Write-Error-Custom "Failed to stop Docker Compose"
    Pop-Location
    exit 1
}

Write-Host "[TIP]" -ForegroundColor Magenta -NoNewline
Write-Host " To view logs: docker-compose logs -f"
Write-Host ""

Pop-Location
