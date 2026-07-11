#!/usr/bin/env pwsh
# Restore data after Docker rebuild
# Restores from most recent backup or specified backup directory

param(
  [string]$BackupDir,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $BackupDir) {
  $backups = Get-ChildItem "data-backups" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
  if (-not $backups) {
    write-host "[ERR] No backup found in data-backups/" -ForegroundColor Red
    exit 1
  }
  $BackupDir = $backups[0].FullName
}

if (-not (Test-Path $BackupDir)) {
  write-host "[ERR] Backup not found: $BackupDir" -ForegroundColor Red
  exit 1
}

write-host "[RESTORE] Starting data restore..." -ForegroundColor Cyan
write-host "          Source: $BackupDir" -ForegroundColor Gray

if ($DryRun) {
  write-host "          (DRY RUN - no changes)" -ForegroundColor Yellow
}

$metadataPath = "$BackupDir/metadata.json"
if (Test-Path $metadataPath) {
  $metadata = Get-Content $metadataPath | ConvertFrom-Json
  write-host "          Date: $($metadata.date)" -ForegroundColor Gray
}

$restorePaths = @("schemas", "backups", "extraction-rules", "results")
$restored = @()
$errors = @()

foreach ($path in $restorePaths) {
  $srcPath = "$BackupDir/$path"
  
  if (Test-Path $srcPath) {
    if (-not $DryRun) {
      if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
      }
      
      try {
        Copy-Item -Path $srcPath -Destination $path -Recurse -Force
        $itemCount = (Get-ChildItem $path -Recurse -File 2>$null | Measure-Object).Count
        $restored += @{ name = $path; items = $itemCount }
        write-host "          [OK] $path : $itemCount files"
      } catch {
        $errors += "Failed to restore $path : $_"
        write-host "          [ERR] $path"
      }
    } else {
      $itemCount = (Get-ChildItem $srcPath -Recurse -File 2>$null | Measure-Object).Count
      write-host "          [DRY] $path ($itemCount files)"
    }
  }
}

if ($DryRun) {
  write-host ""
  write-host "[INFO] Dry run complete - no changes made"
  exit 0
}

write-host ""
write-host "[OK] Restore complete!"
write-host "     Total files: $(($restored.items | Measure-Object -Sum).Sum)"

if ($errors) {
  write-host ""
  write-host "[WARN] Errors:"
  $errors | ForEach-Object { write-host "       $_" }
}
