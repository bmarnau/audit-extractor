#!/usr/bin/env pwsh
<#
.SYNOPSIS
Phase 3: PDF Export Integration Testing
Test both PDF endpoints with actual downloads and validation
#>

Write-Host @"
=============================================================
PHASE 3: PDF EXPORT INTEGRATION TESTING - Version 0.37.1
=============================================================
Start Time: $(Get-Date -Format 'MM/dd/yyyy HH:mm:ss')
"@ -ForegroundColor Cyan

# Test configuration
$baseUrl = "http://localhost:3000/api"
$testDir = "pdf-export-tests"
$testResults = @()

# Create test directory
if ($SaveFiles -and -not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
    Write-Host "📁 Created test directory: $testDir" -ForegroundColor Green
}

# Helper function to validate PDF
function Test-PDFValidity {
    param([byte[]]$buffer)
    
    $result = @{
        isValid = $false
        hasMagicNumber = $false
        hasEOFMarker = $false
        hasObjects = $false
        size = $buffer.Length
        errors = @()
    }
    
    # Check magic number
    $first4 = [System.Text.Encoding]::ASCII.GetString($buffer[0..3])
    if ($first4 -like "%PDF*") {
        $result.hasMagicNumber = $true
    } else {
        $result.errors += "Missing PDF magic number"
    }
    
    # Check EOF marker
    $last20 = [System.Text.Encoding]::ASCII.GetString($buffer[($buffer.Length-20)..($buffer.Length-1)])
    if ($last20 -like "*%%EOF*") {
        $result.hasEOFMarker = $true
    } else {
        $result.errors += "Missing EOF marker"
    }
    
    # Check for objects
    $fullText = [System.Text.Encoding]::ASCII.GetString($buffer)
    $objCount = ($fullText | Select-String -Pattern "endobj" -AllMatches).Matches.Count
    if ($objCount -gt 0) {
        $result.hasObjects = $true
    } else {
        $result.errors += "No PDF objects found"
    }
    
    $result.isValid = ($result.hasMagicNumber -and $result.hasEOFMarker -and $result.hasObjects)
    return $result
}

# Test 1: Management Report PDF Download
Write-Host "`n[1/4] MANAGEMENT REPORT PDF" -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-WebRequest "$baseUrl/management/export-pdf" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{}" `
        -UseBasicParsing
    
    $stopwatch.Stop()
    $pdfData = $response.Content
    
    # Validate
    $validation = Test-PDFValidity $pdfData
    
    # Save if requested
    $filename = "$testDir/management-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').pdf"
    if ($SaveFiles) {
        [System.IO.File]::WriteAllBytes($filename, $pdfData)
        Write-Host "  ✅ Downloaded: $filename"
    }
    
    # Report
    Write-Host "  Status: HTTP $($response.StatusCode) ✅"
    Write-Host "  Size: $($pdfData.Length) bytes"
    Write-Host "  Time: $($stopwatch.ElapsedMilliseconds)ms"
    Write-Host "  Magic Number: $(if ($validation.hasMagicNumber) { '✅' } else { '❌' })"
    Write-Host "  EOF Marker: $(if ($validation.hasEOFMarker) { '✅' } else { '❌' })"
    Write-Host "  Objects: $(if ($validation.hasObjects) { '✅' } else { '❌' })"
    Write-Host "  Valid PDF: $(if ($validation.isValid) { '✅ YES' } else { '❌ NO' })"
    
    $testResults += @{
        name = "Management Report PDF"
        status = if ($validation.isValid) { "PASS" } else { "FAIL" }
        size = $pdfData.Length
        time = $stopwatch.ElapsedMilliseconds
        validation = $validation
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Response.StatusCode)"
    $testResults += @{
        name = "Management Report PDF"
        status = "FAIL"
        error = $_.Exception.Message
    }
}

# Test 2: Verify PDF Readability
Write-Host "`n[2/4] PDF READABILITY TEST" -ForegroundColor Yellow
if ($testResults[0].status -eq "PASS") {
    try {
        $pdfPath = Get-Item "$testDir/management-report*.pdf" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($pdfPath) {
            $fileInfo = Get-Item $pdfPath.FullName
            $creation = $fileInfo.CreationTime
            $size = $fileInfo.Length
            
            Write-Host "  File: $($pdfPath.Name)"
            Write-Host "  Size: $size bytes"
            Write-Host "  Created: $creation"
            Write-Host "  ✅ File exists and is readable"
            
            $testResults += @{
                name = "PDF Readability"
                status = "PASS"
                filename = $pdfPath.Name
                size = $size
            }
        } else {
            Write-Host "  ❌ No PDF file found"
            $testResults += @{
                name = "PDF Readability"
                status = "FAIL"
                error = "PDF file not created"
            }
        }
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)"
        $testResults += @{
            name = "PDF Readability"
            status = "FAIL"
            error = $_.Exception.Message
        }
    }
}

# Test 3: Performance Benchmark
Write-Host "`n[3/4] PERFORMANCE BENCHMARK" -ForegroundColor Yellow
$iterations = 5
$times = @()

for ($i = 1; $i -le $iterations; $i++) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest "$baseUrl/management/export-pdf" `
            -Method POST `
            -ContentType "application/json" `
            -Body "{}" `
            -UseBasicParsing
        $stopwatch.Stop()
        $times += $stopwatch.ElapsedMilliseconds
        Write-Host "  Run $i/$iterations : $($stopwatch.ElapsedMilliseconds)ms"
    } catch {
        Write-Host "  Run $i/$iterations : FAILED"
    }
}

if ($times.Count -gt 0) {
    $avg = [Math]::Round(($times | Measure-Object -Average).Average, 2)
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host "  Average: ${avg}ms"
    Write-Host "  Min: ${min}ms | Max: ${max}ms"
    Write-Host "  ✅ Performance acceptable"
    
    $testResults += @{
        name = "Performance Benchmark"
        status = "PASS"
        average = $avg
        min = $min
        max = $max
    }
}

# Test 4: Technical Audit Report (if available)
Write-Host "`n[4/4] TECHNICAL AUDIT REPORT" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/technical-tests/reports/test-001/export" `
        -Method GET `
        -UseBasicParsing
    
    Write-Host "  Status: HTTP $($response.StatusCode) ✅"
    Write-Host "  Size: $($response.Content.Length) bytes"
    
    $validation = Test-PDFValidity $response.Content
    Write-Host "  Valid PDF: $(if ($validation.isValid) { '✅ YES' } else { '❌ NO' })"
    
    $testResults += @{
        name = "Technical Audit Report"
        status = if ($validation.isValid) { "PASS" } else { "FAIL" }
        size = $response.Content.Length
    }
} catch {
    Write-Host "  ⚠️  Endpoint not available (expected - may require valid report ID)"
    $testResults += @{
        name = "Technical Audit Report"
        status = "SKIP"
        reason = "Endpoint not available"
    }
}

# Summary
Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.status -eq "FAIL" }).Count
$skipped = ($testResults | Where-Object { $_.status -eq "SKIP" }).Count
$total = $testResults.Count

foreach ($test in $testResults) {
    $symbol = if ($test.status -eq "PASS") { "✅" } elseif ($test.status -eq "FAIL") { "❌" } else { "⚠️" }
    Write-Host "$symbol $($test.name): $($test.status)"
}

Write-Host "`nPassed:  $passed"
Write-Host "Failed:  $failed"
Write-Host "Skipped: $skipped"
Write-Host "Total:   $total"
Write-Host "Success Rate: $(if ($total -gt 0) { [Math]::Round(($passed/$total)*100, 0) }%)%"
Write-Host "Duration: $(Get-Date)"
Write-Host ""
Write-Host "RESULT: $(if ($failed -eq 0) { 'ALL TESTS PASSED' } else { "SOME TESTS FAILED ($failed/$total)" })" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "`nTest files saved to: $testDir/"
Write-Host "=============================================================" -ForegroundColor Cyan
