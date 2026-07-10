#!/usr/bin/env pwsh
<#
.SYNOPSIS
Document Extractor - Complete Startup Script
Starts both backend and frontend services with proper error handling

.DESCRIPTION
Kills existing processes, rebuilds if needed, and starts services
Works correctly in PowerShell on Windows

.EXAMPLE
.\start-services.ps1
#>

param(
    [switch]$Rebuild = $false,
    [switch]$NoFrontend = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "`n+==============================================================+" -ForegroundColor Cyan
Write-Host "|        Document Extractor - Service Startup (v1.0)            |" -ForegroundColor Cyan
Write-Host "+==============================================================+`n" -ForegroundColor Cyan

# Colors
$success = 'Green'
$error_color = 'Red'
$info = 'Yellow'
$highlight = 'Cyan'

# Function to log messages
function Log-Message {
    param(
        [string]$Message,
        [string]$Type = "info"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch($Type) {
        "success" { $success }
        "error" { $error_color }
        "info" { $info }
        default { $highlight }
    }
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
    Write-Host $Message -ForegroundColor $color
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# Step 1: Kill existing processes
Log-Message "Step 1: Cleaning up existing processes..." "info"
try {
    $nodeProcs = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcs) {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Log-Message "[OK] Stopped $($nodeProcs.Count) Node process(es)" "success"
    } else {
        Log-Message "[OK] No Node processes running" "success"
    }
} catch {
    Log-Message "Could not stop Node processes: $_" "error"
}

Start-Sleep -Milliseconds 500

# Step 2: Verify project structure
Log-Message "Step 2: Verifying project structure..." "info"
$projectRoot = (Get-Location).Path
$backendExists = Test-Path "$projectRoot/src/index.ts"
$frontendExists = Test-Path "$projectRoot/frontend/src/main.tsx"
$packageExists = Test-Path "$projectRoot/package.json"

if (-not $backendExists -or -not $packageExists) {
    Log-Message "Backend files missing!" "error"
    exit 1
}
Log-Message "[OK] Backend files found" "success"

if (-not $NoFrontend -and -not $frontendExists) {
    Log-Message "Frontend files missing!" "error"
    exit 1
}
Log-Message "[OK] Frontend files found" "success"

# Step 3: Install dependencies (if needed)
Log-Message "Step 3: Checking dependencies..." "info"
if (-not (Test-Path "$projectRoot/node_modules")) {
    Log-Message "Installing backend dependencies..." "info"
    npm install
    Log-Message "[OK] Dependencies installed" "success"
} else {
    Log-Message "[OK] Dependencies already installed" "success"
}

# Step 4: Build (optional)
if ($Rebuild) {
    Log-Message "Step 4: Rebuilding TypeScript..." "info"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Build failed!" "error"
        exit 1
    }
    Log-Message "[OK] Build successful" "success"
} else {
    Log-Message "Step 4: Skipping rebuild (use -Rebuild flag to force)" "info"
}

# Step 5: Start backend
Log-Message "Step 5: Starting backend server..." "info"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
    npm run dev 2>&1
} -Name "extractor-backend"

Log-Message "[OK] Backend started (Job ID: $($backendJob.Id))" "success"

# Wait for backend to be ready
Log-Message "Waiting for backend to be ready on port 3000..." "info"
$maxWait = 30
$waited = 0
while (-not (Test-Port 3000) -and $waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    if ($waited % 5 -eq 0) {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}
Write-Host ""

if (Test-Port 3000) {
    Log-Message "[OK] Backend is ready and responding on port 3000" "success"
} else {
    Log-Message "Backend failed to start on port 3000" "error"
    Stop-Job -Job $backendJob
    exit 1
}

# Step 6: Start frontend (optional)
if (-not $NoFrontend) {
    Log-Message "Step 6: Starting frontend server..." "info"
    
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "$using:projectRoot\frontend"
        npm run dev 2>&1
    } -Name "extractor-frontend"
    
    Log-Message "✓ Frontend started (Job ID: $($frontendJob.Id))" "success"
    
    # Wait for frontend
    Log-Message "Waiting for frontend to be ready on port 5173..." "info"
    $waited = 0
    while (-not (Test-Port 5173) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        if ($waited % 5 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    Write-Host ""
    
    if (Test-Port 5173) {
        Log-Message "✓ Frontend is ready on port 5173" "success"
    } else {
        Log-Message "Frontend may still be starting..." "info"
    }
} else {
    Log-Message "Step 6: Skipping frontend (use -NoFrontend to disable)" "info"
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    ✅ STARTUP COMPLETE                         ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  Services Running:                                             ║" -ForegroundColor Cyan
Write-Host "║  • Backend:  http://localhost:3000 ✅                          ║" -ForegroundColor Green
if (-not $NoFrontend) {
    Write-Host "║  • Frontend: http://localhost:5173 ✅                          ║" -ForegroundColor Green
}
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  To stop services:                                             ║" -ForegroundColor Cyan
Write-Host "║  Press Ctrl+C in this terminal                                 ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Keep script running to maintain job references
Log-Message "Press Ctrl+C to stop all services" "info"
Write-Host ""

while ($true) {
    $backendState = (Get-Job -ID $backendJob.Id).State
    if ($backendState -eq 'Failed') {
        Log-Message "Backend job failed!" "error"
        break
    }
    if (-not $NoFrontend) {
        $frontendState = (Get-Job -ID $frontendJob.Id).State
        if ($frontendState -eq 'Failed') {
            Log-Message "Frontend job failed!" "error"
            break
        }
    }
    Start-Sleep -Seconds 5
}

# Cleanup on exit
Write-Host "`n" -ForegroundColor Gray
Log-Message "Shutting down services..." "info"
Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
if (-not $NoFrontend) {
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
}
Log-Message "Services stopped" "success"
