# Pre-Build Validation Script (PowerShell)
# Überprüft vor Docker Build, ob alle notwendigen Dateien vorhanden sind

param(
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Pre-Build Validation - Checking for required files..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Files that MUST exist before Docker build
$RequiredFiles = @(
    "package.json",
    "Dockerfile.backend",
    "Dockerfile.frontend",
    "docker-compose.yml",
    "tsconfig.json",
    "backend/src/data/release-notes.json",
    "backend/src/data/manual.json",
    "RELEASE_NOTES_0.37.1.md",
    "OPERATIONS_MANUAL.md",
    "README.md",
    "MANUAL-0.37.1.md",
    "src/index.ts",
    "frontend/package.json",
    "frontend/tsconfig.json"
)

$MissingFiles = @()
$FoundFiles = @()
$ProjectDir = Get-Item $ProjectRoot -ErrorAction SilentlyContinue

if (-not $ProjectDir) {
    Write-Host "❌ Project directory not found: $ProjectRoot" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Project Root: $($ProjectDir.FullName)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Checking required files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $RequiredFiles) {
    $fullPath = Join-Path $ProjectDir.FullName $file
    
    if (Test-Path $fullPath) {
        $item = Get-Item $fullPath
        $size = if ($item -is [System.IO.FileInfo]) { $item.Length } else { "0" }
        Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
        $FoundFiles += $file
    }
    else {
        Write-Host "❌ MISSING: $file" -ForegroundColor Red
        $MissingFiles += $file
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   Found: $($FoundFiles.Count) / $($RequiredFiles.Count)" -ForegroundColor Cyan
Write-Host "   Missing: $($MissingFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Check specific critical data files
Write-Host "🔎 Detailed data file verification..." -ForegroundColor Yellow
Write-Host ""

$dataDir = Join-Path $ProjectDir.FullName "backend/src/data"
if (Test-Path $dataDir) {
    Write-Host "✅ Data directory exists: $dataDir" -ForegroundColor Green
    Write-Host "   Contents:" -ForegroundColor Yellow
    Get-ChildItem $dataDir | ForEach-Object { 
        Write-Host "   - $($_.Name) ($($_.Length) bytes)" -ForegroundColor Cyan
    }
}
else {
    Write-Host "❌ Data directory missing: $dataDir" -ForegroundColor Red
    $MissingFiles += "backend/src/data (DIRECTORY)"
}

Write-Host ""

# Check Release Notes content
$releaseNotesPath = Join-Path $ProjectDir.FullName "RELEASE_NOTES_0.37.1.md"
if (Test-Path $releaseNotesPath) {
    $content = Get-Content $releaseNotesPath -Raw
    $lines = ($content -split "`n").Count
    $isEmpty = [string]::IsNullOrWhiteSpace($content)
    
    if ($isEmpty) {
        Write-Host "⚠️  RELEASE_NOTES_0.37.1.md is EMPTY!" -ForegroundColor Red
        $MissingFiles += "RELEASE_NOTES_0.37.1.md (EMPTY)"
    }
    else {
        Write-Host "✅ RELEASE_NOTES_0.37.1.md: $lines lines" -ForegroundColor Green
        Write-Host "   First 3 lines:" -ForegroundColor Yellow
        $content -split "`n" | Select-Object -First 3 | ForEach-Object { 
            Write-Host "   > $_" 
        }
    }
}

Write-Host ""

# Exit with error if files are missing
if ($MissingFiles.Count -gt 0) {
    Write-Host "🚨 PRE-BUILD VALIDATION FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Missing or invalid files:" -ForegroundColor Red
    $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please add the missing files before running Docker build." -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "✅ PRE-BUILD VALIDATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All required files are present. Ready for Docker build." -ForegroundColor Green
    exit 0
}

