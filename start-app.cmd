@echo off
REM ============================================================================
REM AUDIT-SAFE DOCUMENT EXTRACTOR - Frontend Application Startup
REM
REM Purpose: Start Frontend Server + Chrome Browser
REM Version: 0.17.0 (Phase 17 Complete)
REM 
REM Features:
REM   - Kills old Node processes on ports 5173
REM   - Starts Frontend server (Vite on :5173) - PRIMARY
REM   - Starts Backend server (Express on :3000) - OPTIONAL
REM   - Opens Chrome browser automatically
REM   - Continues even if Backend fails (PostgreSQL dependency)
REM ============================================================================

setlocal enabledelayedexpansion

REM Get script directory
cd /d "%~dp0"
set "APP_ROOT=%cd%"

cls
echo   Audit-Safe Document Extractor v0.17.0               
echo   Starting Frontend Application (Phase 17)             
echo   Backend optional (requires PostgreSQL)               

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
REM Step 4: Start Frontend server (PRIMARY)
REM ============================================================================
echo [4/5] Starting Frontend server...
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
        echo ⚠  Frontend timeout after 40 seconds, but continuing...
        echo   Check "Audit-Safe Frontend" window for details
    )
) else (
    echo ✓ Frontend port 5173 is listening
)
echo.

REM ============================================================================
REM Step 5: Start Backend server (OPTIONAL - may fail if PostgreSQL not running)
REM ============================================================================
echo [5/6] Starting Backend server (optional)...
echo   Note: Backend requires PostgreSQL on port 5432
echo.

REM Try to start backend but don't fail if it doesn't work
start "Audit-Safe Backend" /D "%APP_ROOT%" cmd /k "npm run dev"

REM Give backend a few seconds to try starting
timeout /t 3 /nobreak >nul

REM Check if backend is running (non-blocking)
netstat -ano 2>nul | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    echo ⚠  Backend not available (PostgreSQL may not be running)
    echo   Frontend will continue working without Backend
    echo   API calls will show 500 errors until Backend is fixed
) else (
    echo ✓ Backend port 3000 is listening
)
echo.

REM ============================================================================
REM Step 6: Open Chrome
REM ============================================================================
echo [6/6] Opening Chrome browser...
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

echo   ✓ Application Started Successfully!                   
echo                                                          
echo   Frontend:     http://localhost:5173  (PRIMARY)        
echo   Backend API:  http://localhost:3000  (OPTIONAL)       
echo                                                          
echo   Note: Frontend works independently                    
echo   Backend may not be available if PostgreSQL           
echo   is not running on your system                         
echo.
echo   Press Ctrl+C to stop the application                  
echo.
REM Keep window open
pause
echo   Health Check: http://localhost:3000/health            
echo   API Docs:     http://localhost:3000/api-docs          
echo                                                          
echo   Chrome should open automatically.                     
echo   If not, manually open: http://localhost:5173          
echo                                                          
echo   Server Windows:                                        
echo   • Audit-Safe Backend - Express server                 
echo   • Audit-Safe Frontend - Vite dev server               
echo                                                          
echo   Close any window to stop that service                 
echo   Close this window when done                           
echo 

pause

echo.
echo Shutting down services...
taskkill /F /IM node.exe >nul 2>&1
echo ✓ All services stopped

endlocal
exit /b 0
