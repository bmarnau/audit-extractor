#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Archive obsolete Phase 16/17 startup files
    
.DESCRIPTION
    Moves all obsolete and duplicate startup/stop files to _archive folder
    Keeps only Phase 21 current files in root directory
#>

$ErrorActionPreference = "Stop"

# Files to archive (Phase 16/17 obsolete, duplicates)
$obsoleteFiles = @(
    "start-phase16.ps1",
    "start-phase16-then-phase17.cmd",
    "start-new.cmd",
    "START_HERE_PHASE16_TO_PHASE17.md",
    "stable-start.ps1",
    "stable-stop.ps1",
    "start-app - Kopie.cmd",
    "START-APP-README.md"
)

# Create archive folder if not exists
$archiveDir = "_archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
    Write-Host "✓ Created: $archiveDir/"
}

# Archive each file
$archivedCount = 0
foreach ($file in $obsoleteFiles) {
    $filePath = Join-Path -Path (Get-Location) -ChildPath $file
    if (Test-Path $filePath) {
        Move-Item -Path $filePath -Destination $archiveDir -Force
        Write-Host "✓ Archived: $file → _archive/"
        $archivedCount++
    } else {
        Write-Host "  (Not found: $file)"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ Archiving Complete!"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "📋 Active Files (Phase 21):"
Write-Host "  Docker:"
Write-Host "    • start-docker.cmd     (Windows CMD)"
Write-Host "    • start-docker.ps1     (PowerShell with options)"
Write-Host "    • stop-docker.cmd      (Windows CMD)"
Write-Host "    • stop-docker.ps1      (PowerShell)"
Write-Host ""
Write-Host "  Local Development (npm):"
Write-Host "    • start-app.cmd        (Windows CMD)"
Write-Host "    • start-app.ps1        (PowerShell)"
Write-Host "    • start-services.ps1   (Backend + Frontend separate)"
Write-Host "    • stop-app.cmd         (Windows CMD)"
Write-Host "    • stop-app.ps1         (PowerShell)"
Write-Host ""
Write-Host "  Documentation:"
Write-Host "    • START_PHASE_21.md    (Complete startup guide)"
Write-Host "    • START_GUIDE.md       (Legacy, can update)"
Write-Host "    • MANUAL-0.18.0.md     (Full operations manual)"
Write-Host ""
Write-Host "🗂️  Archived Files: $archivedCount → _archive/"
Write-Host ""
