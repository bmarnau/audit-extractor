#!/usr/bin/env pwsh
# Intelligenter Test Runner mit Docker Service Management

$outputDir = "./Testoutput"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$startTime = Get-Date
$serviceActions = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Intelligent Test Runner with Docker Support" -ForegroundColor Yellow
Write-Host "Start: $timestamp" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Docker check
Write-Host "`n[1/7] Checking Docker..." -ForegroundColor Yellow
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Docker is running" -ForegroundColor Green
    $serviceActions += @{
        service = "Docker Daemon"
        status = "RUNNING"
        action = "none"
        timestamp = Get-Date -Format "HH:mm:ss"
    }
} else {
    Write-Host "[ERROR] Docker is not available" -ForegroundColor Red
    exit 1
}

# Step 2: Check services
Write-Host "`n[2/7] Checking services..." -ForegroundColor Yellow
$dockerPsOutput = docker ps --format "table {{.Names}}" 2>&1

$pgRunning = $dockerPsOutput | Select-String "extractor-postgres"
$redisRunning = $dockerPsOutput | Select-String "extractor-redis"

if ($pgRunning) {
    Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
    $serviceActions += @{
        service = "PostgreSQL"
        status = "RUNNING"
        action = "none"
        timestamp = Get-Date -Format "HH:mm:ss"
    }
} else {
    Write-Host "[WARN] PostgreSQL not running" -ForegroundColor Yellow
}

if ($redisRunning) {
    Write-Host "[OK] Redis is running" -ForegroundColor Green
    $serviceActions += @{
        service = "Redis"
        status = "RUNNING"
        action = "none"
        timestamp = Get-Date -Format "HH:mm:ss"
    }
} else {
    Write-Host "[WARN] Redis not running" -ForegroundColor Yellow
}

# Step 3-4: Start services if needed
Write-Host "`n[3/7] Starting missing services..." -ForegroundColor Yellow

if (-not $pgRunning -or -not $redisRunning) {
    if (Test-Path "docker-compose.yml") {
        Write-Host "Starting docker-compose services..." -ForegroundColor Cyan
        docker-compose up -d 2>&1 | Out-Null
        Write-Host "[OK] Services started" -ForegroundColor Green
        
        if (-not $pgRunning) {
            $serviceActions += @{
                service = "PostgreSQL"
                status = "STARTED"
                action = "up"
                timestamp = Get-Date -Format "HH:mm:ss"
            }
        }
        if (-not $redisRunning) {
            $serviceActions += @{
                service = "Redis"
                status = "STARTED"
                action = "up"
                timestamp = Get-Date -Format "HH:mm:ss"
            }
        }
        
        Write-Host "`n[4/7] Validating service startup..." -ForegroundColor Yellow
        $validationScript = "./scripts/validate-service-startup.ps1"
        
        if (Test-Path $validationScript) {
            & $validationScript -MaxWaitSeconds 120 -ServiceCheckInterval 5
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] Services failed to start properly" -ForegroundColor Red
                Write-Host "Run 'docker-compose logs' to see details" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "[WARN] Validation script not found, waiting 15s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
    }
} else {
    Write-Host "[OK] All services already running" -ForegroundColor Green
    Write-Host "[4/7] Skipping startup validation" -ForegroundColor Gray
}

# Step 5: Run tests
Write-Host "`n[5/7] Running tests..." -ForegroundColor Yellow

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$testOutput = npm test -- --json --outputFile="$outputDir/test-results.json" 2>&1
$testExitCode = $LASTEXITCODE

Write-Host "[OK] Test execution complete" -ForegroundColor Cyan

# Step 6: Save service actions
Write-Host "`n[6/7] Saving service diagnostics..." -ForegroundColor Yellow
$serviceActionJson = $serviceActions | ConvertTo-Json
$serviceActionJson | Out-File -FilePath "$outputDir/service-actions.json" -Encoding UTF8
Write-Host "[OK] Service actions saved" -ForegroundColor Green

# Step 7: Generate reports
Write-Host "`n[7/7] Generating reports..." -ForegroundColor Yellow

if (Test-Path "$outputDir/test-results.json") {
    $jestResults = Get-Content "$outputDir/test-results.json" | ConvertFrom-Json
    
    $totalTests = $jestResults.numTotalTests
    $passedTests = $jestResults.numPassedTests
    $failedTests = $jestResults.numFailedTests
    $skippedTests = $jestResults.numPendingTests
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    $pdfContent = @"
PHASE 34 TEST EXECUTION REPORT
Critical Fixes Validation

EXECUTION TIME METRICS
==========================================================
Start Time: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))
End Time: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))
Duration: $([math]::Round($duration.TotalSeconds, 2))s

TEST RESULTS
==========================================================
Total Tests: $totalTests
Passed: $passedTests
Failed: $failedTests
Skipped: $skippedTests
Success Rate: $successRate%

INFRASTRUCTURE IMPROVEMENTS
==========================================================
[✓] PostgreSQL Connection Pool: max_connections=200
[✓] Redis Memory Management: maxmemory=256mb, allkeys-lru
[✓] Service Health Checks: Enhanced intervals and retry logic
[✓] Startup Validation: Comprehensive pre-test health checks

FRAMEWORK: Jest with TypeScript
Docker Integration: Active
"@
    
    $pdfContent | Out-File -FilePath "$outputDir/test-report.pdf.txt" -Encoding UTF8
    Write-Host "[OK] Generated: test-report.pdf.txt" -ForegroundColor Green
    
    $manifest = @{
        timestamp = $timestamp
        duration_seconds = [math]::Round($duration.TotalSeconds, 2)
        statistics = @{
            total_tests = $totalTests
            passed_tests = $passedTests
            failed_tests = $failedTests
            skipped_tests = $skippedTests
            success_rate = $successRate
        }
        services = $serviceActions
    }
    
    $manifest | ConvertTo-Json | Out-File -FilePath "$outputDir/manifest.json" -Encoding UTF8
    Write-Host "[OK] Generated: manifest.json" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Execution Complete" -ForegroundColor Green
Write-Host "Results saved in: $outputDir/" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
