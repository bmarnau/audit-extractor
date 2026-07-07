# src/infrastructure/repositories/

Repository Pattern für Test-Beispiele und Regressionstests.

## ExampleRepository

Verwaltet Test-Beispiele aus 3 Verzeichnissen:

```
examples/
├── source/
│   ├── invoice-001.pdf
│   ├── contract-001.docx
│   └── invoice-001-metadata.json
├── expected-json/
│   ├── invoice-001.json
│   └── contract-001.json
└── expected-images/
    ├── invoice-001/
    │   ├── image-0.json
    │   └── image-1.json
    └── contract-001/
        └── image-0.json
```

## API

### LoadExample

```typescript
const example = await repo.loadExample('invoice-001');

// Returns:
{
  metadata: {
    id: 'invoice-001',
    name: 'invoice-001',
    documentType: 'invoice',
    fileFormat: 'pdf',
    createdAt: Date,
    tags: ['pdf']
  },
  sourceDocument: {
    fileName: 'invoice-001.pdf',
    buffer: Buffer,
    path: 'examples/source/invoice-001.pdf'
  },
  expectedExtraction: {
    extractedFields: Map { 
      'invoiceNumber' => { value: 'INV-2024-001', confidence: 0.95, sources: [...] }
    },
    missingFields: [],
    warnings: []
  },
  expectedImages: [
    { id: 'image-0', pageNumber: 1, format: 'jpg', size: 1024, path: 'image-0' }
  ]
}
```

### LoadExpectedJson

```typescript
const expected = await repo.loadExpectedJson('invoice-001');
// Returns: ExtractionResult | null
// null falls keine expected-json/{id}.json existiert
```

### LoadExpectedImages

```typescript
const images = await repo.loadExpectedImages('invoice-001');
// Returns: ExampleImage[]
// [] falls examples/expected-images/{id}/ nicht existiert
```

### CompareResults

```typescript
const comparison = await repo.compareResults('invoice-001', actualResult);

// Returns:
{
  exampleId: 'invoice-001',
  documentFileName: 'invoice-001.pdf',
  passed: true,
  differences: [
    {
      field: 'invoiceNumber',
      actual: 'INV-2024-001',
      expected: 'INV-2024-001',
      type: 'value-mismatch',
      severity: 'error'
    }
  ],
  metrics: {
    fieldAccuracy: 0.95,
    confidenceDeviation: 0.01,
    sourcesMatched: 1.0,
    missingFieldsMatched: true
  }
}
```

## Verzeichnis-Struktur

### examples/source/

Quell-Dokumente in verschiedenen Formaten:

```
invoice-001.pdf          # Quell-Datei
invoice-001-metadata.json # Optional: Zusätzliche Metadaten
contract-001.docx
receipt-001.html
```

**Format:** `{exampleId}.{ext}` oder `{exampleId}-metadata.json`

**Metadaten-JSON Beispiel:**
```json
{
  "id": "invoice-001",
  "name": "Invoice Example 1",
  "description": "German invoice from 2024",
  "documentType": "invoice",
  "fileFormat": "pdf",
  "createdAt": "2024-01-15T10:00:00Z",
  "tags": ["pdf", "german", "invoice", "2024"]
}
```

### examples/expected-json/

Expected ExtractionResults (Regressions-Baselines):

```
invoice-001.json         # Expected result für invoice-001.pdf
contract-001.json
receipt-001.json
```

**Format:** ExtractionResult als JSON

```json
{
  "extractedFields": {
    "invoiceNumber": {
      "value": "INV-2024-001",
      "confidence": 0.95,
      "sources": [
        {
          "chunkId": "chunk-0",
          "textSnippet": "Invoice Number: INV-2024-001",
          "offsetStart": 45,
          "offsetEnd": 67,
          "pageNumber": 1
        }
      ],
      "uncertainty": null,
      "extractedAt": "2024-01-15T10:05:00Z"
    },
    "invoiceDate": {
      "value": "2024-01-15",
      "confidence": 0.92,
      "sources": [...]
    }
  },
  "missingFields": [],
  "warnings": [
    {
      "field": "customerAddress",
      "message": "Could not extract complete address"
    }
  ]
}
```

### examples/expected-images/

Expected Image-Metadaten:

```
invoice-001/
├── image-0.json
├── image-1.json
└── image-2.json
contract-001/
└── image-0.json
```

**Format:** ExampleImage als JSON

```json
{
  "id": "image-0",
  "pageNumber": 1,
  "format": "jpg",
  "size": 2048,
  "width": 800,
  "height": 600,
  "path": "invoice-001-page-1.jpg"
}
```

## Verwendung in Tests

### Unit Test

```typescript
import { FileSystemExampleRepository } from '@infrastructure/repositories';

describe('MyExtractor', () => {
  let repo: FileSystemExampleRepository;

  beforeEach(() => {
    repo = new FileSystemExampleRepository('examples');
  });

  it('should extract invoice correctly', async () => {
    // Lade Beispiel
    const example = await repo.loadExample('invoice-001');

    // Extrahiere
    const actual = await extractor.extract(example.sourceDocument.buffer);

    // Vergleiche
    const comparison = await repo.compareResults('invoice-001', actual);

    // Assert
    expect(comparison.passed).toBe(true);
    expect(comparison.metrics.fieldAccuracy).toBeGreaterThan(0.9);
  });
});
```

### Regression Test Suite

```typescript
describe('Regression Tests', () => {
  let repo: FileSystemExampleRepository;

  beforeEach(() => {
    repo = new FileSystemExampleRepository('examples');
  });

  it('should pass all regression tests', async () => {
    const examples = await repo.listExamples();

    for (const metadata of examples) {
      const example = await repo.loadExample(metadata.id);
      const actual = await extractor.extract(example.sourceDocument.buffer);
      const comparison = await repo.compareResults(metadata.id, actual);

      expect(comparison.passed).toBe(true);
    }
  });
});
```

## Kritisch: Keine Datengenerierung!

✅ RICHTIG:
- Nur echte Dateien laden
- Expected JSON `null` falls nicht vorhanden
- Expected Images leeres Array falls nicht vorhanden
- Metadaten aus Dateien laden oder generieren (aber keine erfundenen Felder)
- Keine Auto-filled Werte

❌ FALSCH:
- Expected JSON als `{}`
- Expected Images als `[{ id: 'placeholder' }]`
- Erfundene Source-Dokumente
- Auto-generierte Confidence-Werte

## Fehlerbehandlung

```typescript
import { ExampleNotFoundError, InvalidExampleError } from '@infrastructure/repositories';

try {
  const example = await repo.loadExample('unknown-001');
} catch (error) {
  if (error instanceof ExampleNotFoundError) {
    console.error(`Example not found: ${error.exampleId}`);
    console.error(`Missing component: ${error.component}`);
  }
}
```

## Vergleich-Metriken

| Metrik | Bedeutung | Wert |
|--------|-----------|------|
| fieldAccuracy | % korrekt extrahierter Felder | 0-1 |
| confidenceDeviation | Durchschn. Abweichung Confidence | 0-1 |
| sourcesMatched | % korrekt zugeordnete Sources | 0-1 |
| missingFieldsMatched | Wurden alle missingFields korrekt erkannt? | bool |

## Next Steps

- [ ] Batch-Regression Testing
- [ ] Performance Baseline Tracking
- [ ] Automated Example Generation
- [ ] Visual Regression for Images
- [ ] Continuous Regression Monitoring

---

**Letzte Aktualisierung**: 2026-07-05
