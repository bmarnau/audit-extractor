#!/usr/bin/env pwsh
# Backup critical data before Docker rebuild
# Creates timestamped backups of Schemas, Backups, Results

param(
  [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "data-backups/$timestamp"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

write-host "[BACKUP] Starting data backup..." -ForegroundColor Cyan
write-host "         Directory: $backupDir" -ForegroundColor Gray

$dataPaths = @(
  @{ src = "schemas"; name = "schemas" },
  @{ src = "backups"; name = "backups" },
  @{ src = "extraction-rules"; name = "extraction-rules" },
  @{ src = "results"; name = "results" }
)

$backedUp = @()
$errors = @()

foreach ($path in $dataPaths) {
  $srcPath = $path.src
  $destPath = Join-Path $backupDir $path.name
  
  if (Test-Path $srcPath) {
    try {
      Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
      $itemCount = (Get-ChildItem $destPath -Recurse -File 2>$null | Measure-Object).Count
      $backedUp += @{ name = $path.name; items = $itemCount }
      write-host "         [OK] $($path.name): $itemCount files"
    } catch {
      $errors += "Failed to backup $($path.name): $_"
      write-host "         [ERR] $($path.name)"
    }
  } else {
    write-host "         [SKIP] $($path.name): not found"
  }
}

$metadata = @{
  timestamp = $timestamp
  date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  backed_up = $backedUp
  errors = $errors
  total_items = ($backedUp.items | Measure-Object -Sum).Sum
} | ConvertTo-Json -Depth 10

Set-Content -Path "$backupDir/metadata.json" -Value $metadata

write-host ""
write-host "[OK] Backup complete!"
write-host "     Total files: $(($backedUp.items | Measure-Object -Sum).Sum)"
