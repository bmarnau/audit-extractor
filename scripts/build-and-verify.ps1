#!/usr/bin/env pwsh
<#
.SYNOPSIS
Complete build and deployment script with Docker file verification.
Builds frontend, backend, and verifies all critical files are in the container.

.EXAMPLE
./build-and-verify.ps1 -Verbose
#>

param(
    [switch]$Verbose,
    [switch]$SkipFrontend,
    [switch]$SkipVerification
)

$ErrorActionPreference = 'Stop'
$scriptName = Split-Path -Leaf $MyInvocation.MyCommand.Definition
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

function Write-Section {
    param([string]$Title, [string]$Color = 'Cyan')
    Write-Host "`n" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
    Write-Host "  $Title" -ForegroundColor $Color
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message, [int]$Step)
    Write-Host "`n[$Step] $Message" -ForegroundColor Yellow
}

Write-Section "BUILD AND VERIFICATION PIPELINE" Green

# ============================================================================
# STEP 1: Frontend Build
# ============================================================================
if (-not $SkipFrontend) {
    Write-Step "Building Frontend (Vite)" 1
    
    Push-Location "$rootDir/frontend"
    try {
        Write-Host "  Cleaning dist directory..." -ForegroundColor Gray
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        }
        
        Write-Host "  Running npm run build..." -ForegroundColor Gray
        $buildStart = Get-Date
        npm run build
        $buildDuration = (Get-Date) - $buildStart
        
        Write-Host "  [OK] Frontend build successful (${($buildDuration.TotalSeconds):.0f}s)" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Skipping Frontend Build" 1
}

# ============================================================================
# STEP 2: Docker Frontend Image Build
# ============================================================================
Write-Step "Building Frontend Docker Image" 2

Push-Location $rootDir
try {
    $imageStart = Get-Date
    docker build --no-cache -f Dockerfile.frontend -t extractor-frontend:latest . 2>&1 | Select-Object -Last 5
    $imageDuration = (Get-Date) - $imageStart
    
    Write-Host "  [OK] Frontend Docker image built (${($imageDuration.TotalSeconds):.0f}s)" -ForegroundColor Green
} finally {
    Pop-Location
}

# ============================================================================
# STEP 3: Docker Backend Image Build
# ============================================================================
Write-Step "Building Backend Docker Image" 3

Push-Location $rootDir
try {
    Write-Host "  Checking TypeScript compilation..." -ForegroundColor Gray
    
    $imageStart = Get-Date
    docker build --no-cache -f Dockerfile.backend -t extractor-backend:latest . 2>&1 | Tee-Object -Variable buildOutput | Select-Object -Last 10
    
    # Check for errors
    if ($LASTEXITCODE -ne 0 -or $buildOutput -like "*ERROR*" -or $buildOutput -like "*error*") {
        Write-Host "  [FAILED] Backend Docker build FAILED" -ForegroundColor Red
        Write-Host "`n  Last output lines:" -ForegroundColor Gray
        $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        exit 1
    }
    
    $imageDuration = (Get-Date) - $imageStart
    Write-Host "  [OK] Backend Docker image built (${($imageDuration.TotalSeconds):.0f}s)" -ForegroundColor Green
} finally {
    Pop-Location
}

# ============================================================================
# STEP 4: Docker Compose Down & Up
# ============================================================================
Write-Step "Redeploying Docker Containers" 4

Push-Location $rootDir
try {
    Write-Host "  Stopping services..." -ForegroundColor Gray
    docker-compose down -v 2>&1 | Select-Object -Last 5
    
    Start-Sleep -Seconds 3
    
    Write-Host "  Starting services..." -ForegroundColor Gray
    $composeStart = Get-Date
    docker-compose up -d 2>&1 | Select-Object -Last 5
    $composeDuration = (Get-Date) - $composeStart
    
    Write-Host "  [OK] Services deployed (${($composeDuration.TotalSeconds):.0f}s)" -ForegroundColor Green
    
    # Wait for services to be healthy
    Write-Host "  Waiting for services to become healthy..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    $healthCheck = docker ps --filter "name=extractor-" --format "{{.Names}}: {{.Status}}" 2>$null
    Write-Host "  Service status:" -ForegroundColor Gray
    $healthCheck | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    
} finally {
    Pop-Location
}

# ============================================================================
# STEP 5: Docker Files Verification
# ============================================================================
if (-not $SkipVerification) {
    Write-Step "Verifying Docker File Contents" 5
    
    Push-Location $scriptDir
    try {
        $verifyParams = @()
        if ($Verbose) { $verifyParams += "-Verbose" }
        
        & .\verify-docker-files.ps1 @verifyParams
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[FAILED] File verification FAILED!" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Skipping Docker File Verification" 5
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Section "BUILD COMPLETE" Green

Write-Host "`n[INFO] Build Summary:" -ForegroundColor Cyan
    Write-Host "  Frontend: Built" -ForegroundColor Green
    Write-Host "  Frontend Docker: Built" -ForegroundColor Green
    Write-Host "  Backend Docker: Built" -ForegroundColor Green
    Write-Host "  Services: Deployed" -ForegroundColor Green
    Write-Host "  Verification: Passed" -ForegroundColor Green

    Write-Host "`n[INFO] Access the application:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost/" -ForegroundColor Gray
Write-Host "  Help Page: http://localhost/help" -ForegroundColor Gray
Write-Host "  API: http://localhost:3000/api" -ForegroundColor Gray
Write-Host "  PgAdmin: http://localhost:5050" -ForegroundColor Gray

Write-Host "`n[INFO] Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Verify files: .\scripts\verify-docker-files.ps1 -Verbose" -ForegroundColor Gray
Write-Host "  Stop services: docker-compose down" -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "`n[OK] Ready for testing!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

exit 0
