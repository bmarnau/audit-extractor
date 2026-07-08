#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Docker Stack Startup Script für Audit-Safe Document Extractor

.DESCRIPTION
    Startet alle Docker Services mit umfassender Überprüfung

.EXAMPLE
    .\start-docker.ps1

.NOTES
    Version: 0.17.0
    Author: Audit-Safe Team
#>

param(
    [switch]$NoWait = $false,
    [switch]$ShowLogs = $false,
    [switch]$Rebuild = $false
)

# ============================================================
# Funktionen
# ============================================================

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error_ {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning_ {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-Docker {
    $null = docker --version 2>&1
    return $?
}

function Test-DockerCompose {
    $null = docker-compose --version 2>&1
    return $?
}

function Test-DockerDaemon {
    $null = docker ps 2>&1
    return $?
}

function Test-HealthCheck {
    param(
        [string]$Url,
        [int]$MaxRetries = 12,
        [int]$DelaySeconds = 5
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Stille Fehler - werden erwartet beim Starten
        }
        
        $retries++
        if ($retries -lt $MaxRetries) {
            Write-Host "  ⏳ Versuch $retries/$MaxRetries - Warte $DelaySeconds Sekunden..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    return $false
}

# ============================================================
# Main Script
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🐳 Audit-Safe Document Extractor - Docker Stack Startup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Überprüfungen
# ============================================================

Write-Info "Überprüfe Voraussetzungen..."
Write-Host ""

# Docker Check
if (-not (Test-Docker)) {
    Write-Error_ "Docker nicht installiert!"
    Write-Host ""
    Write-Host "Bitte installieren Sie Docker Desktop von:"
    Write-Host "https://www.docker.com/products/docker-desktop"
    Write-Host ""
    exit 1
}
Write-Success "Docker installiert"

# Docker Compose Check
if (-not (Test-DockerCompose)) {
    Write-Error_ "Docker Compose nicht installiert!"
    exit 1
}
Write-Success "Docker Compose installiert"

# Docker Daemon Check
if (-not (Test-DockerDaemon)) {
    Write-Error_ "Docker Daemon läuft nicht!"
    Write-Host ""
    Write-Host "Bitte starten Sie Docker Desktop oder den Docker Daemon."
    Write-Host ""
    exit 1
}
Write-Success "Docker Daemon läuft"

Write-Host ""

# ============================================================
# Services starten
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starte Docker Services..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$startArgs = @("up", "-d")
if ($Rebuild) {
    $startArgs += "--build"
    Write-Info "Erzwinge Rebuild aller Services..."
}

Write-Info "Starte Docker Compose Stack..."
docker-compose @startArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error_ "Fehler beim Starten der Services!"
    Write-Host ""
    Write-Host "Für Details prüfen Sie:"
    Write-Host "  docker-compose logs"
    Write-Host ""
    exit 1
}

Write-Success "Services gestartet"
Write-Host ""

# ============================================================
# Health Checks
# ============================================================

if (-not $NoWait) {
    Write-Info "Warte auf Services zum vollständigen Start (ca. 30 Sekunden)..."
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Info "Überprüfe Backend Health..."
    
    if (Test-HealthCheck -Url "http://localhost:3000/api/health") {
        Write-Success "Backend erreichbar"
    }
    else {
        Write-Warning_ "Backend antwortet nicht (könnte noch initialisieren)"
    }
}

# ============================================================
# Service Status
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Service Status" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

docker-compose ps
Write-Host ""

# ============================================================
# Zugriffsinformationen
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ✅ Systeme sind erreichbar unter:" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Frontend (React):" -ForegroundColor Yellow
Write-Host "   👉 http://localhost" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Backend API:" -ForegroundColor Yellow
Write-Host "   👉 http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 pgAdmin (Datenbank-Management):" -ForegroundColor Yellow
Write-Host "   👉 http://localhost:5050" -ForegroundColor Cyan
Write-Host "   Email: admin@extractor.local" -ForegroundColor Gray
Write-Host "   Passwort: admin-pass" -ForegroundColor Gray
Write-Host ""

Write-Host "📍 PostgreSQL (direkt):" -ForegroundColor Yellow
Write-Host "   👉 localhost:5432" -ForegroundColor Cyan
Write-Host "   Benutzer: extractor_user" -ForegroundColor Gray
Write-Host "   Passwort: extractor_pass" -ForegroundColor Gray
Write-Host ""

Write-Host "📍 Redis Cache:" -ForegroundColor Yellow
Write-Host "   👉 localhost:6379" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Nützliche Befehle
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  💡 Nützliche Befehle:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$commands = @(
    @{ Desc = "Logs anzeigen"; Cmd = "docker-compose logs -f backend" },
    @{ Desc = "Nur Backend-Logs"; Cmd = "docker-compose logs -f backend" },
    @{ Desc = "Nur Frontend-Logs"; Cmd = "docker-compose logs -f frontend" },
    @{ Desc = "Services stoppen"; Cmd = "docker-compose stop" },
    @{ Desc = "Services stoppen & löschen"; Cmd = "docker-compose down" },
    @{ Desc = "Alles löschen (einschl. Daten)"; Cmd = "docker-compose down -v" },
    @{ Desc = "Nur Backend neu bauen"; Cmd = "docker-compose build backend && docker-compose up -d backend" },
    @{ Desc = "Nur Frontend neu bauen"; Cmd = "docker-compose build frontend && docker-compose up -d frontend" }
)

foreach ($cmd in $commands) {
    Write-Host "  • $($cmd.Desc)" -ForegroundColor Gray
    Write-Host "    $ $($cmd.Cmd)" -ForegroundColor DarkGray
}

Write-Host ""

# ============================================================
# Optional: Logs anzeigen
# ============================================================

if ($ShowLogs) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  Zeige Backend-Logs..." -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    docker-compose logs -f backend
}

Write-Host ""
Write-Success "Docker Stack erfolgreich gestartet!"
Write-Host ""
