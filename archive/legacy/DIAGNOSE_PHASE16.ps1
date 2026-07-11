# Phase 16 Test Fehlerdiagnose
# Einfache ASCII-Version ohne Unicode-Probleme

Write-Host ""
Write-Host "======================================================================"
Write-Host "  PHASE 16 FEHLERDIAGNOSE"
Write-Host "======================================================================"
Write-Host ""

$errors = @()
$ok = 0

# 1. Node.js
Write-Host "[1/5] Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($?) {
    Write-Host "  OK: $nodeVersion" -ForegroundColor Green
    $ok++
} else {
    Write-Host "  FEHLER: Node.js nicht installiert" -ForegroundColor Red
    $errors += "Node.js fehlt"
}

# 2. npm
Write-Host "[2/5] npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($?) {
    Write-Host "  OK: $npmVersion" -ForegroundColor Green
    $ok++
} else {
    Write-Host "  FEHLER: npm nicht installiert" -ForegroundColor Red
    $errors += "npm fehlt"
}

# 3. Projektstruktur
Write-Host "[3/5] Projektstruktur..." -ForegroundColor Yellow
$files = @("package.json", "tsconfig.json")
$allOK = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  FEHLER: $file fehlt" -ForegroundColor Red
        $allOK = $false
        $errors += "$file fehlt"
    }
}
if ($allOK) { $ok++ }

# 4. node_modules
Write-Host "[4/5] Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $count = (Get-ChildItem node_modules -Directory | Measure-Object).Count
    Write-Host "  OK: $count Pakete" -ForegroundColor Green
    $ok++
} else {
    Write-Host "  WARN: node_modules fehlt - installiere..." -ForegroundColor Yellow
    npm install --no-optional --ignore-scripts
    if ($?) {
        Write-Host "  OK: npm install erfolgreich" -ForegroundColor Green
        $ok++
    } else {
        Write-Host "  FEHLER: npm install fehlgeschlagen" -ForegroundColor Red
        $errors += "npm install fehlgeschlagen"
    }
}

# 5. Build
Write-Host "[5/5] TypeScript Build..." -ForegroundColor Yellow
npm run build | Out-Null
if ($?) {
    Write-Host "  OK: Build erfolgreich" -ForegroundColor Green
    $ok++
} else {
    Write-Host "  FEHLER: Build fehlgeschlagen" -ForegroundColor Red
    $errors += "Build fehlgeschlagen"
}

Write-Host ""
Write-Host "======================================================================"

if ($errors.Count -eq 0) {
    Write-Host "ERGEBNIS: OK - Alle Checks bestanden ($ok/5)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tests starten in 2 Sekunden..."
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "E2E Tests:" -ForegroundColor Cyan
    npm run test:phase16:e2e
    
    Write-Host ""
    Write-Host "Audit Workflow:" -ForegroundColor Cyan
    npm run test:phase16:audit
    
    Write-Host ""
    Write-Host "PHASE 16 TESTS COMPLETE" -ForegroundColor Green
} else {
    Write-Host "ERGEBNIS: FEHLER - $($errors.Count) Probleme gefunden" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "  - $e" -ForegroundColor Red
    }
}

Write-Host ""
