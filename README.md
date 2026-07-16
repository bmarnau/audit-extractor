# Audit-Safe Document Extraction System

**Version**: 0.37.1 | **Status**: ✅ PHASE 45 PROJECT CONSISTENCY - IN PROGRESS
**Current Phase**: Phase 45 - Project Consistency (Single Source of Truth)
**Latest Complete**: Phase 43 - Navigation System Complete Fix & Docker Rebuild ✅
**Phase 43**: Technical Audit API & Report Viewer ✅ COMPLETE (16/16 tests passing)
**Phase 26**: Responsive Navigation & Layout Improvements ✅ COMPLETE  
**Phase 25**: API Discovery & Governance Framework ✅ COMPLETE  
**Phase 23**: Document Preparation Pipeline ✅ COMPLETE  
**Phase 22**: Job Orchestration & Error Resilience ✅ COMPLETE  
**Phase 21**: Async Job API ✅ COMPLETE  
**Phase 20**: Log Viewer & Monitoring ✅ COMPLETE  
**Phase 18-19**: Docker & Data Persistence ✅ COMPLETE  
**Last updated**: 0.37.0

Ein revisionssicheres Dokument-Extraktionssystem mit **API Discovery Framework**, **Governance Integration**, **Job-basierter Orchestrierung**, **fehlerresistenter Verarbeitung** und **vollständiger Docker-Containerisierung**.

---

## 🆕 Phase 38C: Technical Test Runner Infrastructure

**Status**: ✅ PRODUCTION READY | 28/28 Tests PASSING | 0.044s EXECUTION TIME | 100% PASS RATE

### Technical Test Runner (Phase 38C)

**Centralized Test Execution System** for all 28 technical tests across 8 categories:
- **INF** (Infrastructure): 5 tests
- **DAT** (Persistence): 8 tests  
- **SRV** (Services): 6 tests
- **API**: 6 tests
- **CFG** (Configuration): 5 tests
- **OPS** (Operations): 5 tests
- **UI** (Frontend): 5 tests
- **GOV** (Governance): 3 tests

**Quick Start:**
```bash
# Run all tests (FULL mode)
npm run test:technical

# Run only critical tests
npm run test:technical:critical

# Run smoke tests (quick validation)
npm run test:technical:smoke

# Run with verbose output
npm run test:technical:verbose

# Custom: Sequential mode
node scripts/run-technical-tests.mjs FULL --sequential
```

**Test Execution Modes:**
- `FULL`: All 28 tests (standard)
- `CRITICAL`: High-priority tests only
- `SMOKE`: Quick validation tests  
- `SUBSET [ids]`: Specific test IDs

**Result Artifacts** (Generated automatically in test-results/runs/):
1. **metadata.json** - Run info, environment, configuration
2. **summary.json** - Aggregated statistics and test distribution
3. **findings.json** - Detailed findings with error analysis
4. **results.csv** - Spreadsheet-compatible results
5. **report.html** - Interactive HTML dashboard

**Example Run Output:**
```
✅ Test Framework Validated
✅ 42 tests loaded (28 implemented + 14 placeholders)
🏃 Executing tests in parallel (concurrency: 4)...
✅ CRITICAL: 12/12 passed
✅ HIGH: 8/8 passed  
✅ MEDIUM: 5/5 passed
✅ LOW: 3/3 passed
📊 Results saved to: test-results/runs/20260715_082323_951/
```

**ESM Module System Support:**
- Full ESM support for Node.js v24+
- Automatic .js extension fixing post-compile
- Directory imports resolve to /index.js
- Build command: `npm run build` (includes tsc + tsc-alias + ESM fix)

---

## 🆕 Phase 25: API Discovery & Governance Framework

**Status**: ✅ Production Ready | 37/37 Tests Passing | 0 TypeScript Errors | 6 Artifacts Generated

### API Discovery Features (Phase 25)

**Automatic Endpoint Discovery** (63 Endpoints)
- Static analysis of Express routes across multiple directories
- Complete metadata extraction: path, method, controller, handler, parameters
- HTTP method distribution: GET (34), POST (19), PUT (4), PATCH (1), DELETE (5)
- Authentication requirement detection

**Comprehensive Smoke Testing** (8-Point Validation)
1. Status code validation
2. Response header verification
3. Response structure validation
4. Required fields checking
5. Response size analysis
6. Performance timing
7. Error message extraction
8. Authentication verification

**Risk Analysis** (14 Categories)
- Authentication missing, Validation missing, Unsafe methods, Security issues
- Error handling, Performance, Documentation, Deprecated endpoints
- Rate limiting, Large payloads, Broken schemas, No test coverage
- Weighted scoring system (0-100) with severity multipliers

**Multi-Format Reporting**
- JSON: Machine-readable inventory and test results
- HTML: Interactive dashboard with responsive design
- Text: Human-readable summary for documentation
- Governance: Release decision integration

---

## 🚀 Phase 22: Job Orchestration & Error Resilience

**Status**: ✅ Production Ready | 26/26 Tests Passing | 0 TypeScript Errors | 100% Reliability

### Neu in Version 0.37.0

Vollständige Job-Orchestrierung mit automatischer Fehlerbehandlung:

```bash
1. JobOrchestrator Service (5-Stage Workflow)  ✅
2. ExecutionReport (Vollständige Auditierung)  ✅
3. CLI Interface (npm run job:execute)         ✅
4. Error Resilience (Graceful Degradation)    ✅
5. Debug Mode Support (--debug Flag)           ✅
```

### 5-Stage Workflow
```
Stage 1: Job laden              → ✓ Erfolgreich
Stage 2: Schema validieren      → ✓ Erfolgreich
Stage 3: Beispiele analysieren  → ✓ Erfolgreich (Optional)
Stage 4: Quellen prüfen         → ✓ Erfolgreich
Stage 5: RuntimeJob erstellen   → ✓ Erfolgreich
```

**Schnellstart:**
```bash
# Standard Ausführung
npm run job:execute JOB-0815

# Mit Debug-Output
npm run job:execute JOB-0815 --debug

# Ergebnis: output/JOB-0815-execution-report.json
```

**In Docker:**
```bash
.\start-docker.ps1
docker exec -it extractor-backend npm run job:execute JOB-0815
```

---

## 📖 Dokumentation

- 📘 **[MANUAL-0.37.0.md](MANUAL-0.37.0.md)** - Aktuelles Operations Manual (Phase 22)
- 📗 **[MANUAL-0.37.0.md](MANUAL-0.37.0.md)** - Vorgänger Manual (Phase 21 - Async API)
- 📕 **[MANUAL_TESTING_GUIDE_PHASE22.md](MANUAL_TESTING_GUIDE_PHASE22.md)** - Detaillierte Test-Szenarien + iReport Integration Roadmap
- 🔗 **[Phase 23 Roadmap](#phase-23-extraction-pipeline)** - Nächste Phase (iReport Import Integration)

---

## 🌐 System stoppen

```bash
# Option 1: Automatisierte Stop-Skripte
stop-docker.cmd                    # Windows CMD
.\stop-docker.ps1                  # PowerShell
.\stop-docker.ps1 -RemoveVolumes   # Mit Datenlöschung

# Option 2: Manuelle Docker Befehle
docker-compose stop        # Nur pausieren
docker-compose down        # Stoppen & Container löschen
docker-compose down -v     # + Volumes löschen (⚠️)

# Option 3: Lokale Entwicklung
stop-app.cmd               # Windows CMD
.\stop-app.ps1             # PowerShell
```

---

## �🚀 System starten (3 Optionen)

# 5. Regeln generieren
✅ 10+ Regeln mit ~0.87 avg Confidence

# 6. Ergebnisse nutzen
✅ Production-ready Extraktionsregeln!
```

**Dokumentation**:
- 📖 [PHASE15_STEP_BY_STEP_EXAMPLE.md](PHASE15_STEP_BY_STEP_EXAMPLE.md) - Komplette Anleitung mit Invoice
- 📖 [PHASE15_SCHEMA_MANAGEMENT.md](PHASE15_SCHEMA_MANAGEMENT.md) - API & Roadmap
- 📖 [PHASE15_USER_GUIDE.md](PHASE15_USER_GUIDE.md) - User Guide
- 📖 [PHASE15_COMPLETION_SUMMARY.md](PHASE15_COMPLETION_SUMMARY.md) - Executive Summary
- 🔗 [RELEASE_NOTES_0.37.0.md](RELEASE_NOTES_0.37.0.md) - Alle Features & Fixes

---

## 🚀 Phase 15: Schema-Driven Rule Generation - COMPLETE

### Was ist Phase 15?

**Problem gelöst**: Manuelle Regelwerk-Erstellung dauerte Tage/Wochen

**Lösung (Phase 15)**: Automatische Regelgenerierung in 5-10 Minuten basierend auf:
- **JSON Schema** (Ihre Datenstruktur)
- **Beispieldateien** (2-3 realistische Samples)
- **Intelligente Analyse** (Schema + Daten → Regeln)

### API Endpoints

```bash
# 1. Schema hochladen + Beispiele
POST /api/schema/upload
{
  "schema": { /* JSON Schema */ },
  "examples": [ /* Array of examples */ ],
  "schemaName": "invoice"
}
→ Response: { schemaId: "uuid", fieldsCount: 12, examplesCount: 3 }

# 2. Regeln generieren
POST /api/schema/{schemaId}/generate-rules
{
  "aggressiveness": 0.7,           # 0.3-1.0 (höher = mehr Patterns)
  "customKeywords": ["invoice", "total"]
}
→ Response: { rules: [...], stats: { averageConfidence: 0.87, warnings: [...] } }

# 3. Metadaten abrufen
GET /api/schema/{schemaId}
→ Response: { fieldsCount: 12, examplesCount: 3, hasGeneratedRules: true }

# 4. Regeln abrufen
GET /api/schema/{schemaId}/rules
→ Response: { rules: [...], stats: {...} }

# 5. Schema löschen
DELETE /api/schema/{schemaId}
```

### Generierte Regel-Beispiele

| Feld | Confidence | Methode | Beschreibung |
|------|-----------|---------|-------------|
| `invoiceNumber` | 0.98 | Pattern Match | Erkennt `INV-XXXXXX` Format |
| `totalAmount` | 0.92 | Value Extraction | Findet numerische Werte mit EUR/€ Suffix |
| `items[]` | 0.89 | Array Detection | Erkennt wiederholte Strukturen |
| `vendor.name` | 0.87 | Context Match | Nach Keywords wie "von:", "vendor:" |
| `invoiceDate` | 0.95 | Format Match | Matched ISO Dateien `YYYY-MM-DD` |
| `taxAmount` | 0.82 | Calculation | Berechnet aus Subtotal × TaxRate |

### React Frontend Component

**Komponente**: `frontend/src/components/SchemaUploadWizard.tsx`

**5-Step Workflow**:
1. ✅ Schema hochladen (JSON Datei)
2. ✅ Beispiele hochladen (Multiple Files)
3. ✅ Vorschau (Daten-Überblick)
4. ✅ Einstellungen (Aggressiveness + Keywords)
5. ✅ Regeln generieren (Automatic!)

**Features**:
- Drag-and-drop Datei-Upload
- JSON Validierung mit Error-Handling
- Progress-Indikatoren
- Detaillierte Statistiken
- Material-UI Design

### Technische Architektur

```typescript
// Schicht 1: Analyse
SchemaAnalyzer
  ↓ (parsed schema fields)
ExampleAnalyzer
  ↓ (field characteristics)
RuleGenerator
  ↓ (confidence-scored rules)
REST API (/api/schema/*)
  ↓
Frontend (SchemaUploadWizard)
```

**Services**:
- `SchemaAnalyzer`: Parsed JSON Schema Draft-07 → SchemaField[]
- `ExampleAnalyzer`: Analyzed examples → Characteristics
- `RuleGenerator`: Schema + Characteristics → Rules mit Confidence

**Storage** (Phase 15):
- In-Memory Map (schnell, MVP-gerecht)
- Phase 16: PostgreSQL Persistierung geplant

### Praktisches Beispiel: Rechnungen

**Datei**: `examples/schemas/invoice-*.json`

```json
{
  "invoiceNumber": "INV-202601",
  "invoiceDate": "2026-01-15",
  "totalAmount": 2379.94,
  "items": [
    {
      "description": "Server-Lizenzen",
      "quantity": 5,
      "unitPrice": 299.99
    }
  ]
}
```

**Generierte Regeln** (Beispiel):
```json
[
  { "field": "invoiceNumber", "pattern": "^INV-\\d{6}$", "confidence": 0.98 },
  { "field": "totalAmount", "keyword": "total", "confidence": 0.92 },
  { "field": "items[]", "method": "array_detection", "confidence": 0.89 }
]
```

### Readiness Checklist

```
✅ Implementation: 5 API Endpoints, DI Registration, Frontend Component
✅ Testing: 0 TypeScript Errors, All Builds Pass
✅ Documentation: 1500+ Zeilen über 6 Dateien
✅ Example: Invoice-Schema mit 3 Beispieldateien
✅ Production Ready: Deployment in Phase 16 ready
```

### Was kommt in Phase 16?

🔜 **PostgreSQL Persistierung**  
🔜 **Schema Manager UI** (Liste & Auswahl)  
🔜 **Multi-User Support**  
🔜 **Schema Versioning**  
🔜 **Rule Export/Import**

📖 **Detaillierte Roadmap**: [PHASE15_SCHEMA_MANAGEMENT.md](PHASE15_SCHEMA_MANAGEMENT.md#phase-16-geplant)

---

## 🎯 Kernprinzipien

### 1. **Keine Halluzinationen**
- Jeder extrahierte Wert muss eine Quelle haben
- Low-Confidence-Werte werden automatisch auf `null` gesetzt
- Erfundene oder geschätzte Werte sind nicht erlaubt
- **Phase 15**: Automatische Regelvalidierung durch Confidence-Scores

### 2. **Vollständige Nachverfolgbarkeit**
- Jeder Wert kann auf eine exakte Position im Quelldokument zurückgeführt werden
- SHA256-Hashes für Dokumenten-Integrität
- Audit-Trail mit Zeitstempel für alle Operationen
- **Phase 15**: Alle generierten Regeln haben Quelle + Confidence

### 3. **Explizite Unsicherheit**
- Fehlende Felder werden dokumentiert
- Confidence-Scores für alle Werte (0-1)
- Warnings für problematische Ekstraktionen
- **Phase 15**: Regeln-Confidence transparent ausgewiesen

### 4. **Strenge Validierung**
- TypeScript strict mode
- Strongly typed Value Objects
- SOLID Principles durchgehend
- **Phase 15**: JSON Schema Validation auf alle Inputs

## 📁 Projektstruktur

```
.
├── src/
│   ├── domain/                           # Domain Logic (Pure)
│   │   ├── models/                       # Core entities
│   │   ├── validation/                   # ValidationService (AJV)
│   │   └── index.ts                      # Barrel exports
│   │
│   ├── application/                      # Use Cases & Services
│   │   ├── chunking/                     # ChunkingEngine (3 strategies)
│   │   ├── classification/               # DocumentClassifier (6 types)
│   │   └── extraction/                   # Future: LLMExtractor
│   │
│   ├── infrastructure/                   # I/O & Persistierung
│   │   ├── parsers/                      # ParserFramework (PDF/DOCX/HTML)
│   │   ├── repositories/                 # ExampleRepository
│   │   └── validation/                   # AJV setup
│   │
│   └── index.ts                          # Public API
│
├── tests/
│   ├── unit/                             # 330+ Unit Tests
│   │   ├── infrastructure/               # Parser, Repository tests
│   │   └── application/                  # Chunking, Classification tests
│   └── domain/                           # Validation tests
│
├── extraction-rules/
│   └── schemas/                          # JSON Schema files
│
├── docs/
│   ├── glossary.md                       # 20+ Fachbegriffe
│   └── README.md                         # Documentation index
│
│
├── tests/
│   └── unit/                      # Unit Tests
│       ├── ExtractionFieldName.test.ts
│       ├── ConfidenceScore.test.ts
│       └── ExtractionEngine.test.ts
│
├── extraction-rules/              # Rule Definitions
│   └── invoice.json                 # Beispiel: Invoice Rules
│
├── examples/
│   ├── source/                    # Beispiel-Dokumente
│   ├── expected-json/             # Erwartete Extraktionsergebnisse
│   └── expected-images/           # Referenz-Bilder
│
├── results/                       # Extraktionsergebnisse
├── learning/                      # Lern-Statistiken
│
├── tsconfig.json                  # TypeScript Config (strict mode)
├── jest.config.js                 # Test Config
└── package.json
```

## 🚀 Verwendung

### Installation

```bash
npm install
npm run build
npm run test
```

### Beispiel: Rechnungs-Extraktion

```typescript
import {
  ExtractionEngine,
  ExtractionResultBuilder,
  ResultRepository,
  RuleSetRepository,
  AuditReportGenerator
} from './src/index';

// 1. Regeln laden
const ruleRepo = new RuleSetRepository('./extraction-rules');
const rules = ruleRepo.loadRuleSet('invoice');

// 2. Engine initialisieren
const engine = new ExtractionEngine(rules);

// 3. Wert extrahieren (MIT Quelle!)
const invoiceNumber = engine.extract(
  'invoiceNumber',
  'INV-2024-001',
  [{
    documentReference: {
      documentId: 'invoice-123',
      fileName: 'invoice.pdf',
      documentType: 'pdf',
      hash: 'sha256....',
      uploadedAt: new Date()
    },
    pageNumber: 1,
    textSnippet: 'Invoice Number: INV-2024-001'
  }],
  0.99  // 99% Sicherheit - direkt im Text gefunden
);

// 4. Ergebnis zusammenbauen
const result = new ExtractionResultBuilder()
  .withResultId('result-001')
  .withDocument(documentRef)
  .addExtractedField('invoiceNumber', invoiceNumber)
  .build();

// 5. Speichern
const resultRepo = new ResultRepository('./results');
resultRepo.save(result);

// 6. Bericht generieren
const reporter = new AuditReportGenerator();
console.log(reporter.generateMarkdown(result));

// 7. Audit-Trail abrufen
console.log(engine.getAuditTrail());
```

## 🔍 Sicherheitsmechanismen

### 1. ExtractionFieldName - Strongly Typed

```typescript
// ✅ OK
new ExtractionFieldName('invoiceNumber');

// ❌ Error: Invalid identifier
new ExtractionFieldName('invoice-number');
```

### 2. ConfidenceScore - Validated Range

```typescript
// ✅ 0-1 range enforced
new ConfidenceScore(0.95);

// ❌ Error
new ConfidenceScore(1.5);
```

### 3. Automatic Low-Confidence Filtering

```typescript
const extracted = {
  value: 'Maybe this',
  confidence: 0.45,  // < 0.8
  sources: []
};

// Automatisch auf null gesetzt!
const filtered = engine.applyConfidenceFilter(extracted, 0.8);
console.log(filtered.value);  // null
```

### 4. No Hallucination Validation

```typescript
import { validateNoHallucination } from '@domain/ExtractionRule';

const value = {
  value: 'Some text',
  confidence: 0.99,
  sources: [] // ❌ Keine Quelle = Halluzination!
};

if (!validateNoHallucination(value)) {
  throw new Error('Hallucination detected!');
}
```

## 📊 Learning-Komponente

**WICHTIG**: Die Learning-Komponente darf NIEMALS Daten generieren oder Werte erfinden!

```typescript
import { LearningComponent } from '@application/LearningComponent';

const learning = new LearningComponent();

// ✅ OK: Erfolgreiche Extraktion tracken
learning.recordSuccessfulExtraction(
  'invoice-header-pattern',
  'document-123',
  0.98
);

// ✅ OK: Fehlerhafte Extraktion tracken
learning.recordFailedExtraction(
  'date-pattern',
  'format_mismatch'
);

// ✅ OK: Optimierungsempfehlungen
const suggestions = learning.getOptimizationSuggestions();
// Gibt: ["Pattern 'X' has low success rate 0.45 - review rule"]

// ❌ NIEMALS: Werte ergänzen
// ❌ NIEMALS: Dokumente vervollständigen
// ❌ NIEMALS: Neue Fakten generieren
```

## 🧪 Tests

```bash
# Unit Tests ausführen
npm run test

# Watch Mode
npm run test:watch

# Coverage Report
npm run test:coverage
```

### Beispiel-Test

```typescript
describe('ExtractionEngine', () => {
  it('should apply confidence filter', () => {
    const engine = new ExtractionEngine(rules);
    
    const extracted = {
      value: 'Low confidence value',
      confidence: 0.5,
      sources: [],
      extractedAt: new Date()
    };

    const filtered = engine.applyConfidenceFilter(extracted, 0.8);
    
    expect(filtered.value).toBeNull();
    expect(filtered.uncertainty).toContain('0.8');
  });
});
```

## 📋 Extraktions-Regeln

Regeln definieren **WAS** extrahiert werden soll, liefern aber **KEINE** Informationen.

```json
{
  "ruleId": "invoice-rule-001",
  "fieldName": "invoiceNumber",
  "description": "Eindeutige Rechnungsnummer",
  "fieldType": "string",
  "isRequired": true,
  "constraints": {
    "minLength": 1,
    "maxLength": 50,
    "pattern": "^[A-Z0-9-]+$"
  },
  "documentTypes": ["pdf"]
}
```

## 🔐 Audit-Trail

Jeden Schritt nachverfolgen:

```typescript
const trail = engine.getAuditTrail();

/* Output:
[
  {
    timestamp: 2024-01-15T10:35:00Z,
    action: 'extract',
    field: 'invoiceNumber',
    result: 'success',
    details: { confidence: 0.99, sourcesCount: 1 }
  },
  {
    timestamp: 2024-01-15T10:35:01Z,
    action: 'validate',
    field: 'invoiceNumber',
    result: 'success',
    details: { errors: [] }
  }
]
*/
```

## 📊 Berichterstattung

```typescript
const reporter = new AuditReportGenerator();

// Markdown Report
console.log(reporter.generateMarkdown(result));

// CSV für Tabellen-Import
const csv = reporter.generateCSV(resultArray);

// JSON für APIs
const json = reporter.generateJSON(result);
```

## ⚠️ Anti-Patterns - NICHT ERLAUBT

```typescript
// ❌ FALSCH: Erfundene Werte
const hallucination = {
  value: 'Meyer GmbH',
  sources: [] // Keine Quelle!
};

// ❌ FALSCH: Geschätzte Werte
const estimated = {
  value: calculateEstimatedValue(),
  confidence: 0.5
};

// ❌ FALSCH: Learning zum Ergänzen verwenden
learning.patterns.set('customerName', 'Unknown Company');

// ❌ FALSCH: Implizite Annahmen
const assumption = {
  value: document.customerType ?? 'PRIVATE' // Erfunden!
};
```

## ✅ Best Practices

### 1. Immer Quellen angeben

```typescript
// ✅ RICHTIG
engine.extract(
  'amount',
  1500.00,
  [{
    documentReference: doc,
    pageNumber: 1,
    sectionId: 'summary',
    textSnippet: 'Total: 1500.00',
    offsetStart: 1245,
    offsetEnd: 1253
  }],
  0.99
);
```

### 2. Confidence realistisch setzen

```typescript
// Exakt im Dokument gefunden
engine.extract(field, value, sources, 1.0);

// Sehr wahrscheinlich
engine.extract(field, value, sources, 0.95);

// Wahrscheinlich, aber nicht sicher
engine.extract(field, value, sources, 0.75);

// Zu unsicher - wird gefiltert
engine.extract(field, value, sources, 0.45);
```

### 3. Warnings ernst nehmen

```typescript
const warnings = engine.generateWarnings(extracted, rules);

for (const warning of warnings) {
  if (warning.level === 'error') {
    // Extraktionsergebnis ist ungültig
    throw new Error(`Extraction failed: ${warning.message}`);
  }
  if (warning.level === 'warning') {
    // Ergebnis ist da, aber fragwürdig
    logger.warn(warning.message, warning.suggestion);
  }
}
```

### 4. Audit-Trail exportieren

```typescript
const auditJson = engine.getAuditJSON();
fs.writeFileSync('audit-trail.json', JSON.stringify(auditJson, null, 2));

// Für Revisions-Anforderungen
console.log(`Dokumentieren Sie: ${result.documentReference.hash}`);
```

## 🏗️ Architektur-Prinzipien

### Clean Architecture
- **Domain Layer**: Business Rules (unabhängig von Frameworks)
- **Application Layer**: Use Cases & Services
- **Infrastructure Layer**: Daten-Zugriff & I/O
- **Presentation Layer**: API & Reporting

### SOLID
- **S**ingle Responsibility: Jede Klasse hat eine Verantwortung
- **O**pen/Closed: Offen für Erweiterung, geschlossen für Änderung
- **L**iskov Substitution: Subtypes sind austauschbar
- **I**nterface Segregation: Kleine, spezifische Interfaces
- **D**ependency Inversion: Abhängig von Abstraktion, nicht Implementierung

### Dependency Injection
```typescript
constructor(
  private readonly engine: ExtractionEngine,
  private readonly ruleRepo: RuleSetRepository,
  private readonly resultRepo: ResultRepository
) {}
```

## 📚 Referenzen

- System Prompt: [systemprompt.md](docs/systemprompt.md)
- Beispiel-Regeln: [extraction-rules/invoice.json](extraction-rules/invoice.json)
- Beispiel-Ergebnis: [examples/expected-json/invoice-example-result.json](examples/expected-json/invoice-example-result.json)

## 🤝 Contribution Guidelines

1. Tests schreiben BEVOR Sie ändern
2. TypeScript strict mode einhalten
3. Keine Halluzinationen in Lern-Komponenten
4. Audit-Trail für alle Änderungen dokumentieren
5. Code-Review erforderlich

## 📄 Lizenz

MIT

---

**Wichtigste Erinnerung**: Dieses System wurde gebaut, um Halluzinationen zu VERHINDERN, nicht zu ermöglichen. Jeder Wert muss beweisbar sein.
