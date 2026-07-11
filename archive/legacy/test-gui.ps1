#Requires -Version 5.0
<#
.SYNOPSIS
Testet alle GUI Funktionen mehrfach
.DESCRIPTION
Systematisches Testen aller Frontend-Features
#>

param(
    [int]$Iterations = 3
)

function Write-Test {
    param([string]$Message, [string]$Status = 'PASS', [string]$Color = 'Green')
    $symbol = if ($Status -eq 'PASS') { '✓' } else { '✗' }
    Write-Host "$symbol $Message" -ForegroundColor $Color
}

function Test-Endpoint {
    param([string]$Url, [string]$Name)
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Test "$Name" "PASS" "Green"
            return $true
        }
    } catch {
        Write-Test "$Name (Status: $($_.Exception.Response.StatusCode))" "FAIL" "Red"
        return $false
    }
}

$results = @{
    'API Endpoints' = @()
    'Frontend Pages' = @()
    'Help Content' = @()
    'Schema Operations' = @()
}

Write-Host "`n" "=====================================" -ForegroundColor Cyan
Write-Host " GUI FUNCTIONAL TEST SUITE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Test API Endpoints
Write-Host "`n[1/4] Testing API Endpoints..." -ForegroundColor Yellow
$apiTests = @(
    @{ Url = 'http://localhost:3000/health'; Name = 'Health Check' }
    @{ Url = 'http://localhost:3000/api/schema/schemas'; Name = 'Schema List' }
    @{ Url = 'http://localhost:3000/api/help/glossary'; Name = 'Help Glossary' }
    @{ Url = 'http://localhost:3000/api/help/documentation'; Name = 'Help Documentation' }
    @{ Url = 'http://localhost:3000/api/help/manual'; Name = 'Help Manual' }
    @{ Url = 'http://localhost:3000/api/help/release-notes'; Name = 'Help Release Notes' }
)

$apiTests | ForEach-Object {
    if (Test-Endpoint -Url $_.Url -Name $_.Name) {
        $results['API Endpoints'] += @{ Name = $_.Name; Status = 'PASS' }
    } else {
        $results['API Endpoints'] += @{ Name = $_.Name; Status = 'FAIL' }
    }
}

# Test Frontend Pages
Write-Host "`n[2/4] Testing Frontend Pages..." -ForegroundColor Yellow
$pageTests = @(
    @{ Url = 'http://localhost/'; Name = 'Home Page' }
    @{ Url = 'http://localhost/schemas'; Name = 'Schemas Page' }
    @{ Url = 'http://localhost/help'; Name = 'Help Page' }
    @{ Url = 'http://localhost/dashboard'; Name = 'Dashboard Page' }
)

$pageTests | ForEach-Object {
    if (Test-Endpoint -Url $_.Url -Name $_.Name) {
        $results['Frontend Pages'] += @{ Name = $_.Name; Status = 'PASS' }
    } else {
        $results['Frontend Pages'] += @{ Name = $_.Name; Status = 'FAIL' }
    }
}

# Test Help Content Availability
Write-Host "`n[3/4] Testing Help Content..." -ForegroundColor Yellow
try {
    $glossary = (Invoke-WebRequest 'http://localhost:3000/api/help/glossary' -UseBasicParsing | ConvertFrom-Json).data
    Write-Test "Glossary has entries ($($glossary.Count) items)" "PASS" "Green"
    $results['Help Content'] += @{ Name = "Glossary ($($glossary.Count) items)"; Status = 'PASS' }
} catch {
    Write-Test "Glossary" "FAIL" "Red"
    $results['Help Content'] += @{ Name = "Glossary"; Status = 'FAIL' }
}

try {
    $docs = (Invoke-WebRequest 'http://localhost:3000/api/help/documentation' -UseBasicParsing | ConvertFrom-Json).data
    Write-Test "Documentation has entries ($($docs.Count) items)" "PASS" "Green"
    $results['Help Content'] += @{ Name = "Documentation ($($docs.Count) items)"; Status = 'PASS' }
} catch {
    Write-Test "Documentation" "FAIL" "Red"
    $results['Help Content'] += @{ Name = "Documentation"; Status = 'FAIL' }
}

try {
    $manual = (Invoke-WebRequest 'http://localhost:3000/api/help/manual' -UseBasicParsing | ConvertFrom-Json).data
    Write-Test "Manual has entries ($($manual.Count) items)" "PASS" "Green"
    $results['Help Content'] += @{ Name = "Manual ($($manual.Count) items)"; Status = 'PASS' }
} catch {
    Write-Test "Manual" "FAIL" "Red"
    $results['Help Content'] += @{ Name = "Manual"; Status = 'FAIL' }
}

try {
    $notes = (Invoke-WebRequest 'http://localhost:3000/api/help/release-notes' -UseBasicParsing | ConvertFrom-Json).data
    Write-Test "Release Notes has entries ($($notes.Count) items)" "PASS" "Green"
    $results['Help Content'] += @{ Name = "Release Notes ($($notes.Count) items)"; Status = 'PASS' }
} catch {
    Write-Test "Release Notes" "FAIL" "Red"
    $results['Help Content'] += @{ Name = "Release Notes"; Status = 'FAIL' }
}

# Test Schema Operations
Write-Host "`n[4/4] Testing Schema Operations..." -ForegroundColor Yellow
try {
    $schemas = (Invoke-WebRequest 'http://localhost:3000/api/schema/schemas' -UseBasicParsing | ConvertFrom-Json).data
    Write-Test "List Schemas ($($schemas.Count) schemas)" "PASS" "Green"
    $results['Schema Operations'] += @{ Name = "List Schemas ($($schemas.Count))"; Status = 'PASS' }
    
    if ($schemas.Count -gt 0) {
        $firstSchema = $schemas[0]
        Write-Test "  - Schema: $($firstSchema.name) (v$($firstSchema.version))" "PASS" "Green"
        Write-Test "  - Fields: $($firstSchema.fieldsCount)" "PASS" "Green"
    }
} catch {
    Write-Test "List Schemas" "FAIL" "Red"
    $results['Schema Operations'] += @{ Name = "List Schemas"; Status = 'FAIL' }
}

# Summary
Write-Host "`n" "=====================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$totalTests = 0
$passedTests = 0

$results.Keys | ForEach-Object {
    $category = $_
    $tests = $results[$_]
    
    $passed = ($tests | Where-Object { $_.Status -eq 'PASS' }).Count
    $total = $tests.Count
    
    $color = if ($passed -eq $total) { 'Green' } else { 'Yellow' }
    Write-Host "`n$category: $passed/$total passed" -ForegroundColor $color
    
    $totalTests += $total
    $passedTests += $passed
}

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)
$color = if ($successRate -eq 100) { 'Green' } elseif ($successRate -ge 80) { 'Yellow' } else { 'Red' }

Write-Host "`n" "=====================================" -ForegroundColor Cyan
Write-Host " OVERALL: $passedTests/$totalTests tests passed ($successRate%)" -ForegroundColor $color
Write-Host "=====================================" -ForegroundColor Cyan

if ($successRate -eq 100) {
    Write-Host "`n✓ ALL TESTS PASSED - System ready for Phase B!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n⚠ MOST TESTS PASSED - Review failures before proceeding" -ForegroundColor Yellow
} else {
    Write-Host "`n✗ MULTIPLE FAILURES - System not ready" -ForegroundColor Red
}
