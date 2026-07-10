# Test Schema #3 Workflow - Raw Responses
$schemaId = "e0c42ec0-3e6f-4298-a14c-d362528099c4"

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "PHASE 19: Schema Workflow - Raw API Responses" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# TEST 1: List
Write-Host "`n[TEST 1] Schema List" -ForegroundColor Yellow
$r1 = Invoke-WebRequest -Uri "http://localhost:3000/api/schema/list" -UseBasicParsing
Write-Host $r1.Content -ForegroundColor Green

# TEST 2: Get Details
Write-Host "`n[TEST 2] Get Schema $schemaId" -ForegroundColor Yellow
$r2 = Invoke-WebRequest -Uri "http://localhost:3000/api/schema/$schemaId" -UseBasicParsing
Write-Host $r2.Content -ForegroundColor Green

# TEST 3: Generate Rules
Write-Host "`n[TEST 3] Generate Rules - CRITICAL TEST" -ForegroundColor Yellow
$body = '{"aggressiveness": 0.5, "customKeywords": {}}'
$r3 = Invoke-WebRequest -Uri "http://localhost:3000/api/schema/$schemaId/generate-rules" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
Write-Host $r3.Content -ForegroundColor Green

# TEST 4: Update Schema  
Write-Host "`n[TEST 4] Update Schema - Version Test" -ForegroundColor Yellow
$body = '{"schema": {"type": "object", "properties": {"field": {"type": "string"}}}, "description": "v2"}'
$r4 = Invoke-WebRequest -Uri "http://localhost:3000/api/schema/$schemaId" -Method PATCH -ContentType "application/json" -Body $body -UseBasicParsing
Write-Host $r4.Content -ForegroundColor Green

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
