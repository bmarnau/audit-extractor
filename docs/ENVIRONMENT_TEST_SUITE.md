# Environment Test Suite - Vollständige Dokumentation

**Deutsch | [English](#english-documentation)**

## 🎯 Übersicht

Die **Environment Test Suite** ist ein umfassendes System zur automatisierten Validierung und Überprüfung der Entwicklungs-, Staging- und Produktionsumgebungen. Sie prüft alle kritischen Umgebungskonfigurationen und erstellt detaillierte Reports mit automatischer Fehlerklassifizierung.

### ✨ Hauptmerkmale

✅ **14 Verschiedene Checks** - Node, npm, Docker, PostgreSQL, Konfiguration, Umgebungsvariablen, Verzeichnisse, Dateiberechtigungen, Disk Space, Ports  
✅ **Automatische Fehlerklassifizierung** - 16 verschiedene Fehlertypen mit Severity und Recommendations  
✅ **Multiple Report Formate** - JSON, HTML, Markdown  
✅ **Umfassende Testabdeckung** - 40+ Test Cases  
✅ **Production Ready** - Robuste Fehlerbehandlung und Validierung  
✅ **Integration mit anderen Systemen** - Funktioniert mit TestGovernanceFramework und Issue-Tracking  

---

## 📋 Unterstützte Umgebung Checks

### 1. **Node.js Version Check**
```
Category: NODE_VERSION
Prüfung: Installierte Node-Version gegen Mindestanforderung
Status: PASS wenn kompatible Version, FAIL wenn zu alt
Blocking: JA (Build & Deploy)
```

**Beispiel Output:**
```json
{
  "status": "PASS",
  "findings": [
    "Node.js version: 18.15.0",
    "Required: 16.0+",
    "Compatible version installed"
  ],
  "actualValue": "18.15.0",
  "requiredValue": "16.0+"
}
```

### 2. **npm Version Check**
```
Category: NPM_VERSION
Prüfung: npm Version, package-lock.json, node_modules Status
Status: PASS wenn kompatible Version vorhanden
Blocking: JA (Build)
```

**Empfehlungen:**
- Upgrade npm falls zu alt
- npm install falls Dependencies fehlen
- Lockfile regenerieren

### 3. **Docker Installation**
```
Category: DOCKER_INSTALLATION
Prüfung: Docker & docker-compose Installation
Status: PASS wenn installiert
Blocking: NEIN
```

### 4. **Docker Service**
```
Category: DOCKER_SERVICE
Prüfung: Docker Daemon läuft und ist erreichbar
Status: PASS wenn Daemon läuft
Blocking: NEIN
```

### 5. **docker-compose Funktionalität**
```
Category: DOCKER_COMPOSE
Prüfung: docker-compose Befehl funktioniert
Status: PASS wenn einsatzbereit
Blocking: NEIN
```

### 6. **PostgreSQL Installation**
```
Category: POSTGRESQL_INSTALLATION
Prüfung: PostgreSQL Installation & psql Command
Status: PASS wenn installiert
Blocking: NEIN
```

### 7. **PostgreSQL Service**
```
Category: POSTGRESQL_SERVICE
Prüfung: PostgreSQL Service läuft auf Port 5432
Status: PASS wenn Service läuft
Blocking: DEPLOY
```

### 8. **PostgreSQL Konnektivität**
```
Category: POSTGRESQL_CONNECTIVITY
Prüfung: Kann sich zur DB verbinden (Host, Port, User)
Status: PASS wenn Verbindung funktioniert
Blocking: DEPLOY
Environment: DB_HOST, DB_PORT, DB_USER, DB_NAME
```

### 9. **Konfigurationsdateien**
```
Category: CONFIG_FILES
Prüfung: Erforderliche Config Dateien vorhanden & valid
Files: package.json, tsconfig.json, .env, docker-compose.yml
Status: PASS wenn alle erforderlich Dateien valid
Blocking: BUILD & DEPLOY
```

### 10. **Umgebungsvariablen**
```
Category: ENVIRONMENT_VARIABLES
Prüfung: Erforderliche Env-Variablen gesetzt & valid
Required: NODE_ENV, DB_HOST, DB_PORT, DB_USER, DB_NAME
Optional: API_PORT, FRONTEND_PORT
Status: PASS wenn alle erforderlich vorhanden
Blocking: DEPLOY
```

### 11. **Verzeichnisstruktur**
```
Category: DIRECTORY_STRUCTURE
Prüfung: Erforderliche Verzeichnisse existieren
Required: src, src/infrastructure, backend, frontend, docs
Status: PASS wenn alle existieren
Blocking: NEIN
```

### 12. **Dateiberechtigungen**
```
Category: FILE_PERMISSIONS
Prüfung: Kritische Dateien haben korrekte Permissions
Checked: package.json, src/, test-results/
Status: PASS wenn Permissions korrekt
Blocking: BUILD
```

### 13. **Disk Space**
```
Category: DISK_SPACE
Prüfung: Ausreichend freier Speicherplatz
Thresholds:
  - Warning: > 80% verwendet
  - Critical: > 95% verwendet
Status: PASS wenn < 80% verwendet
Blocking: BUILD & DEPLOY (wenn Critical)
```

### 14. **Port Verfügbarkeit**
```
Category: PORT_AVAILABILITY
Prüfung: Erforderliche Ports sind verfügbar
Ports:
  - 3000 (API Server)
  - 5173 (Frontend Dev)
  - 5432 (PostgreSQL)
  - 2375 (Docker)
Status: PASS wenn alle verfügbar
Blocking: NEIN
```

---

## 🔴 Fehlerklassifizierung

Das System klassifiziert automatisch 16 verschiedene Fehlertypen:

### Kritische Fehler (CRITICAL Severity)

| Fehlertyp | Ursache | Blocking |
|-----------|--------|----------|
| NOT_INSTALLED | Tool/Service nicht installiert | ✅ BUILD & DEPLOY |
| VERSION_MISMATCH | Falsche Version installiert | ✅ BUILD & DEPLOY |
| SERVICE_NOT_RUNNING | Service nicht aktiv | ✅ DEPLOY |
| CONNECTION_FAILED | Kann nicht verbinden | ✅ DEPLOY |
| MISSING_FILE | Erforderliche Datei fehlt | ✅ BUILD & DEPLOY |

### Hohe Fehler (HIGH Severity)

| Fehlertyp | Ursache | Blocking |
|-----------|--------|----------|
| NOT_IN_PATH | Tool nicht in PATH | ✅ BUILD |
| INVALID_FILE_FORMAT | Datei hat ungültiges Format | ✅ BUILD |
| MISSING_ENV_VAR | Env-Variable nicht gesetzt | ❌ DEPLOY |
| PERMISSION_DENIED | Keine Berechtigung | ✅ BUILD |

### Mittlere Fehler (MEDIUM Severity)

| Fehlertyp | Ursache | Blocking |
|-----------|--------|----------|
| INSUFFICIENT_DISK_SPACE | Zu wenig freier Speicher | ✅ BUILD & DEPLOY |
| PORT_IN_USE | Port bereits belegt | ❌ |
| CONFIGURATION_ERROR | Konfiguration invalid | ❌ |

### Niedrige Fehler (LOW Severity)

| Fehlertyp | Ursache | Blocking |
|-----------|--------|----------|
| DIRECTORY_MISSING | Verzeichnis fehlt | ❌ |
| UNKNOWN | Unbekannter Fehler | ❌ |

---

## 📊 Report-Struktur

### environment-report.json

```json
{
  "reportId": "ENV-REPORT-1720937256789",
  "generatedAt": "2024-07-13T10:07:36.789Z",
  "environment": "development",
  "osInfo": {
    "platform": "win32",
    "arch": "x64",
    "release": "10.0.22621",
    "uptime": 86400
  },
  "systemInfo": {
    "hostname": "WORKSTATION-01",
    "cpuCount": 8,
    "totalMemory": 34359738368,
    "availableMemory": 12884901888,
    "memoryUsagePercentage": 62.5
  },
  "checks": [
    {
      "checkId": "ENV-NODE-1720937256789",
      "category": "NODE_VERSION",
      "checkName": "Node.js Version Check",
      "status": "PASS",
      "severity": "INFO",
      "findings": ["Node.js version: 18.15.0", "Required: 16.0+"],
      "details": {
        "currentVersion": "18.15.0",
        "majorVersion": 18,
        "minorVersion": 15,
        "isCompatible": true
      },
      "recommendedActions": [],
      "duration": 45,
      "checkedAt": "2024-07-13T10:07:36.789Z",
      "isBlockingBuild": false,
      "isBlockingDeploy": false
    }
  ],
  "summary": {
    "totalChecks": 14,
    "passedChecks": 12,
    "failedChecks": 2,
    "warningChecks": 0,
    "skippedChecks": 0,
    "passRate": 85.71,
    "failureRate": 14.29,
    "criticalIssues": 1,
    "highIssues": 1,
    "buildBlockers": 1,
    "deployBlockers": 1,
    "executionTime": 2340
  },
  "healthStatus": "DEGRADED",
  "overallScore": 78,
  "buildReady": false,
  "deployReady": false,
  "recommendations": [
    "Install missing Docker service",
    "Configure PostgreSQL connection parameters"
  ],
  "criticalIssues": [
    { "check details for failed critical check" }
  ],
  "blockingIssues": [
    { "check details for blocking failed check" }
  ]
}
```

---

## 🚀 Verwendung

### npm Scripts

```bash
# Umgebungs-Tests ausführen
npm run test:environment

# Tests im Watch-Modus
npm run test:environment:watch

# Kompletten Environment Check durchführen & Reports generieren
npm run environment:run

# Generierte Reports anzeigen
npm run environment:report

# Quick-Check (zeigt Zusammenfassung)
npm run environment:check
```

### Programmatische Verwendung

```typescript
import { 
  runEnvironmentTests,
  environmentChecker,
  environmentClassifier,
  environmentReporter
} from '@src/infrastructure/environment-test';

// Option 1: Vollständiger Test & Report
const report = await runEnvironmentTests('development');
console.log(report.healthStatus);
console.log(report.overallScore);

// Option 2: Einzelne Checks
const checks = await environmentChecker.runAllChecks();
const nodeCheck = await environmentChecker.checkNodeVersion();
const dockerCheck = await environmentChecker.checkDocker();

// Option 3: Fehlerklassifizierung
const classification = environmentClassifier.classifyError(
  EnvironmentCheckCategory.NODE_VERSION,
  new Error('version mismatch'),
  {}
);
console.log(classification.severity);
console.log(classification.suggestedActions);

// Option 4: Custom Report Generierung
const customReport = await environmentReporter.generateReport(
  checks,
  'production'
);
await environmentReporter.exportAsJSON(customReport, 'my-report.json');
await environmentReporter.exportAsHTML(customReport, 'my-report.html');
```

### In GitHub Actions CI/CD

```yaml
- name: Environment Test Suite
  run: npm run test:environment

- name: Generate Reports
  if: always()
  run: npm run environment:run

- name: Upload Reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: environment-reports
    path: test-results/environment-report.*
```

---

## 📈 Health Score Berechnung

Der Health Score (0-100) wird wie folgt berechnet:

```
Startpunkte: 100

Abzüge:
- Pro fehlgeschlagener Check: -10 Punkte
- Pro Warning Check: -5 Punkte
- Pro Critical Issue: -20 Punkte
- Pro High Severity Issue: -10 Punkte
- Pro Blocking Issue: -15 Punkte

Health Score = max(0, min(100, 100 - total_deductions))

Beispiele:
- 0 Fehler: Score = 100 (Healthy)
- 1 Fehler: Score = 90 (Healthy)
- 3 Fehler: Score = 70 (Degraded)
- > 5 Fehler oder Critical: Score < 30 (Critical)
```

---

## 🎨 Report Formate

### JSON Format

Maschinenlesbar, vollständige Daten für Automatisierung

```bash
npm run environment:report
```

### HTML Format

Interaktiv, visuell ansprechend für Browser

```
test-results/environment-report.html
```

**Features:**
- Color-coded Status (Green/Orange/Red)
- Responsive Design
- Sortierbare Tabellen
- Expandierbare Sections

### Markdown Format

Für Dokumentation & Git-Repositories

```
test-results/environment-report.md
```

**Features:**
- GitHub-kompatibel
- Automatische Table of Contents
- Code-Highlighting
- Einfach zu teilen

---

## 🔧 Konfiguration

### Node Version Anforderungen anpassen

```typescript
const checker = new EnvironmentCheckerService(
  process.cwd(),
  { major: 18, minor: 0 },  // Required Node version
  { major: 9, minor: 0 }    // Required npm version
);
```

### Environment Test im CI/CD Failure verursachen

```typescript
const report = await runEnvironmentTests('production');

if (!report.deployReady) {
  process.exit(1); // Deployment blockieren
}

if (report.summary.buildBlockers > 0) {
  process.exit(1); // Build blockieren
}
```

---

## 📊 Integration mit anderen Systemen

### Mit TestGovernanceFramework

```typescript
import { TestGovernanceFramework } from '@src/infrastructure/governance';
import { runEnvironmentTests } from '@src/infrastructure/environment-test';

const govReport = new TestGovernanceFramework().getLatestReport();
const envReport = await runEnvironmentTests('production');

// Integration
if (!envReport.deployReady && govReport.releaseBlockers.length > 0) {
  console.log('Release blockiert aufgrund Environment Issues');
}
```

### Mit Issue-Tracking System

```typescript
import { issueManager } from '@src/infrastructure/issue-tracking';
import { runEnvironmentTests } from '@src/infrastructure/environment-test';

const report = await runEnvironmentTests('production');

// Erstelle automatisch Issues für jeden fehlgeschlagenen Check
for (const failedCheck of report.criticalIssues) {
  await issueManager.createFromEnvironmentCheck(failedCheck);
}
```

---

## 🐛 Fehlerbehandlung

Das System behandelt Fehler elegant:

```typescript
try {
  const result = await checker.checkPostgreSQL();
  
  if (result.status === 'FAIL') {
    console.log('Fehlertyp:', result.errorType);
    console.log('Empfohlene Aktionen:', result.recommendedActions);
    
    // Fehler klassifizieren
    const classification = classifier.classifyError(
      result.category,
      result.errorMessage
    );
  }
} catch (error) {
  // Service Error (sollte nicht vorkommen)
  console.error('Kritischer Fehler:', error);
}
```

---

## 📝 Best Practices

1. **Regelmäßig ausführen** - In CI/CD Pipeline nach jedem Commit
2. **Production Checks** - Tägliche Checks in Production via Cron
3. **Issue-Integration** - Automatisch Issues für kritische Fehler erstellen
4. **Archivierung** - Reports archivieren für Trend-Analyse
5. **Alerts** - Slack/Email für kritische Issues konfigurieren
6. **Dashboard** - HTML Reports in internes Wiki exportieren

---

## 📚 Verwendungsbeispiele

### Beispiel 1: CI/CD Pre-Deployment Check

```bash
#!/bin/bash
npm run test:environment
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "❌ Environment Check fehlgeschlagen"
  exit 1
fi

npm run environment:run
REPORT=$(cat test-results/environment-report.json)

if ! echo "$REPORT" | grep -q '"deployReady": true'; then
  echo "❌ Deployment nicht möglich"
  exit 1
fi

echo "✅ Environment bereit für Deployment"
```

### Beispiel 2: Docker Startup Validation

```typescript
import { runEnvironmentTests } from '@src/infrastructure/environment-test';

async function startupValidation() {
  const report = await runEnvironmentTests('docker');
  
  console.log(`Health Score: ${report.overallScore}/100`);
  
  if (!report.buildReady) {
    throw new Error('Build fehlgeschlagen: ' + 
      report.blockingIssues.map(i => i.checkName).join(', '));
  }
  
  if (!report.deployReady) {
    console.warn('Deploy-Probleme erkannt:');
    report.blockingIssues.forEach(issue => {
      console.warn(`  - ${issue.checkName}: ${issue.recommendedActions[0]}`);
    });
  }
  
  return report;
}
```

### Beispiel 3: Monitoring Dashboard

```typescript
// Täglich Reports generieren
setInterval(async () => {
  const report = await runEnvironmentTests('production');
  
  // In Database speichern
  await saveHealthMetrics({
    timestamp: new Date(),
    healthScore: report.overallScore,
    buildReady: report.buildReady,
    deployReady: report.deployReady,
    criticalIssues: report.summary.criticalIssues,
    checks: report.checks.map(c => ({
      name: c.checkName,
      status: c.status
    }))
  });
  
  // Alert bei Verschlechterung
  if (report.overallScore < 70) {
    await sendAlert('Environment Health degraded', report);
  }
}, 24 * 60 * 60 * 1000); // täglich
```

---

## 🏆 Zusammenfassung

Die **Environment Test Suite** bietet:

✅ **Automatische Validierung** aller kritischen Komponenten  
✅ **Intelligente Fehlerklassifizierung** für schnelle Problemlösung  
✅ **Umfassende Reporting** in JSON, HTML, Markdown  
✅ **CI/CD Integration** für Automation  
✅ **Production Ready** mit Fehlerbehandlung  
✅ **Erweiterbar** für Custom Checks  

---

---

# English Documentation

## 🎯 Overview

The **Environment Test Suite** is a comprehensive system for automated validation and verification of development, staging, and production environments. It checks all critical environment configurations and generates detailed reports with automatic error classification.

### ✨ Key Features

✅ **14 Different Checks** - Node, npm, Docker, PostgreSQL, Configuration, Environment Vars, Directories, File Permissions, Disk Space, Ports  
✅ **Automatic Error Classification** - 16 different error types with severity and recommendations  
✅ **Multiple Report Formats** - JSON, HTML, Markdown  
✅ **Comprehensive Test Coverage** - 40+ Test Cases  
✅ **Production Ready** - Robust error handling and validation  
✅ **System Integration** - Works with TestGovernanceFramework and Issue Tracking  

## 🚀 Quick Start

```bash
# Run environment tests
npm run test:environment

# Generate full reports
npm run environment:run

# View reports
npm run environment:report

# Quick health check
npm run environment:check
```

## 📊 Report Output

All reports are saved to: `test-results/environment-report.*`

- `environment-report.json` - Machine-readable format
- `environment-report.html` - Interactive browser view
- `environment-report.md` - Markdown for documentation

## 🔗 For More Information

- See [Full English Documentation in code comments]
- Review generated HTML report: `test-results/environment-report.html`
- Check JSON report for programmatic access: `test-results/environment-report.json`
