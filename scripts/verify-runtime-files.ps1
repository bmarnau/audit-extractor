# Runtime File Verification Script (PowerShell)
# Überprüft nach Container-Start, ob HelpContentLoader die Dateien findet

param(
    [string]$ContainerName = "extractor-backend",
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

Write-Host "[*] Runtime File Verification (HelpContentLoader Check)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Get container working directory
Write-Host "[*] Checking container filesystem..." -ForegroundColor Yellow

# List app root
Write-Host ""
Write-Host "[*] Contents of /app:" -ForegroundColor Yellow
docker exec $ContainerName ls -la /app | Where-Object { $_ -match "(backend|src|RELEASE|OPERATIONS|README|MANUAL|dist|package)" } | ForEach-Object { 
    Write-Host "  $_" 
}

# List backend data directory
Write-Host ""
Write-Host "Contents of /app/backend/src/data:" -ForegroundColor Yellow
try {
    $output = docker exec $ContainerName ls -lah /app/backend/src/data 2>&1
    if ($LASTEXITCODE -eq 0) {
        $output | ForEach-Object { Write-Host "  $_" }
    }
    else {
        Write-Host "  ❌ Directory not found or error" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Test file readability
Write-Host ""
Write-Host "📋 Testing file readability..." -ForegroundColor Yellow

$testFiles = @(
    "/app/backend/src/data/release-notes.json",
    "/app/backend/src/data/manual.json",
    "/app/RELEASE_NOTES_0.37.1.md"
)

foreach ($file in $testFiles) {
    try {
        $result = docker exec $ContainerName head -c 100 $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            $lines = docker exec $ContainerName wc -l $file 2>&1 | ForEach-Object { $_ -split '\s+' | Select-Object -First 1 }
            Write-Host "✅ $file ($lines lines)" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Cannot read $file" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error reading $file : $_" -ForegroundColor Red
    }
}

# Check HelpContentLoader logs
Write-Host ""
Write-Host "📡 Checking HelpContentLoader startup logs..." -ForegroundColor Yellow

try {
    $logs = docker compose logs backend --tail 50 2>&1 | Select-String -Pattern "HelpContentLoader|release|Release Notes"
    if ($logs) {
        Write-Host "✅ Found HelpContentLoader activity:" -ForegroundColor Green
        $logs | ForEach-Object { Write-Host "  $_" }
    }
    else {
        Write-Host "ℹ️  No HelpContentLoader activity in logs (may be lazy-loaded)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  Could not fetch logs: $_" -ForegroundColor Yellow
}

# Test API endpoint
Write-Host ""
Write-Host "🌐 Testing Help API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{
        url = "http://localhost:3000/api/help"
        name = "Help Overview"
    },
    @{
        url = "http://localhost:3000/api/help/release-notes"
        name = "Release Notes"
    },
    @{
        url = "http://localhost:3000/api/help/documentation"
        name = "Documentation"
    }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            
            # Show relevant stats
            if ($endpoint.name -eq "Release Notes") {
                $count = $data.data.notes.Count
                Write-Host "✅ $($endpoint.name): $count items" -ForegroundColor Green
            }
            elseif ($endpoint.name -eq "Documentation") {
                $count = $data.data.items.Count
                Write-Host "✅ $($endpoint.name): $count items" -ForegroundColor Green
            }
            else {
                Write-Host "✅ $($endpoint.name): OK" -ForegroundColor Green
            }
        }
        else {
            Write-Host "⚠️  $($endpoint.name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($endpoint.name) error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Runtime verification complete" -ForegroundColor Green
