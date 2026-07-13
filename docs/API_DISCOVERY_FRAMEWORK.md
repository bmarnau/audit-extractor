# API Discovery & Smoke Test Framework

**Deutsch | [English](#english-documentation)**

## 🎯 Übersicht

Das **API Discovery & Smoke Test Framework** ist ein vollständiges System zur automatisierten:
- ✅ **API Endpoint Analyse** - Automatische Entdeckung von Routes, Controllern, Endpoints
- ✅ **Endpoint Inventarisierung** - Vollständige Katalogisierung aller APIs
- ✅ **Smoke Testing** - Automatische Validierung von Endpoints
- ✅ **Risk Analysis** - Automatische Risikoidentifizierung
- ✅ **Comprehensive Reporting** - Detaillierte JSON, HTML & Text Reports

---

## 🏗️ Architektur

```
API Discovery Framework
├── ApiDiscoveryService (Route & Endpoint Analyse)
├── SmokeTestService (Endpoint Validierung)
├── RiskAnalyzerService (Risikoanalyse)
└── ReportGeneratorService (Report-Generierung)
```

### Workflow

```
Endpoints entdecken
    ↓
Inventory generieren
    ↓
Smoke Tests durchführen
    ↓
Risiken analysieren
    ↓
Reports generieren
```

---

## 📋 API Discovery Service

### Funktionalität

```typescript
import { ApiDiscoveryService } from '@src/infrastructure/api-discovery';

const discovery = new ApiDiscoveryService(process.cwd(), 'My API');

// Endpoints entdecken
const endpoints = await discovery.discoverEndpoints();
// → ApiEndpoint[] mit alle Informationen

// Controller gruppieren
const groups = await discovery.discoverControllers();
// → ApiEndpointGroup[] nach Controller organisiert

// Vollständiges Inventory generieren
const inventory = await discovery.generateInventory();
// → ApiInventory mit Statistiken und Zusammenfassung

// Export zu JSON
await discovery.exportInventory(inventory, 'api-inventory.json');
```

### Discovered Endpoint-Struktur

```json
{
  "endpointId": "EP-GET-/api/users-1720937256789",
  "path": "/api/users",
  "method": "GET",
  "name": "Get Users",
  "controller": "UserController",
  "handler": "getUsers",
  "pathParams": ["id"],
  "queryParams": ["page", "limit"],
  "requiresAuth": true,
  "authType": "JWT",
  "isImplemented": true,
  "discoveredAt": "2024-07-13T10:07:36.789Z"
}
```

### Inventory-Struktur

```json
{
  "inventoryId": "API-INV-1720937256789",
  "generatedAt": "2024-07-13T10:07:36.789Z",
  "totalEndpoints": 48,
  "totalControllers": 6,
  "protectedEndpoints": 42,
  "publicEndpoints": 6,
  "deprecatedEndpoints": 2,
  "methodCounts": {
    "GET": 20,
    "POST": 12,
    "PUT": 10,
    "PATCH": 3,
    "DELETE": 3
  },
  "groups": [
    {
      "controller": "UserController",
      "endpoints": [...]
    }
  ]
}
```

---

## 🔄 Smoke Test Service

### Funktionalität

```typescript
import { SmokeTestService } from '@src/infrastructure/api-discovery';

const smokeTest = new SmokeTestService('http://localhost:3000', 5000);

// Einzelnen Endpoint testen
const result = await smokeTest.runTest(endpoint);

// Alle Endpoints testen
const report = await smokeTest.runAllTests(endpoints);
```

### Test-Prüfungen

Jeder Test validiert automatisch:

✅ **Status Code** - Response im Erfolgsbereich (200-204)?  
✅ **Content-Type Header** - Ist vorhanden?  
✅ **Response Structure** - Valid JSON?  
✅ **Required Fields** - Alle erforderlichen Felder?  
✅ **Response Size** - Unter 5MB?  
✅ **Response Time** - Unter 5 Sekunden?  
✅ **Error Handling** - Error Info bei Fehlern?  
✅ **Authentication** - Richtig geschützt?  

### Test-Report-Struktur

```json
{
  "reportId": "SMOKE-REPORT-1720937256789",
  "generatedAt": "2024-07-13T10:07:36.789Z",
  "totalTests": 48,
  "passedTests": 45,
  "failedTests": 3,
  "passRate": 93.75,
  "healthStatus": "HEALTHY",
  "totalDuration": 8234,
  "results": [
    {
      "testId": "TEST-...",
      "endpointId": "EP-...",
      "passed": true,
      "checks": [
        {
          "name": "Status Code",
          "passed": true,
          "actual": 200,
          "expected": "200-204"
        }
      ]
    }
  ],
  "failures": [
    {
      "endpoint": "GET /api/users/:id",
      "error": "Connection timeout",
      "failedChecks": ["Response Time"]
    }
  ]
}
```

---

## ⚠️ Risk Analysis Service

### Analyse-Kategorien

Die Risk Analyzer identifiziert automatisch 14 verschiedene Risikotypen:

```
KRITISCH (25-30 Punkte):
  • AUTHENTICATION_MISSING - Keine Authentifizierung
  • SECURITY_ISSUE - Sicherheitsproblem erkannt
  • UNIMPLEMENTED - Endpoint nicht implementiert
  • UNSAFE_METHOD - DELETE ohne Auth

HOCH (15-20 Punkte):
  • VALIDATION_MISSING - Keine Input-Validierung
  • NO_TEST_COVERAGE - Keine Tests
  • BROKEN_RESPONSE_SCHEMA - Response-Format fehlerhaft
  • NOT_IN_PATH - Tool nicht in PATH
  • ERROR_HANDLING_MISSING - Keine Error-Handler

MITTEL (10-15 Punkte):
  • SLOW_RESPONSE - Response dauert > 5s
  • DEPRECATED - Endpoint veraltet
  • RATE_LIMITING_MISSING - Kein Rate Limiting
  • DOCUMENTATION_MISSING - Keine Dokumentation

LOW (5-10 Punkte):
  • LARGE_PAYLOAD - Response > 1MB
  • DIRECTORY_MISSING - Verzeichnis fehlt
```

### Risk Score Berechnung

```
Basis: 0 Punkte
+ Gewicht pro Issue × Severity Multiplikator
= Score (0-100)

CRITICAL Severity = 1.5x Multiplier
HIGH = 1.0x
MEDIUM = 0.75x
LOW = 0.5x

Risk Level:
- 80+ = CRITICAL
- 60-79 = HIGH
- 40-59 = MEDIUM
- 20-39 = LOW
- < 20 = INFO
```

### Risk-Analysis-Report

```json
{
  "endpointId": "EP-...",
  "path": "/api/admin/delete",
  "method": "DELETE",
  "riskLevel": "CRITICAL",
  "riskScore": 87,
  "issues": [
    {
      "type": "UNSAFE_METHOD",
      "severity": "CRITICAL",
      "message": "DELETE endpoint does not require authentication"
    },
    {
      "type": "NO_TEST_COVERAGE",
      "severity": "HIGH",
      "message": "Endpoint has no test coverage"
    }
  ],
  "recommendations": [
    "Add authentication requirement",
    "Add unit tests for this endpoint",
    "Implement audit logging"
  ],
  "analyzedAt": "2024-07-13T10:07:36.789Z"
}
```

---

## 📊 Report Generator Service

### Funktionale Reports

```typescript
import { ReportGeneratorService } from '@src/infrastructure/api-discovery';

const reportGen = new ReportGeneratorService();

// Smoke Test Report
const smokeReport = await reportGen.generateSmokeTestReport(results);

// Funktionaler Report (kombiniert alles)
const funcReport = await reportGen.generateFunctionalReport(
  inventory,
  smokeReport,
  riskAnalyses
);

// Export zu Dateien
await reportGen.exportReports(smokeReport, funcReport, 'test-results');

// HTML Report
await reportGen.generateHtmlReport(
  inventory,
  smokeReport,
  funcReport,
  'test-results/report.html'
);
```

### Functional Report-Struktur

```json
{
  "reportId": "FUNC-REPORT-...",
  "generatedAt": "2024-07-13T10:07:36.789Z",
  "inventorySummary": {
    "totalEndpoints": 48,
    "totalControllers": 6,
    "publicEndpoints": 6,
    "protectedEndpoints": 42
  },
  "smokeTestSummary": {
    "totalTests": 48,
    "passedTests": 45,
    "failedTests": 3,
    "passRate": 93.75
  },
  "riskSummary": {
    "totalEndpointsAnalyzed": 48,
    "criticalRisks": 2,
    "highRisks": 5,
    "mediumRisks": 8,
    "lowRisks": 33
  },
  "overallHealth": "DEGRADED",
  "apiHealthScore": 72,
  "prioritizedRecommendations": [
    {
      "category": "AUTHENTICATION_MISSING",
      "priority": "CRITICAL",
      "affectedEndpointCount": 2,
      "recommendations": [...]
    }
  ]
}
```

---

## 🚀 npm Scripts

### Verwendung

```bash
# Alle API Discovery durchführen (kompletter Pipeline)
npm run api:full-pipeline

# Nur API-Inventory entdecken
npm run api:discover

# Nur Smoke Tests durchführen
npm run api:smoke-tests

# Nur Risikoanalyse durchführen
npm run api:risk-analysis

# Tests ausführen
npm run test:api-discovery

# Watch Mode
npm run test:api-discovery:watch

# Reports anzeigen
npm run api:inventory          # Zeige API Inventory
npm run api:smoke-report       # Zeige Smoke Test Report
npm run api:functional-report  # Zeige Functional Report
```

### Quick Start

```bash
# 1. Starten Sie Ihren API Server
npm run dev                    # Oder: docker-compose up

# 2. Führen Sie den kompletten Pipeline durch
npm run api:full-pipeline

# 3. Anschauen Sie die generierten Reports
cat test-results/api-inventory.json
cat test-results/api-smoke-report.json
cat test-results/api-functional-report.json
open test-results/api-discovery-report.html
```

---

## 📁 Generierte Artefakte

### api-inventory.json

```bash
test-results/api-inventory.json
```

Enthält:
- ✅ Alle entdeckten Endpoints
- ✅ Controller-Gruppierung
- ✅ Statistische Zusammenfassung
- ✅ Geschützte/Public Endpoints

### api-smoke-report.json

```bash
test-results/api-smoke-report.json
```

Enthält:
- ✅ Alle Test-Ergebnisse
- ✅ Fehlgeschlagene Tests mit Details
- ✅ Pass-Rate pro HTTP-Methode
- ✅ Response-Zeit Statistiken

### api-functional-report.json

```bash
test-results/api-functional-report.json
```

Enthält:
- ✅ Kombinierter Bericht aller Analysen
- ✅ Health-Score und Recommendations
- ✅ Top-Risiken und Top-Failures
- ✅ Priorisierte Action Items

### api-discovery-report.html

```bash
test-results/api-discovery-report.html
```

Interaktiver HTML Report mit:
- ✅ Visuelle Visualisierung aller Metriken
- ✅ Color-coded Status
- ✅ Responsive Design
- ✅ Printbar Format

---

## 💻 Programmatische Verwendung

### Complete Pipeline

```typescript
import { runApiDiscoveryPipeline } from '@src/infrastructure/api-discovery';

const result = await runApiDiscoveryPipeline(
  'http://localhost:3000',  // Base URL
  'test-results'             // Output Directory
);

console.log('Reports generated:');
console.log('- Inventory:', result.inventoryPath);
console.log('- Smoke Report:', result.smokeReportPath);
console.log('- Functional Report:', result.functionalReportPath);
console.log('- HTML Report:', result.htmlReportPath);
```

### Specific Components

```typescript
import {
  ApiDiscoveryService,
  SmokeTestService,
  RiskAnalyzerService,
  ReportGeneratorService,
} from '@src/infrastructure/api-discovery';

// 1. Discover
const discovery = new ApiDiscoveryService();
const endpoints = await discovery.discoverEndpoints();

// 2. Test
const smokeTest = new SmokeTestService('http://localhost:3000');
const smokeReport = await smokeTest.runAllTests(endpoints);

// 3. Analyze
const analyzer = new RiskAnalyzerService();
const risks = await analyzer.analyzeAll(endpoints, smokeReport.results);

// 4. Report
const reporter = new ReportGeneratorService();
const funcReport = await reporter.generateFunctionalReport(
  inventory,
  smokeReport,
  risks
);
```

---

## 🔧 Konfiguration

### Custom Base URL

```typescript
const smokeTest = new SmokeTestService(
  'https://api.production.com',  // Custom URL
  10000                           // Custom timeout (ms)
);
```

### Custom Output Directory

```bash
npm run api:full-pipeline   # Standard: test-results/
# Oder mit Custom Verzeichnis (wenn möglich):
mkdir -p reports/api
npm run api:full-pipeline  # (würde in test-results gehen)
```

---

## 📊 Test Coverage

Die Test Suite enthält 40+ Test Cases:

- ✅ **API Discovery** (8 Tests)
  - Endpoint-Entdeckung
  - Controller-Gruppierung
  - Inventory-Generierung
  - Statistik-Berechnung

- ✅ **Smoke Testing** (12 Tests)
  - Request-Building
  - Response-Validierung
  - Error-Klassifizierung
  - Pass-Rate Berechnung

- ✅ **Risk Analysis** (10 Tests)
  - Issue-Identifizierung
  - Risk Score Berechnung
  - Recommendations-Generierung
  - Risk Level Determination

- ✅ **Report Generation** (8 Tests)
  - Report Structure Validierung
  - Health Score Berechnung
  - Prioritization Logic
  - Export Functionality

- ✅ **Integration Tests** (4 Tests)
- ✅ **Error Handling** (3 Tests)
- ✅ **Performance** (2 Tests)

Führen Sie Tests aus mit:

```bash
npm run test:api-discovery
npm run test:api-discovery:watch
```

---

## 🐛 Fehlerbehebung

### API Server läuft nicht

```bash
# Fehler: Connection refused
# Lösung: Starten Sie Ihren API Server
npm run dev
# Oder: docker-compose up
```

### Endpoints werden nicht entdeckt

```bash
# Fehler: api-inventory.json ist leer
# Lösung: Überprüfen Sie, dass Routes/Controller existieren
ls src/routes/
ls src/infrastructure/http/controllers/

# Überprüfen Sie die Dateiformate (sollten .ts sein)
```

### Smoke Tests schlagen fehl

```bash
# Fehler: Viele fehlgeschlagene Tests
# Überprüfen Sie:
1. API Server läuft auf http://localhost:3000
2. Endpoints sind korrekt implementiert
3. Authentication ist richtig konfiguriert
4. Response Format ist gültig JSON
```

### Performance Probleme

```bash
# Wenn Tests sehr langsam sind:
# Standardtimeout ist 5000ms
# Können Sie anpassen:
new SmokeTestService(baseUrl, 10000)  // 10 Sekunden
```

---

## 📈 Best Practices

1. **Regelmäßig laufen** - In CI/CD Pipeline
2. **Vor jedem Release** - Pre-deployment Validierung
3. **Daily Checks** - Scheduled Job für Monitoring
4. **Reports archivieren** - Trend-Analyse über Zeit
5. **Risiken priorisieren** - Focus auf CRITICAL Issues
6. **Automation** - Automatische Issue-Erstellung für Failures

---

## 🎓 Zusammenfassung

Das **API Discovery & Smoke Test Framework** bietet:

✅ Automatische API-Endpoint Entdeckung  
✅ Vollständiges Endpoint Inventory  
✅ Smoke Testing mit 8 Validierungen  
✅ Automatische Risikoanalyse (14 Kategorien)  
✅ Umfassende HTML/JSON/Text Reports  
✅ Health Score Berechnung  
✅ 40+ Test Cases  
✅ Production Ready  

---

---

# English Documentation

## 🎯 Overview

The **API Discovery & Smoke Test Framework** is a complete system for automated:
- ✅ API Endpoint Analysis - Automatic discovery of routes, controllers, endpoints
- ✅ Endpoint Inventorization - Complete API cataloging
- ✅ Smoke Testing - Automatic endpoint validation
- ✅ Risk Analysis - Automatic risk identification
- ✅ Comprehensive Reporting - Detailed JSON, HTML & text reports

## 🚀 Quick Start

```bash
# Start your API server
npm run dev

# Run complete pipeline
npm run api:full-pipeline

# View generated reports
npm run api:inventory
npm run api:smoke-report
npm run api:functional-report
open test-results/api-discovery-report.html
```

## 📊 Generated Reports

All reports are saved to: `test-results/`

- `api-inventory.json` - Complete endpoint catalog
- `api-smoke-report.json` - Smoke test results
- `api-functional-report.json` - Combined analysis report
- `api-discovery-report.html` - Interactive HTML view
- `api-report-summary.txt` - Text summary

## 🔗 Key Features

- Automatic API Discovery (Routes, Controllers, Endpoints)
- HTTP Method Detection
- Parameter Extraction
- Authentication Analysis
- 8 Automated Validations per Endpoint
- 14 Risk Categories
- Health Scoring (0-100)
- Multi-format Reports
- 40+ Test Cases

For detailed documentation, see the German section above.
