Write-Host "Starting Extractor..." -ForegroundColor Cyan
docker-compose down -v --remove-orphans 2>&1 | Out-Null
Start-Sleep -Seconds 2
docker-compose up -d 2>&1 | Out-Null
Start-Sleep -Seconds 10
docker-compose ps
