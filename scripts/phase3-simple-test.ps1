Write-Host "PHASE 3: PDF INTEGRATION TESTING" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$passed = 0
$failed = 0

# Test 1: Download Management Report
Write-Host "[TEST 1] Download Management Report PDF"
try {
    $response = Invoke-WebRequest "$baseUrl/management/export-pdf" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing
    $pdfData = $response.Content
    
    # Check magic number
    $first4 = [System.Text.Encoding]::ASCII.GetString($pdfData[0..3])
    
    if ($response.StatusCode -eq 200 -and $first4 -like "%PDF*") {
        Write-Host "  Status: HTTP $($response.StatusCode) - OK" -ForegroundColor Green
        Write-Host "  Size: $($pdfData.Length) bytes" -ForegroundColor Green
        Write-Host "  Magic: $first4" -ForegroundColor Green
        Write-Host "  Result: PASS" -ForegroundColor Green
        $passed++
        
        # Save file
        $filename = "pdf-export-tests/management-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').pdf"
        New-Item -ItemType Directory -Path "pdf-export-tests" -Force | Out-Null
        [System.IO.File]::WriteAllBytes($filename, $pdfData)
        Write-Host "  Saved: $filename`n" -ForegroundColor Green
    } else {
        Write-Host "  Failed: Magic number check failed`n" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  Failed: $($_.Exception.Message)`n" -ForegroundColor Red
    $failed++
}

# Test 2: Performance - 5 iterations
Write-Host "[TEST 2] Performance Benchmark (5 iterations)"
$times = @()
for ($i = 1; $i -le 5; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest "$baseUrl/management/export-pdf" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing
        $sw.Stop()
        $times += $sw.ElapsedMilliseconds
        Write-Host "  Run $($i): $($sw.ElapsedMilliseconds)ms"
    } catch {
        Write-Host "  Run $($i): FAILED"
    }
}
if ($times.Count -gt 0) {
    $avg = [Math]::Round(($times | Measure-Object -Average).Average, 2)
    Write-Host "  Average: ${avg}ms - PASS`n" -ForegroundColor Green
    $passed++
} else {
    $failed++
}

# Test 3: Help system endpoints
Write-Host "[TEST 3] Help System Endpoints"
$endpoints = @(
    "/api/help/manual",
    "/api/help/release-notes",
    "/api/help/glossary"
)
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest "http://localhost:3000$endpoint" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  GET $endpoint - OK" -ForegroundColor Green
            $passed++
        }
    } catch {
        Write-Host "  GET $endpoint - FAILED" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Test 4: Management status
Write-Host "[TEST 4] Management Status Endpoint"
try {
    $response = Invoke-WebRequest "$baseUrl/management/status" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  Status: HTTP $($response.StatusCode) - OK" -ForegroundColor Green
        Write-Host "  Version: $($data.data.project.version)" -ForegroundColor Green
        Write-Host "  Result: PASS`n" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "  Failed: $($_.Exception.Message)`n" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"
Write-Host "Total: $($passed + $failed)"
$rate = if (($passed + $failed) -gt 0) { [Math]::Round(($passed/($passed+$failed))*100, 0) } else { 0 }
Write-Host "Success Rate: $rate%"
Write-Host ""
if ($failed -eq 0) {
    Write-Host "RESULT: ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "RESULT: $failed TESTS FAILED" -ForegroundColor Yellow
}
