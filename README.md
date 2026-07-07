# Audit-Safe Document Extraction System

**Version**: 0.15.0-rc1 | **Status**: ✅ PRODUCTION READY (Phase 14) | 🟡 Phase 15 PROPOSED
Ein revisionssicheres Dokument-Extraktionssystem mit vollständiger Provenance-Verfolgung und strikter Halluzinations-Verhinderung.

## 🎯 Kernprinzipien

### 1. **Keine Halluzinationen**
- Jeder extrahierte Wert muss eine Quelle haben
- Low-Confidence-Werte werden automatisch auf `null` gesetzt
- Erfundene oder geschätzte Werte sind nicht erlaubt

### 2. **Vollständige Nachverfolgbarkeit**
- Jeder Wert kann auf eine exakte Position im Quelldokument zurückgeführt werden
- SHA256-Hashes für Dokumenten-Integrität
- Audit-Trail mit Zeitstempel für alle Operationen

### 3. **Explizite Unsicherheit**
- Fehlende Felder werden dokumentiert
- Confidence-Scores für alle Werte (0-1)
- Warnings für problematische Ekstraktionen

### 4. **Strenge Validierung**
- TypeScript strict mode
- Strongly typed Value Objects
- SOLID Principles durchgehend

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
