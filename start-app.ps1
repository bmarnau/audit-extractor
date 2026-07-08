#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Audit-Safe Document Extractor - Full Application Startup
.DESCRIPTION
    Starts both backend and frontend servers.
    - Backend: Express on port 3000
    - Frontend: Vite on port 5173
    - Opens Chrome browser automatically
.EXAMPLE
    .\start-app.ps1
#>

param(
    [switch]$NoCleanup = $false,
    [switch]$SkipChrome = $false
)

$ErrorActionPreference = 'Continue'
$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $AppRoot

# Colors
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Header { Write-Host $args -ForegroundColor Cyan -BackgroundColor Black }

Write-Host ""
Write-Header "╔═══════════════════════════════════════════════════════╗"
Write-Header "║  Audit-Safe Document Extractor v0.13.0               ║"
Write-Header "║  Starting Full Application Stack (Backend + Frontend) ║"
Write-Header "╚═══════════════════════════════════════════════════════╝"
Write-Host ""

# Step 1: Cleanup
if (-not $NoCleanup) {
    Write-Info "[1/5] Cleaning up old processes..."
    
    # Kill Node processes on ports
    foreach ($port in @(3000, 5173)) {
        $procs = netstat -ano 2>$null | Select-String ":$port" | ForEach-Object { ($_ -split '\s+')[-1] }
        $procs | Where-Object { $_ -and $_ -ne 'PID' } | ForEach-Object {
            taskkill /F /PID $_ 2>$null
        }
    }
    
    # Kill all node.exe processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
    Write-Success "Old processes cleaned"
} else {
    Write-Info "[1/5] Skipping cleanup..."
}

Write-Host ""

# Step 2: Check Node.js
Write-Info "[2/5] Checking Node.js..."
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js not found! Install from https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}
$nodeVersion = & node --version
Write-Success "Node.js $nodeVersion found"
Write-Host ""

# Step 3: Install dependencies
Write-Info "[3/5] Checking dependencies..."
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing backend dependencies..."
    & npm install 2>$null
}
if (-not (Test-Path "frontend\node_modules")) {
    Write-Info "Installing frontend dependencies..."
    Push-Location frontend
    & npm install 2>$null
    Pop-Location
}
Write-Success "Dependencies ready"
Write-Host ""

# Step 4: Start servers
Write-Info "[4/5] Starting servers..."

# Start Backend
Write-Host "Starting Backend on port 3000..."
$backendJob = Start-Process -NoNewWindow -PassThru -FilePath "cmd" -ArgumentList "/k npm run dev"
if ($backendJob) {
    Write-Success "Backend started (PID: $($backendJob.Id))"
} else {
    Write-Error "Failed to start backend"
    exit 1
}

# Wait for backend to be ready
$backendReady = $false
for ($i = 0; $i -lt 20; $i++) {
    $portCheck = netstat -ano 2>$null | Select-String ":3000"
    if ($portCheck) {
        $backendReady = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($backendReady) {
    Write-Success "Backend is listening on port 3000"
} else {
    Write-Error "Backend failed to start"
    exit 1
}

Write-Host ""

# Start Frontend
Write-Host "Starting Frontend on port 5173..."
$frontendJob = Start-Process -NoNewWindow -PassThru -WorkingDirectory "$AppRoot\frontend" -FilePath "cmd" -ArgumentList "/k npm run dev"
if ($frontendJob) {
    Write-Success "Frontend started (PID: $($frontendJob.Id))"
} else {
    Write-Error "Failed to start frontend"
    exit 1
}

# Wait for frontend to be ready
$frontendReady = $false
for ($i = 0; $i -lt 40; $i++) {
    $portCheck = netstat -ano 2>$null | Select-String ":5173"
    if ($portCheck) {
        $frontendReady = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($frontendReady) {
    Write-Success "Frontend is listening on port 5173"
} else {
    Write-Warning "Frontend may still be starting..."
}

Write-Host ""

# Step 5: Open Chrome
if (-not $SkipChrome) {
    Write-Info "[5/5] Opening Chrome..."
    $chromePath = Get-ChildItem -Path @(
        "C:\Program Files\Google\Chrome\Application\chrome.exe",
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
    ) -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($chromePath) {
        & "$($chromePath.FullName)" "http://localhost:5173" &
        Write-Success "Chrome opened"
    } else {
        Write-Warning "Chrome not found - opening via default browser..."
        Start-Process "http://localhost:5173"
    }
}

Write-Host ""
Write-Header "╔═══════════════════════════════════════════════════════╗"
Write-Header "║  ✓ Application Started Successfully!                 ║"
Write-Header "║                                                       ║"
Write-Header "║  Frontend:     http://localhost:5173                 ║"
Write-Header "║  Backend API:  http://localhost:3000                 ║"
Write-Header "║  Health Check: http://localhost:3000/health          ║"
Write-Header "║  API Docs:     http://localhost:3000/api-docs        ║"
Write-Header "║                                                       ║"
Write-Header "║  Press Ctrl+C to stop all servers                    ║"
Write-Header "╚═══════════════════════════════════════════════════════╝"
Write-Host ""

# Wait for user exit
try {
    Wait-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
} catch {}

# Cleanup on exit
Write-Warning "Shutting down..."
Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue 2>$null
Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue 2>$null
Write-Success "Cleanup complete"

