#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Audit-Safe Document Extractor - Application Startup Script
.DESCRIPTION
    Starts the application with automatic cleanup of running processes.
    - Checks for running Node.js processes on port 3000
    - Kills all Node.js processes if found
    - Verifies necessary files exist
    - Builds TypeScript if needed
    - Starts dev server with logging
.EXAMPLE
    .\start-app.ps1
#>

param(
    [switch]$NoCleanup = $false,
    [switch]$NoBuild = $false,
    [switch]$SkipValidation = $false
)

$ErrorActionPreference = 'Continue'
$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $AppRoot

# Color helpers
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    Write-Host "✓ $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "✗ $args" -ForegroundColor Red
}

function Write-Warning {
    Write-Host "⚠ $args" -ForegroundColor Yellow
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

# Header
Write-Host ""
Write-ColorOutput "========================================" Cyan
Write-ColorOutput "  AUDIT-SAFE DOCUMENT EXTRACTOR" Cyan
Write-ColorOutput "  Application Startup Script" Cyan
Write-ColorOutput "========================================" Cyan
Write-Host ""

# Step 1: Check for running Node processes
if (-not $NoCleanup) {
    Write-Info "[1/4] Checking for running Node processes on port 3000..."
    
    $port = 3000
    try {
        $netstat = netstat -ano 2>$null | Select-String ":$port"
        
        if ($netstat) {
            Write-Warning "Found process on port $port"
            
            Write-Warning "Terminating all Node.js processes..."
            Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            
            Start-Sleep -Seconds 2
            
            Write-Success "Node processes terminated"
        } else {
            Write-Success "No processes running on port $port"
        }
    }
    catch {
        Write-Warning "Could not check port status: $_"
    }
}
else {
    Write-Info "[1/4] Skipping process cleanup..."
}

Write-Host ""

# Step 2: Verify required files
if (-not $SkipValidation) {
    Write-Info "[2/4] Verifying required files..."
    
    $requiredFiles = @(
        "package.json",
        "src\index.ts",
        "extraction-rules\invoice.json"
    )
    
    $allExist = $true
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "$file found"
        } else {
            Write-Error "$file NOT found"
            $allExist = $false
        }
    }
    
    if (-not $allExist) {
        Write-Error "Required files missing!"
        Read-Host "Press Enter to exit"
        exit 1
    }
}
else {
    Write-Info "[2/4] Skipping file validation..."
}

Write-Host ""

# Step 3: Build TypeScript
if (-not $NoBuild) {
    Write-Info "[3/4] Building TypeScript..."
    
    if (Test-Path "dist") {
        Write-Warning "Clearing old build artifacts..."
        Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
    }
    
    & npm run build 2>&1 | Write-Host
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed!"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Success "Build successful"
}
else {
    Write-Info "[3/4] Skipping build..."
}

Write-Host ""

# Step 4: Start dev server
Write-Info "[4/4] Starting development server..."
Write-ColorOutput "========================================" Green
Write-ColorOutput "  Server is starting..." Green
Write-ColorOutput "  API: http://localhost:3000" Green
Write-ColorOutput "  Frontend: http://localhost:5173" Green
Write-ColorOutput "========================================" Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

& npm run dev

Write-Host ""
Write-ColorOutput "========================================" Yellow
Write-ColorOutput "  Server stopped" Yellow
Write-ColorOutput "========================================" Yellow
Write-Host ""
