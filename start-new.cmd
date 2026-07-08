@echo off
REM ============================================================================
REM Audit-Safe Document Extraction System (Phase 16) - Startup Script
REM Version: 0.16.0
REM Purpose: Complete setup and startup of the application
REM ============================================================================

setlocal enabledelayedexpansion
cls

REM ============================================================================
REM COLORS & MESSAGES
REM ============================================================================
echo.
echo =========================================================================
echo.
echo   ^>^>^>   Audit-Safe Document Extraction System (Phase 16)   ^<^<^<
echo   ^>^>^>   Starting Up...                                    ^<^<^<
echo.
echo =========================================================================
echo.

REM ============================================================================
REM STEP 1: CHECK PREREQUISITES
REM ============================================================================
echo [STEP 1/5] Checking Prerequisites...
echo.

where /q node
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js is installed
)

where /q npm
if errorlevel 1 (
    color 0C
    echo ERROR: npm is not installed
    pause
    exit /b 1
) else (
    echo [OK] npm is installed
)

where /q docker
if errorlevel 1 (
    color 0E
    echo [WARNING] Docker is not installed
    echo Database features may not work
    echo.
) else (
    echo [OK] Docker is installed
)

echo.

REM ============================================================================
REM STEP 2: START DATABASE (DOCKER)
REM ============================================================================
echo [STEP 2/5] Starting PostgreSQL Database (Docker)...
echo.

where /q docker
if errorlevel 1 (
    echo [SKIP] Docker not found, skipping database startup
    echo You can manually run: docker-compose up -d
    echo.
) else (
    docker ps --filter "name=extractor-postgres" --format "{{.ID}}" >nul 2>&1
    if errorlevel 1 (
        echo Starting PostgreSQL container...
        docker-compose up -d
        if errorlevel 1 (
            color 0E
            echo [WARNING] Could not start Docker container
            echo Make sure Docker Desktop is running
            echo.
        ) else (
            echo [OK] PostgreSQL started on localhost:5432
            timeout /t 3 /nobreak
            echo.
        )
    ) else (
        echo [OK] PostgreSQL container already running
        echo.
    )
)

REM ============================================================================
REM STEP 3: INSTALL DEPENDENCIES
REM ============================================================================
echo [STEP 3/5] Installing Dependencies...
echo.

if exist "node_modules" (
    echo node_modules folder exists
    set /p REINSTALL="Reinstall dependencies? (y/n): "
    if /i "!REINSTALL!"=="y" (
        echo Installing npm packages...
        call npm install --no-optional --ignore-scripts
        if errorlevel 1 (
            color 0C
            echo [ERROR] npm install failed
            pause
            exit /b 1
        )
    )
) else (
    echo Installing npm packages...
    call npm install --no-optional --ignore-scripts
    if errorlevel 1 (
        color 0C
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)

echo [OK] Dependencies installed
echo.

REM ============================================================================
REM STEP 4: BUILD TYPESCRIPT
REM ============================================================================
echo [STEP 4/5] Building TypeScript...
echo.

call npm run build
if errorlevel 1 (
    color 0C
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [OK] Build completed successfully
echo.

REM ============================================================================
REM STEP 5: START DEVELOPMENT SERVER
REM ============================================================================
echo [STEP 5/5] Starting Development Server...
echo.

color 0A
echo =========================================================================
echo.
echo                      STARTUP COMPLETE!
echo.
echo   Web Interface:  http://localhost:3000
echo   API Server:     http://localhost:3000/api
echo   Database:       localhost:5432
echo.
echo   Documentation:  MANUAL-0.16.0.md
echo   Status:         Phase 16 - Production Ready
echo.
echo   Press Ctrl+C to stop the server
echo.
echo =========================================================================
echo.

color 0B
call npm run dev

if errorlevel 1 (
    color 0C
    echo [ERROR] Development server failed
    pause
    exit /b 1
)

endlocal
exit /b 0
