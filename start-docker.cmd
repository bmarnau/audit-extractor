@echo off
REM ============================================================
REM Docker Stack Startup Script für Audit-Safe Document Extractor
REM ============================================================
REM Version: 0.17.0
REM Purpose: Starte alle Docker Services mit Überprüfung
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   🐳 Audit-Safe Document Extractor - Docker Stack
echo ============================================================
echo.

REM Farben für Output
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set RESET=[0m

REM Check für Docker Installation
echo [*] Überprüfe Docker Installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[!] Docker nicht installiert!%RESET%
    echo.
    echo Bitte installieren Sie Docker Desktop von:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo %GREEN%[✓] Docker installiert%RESET%

REM Check für Docker Compose
echo [*] Überprüfe Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[!] Docker Compose nicht installiert!%RESET%
    exit /b 1
)
echo %GREEN%[✓] Docker Compose installiert%RESET%

REM Check für Docker Daemon
echo [*] Überprüfe Docker Daemon...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[!] Docker Daemon läuft nicht!%RESET%
    echo.
    echo Bitte starten Sie Docker Desktop.
    echo.
    pause
    exit /b 1
)
echo %GREEN%[✓] Docker Daemon läuft%RESET%

echo.
echo ============================================================
echo   Starte Docker Services...
echo ============================================================
echo.

REM Start Docker Compose Stack
echo [*] Starte Docker Compose Stack...
docker-compose up -d

if %errorlevel% neq 0 (
    echo %RED%[!] Fehler beim Starten der Services!%RESET%
    echo.
    echo Für Details prüfen Sie:
    echo docker-compose logs
    echo.
    pause
    exit /b 1
)

echo %GREEN%[✓] Services gestartet%RESET%
echo.

REM Warte auf Services
echo [*] Warte auf Services zum vollständigen Start (ca. 30 Sekunden)...
timeout /t 5 /nobreak

REM Check für Health Status
echo.
echo [*] Überprüfe Service Status...
echo.

setlocal enabledelayedexpansion
set retry_count=0
set max_retries=12

:health_check_loop
set /a retry_count+=1

if !retry_count! gtr !max_retries! (
    echo %YELLOW%[⚠] Einige Services antworten noch nicht (Timeout)%RESET%
    echo Dies ist normal beim ersten Start - Services initialisieren.
    echo.
    goto continue_anyway
)

REM Backend Health Check
echo [Versuch !retry_count!/!max_retries!] Überprüfe Backend...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo  ⏳ Backend wird noch initialisiert...
    timeout /t 2 /nobreak >nul
    goto health_check_loop
)

echo %GREEN%[✓] Backend erreichbar%RESET%

:continue_anyway
echo.

REM Display Service Status
docker-compose ps
echo.

echo ============================================================
echo   ✅ Alle Services starten...
echo ============================================================
echo.
echo 📍 Zugriff auf Services:
echo.
echo   Frontend (React):
echo   👉 http://localhost
echo.
echo   Backend API:
echo   👉 http://localhost:3000/api
echo.
echo   pgAdmin (Datenbank-Management):
echo   👉 http://localhost:5050
echo      Email: admin@extractor.local
echo      Passwort: admin-pass
echo.
echo   PostgreSQL (direkt):
echo   👉 localhost:5432
echo      Benutzer: extractor_user
echo      Passwort: extractor_pass
echo      DB: extractor_db
echo.
echo   Redis Cache:
echo   👉 localhost:6379
echo.
echo ============================================================
echo   Nützliche Befehle:
echo ============================================================
echo.
echo   # Logs ansehen
echo   docker-compose logs -f backend
echo   docker-compose logs -f frontend
echo.
echo   # Services stoppen
echo   docker-compose stop
echo.
echo   # Services herunterfahren (mit Datenlöschung - ⚠️)
echo   docker-compose down -v
echo.
echo   # Nur Frontend neu bauen
echo   docker-compose build frontend && docker-compose up -d frontend
echo.
echo   # Nur Backend neu bauen
echo   docker-compose build backend && docker-compose up -d backend
echo.
echo ============================================================
echo.
echo 💡 Tipps:
echo    - Beim ersten Start kann es 1-2 Minuten dauern
echo    - Logs können Sie mit "docker-compose logs" ansehen
echo    - Bei Problemen: siehe DOCKER_DEPLOYMENT_GUIDE.md
echo.
echo Press any key to continue or close this window...
echo.
pause

exit /b 0
