# ============================================================
# Audit-Safe Document Extractor - Local App Stop Script (PowerShell)
# Version: 0.18.0
# Purpose: Stop local Node.js development servers
# ============================================================

param(
    [switch]$Force = $false
)

function Write-Success {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " $args"
}

function Write-Error-Custom {
    Write-Host "[ERR]" -ForegroundColor Red -NoNewline
    Write-Host " $args"
}

function Write-Warning-Custom {
    Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline
    Write-Host " $args"
}

function Write-Info {
    Write-Host "[INFO]" -ForegroundColor Cyan -NoNewline
    Write-Host " $args"
}

function Write-Waiting {
    Write-Host "[WAIT]" -ForegroundColor Magenta -NoNewline
    Write-Host " $args"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $ScriptDir

Write-Host ""
Write-Info "Stopping local Node.js development servers..."
Write-Host ""

# Function to kill process on port
function Stop-ProcessOnPort {
    param(
        [int]$Port,
        [string]$Service
    )
    
    Write-Waiting "Killing processes on port $Port ($Service)..."
    
    try {
        $NetStatOutput = netstat -ano | Select-String ":$Port"
        
        if ($NetStatOutput) {
            $Processes = @()
            foreach ($Line in $NetStatOutput) {
                $Parts = $Line -split '\s+'
                $PID = $Parts[-1]
                
                try {
                    Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue
                    $Processes += $PID
                } catch {
                    Write-Warning-Custom "Could not kill PID $PID"
                }
            }
            
            if ($Processes.Count -gt 0) {
                Write-Success "Port $Port freed (killed PIDs: $($Processes -join ', '))"
            }
        } else {
            Write-Info "No process on port $Port"
        }
    } catch {
        Write-Error-Custom "Failed to stop process on port $Port"
    }
}

# Stop services
Stop-ProcessOnPort -Port 3000 -Service "Backend"
Stop-ProcessOnPort -Port 5173 -Service "Frontend"

Write-Host ""
Write-Success "Local development servers stopped"
Write-Host ""
Write-Host "[TIP]" -ForegroundColor Magenta -NoNewline
Write-Host " To start again: .\start-app.ps1"
Write-Host ""

Pop-Location
