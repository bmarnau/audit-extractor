@echo off
REM ============================================================
REM Audit-Safe Document Extractor - Docker Stop Script
REM Version: 0.18.0
REM Purpose: Stop Docker Compose containers gracefully
REM ============================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || exit /b 1

echo.
echo [INFO] Stopping Docker Compose containers...
echo.

REM Check if docker-compose is running
docker-compose ps >nul 2>&1
if errorlevel 1 (
    echo [WARN] Docker Compose not running or Docker Desktop not available
    exit /b 0
)

REM Graceful shutdown
echo [WAIT] Sending shutdown signal to containers...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo [OK] Docker Compose stopped successfully
    echo [INFO] All containers have been stopped
    echo.
) else (
    echo.
    echo [ERR] Failed to stop Docker Compose
    exit /b 1
)

echo [TIP] To remove volumes and clean up: docker-compose down -v
echo [TIP] To check logs: docker-compose logs -f
echo.
pause
