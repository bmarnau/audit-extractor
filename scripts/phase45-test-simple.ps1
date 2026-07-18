#!/usr/bin/env pwsh
# Phase 45: Complete Test Suite

$api = "http://localhost:3000/api"
$passed = 0; $failed = 0

Write-Host "`nPHASE 45: COMPREHENSIVE TEST SUITE" -ForegroundColor Cyan
Write-Host "==================================================`n"

# 1. PDF TESTS
Write-Host "1. PDF EXPORT TESTS" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest "$api/management/export-pdf" -Method POST -Body "{}" -ContentType "application/json" -UseBasicParsing
    $magic = [System.Text.Encoding]::ASCII.GetString($r.Content[0..3])
    if ($magic -eq "%PDF" -and $r.Content.Length -gt 5000) {
        Write-Host "   [PASS] Management PDF ($($r.Content.Length) bytes)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   [FAIL] Management PDF (magic=$magic, size=$($r.Content.Length))" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   [ERROR] Management PDF: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# 2. FRONTEND ROUTES
Write-Host "`n2. FRONTEND ROUTES" -ForegroundColor Yellow
@(
    @{ url = "http://localhost/"; name = "Home" }
    @{ url = "http://localhost/management"; name = "Management" }
    @{ url = "http://localhost/help"; name = "Help" }
) | ForEach-Object {
    try {
        $r = Invoke-WebRequest $_.url -UseBasicParsing -TimeoutSec 3
        Write-Host "   [PASS] $($_.name)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   [FAIL] $($_.name)" -ForegroundColor Red
        $failed++
    }
}

# 3. MANAGEMENT API
Write-Host "`n3. MANAGEMENT API" -ForegroundColor Yellow
@(
    @{ path = "management/status"; name = "Status" }
    @{ path = "management/health"; name = "Health" }
) | ForEach-Object {
    try {
        $r = Invoke-WebRequest "$api/$($_.path)" -UseBasicParsing -TimeoutSec 3
        Write-Host "   [PASS] $($_.name)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   [FAIL] $($_.name)" -ForegroundColor Red
        $failed++
    }
}

# 4. HELP SYSTEM
Write-Host "`n4. HELP SYSTEM" -ForegroundColor Yellow
@(
    @{ path = "help/manual"; name = "Manual" }
    @{ path = "help/release-notes"; name = "Release Notes" }
    @{ path = "help/glossary"; name = "Glossary" }
) | ForEach-Object {
    try {
        $r = Invoke-WebRequest "$api/$($_.path)" -UseBasicParsing -TimeoutSec 3
        if ($r.Content.Length -gt 100) {
            Write-Host "   [PASS] $($_.name) - $($r.Content.Length) bytes" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   [FAIL] $($_.name) - Empty" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "   [FAIL] $($_.name)" -ForegroundColor Red
        $failed++
    }
}

# 5. HEALTH CHECK
Write-Host "`n5. HEALTH CHECK" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   [PASS] Backend Health" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "   [FAIL] Backend Health" -ForegroundColor Red
    $failed++
}

try {
    $r = Invoke-WebRequest "http://localhost/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   [PASS] Frontend Health" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "   [FAIL] Frontend Health" -ForegroundColor Red
    $failed++
}

# SUMMARY
$total = $passed + $failed
$pct = if ($total -gt 0) { [math]::Round(($passed / $total) * 100) } else { 0 }

Write-Host "`n==================================================`n"
Write-Host "RESULTS: $passed PASS | $failed FAIL | $total total | $pct% success`n" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

exit if ($failed -gt 0) { 1 } else { 0 }
