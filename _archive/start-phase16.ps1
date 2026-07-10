#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete startup script for Audit-Safe Document Extraction System (Phase 16)
    
.DESCRIPTION
    Handles database setup, dependency installation, build, and development server startup
    
.PARAMETER Skip
    Skip steps: docker, install, build, dev
    
.EXAMPLE
    .\start-phase16.ps1
    .\start-phase16.ps1 -Skip "docker,install"
    
.VERSION
    0.16.0 (Phase 16)
#>

param(
    [string]$Skip = ""
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# ============================================================================
# COLORS & FORMATTING
# ============================================================================
$colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
}

function Write-Header { param([string]$msg) Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $colors.Header; Write-Host $msg -ForegroundColor $colors.Header; Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $colors.Header }
function Write-Success { param([string]$msg) Write-Host "✅ $msg" -ForegroundColor $colors.Success }
function Write-Warning { param([string]$msg) Write-Host "⚠️  $msg" -ForegroundColor $colors.Warning }
function Write-Error-Msg { param([string]$msg) Write-Host "❌ $msg" -ForegroundColor $colors.Error }
function Write-Info { param([string]$msg) Write-Host "ℹ️  $msg" -ForegroundColor $colors.Info }
function Write-Step { param([string]$msg) Write-Host "`n📍 $msg" -ForegroundColor $colors.Info }

# ============================================================================
# UTILITIES
# ============================================================================
function Should-Skip { param([string]$step)
    if ($Skip -eq "") { return $false }
    return $Skip.Split(",").TrimStart().TrimEnd() -contains $step
}

function Check-Command { param([string]$cmd, [string]$name)
    try {
        $null = Invoke-Expression "Get-Command $cmd -ErrorAction Stop"
        Write-Success "$name is installed"
        return $true
    } catch {
        Write-Error-Msg "$name is not installed or not in PATH"
        return $false
    }
}

function Execute-Command { param([string]$cmd, [string]$description)
    Write-Info "Running: $description"
    Write-Info "Command: $cmd"
    Invoke-Expression $cmd
    if ($LASTEXITCODE -eq 0) {
        Write-Success "$description completed successfully"
    } else {
        Write-Error-Msg "$description failed with exit code $LASTEXITCODE"
        exit 1
    }
}

# ============================================================================
# MAIN STARTUP SEQUENCE
# ============================================================================

Write-Header "🚀 Audit-Safe Document Extraction System (Phase 16) - Startup"
Write-Info "Version: 0.16.0 | Status: Production Ready"
Write-Info "Workspace: $(Get-Location)"

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================
Write-Step "Step 1/5: Checking Prerequisites"

$hasNode = Check-Command "node" "Node.js"
$hasNpm = Check-Command "npm" "npm"
$hasDocker = Check-Command "docker" "Docker"
$hasGit = Check-Command "git" "Git"

if (-not $hasNode -or -not $hasNpm) {
    Write-Error-Msg "Node.js and npm are required!"
    exit 1
}

if (-not $hasDocker -and -not (Should-Skip "docker")) {
    Write-Warning "Docker is not installed. Database startup will be skipped."
}

Write-Success "All prerequisites checked"

# ============================================================================
# STEP 2: START DATABASE (DOCKER)
# ============================================================================
if (Should-Skip "docker") {
    Write-Info "Skipping Docker (--skip docker)"
} else {
    Write-Step "Step 2/5: Starting PostgreSQL Database (Docker)"
    
    try {
        # Check if docker daemon is running
        $dockerStatus = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Docker daemon is not running. Please start Docker Desktop."
            Write-Info "Attempting to start Docker Desktop..."
            & "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 5
        }
        
        # Check if postgres container is already running
        $container = docker ps --filter "name=extractor-postgres" --format "{{.ID}}" 2>&1
        
        if ($container) {
            Write-Success "PostgreSQL container already running"
        } else {
            Write-Info "Starting PostgreSQL container from docker-compose..."
            Execute-Command "docker-compose up -d" "Docker Compose"
            Start-Sleep -Seconds 3
            Write-Success "PostgreSQL is now running on localhost:5432"
        }
    } catch {
        Write-Warning "Could not start Docker. Database features may not work."
        Write-Info "You can manually run: docker-compose up -d"
    }
}

# ============================================================================
# STEP 3: INSTALL DEPENDENCIES
# ============================================================================
if (Should-Skip "install") {
    Write-Info "Skipping npm install (--skip install)"
} else {
    Write-Step "Step 3/5: Installing Dependencies"
    
    if (Test-Path "node_modules" -PathType Container) {
        Write-Info "node_modules already exists"
        $response = Read-Host "Reinstall dependencies? (y/n)"
        if ($response -eq "y") {
            Execute-Command "npm install --no-optional --ignore-scripts" "npm install"
        } else {
            Write-Info "Skipping npm install"
        }
    } else {
        Execute-Command "npm install --no-optional --ignore-scripts" "npm install"
    }
}

# ============================================================================
# STEP 4: BUILD TYPESCRIPT
# ============================================================================
if (Should-Skip "build") {
    Write-Info "Skipping build (--skip build)"
} else {
    Write-Step "Step 4/5: Building TypeScript"
    
    try {
        Write-Info "Running: npm run build"
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build completed successfully"
        } else {
            Write-Error-Msg "Build failed with exit code $LASTEXITCODE"
            exit 1
        }
    } catch {
        Write-Error-Msg "Build error: $_"
        exit 1
    }
}

# ============================================================================
# STEP 5: START DEVELOPMENT SERVER
# ============================================================================
if (Should-Skip "dev") {
    Write-Info "Skipping dev server (--skip dev)"
} else {
    Write-Step "Step 5/5: Starting Development Server"
    
    Write-Info ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                   STARTUP COMPLETE!                    ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║                                                        ║" -ForegroundColor Cyan
    Write-Host "║  🌐 API Server:    http://localhost:3000              ║" -ForegroundColor Green
    Write-Host "║  🗄️  Database:     localhost:5432                      ║" -ForegroundColor Green
    Write-Host "║  📚 Documentation: MANUAL-0.16.0.md                   ║" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Cyan
    Write-Host "║  Press Ctrl+C to stop the server                      ║" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Info ""
    
    Write-Info "Starting development server..."
    npm run dev
}

Write-Header "✅ Startup Complete"
