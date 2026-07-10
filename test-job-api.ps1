#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive Job API Test Suite (Phase 21)
    
.DESCRIPTION
    Tests all 5 Job API endpoints:
    1. POST /api/jobs - Create job
    2. GET  /api/jobs/{id} - Get job details
    3. GET  /api/jobs/{id}/result - Get result
    4. DELETE /api/jobs/{id} - Cancel job
    5. GET /api/jobs - List jobs
#>

$apiBase = "http://localhost:3000/api"
$results = @()

write-host ""
write-host "================================================" -ForegroundColor Cyan
write-host "  Job API Test Suite (Phase 21)"
write-host "================================================" -ForegroundColor Cyan
write-host ""

# Test 1: Create Job
write-host "[TEST 1/5] POST /api/jobs - Create Job" -ForegroundColor Yellow

try {
  $jobPayload = @{
    documentContent = "Invoice INV-20260710-001 Amount: EUR 1500.00 Customer: Test Corp"
    jobType = "extraction"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest `
    -Uri "$apiBase/jobs" `
    -Method POST `
    -ContentType "application/json" `
    -Body $jobPayload `
    -UseBasicParsing
  
  $jobData = $response.Content | ConvertFrom-Json
  $jobId = $jobData.data.id
  
  if ($response.StatusCode -eq 201 -and $jobId) {
    write-host "         [PASS] Status 201 Created" -ForegroundColor Green
    write-host "         Job ID: $jobId" -ForegroundColor Green
    write-host "         Status: $($jobData.data.status)" -ForegroundColor Green
    $results += @{ Test = "Create Job"; Status = "PASS"; Details = "$jobId" }
  } else {
    write-host "         [FAIL] Unexpected response" -ForegroundColor Red
    $results += @{ Test = "Create Job"; Status = "FAIL"; Details = "Status $($response.StatusCode)" }
  }
} catch {
  write-host "         [ERROR] $_" -ForegroundColor Red
  $results += @{ Test = "Create Job"; Status = "ERROR"; Details = "$_" }
}

write-host ""

# Test 2: Get Job Details
write-host "[TEST 2/5] GET /api/jobs/{id} - Get Job Details" -ForegroundColor Yellow

if ($jobId) {
  try {
    Start-Sleep -Seconds 2
    
    $response = Invoke-WebRequest `
      -Uri "$apiBase/jobs/$jobId" `
      -Method GET `
      -UseBasicParsing
    
    $jobDetails = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200 -and $jobDetails.data.id) {
      $status = $jobDetails.data.status
      $duration = $jobDetails.data.duration
      write-host "         [PASS] Status 200 OK" -ForegroundColor Green
      write-host "         Status: $status (Duration: ${duration}ms)" -ForegroundColor Green
      $results += @{ Test = "Get Job Details"; Status = "PASS"; Details = "$status / ${duration}ms" }
    } else {
      write-host "         [FAIL] Unexpected response" -ForegroundColor Red
      $results += @{ Test = "Get Job Details"; Status = "FAIL"; Details = "Status $($response.StatusCode)" }
    }
  } catch {
    write-host "         [ERROR] $_" -ForegroundColor Red
    $results += @{ Test = "Get Job Details"; Status = "ERROR"; Details = "$_" }
  }
} else {
  write-host "         [SKIP] No Job ID from previous test" -ForegroundColor Gray
}

write-host ""

# Test 3: Get Job Result
write-host "[TEST 3/5] GET /api/jobs/{id}/result - Get Result" -ForegroundColor Yellow

if ($jobId) {
  try {
    $response = Invoke-WebRequest `
      -Uri "$apiBase/jobs/$jobId/result" `
      -Method GET `
      -UseBasicParsing
    
    $resultData = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
      $hasResult = if ($resultData.data.resultData) { "Yes" } else { "No" }
      write-host "         [PASS] Status 200 OK" -ForegroundColor Green
      write-host "         Has Result Data: $hasResult" -ForegroundColor Green
      $results += @{ Test = "Get Result"; Status = "PASS"; Details = "Result: $hasResult" }
    } else {
      write-host "         [FAIL] Unexpected response" -ForegroundColor Red
      $results += @{ Test = "Get Result"; Status = "FAIL"; Details = "Status $($response.StatusCode)" }
    }
  } catch {
    write-host "         [ERROR] $_" -ForegroundColor Red
    $results += @{ Test = "Get Result"; Status = "ERROR"; Details = "$_" }
  }
} else {
  write-host "         [SKIP] No Job ID from previous test" -ForegroundColor Gray
}

write-host ""

# Test 4: List Jobs
write-host "[TEST 4/5] GET /api/jobs - List Jobs (Pagination)" -ForegroundColor Yellow

try {
  $response = Invoke-WebRequest `
    -Uri "$apiBase/jobs?limit=10&offset=0" `
    -Method GET `
    -UseBasicParsing
  
  $jobsList = $response.Content | ConvertFrom-Json
  
  if ($response.StatusCode -eq 200 -and $jobsList.data.jobs) {
    $total = $jobsList.data.total
    $count = $jobsList.data.jobs.Count
    write-host "         [PASS] Status 200 OK" -ForegroundColor Green
    write-host "         Total Jobs: $total, Returned: $count" -ForegroundColor Green
    $results += @{ Test = "List Jobs"; Status = "PASS"; Details = "Total: $total" }
  } else {
    write-host "         [FAIL] Unexpected response" -ForegroundColor Red
    $results += @{ Test = "List Jobs"; Status = "FAIL"; Details = "Status $($response.StatusCode)" }
  }
} catch {
  write-host "         [ERROR] $_" -ForegroundColor Red
  $results += @{ Test = "List Jobs"; Status = "ERROR"; Details = "$_" }
}

write-host ""

# Test 5: Delete Job
write-host "[TEST 5/5] DELETE /api/jobs/{id} - Cancel Job" -ForegroundColor Yellow

if ($jobId) {
  try {
    # Create a new job to delete
    $deletePayload = @{
      documentContent = "Test document for deletion"
      jobType = "extraction"
    } | ConvertTo-Json
    
    $createResponse = Invoke-WebRequest `
      -Uri "$apiBase/jobs" `
      -Method POST `
      -ContentType "application/json" `
      -Body $deletePayload `
      -UseBasicParsing
    
    $deleteJobId = ($createResponse.Content | ConvertFrom-Json).data.id
    
    # Delete it
    $response = Invoke-WebRequest `
      -Uri "$apiBase/jobs/$deleteJobId" `
      -Method DELETE `
      -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
      write-host "         [PASS] Status 200 OK" -ForegroundColor Green
      write-host "         Job Deleted: $deleteJobId" -ForegroundColor Green
      $results += @{ Test = "Delete Job"; Status = "PASS"; Details = "Job deleted" }
    } else {
      write-host "         [FAIL] Unexpected response" -ForegroundColor Red
      $results += @{ Test = "Delete Job"; Status = "FAIL"; Details = "Status $($response.StatusCode)" }
    }
  } catch {
    write-host "         [ERROR] $_" -ForegroundColor Red
    $results += @{ Test = "Delete Job"; Status = "ERROR"; Details = "$_" }
  }
} else {
  write-host "         [SKIP] No Job ID from previous test" -ForegroundColor Gray
}

write-host ""

# Summary
write-host "================================================" -ForegroundColor Green
write-host "  Test Results Summary"
write-host "================================================" -ForegroundColor Green
write-host ""

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count
$total = $results.Count

write-host "Results:"
$results | ForEach-Object {
  $statusColor = switch ($_.Status) {
    "PASS" { "Green" }
    "FAIL" { "Red" }
    "ERROR" { "Red" }
    "SKIP" { "Gray" }
    default { "White" }
  }
  write-host "  [$($_.Status)] $($_.Test)" -ForegroundColor $statusColor
  write-host "       Details: $($_.Details)" -ForegroundColor Gray
}

write-host ""
write-host "Summary: $passCount PASS | $failCount FAIL | $errorCount ERROR | Total: $total" -ForegroundColor Cyan

if ($failCount -eq 0 -and $errorCount -eq 0) {
  write-host ""
  write-host "ï¿ý SUCCESS! All tests passed!" -ForegroundColor Green
  write-host ""
  exit 0
} else {
  write-host ""
  write-host "ï¿ý ISSUES FOUND - Review details above" -ForegroundColor Yellow
  write-host ""
  exit 1
}
