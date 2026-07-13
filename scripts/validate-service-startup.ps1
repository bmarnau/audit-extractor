#requires -version 5.1
<#
.SYNOPSIS
    Validates service startup and connectivity before running tests
    
.DESCRIPTION
    Performs comprehensive health checks on PostgreSQL, Redis, and application services.
    Ensures all services are ready and healthy before test execution begins.
    
.PARAMETER MaxWaitSeconds
    Maximum time to wait for services to become healthy (default: 120)
    
.PARAMETER ServiceCheckInterval
    Interval between health checks in seconds (default: 5)
#>

param(
    [int]$MaxWaitSeconds = 120,
    [int]$ServiceCheckInterval = 5
)

$ErrorActionPreference = "Stop"

Write-Host @"
================================================================================
                    SERVICE STARTUP VALIDATION
================================================================================
"@ -ForegroundColor Cyan

$startTime = Get-Date
$services = @(
    @{ Name = "PostgreSQL"; Container = "extractor-postgres"; Port = 5432; Check = "pg_isready" }
    @{ Name = "Redis"; Container = "extractor-redis"; Port = 6379; Check = "redis-cli ping" }
)

$allHealthy = $false
$elapsedSeconds = 0

while (-not $allHealthy -and $elapsedSeconds -lt $MaxWaitSeconds) {
    $allHealthy = $true
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking service health..." -ForegroundColor Yellow
    
    foreach ($service in $services) {
        # Check if container exists and is running
        $container = docker ps --filter "name=$($service.Container)" --format "{{.Status}}"
        
        if ([string]::IsNullOrWhiteSpace($container)) {
            Write-Host "  [FAIL] $($service.Name): Container not running" -ForegroundColor Red
            $allHealthy = $false
            continue
        }
        
        # Attempt health check
        try {
            if ($service.Check -eq "pg_isready") {
                $result = docker exec $($service.Container) pg_isready -U extractor_user 2>&1
                if ($result -match "accepting connections") {
                    Write-Host "  [OK] $($service.Name): Ready ($result)" -ForegroundColor Green
                } else {
                    Write-Host "  [WAIT] $($service.Name): Not ready yet ($result)" -ForegroundColor Yellow
                    $allHealthy = $false
                }
            } 
            elseif ($service.Check -eq "redis-cli ping") {
                $result = docker exec $($service.Container) redis-cli ping 2>&1
                if ($result -match "PONG") {
                    Write-Host "  [OK] $($service.Name): Ready (PONG)" -ForegroundColor Green
                } else {
                    Write-Host "  [WAIT] $($service.Name): Not ready yet" -ForegroundColor Yellow
                    $allHealthy = $false
                }
            }
        } catch {
            Write-Host "  [WAIT] $($service.Name): Health check failed - $_" -ForegroundColor Yellow
            $allHealthy = $false
        }
    }
    
    if (-not $allHealthy) {
        $elapsedSeconds = ([DateTime]::Now - $startTime).TotalSeconds
        if ($elapsedSeconds -lt $MaxWaitSeconds) {
            Write-Host "  Waiting $ServiceCheckInterval seconds before retry..." -ForegroundColor Gray
            Start-Sleep -Seconds $ServiceCheckInterval
            $elapsedSeconds = ([DateTime]::Now - $startTime).TotalSeconds
        }
    }
}

Write-Host ""

if ($allHealthy) {
    Write-Host "[OK] All services are healthy and ready for testing" -ForegroundColor Green
    Write-Host "     Total startup time: $(([DateTime]::Now - $startTime).TotalSeconds.ToString('0.0'))s" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Services did not become healthy within ${MaxWaitSeconds}s" -ForegroundColor Red
    Write-Host "     Elapsed time: $(([DateTime]::Now - $startTime).TotalSeconds.ToString('0.0'))s" -ForegroundColor Red
    Write-Host ""
    Write-Host "     Troubleshooting:" -ForegroundColor Yellow
    Write-Host "     - docker-compose logs postgres" -ForegroundColor Gray
    Write-Host "     - docker-compose logs redis" -ForegroundColor Gray
    exit 1
}
