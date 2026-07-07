# src/domain/validation/

JSON Schema-basierte Validierung mit AJV.

## ValidationService

Validiert ExtractionResults gegen JSON Schemas.
Schemas aus `extraction-rules/schemas/`

### Features

- ✅ AJV-basierte Validierung
- ✅ Schema-Loading + Caching
- ✅ Required/Optional Field Detection
- ✅ Type Validation
- ✅ **Keine Daten-Generierung** (nur Validierung)
- ✅ missingFields Reporting

## Verwendung

```typescript
import { AjvValidationService } from '@domain/validation';

const service = new AjvValidationService('extraction-rules/schemas');

// Validiere ExtractionResult
const result = await extractor.extract(chunks);
const validation = await service.validate(result, 'invoice');

// Result:
{
  documentId: 'doc-123',
  documentType: 'invoice',
  isValid: true,              // Alle Errors = 0
  errors: [],
  warnings: [],
  missingFields: [],          // Fehlende Required Fields
  validatedAt: Date
}
```

## Schema-Struktur

`extraction-rules/schemas/invoice.schema.json`

```json
{
  "type": "object",
  "properties": {
    "invoiceNumber": { "type": "string" },
    "totalAmount": { "type": "number" },
    "dueDate": { "type": "string" },
    "customerName": { "type": "string" }
  },
  "required": ["invoiceNumber", "totalAmount"]
}
```

## ValidationResult

```typescript
interface ValidationResult {
  documentId: string;
  documentType: string;
  isValid: boolean;           // true wenn errors.length === 0
  errors: ValidationError[];  // Type mismatches, constraints violated
  warnings: ValidationError[]; // Required fields missing
  missingFields: string[];    // ["totalAmount", "dueDate"]
  validatedAt: Date;
}
```

## ValidationError

```typescript
interface ValidationError {
  field: string;              // "invoiceNumber" oder "root"
  message: string;            // "must be string"
  value: unknown;             // Tatsächlicher Wert
  schema?: Record<string, unknown>; // Relevantes Schema-Teil
}
```

## Kritisch: Keine Daten-Generierung!

### ❌ FALSCH

```typescript
// AJV mit useDefaults: true
{ useDefaults: true }

// Erfundene Felder hinzufügen
if (required && !extracted) {
  extracted[field] = null;  // NEIN!
}

// Default-Werte einfügen
validation.extracted.totalAmount = validation.extracted.totalAmount || 0; // NEIN!
```

### ✅ RICHTIG

```typescript
// AJV mit useDefaults: false (DEFAULT)
{ useDefaults: false }

// Nur berichten, nicht ergänzen
validation.missingFields = ['totalAmount', 'dueDate'];

// Keine Modifikation des Results
const beforeSize = result.extractedFields.size;
await service.validate(result, 'invoice');
expect(result.extractedFields.size).toBe(beforeSize); // Unchanged!
```

## Schema-Loading

```typescript
// Lade einzelnes Schema
const schemaInfo = await service.loadSchema('invoice');

// Result:
{
  documentType: 'invoice',
  schemaPath: 'extraction-rules/schemas/invoice.schema.json',
  schema: { ... },
  requiredFields: ['invoiceNumber', 'totalAmount'],
  optionalFields: ['dueDate', 'customerName']
}
```

## Supported Document Types

```typescript
const types = await service.getSupportedDocumentTypes();
// ["invoice", "contract", "resume", "email", "report"]
```

## Validierungs-Workflow

```
ExtractionResult
    ↓
loadSchema(documentType)
    ↓
AJV.compile()
    ↓
validator(data)
    ↓
Extract Errors + Warnings
    ↓
findMissingFields()
    ↓
ValidationResult
(with errors, warnings, missingFields)
```

## Error Handling

```typescript
import { ValidationServiceError } from '@domain/validation';

try {
  const validation = await service.validate(result, 'invoice');
} catch (error) {
  if (error instanceof ValidationServiceError) {
    console.error(`Validation error for ${error.documentType}`);
  }
}
```

## Performance

- **Schema Caching**: Schemas geladen + compiliert einmalig
- **Validator Caching**: Validatoren wiederverwendet
- **Batch Validation**: Mehrere Results parallel validieren

```typescript
// Parallel validieren
const validations = await Promise.all([
  service.validate(result1, 'invoice'),
  service.validate(result2, 'invoice'),
  service.validate(result3, 'contract'),
]);
```

## Tests

```bash
npm run test:unit -- ValidationService

# Spezifische Tests
npm run test:unit -- "No Data Generation"
npm run test:unit -- "detect missing required fields"
```

**Abdeckung:**
- ✅ Schema Loading
- ✅ Validierung (Type, Required, Optional)
- ✅ Missing Fields Detection
- ✅ Error/Warning Categorization
- ✅ No Data Generation Enforcement
- ✅ Caching

## Integration

### Mit ExtractionEngine

```typescript
const extraction = await extractionEngine.extract(chunks, rules);
const validation = await validationService.validate(extraction, documentType);

if (!validation.isValid) {
  // Handle errors
  console.log('Validation errors:', validation.errors);
}

if (validation.missingFields.length > 0) {
  // Report missing fields
  console.log('Missing:', validation.missingFields);
}
```

### Mit HallucinationValidator

```typescript
// Validierung + Halluzination Check
const validation = await validationService.validate(result, 'invoice');
const hallucination = await hallucinationValidator.validate(result, document);

if (validation.isValid && hallucination.isValid) {
  // Safe to use result
}
```

## Erweiterbarkeit

Custom Validators hinzufügen:

```typescript
// In AJV Instanz
service.ajv.addKeyword({
  keyword: 'customRule',
  compile: (schema) => {
    return (data) => {
      // Custom Validierung
      return true/false;
    };
  }
});
```

## Best Practices

1. **Schemas im Git**: `extraction-rules/schemas/` unter Versionskontrolle
2. **Keine Defaults**: `useDefaults: false` IMMER
3. **Batch-Loading**: `loadAllSchemas()` beim Startup
4. **Error Context**: Validierungs-Errors mit Dokumenttyp loggen
5. **Performance**: Schemas cachen, nicht neu kompilieren

## Next Steps

- [ ] Schema Versioning (v1, v2, ...)
- [ ] Custom Validation Rules
- [ ] Multi-language Schemas
- [ ] Schema Generation aus Extraction Rules
- [ ] Validation Metrics/Monitoring

---

**Letzte Aktualisierung**: 2026-07-05
