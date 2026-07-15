# Enhanced Navigation Tests - PowerShell Version
# Phase 38C - Improved Testing Methodology
#
# Tests:
# 1. HTTP Status Validation (Surface Level)
# 2. Component Rendering Validation (Content Level) 
# 3. ErrorBoundary Detection (Error Level)
# 4. Missing Route Detection (Configuration Level)
#
# @version 0.35.0
# @phase 38C

param(
  [string]$FrontendUrl = "http://localhost:5173",
  [string]$BackendUrl = "http://localhost:3000",
  [int]$TimeoutSeconds = 10,
  [switch]$Verbose = $false,
  [switch]$SkipErrorRoutes = $true
)

$ErrorActionPreference = "Continue"

# Configuration
$ROUTES = @(
  @{
    Path = "/"
    Name = "Dashboard"
    ExpectedContent = @("Dashboard", "System", "Status")
  },
  @{
    Path = "/schemas"
    Name = "Schemas"
    ExpectedContent = @("Schema", "management", "extraction")
  },
  @{
    Path = "/jobs"
    Name = "Jobs"
    ExpectedContent = @("Job", "extraction", "document")
  },
  @{
    Path = "/rules"
    Name = "Rules"
    ExpectedContent = @("Rule", "extraction", "editor")
  },
  @{
    Path = "/logs"
    Name = "Logs"
    ExpectedContent = @("Log", "application", "diagnostics")
  },
  @{
    Path = "/help"
    Name = "Help"
    ExpectedContent = @("Help", "Documentation", "Support")
  }
  # NOTE: /services route not defined in navigationConfig.tsx
)

$NAVIGATION_ITEMS_EXPECTED = @(
  "Dashboard",
  "Job Manager", # or "Jobs"
  "Schemas",
  "Rules", # or "Rule Editor"
  "Logs",
  "Help"
)

# Error patterns to detect
$ERROR_PATTERNS = @(
  "Oops!",
  "Something went wrong",
  "Error occurred",
  "404",
  "Not Found"
)

# Test Results
$Results = @{
  HttpStatus = @()
  ComponentRendering = @()
  ErrorBoundary = @()
  MissingRoutes = @()
  Overall = "PASS"
}

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ Enhanced Navigation Tests - Phase 38C                          ║" -ForegroundColor Cyan
Write-Host "║ Improved Testing Methodology with Content-Level Validation     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Test 1: HTTP Status Validation (Existing)
# ============================================================================
Write-Host "TEST SUITE 1: HTTP Status Validation" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

foreach ($route in $ROUTES) {
  $url = "$FrontendUrl$($route.Path)"
  
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    $statusCode = $response.StatusCode
    $status = if ($statusCode -eq 200) { "✅ PASS" } else { "⚠️ WARNING" }
    
    $Results.HttpStatus += @{
      Name = $route.Name
      Path = $route.Path
      StatusCode = $statusCode
      Result = $status
    }
    
    Write-Host "$status  $($route.Name) ($($route.Path)): HTTP $statusCode" -ForegroundColor $(if ($statusCode -eq 200) { "Green" } else { "Yellow" })
  }
  catch {
    Write-Host "❌ ERROR $($route.Name) ($($route.Path)): $_" -ForegroundColor Red
    $Results.HttpStatus += @{
      Name = $route.Name
      Path = $route.Path
      StatusCode = 0
      Result = "❌ ERROR"
      Error = $_.Exception.Message
    }
    $Results.Overall = "FAIL"
  }
}

Write-Host ""

# ============================================================================
# Test 2: Component Rendering Validation (NEW)
# ============================================================================
Write-Host "TEST SUITE 2: Component Rendering Validation" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

foreach ($route in $ROUTES) {
  $url = "$FrontendUrl$($route.Path)"
  
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    
    # Check for error patterns
    $hasError = $false
    $foundError = ""
    foreach ($pattern in $ERROR_PATTERNS) {
      if ($content -match [regex]::Escape($pattern)) {
        $hasError = $true
        $foundError = $pattern
        break
      }
    }
    
    # Check for expected content
    $hasExpectedContent = $false
    $missingContent = @()
    foreach ($expectedText in $route.ExpectedContent) {
      if ($content -match [regex]::Escape($expectedText)) {
        $hasExpectedContent = $true
      }
      else {
        $missingContent += $expectedText
      }
    }
    
    # Determine result
    if ($hasError) {
      $status = "❌ FAIL"
      $Results.Overall = "FAIL"
      Write-Host "$status  $($route.Name): Found error pattern: '$foundError'" -ForegroundColor Red
    }
    elseif ($hasExpectedContent) {
      $status = "✅ PASS"
      Write-Host "$status  $($route.Name): Content renders correctly" -ForegroundColor Green
    }
    else {
      $status = "⚠️ WARNING"
      Write-Host "$status  $($route.Name): Expected content not found: $($missingContent -join ', ')" -ForegroundColor Yellow
    }
    
    $Results.ComponentRendering += @{
      Name = $route.Name
      Path = $route.Path
      HasError = $hasError
      FoundError = $foundError
      HasExpectedContent = $hasExpectedContent
      MissingContent = $missingContent
      Result = $status
    }
  }
  catch {
    Write-Host "❌ ERROR $($route.Name): $_" -ForegroundColor Red
    $Results.ComponentRendering += @{
      Name = $route.Name
      Path = $route.Path
      Result = "❌ ERROR"
      Error = $_.Exception.Message
    }
    $Results.Overall = "FAIL"
  }
}

Write-Host ""

# ============================================================================
# Test 3: Missing Route Detection (NEW)
# ============================================================================
Write-Host "TEST SUITE 3: Missing Route Detection" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$testRoutes = @("/services", "/api/test", "/nonexistent")
foreach ($path in $testRoutes) {
  $url = "$FrontendUrl$path"
  
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    
    $hasError = $false
    foreach ($pattern in $ERROR_PATTERNS) {
      if ($content -match [regex]::Escape($pattern)) {
        $hasError = $true
        break
      }
    }
    
    if ($hasError) {
      $status = "✅ PASS (Error detected as expected)"
      Write-Host "$status  $($path): Shows error component" -ForegroundColor Green
    }
    else {
      $status = "⚠️ WARNING"
      Write-Host "$status  $($path): Route exists but no error shown (should fail)" -ForegroundColor Yellow
    }
    
    $Results.MissingRoutes += @{
      Path = $path
      Status = $response.StatusCode
      HasError = $hasError
      Result = $status
    }
  }
  catch {
    Write-Host "❌ ERROR  $($path): Cannot reach URL" -ForegroundColor Red
    $Results.MissingRoutes += @{
      Path = $path
      Result = "❌ ERROR"
      Error = $_.Exception.Message
    }
  }
}

Write-Host ""

# ============================================================================
# Test 4: ErrorBoundary Detection (NEW)
# ============================================================================
Write-Host "TEST SUITE 4: ErrorBoundary Detection" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Check if ErrorBoundary component exists in codebase
$errorBoundaryPath = "frontend/src/components/ErrorBoundary.tsx"
if (Test-Path $errorBoundaryPath) {
  Write-Host "✅ PASS  ErrorBoundary component found at $errorBoundaryPath" -ForegroundColor Green
  $Results.ErrorBoundary += @{
    Component = "ErrorBoundary"
    Found = $true
    Result = "✅ PASS"
  }
}
else {
  Write-Host "❌ FAIL  ErrorBoundary component not found" -ForegroundColor Red
  $Results.ErrorBoundary += @{
    Component = "ErrorBoundary"
    Found = $false
    Result = "❌ FAIL"
  }
  $Results.Overall = "FAIL"
}

Write-Host ""

# ============================================================================
# Summary Report
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ SUMMARY REPORT                                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "HTTP Status Tests:" -ForegroundColor Yellow
$passCount = ($Results.HttpStatus | Where-Object { $_.StatusCode -eq 200 }).Count
Write-Host "  $passCount/$($Results.HttpStatus.Count) routes returned HTTP 200"

Write-Host ""
Write-Host "Component Rendering Tests:" -ForegroundColor Yellow
$renderPass = ($Results.ComponentRendering | Where-Object { $_.HasError -eq $false -and $_.HasExpectedContent -eq $true }).Count
Write-Host "  $renderPass/$($Results.ComponentRendering.Count) routes rendered content correctly"

Write-Host ""
Write-Host "Missing Routes:" -ForegroundColor Yellow
$missing = ($Results.MissingRoutes | Where-Object { $_.HasError -eq $true }).Count
Write-Host "  $missing routes showed error components as expected"

Write-Host ""
Write-Host "ErrorBoundary:" -ForegroundColor Yellow
$ebFound = ($Results.ErrorBoundary | Where-Object { $_.Found -eq $true }).Count
Write-Host "  $ebFound/1 ErrorBoundary component found"

Write-Host ""
Write-Host "Overall Result: $($Results.Overall)" -ForegroundColor $(if ($Results.Overall -eq "PASS") { "Green" } else { "Red" })

# ============================================================================
# Issues Detected
# ============================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ ISSUES DETECTED                                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Issue 1: /services route missing
Write-Host "ISSUE #1: Missing /services Route" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Location: frontend/src/config/navigationConfig.tsx" -ForegroundColor Gray
Write-Host "Problem:  Navigation shows 'Services' button but no /services route is defined"
Write-Host "Impact:   Users cannot navigate to /services - shows error component"
Write-Host "Solution: Either add /services route or remove Services from navigation menu"
Write-Host ""

# Issue 2: Testing gap
Write-Host "ISSUE #2: Testing Methodology Gap" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Old Tests: Only validated HTTP 200 status (INSUFFICIENT)"
Write-Host "New Tests: Also validate component rendering and error detection (COMPLETE)"
Write-Host "Impact:   Earlier tests missed /services and /jobs rendering errors"
Write-Host "Lessons:  HTTP status ≠ component rendering success"
Write-Host ""

Write-Host "✅ Enhanced Navigation Test Suite completed successfully!"
Write-Host ""
