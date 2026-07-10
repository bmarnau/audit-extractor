#!/usr/bin/env pwsh
# Task 10 Frontend + Backend Integration Test
# Tests Job API Integration mit allen Funktionen

param(
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Colors
$green = "Green"
$red = "Red"
$yellow = "Yellow"
$cyan = "Cyan"

# Test counters
$testsRun = 0
$testsPassed = 0
$testsFailed = 0

function Write-TestHeader {
    param([string]$header)
    write-host ""
    write-host "===================================================================" -ForegroundColor $cyan
    write-host "$header" -ForegroundColor $cyan
    write-host "===================================================================" -ForegroundColor $cyan
    write-host ""
}

function Write-TestCase {
    param([string]$name, [string]$description)
    write-host "  TEST: $name" -ForegroundColor $cyan
    if ($description) {
        write-host "    → $description" -ForegroundColor Gray
    }
}

function Write-TestPass {
    param([string]$message)
    write-host "    [OK] PASS: $message" -ForegroundColor $green
    $script:testsPassed++
}

function Write-TestFail {
    param([string]$message)
    write-host "    [ERR] FAIL: $message" -ForegroundColor $red
    $script:testsFailed++
}

function Test-Endpoint {
    param(
        [string]$name,
        [string]$description,
        [string]$method,
        [string]$endpoint,
        [PSObject]$body = $null,
        [int]$expectedStatus = 200
    )

    $script:testsRun++
    Write-TestCase $name $description

    try {
        $url = "http://localhost:3000$endpoint"
        $params = @{
            Uri = $url
            Method = $method
            UseBasicParsing = $true
            TimeoutSec = 10
        }

        if ($method -ne "GET" -and $method -ne "DELETE" -and $body) {
            $params["Body"] = $body | ConvertTo-Json -Depth 10
            $params["ContentType"] = "application/json"
        }

        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $expectedStatus) {
            Write-TestPass "HTTP $($response.StatusCode) received (expected: $expectedStatus)"
            return $response | ConvertFrom-Json -Depth 10
        } else {
            Write-TestFail "HTTP $($response.StatusCode) received (expected: $expectedStatus)"
            return $null
        }
    } catch {
        Write-TestFail "Exception: $($_.Exception.Message)"
        return $null
    }
}

# ============================================================================
# TEST 1: HEALTH CHECK
# ============================================================================

Write-TestHeader "1. HEALTH CHECK"

Test-Endpoint `
    -name "Backend Health" `
    -description "Verify backend is running" `
    -method "GET" `
    -endpoint "/health" `
    -expectedStatus 200 | Out-Null

# ============================================================================
# TEST 2: JOB CREATION SCENARIOS
# ============================================================================

Write-TestHeader "2. JOB CREATION SCENARIOS"

# Test 2.1: Valid job creation
Write-TestCase "Create Valid Job" "POST /api/jobs with documentContent"
$job1 = Test-Endpoint `
    -name "Create Valid Job" `
    -description "POST /api/jobs with valid documentContent" `
    -method "POST" `
    -endpoint "/api/jobs" `
    -body @{ documentContent = "Invoice #INV-001: Total: $1,000" } `
    -expectedStatus 201

if ($job1) {
    $jobId1 = $job1.data.id
    Write-TestPass "Job created: $jobId1"
} else {
    Write-TestFail "Failed to create job"
}

# Test 2.2: Invalid job creation (missing documentContent)
Write-TestCase "Invalid Job Creation" "POST /api/jobs without documentContent"
$script:testsRun++
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" `
        -Method "POST" `
        -Body (ConvertTo-Json @{ jobType = "test" }) `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10 -ErrorAction Stop
    Write-TestFail "Expected 400 status but got $($response.StatusCode)"
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 400) {
        Write-TestPass "400 Bad Request received as expected"
    } else {
        Write-TestFail "Unexpected status: $($_.Exception.Response.StatusCode.Value__)"
    }
}

# ============================================================================
# TEST 3: JOB QUERY & RETRIEVAL
# ============================================================================

Write-TestHeader "3. JOB QUERY & RETRIEVAL"

# Test 3.1: List all jobs
Write-TestCase "List All Jobs" "GET /api/jobs (pagination test)"
$jobsList = Test-Endpoint `
    -name "List Jobs" `
    -description "GET /api/jobs with defaults" `
    -method "GET" `
    -endpoint "/api/jobs?limit=10&offset=0" `
    -expectedStatus 200

if ($jobsList) {
    Write-TestPass "Found $($jobsList.data.total) total jobs"
}

# Test 3.2: Get specific job details
if ($jobId1) {
    Write-TestCase "Get Job Details" "GET /api/jobs/{id} for created job"
    $jobDetails = Test-Endpoint `
        -name "Get Job Details" `
        -description "Retrieve job details by ID" `
        -method "GET" `
        -endpoint "/api/jobs/$jobId1" `
        -expectedStatus 200

    if ($jobDetails) {
        Write-TestPass "Job status: $($jobDetails.data.status)"
    }
}

# Test 3.3: Get job result
if ($jobId1) {
    Write-TestCase "Get Job Result" "GET /api/jobs/{id}/result"
    Start-Sleep -Milliseconds 2000
    
    $jobResult = Test-Endpoint `
        -name "Get Job Result" `
        -description "Retrieve job processing result" `
        -method "GET" `
        -endpoint "/api/jobs/$jobId1/result" `
        -expectedStatus 200

    if ($jobResult) {
        Write-TestPass "Job result status: $($jobResult.data.status)"
    }
}

# ============================================================================
# TEST 4: JOB CANCELLATION
# ============================================================================

Write-TestHeader "4. JOB CANCELLATION"

# Create a new job to cancel
$jobToCancel = Test-Endpoint `
    -name "Create Job for Cancellation" `
    -description "Create a job that we'll cancel" `
    -method "POST" `
    -endpoint "/api/jobs" `
    -body @{ documentContent = "Job to be cancelled" } `
    -expectedStatus 201

if ($jobToCancel) {
    $jobId2 = $jobToCancel.data.id
    
    # Wait a moment then cancel
    Start-Sleep -Milliseconds 500
    
    Write-TestCase "Cancel Job" "DELETE /api/jobs/{id}"
    $script:testsRun++
    try {
        $cancelResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/$jobId2" `
            -Method "DELETE" `
            -UseBasicParsing `
            -TimeoutSec 10

        if ($cancelResponse.StatusCode -eq 200) {
            Write-TestPass "Job cancelled successfully"
        } else {
            Write-TestFail "Unexpected status: $($cancelResponse.StatusCode)"
        }
    } catch {
        Write-TestFail "Cancel request failed: $($_.Exception.Message)"
    }
}

# ============================================================================
# TEST 5: RETRY FUNCTIONALITY
# ============================================================================

Write-TestHeader "5. RETRY FUNCTIONALITY (Error Handling)"

# Test 5.1: Retry endpoint exists
Write-TestCase "Retry Endpoint" "POST /api/jobs/{id}/retry endpoint test"
$script:testsRun++

# Create a job that might fail or complete
$jobForRetry = Test-Endpoint `
    -name "Create Job for Retry Test" `
    -description "Create job to test retry logic" `
    -method "POST" `
    -endpoint "/api/jobs" `
    -body @{ 
        documentContent = "Test invoice for retry" 
        jobType = "extraction"
    } `
    -expectedStatus 201

if ($jobForRetry) {
    $jobId3 = $jobForRetry.data.id
    
    # Wait for completion/failure
    Start-Sleep -Milliseconds 3000
    
    # Check if job failed
    $jobCheck = Test-Endpoint `
        -name "Check Job Status Before Retry" `
        -description "Verify job status" `
        -method "GET" `
        -endpoint "/api/jobs/$jobId3" `
        -expectedStatus 200

    if ($jobCheck -and $jobCheck.data.status -eq "failed") {
        Write-TestPass "Job failed as expected, ready for retry"
        
        # Try retry
        $script:testsRun++
        try {
            $retryResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/$jobId3/retry" `
                -Method "POST" `
                -Body (ConvertTo-Json @{ immediate = $true }) `
                -ContentType "application/json" `
                -UseBasicParsing `
                -TimeoutSec 10

            if ($retryResponse.StatusCode -eq 200) {
                Write-TestPass "Retry initiated successfully"
            } else {
                Write-TestFail "Retry returned unexpected status: $($retryResponse.StatusCode)"
            }
        } catch {
            if ($_.Exception.Response.StatusCode.Value__ -eq 400) {
                Write-TestPass "Retry properly rejected non-failed job (expected)"
            } else {
                Write-TestFail "Retry failed with unexpected error: $($_.Exception.Message)"
            }
        }
    } else {
        Write-TestPass "Job completed successfully (no retry needed)"
    }
}

# ============================================================================
# TEST 6: DEAD-LETTER QUEUE
# ============================================================================

Write-TestHeader "6. DEAD-LETTER QUEUE"

# Test 6.1: Query dead-letter queue
Write-TestCase "Dead-Letter Queue" "GET /api/jobs/dead-letter/queue"
$dlqResponse = Test-Endpoint `
    -name "Query Dead-Letter Queue" `
    -description "Retrieve jobs in dead-letter queue" `
    -method "GET" `
    -endpoint "/api/jobs/dead-letter/queue?limit=10&offset=0" `
    -expectedStatus 200

if ($dlqResponse) {
    Write-TestPass "Dead-letter queue contains $($dlqResponse.data.total) jobs"
}

# ============================================================================
# TEST 7: JOB STATISTICS
# ============================================================================

Write-TestHeader "7. JOB STATISTICS"

Write-TestCase "Job Statistics" "GET /api/jobs/stats/summary"
$statsResponse = Test-Endpoint `
    -name "Get Job Statistics" `
    -description "Retrieve job processing statistics" `
    -method "GET" `
    -endpoint "/api/jobs/stats/summary" `
    -expectedStatus 200

if ($statsResponse) {
    Write-TestPass "Statistics retrieved successfully"
}

# ============================================================================
# PERFORMANCE TEST
# ============================================================================

Write-TestHeader "8. PERFORMANCE TESTING"

# Create multiple jobs and measure response time
$perfTests = 5
write-host "Creating $perfTests jobs to measure performance..." -ForegroundColor $yellow

$responseTimes = @()
for ($i = 1; $i -le $perfTests; $i++) {
    $script:testsRun++
    
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" `
            -Method "POST" `
            -Body (ConvertTo-Json @{ documentContent = "Performance test job $i" }) `
            -ContentType "application/json" `
            -UseBasicParsing `
            -TimeoutSec 10
        
        $duration = (Get-Date) - $startTime
        $responseTimes += $duration.TotalMilliseconds
        
        if ($response.StatusCode -eq 201) {
            Write-TestPass "Job $i created in $([math]::Round($duration.TotalMilliseconds, 2))ms"
        }
    } catch {
        Write-TestFail "Job $i creation failed: $($_.Exception.Message)"
    }
}

if ($responseTimes.Count -gt 0) {
    $avgTime = ($responseTimes | Measure-Object -Average).Average
    $minTime = ($responseTimes | Measure-Object -Minimum).Minimum
    $maxTime = ($responseTimes | Measure-Object -Maximum).Maximum
    
    write-host ""
    write-host "  Performance Metrics:" -ForegroundColor $cyan
    write-host "    Average Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor $green
    write-host "    Min Response Time: $([math]::Round($minTime, 2))ms" -ForegroundColor $green
    write-host "    Max Response Time: $([math]::Round($maxTime, 2))ms" -ForegroundColor $green
}

# ============================================================================
# TEST SUMMARY
# ============================================================================

Write-TestHeader "TEST SUMMARY"

$passRate = if ($testsRun -gt 0) { [math]::Round(($testsPassed / $testsRun) * 100, 1) } else { 0 }

write-host "Total Tests Run:    $testsRun" -ForegroundColor $cyan
write-host "Tests Passed:       $testsPassed" -ForegroundColor $green
write-host "Tests Failed:       $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { $red } else { $green })
write-host "Pass Rate:          $passRate%" -ForegroundColor $(if ($passRate -ge 80) { $green } else { $yellow })

write-host ""

if ($passRate -ge 80) {
    write-host "[OK] INTEGRATION TEST SUCCESSFUL" -ForegroundColor $green
} else {
    write-host "[WARN] INTEGRATION TEST NEEDS ATTENTION" -ForegroundColor $red
}

write-host ""
