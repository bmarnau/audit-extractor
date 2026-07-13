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

# Step 3: Start services if needed
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
        
        # Wait for services
        Write-Host "`n[4/7] Waiting for services to be ready..." -ForegroundColor Yellow
        $maxWait = 30
        $waited = 0
        
        while ($waited -lt $maxWait) {
            $pg = docker exec extractor-postgres pg_isready -U extractor_user 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL is ready" -ForegroundColor Green
                break
            }
            
            $waited++
            Write-Host "  Waiting... ($waited/$maxWait)" -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
    }
} else {
    Write-Host "[OK] All services already running" -ForegroundColor Green
    Write-Host "[4/7] Skipping startup" -ForegroundColor Gray
}

# Step 5: Run tests
Write-Host "`n[5/7] Running tests..." -ForegroundColor Yellow

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$testOutput = npm test -- --json --outputFile="$outputDir/test-results.json" 2>&1
$testExitCode = $LASTEXITCODE

Write-Host "[OK] Test execution complete (exit code: $testExitCode)" -ForegroundColor Cyan

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
    
    # Generate PDF summary (text)
    $serviceDetails = ""
    foreach ($action in $serviceActions) {
        $actionText = if ($action.action -eq "up") { "RESTARTED" } else { "RUNNING" }
        $serviceDetails += "`n  * $($action.service): $actionText at $($action.timestamp)"
    }
    
    $pdfContent = @"
PHASE 31 TEST EXECUTION REPORT
Comprehensive Test Executor with Docker Management

EXECUTION TIME METRICS
==========================================================
Start Time: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))
End Time: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))
Duration: $([math]::Round($duration.TotalSeconds, 2))s
Report Generated: $timestamp

TEST RESULTS
==========================================================
Total Tests: $totalTests
Passed: $passedTests
Failed: $failedTests
Skipped: $skippedTests
Success Rate: $successRate%

DOCKER SERVICE STATUS
==========================================================
Services Restarted: $($serviceActions | Where-Object { $_.action -eq 'up' } | Measure-Object).Count
Services Already Running: $($serviceActions | Where-Object { $_.action -eq 'none' } | Measure-Object).Count

Service Details:$serviceDetails

TECHNICAL DETAILS
==========================================================
Framework: Jest with TypeScript
Exit Code: $testExitCode
Docker Compose: Active
Test Strategy: Intelligent auto-detection and recovery
"@
    
    $pdfContent | Out-File -FilePath "$outputDir/test-report.pdf.txt" -Encoding UTF8
    Write-Host "[OK] Generated: test-report.pdf.txt" -ForegroundColor Green
    
    # Generate manifest
    $manifest = @{
        "timestamp" = $timestamp
        "duration_seconds" = [math]::Round($duration.TotalSeconds, 2)
        "statistics" = @{
            "total" = $totalTests
            "passed" = $passedTests
            "failed" = $failedTests
            "skipped" = $skippedTests
            "success_rate" = $successRate
        }
        "services" = @{
            "restarted_count" = ($serviceActions | Where-Object { $_.action -eq 'up' } | Measure-Object).Count
            "already_running" = ($serviceActions | Where-Object { $_.action -eq 'none' } | Measure-Object).Count
            "actions" = $serviceActions
        }
        "exit_code" = $testExitCode
    } | ConvertTo-Json
    
    $manifest | Out-File -FilePath "$outputDir/manifest.json" -Encoding UTF8
    Write-Host "[OK] Generated: manifest.json" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[DONE] Test Execution Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nOutput Directory: $outputDir" -ForegroundColor Yellow
Write-Host "`nGenerated Files:" -ForegroundColor Yellow
Get-ChildItem $outputDir -File | ForEach-Object {
    $size = "{0:N0}" -f $_.Length
    Write-Host "  [FILE] $($_.Name) ($size bytes)" -ForegroundColor Cyan
}

$restartedCount = ($serviceActions | Where-Object { $_.action -eq 'up' } | Measure-Object).Count
if ($restartedCount -gt 0) {
    Write-Host "`n[RESTART] Services Restarted: $restartedCount" -ForegroundColor Yellow
}

Write-Host "`nTotal Duration: $([math]::Round($duration.TotalSeconds, 2))s" -ForegroundColor Yellow
Write-Host ""
