# src/application/classification/

Intelligente Dokumenten-Klassifikation.

## DocumentClassifier

Klassifiziert Dokumente in: Invoice, Contract, Resume, Email, Report, Unknown

### Features

- ✅ Pattern-basierte Klassifikation (keine ML-Modelle)
- ✅ Explizite Unsicherheit dokumentiert
- ✅ **Confidence NEVER reaches 100%** (max 99%)
- ✅ Alternative Klassifikationen
- ✅ Reasoning + Indicators

### Unterstützte Typen

| Typ | Indikatoren | Confidence Range |
|-----|------------|-----------------|
| **INVOICE** | Invoice #, Total, Date, Line Items | 0.4-0.99 |
| **CONTRACT** | Party, Agreement, Terms, Liability | 0.3-0.99 |
| **RESUME** | Experience, Education, Skills | 0.4-0.99 |
| **EMAIL** | From/To/Subject, Email Address, Salutation | 0.4-0.99 |
| **REPORT** | Report, Analysis, Conclusion, Findings | 0.3-0.99 |
| **UNKNOWN** | No clear indicators | 0.1-0.5 |

## Verwendung

```typescript
import { FeatureBasedClassifier } from '@application/classification';

const classifier = new FeatureBasedClassifier();

// Lade Document von Parser
const document = await parser.parse(fileBuffer, 'file.pdf');

// Klassifiziere
const result = await classifier.classify(document);

// Result:
{
  documentType: "invoice",
  confidence: 0.87,                    // NEVER 1.0!
  alternativeTypes: [
    { type: "report", confidence: 0.45 }
  ],
  reasoning: "Classified as invoice based on detected indicators: contains 'Invoice Number', contains 'amount/total field'",
  uncertainty: null,                   // Null für High Confidence (>0.80)
  indicators: {
    matched: ["contains 'Invoice Number'", "contains amount/total"],
    missing: ["no due date found"]
  },
  classifiedAt: Date
}
```

## ClassificationResult

```typescript
interface ClassificationResult {
  documentType: DocumentTypeEnum;      // invoice, contract, resume, email, report, unknown
  confidence: number;                  // 0.0 - 0.99 (NEVER 1.0!)
  alternativeTypes?: Array<{
    type: DocumentTypeEnum;
    confidence: number;
  }>;
  reasoning: string;                   // Warum diese Klassifikation?
  uncertainty: string | null;          // Explizite Unsicherheit
  indicators: {
    matched: string[];                 // Z.B. ["contains 'Invoice Number'"]
    missing: string[];                 // Z.B. ["no date found"]
  };
  classifiedAt: Date;
}
```

## Kritisch: Confidence Constraint

### ❌ FALSCH

```typescript
// Confidence = 1.0 ist VERBOTEN!
{ confidence: 1.0 }

// Keine Unsicherheit dokumentiert
{ uncertainty: null, confidence: 0.95 }

// Keine Alternativen bei ambiguen Dokumenten
{ alternativeTypes: [] }
```

### ✅ RICHTIG

```typescript
// Max 99% Confidence
{ confidence: 0.97 }

// Unsicherheit bei >80% dokumentiert
{ confidence: 0.85, uncertainty: "Moderate confidence - alternatives possible" }

// Alternativen bei ambiguen Dokumenten
{
  documentType: "invoice",
  confidence: 0.65,
  alternativeTypes: [
    { type: "report", confidence: 0.58 }
  ],
  uncertainty: "Low confidence - document may belong to multiple categories"
}
```

## Unsicherheits-Levels

| Confidence | Unsicherheit | Bedeutung |
|-----------|-------------|----------|
| > 0.80 | `null` | Konfident, akzeptiert |
| 0.60-0.80 | "Moderate confidence..." | Mittel, Alternativen möglich |
| 0.40-0.60 | "Low confidence..." | Niedrig, ambigues Dokument |
| < 0.40 | "Very low confidence..." | Sehr niedrig oder UNKNOWN |

## Indikatoren-Matching

Jede Klassifikation zeigt:
- **matched**: Welche Indikatoren gefunden wurden
- **missing**: Welche erwartet, aber nicht gefunden

Beispiel:
```typescript
{
  indicators: {
    matched: [
      "contains 'Invoice Number'",
      "contains amount/total field",
      "contains date and due date"
    ],
    missing: [
      "no customer address found"
    ]
  }
}
```

## Architektur

```
Document
    ↓
FeatureBasedClassifier.classify()
    ├─ scoreInvoice()
    ├─ scoreContract()
    ├─ scoreResume()
    ├─ scoreEmail()
    ├─ scoreReport()
    ↓
    [Max score clamped to 0.99]
    ↓
ClassificationResult
(with confidence, reasoning, uncertainty)
```

## Tests

```bash
npm run test:unit -- DocumentClassifier

# Spezifische Tests
npm run test:unit -- "Confidence Constraint"
npm run test:unit -- "Alternative Types"
```

**Abdeckung:**
- ✅ Alle 6 Dokumenttypen
- ✅ Ambiguu Dokumente
- ✅ Confidence Constraint (Never 1.0)
- ✅ Unsicherheits-Dokumentation
- ✅ Alternative Classifications

## Next Steps

- [ ] Pattern Learning aus ExampleRepository
- [ ] OCR-optimierte Feature-Extraction
- [ ] Multilingual Support
- [ ] Custom Type Registration
- [ ] Confidence Threshold Configuration

---

**Letzte Aktualisierung**: 2026-07-05
