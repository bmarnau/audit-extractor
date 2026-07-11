@echo off
REM ============================================================
REM Audit-Safe Document Extractor - Local App Stop Script
REM Version: 0.18.0
REM Purpose: Stop local Node.js development servers
REM ============================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || exit /b 1

echo.
echo [INFO] Stopping local Node.js development servers...
echo.

REM Kill Node processes on ports 3000 and 5173
echo [WAIT] Killing processes on port 3000 (Backend)...
netstat -ano | find ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo [OK] Port 3000 freed
) else (
    echo [INFO] No process on port 3000
)

echo [WAIT] Killing processes on port 5173 (Frontend)...
netstat -ano | find ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":5173"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo [OK] Port 5173 freed
) else (
    echo [INFO] No process on port 5173
)

echo.
echo [OK] Local development servers stopped
echo.
echo [TIP] To start again: start-app.cmd
echo.
pause
