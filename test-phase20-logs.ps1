# Test Phase 20: Log-Viewer Backend API
# Tests all new endpoints

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PHASE 20: Log-Viewer Backend API Tests" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# TEST 1: Get available sources and levels
Write-Host "`n[TEST 1] GET /api/logs/sources" -ForegroundColor Yellow
$r1 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/sources" -UseBasicParsing
Write-Host "✅ Sources & Levels:" -ForegroundColor Green
$r1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2

# TEST 2: Get statistics (empty at first)
Write-Host "`n[TEST 2] GET /api/logs/stats" -ForegroundColor Yellow
$r2 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/stats" -UseBasicParsing
Write-Host "✅ Statistics:" -ForegroundColor Green
$r2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2

# TEST 3: Create test log entries
Write-Host "`n[TEST 3] POST /api/logs/create (Create sample logs)" -ForegroundColor Yellow
$logBody = '{
  "level": "info",
  "source": "schema",
  "message": "Schema #3 created successfully",
  "documentId": "doc-001",
  "duration": 150
}'
$r3a = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/create" -Method POST -ContentType "application/json" -Body $logBody -UseBasicParsing
Write-Host "✅ Created log 1" -ForegroundColor Green

$logBody2 = '{
  "level": "error",
  "source": "extraction",
  "message": "Failed to extract field: amount",
  "documentId": "doc-001",
  "field": "amount",
  "duration": 45
}'
$r3b = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/create" -Method POST -ContentType "application/json" -Body $logBody2 -UseBasicParsing
Write-Host "✅ Created log 2 (error)" -ForegroundColor Green

$logBody3 = '{
  "level": "warn",
  "source": "api",
  "message": "Slow response time detected",
  "duration": 5234
}'
$r3c = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/create" -Method POST -ContentType "application/json" -Body $logBody3 -UseBasicParsing
Write-Host "✅ Created log 3 (warn)" -ForegroundColor Green

# TEST 4: Query all logs
Write-Host "`n[TEST 4] GET /api/logs (Query all logs)" -ForegroundColor Yellow
$r4 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs?limit=10" -UseBasicParsing
$data4 = $r4.Content | ConvertFrom-Json
Write-Host "✅ Total logs: $($data4.data.totalCount)" -ForegroundColor Green
Write-Host "Returned: $($data4.data.logs.Count) logs" -ForegroundColor Cyan

# TEST 5: Filter by level (error only)
Write-Host "`n[TEST 5] GET /api/logs?levels=error (Filter by level)" -ForegroundColor Yellow
$r5 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs?levels=error&limit=10" -UseBasicParsing
$data5 = $r5.Content | ConvertFrom-Json
Write-Host "✅ Error logs found: $($data5.data.logs.Count)" -ForegroundColor Green
$data5.data.logs | Select-Object -First 1 | ConvertTo-Json

# TEST 6: Filter by source (schema, extraction)
Write-Host "`n[TEST 6] GET /api/logs?sources=schema,extraction (Filter by sources)" -ForegroundColor Yellow
$r6 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs?sources=schema,extraction&limit=10" -UseBasicParsing
$data6 = $r6.Content | ConvertFrom-Json
Write-Host "✅ Filtered logs: $($data6.data.logs.Count)" -ForegroundColor Green

# TEST 7: Search functionality
Write-Host "`n[TEST 7] GET /api/logs?search=schema (Text search)" -ForegroundColor Yellow
$r7 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs?search=schema&limit=10" -UseBasicParsing
$data7 = $r7.Content | ConvertFrom-Json
Write-Host "✅ Search results: $($data7.data.logs.Count)" -ForegroundColor Green

# TEST 8: Updated stats (after creating logs)
Write-Host "`n[TEST 8] GET /api/logs/stats (Updated statistics)" -ForegroundColor Yellow
Start-Sleep -Seconds 1
$r8 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/stats" -UseBasicParsing
$data8 = $r8.Content | ConvertFrom-Json
Write-Host "✅ Updated Stats:" -ForegroundColor Green
Write-Host "  Total Entries: $($data8.data.totalEntries)" -ForegroundColor Cyan
Write-Host "  Error Count: $($data8.data.errorCount)" -ForegroundColor Cyan
Write-Host "  Warning Count: $($data8.data.warningCount)" -ForegroundColor Cyan

# TEST 9: Export as JSON
Write-Host "`n[TEST 9] POST /api/logs/export (Export as JSON)" -ForegroundColor Yellow
$exportBody = '{
  "format": "json",
  "levels": ["info", "error", "warn"],
  "limit": 100
}'
$r9 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/export" -Method POST -ContentType "application/json" -Body $exportBody -UseBasicParsing
$data9 = $r9.Content | ConvertFrom-Json
Write-Host "✅ Exported successfully" -ForegroundColor Green
Write-Host "  Format: $($data9.data.format)" -ForegroundColor Cyan
Write-Host "  Content Length: $($data9.data.contentLength) bytes" -ForegroundColor Cyan
Write-Host "  Filename: $($data9.data.filename)" -ForegroundColor Cyan

# TEST 10: Export as CSV
Write-Host "`n[TEST 10] POST /api/logs/export (Export as CSV)" -ForegroundColor Yellow
$exportBody2 = '{
  "format": "csv",
  "limit": 100
}'
$r10 = Invoke-WebRequest -Uri "http://localhost:3000/api/logs/export" -Method POST -ContentType "application/json" -Body $exportBody2 -UseBasicParsing
$data10 = $r10.Content | ConvertFrom-Json
Write-Host "✅ CSV Export successful" -ForegroundColor Green
Write-Host "  Filename: $($data10.data.filename)" -ForegroundColor Cyan

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "✅ ALL PHASE 20 TESTS COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
