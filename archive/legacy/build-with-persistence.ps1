#!/usr/bin/env pwsh
# Build mit Daten-Persistenz: Backup -> Build -> Restore
# Orchestriert den kompletten Build-Prozess

param(
  [switch]$NoCache,
  [ValidateSet("Backend", "Frontend", "All")]
  [string]$Services = "All",
  [switch]$NoRestore
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

write-host ""
write-host "===============================================" -ForegroundColor Cyan
write-host "  Build mit Daten-Persistenz (Phase 21)"
write-host "===============================================" -ForegroundColor Cyan
write-host ""

write-host "[1/4] Creating backup..." -ForegroundColor Green
.\backup-before-build.ps1
if ($LASTEXITCODE -ne 0) {
  write-host "[ERR] Backup failed!" -ForegroundColor Red
  exit 1
}
write-host ""

write-host "[2/4] Building Docker images..." -ForegroundColor Green
$buildCmd = "docker-compose build"
if ($NoCache) { $buildCmd += " --no-cache" }

if ($Services -eq "Backend") {
  $buildCmd += " backend"
} elseif ($Services -eq "Frontend") {
  $buildCmd += " frontend"
}

write-host "       Command: $buildCmd" -ForegroundColor Gray
Invoke-Expression $buildCmd

if ($LASTEXITCODE -ne 0) {
  write-host "[ERR] Docker build failed!" -ForegroundColor Red
  exit 1
}
write-host ""

write-host "[3/4] Starting containers..." -ForegroundColor Green
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
  write-host "[ERR] Container start failed!" -ForegroundColor Red
  exit 1
}

write-host "       Waiting 15 seconds for health checks..."
Start-Sleep -Seconds 15
docker-compose ps
write-host ""

if ($NoRestore) {
  write-host "[4/4] Restore SKIPPED (Flag: -NoRestore)" -ForegroundColor Yellow
  write-host ""
} else {
  write-host "[4/4] Restoring data..." -ForegroundColor Green
  .\restore-after-build.ps1
  if ($LASTEXITCODE -ne 0) {
    write-host "[ERR] Restore failed!" -ForegroundColor Red
    exit 1
  }
  write-host ""
}

$duration = (Get-Date) - $startTime
write-host "===============================================" -ForegroundColor Green
write-host "  SUCCESS! Build complete"
write-host "===============================================" -ForegroundColor Green
write-host ""
write-host "Summary:"
write-host "  Duration: $($duration.TotalMinutes.ToString('F1')) minutes"
write-host "  Services: $Services"
write-host "  Cache: $(if($NoCache) { 'not used' } else { 'used' })"
write-host ""
write-host "Access:"
write-host "  Frontend:  http://localhost"
write-host "  Backend:   http://localhost:3000/api"
write-host "  pgAdmin:   http://localhost:5050"
write-host ""
