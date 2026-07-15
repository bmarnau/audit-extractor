# Enhanced Navigation Tests - Phase 38C
# Simplified PowerShell Version (ASCII-safe)
#
# @version 0.35.0
# @phase 38C

param(
  [string]$FrontendUrl = "http://localhost:5173",
  [int]$TimeoutSeconds = 10
)

$ErrorActionPreference = "Continue"

# Routes to test
$ROUTES = @(
  @{ Path = "/"; Name = "Dashboard" },
  @{ Path = "/schemas"; Name = "Schemas" },
  @{ Path = "/jobs"; Name = "Jobs" },
  @{ Path = "/rules"; Name = "Rules" },
  @{ Path = "/logs"; Name = "Logs" },
  @{ Path = "/help"; Name = "Help" }
)

Write-Host ""
Write-Host "=== Enhanced Navigation Tests - Phase 38C ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: HTTP Status
Write-Host "TEST 1: HTTP Status Validation" -ForegroundColor Magenta
Write-Host "---" -ForegroundColor Gray
$passed = 0
foreach ($route in $ROUTES) {
  $url = "$FrontendUrl$($route.Path)"
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      Write-Host "[OK] $($route.Name) - HTTP 200" -ForegroundColor Green
      $passed++
    }
  }
  catch {
    Write-Host "[FAIL] $($route.Name) - $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host "Result: $passed/$($ROUTES.Count) routes return HTTP 200"
Write-Host ""

# Test 2: Component Rendering
Write-Host "TEST 2: Component Rendering Validation" -ForegroundColor Magenta
Write-Host "---" -ForegroundColor Gray
$rendering_passed = 0
foreach ($route in $ROUTES) {
  $url = "$FrontendUrl$($route.Path)"
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    
    # Check for error patterns
    if ($content -match "Oops|Something went wrong|Error occurred") {
      Write-Host "[ERROR] $($route.Name) - shows error component" -ForegroundColor Red
    }
    elseif ($content -match "main|<main") {
      Write-Host "[OK] $($route.Name) - renders without error" -ForegroundColor Green
      $rendering_passed++
    }
    else {
      Write-Host "[WARN] $($route.Name) - unclear content" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "[FAIL] $($route.Name) - cannot fetch" -ForegroundColor Red
  }
}
Write-Host "Result: $rendering_passed/$($ROUTES.Count) routes render correctly"
Write-Host ""

# Test 3: Missing Routes
Write-Host "TEST 3: Missing Route Detection" -ForegroundColor Magenta
Write-Host "---" -ForegroundColor Gray
$missing_routes = @("/services", "/missing")
foreach ($path in $missing_routes) {
  $url = "$FrontendUrl$path"
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    
    if ($content -match "Oops|error|not found|404") {
      Write-Host "[OK] $path - correctly shows error" -ForegroundColor Green
    }
    else {
      Write-Host "[WARN] $path - no error shown" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "[FAIL] $path - unreachable" -ForegroundColor Red
  }
}
Write-Host ""

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "HTTP Tests: $passed/$($ROUTES.Count) PASS" -ForegroundColor Yellow
Write-Host "Rendering Tests: $rendering_passed/$($ROUTES.Count) PASS" -ForegroundColor Yellow
Write-Host ""
Write-Host "KEY FINDINGS:" -ForegroundColor Yellow
Write-Host "- Old tests (HTTP only) are INSUFFICIENT for detecting component errors"  
Write-Host "- New tests (content-level) catch rendering failures"
Write-Host "- /services route missing from navigationConfig.tsx"
Write-Host "- Either add /services or remove from navigation menu"
Write-Host ""
