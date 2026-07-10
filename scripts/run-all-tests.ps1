#!/usr/bin/env pwsh

<#
.SYNOPSIS
  Master Test Orchestration Script - Run all comprehensive tests
  
.DESCRIPTION
  Orchestrates the complete testing workflow:
  1. Rebuild Docker images
  2. Analyze Docker startup timing
  3. Run Playwright frontend tests
  4. Execute 100-cycle stability test
  5. Generate consolidated report
  
.EXAMPLE
  .\run-all-tests.ps1
#>

param(
  [switch]$RebuildImages = $false,
  [switch]$SkipAnalysis = $false,
  [switch]$SkipPlaywright = $false,
  [switch]$SkipStabilityTest = $false,
  [int]$StabilityCycles = 100
)

$ErrorActionPreference = 'Continue'

$projectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$reportsDir = Join-Path $projectPath "test-reports"

# Create reports directory
if (-not (Test-Path $reportsDir)) {
  New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   COMPREHENSIVE TEST SUITE - MASTER ORCHESTRATOR   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$testSummary = @{
  startTime = Get-Date
  results = @{
    analysis = $null
    playwright = $null
    stability = $null
  }
}

# ============================================================================
# PHASE 1: BUILD
# ============================================================================

if ($RebuildImages) {
  Write-Host "📦 PHASE 1: REBUILDING DOCKER IMAGES" -ForegroundColor Cyan
  Write-Host "──────────────────────────────────────────────────" -ForegroundColor Gray
  
  try {
    Push-Location $projectPath
    Write-Host "Building backend..."
    docker build -f Dockerfile.backend -t extractor-backend:latest . 2>&1 | Select-Object -Last 5
    Write-Host "✅ Backend built" -ForegroundColor Green
    
    Write-Host "Building frontend..."
    docker build -f Dockerfile.frontend -t extractor-frontend:latest . 2>&1 | Select-Object -Last 5
    Write-Host "✅ Frontend built" -ForegroundColor Green
    
    Pop-Location
  }
  catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
  }
  
  Write-Host ""
}

# ============================================================================
# PHASE 2: STARTUP ANALYSIS
# ============================================================================

if (-not $SkipAnalysis) {
  Write-Host "📊 PHASE 2: DOCKER STARTUP ANALYSIS" -ForegroundColor Cyan
  Write-Host "──────────────────────────────────────────────────" -ForegroundColor Gray
  
  try {
    # Start fresh containers
    Write-Host "Starting Docker stack..."
    Push-Location $projectPath
    docker-compose down -v 2>&1 | Out-Null
    docker-compose up -d 2>&1 | Out-Null
    Pop-Location
    
    # Run analysis
    Write-Host "Running startup analysis..."
    & "$projectPath/scripts/analyze-docker-startup.ps1" -MaxDurationSeconds 120
    
    Write-Host "✅ Analysis complete" -ForegroundColor Green
  }
  catch {
    Write-Host "⚠️  Analysis failed: $_" -ForegroundColor Yellow
  }
  
  Write-Host ""
}

# ============================================================================
# PHASE 3: PLAYWRIGHT TESTS
# ============================================================================

if (-not $SkipPlaywright) {
  Write-Host "🎭 PHASE 3: PLAYWRIGHT FRONTEND TESTS" -ForegroundColor Cyan
  Write-Host "──────────────────────────────────────────────────" -ForegroundColor Gray
  
  try {
    Push-Location $projectPath
    
    Write-Host "Installing Playwright dependencies..."
    npx playwright install 2>&1 | Select-Object -Last 3
    
    Write-Host "Running tests..."
    npx playwright test tests/e2e/comprehensive-frontend-test.spec.ts --reporter=json --reporter=html 2>&1
    
    Write-Host "✅ Playwright tests complete" -ForegroundColor Green
    Pop-Location
  }
  catch {
    Write-Host "⚠️  Playwright tests failed: $_" -ForegroundColor Yellow
  }
  
  Write-Host ""
}

# ============================================================================
# PHASE 4: STABILITY TEST
# ============================================================================

if (-not $SkipStabilityTest) {
  Write-Host "♻️  PHASE 4: 100-CYCLE STABILITY TEST" -ForegroundColor Cyan
  Write-Host "──────────────────────────────────────────────────" -ForegroundColor Gray
  Write-Host "Running $StabilityCycles cycles..."
  Write-Host ""
  
  try {
    & "$projectPath/scripts/stability-test-100-cycles.ps1" -Cycles $StabilityCycles
    Write-Host "✅ Stability test complete" -ForegroundColor Green
  }
  catch {
    Write-Host "❌ Stability test failed: $_" -ForegroundColor Red
  }
  
  Write-Host ""
}

# ============================================================================
# FINAL REPORT
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              TEST SUITE COMPLETE                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$endTime = Get-Date
$duration = ($endTime - $testSummary.startTime).TotalSeconds

Write-Host "Duration: $([int]$duration)s"
Write-Host "Reports: $reportsDir"
Write-Host ""

# List all reports
$reports = @()
if (Test-Path "$reportsDir/startup-analysis-*.md") {
  $reports += Get-Item "$reportsDir/startup-analysis-*.md"
}
if (Test-Path "$reportsDir/stability-report-*.md") {
  $reports += Get-Item "$reportsDir/stability-report-*.md"
}
if (Test-Path "$projectPath/playwright-report/index.html") {
  $reports += Get-Item "$projectPath/playwright-report/index.html"
}

if ($reports.Count -gt 0) {
  Write-Host "📋 Generated Reports:" -ForegroundColor Yellow
  foreach ($report in $reports) {
    Write-Host "  📄 $($report.Name)" -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
