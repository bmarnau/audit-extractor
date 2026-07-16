# 📖 Operationshandbuch - Version 0.22.0

**Version**: 0.22.0  
**Datum**: 2026-07-11  
**Status**: ✅ Produktionsreife  
**Phase**: 22 - Job Orchestration & Error Resilience  
**Zielgruppe**: Endanwender, Administratoren, DevOps, Entwickler

---

## 🎯 Überblick: Was ist neu in v0.35.0?

Version 0.22.0 führt **Job-basierte Orchestrierung mit umfassender Fehlerbehandlung** ein.

```
Phase 20 (0.20.0):  Log Viewer & Monitoring
Phase 21 (0.21.0):  Async Job Processing API
Phase 22 (0.22.0):  Job Orchestration & Error Resilience ← SIE SIND HIER
  ├─ JobOrchestrator Service
  ├─ 5-Stage Workflow
  ├─ Graceful Degradation
  ├─ Comprehensive Error Tracking
  └─ Debug Mode Support
```

### Wichtigste Neuerungen in Phase 22

| Feature | Status | Details |
|---------|--------|---------|
| **JobOrchestrator Service** | ✅ | 5-Stage Orchestrierung aller Jobs |
| **Error Resilience** | ✅ | Automatische Fehlerbehandlung pro Stage |
| **ExecutionReport** | ✅ | Vollständige Auditierung + Statistiken |
| **CLI Interface** | ✅ | `npm run job:execute JOB-ID` |
| **Debug Mode** | ✅ | `--debug` Flag für detailliertes Logging |
| **Graceful Degradation** | ✅ | Optional-Stages setzen nur Warnings |
| **Report Persistence** | ✅ | JSON Reports in `output/` Verzeichnis |
| **Integration Tests** | ✅ | 26/26 Tests PASSING |

---

## 🚀 Schnellstart (2 Minuten)

### Option 1: Direkte CLI-Ausführung

```bash
# Prerequisites
npm install      # Abhängigkeiten installieren
npm run build    # TypeScript kompilieren

# Job ausführen (Standard)
npm run job:execute JOB-0815

# Job ausführen (Mit Debug-Info)
npm run job:execute JOB-0815 --debug
```

**Ergebnis nach 100ms:**
```
✓ Job geladen
✓ Schema validiert
✓ Beispiele analysiert
✓ Quellen geprüft
✓ RuntimeJob erstellt

Bericht: output/JOB-0815-execution-report.json
```

### Option 2: Docker Stack (Empfohlen für Produktion)

```powershell
# Starten
.\start-docker.ps1

# Warten auf Container Start (45 Sekunden)
# Dann:
docker exec -it extractor-backend npm run job:execute JOB-0815
```

### Option 3: Backend-Service direkt (Debug)

```powershell
# Terminal 1: Backend
npm run start:backend

# Terminal 2: Job ausführen
npm run job:execute JOB-0815 --debug
```

---

## 📋 5-Stage Workflow

Jeder Job durchläuft folgendes Workflow:

### Stage 1: Job Laden
```
Eingabe:  data/jobs/JOB-ID/job.json
Output:   RuntimeJob Instanz mit Metadaten
Fehler:   JOB_NOT_FOUND, INVALID_JOB_STRUCTURE
```

**Example job.json:**
```json
{
  "jobId": "JOB-0815",
  "documentType": "invoice",
  "status": "queued",
  "createdAt": "2026-07-11T10:00:00Z",
  "sources": [
    {
      "sourceId": "src_invoice_001",
      "filePath": "data/jobs/JOB-0815/sources/invoice.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245632
    }
  ]
}
```

**Validierung:**
- ✅ jobId nicht leer
- ✅ documentType vorhanden
- ✅ sources Array nicht leer
- ✅ Alle Source-Felder vorhanden

---

### Stage 2: Schema Laden & Validieren
```
Eingabe:  data-backups/TIMESTAMP/schemas/SCHEMA-NAME.json
Output:   Validiertes JSON Schema
Fehler:   SCHEMA_NOT_FOUND, INVALID_SCHEMA, SCHEMA_COMPILATION_ERROR
```

**Example schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Invoice Schema",
  "properties": {
    "invoiceNumber": { "type": "string" },
    "invoiceDate": { "type": "string", "format": "date" },
    "vendor": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "taxId": { "type": "string" }
      }
    }
  },
  "required": ["invoiceNumber", "invoiceDate", "vendor"]
}
```

**Validierung:**
- ✅ $schema Header vorhanden (Draft-07)
- ✅ JSON ist gültig
- ✅ AJV Kompilierung erfolgreich
- ✅ Alle Required-Felder definiert

---

### Stage 3: Beispiele Analysieren ⭐ OPTIONAL
```
Eingabe:  data/examples/*.json
Output:   ExtractionHints (Field Patterns, Confidence Scores)
Fehler:   EXAMPLE_ANALYSIS_FAILED (nur Warning, nicht kritisch!)
```

**Verhalten:**
- ❌ Wenn Beispiele fehlen → **Warning**, nicht Error
- ❌ Wenn Analyse fehlschlägt → **Graceful Degradation**
- ✅ Workflow setzt sich fort (nicht blockierend)

**Details:**
- Zählt Beispiel-Dateien
- Analysiert Daten-Muster
- Generiert Field-Hinweise
- Berechnet Confidence Scores

---

### Stage 4: Quellen Validieren
```
Eingabe:  Job.sources (Metadaten)
Output:   Validierungsbericht pro Source
Fehler:   INVALID_MIME_TYPE, MISSING_SOURCE_FIELD, FILE_TOO_LARGE
```

**Validierung pro Source:**

```
✓ Feld-Struktur prüfen
  - sourceId vorhanden?
  - filePath vorhanden?
  - mimeType vorhanden?

✓ MIME-Type Format
  - Format: "type/subtype" (z.B. "application/pdf")
  - Nicht: "pdf" oder "PDF"

✓ Dateigröße
  - Max. 500 MB
  - Größer? → Warning aber nicht blockierend
```

**Gültiges Beispiel:**
```json
{
  "sourceId": "src_invoice_001",
  "filePath": "data/jobs/JOB-0815/sources/invoice.pdf",
  "mimeType": "application/pdf",    ✓ Korrekt
  "fileSize": 245632
}
```

**Ungültiges Beispiel:**
```json
{
  "sourceId": "src_invalid_002",
  "filePath": "data/jobs/JOB-0815/sources/doc.doc",
  "mimeType": "doc",                ❌ FEHLER: "application/msword" erwartet
  "fileSize": 512000
}
```

---

### Stage 5: RuntimeJob Erstellen
```
Eingabe:  Alle vorangegangenen Stage-Ergebnisse
Output:   Finale RuntimeJob Instanz (bereit für Pipeline)
Fehler:   RUNTIME_JOB_CREATION_FAILED
```

**Final RuntimeJob Struktur:**
```json
{
  "jobId": "JOB-0815",
  "documentType": "invoice",
  "status": "queued",
  "createdAt": "2026-07-11T10:00:00Z",
  "sources": [
    {
      "sourceId": "src_invoice_001",
      "filePath": "data/jobs/JOB-0815/sources/invoice.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245632
    }
  ],
  "schema": {
    "schemaId": "test-invoice-schema",
    "schemaVersion": "1.0.0"
  },
  "metadata": {
    "examplesAnalyzed": true,
    "exampleCount": 5,
    "totalFieldsInSchema": 4,
    "requiredFieldsInSchema": 4
  }
}
```

---

## 📊 ExecutionReport - Vollständige Auditierung

Nach jeder Ausführung wird ein Audit-Report generiert:

**File:** `output/JOB-0815-execution-report.json`

```json
{
  "jobId": "JOB-0815",
  "status": "SUCCESS",
  "completionPercentage": 100,
  "startTime": "2026-07-11T10:00:00.000Z",
  "endTime": "2026-07-11T10:00:00.088Z",
  "duration": 88,
  
  "result": {
    "jobLoaded": true,
    "schemaLoaded": true,
    "examplesAnalyzed": true,
    "sourcesValidated": true,
    "runtimeJobCreated": true
  },
  
  "validations": [
    {
      "name": "Job Loading",
      "status": "passed",
      "message": "Job JOB-0815 loaded successfully",
      "details": {
        "jobsPath": "data/jobs",
        "jobId": "JOB-0815",
        "loadTime": "16ms"
      }
    },
    {
      "name": "Schema Loading",
      "status": "passed",
      "message": "Schema test-invoice-schema loaded successfully",
      "details": {
        "schemasPath": "data-backups/20260710_155130/schemas",
        "schemaName": "test-invoice-schema",
        "schemaVersion": "1.0.0",
        "fieldsCount": 4,
        "loadTime": "70ms"
      }
    },
    {
      "name": "Example Analysis",
      "status": "passed",
      "message": "Analyzed examples successfully",
      "details": {
        "totalExamples": 5,
        "hintsGenerated": 8,
        "analysisTime": "4ms"
      }
    },
    {
      "name": "Source Validation",
      "status": "passed",
      "message": "All 1 source(s) validated successfully",
      "details": {
        "sourcesCount": 1,
        "allMimeTypesValid": true
      }
    },
    {
      "name": "RuntimeJob Creation",
      "status": "passed",
      "message": "RuntimeJob created successfully",
      "details": {
        "jobId": "JOB-0815",
        "createdAt": "2026-07-11T10:00:00.079Z"
      }
    }
  ],
  
  "warnings": [],
  "errors": [],
  
  "statistics": {
    "validationCount": 5,
    "passedValidations": 5,
    "failedValidations": 0,
    "warningCount": 0,
    "errorCount": 0,
    "jobLoadTime": 16,
    "schemaLoadTime": 70,
    "exampleAnalysisTime": 4,
    "sourceValidationTime": 0,
    "runtimeJobCreationTime": 0
  },
  
  "metadata": {
    "documentType": "invoice",
    "schemaName": "test-invoice-schema",
    "schemaVersion": "1.0.0",
    "sourceCount": 1,
    "schemaFieldCount": 4,
    "requiredFieldCount": 4,
    "exampleCount": 5
  }
}
```

### Report-Status Bedeutungen

| Status | Bedeutung | Aktion |
|--------|-----------|--------|
| **SUCCESS** | Alle Stages erfolgreich | ✓ Workflow kann fortgesetzt werden |
| **WARNING** | Optionale Stages fehlgeschlagen | ⚠️ Review Report, meist kein Blocker |
| **FAILED** | Kritische Stage fehlgeschlagen | ❌ Beheben Sie Fehler, wiederholen Sie |
| **PARTIAL** | Manche Stages erfolgreich | ⚠️ Abhängig von Stage-Kritikalität |

---

## 🔧 CLI Reference

### Basis-Syntax

```bash
npm run job:execute JOB-ID [--debug]
```

### Beispiele

```bash
# Standard Job-Ausführung
npm run job:execute JOB-0815
# Ergebnis: exit code 0 (success) oder 1 (failure)

# Mit Debug-Informationen
npm run job:execute JOB-0815 --debug
# Zusätzlich: Stack Traces, Detailed Error Objects, Service Logs

# Verschiedene Job-IDs
npm run job:execute JOB-0001
npm run job:execute JOB-ACME-INV-2024
npm run job:execute JOB-DOCUSNAP-001
```

### Exit Codes

```bash
0  →  ✓ SUCCESS (Report.status = SUCCESS)
1  →  ❌ FAILURE (Report.status = FAILED)
```

### Output-Format (Standard)

```
════════════════════════════════════════════════════════════════
⚙️  Job Orchestration: JOB-0815
════════════════════════════════════════════════════════════════

✓ Initializing services...
✓ Services initialized

📋 Paths:
   Jobs:     C:\...\data\jobs
   Schemas:  C:\...\data-backups\20260710_155130\schemas
   Examples: C:\...\data\examples
   Report:   C:\...\output\JOB-0815-execution-report.json

⚙️ Executing job orchestration...

════════════════════════════════════════════════════════════════
✓ Execution Complete
════════════════════════════════════════════════════════════════

📊 Summary:
   Status:              SUCCESS
   Completion:          100%
   Execution Time:      88ms
   Duration (Report):   79ms

✓ Results:
   ✓ Job loaded
   ✓ Schema loaded
   ✓ Examples analyzed
   ✓ Sources validated
   ✓ RuntimeJob created

📈 Statistics:
   Validations: 5/5 passed
   Errors:      0
   Warnings:    0

📋 Metadata:
   Document Type:    invoice
   Schema:           test-invoice-schema
   Schema Version:   1.0.0
   Sources:          1
   Schema Fields:    4 (4 required)

✅ Validations:
   ✓ Job Loading: Job JOB-0815 loaded successfully
   ✓ Schema Loading: Schema test-invoice-schema loaded successfully
   ✓ Example Analysis: Analyzed examples successfully
   ✓ Source Validation: All 1 source(s) validated successfully
   ✓ RuntimeJob Creation: RuntimeJob created successfully

📄 Report: C:\...\output\JOB-0815-execution-report.json

🔧 RuntimeJob:
   ID:       JOB-0815
   Status:   queued
   Type:     invoice
   Sources:  1
   Schema:   test-invoice-schema

════════════════════════════════════════════════════════════════
```

### Output-Format (Mit --debug)

```
[Zusätzlich zur Standard-Output:]

🔧 [DEBUG] Paths configuration:
   jobsBasePath: C:\...\data\jobs
   schemasBasePath: C:\...\data-backups\20260710_155130\schemas
   examplesBasePath: C:\...\data\examples
   reportOutputPath: C:\...\output\JOB-0815-execution-report.json

🔧 [DEBUG] Stage: job-loading
   ServiceClass: JobLoaderService
   Method: loadJob(...)
   Duration: 16ms
   Result: RuntimeJob loaded

🔧 [DEBUG] Stage: schema-loading
   ServiceClass: SchemaLoaderService
   Method: loadAndValidateSchema(...)
   Duration: 70ms
   Result: Schema validated with AJV

[... weitere Debug-Details pro Stage ...]

Wenn Fehler auftreten:
⚠️ [DEBUG] Error Details:
   Message: SCHEMA_NOT_FOUND
   Code: SCHEMA_COMPILATION_ERROR
   Details: {...}
   Stack: [Full Stack Trace]
```

---

## 📁 Verzeichnisstruktur

### Job-Verzeichnis Structure

```
data/
└── jobs/
    ├── JOB-0001/
    │   ├── job.json                    ← Job-Konfiguration
    │   ├── sources/
    │   │   ├── invoice_001.pdf
    │   │   ├── invoice_002.pdf
    │   │   └── delivery_note.pdf
    │   ├── schema/
    │   │   └── invoice-v2.0.0.json     ← Schema (Alternative: via schemasBasePath)
    │   ├── examples/
    │   │   ├── example_001.json
    │   │   ├── example_002.json
    │   │   └── example_003.json
    │   └── output/                      ← Phase 23+ (Extraction Results)
    │       ├── extraction-results.json
    │       ├── field-confidence.json
    │       └── audit-trail.json
    │
    └── JOB-0815/
        ├── job.json
        ├── sources/
        │   └── invoice.pdf
        ├── examples/
        └── output/

```

### Schema-Verzeichnis Structure

```
data-backups/
└── 20260710_155130/
    └── schemas/
        ├── test-invoice-schema.json          ← Wird von SchemaLoaderService geladen
        ├── delivery-note-schema.json
        ├── purchase-order-schema.json
        └── contract-schema.json

```

### Output-Verzeichnis (Reports)

```
output/
├── JOB-0815-execution-report.json        ← Standard Report
├── JOB-0816-execution-report.json
├── JOB-0817-execution-report.json
└── ...
```

---

## ⚠️ Fehlerbehandlung

### Häufige Fehler und Lösungen

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| `JOB_NOT_FOUND` | `data/jobs/JOB-ID/job.json` nicht vorhanden | Struktur: `data/jobs/JOB-0815/job.json` |
| `INVALID_JOB_STRUCTURE` | job.json hat nicht alle Felder | Siehe Feld-Requirements oben |
| `SCHEMA_NOT_FOUND` | Schema nicht in `schemasBasePath` | Schema-Datei in `data-backups/DATE/schemas/` legen |
| `INVALID_SCHEMA` | JSON ist ungültig oder Draft-07 konform | Validieren mit JSON Schema Validator |
| `INVALID_MIME_TYPE` | Format wie "pdf" statt "application/pdf" | Korrektes Format: "type/subtype" |

### Beispiel: INVALID_MIME_TYPE beheben

**Fehler-Report:**
```json
{
  "code": "INVALID_MIME_TYPE",
  "message": "Source 'src_001' validation failed: invalid MIME type format: 'pdf'. Expected format: 'type/subtype'.",
  "stage": "source-validation"
}
```

**Lösung:**
```json
// Falsch:
"mimeType": "pdf"

// Richtig:
"mimeType": "application/pdf"   // PDF-Datei
"mimeType": "image/png"         // PNG-Bild
"mimeType": "text/plain"        // Text-Datei
"mimeType": "text/html"         // HTML-Datei
```

---

## 🔗 Phase 23 Roadmap: iReport Integration

Nach Phase 22 (aktuell) kommt Phase 23 mit iReport-Import-Integration:

```
Phase 22 Output (ExecutionReport)
    ↓
Phase 23 (Geplant):
  ├─ OCR + Field Extraction Pipeline
  ├─ Confidence Scoring
  ├─ Hallucination Detection
  ├─ Extraction Results Format
  └─ iReport Converter
    ↓
iReport Data Format (Phase 24):
  ├─ JSON Schema Mapping
  ├─ Silumius Integration
  ├─ Data Visualization
  └─ Reporting Dashboard
```

**Vorschau Phase 23 Output Format:**

```json
{
  "jobId": "JOB-0815",
  "documentType": "invoice",
  "extractedFields": {
    "invoiceNumber": {
      "value": "INV-2024-001234",
      "confidence": 0.98,
      "source": "OCR"
    },
    "totalAmount": {
      "value": 7140,
      "confidence": 0.99,
      "source": "OCR"
    }
  },
  "qualityMetrics": {
    "overallConfidence": 0.94,
    "hallucinationDetected": false,
    "validationPassed": true
  }
}
```

**iReport Import (Phase 24):**
- Automatische Feldmapping
- Datentyp-Konvertierung
- Duplikat-Erkennung
- Import-Dashboard mit Live-Progress

---

## 📞 Support & Weitere Ressourcen

- 📘 **README.md** - System Overview & Quick Links
- 📗 **MANUAL-0.21.0.md** - Vorgänger Manual (Phase 21)
- 📕 **MANUAL_TESTING_GUIDE_PHASE22.md** - Detaillierte Test-Szenarien (45+ Test Cases)
- 🔗 **API_REFERENCE.md** - REST API Endpoints (Phase 21)
- 🐳 **DOCKER_DEPLOYMENT_GUIDE.md** - Docker Deployment Details

---

**Dokumentation**: 11.7.2026 | **Status**: ✅ Production Ready
