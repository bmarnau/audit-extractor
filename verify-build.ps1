# Comprehensive Build Verification Script
# Windows PowerShell v5.1 compatible

param(
    [switch]$NoRuntimeTest,
    [int]$BackendStartTimeoutSeconds = 8
)

$ErrorActionPreference = 'Continue'

# Colors
$success = 'Green'
$error_color = 'Red'
$warning_color = 'Yellow'
$info_color = 'Cyan'

# Helper functions
function Write-Success { param([string]$m) Write-Host "✅ $m" -ForegroundColor $success }
function Write-Error-Custom { param([string]$m) Write-Host "❌ $m" -ForegroundColor $error_color }
function Write-Warn { param([string]$m) Write-Host "⚠️  $m" -ForegroundColor $warning_color }
function Write-Info { param([string]$m) Write-Host "ℹ️  $m" -ForegroundColor $info_color }

Write-Host "`n" + ("="*70) -ForegroundColor Cyan
Write-Host "BUILD VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "="*70 -ForegroundColor Cyan

$projectRoot = Get-Location
$failed = $false

# ============================================================================
# STAGE 1: COMPILATION VERIFICATION
# ============================================================================

Write-Host "`n[STAGE 1] TypeScript Compilation" -ForegroundColor Cyan
Write-Info "Checking if dist/ directory exists..."

if (-not (Test-Path "$projectRoot\dist")) {
    Write-Error-Custom "dist/ directory not found - building..."
    npm run build 2>&1 | Select-Object -Last 5
}

if (Test-Path "$projectRoot\dist\index.js") {
    Write-Success "Compiled backend found at dist/index.js"
} else {
    Write-Error-Custom "dist/index.js not found!"
    exit 1
}

# ============================================================================
# STAGE 2: CONTENT VERIFICATION
# ============================================================================

Write-Host "`n[STAGE 2] Content Verification" -ForegroundColor Cyan
Write-Info "Checking version strings in compiled dist/ files..."

# Check for version strings
$helpFile = "$projectRoot\dist\infrastructure\api\routes\help.js"
if (Test-Path $helpFile) {
    $content = Get-Content $helpFile -Raw
    if ($content -match "0\.25\.0") {
        Write-Success "Help endpoint v0.25.0: Found in compiled output"
    } else {
        Write-Error-Custom "Help endpoint v0.25.0: NOT found in compiled output"
        $failed = $true
    }
} else {
    Write-Error-Custom "Help routes file not found: $helpFile"
    $failed = $true
}

# Check documentation files
Write-Info "Checking for required documentation files..."
$docs = @("MANUAL-0.25.0.md", "RELEASE_NOTES_0.25.0.md", "RELEASE_NOTES_0.24.0.md")

foreach ($doc in $docs) {
    $docPath = Join-Path $projectRoot $doc
    if (Test-Path $docPath) {
        $size = (Get-Item $docPath).Length
        $sizeKb = [math]::Round($size / 1024, 1)
        Write-Success "Documentation: $doc ($sizeKb KB)"
    } else {
        Write-Error-Custom "Documentation missing: $doc"
        $failed = $true
    }
}

if ($failed) {
    Write-Host "`n[RESULT] Content verification FAILED" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STAGE 3: RUNTIME VERIFICATION
# ============================================================================

if ($NoRuntimeTest) {
    Write-Host "`n[STAGE 3] Runtime Verification SKIPPED (--NoRuntimeTest)" -ForegroundColor Yellow
} else {
    Write-Host "`n[STAGE 3] Runtime Verification" -ForegroundColor Cyan
    
    Write-Info "Cleaning up existing Node processes..."
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    Write-Info "Starting backend in test mode..."
    
    $backendProcess = $null
    try {
        $backendProcess = Start-Process -FilePath node -ArgumentList "dist/index.js" `
            -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\backend-stdout.log" `
            -RedirectStandardError "$env:TEMP\backend-stderr.log"
        
        Write-Info "Backend process started (PID: $($backendProcess.Id))"
        Write-Info "Waiting for backend to initialize (up to $BackendStartTimeoutSeconds seconds)..."
        
        $backendReady = $false
        $elapsed = 0
        
        while ($elapsed -lt $BackendStartTimeoutSeconds) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/help/manual" `
                    -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                
                if ($response.StatusCode -eq 200) {
                    $backendReady = $true
                    Write-Success "Backend is responding on port 3000"
                    break
                }
            } catch {
                # Expected during startup
            }
            
            Start-Sleep -Seconds 1
            $elapsed += 1
        }
        
        if (-not $backendReady) {
            Write-Error-Custom "Backend failed to start within $BackendStartTimeoutSeconds seconds"
            Write-Host "`nBackend Error Log:" -ForegroundColor Gray
            Get-Content "$env:TEMP\backend-stderr.log" -Tail 10 | Write-Host -ForegroundColor Gray
            exit 1
        }
        
        # ====================================================================
        # STAGE 4: API VERSION VERIFICATION
        # ====================================================================
        
        Write-Host "`n[STAGE 4] API Version Verification" -ForegroundColor Cyan
        
        $allApiPass = $true
        
        # Test Help Manual
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/help/manual" `
                -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            
            $json = $response.Content | ConvertFrom-Json
            
            if ($json.data.version -eq "0.25.0") {
                Write-Success "Help Manual: Version 0.25.0 returned correctly"
                Write-Info "  Title: $($json.data.title)"
            } else {
                Write-Error-Custom "Help Manual: Version mismatch - got $($json.data.version)"
                $allApiPass = $false
            }
        } catch {
            Write-Error-Custom "Help Manual API request failed: $($_.Exception.Message)"
            $allApiPass = $false
        }
        
        # Test Release Notes
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/help/release-notes" `
                -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            
            $json = $response.Content | ConvertFrom-Json
            
            if ($json.data[0].version -eq "0.25.0") {
                Write-Success "Release Notes: Version 0.25.0 found"
            } else {
                Write-Error-Custom "Release Notes: Version mismatch"
                $allApiPass = $false
            }
        } catch {
            Write-Error-Custom "Release Notes API request failed: $($_.Exception.Message)"
            $allApiPass = $false
        }
        
        if (-not $allApiPass) {
            Write-Host "`n[RESULT] API verification FAILED" -ForegroundColor Red
            exit 1
        }
        
    } finally {
        if ($backendProcess) {
            Write-Info "Stopping test backend..."
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
}

# ============================================================================
# SUCCESS
# ============================================================================

Write-Host "`n" + ("="*70) -ForegroundColor Green
Write-Host "✅ ALL VERIFICATION CHECKS PASSED" -ForegroundColor Green
Write-Host "="*70 -ForegroundColor Green
Write-Host "`nBuild Status:`n" -ForegroundColor Green
Write-Host "  • TypeScript Compilation: ✅" -ForegroundColor Green
Write-Host "  • Content Verification: ✅" -ForegroundColor Green
if (-not $NoRuntimeTest) {
    Write-Host "  • Backend Startup: ✅" -ForegroundColor Green
    Write-Host "  • API Versions: ✅" -ForegroundColor Green
}
Write-Host "`n"
