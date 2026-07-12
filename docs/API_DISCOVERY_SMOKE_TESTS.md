# API Endpoint Discovery & Smoke Tests

Automatische Entdeckung und Validierung aller Express API Endpoints mit umfassenden Test- und Reporting-Funktionen.

## 🎯 Features

### ApiEndpointDiscoveryService
- **Automatisches Route-Scanning**: Durchsucht alle Express Router und Controller
- **AST/Regex-Analyse**: Extrahiert Route-Definitionen, HTTP-Methoden und Handler
- **Auth-Erkennung**: Identifiziert geschützte vs. öffentliche Endpoints
- **API-Inventur**: Generiert strukturierte JSON-Inventur aller Endpoints
- **Middleware-Tracking**: Erfasst verwendete Middleware pro Endpoint

### ApiSmokeTestsService
- **HTTP-Requests**: Sendet Real-World Requests an alle Endpoints
- **Statuscode-Validierung**: Prüft erwartete HTTP Response Codes
- **Response-Struktur**: Validiert Response Format und erforderliche Felder
- **Performance-Tracking**: Misst Response Zeiten und identifiziert langsame Endpoints
- **Error-Aggregation**: Sammelt und kategorisiert alle Fehler
- **Multi-Format Reports**: Exportiert detaillierte Reports in JSON

## 📁 Struktur

```
src/infrastructure/services/
├── api-endpoint-discovery.service.ts     # Route-Scanner
├── api-smoke-tests.service.ts            # Test-Runner
└── index.ts                              # Barrel Export

scripts/
└── api-discovery-smoke-tests.ts          # Integrationsscript

tests/infrastructure/services/
└── api-discovery-smoke-tests.test.ts     # Jest Tests
```

## 🚀 Verwendung

### Quick Start

```bash
# API Discovery nur (generiert api-inventory.json)
npm run test:api:discovery:only

# Komplette Discovery + Smoke Tests
npm run test:api:discovery

# Tests ausführen
npm run test:api:smoke
```

### Programmativ

#### API Endpoints Entdecken

```typescript
import { ApiEndpointDiscoveryService } from 'src/infrastructure/services';

const discoveryService = new ApiEndpointDiscoveryService(process.cwd());

// Entdecke alle Endpoints
const inventory = await discoveryService.discover();

console.log(`Gefundene Endpoints: ${inventory.totalEndpoints}`);
console.log('Endpoints nach Methode:', inventory.summary.byMethod);
console.log('Geschützt:', inventory.summary.protectedCount);
console.log('Öffentlich:', inventory.summary.publicCount);

// Exportiere als JSON
await discoveryService.exportToJson('test-results/api-inventory.json');
```

#### Smoke Tests durchführen

```typescript
import {
  ApiEndpointDiscoveryService,
  ApiSmokeTestsService,
} from 'src/infrastructure/services';

// Entdecke Endpoints
const discoveryService = new ApiEndpointDiscoveryService();
const inventory = await discoveryService.discover();

// Führe Smoke Tests durch
const smokeService = new ApiSmokeTestsService('http://localhost:3000', 5000);
const report = await smokeService.runTests(inventory);

// Exportiere Report
await smokeService.exportToJson(report, 'test-results/api-smoke-report.json');
```

## 📊 Output-Format

### api-inventory.json

```json
{
  "timestamp": "2026-07-12T09:30:00.000Z",
  "version": "0.26.0",
  "totalEndpoints": 45,
  "endpoints": [
    {
      "route": "/api/config",
      "method": "GET",
      "controller": "config",
      "handler": "getConfig",
      "requiresAuth": false,
      "description": "Get application configuration",
      "middleware": ["corsHandler", "requestLogger"]
    },
    {
      "route": "/api/jobs",
      "method": "POST",
      "controller": "jobs",
      "handler": "createJob",
      "requiresAuth": true,
      "description": "Create new extraction job",
      "middleware": ["authenticate", "validateRequest"]
    }
  ],
  "summary": {
    "byMethod": {
      "GET": 28,
      "POST": 12,
      "PUT": 3,
      "DELETE": 2
    },
    "byPath": {
      "/api/config": 2,
      "/api/audit": 5,
      "/api/extract": 8,
      "/api/jobs": 4
    },
    "protectedCount": 15,
    "publicCount": 30
  }
}
```

### api-smoke-report.json

```json
{
  "timestamp": "2026-07-12T09:35:00.000Z",
  "totalTests": 42,
  "passed": 40,
  "failed": 1,
  "warnings": 1,
  "skipped": 3,
  "duration": 2850,
  "results": [
    {
      "endpoint": {
        "route": "/api/health",
        "method": "GET",
        "controller": "health",
        "handler": "healthCheck",
        "requiresAuth": false,
        "description": "Health check endpoint",
        "middleware": []
      },
      "status": "PASS",
      "statusCode": 200,
      "expectedStatus": 200,
      "responseTime": 5,
      "details": {
        "contentType": "application/json",
        "contentLength": "156",
        "responseSize": 156,
        "hasData": true,
        "hasTimestamp": true,
        "hasDuration": true
      },
      "timestamp": "2026-07-12T09:35:00.100Z"
    },
    {
      "endpoint": {
        "route": "/api/jobs/:id",
        "method": "GET",
        "controller": "jobs",
        "handler": "getJobById",
        "requiresAuth": false,
        "description": "Get job by ID",
        "middleware": []
      },
      "status": "SKIP",
      "expectedStatus": 200,
      "responseTime": 0,
      "details": {
        "reason": "Endpoint requires path parameters"
      },
      "timestamp": "2026-07-12T09:35:00.200Z"
    }
  ],
  "summary": {
    "successRate": 97.62,
    "failuresByEndpoint": {
      "/api/extract/validate": [
        "500 Internal Server Error - Invalid rule pattern"
      ]
    },
    "slowEndpoints": [
      {
        "route": "/api/extract",
        "time": 2300
      }
    ],
    "errorDetails": {
      "errorTypes": {
        "500 Internal Server Error": 1
      },
      "uniqueErrors": [
        "500 Internal Server Error - Invalid rule pattern"
      ],
      "totalErrors": 1
    }
  }
}
```

## 🔍 Route-Scanning

Die Discovery Service nutzt mehrere Strategien:

### Regex-Patterns
```typescript
// Router-Pattern
router.get('/path', handler)
router.post('/path', middleware, handler)

// App-Pattern
app.get('/path', handler)
app.delete('/path', authenticate, handler)
```

### Base Path Zuordnung

| Datei | Base Path |
|-------|-----------|
| `config.ts` | `/api/config` |
| `audit.ts` | `/api/audit` |
| `extract-phase14.ts` | `/api/extract` |
| `jobs.ts` | `/api/jobs` |
| `RevisionRoutes.ts` | `/api/revision` |
| `SchemaExtractionRoutes.ts` | `/api/schema` |

### Auth-Erkennung

Erkennt automatisch geschützte Endpoints durch Regex:
- `requireAuth`
- `authenticate`
- `middleware.*auth`
- `verifyToken`
- `passport`

## 🧪 Smoke Tests

### Getestete Szenarien

| Szenario | Beschreibung |
|----------|-------------|
| **GET** | Statuscode 200 |
| **POST** | Statuscode 201 (Created) |
| **PUT/PATCH** | Statuscode 200 |
| **DELETE** | Statuscode 204 (No Content) |
| **Response Format** | Validiert Datenstruktur |
| **Headers** | Prüft Content-Type, etc. |
| **Performance** | Warnt bei >1000ms Response |

### Skip-Logik

Endpoints mit Path-Parametern werden übersprungen:
```
❌ GET /api/jobs/:id
❌ PUT /api/config/:key
❌ DELETE /api/schema/:schemaId
```

Dies verhindert Test-Fehler durch fehlende erforderliche Parameter.

## 📈 Reports

### Erfolgskriterien

```
✅ PASS   - Statuscode erwartet, Response gültig
❌ FAIL   - Statuscode unerwartet oder Request fehlgeschlagen
⚠️ WARNING - Antwort langsam (>1000ms)
↩️ SKIP   - Endpoint übersprungen (Path-Parameter erforderlich)
```

### Metriken

- **Erfolgsrate**: (Bestanden / Gesamt-Tests) * 100%
- **Response-Zeit**: In Millisekunden
- **Error-Kategorisierung**: Nach Error-Typ gruppiert
- **Slow Endpoints**: Sortiert nach Response-Zeit

## 🛠️ Konfiguration

### Environment Variablen

```bash
# API Base URL (default: http://localhost:3000)
API_BASE_URL=http://api.example.com

# Test Timeout in ms (default: 5000)
TEST_TIMEOUT=10000
```

### Service Optionen

```typescript
// Discovery Service
const discovery = new ApiEndpointDiscoveryService(
  '/path/to/project' // Project Root
);

// Smoke Tests Service
const smokeTests = new ApiSmokeTestsService(
  'http://localhost:3000', // Base URL
  5000 // Timeout in ms
);
```

## 🔬 Tests

```bash
# Führe Jest Tests aus
npm run test:api:smoke

# Mit Coverage
npm run test:coverage -- tests/infrastructure/services/api-discovery-smoke-tests.test.ts
```

### Test-Coverage

- ✅ Endpoint-Discovery
- ✅ Endpoint-Struktur-Validierung
- ✅ Methoden-Kategorisierung
- ✅ Auth-Tracking
- ✅ JSON-Export
- ✅ Smoke Test Execution
- ✅ Status-Code Validierung
- ✅ Error-Aggregation
- ✅ Performance-Tracking
- ✅ Report-Export

## 🚨 Fehlerbehandlung

### Discovery-Fehler

```typescript
try {
  const inventory = await discoveryService.discover();
} catch (error) {
  console.error('Discovery fehlgeschlagen:', error);
  // Graceful Fallback
}
```

### Smoke-Test-Fehler

```typescript
const result: SmokeTestResult = {
  status: 'FAIL',
  error: 'Network timeout',
  details: { timeout: 5000 }
};
```

## 📝 Logs

### Console Output

```
🚀 Starte API Discovery & Smoke Tests

📡 Phase 1: Scanne API Endpoints...

✅ 45 Endpoints gefunden

📊 Zusammenfassung:
   GET:     28
   POST:    12
   PUT:      3
   DELETE:   2
🔒 Geschützt: 15
🔓 Öffentlich: 30

🧪 Phase 2: Starte Smoke Tests...

✅ GET /api/health - 200 (5ms)
✅ GET /api/config - 200 (12ms)
❌ GET /api/extract/validate - 500 (150ms)
↩️  GET /api/jobs/:id (skipped)

📋 FINAL REPORT
✅ Bestanden: 40
❌ Fehlgeschlagen: 1
↩️  Übersprungen: 3
⏱️  Gesamtdauer: 2850ms
📈 Erfolgsrate: 97.62%
```

## 🎓 Best Practices

1. **Vor Deployment**: Führe `npm run test:api:discovery` aus
2. **Monitoring**: Integriere Reports in Logging-System
3. **CI/CD**: Nutze Exit-Code (0=Erfolg, 1=Fehler)
4. **Regelmäßig**: Führe Tests in Dev und Staging aus
5. **Archive**: Speichere Report-Historie für Trends

## 🔄 Integration mit CI/CD

```yaml
# .github/workflows/api-validation.yml
- name: API Discovery & Smoke Tests
  run: npm run test:api:discovery
  
- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: api-reports
    path: test-results/api-*.json
```

## 📚 Weitere Ressourcen

- [Express Router Dokumentation](https://expressjs.com/de/api/router.html)
- [API Testing Best Practices](https://en.wikipedia.org/wiki/API_testing)
- [Jest Documentation](https://jestjs.io/)
- [TypeScript Reflection](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## Version

**v0.26.0** - July 12, 2026

---

Generated automatically by ApiEndpointDiscoveryService & ApiSmokeTestsService
