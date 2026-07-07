# src/domain/

Domain Layer - Business Logic & Policy Enforcement.

## Verzeichnisstruktur

```
src/domain/
├── HallucinationValidator.ts      # Policy-Engine (System Prompt Rules 1-10)
├── ExtractionRule.ts              # Domain-spezifische Validierung
├── ExtractionModels.ts            # Domain-Modelle
├── ExtractionFieldName.ts         # Feld-Name Typ
├── ConfidenceScore.ts             # Confidence-Typ
└── index.ts
```

## Policy-Engine: HallucinationValidator

Zentrale Komponente für **System Prompt Enforcement**.

### 10 Regeln (System Prompt)

| Regel | Beschreibung | Implementation |
|-------|-------------|-----------------|
| **1** | Keine Halluzinationen | `validateNoHallucinations()` - Low confidence ohne Sources = ERROR |
| **2** | Nachweisbarkeit | `checkTraceability()` - Jeder Wert braucht SourceReference |
| **3** | Unsicherheit | `checkUncertaintyHandling()` - Confidence + Uncertainty dokumentiert |
| **4** | Lernsystem (kein data gen) | Reflection nur statistisch, nicht datengenerierend |
| **5** | Regeln nur Struktur | RuleLoader lädt keine Daten |
| **6** | Fehlende Felder gemeldet | `checkMissingFieldsReported()` - missingFields[] muss existieren |
| **7** | Bilder nur referenziert | DocumentImage hat nur Metadaten, keine Beschreibungen |
| **8** | JSON-Ausgabe vollständig | `checkOutputCompleteness()` - confidence + sources + validation |
| **9** | Reflexion korrekt | Reflection nur Vollständigkeit/Konsistenz/Nachweisbarkeit |
| **10** | Priorität: Dokument > Regel > Lernhistorie | Dokumentinhalt als Wahrheit |

### API

```typescript
import { HallucinationValidator } from '@domain';

const validator = new HallucinationValidator();

// Einzelnes Feld prüfen
const field: ExtractedField = { ... };
const violations = validator.validateExtractedField(field, 'invoiceNumber');

// Gesamtes Result prüfen
const result: ExtractionResult = { ... };
const report = validator.validateExtractionResult(result);

// Report formatieren
console.log(validator.formatReport(report));
```

### Fehlerbehandlung

```typescript
import { PolicyViolationError } from '@domain';

try {
  const report = validator.validateExtractionResult(result);
  
  if (!report.passed) {
    for (const violation of report.violations) {
      console.error(`Rule #${violation.rule}: ${violation.message}`);
      console.error(`  ${violation.details}`);
    }
  }
} catch (error) {
  if (error instanceof PolicyViolationError) {
    // Handle policy violation
  }
}
```

### Kritische Policies

#### 1️⃣ Keine Halluzinationen
```typescript
// ❌ FALSCH: Low Confidence + No Sources
{
  value: "Unknown Customer",
  confidence: 0.3,
  sources: []  // ← HALLUCINATION!
}

// ✅ RICHTIG: High Confidence + Sources
{
  value: "Acme Corp",
  confidence: 0.98,
  sources: [{
    chunkId: "chunk-1",
    textSnippet: "Customer: Acme Corp"
  }]
}
```

#### 2️⃣ Nachweisbarkeit
```typescript
// ❌ FALSCH: Keine Quellen
sources: []

// ✅ RICHTIG: Mit Quellen-Details
sources: [{
  chunkId: "chunk-1",
  textSnippet: "Invoice Number: INV-2024-001",
  offsetStart: 0,
  offsetEnd: 25,
  pageNumber: 1
}]
```

#### 3️⃣ Unsicherheit
```typescript
// ❌ FALSCH: Low Confidence ohne Uncertainty
{
  confidence: 0.3,
  uncertainty: undefined
}

// ✅ RICHTIG: Uncertainty erklärt
{
  confidence: 0.3,
  uncertainty: "Text partially obscured in document"
}
```

#### 6️⃣ Fehlende Felder
```typescript
// ❌ FALSCH: Keine Fehlermeldung
{
  extractedFields: { invoiceNumber: "INV-2024-001" },
  missingFields: []  // ← Where's the customer name?
}

// ✅ RICHTIG: Explizit gemeldet
{
  extractedFields: { invoiceNumber: "INV-2024-001" },
  missingFields: ["customerName", "dueDate"]
}
```

## Integration mit Extraction Engine

```typescript
import { HallucinationValidator } from '@domain';
import { ExtractionEngine } from '@application';

async function extractWithValidation(doc: Document) {
  const engine = new ExtractionEngine();
  const result = await engine.extract(doc);
  
  // Validiere gegen alle 10 Regeln
  const validator = new HallucinationValidator();
  const report = validator.validateExtractionResult(result);
  
  if (!report.passed) {
    throw new Error(`Policy violations: ${report.violations.length}`);
  }
  
  return result;
}
```

## Tests

Unit Tests in `tests/unit/domain/HallucinationValidator.test.ts`:

```bash
npm run test:unit -- HallucinationValidator
```

Abdeckung:
- ✅ Valid fields mit Sources + Confidence
- ✅ Low confidence ohne Sources (Hallucination detection)
- ✅ Missing fields reporting
- ✅ Invalid confidence values
- ✅ Source validation (chunkId, textSnippet)
- ✅ No data generation enforcement

---

**Letzte Aktualisierung**: 2026-07-05
