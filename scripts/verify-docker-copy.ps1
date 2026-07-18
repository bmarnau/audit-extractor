# Docker Copy Verification Script (PowerShell)
# Überprüft nach Docker Build, ob alle kritischen Dateien im Container vorhanden sind

param(
    [string]$ContainerName = "extractor-backend",
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

Write-Host "[*] Verifying Docker file copies in container: $ContainerName" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Critical files to verify
$CriticalFiles = @(
    "/app/backend/src/data/release-notes.json",
    "/app/backend/src/data/manual.json",
    "/app/RELEASE_NOTES_0.37.1.md",
    "/app/OPERATIONS_MANUAL.md",
    "/app/README.md",
    "/app/MANUAL-0.37.1.md",
    "/app/package.json",
    "/app/dist/index.js"
)

$MissingFiles = @()
$FoundFiles = @()

Write-Host ""
Write-Host "[*] Checking critical files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $CriticalFiles) {
    try {
        $result = docker exec $ContainerName test -f $file 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            $sizeOutput = docker exec $ContainerName stat -c"%s" $file 2>&1
            $size = if ($sizeOutput -match '^\d+$') { $sizeOutput } else { "unknown" }
            Write-Host "[+] $file ($size bytes)" -ForegroundColor Green
            $FoundFiles += $file
        }
        else {
            Write-Host "[!] MISSING: $file" -ForegroundColor Red
            $MissingFiles += $file
        }
    }
    catch {
        Write-Host "❌ MISSING: $file (error: $_)" -ForegroundColor Red
        $MissingFiles += $file
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   Found: $($FoundFiles.Count) / $($CriticalFiles.Count)" -ForegroundColor Cyan
Write-Host "   Missing: $($MissingFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Check backend data directory
Write-Host "📁 Checking /app/backend/src/data directory..." -ForegroundColor Yellow
try {
    $dirOutput = docker exec $ContainerName ls -la /app/backend/src/data 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Directory exists with contents:" -ForegroundColor Green
        $dirOutput | Select-Object -Skip 3 | ForEach-Object { Write-Host "   $_" }
    }
    else {
        Write-Host "❌ Directory /app/backend/src/data does not exist!" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error checking directory: $_" -ForegroundColor Red
}

Write-Host ""

# Detailed file sizes and content checks
Write-Host "🔎 Detailed file verification..." -ForegroundColor Yellow
Write-Host ""

# Check release-notes.json specifically
try {
    $result = docker exec $ContainerName test -f /app/backend/src/data/release-notes.json 2>&1
    if ($LASTEXITCODE -eq 0) {
        $lineCount = docker exec $ContainerName wc -l /app/backend/src/data/release-notes.json 2>&1 | ForEach-Object { $_ -split '\s+' | Select-Object -First 1 }
        Write-Host "✅ release-notes.json: $lineCount lines" -ForegroundColor Green
        
        Write-Host "   First 5 lines:" -ForegroundColor Yellow
        docker exec $ContainerName head -5 /app/backend/src/data/release-notes.json 2>&1 | ForEach-Object { Write-Host "   > $_" }
    }
    else {
        Write-Host "❌ release-notes.json missing in container!" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ release-notes.json verification failed: $_" -ForegroundColor Red
}

Write-Host ""

# Exit with error if files are missing
if ($MissingFiles.Count -gt 0) {
    Write-Host "🚨 VERIFICATION FAILED: $($MissingFiles.Count) files missing!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Missing files:" -ForegroundColor Red
    $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
else {
    Write-Host "✅ ALL FILES VERIFIED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
}
