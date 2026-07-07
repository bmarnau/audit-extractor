# Quick Start - Audit-Safe Document Extractor (v0.13.0)

## 📦 Installation & Startup

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install
npm run build
npm run test
npm run dev      # Startet Server auf Port 3000
```

Server läuft auf: http://localhost:3000
API Health Check: http://localhost:3000/health

## 🎯 Erste Extraktion

```typescript
import {
  ExtractionEngine,
  ExtractionResultBuilder,
  ResultRepository
} from './src/index';

// 1. Engine mit Regeln erstellen
const rules = [
  {
    ruleId: 'test-1',
    fieldName: new ExtractionFieldName('amount'),
    description: 'Betrag',
    fieldType: 'number',
    isRequired: true,
    documentTypes: ['pdf']
  }
];

const engine = new ExtractionEngine(rules);

// 2. Wert extrahieren (MUSS Quelle haben!)
const result = engine.extract(
  'amount',
  1500.00,
  [{
    documentReference: {
      documentId: 'inv-001',
      fileName: 'invoice.pdf',
      documentType: 'pdf',
      hash: 'abc123...',
      uploadedAt: new Date()
    },
    pageNumber: 1,
    textSnippet: 'Total: EUR 1500.00'
  }],
  0.95
);

// 3. Ergebnis speichern
const repo = new ResultRepository('./results');
repo.save(result);

// 4. Audit-Trail ansehen
console.log(engine.getAuditTrail());
```

## 🌐 REST API (v0.13.0)

### Configuration Management

```bash
# Get current configuration
curl http://localhost:3000/api/config

# Update configuration
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"updates": {"configVersion": "2"}}'

# Get configuration history
curl http://localhost:3000/api/config/changes
```

### Backup Management

```bash
# List backups
curl http://localhost:3000/api/backup/list

# Create backup
curl -X POST http://localhost:3000/api/backup/create \
  -H "Content-Type: application/json" \
  -d '{"backupName": "full-backup", "reason": "Daily backup"}'
```

### Audit & Logs

```bash
# Get audit trail for document
curl http://localhost:3000/api/audit/doc123

# Get logs with filtering
curl http://localhost:3000/api/logs?limit=50&level=info

# Search help/glossary
curl http://localhost:3000/api/help/search?query=extraction
```

### API Response Format

Alle Responses folgen diesem Format:
```json
{
  "data": { /* payload */ },
  "timestamp": "2026-07-06T13:38:09.800Z",
  "path": "/api/config",
  "duration": 1
}
```

## 🏗️ Dateistruktur

| Pfad | Zweck |
|------|-------|
| `src/domain/` | Value Objects, Validierung |
| `src/application/` | ExtractionEngine, Services |
| `src/infrastructure/` | Repositories, I/O |
| `src/presentation/` | Report Generation |
| `extraction-rules/` | Rule Definitions (JSON) |
| `examples/` | Beispiele + erwartete Ergebnisse |
| `results/` | Extraktions-Ergebnisse |
| `tests/unit/` | Unit Tests |

## ⚡ Wichtigste Commands

```bash
npm run build      # TypeScript compilieren
npm run test       # Unit Tests ausführen
npm run test:watch # Watch Mode
npm run test:coverage # Coverage Report
npm run lint       # ESLint
npm run format     # Prettier
npm run dev        # Entwicklungs-Mode
```

## 🔒 Halluzinations-Verhinderung

```typescript
// ❌ FALSCH - Keine Quelle
engine.extract('field', 'value', [], 1.0);

// ❌ FALSCH - Zu unsicher
engine.extract('field', 'value', sources, 0.45);

// ✅ RICHTIG
engine.extract('field', 'value', sources, 0.95);
```

## 📊 Extraktionsergebnis

```typescript
ExtractionResult {
  resultId: 'result-001',
  documentReference: { ... },
  extractedFields: Map {
    'invoiceNumber' → ExtractedValue,
    'amount' → ExtractedValue
  },
  missingFields: ['dueDate'],
  warnings: [
    { field: 'dueDate', level: 'info', message: '...' }
  ],
  extractedAt: Date,
  version: '1.0.0',
  ruleSetVersion: '1.0.0'
}
```

## 🧪 Tests schreiben

```typescript
import { ExtractionEngine } from '@application/ExtractionEngine';

describe('MyExtraction', () => {
  it('should extract invoice number', () => {
    const engine = new ExtractionEngine(rules);
    
    const result = engine.extract(
      'invoiceNumber',
      'INV-2024-001',
      [{ documentReference, textSnippet: '...' }],
      0.99
    );

    expect(result.value).toBe('INV-2024-001');
    expect(result.confidence).toBe(0.99);
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
```

## 📋 Extraktions-Regeln

Erstelle `extraction-rules/my-rule.json`:

```json
[
  {
    "ruleId": "rule-001",
    "fieldName": "fieldName",
    "description": "Beschreibung",
    "fieldType": "string",
    "isRequired": true,
    "constraints": {
      "minLength": 1,
      "maxLength": 100
    },
    "documentTypes": ["pdf"]
  }
]
```

## 🎯 Design-Prinzipien

1. **Keine Halluzinationen**: Jeder Wert braucht eine Quelle
2. **Vertrauenswürdig**: Audit-Trail für alle Operationen
3. **Transparent**: Unsicherheit explizit dokumentiert
4. **Streng**: TypeScript strict mode, SOLID Principles
5. **Testbar**: 80%+ Code Coverage angestrebt

## 📚 Weitere Dokumentation

- [README.md](../README.md) - Umfassendes Manual
- [ARCHITECTURE.md](ARCHITECTURE.md) - System-Architektur
- [systemprompt.md](systemprompt.md) - AI System Prompt

---

**Starte mit**: `npm install && npm run build && npm run test`
