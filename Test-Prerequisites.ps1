#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test Preparation Checklist for Phase 16
    
.DESCRIPTION
    Verifies all prerequisites before running Phase 16 tests
    
.EXAMPLE
    .\Test-Prerequisites.ps1
#>

$ErrorActionPreference = "Continue"

# Colors
$success = "Green"
$warning = "Yellow"
$error = "Red"
$info = "Cyan"

function Write-Header {
    param([string]$text)
    Write-Host "`n$text" -ForegroundColor $info -BackgroundColor Black
    Write-Host ("=" * 70) -ForegroundColor $info
}

function Check-Status {
    param(
        [string]$name,
        [bool]$condition,
        [string]$passMsg = "OK",
        [string]$failMsg = "NOT FOUND"
    )
    
    if ($condition) {
        Write-Host "✅ $name : $passMsg" -ForegroundColor $success
        return $true
    } else {
        Write-Host "❌ $name : $failMsg" -ForegroundColor $error
        return $false
    }
}

# ============================================================================
# START CHECKS
# ============================================================================

Write-Header "🔍 PHASE 16 TEST PREPARATION CHECKLIST"

$allOK = $true

# ============================================================================
# 1. System Requirements
# ============================================================================

Write-Host "`n📋 SYSTEM REQUIREMENTS`n" -ForegroundColor $info

# Node.js
try {
    $nodeVersion = node --version
    $allOK = Check-Status "Node.js" $true $nodeVersion
} catch {
    $allOK = Check-Status "Node.js" $false "Not installed (required: v18+)"
}

# npm
try {
    $npmVersion = npm --version
    $allOK = (Check-Status "npm" $true $npmVersion) -and $allOK
} catch {
    $allOK = (Check-Status "npm" $false "Not installed") -and $allOK
}

# Git
try {
    $gitVersion = git --version
    $allOK = (Check-Status "Git" $true $gitVersion) -and $allOK
} catch {
    $allOK = (Check-Status "Git" $false "Not installed (optional)") -and $allOK
}

# Docker (optional but recommended)
try {
    $dockerVersion = docker --version
    $allOK = (Check-Status "Docker" $true $dockerVersion) -and $allOK
} catch {
    Write-Host "⚠️  Docker : Not installed (optional but recommended)" -ForegroundColor $warning
}

# ============================================================================
# 2. Project Structure
# ============================================================================

Write-Host "`n📁 PROJECT STRUCTURE`n" -ForegroundColor $info

$projectOK = $true

# package.json
$packageJsonExists = Test-Path "package.json"
$projectOK = (Check-Status "package.json" $packageJsonExists) -and $projectOK

# tsconfig.json
$tsconfigExists = Test-Path "tsconfig.json"
$projectOK = (Check-Status "tsconfig.json" $tsconfigExists) -and $projectOK

# src directory
$srcExists = Test-Path "src" -PathType Container
$projectOK = (Check-Status "src/ directory" $srcExists) -and $projectOK

# tests directory
$testsExists = Test-Path "tests" -PathType Container
$projectOK = (Check-Status "tests/ directory" $testsExists) -and $projectOK

# Key Phase 16 files
Write-Host "`n  Phase 16 Source Files:" -ForegroundColor $info
$files = @(
    "src/infrastructure/database/data-source.ts",
    "src/domain/schema/SchemaEntity.ts",
    "src/domain/schema/SchemaRepository.ts",
    "src/infrastructure/filesystem/SchemaDirectoryManager.ts",
    "src/application/schema/SchemaStorageService.ts",
    "src/application/schema/SchemaManagementService.ts"
)

foreach ($file in $files) {
    $exists = Test-Path $file
    if ($exists) {
        Write-Host "  ✅ $file" -ForegroundColor $success
    } else {
        Write-Host "  ❌ $file (MISSING)" -ForegroundColor $error
        $projectOK = $false
    }
}

$allOK = $projectOK -and $allOK

# ============================================================================
# 3. Dependencies
# ============================================================================

Write-Host "`n📦 DEPENDENCIES`n" -ForegroundColor $info

$nodeModulesExists = Test-Path "node_modules" -PathType Container

if ($nodeModulesExists) {
    Write-Host "✅ node_modules : Already installed" -ForegroundColor $success
} else {
    Write-Host "⚠️  node_modules : NOT installed" -ForegroundColor $warning
    Write-Host "   Run: npm install --no-optional --ignore-scripts" -ForegroundColor $info
    $allOK = $false
}

# ============================================================================
# 4. Configuration
# ============================================================================

Write-Host "`n⚙️  CONFIGURATION`n" -ForegroundColor $info

# .env.local
$envExists = Test-Path ".env.local"
if ($envExists) {
    Write-Host "✅ .env.local : Found" -ForegroundColor $success
} else {
    Write-Host "⚠️  .env.local : NOT found" -ForegroundColor $warning
    Write-Host "   Database tests will be skipped" -ForegroundColor $info
}

# docker-compose.yml
$dockerComposeExists = Test-Path "docker-compose.yml"
if ($dockerComposeExists) {
    Write-Host "✅ docker-compose.yml : Found" -ForegroundColor $success
} else {
    Write-Host "⚠️  docker-compose.yml : NOT found" -ForegroundColor $warning
}

# ============================================================================
# 5. Database (Optional)
# ============================================================================

Write-Host "`n🗄️  DATABASE (OPTIONAL)`n" -ForegroundColor $info

try {
    $containers = docker ps --filter "name=extractor-postgres" --format "{{.ID}}" 2>&1
    if ($containers) {
        Write-Host "✅ PostgreSQL container : Running" -ForegroundColor $success
    } else {
        Write-Host "ℹ️  PostgreSQL container : Not running" -ForegroundColor $info
        Write-Host "   Run: docker-compose up -d" -ForegroundColor $info
    }
} catch {
    Write-Host "ℹ️  PostgreSQL container : Docker not available" -ForegroundColor $info
}

# ============================================================================
# 6. Build Capability
# ============================================================================

Write-Host "`n🔨 BUILD CAPABILITY`n" -ForegroundColor $info

try {
    Write-Host "Checking TypeScript compilation..." -ForegroundColor $info
    $buildOutput = npm run build 2>&1
    Write-Host "✅ TypeScript builds successfully" -ForegroundColor $success
} catch {
    Write-Host "⚠️  TypeScript build has issues" -ForegroundColor $warning
    Write-Host "   This must be fixed before testing" -ForegroundColor $error
    $allOK = $false
}

# ============================================================================
# 7. Test Files
# ============================================================================

Write-Host "`n🧪 TEST FILES`n" -ForegroundColor $info

$testFiles = @(
    "tests/phase16-e2e-test.ts",
    "tests/audit-workflow-integration.ts",
    "run-phase16-tests.cmd",
    "PHASE16_TEST_GUIDE.md"
)

foreach ($file in $testFiles) {
    $exists = Test-Path $file
    if ($exists) {
        Write-Host "✅ $file" -ForegroundColor $success
    } else {
        Write-Host "❌ $file (MISSING - cannot run tests)" -ForegroundColor $error
        $allOK = $false
    }
}

# ============================================================================
# 8. npm Scripts
# ============================================================================

Write-Host "`n📜 npm SCRIPTS`n" -ForegroundColor $info

$scripts = @(
    "test:phase16:e2e",
    "test:phase16:audit",
    "test:phase16:all"
)

$packageJson = Get-Content "package.json" | ConvertFrom-Json

foreach ($script in $scripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "✅ npm run $script : Available" -ForegroundColor $success
    } else {
        Write-Host "❌ npm run $script : NOT defined" -ForegroundColor $error
        $allOK = $false
    }
}

# ============================================================================
# FINAL RESULT
# ============================================================================

Write-Host "`n" + ("=" * 70) -ForegroundColor $info

if ($allOK) {
    Write-Host "✅ ALL CHECKS PASSED - READY FOR TESTING!" -ForegroundColor $success
    Write-Host "`nYou can now run:" -ForegroundColor $info
    Write-Host "  npm run test:phase16:all" -ForegroundColor $info
    Write-Host "  or" -ForegroundColor $info
    Write-Host "  .\run-phase16-tests.cmd" -ForegroundColor $info
} else {
    Write-Host "⚠️  SOME CHECKS FAILED - PLEASE FIX ISSUES ABOVE" -ForegroundColor $warning
    Write-Host "`nCommon fixes:" -ForegroundColor $info
    Write-Host "  1. Install npm dependencies: npm install --no-optional --ignore-scripts" -ForegroundColor $info
    Write-Host "  2. Start Docker: docker-compose up -d" -ForegroundColor $info
    Write-Host "  3. Run build: npm run build" -ForegroundColor $info
}

Write-Host "`n" + ("=" * 70) -ForegroundColor $info
Write-Host ""

exit if (-not $allOK) { 1 } else { 0 }
