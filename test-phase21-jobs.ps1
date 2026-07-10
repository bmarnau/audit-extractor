#!/usr/bin/env pwsh
# Job API Tests - Phase 21 Asynchronous Jobs
# Tests all 4 endpoints: POST create, GET details, GET result, DELETE cancel

Write-Host "============================================"
Write-Host "PHASE 21: Asynchronous Job API Tests"
Write-Host "============================================"
Write-Host ""

$baseUrl = "http://localhost:3000/api/jobs"
$jobId = $null
$testResults = @()

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$url,
        [hashtable]$body,
        [int]$expectedStatus = 200
    )

    try {
        $params = @{
            Uri = $url
            Method = $method
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }

        if ($body) {
            $params.Body = $body | ConvertTo-Json -Depth 10
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "✅ $name ($method $([uri]::EscapeUriString($url).Replace('api/jobs', '')))"
            $testResults += @{ name = $name; status = "PASS"; statusCode = $statusCode }
            return $response.Content | ConvertFrom-Json
        } else {
            Write-Host "❌ $name - Expected $expectedStatus, got $statusCode"
            $testResults += @{ name = $name; status = "FAIL"; statusCode = $statusCode }
            return $null
        }
    } catch {
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $statusCode = [int]$errorResponse.StatusCode
            $body = $errorResponse.Content | ConvertFrom-Json
            
            if ($statusCode -eq $expectedStatus) {
                Write-Host "✅ $name ($method $([uri]::EscapeUriString($url).Replace('api/jobs', '')))"
                $testResults += @{ name = $name; status = "PASS"; statusCode = $statusCode }
                return $body
            } else {
                Write-Host "❌ $name - Expected $expectedStatus, got $statusCode"
                Write-Host "   Error: $($body.error.message)"
                $testResults += @{ name = $name; status = "FAIL"; statusCode = $statusCode }
                return $null
            }
        } else {
            Write-Host "❌ $name - Connection error: $($_.Exception.Message)"
            $testResults += @{ name = $name; status = "FAIL"; error = $_.Exception.Message }
            return $null
        }
    }
}

# ==============================================================================
# TEST 1: POST /api/jobs - Create a new job
# ==============================================================================
Write-Host ""
Write-Host "[TEST 1] POST /api/jobs (Create new job)"
$jobBody = @{
    documentContent = "Sample extraction content for testing purposes"
    jobType = "extraction"
    description = "Test job from PowerShell"
}

$response = Test-Endpoint -name "Create Job" -method "POST" -url $baseUrl -body $jobBody -expectedStatus 201
if ($response) {
    $jobId = $response.data.id
    Write-Host "   Job ID: $jobId"
    Write-Host "   Status: $($response.data.status)"
    Write-Host "   Requested At: $($response.data.requestedAt)"
}

Write-Host ""

# ==============================================================================
# TEST 2: GET /api/jobs/{id} - Get job details
# ==============================================================================
Write-Host "[TEST 2] GET /api/jobs/{id} (Get job details)"
if ($jobId) {
    $response = Test-Endpoint -name "Get Job Details" -method "GET" -url "$baseUrl/$jobId" -expectedStatus 200
    if ($response) {
        Write-Host "   Job Status: $($response.data.status)"
        Write-Host "   Job Type: $($response.data.jobType)"
        Write-Host "   Requested At: $($response.data.requestedAt)"
        Write-Host "   Error Message: $($response.data.errorMessage)"
    }
}

Write-Host ""

# ==============================================================================
# TEST 3: GET /api/jobs/{id}/result - Get job result
# ==============================================================================
Write-Host "[TEST 3] GET /api/jobs/{id}/result (Get job result)"
if ($jobId) {
    $response = Test-Endpoint -name "Get Job Result" -method "GET" -url "$baseUrl/$jobId/result" -expectedStatus 200
    if ($response) {
        Write-Host "   Status: $($response.data.status)"
        if ($response.data.status -eq "queued" -or $response.data.status -eq "running") {
            Write-Host "   Message: $($response.data.message)"
            Write-Host "   (Job is still processing, waiting 2 seconds...)"
            Start-Sleep -Seconds 2
            
            # Try again after waiting
            $response2 = Test-Endpoint -name "Get Job Result (retry)" -method "GET" -url "$baseUrl/$jobId/result" -expectedStatus 200
            if ($response2) {
                Write-Host "   Status: $($response2.data.status)"
            }
        }
    }
}

Write-Host ""

# ==============================================================================
# TEST 4: GET /api/jobs - List all jobs
# ==============================================================================
Write-Host "[TEST 4] GET /api/jobs (List all jobs)"
$response = Test-Endpoint -name "List Jobs" -method "GET" -url $baseUrl -expectedStatus 200
if ($response) {
    Write-Host "   Total Jobs: $($response.data.total)"
    Write-Host "   Returned: $($response.data.jobs.Count)"
    Write-Host "   Has More: $($response.data.hasMore)"
    Write-Host "   Limit: $($response.data.limit)"
}

Write-Host ""

# ==============================================================================
# TEST 5: GET /api/jobs (List with filter)
# ==============================================================================
Write-Host "[TEST 5] GET /api/jobs?status=queued (Filter by status)"
$response = Test-Endpoint -name "List Queued Jobs" -method "GET" -url "$baseUrl`?status=queued" -expectedStatus 200
if ($response) {
    Write-Host "   Queued Jobs: $($response.data.jobs.Count)"
}

Write-Host ""

# ==============================================================================
# TEST 6: DELETE /api/jobs/{id} - Cancel job
# ==============================================================================
Write-Host "[TEST 6] DELETE /api/jobs/{id} (Cancel job)"
if ($jobId) {
    # Try to cancel - might fail if job already completed
    try {
        $response = Test-Endpoint -name "Cancel Job" -method "DELETE" -url "$baseUrl/$jobId" -expectedStatus 200
        if ($response) {
            Write-Host "   Job Status: $($response.data.status)"
            Write-Host "   Message: $($response.data.message)"
        }
    } catch {
        # If job already completed, that's fine
        Write-Host "⚠️  Job may have already completed"
    }
}

Write-Host ""

# ==============================================================================
# TEST 7: GET /api/jobs/{id} with invalid ID - 404 error
# ==============================================================================
Write-Host "[TEST 7] GET /api/jobs/{invalid-id} (404 error handling)"
$response = Test-Endpoint -name "Get Invalid Job" -method "GET" -url "$baseUrl/invalid-job-id" -expectedStatus 404
if ($response) {
    Write-Host "   Error Code: $($response.error.code)"
    Write-Host "   Error Message: $($response.error.message)"
}

Write-Host ""

# ==============================================================================
# SUMMARY
# ==============================================================================
Write-Host "=========================================="
$passCount = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "✅ TESTS PASSED: $passCount/$totalTests"
Write-Host "❌ TESTS FAILED: $failCount/$totalTests"
Write-Host "=========================================="

if ($failCount -eq 0) {
    Write-Host "✅ ALL PHASE 21 JOB API TESTS PASSED"
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED"
    exit 1
}
