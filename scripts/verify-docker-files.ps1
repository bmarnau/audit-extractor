#!/usr/bin/env pwsh
<#
.SYNOPSIS
Verifies that critical documentation files are present in the Docker backend container.
This script runs after docker build and docker-compose up to ensure HelpContentLoader can find necessary files.

.DESCRIPTION
Checks for MANUAL, RELEASE_NOTES, and OPERATIONS_MANUAL files inside the backend container.
Fails the build if any critical files are missing.

.EXAMPLE
./verify-docker-files.ps1 -Verbose
#>

param(
    [string]$ContainerName = "extractor-backend",
    [switch]$Verbose
)

$ErrorActionPreference = 'Stop'
$scriptName = Split-Path -Leaf $MyInvocation.MyCommand.Definition

Write-Host "`n[INFO] $scriptName started" -ForegroundColor Green

# Critical files that MUST be in the container
$criticalFiles = @(
    '/app/MANUAL-0.35.0.md',
    '/app/OPERATIONS_MANUAL_V35.md',
    '/app/RELEASE_NOTES_0.35.0.md',
    '/app/README.md'
)

# Additional files to verify if container is running
$secondaryFiles = @(
    '/app/dist/index.js',
    '/app/dist/infrastructure/services/HelpContentLoader.js',
    '/app/extraction-rules',
    '/app/scripts',
    '/app/docs'
)

Write-Host "`n[CONFIG] Configuration:" -ForegroundColor Cyan
Write-Host "  Container: $ContainerName"
Write-Host "  Critical files to verify: $($criticalFiles.Count)"
Write-Host "  Secondary checks: $($secondaryFiles.Count)"

# Check if container exists and is running
Write-Host "`n[CHECK] Checking Docker container status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=$ContainerName" --format "{{.State}}" 2>$null
$containerExists = docker ps -a --filter "name=$ContainerName" --format "{{.ID}}" 2>$null

if (-not $containerExists) {
    Write-Host "  [WARNING] Container '$ContainerName' does not exist" -ForegroundColor Red
    Write-Host "`n[INFO] Build will continue - container may not be started yet" -ForegroundColor Yellow
    Write-Host "  Please run: docker-compose up -d" -ForegroundColor Gray
    exit 0
}

if ($containerStatus -ne "running") {
    Write-Host "  [WARNING] Container exists but is not running (status: $containerStatus)" -ForegroundColor Yellow
    Write-Host "`n[INFO] Build will continue - please start container with: docker-compose up -d" -ForegroundColor Yellow
    exit 0
}

Write-Host "  [OK] Container is running" -ForegroundColor Green

# Verify critical files exist in container
Write-Host "`n[VERIFY] Verifying critical documentation files:" -ForegroundColor Cyan
$missingFiles = @()
$foundFiles = @()

foreach ($file in $criticalFiles) {
    $checkCmd = "test -f $file && echo 'EXISTS' || echo 'MISSING'"
    $result = docker exec $ContainerName sh -c $checkCmd 2>$null
    
    if ($result -like "*EXISTS*") {
        Write-Host "  [OK] $file" -ForegroundColor Green
        $foundFiles += $file
        
        # Show file size if verbose
        if ($Verbose) {
            $sizeCmd = "wc -c < $file"
            $size = docker exec $ContainerName sh -c $sizeCmd 2>$null
            Write-Host "     Size: $size bytes" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

# Verify secondary components
Write-Host "`n[VERIFY] Verifying secondary components:" -ForegroundColor Cyan
$missingComponents = @()

foreach ($item in $secondaryFiles) {
    $checkCmd = "[ -e $item ] && echo 'EXISTS' || echo 'MISSING'"
    $result = docker exec $ContainerName sh -c $checkCmd 2>$null
    
    if ($result -like "*EXISTS*") {
        Write-Host "  [OK] $item" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] $item" -ForegroundColor Yellow
        $missingComponents += $item
    }
}

# Check HelpContentLoader service can be loaded
Write-Host "`n[CHECK] Checking HelpContentLoader service..." -ForegroundColor Cyan
$helperCmd = "ls -la /app/dist/infrastructure/services/ | grep -i help"
$helperFiles = docker exec $ContainerName sh -c $helperCmd 2>$null

if ($helperFiles) {
    Write-Host "  [OK] HelpContentLoader found" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "     Files:" -ForegroundColor Gray
        foreach ($line in ($helperFiles -split "`n")) {
            Write-Host "     $line" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  [MISSING] HelpContentLoader not found in dist" -ForegroundColor Red
    $missingFiles += "HelpContentLoader.js"
}

# Test API endpoint (bonus check)
Write-Host "`n[TEST] Testing /api/help/manual endpoint..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/help/manual" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $jsonData = $apiResponse.Content | ConvertFrom-Json
    $version = $jsonData.data.version
    $firstChapter = $jsonData.data.chapters[0].title
    
    Write-Host "  [OK] API responding" -ForegroundColor Green
    Write-Host "     Version: $version" -ForegroundColor Gray
    Write-Host "     First chapter: $firstChapter" -ForegroundColor Gray
    
    if ($version -eq "0.35.0") {
        Write-Host "  [OK] CORRECT VERSION 0.35.0" -ForegroundColor Green
    } elseif ($version -eq "0.18.0") {
        Write-Host "  [ERROR] WRONG VERSION - Shows 0.18.0 instead of 0.35.0!" -ForegroundColor Red
        $missingFiles += "Correct MANUAL version"
    } else {
        Write-Host "  [WARN] Unexpected version: $version" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] API not responding yet (container may still be starting)" -ForegroundColor Yellow
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Summary Report
Write-Host "`n" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor White
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor White

Write-Host "`nCritical Files:" -ForegroundColor Cyan
Write-Host "  Found: $($foundFiles.Count)/$($criticalFiles.Count)" -ForegroundColor $(if ($foundFiles.Count -eq $criticalFiles.Count) { 'Green' } else { 'Red' })
if ($missingFiles.Count -gt 0) {
    Write-Host "  Missing files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "    * $file" -ForegroundColor Red
    }
}

if ($missingComponents.Count -gt 0) {
    Write-Host "`nMissing Components:" -ForegroundColor Yellow
    Write-Host "  Count: $($missingComponents.Count)" -ForegroundColor Yellow
    foreach ($comp in $missingComponents) {
        Write-Host "    * $comp" -ForegroundColor Yellow
    }
}

# Final status
Write-Host "`n" -ForegroundColor White
if ($missingFiles.Count -eq 0 -and $missingComponents.Count -eq 0) {
    Write-Host "[OK] ALL CHECKS PASSED - Docker image is ready!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    exit 0
} elseif ($missingFiles.Count -gt 0) {
    Write-Host "[ERROR] CRITICAL FILES MISSING - Build verification FAILED!" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "`n[ACTION] Fix Dockerfile.backend COPY commands for these files:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "    * $file" -ForegroundColor Yellow
    }
    exit 1
} else {
    Write-Host "[WARN] WARNINGS DETECTED - Some optional components missing" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Yellow
    exit 0
}
