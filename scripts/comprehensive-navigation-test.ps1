#!/usr/bin/env powershell
# COMPREHENSIVE NAVIGATION TEST SUITE - v0.37.1
# Tests all navigation endpoints and API routes
# Run with: powershell -ExecutionPolicy Bypass -File scripts/comprehensive-navigation-test.ps1

param(
    [switch]$Verbose = $false,
    [int]$TimeoutSec = 5
)

$ErrorActionPreference = "Continue"
$FRONTEND_URL = "http://localhost"
$BACKEND_URL = "http://localhost:3000"

$passCount = 0
$failCount = 0
$startTime = Get-Date

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "COMPREHENSIVE NAVIGATION TEST - Version 0.37.1" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Start Time: $startTime" -ForegroundColor Gray
Write-Host ""

# Test Frontend Routes
Write-Host "[1/7] FRONTEND ROUTES" -ForegroundColor Yellow

$frontendRoutes = @(
    @{ Name = "Home"; Url = "$FRONTEND_URL/" },
    @{ Name = "Management"; Url = "$FRONTEND_URL/management" },
    @{ Name = "Technical Audit"; Url = "$FRONTEND_URL/technical-audit" },
    @{ Name = "Technical Tests"; Url = "$FRONTEND_URL/technical-tests" },
    @{ Name = "Help System"; Url = "$FRONTEND_URL/help" },
    @{ Name = "Services"; Url = "$FRONTEND_URL/services" },
    @{ Name = "API Documentation"; Url = "$FRONTEND_URL/api/docs" }
)

foreach ($route in $frontendRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name) - $($_.Exception.GetType().Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Backend API Routes - Management
Write-Host "[2/7] BACKEND MANAGEMENT API" -ForegroundColor Yellow

$apiRoutes = @(
    @{ Name = "Management Status"; Url = "$BACKEND_URL/api/management/status" },
    @{ Name = "Management Health"; Url = "$BACKEND_URL/api/management/health" },
    @{ Name = "Management Raw Status"; Url = "$BACKEND_URL/api/management/raw-status" }
)

foreach ($route in $apiRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Help System API
Write-Host "[3/7] BACKEND HELP SYSTEM API" -ForegroundColor Yellow

$helpRoutes = @(
    @{ Name = "Help Glossary"; Url = "$BACKEND_URL/api/help/glossary" },
    @{ Name = "Help Manual"; Url = "$BACKEND_URL/api/help/manual" },
    @{ Name = "Help Release Notes"; Url = "$BACKEND_URL/api/help/release-notes" },
    @{ Name = "Help Documentation"; Url = "$BACKEND_URL/api/help/documentation" }
)

foreach ($route in $helpRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Technical Audit API
Write-Host "[4/7] BACKEND TECHNICAL AUDIT API" -ForegroundColor Yellow

$auditRoutes = @(
    @{ Name = "Technical Audit Summary"; Url = "$BACKEND_URL/api/technical-audit/summary" },
    @{ Name = "Technical Audit Report"; Url = "$BACKEND_URL/api/technical-audit/report" }
)

foreach ($route in $auditRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Services API
Write-Host "[5/7] BACKEND SERVICES API" -ForegroundColor Yellow

$serviceRoutes = @(
    @{ Name = "Services Health"; Url = "$BACKEND_URL/api/services/health" },
    @{ Name = "Services Status"; Url = "$BACKEND_URL/api/services" }
)

foreach ($route in $serviceRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Health Endpoints
Write-Host "[6/7] HEALTH ENDPOINTS" -ForegroundColor Yellow

$healthRoutes = @(
    @{ Name = "Backend Health"; Url = "$BACKEND_URL/health" },
    @{ Name = "Frontend Health"; Url = "$FRONTEND_URL/health" }
)

foreach ($route in $healthRoutes) {
    try {
        $resp = Invoke-WebRequest $route.Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [OK] $($route.Name)" -ForegroundColor Green
            $passCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $($route.Name)" -ForegroundColor Red
        $failCount++
    }
}

# Test Docker Services
Write-Host "[7/7] DOCKER SERVICES" -ForegroundColor Yellow

$services = @("backend", "frontend", "postgres", "redis", "pgadmin")

foreach ($service in $services) {
    try {
        $output = & docker-compose ps $service 2>&1 | Select-String "Up"
        if ($output) {
            Write-Host "  [OK] $service" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] $service (not running)" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "  [FAIL] $service (error)" -ForegroundColor Red
        $failCount++
    }
}

# Summary
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$totalTests = $passCount + $failCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "Passed:       $passCount" -ForegroundColor Green
Write-Host "Failed:       $failCount" -ForegroundColor Red
Write-Host "Total:        $totalTests" -ForegroundColor Yellow
Write-Host "Success Rate: $successRate%" -ForegroundColor Cyan
$duration = (Get-Date) - $startTime
Write-Host "Duration:     $([math]::Round($duration.TotalSeconds, 2))s" -ForegroundColor Gray

Write-Host ""

if ($failCount -eq 0) {
    Write-Host "RESULT: ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "RESULT: SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
