#Requires -Version 5.0
<#
.SYNOPSIS
Stabile Stop-Funktion für Docker Compose Stack
.DESCRIPTION
Stoppt alle Container sauber und gibt Status aus
#>

param(
    [switch]$Force = $false,
    [switch]$RemoveVolumes = $false
)

$ErrorActionPreference = 'Stop'

function Write-Status {
    param([string]$Message, [string]$Color = 'Green')
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

try {
    Write-Status "================================" Green
    Write-Status "Extractor Stable Stop Script" Green
    Write-Status "================================" Green

    Write-Status "`nPhase 1: Stopping containers..." Cyan
    
    $flags = @()
    if ($Force) { $flags += '-f' }
    if ($RemoveVolumes) { $flags += '-v' }
    
    if ($flags.Count -gt 0) {
        docker-compose down @flags 2>&1 | Out-Null
    } else {
        docker-compose down 2>&1 | Out-Null
    }
    
    Write-Status "✓ Containers stopped" Green

    Write-Status "`nPhase 2: Verifying cleanup..." Cyan
    $runningContainers = docker ps --filter "label=com.docker.compose.project=extractor" --format "{{.Names}}" 2>&1 | Where-Object { $_ }
    
    if ($runningContainers) {
        Write-Status "⚠ Found running containers, forcing removal..." Yellow
        docker-compose down -f -v 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        
        $runningContainers = docker ps --filter "label=com.docker.compose.project=extractor" --format "{{.Names}}" 2>&1 | Where-Object { $_ }
        if ($runningContainers) {
            Write-Status "  Force killing containers..." Yellow
            $runningContainers | ForEach-Object { docker kill $_ 2>&1 | Out-Null }
        }
    }
    
    Write-Status "✓ Cleanup verified" Green

    if ($RemoveVolumes) {
        Write-Status "`nPhase 3: Removing volumes..." Cyan
        docker volume prune -f --filter "label=com.docker.compose.project=extractor" 2>&1 | Out-Null
        Write-Status "✓ Volumes removed" Green
    }

    Write-Status "`n================================" Green
    Write-Status "✓ System shut down successfully!" Green
    Write-Status "================================" Green

    Write-Status "`nContainer status:" Cyan
    docker-compose ps 2>&1 | Select-Object -First 10

} catch {
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] ERROR: $_" -ForegroundColor Red
    exit 1
}
