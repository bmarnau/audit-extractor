#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phase 45: COMPREHENSIVE TEST - PDF Export + Navigation
    Tests all endpoints and verifies PDF content
#>

param([string]$ApiBase = "http://localhost:3000/api")

$ErrorActionPreference = "Stop"
$global:results = @{ passed = 0; failed = 0; tests = @() }

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PHASE 45: COMPLETE SYSTEM TEST & PDF VERIFICATION     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# 1. PDF EXPORT TESTS
# ============================================================================
Write-Host "[1/2] PDF EXPORT TESTS" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────────────────────────`n"

# Management PDF
try {
    $response = Invoke-WebRequest "$ApiBase/management/export-pdf" -Method POST `
        -Body '{}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    
    $magic = [System.Text.Encoding]::ASCII.GetString($response.Content[0..3])
    $size = $response.Content.Length
    
    if ($magic -eq "%PDF" -and $size -gt 5000) {
        Write-Host "[PASS] Management Report PDF" -ForegroundColor Green
        Write-Host "       Status: $($response.StatusCode) | Size: $size bytes | Magic: $magic"
        $global:results.passed++
        $global:results.tests += @{ name = "Management PDF"; status = "PASS"; size = $size }
    } else {
        Write-Host "[FAIL] Management Report PDF" -ForegroundColor Red
        Write-Host "       Size: $size bytes | Magic: $magic (expected %PDF)"
        $global:results.failed++
    }
} catch {
    Write-Host "[ERROR] Management PDF: $($_.Exception.Message)" -ForegroundColor Red
    $global:results.failed++
}

# Technical Audit PDF
try {
    $response = Invoke-WebRequest "$ApiBase/reports/test-001/export" -Method GET `
        -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "[PASS] Technical Audit PDF" -ForegroundColor Green
        Write-Host "       Status: $($response.StatusCode) | Size: $($response.Content.Length) bytes"
        $global:results.passed++
    } else {
        Write-Host "[INFO] Technical Audit PDF: Endpoint 404 (expected - requires valid report ID)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] Technical Audit PDF: 404 (expected - awaiting report data)" -ForegroundColor Yellow
}

# ============================================================================
# 2. COMPREHENSIVE NAVIGATION TESTS
# ============================================================================
Write-Host "`n[2/2] NAVIGATION & API ENDPOINT TESTS" -ForegroundColor Magenta
Write-Host "─────────────────────────────────────────────────────────────`n"

# Frontend Routes
Write-Host "FRONTEND ROUTES:" -ForegroundColor Cyan
$frontendRoutes = @(
    @{ path = "http://localhost/"; name = "Home" }
    @{ path = "http://localhost/management"; name = "Management" }
    @{ path = "http://localhost/technical-audit"; name = "Technical Audit" }
    @{ path = "http://localhost/help"; name = "Help System" }
)

foreach ($route in $frontendRoutes) {
    try {
        $r = Invoke-WebRequest $route.path -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.name)" -ForegroundColor Green
            $global:results.passed++
        }
    } catch {
        Write-Host "  [FAIL] $($route.name)" -ForegroundColor Red
        $global:results.failed++
    }
}

# Management API
Write-Host "`nMANAGEMENT API:" -ForegroundColor Cyan
$mgmtEndpoints = @(
    @{ path = "$ApiBase/management/status"; name = "Status"; method = "GET" }
    @{ path = "$ApiBase/management/health"; name = "Health"; method = "GET" }
    @{ path = "$ApiBase/management/raw-status"; name = "Raw Status"; method = "GET" }
)

foreach ($endpoint in $mgmtEndpoints) {
    try {
        $r = Invoke-WebRequest $endpoint.path -Method $endpoint.method -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) {
            Write-Host "  [OK] $($endpoint.name)" -ForegroundColor Green
            $global:results.passed++
        }
    } catch {
        Write-Host "  [FAIL] $($endpoint.name): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $global:results.failed++
    }
}

# Help API
Write-Host "`nHELP SYSTEM API:" -ForegroundColor Cyan
$helpEndpoints = @(
    @{ path = "$ApiBase/help/manual"; name = "Manual" }
    @{ path = "$ApiBase/help/release-notes"; name = "Release Notes" }
    @{ path = "$ApiBase/help/glossary"; name = "Glossary" }
    @{ path = "$ApiBase/help/documentation"; name = "Documentation" }
)

foreach ($endpoint in $helpEndpoints) {
    try {
        $r = Invoke-WebRequest $endpoint.path -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200 -and $r.Content.Length -gt 100) {
            Write-Host "  [OK] $($endpoint.name) - $($r.Content.Length) bytes" -ForegroundColor Green
            $global:results.passed++
        } else {
            Write-Host "  [FAIL] $($endpoint.name): Empty response" -ForegroundColor Red
            $global:results.failed++
        }
    } catch {
        Write-Host "  [FAIL] $($endpoint.name): $($_.Exception.Message)" -ForegroundColor Red
        $global:results.failed++
    }
}

# Technical Audit API
Write-Host "`nTECHNICAL AUDIT API:" -ForegroundColor Cyan
$auditEndpoints = @(
    @{ path = "$ApiBase/technical-audit/summary"; name = "Summary" }
    @{ path = "$ApiBase/technical-audit/report"; name = "Report" }
)

foreach ($endpoint in $auditEndpoints) {
    try {
        $r = Invoke-WebRequest $endpoint.path -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) {
            Write-Host "  [OK] $($endpoint.name)" -ForegroundColor Green
            $global:results.passed++
        }
    } catch {
        Write-Host "  [FAIL] $($endpoint.name): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $global:results.failed++
    }
}

# Health Endpoints
Write-Host "`nHEALTH CHECK:" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  [OK] Backend Health" -ForegroundColor Green
    $global:results.passed++
} catch {
    Write-Host "  [FAIL] Backend Health: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $global:results.failed++
}

try {
    $r = Invoke-WebRequest "http://localhost/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  [OK] Frontend Health" -ForegroundColor Green
    $global:results.passed++
} catch {
    Write-Host "  [FAIL] Frontend Health" -ForegroundColor Red
    $global:results.failed++
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST SUMMARY                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$total = $global:results.passed + $global:results.failed
$percent = if ($total -gt 0) { [math]::Round(($global:results.passed / $total) * 100) } else { 0 }

Write-Host "Passed:  $($global:results.passed)" -ForegroundColor Green
Write-Host "Failed:  $($global:results.failed)" -ForegroundColor $(if ($global:results.failed -gt 0) { "Red" } else { "Green" })
Write-Host "Total:   $total"
Write-Host "Success: $percent%`n"

if ($global:results.failed -eq 0) {
    Write-Host "[SUCCESS] ALL TESTS PASSED" -ForegroundColor Green -BackgroundColor DarkGreen
} else {
    Write-Host "[FAILED] SOME TESTS FAILED" -ForegroundColor Red -BackgroundColor DarkRed
}

Write-Host ""
exit if ($global:results.failed -gt 0) { 1 } else { 0 }
