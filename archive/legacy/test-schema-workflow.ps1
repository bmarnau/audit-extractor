# Test Schema #3 Workflow (Phase 19)
# Tests: Upload, List, Rule Generation, Version Update

$schemaId = "e0c42ec0-3e6f-4298-a14c-d362528099c4"
$baseUrl = "http://localhost:3000/api/schema"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PHASE 19: Schema Fixes Test Workflow" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# TEST 1: List Schemas
Write-Host "`n[TEST 1] GET $baseUrl/list" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/list" -UseBasicParsing -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "✅ List successful" -ForegroundColor Green
  Write-Host "  Schemas found: $($data.Count)"
  if ($data.Count -gt 0) {
    Write-Host "  Latest schema ID: $($data[0].id)" -ForegroundColor Cyan
  }
} catch {
  Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# TEST 2: Get Schema Details
Write-Host "`n[TEST 2] GET $baseUrl/$schemaId" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/$schemaId" -UseBasicParsing -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "✅ Get schema details successful" -ForegroundColor Green
  Write-Host "  Schema Name: $($data.name)" -ForegroundColor Cyan
  Write-Host "  Version: $($data.version)" -ForegroundColor Cyan
  Write-Host "  Fields: $($data.fieldsCount)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# TEST 3: Generate Rules (The Critical Test - UUID Issue)
Write-Host "`n[TEST 3] POST $baseUrl/$schemaId/generate-rules (CRITICAL FIX)" -ForegroundColor Yellow
$ruleBody = '{"aggressiveness": 0.5, "customKeywords": {}}'
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/$schemaId/generate-rules" -Method POST -ContentType "application/json" -Body $ruleBody -UseBasicParsing -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "✅ Rule generation SUCCESSFUL" -ForegroundColor Green
  Write-Host "  RuleSetId: $($data.ruleSetId)" -ForegroundColor Cyan
  Write-Host "  Rules Generated: $($data.rulesGenerated)" -ForegroundColor Cyan
  Write-Host "  Average Confidence: $($data.averageConfidence)" -ForegroundColor Cyan
  Write-Host "  Total Rules: $($data.totalRules)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED - UUID/Version Error?" -ForegroundColor Red
  Write-Host "  Error: $_" -ForegroundColor Red
  $errorContent = $_.Exception.Response.Content
  if ($errorContent) {
    Write-Host "  Details: $($errorContent)" -ForegroundColor Yellow
  }
}

# TEST 4: Update Schema (Test Version Increment)
Write-Host "`n[TEST 4] PATCH $baseUrl/$schemaId (Version Update Test)" -ForegroundColor Yellow
$updateBody = '{
  "schema": {
    "title": "Invoice3Updated",
    "type": "object",
    "properties": {
      "invoiceNumber": { "type": "string" },
      "date": { "type": "string" },
      "amount": { "type": "number" },
      "newField": { "type": "string" }
    }
  },
  "description": "Updated with new field"
}'
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/$schemaId" -Method PATCH -ContentType "application/json" -Body $updateBody -UseBasicParsing -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "✅ Schema update SUCCESSFUL" -ForegroundColor Green
  Write-Host "  New Version: $($data.version)" -ForegroundColor Cyan
  Write-Host "  Updated At: $($data.updatedAt)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED - Version Update Error?" -ForegroundColor Red
  Write-Host "  Error: $_" -ForegroundColor Red
}

# TEST 5: Get Updated Rules
Write-Host "`n[TEST 5] GET $baseUrl/$schemaId/rules" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/$schemaId/rules" -UseBasicParsing -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "✅ Get rules SUCCESSFUL" -ForegroundColor Green
  Write-Host "  Rule Count: $($data.ruleCount)" -ForegroundColor Cyan
  Write-Host "  Version: $($data.version)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ FAILED" -ForegroundColor Red
  Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Test Workflow Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
