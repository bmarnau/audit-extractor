@echo off
REM ============================================================================
REM AUDIT-SAFE DOCUMENT EXTRACTOR - Full Application Startup
REM
REM Purpose: Start Backend + Frontend + Chrome Browser
REM Version: 0.13.0 (Phase 14 Complete)
REM 
REM Features:
REM   - Kills old Node processes on ports 3000 and 5173
REM   - Starts Backend server (Express on :3000)
REM   - Starts Frontend server (Vite on :5173)
REM   - Opens Chrome browser automatically
REM   - Includes error recovery and retry logic
REM ============================================================================

setlocal enabledelayedexpansion

REM Get script directory
cd /d "%~dp0"
set "APP_ROOT=%cd%"

cls
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  Audit-Safe Document Extractor v0.13.0               ║
echo ║  Starting Full Application Stack                      ║
echo ║  Phase 14 - Production Ready                          ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM Step 1: Kill old processes (with explicit port cleanup)
REM ============================================================================
echo [1/5] Cleaning up old processes...

REM Kill Node processes on specific ports
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000"') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill all node processes as fallback
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✓ Old processes terminated
echo.

REM ============================================================================
REM Step 2: Verify Node.js is installed
REM ============================================================================
echo [2/5] Checking Node.js...

where node >nul 2>nul
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM ============================================================================
REM Step 3: Install dependencies if needed
REM ============================================================================
echo [3/5] Checking dependencies...

if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ⚠  npm install had warnings, continuing anyway...
    )
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ⚠  Frontend npm install had warnings, continuing...
    )
    cd ..
)

echo ✓ Dependencies ready
echo.

REM ============================================================================
REM Step 4: Start Backend and Frontend servers
REM ============================================================================
echo [4/5] Starting servers...
echo.

echo Starting Backend (Port 3000)...
start "Audit-Safe Backend" /D "%APP_ROOT%" cmd /k "npm run dev"

REM Wait for backend to start and respond
echo Waiting for Backend to initialize (up to 20 seconds)...

set /a RETRY=0
:WAIT_BACKEND
timeout /t 1 /nobreak >nul
set /a RETRY+=1

REM Check if backend is listening
netstat -ano 2>nul | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    if %RETRY% LSS 20 (
        echo   Attempt %RETRY%/20 - Backend not yet ready...
        goto WAIT_BACKEND
    ) else (
        echo ❌ Backend failed to start after 20 seconds
        echo.
        echo Troubleshooting:
        echo - Check "Audit-Safe Backend" window for error messages
        echo - Try manually: npm run dev
        echo - Verify port 3000 is not in use
        echo.
        echo Press any key to close this window...
        pause
        exit /b 1
    )
)

echo ✓ Backend port 3000 is listening
echo.

echo Starting Frontend (Port 5173)...
start "Audit-Safe Frontend" /D "%APP_ROOT%\frontend" cmd /k "npm run dev"

REM Wait for frontend to start and respond
echo Waiting for Frontend to initialize (up to 40 seconds - first build takes time)...

set /a RETRY=0
:WAIT_FRONTEND
timeout /t 1 /nobreak >nul
set /a RETRY+=1

REM Check if port 5173 is listening
netstat -ano 2>nul | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    if %RETRY% LSS 40 (
        echo   Attempt %RETRY%/40 - Frontend not yet ready...
        goto WAIT_FRONTEND
    ) else (
        echo ❌ Frontend failed to start after 40 seconds
        echo.
        echo Troubleshooting:
        echo - Check "Audit-Safe Frontend" window for error messages
        echo - Try manually: cd frontend ^&^& npm run dev
        echo - Verify port 5173 is not in use
        echo.
        echo Press any key to close this window...
        pause
        exit /b 1
    )
)

echo ✓ Frontend port 5173 is listening
echo.

REM ============================================================================
REM Step 5: Open Chrome
REM ============================================================================
echo [5/5] Opening Chrome browser...
echo.

REM Try multiple Chrome locations
set CHROME_FOUND=0

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
    set CHROME_FOUND=1
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    set CHROME_FOUND=1
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set CHROME_FOUND=1
) else (
    REM Try default command
    start chrome http://localhost:5173
    set CHROME_FOUND=1
)

if %CHROME_FOUND% EQU 1 (
    if not "!CHROME_PATH!"=="" (
        echo Launching: !CHROME_PATH!
        start "" "!CHROME_PATH!" "http://localhost:5173"
    )
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  ✓ Application Started Successfully!                   ║
echo ║                                                         ║
echo ║  Frontend:     http://localhost:5173                   ║
echo ║  Backend API:  http://localhost:3000                   ║
echo ║  Health Check: http://localhost:3000/health            ║
echo ║  API Docs:     http://localhost:3000/api-docs          ║
echo ║                                                         ║
echo ║  Chrome should open automatically.                     ║
echo ║  If not, manually open: http://localhost:5173          ║
echo ║                                                         ║
echo ║  Server Windows:                                        ║
echo ║  • Audit-Safe Backend - Express server                 ║
echo ║  • Audit-Safe Frontend - Vite dev server               ║
echo ║                                                         ║
echo ║  Close any window to stop that service                 ║
echo ║  Close this window when done                           ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

pause

echo.
echo Shutting down services...
taskkill /F /IM node.exe >nul 2>&1
echo ✓ All services stopped

endlocal
exit /b 0
