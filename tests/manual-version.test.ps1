# Manual Version Test Script
# Tests for ensuring correct manual version is loaded in frontend
# 
# @version 0.39.0
# @phase 39

param(
  [string]$ApiUrl = "http://localhost:3000/api"
)

function Write-TestResult($name, $success, $message, $details) {
  $icon = if ($success) { "✅" } else { "❌" }
  Write-Host "$icon $name" -ForegroundColor $(if ($success) { "Green" } else { "Red" })
  if ($message) {
    Write-Host "   $message" -ForegroundColor Gray
  }
  if ($details -and -not $success) {
    Write-Host "   Details: $($details | ConvertTo-Json -Depth 1)" -ForegroundColor DarkRed
  }
}

function Test-VersionEndpoint {
  try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/help/version" -Method Get -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200 -and $data.data.current) {
      Write-TestResult "Version Endpoint Exists" $true "Endpoint returns version data" $null
      return @{ success = $true; data = $data.data }
    } else {
      Write-TestResult "Version Endpoint Exists" $false "Invalid response structure" $data
      return @{ success = $false; data = $data }
    }
  } catch {
    Write-TestResult "Version Endpoint Exists" $false $_.Exception.Message $null
    return @{ success = $false }
  }
}

function Test-CurrentVersion($versionData) {
  if (-not $versionData.success) {
    Write-TestResult "Current Version is 0.35.0" $false "Cannot test without version endpoint" $null
    return $false
  }

  $current = $versionData.data.current
  $expected = "0.35.0"
  
  if ($current -eq $expected) {
    Write-TestResult "Current Version is 0.35.0" $true "Version: $current" $null
    return $true
  } else {
    Write-TestResult "Current Version is 0.35.0" $false "Expected $expected, got $current" @{ current = $current }
    return $false
  }
}

function Test-ManualFileExists($versionData) {
  if (-not $versionData.success) {
    Write-TestResult "Manual File Exists" $false "Cannot test without version endpoint" $null
    return $false
  }

  $exists = $versionData.data.exists
  $file = $versionData.data.expected_file
  
  if ($exists) {
    Write-TestResult "Manual File Exists" $true "File: $file" $null
    return $true
  } else {
    Write-TestResult "Manual File Exists" $false "File not found: $file" @{ file = $file; exists = $exists }
    return $false
  }
}

function Test-ServedVersionMatches($versionData) {
  if (-not $versionData.success) {
    Write-TestResult "Served Version Matches Expected" $false "Cannot test without version endpoint" $null
    return $false
  }

  $current = $versionData.data.current
  $serving = $versionData.data.serving_version
  
  if ($current -eq $serving) {
    Write-TestResult "Served Version Matches Expected" $true "Serving: $serving" $null
    return $true
  } else {
    Write-TestResult "Served Version Matches Expected" $false "Version mismatch: expected $current, serving $serving" @{ expected = $current; serving = $serving; file = $versionData.data.serving_file }
    return $false
  }
}

function Test-ManualHasChapters {
  try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/help/manual" -Method Get -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.chapters -and $data.data.chapters.Count -gt 0) {
      Write-TestResult "Manual Has Chapters" $true "Total chapters: $($data.data.totalChapters)" $null
      return @{ success = $true; chapters = $data.data.chapters.Count }
    } else {
      Write-TestResult "Manual Has Chapters" $false "No chapters found" $data.data
      return @{ success = $false }
    }
  } catch {
    Write-TestResult "Manual Has Chapters" $false $_.Exception.Message $null
    return @{ success = $false }
  }
}

function Test-ManualResponseVersion {
  try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/help/manual" -Method Get -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    $version = $data.data.version
    $expected = "0.35.0"
    
    if ($version -eq $expected) {
      Write-TestResult "Manual Response Version" $true "Version: $version" $null
      return $true
    } else {
      Write-TestResult "Manual Response Version" $false "Expected $expected, got $version" @{ version = $version }
      return $false
    }
  } catch {
    Write-TestResult "Manual Response Version" $false $_.Exception.Message $null
    return $false
  }
}

function Test-NoOldManualInDocs($versionData) {
  if (-not $versionData.success) {
    Write-TestResult "No Old Manual in Docs" $false "Cannot test without version endpoint" $null
    return $false
  }

  $servingFile = $versionData.data.serving_file
  $servingVersion = $versionData.data.serving_version
  $currentVersion = $versionData.data.current
  
  # Check if old manual is being loaded from docs/ when it shouldn't be
  $isFromDocs = $servingFile -like "docs/*"
  $versionMismatch = $servingVersion -ne $currentVersion
  
  if ($isFromDocs -and $versionMismatch) {
    Write-TestResult "No Old Manual in Docs" $false "Old manual loaded from docs/: $servingFile (v$servingVersion)" @{ file = $servingFile; version = $servingVersion }
    return $false
  } else {
    Write-TestResult "No Old Manual in Docs" $true "Correct: $servingFile (v$servingVersion)" $null
    return $true
  }
}

# Main Test Execution
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Manual Version Test Suite - Phase 39" -ForegroundColor Cyan
Write-Host ("=" * 60) + "`n" -ForegroundColor Cyan

Write-Host "Testing API: $ApiUrl`n" -ForegroundColor Yellow

# Run tests
$versionData = Test-VersionEndpoint
$test2 = Test-CurrentVersion $versionData
$test3 = Test-ManualFileExists $versionData
$test4 = Test-ServedVersionMatches $versionData
$test5 = Test-ManualHasChapters
$test6 = Test-ManualResponseVersion
$test7 = Test-NoOldManualInDocs $versionData

# Tally results
$passed = @(
  $versionData.success,
  $test2,
  $test3,
  $test4,
  $test5.success,
  $test6,
  $test7
) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

$total = 7

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Results: $passed/$total tests passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Red" })
Write-Host ("=" * 60) + "`n" -ForegroundColor Cyan

# Exit with appropriate code
exit $(if ($passed -eq $total) { 0 } else { 1 })
