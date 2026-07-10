#!/usr/bin/env pwsh

<#
.SYNOPSIS
  100-Cycle Stability & Load Test - Complete Docker lifecycle testing
  
.DESCRIPTION
  Performs 100 complete start-test-stop cycles:
  - START: docker-compose up
  - VERIFY: Container health checks
  - TEST: API endpoints
  - TEST: Frontend UI
  - MONITOR: Logs for errors
  - STOP: docker-compose down
  - COLLECT: Metrics
  
.EXAMPLE
  .\stability-test-100-cycles.ps1
#>

param(
  [int]$Cycles = 100,
  [int]$TimeoutSeconds = 120,
  [switch]$StopOnFirstError = $false
)

$ErrorActionPreference = 'Continue'
$WarningPreference = 'Continue'

# ============================================================================
# SETUP
# ============================================================================

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$resultsDir = Join-Path $projectPath "stability-test-results"
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$resultsFile = Join-Path $resultsDir "stability-test-${timestamp}.json"
$reportFile = Join-Path $resultsDir "stability-report-${timestamp}.md"

# Create results directory
if (-not (Test-Path $resultsDir)) {
  New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

# Initialize metrics
$results = @{
  timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
  cycles = @()
  summary = @{
    totalCycles = $Cycles
    successfulCycles = 0
    failedCycles = 0
    totalDuration = 0
    avgCycleDuration = 0
    containers = @{}
    errors = @{}
  }
}

Write-Host ""
Write-Host "🔧 100-CYCLE STABILITY & LOAD TEST" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Cycles: $Cycles"
Write-Host "Timeout per cycle: ${TimeoutSeconds}s"
Write-Host "Stop on Error: $StopOnFirstError"
Write-Host ""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Start-Docker {
  try {
    # Stop and remove any existing containers
    Write-Host "  ↓ Starting Docker containers..."
    docker-compose -f $projectRoot/docker-compose.yml up -d 2>&1 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

function Stop-Docker {
  try {
    Write-Host "  ↓ Stopping Docker containers..."
    docker-compose -f $projectRoot/docker-compose.yml down 2>&1 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

function Wait-ContainerHealthy {
  param([string[]]$Containers, [int]$TimeoutSeconds)
  
  $startTime = Get-Date
  $maxDuration = [timespan]::FromSeconds($TimeoutSeconds)
  
  while ((Get-Date) - $startTime -lt $maxDuration) {
    $allHealthy = $true
    
    foreach ($container in $Containers) {
      try {
        $info = docker inspect $container 2>$null | ConvertFrom-Json
        $health = $info.State.Health.Status
        
        if ($health -ne 'healthy') {
          $allHealthy = $false
        }
      }
      catch {
        $allHealthy = $false
      }
    }
    
    if ($allHealthy) {
      return $true
    }
    
    Start-Sleep -Milliseconds 500
  }
  
  return $false
}

function Test-Api {
  $urls = @(
    'http://localhost:3000/api/health',
    'http://localhost:3000/api/schema/schemas',
    'http://localhost/api/schema/schemas'
  )
  
  $results = @()
  
  foreach ($url in $urls) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
      $results += @{
        url = $url
        status = $response.StatusCode
        success = $response.StatusCode -eq 200
      }
    }
    catch {
      $results += @{
        url = $url
        status = 0
        success = $false
        error = $_.Exception.Message
      }
    }
  }
  
  return $results
}

function Test-Frontend {
  try {
    $response = Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

function Get-ContainerLogs {
  param([string]$Container, [int]$Lines = 50)
  
  try {
    $logs = docker logs --tail $Lines $Container 2>$null
    return $logs
  }
  catch { }
  
  return @()
}

function Analyze-Logs {
  param([string[]]$Containers)
  
  $errors = @()
  
  foreach ($container in $Containers) {
    $logs = Get-ContainerLogs -Container $container -Lines 100
    
    if ($logs) {
      # Search for error patterns
      $errorPatterns = @(
        'error',
        'failed',
        'exception',
        'fatal',
        'critical',
        'panic',
        'crash'
      )
      
      foreach ($pattern in $errorPatterns) {
        $matches = $logs | Select-String -Pattern $pattern -AllMatches
        if ($matches) {
          $errors += @{
            container = $container
            pattern = $pattern
            count = @($matches).Count
          }
        }
      }
    }
  }
  
  return $errors
}

# ============================================================================
# MAIN TEST LOOP
# ============================================================================

$testStartTime = Get-Date
$currentCycle = 0

for ($cycle = 1; $cycle -le $Cycles; $cycle++) {
  $cycleStart = Get-Date
  $cycleResult = @{
    cycle = $cycle
    timestamp = Get-Date -Format 'HH:mm:ss'
    status = 'UNKNOWN'
    duration = 0
    errors = @()
    warnings = @()
    apiTests = @()
    frontendSuccess = $false
    logErrors = @()
  }
  
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  Write-Host "Cycle $cycle/$Cycles" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
  
  try {
    # START
    Write-Host "📥 STARTING..." -ForegroundColor Yellow
    if (-not (Start-Docker)) {
      $cycleResult.status = 'FAILED_START'
      $cycleResult.errors += 'Failed to start Docker containers'
      throw "Docker start failed"
    }
    
    # VERIFY HEALTH
    Write-Host "✓ Checking container health..."
    $containers = @('extractor-postgres', 'extractor-redis', 'extractor-backend', 'extractor-frontend')
    if (-not (Wait-ContainerHealthy -Containers $containers -TimeoutSeconds $TimeoutSeconds)) {
      $cycleResult.status = 'FAILED_HEALTHCHECK'
      $cycleResult.errors += 'Containers did not become healthy within timeout'
      throw "Container health check failed"
    }
    Write-Host "✓ All containers healthy" -ForegroundColor Green
    
    # API TEST
    Write-Host "🔗 Testing API endpoints..."
    $apiResults = Test-Api
    $apiTests = $apiResults | Where-Object { -not $_.success }
    
    if ($apiTests.Count -gt 0) {
      $cycleResult.warnings += "API test failures: $($apiTests.Count)"
    }
    $cycleResult.apiTests = $apiResults
    
    # FRONTEND TEST
    Write-Host "🌐 Testing frontend..."
    if (Test-Frontend) {
      Write-Host "✓ Frontend responding" -ForegroundColor Green
      $cycleResult.frontendSuccess = $true
    }
    else {
      $cycleResult.warnings += "Frontend health check failed"
      $cycleResult.frontendSuccess = $false
    }
    
    # LOG ANALYSIS
    Write-Host "📋 Analyzing logs..."
    $logErrors = Analyze-Logs -Containers $containers
    if ($logErrors.Count -gt 0) {
      $cycleResult.logErrors = $logErrors
      $cycleResult.warnings += "Log errors detected: $($logErrors.Count)"
    }
    
    # Determine cycle status
    if ($cycleResult.errors.Count -eq 0 -and $cycleResult.apiTests | Where-Object { -not $_.success } | Measure-Object | Select-Object -ExpandProperty Count -eq 0) {
      $cycleResult.status = 'SUCCESS'
    }
    elseif ($cycleResult.errors.Count -gt 0) {
      $cycleResult.status = 'FAILED'
    }
    else {
      $cycleResult.status = 'WARNING'
    }
  }
  catch {
    $cycleResult.status = 'ERROR'
    $cycleResult.errors += $_.Exception.Message
  }
  finally {
    # CLEANUP
    Write-Host "📤 Stopping..."
    Stop-Docker | Out-Null
    
    $cycleDuration = ((Get-Date) - $cycleStart).TotalSeconds
    $cycleResult.duration = $cycleDuration
    
    # Display result
    $emoji = switch ($cycleResult.status) {
      'SUCCESS' { '✅' }
      'WARNING' { '⚠️ ' }
      'FAILED' { '❌' }
      'ERROR' { '💥' }
      default { '❓' }
    }
    
    Write-Host "$emoji Cycle $cycle: $($cycleResult.status) (${cycleDuration}s)" -ForegroundColor (
      switch ($cycleResult.status) {
        'SUCCESS' { 'Green' }
        'WARNING' { 'Yellow' }
        default { 'Red' }
      }
    )
    
    # Add to results
    $results.cycles += $cycleResult
    
    # Update summary
    if ($cycleResult.status -eq 'SUCCESS') {
      $results.summary.successfulCycles++
    }
    else {
      $results.summary.failedCycles++
    }
    
    # Stop on first error if requested
    if ($StopOnFirstError -and $cycleResult.status -in @('ERROR', 'FAILED')) {
      Write-Host ""
      Write-Host "🛑 Stopped on first error (Cycle $cycle)" -ForegroundColor Red
      break
    }
  }
}

# ============================================================================
# SUMMARY
# ============================================================================

$totalDuration = ((Get-Date) - $testStartTime).TotalSeconds
$results.summary.totalDuration = $totalDuration
$results.summary.avgCycleDuration = $totalDuration / $results.cycles.Count

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Cycles Run: $($results.cycles.Count)"
Write-Host "Successful: $($results.summary.successfulCycles) ✅"
Write-Host "Failed: $($results.summary.failedCycles) ❌"
Write-Host "Success Rate: $(($results.summary.successfulCycles / $results.cycles.Count * 100).ToString('F1'))%"
Write-Host "Total Duration: $([int]$totalDuration)s"
Write-Host "Avg Per Cycle: $([int]$results.summary.avgCycleDuration)s"
Write-Host ""

# Error analysis
$errorSummary = @{}
foreach ($cycle in $results.cycles | Where-Object { $_.status -ne 'SUCCESS' }) {
  foreach ($error in $cycle.errors) {
    if (-not $errorSummary[$error]) {
      $errorSummary[$error] = 0
    }
    $errorSummary[$error]++
  }
}

if ($errorSummary.Count -gt 0) {
  Write-Host "❌ ERROR SUMMARY:" -ForegroundColor Red
  foreach ($error in $errorSummary.GetEnumerator() | Sort-Object -Property Value -Descending) {
    Write-Host "  - $($error.Key): $($error.Value) times"
  }
  Write-Host ""
}

# ============================================================================
# SAVE REPORTS
# ============================================================================

Write-Host "📁 Saving results..." -ForegroundColor Yellow

# Save JSON
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $resultsFile -Encoding UTF8

# Generate markdown report
$reportContent = @"
# Stability Test Report - 100 Cycles
**Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')**

## Summary
- **Total Cycles:** $($results.cycles.Count)
- **Successful:** $($results.summary.successfulCycles) ✅
- **Failed:** $($results.summary.failedCycles) ❌
- **Success Rate:** $(($results.summary.successfulCycles / $results.cycles.Count * 100).ToString('F1'))%
- **Total Duration:** $([int]$totalDuration)s
- **Avg Per Cycle:** $([int]$results.summary.avgCycleDuration)s

## MTBF (Mean Time Between Failures)
```
MTBF = Total Duration / Number of Failures
MTBF = $([int]$totalDuration) / $($results.summary.failedCycles)
MTBF = $([int]($totalDuration / [math]::Max($results.summary.failedCycles, 1)))s
```

## Error Analysis
| Error | Count | Percentage |
|-------|-------|-----------|
$($errorSummary.GetEnumerator() | Sort-Object -Property Value -Descending | ForEach-Object {
  $pct = ($_.Value / $results.cycles.Count * 100).ToString('F1')
  "| $($_.Key) | $($_.Value) | $pct% |"
} | Out-String)

## Cycle Details

| Cycle | Status | Duration | Errors | Warnings |
|-------|--------|----------|--------|----------|
$($results.cycles | ForEach-Object {
  "| $($_.cycle) | $($_.status) | $([int]$_.duration)s | $($_.errors.Count) | $($_.warnings.Count) |"
} | Out-String)

## Recommendations
$(if ($results.summary.successfulCycles -eq $results.cycles.Count) {
  "✅ **All 100 cycles successful!** System is production-ready."
} else {
  @"
❌ **Stability issues detected:**
- Success Rate: $(($results.summary.successfulCycles / $results.cycles.Count * 100).ToString('F1'))%
- MTBF: $([int]($totalDuration / [math]::Max($results.summary.failedCycles, 1)))s

**Recommended Actions:**
1. Analyze error patterns above
2. Apply fixes to identified issues
3. Re-run 100-cycle test
4. Continue until 100/100 success
"@
})

---
*Test completed: $(Get-Date -Format 'HH:mm:ss')*
"@

$reportContent | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "✅ JSON Results: $resultsFile" -ForegroundColor Green
Write-Host "✅ Report: $reportFile" -ForegroundColor Green
Write-Host ""

# ============================================================================
# FINAL STATUS
# ============================================================================

if ($results.summary.successfulCycles -eq $results.cycles.Count) {
  Write-Host "🎉 SUCCESS! All $($results.cycles.Count) cycles passed!" -ForegroundColor Green
  exit 0
}
else {
  $failureRate = ($results.summary.failedCycles / $results.cycles.Count * 100).ToString('F1')
  Write-Host "⚠️  FAILURE RATE: $failureRate%" -ForegroundColor Yellow
  exit 1
}
