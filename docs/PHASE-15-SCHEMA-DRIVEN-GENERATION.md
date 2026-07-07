# Phase 15: Schema-Driven Rule Generation (SPEC)

**Status**: 🟡 PROPOSED (Not yet implemented)  
**Version**: 0.15.0  
**Target Release**: Next iteration  
**Priority**: HIGH - Addresses key user workflow gap

---

## 📋 Übersicht

### Problem-Statement
Aktuell müssen Nutzer Extraktionsregeln manuell definieren. Es fehlt ein Workflow für:
1. **Zielstruktur** (JSON Schema) hochladen
2. **Beispiele** (gefüllte JSON-Dateien) hochladen → Learn-by-Example
3. **Automatische Regelsatz-Generierung** basierend auf Schema + Beispiele
4. **Extraktion durchführen** mit generierten Regeln
5. **Ergebnisse anzeigen** im Frontend mit Validierung gegen Schema

### Nutzer-Szenarien

#### Scenario 1: Invoice Extraction
```
Nutzer hat:
- invoice.pdf (zu extrahierendes Dokument)
- invoice-schema.json (Zielstruktur mit 15 Feldern)
- invoice-examples/ (3 bereits gefüllte JSON-Dateien als Lernbeispiele)

Gewünschtes Ergebnis:
- System generiert automatisch Regelsatz für die 15 Felder
- Extraction wird durchgeführt
- Ergebnis wird gegen Schema validiert
- UI zeigt: Validierter Output + Confidence per Feld
```

#### Scenario 2: Contract Data Extraction
```
Nutzer hat:
- contract.pdf
- contract-schema.json (nested structure mit parties, dates, amounts)
- 2 Beispiel-Contracts als JSON

Ergebnis:
- Regeln für nested structure
- Validierung der Verschachtelung
- Frontend zeigt hierarchisches Ergebnis
```

---

## 🏗️ Architektur

### New Components

#### 1. SchemaAnalyzer
**Purpose**: Analysiert JSON-Schema und generiert Field-Metadaten

```typescript
interface SchemaField {
  fieldName: string;
  jsonPath: string;           // z.B. "invoice.amount", "parties[0].name"
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isRequired: boolean;
  isArray: boolean;
  nestedSchema?: SchemaField[];  // für nested objects
  description?: string;        // aus $comment im Schema
  pattern?: string;           // regex aus schema
  enum?: string[];            // erlaubte Werte
}

class SchemaAnalyzer {
  analyzeSchema(schema: JSONSchema): SchemaField[];
  validateAgainstSchema(data: unknown, schema: JSONSchema): ValidationResult;
  generateDocumentation(schema: JSONSchema): string;
}
```

**Implementation Location**: `src/domain/schema/SchemaAnalyzer.ts`

---

#### 2. ExampleAnalyzer
**Purpose**: Analysiert Beispiel-JSONs und leitet Feldcharakteristiken ab

```typescript
interface FieldCharacteristics {
  fieldName: string;
  observedTypes: Set<string>;           // z.B. ["number", "string"]
  sampleValues: string[];                // Beispielwerte
  frequencyInExamples: number;           // 0-1 (wie oft kommt das Feld vor)
  averageLength?: number;                // für Strings
  pattern?: RegExp;                      // erkannte Patterns (z.B. /\d{4}-\d{4}/ für Invoice-Nummern)
  confidence: number;                    // Sicherheit der Analyse
}

class ExampleAnalyzer {
  analyzeExamples(examples: unknown[]): FieldCharacteristics[];
  generateSearchPatterns(examples: unknown[]): Pattern[];
  estimateDataQuality(examples: unknown[]): QualityReport;
}
```

**Implementation Location**: `src/domain/schema/ExampleAnalyzer.ts`

---

#### 3. RuleGenerator
**Purpose**: Kombiniert Schema + Beispiele → Extraktionsregeln

```typescript
class RuleGenerator {
  generateRules(
    schema: SchemaField[],
    examples: FieldCharacteristics[],
    options?: GenerationOptions
  ): ExtractionRule[];

  generateSearchKeywords(field: SchemaField, examples: FieldCharacteristics[]): string[];
  
  generateRegexPatterns(field: SchemaField, examples: FieldCharacteristics[]): RegExp[];
  
  generateConfidenceThreshold(fieldCharacteristics: FieldCharacteristics): number;
}

interface GenerationOptions {
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';  // Confidence-Level
  includeNested: boolean;
  maxExamplesToUse: number;
}
```

**Implementation Location**: `src/application/rule-generation/RuleGenerator.ts`

---

#### 4. ResultMapper
**Purpose**: Mappt Extraktionsergebnisse auf JSON-Schema

```typescript
class ResultMapper {
  mapToSchema(
    extractedFields: ExtractedField[],
    schema: SchemaField[]
  ): MappedResult;

  validateResult(result: unknown, schema: JSONSchema): ValidationResult;

  fillTemplate(schema: SchemaField[], extractedFields: ExtractedField[]): object;
}

interface MappedResult {
  data: object;                    // Das gefüllte Zielschema
  validation: ValidationResult;    // Validierung gegen Schema
  coverage: {
    requiredFields: number;
    filledRequired: number;
    optionalFields: number;
    filledOptional: number;
  };
  unmappedFields: ExtractedField[];  // Felder die nicht ins Schema passen
}
```

**Implementation Location**: `src/application/result-mapping/ResultMapper.ts`

---

### API Endpoints (New)

#### Upload & Analyze
```
POST /api/schema/upload
  - Body: FormData { schemaFile, examplesZip? }
  - Response: { schemaId, fieldCount, analysisReport }

POST /api/schema/:schemaId/generate-rules
  - Body: { aggressiveness: 'moderate', options: {} }
  - Response: { ruleSetId, rules: ExtractionRule[], summary }

POST /api/extraction/with-schema/:ruleSetId
  - Body: FormData { documentFile }
  - Response: MappedResult (mit validation gegen Schema)
```

#### Review Generated Rules
```
GET /api/schema/:schemaId/analysis
  - Response: { fields: SchemaField[], examples: FieldCharacteristics[] }

PUT /api/schema/:schemaId/rules/:ruleId
  - Body: { patch updates }
  - Response: updated rule
```

---

### Frontend Workflow (New Page)

#### SchemaUploadWizard Component
**Step 1: Schema hochladen**
```
[Choose File] → Parse JSON Schema → Show field preview
```

**Step 2: Beispiele hochladen (optional)**
```
[Choose Zip] → Parse Examples → Show field coverage
```

**Step 3: Regelsatz generieren**
```
Aggressiveness: [Slider: Conservative ← → Aggressive]
[Generate Rules]
```

**Step 4: Review Generated Rules**
```
Table:
| Field Name | Type | Required | Pattern | Keywords | Confidence |
|-----------|------|----------|---------|----------|------------|
| ...
[Accept] [Edit] [Regenerate]
```

**Step 5: Run Extraction**
```
[Choose PDF/Document] → Extract → Show results
```

---

#### ExtractionResultsViewer Component
**Shows validated extraction against schema**

```
┌─────────────────────────────────────┐
│ Extraction Results                  │
├─────────────────────────────────────┤
│                                     │
│ Schema Validation: ✅ VALID          │
│ Coverage: 13/15 fields filled (87%) │
│                                     │
│ ┌─ invoice                          │
│ │ ├─ number: INV-2024-001 ✅        │
│ │ ├─ date: 2024-01-15 ✅            │
│ │ ├─ amount: 1500.00 ✅             │
│ │ ├─ vendor: ❌ NOT FOUND            │
│ │ ├─ items: [array: 3 items] ✅     │
│ │ │  ├─[0] name: "Service A" ✅     │
│ │ │  ├─[0] price: 500 ✅            │
│ │ │  └─[0] quantity: 1 ✅           │
│ │ ...                               │
│                                     │
│ [Export JSON] [Correct & Learn]     │
└─────────────────────────────────────┘
```

**Features**:
- Hierarchische Anzeige (nested objects)
- Validierungsstatus pro Feld
- Confidence-Scores
- Export als JSON
- Feedback/Korrektur-Workflow

---

## 📊 User Stories

### US-15.1: Schema-Analyse
```
Als Nutzer
Möchte ich ein JSON-Schema hochladen
Damit das System automatisch die Feldstruktur erkennt
```

**Acceptance Criteria**:
- ✅ Schema wird parsed und validiert
- ✅ Feldliste wird extrahiert (inkl. Nested)
- ✅ Feldtypen, Constraints werden erkannt
- ✅ Error-Handling für ungültige Schemas

---

### US-15.2: Learn-by-Example
```
Als Nutzer
Möchte ich Beispiel-JSON-Dateien hochladen
Damit der Generator Muster erkennt (Feldwerte, Formate, Patterns)
```

**Acceptance Criteria**:
- ✅ ZIP mit mehreren JSON-Dateien wird akzeptiert
- ✅ Feldabdeckung wird berechnet (% der Felder mit Werten)
- ✅ Patterns (Regex) werden automatisch erkannt
- ✅ Data Quality Report wird generiert

---

### US-15.3: Automatische Regelsatz-Generierung
```
Als Nutzer
Möchte dass Regeln automatisch basierend auf Schema + Beispielen generiert werden
Damit ich nicht alles manuell definieren muss
```

**Acceptance Criteria**:
- ✅ Regeln werden pro Feld generiert
- ✅ Suchkeywords werden aus Beispielen extrahiert
- ✅ Regex-Patterns werden basierend auf Beispielformat generiert
- ✅ Confidence-Thresholds werden intelligent gesetzt
- ✅ Nested/Array-Felder werden korrekt gehandhabt

---

### US-15.4: Extraction mit Schema-Validierung
```
Als Nutzer
Möchte dass Extraktionsergebnisse automatisch gegen das Schema validiert werden
Damit ich sehe, welche Felder erfolgreich gefüllt wurden
```

**Acceptance Criteria**:
- ✅ Ergebnisse werden als JSON strukturiert (nach Schema)
- ✅ Required fields werden überprüft
- ✅ Datentypen werden validiert
- ✅ Validierungsfehler werden gezeigt
- ✅ Coverage-% wird berechnet

---

### US-15.5: Frontend-Ergebnisanzeige
```
Als Nutzer
Möchte dass Ergebnisse hierarchisch und validiert im Frontend angezeigt werden
Damit ich schnell sehe was erfolgreich war und was fehlte
```

**Acceptance Criteria**:
- ✅ Hierarchische Anzeige (nested objects/arrays)
- ✅ Validierungsstatus pro Feld (✅/❌/⚠️)
- ✅ Confidence-Scores
- ✅ Export-Button (JSON/CSV)
- ✅ Korrektur-Workflow integriert

---

## 🔄 Workflow-Diagram

```
┌──────────────────┐
│ 1. Upload Schema │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ 2. Analyze Schema            │
│ SchemaAnalyzer.analyzeSchema │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────┐
│ 3. Upload        │ (Optional)
│ Examples ZIP     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 4. Analyze Examples             │
│ ExampleAnalyzer.analyzeExamples │
└────────┬──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 5. Generate Rules                        │
│ RuleGenerator.generateRules(             │
│   schema, examples, aggressiveness       │
│ )                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ 6. Review & Edit Rules       │ (UI)
│ [Accept] [Regenerate] [Edit] │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ 7. Upload Document       │
│ (PDF/DOCX/HTML)         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 8. Extract with Generated Rules  │
│ ExtractionEngine.extract()       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 9. Map & Validate Against Schema │
│ ResultMapper.mapToSchema()       │
│ ResultMapper.validateResult()    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ 10. Display Results in UI    │
│ ExtractionResultsViewer      │
│ [Show hierarchical view]     │
│ [Coverage %]                 │
│ [Validation errors]          │
└──────────────────────────────┘
```

---

## 📝 Implementation Roadmap

### Phase 15a: Core Components (1-2 weeks)
- [ ] SchemaAnalyzer (JSON-Schema parsing)
- [ ] ExampleAnalyzer (Pattern recognition)
- [ ] RuleGenerator (Rule synthesis)
- [ ] Unit tests (80%+ coverage)

### Phase 15b: Backend API (1 week)
- [ ] Upload endpoints
- [ ] Analysis endpoints
- [ ] Rule generation endpoints
- [ ] Integration tests

### Phase 15c: Frontend UI (1-2 weeks)
- [ ] SchemaUploadWizard (5-step flow)
- [ ] ExtractionResultsViewer (hierarchical)
- [ ] Integration with existing components
- [ ] E2E tests

### Phase 15d: Documentation & Guides (1 week)
- [ ] User Guide für den neuen Workflow
- [ ] Example: Invoice extraction mit Schema
- [ ] Troubleshooting guide
- [ ] Video tutorial

---

## 🔍 Success Criteria

- ✅ User kann PDF + Schema + Examples hochladen in < 2 Minuten
- ✅ Regelsatz wird automatisch generiert (keine manuelle Arbeit)
- ✅ Extraction mit generierten Regeln läuft (end-to-end)
- ✅ Ergebnisse werden validiert und hierarchisch angezeigt
- ✅ 80%+ Unit Test Coverage
- ✅ All existing tests still pass (Regression-free)
- ✅ Performance: Schema-Analyse < 2 sec, Generation < 5 sec
- ✅ Dokumentation vollständig (User Guide + Code Comments)

---

## ⚠️ Known Limitations (Phase 15.0)

1. **Keine ML-basierte Pattern-Erkennung** - nur Regex/Keywords
2. **Einfache Verschachtelung** - komplexe nested arrays können schwierig sein
3. **Keine automatische Fehlerkorrektur** - nur Validierung
4. **Keine Mehrsprachigkeit** - nur English/German keywords

---

## � JSON Schema Draft-07 Format - Technische Referenz

### Überblick

JSON Schema ist ein **Vokabular zur Validierung von JSON-Dokumenten**. Das System verwendet **Draft-07** als Standard für Datenstruktur-Definitionen.

**Warum JSON Schema Draft-07?**
- ✅ Weit verbreitet und stabil (seit 2018)
- ✅ Umfangreiche Validierungsfunktionen
- ✅ Exzellente Tooling-Unterstützung (AJV Validator)
- ✅ Human-readable Format

### Grundkonzepte

#### 1. Schema-Struktur

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Rechnung",
  "description": "Datenstruktur für Rechnungen",
  "type": "object",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Eindeutige Rechnungsnummer",
      "pattern": "^INV-\\d{4}-\\d{6}$"
    },
    "amount": {
      "type": "number",
      "description": "Gesamtbetrag in Euro",
      "minimum": 0
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Rechnungsdatum (ISO 8601)"
    }
  },
  "required": ["invoiceNumber", "amount", "date"]
}
```

**Kernelemente:**
- `$schema`: URL zur Draft-07 Spezifikation
- `title`: Lesbar Schemaname
- `description`: Detaillierte Beschreibung des Inhalts
- `type`: JSON-Datentyp (`object`, `array`, `string`, `number`, etc.)
- `properties`: Definition der einzelnen Felder
- `required`: Pflichtfelder

#### 2. Datentypen (type)

| Typ | Beschreibung | Beispiel |
|-----|-------------|----------|
| `string` | Text/Zeichenkette | `"Max Mustermann"` |
| `number` | Dezimalzahl | `19.99`, `100` |
| `integer` | Ganze Zahl | `42`, `0` |
| `boolean` | Wahr/Falsch | `true`, `false` |
| `array` | Liste von Elementen | `["item1", "item2"]` |
| `object` | Verschachtelte Struktur | `{"key": "value"}` |
| `null` | Keine Wert | `null` |

#### 3. String-Validierungen

```json
{
  "name": {
    "type": "string",
    "minLength": 1,
    "maxLength": 100,
    "pattern": "^[a-zA-Z äöüßÄÖÜ-]+$",
    "description": "Kundennamen (Buchstaben + Umlaute)"
  }
}
```

**Verfügbare Validierungen:**
- `minLength`: Mindestanzahl Zeichen
- `maxLength`: Maximalanzahl Zeichen
- `pattern`: Regex-Pattern zur Validierung
- `format`: Spezielle Formate (siehe nächster Abschnitt)

#### 4. Format-Spezifizierer

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "description": "E-Mail-Adresse"
  },
  "issueDate": {
    "type": "string",
    "format": "date",
    "description": "Datum im ISO-8601 Format (YYYY-MM-DD)"
  },
  "timestamp": {
    "type": "string",
    "format": "date-time",
    "description": "Datum + Zeit mit Zeitzone"
  }
}
```

**Unterstützte Formate (Draft-07):**
- `date`: ISO 8601 Datum (YYYY-MM-DD)
- `time`: ISO 8601 Zeit
- `date-time`: RFC 3339 Timestamp
- `email`: E-Mail-Adresse
- `hostname`: Domain-Name
- `ipv4`: IPv4-Adresse
- `ipv6`: IPv6-Adresse
- `uri`: URI/URL

#### 5. Zahlenbeschränkungen

```json
{
  "quantity": {
    "type": "integer",
    "minimum": 0,
    "maximum": 10000,
    "description": "Bestellmenge"
  },
  "price": {
    "type": "number",
    "minimum": 0.01,
    "exclusiveMaximum": 999999,
    "multipleOf": 0.01,
    "description": "Preis mit 2 Dezimalstellen"
  }
}
```

**Validierungen für Zahlen:**
- `minimum`: Minimum-Wert (inklusive)
- `maximum`: Maximum-Wert (inklusive)
- `exclusiveMinimum`: Minimum-Wert (exklusiv)
- `exclusiveMaximum`: Maximum-Wert (exklusiv)
- `multipleOf`: Muss ein Vielfaches sein

#### 6. Arrays / Listen

```json
{
  "lineItems": {
    "type": "array",
    "minItems": 1,
    "maxItems": 100,
    "items": {
      "type": "object",
      "properties": {
        "productId": { "type": "string" },
        "quantity": { "type": "integer", "minimum": 1 },
        "unitPrice": { "type": "number", "minimum": 0 }
      },
      "required": ["productId", "quantity", "unitPrice"]
    },
    "description": "Liste von Positionen (mind. 1, max. 100)"
  }
}
```

**Array-Validierungen:**
- `minItems`: Minimum Anzahl Elemente
- `maxItems`: Maximum Anzahl Elemente
- `items`: Definiert Struktur jedes Elements
- `uniqueItems`: Alle Elemente müssen einzigartig sein

#### 7. Verschachtelte Objekte (Nested)

```json
{
  "customer": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "address": {
        "type": "object",
        "properties": {
          "street": { "type": "string" },
          "city": { "type": "string" },
          "postalCode": { "type": "string" },
          "country": { "type": "string" }
        },
        "required": ["street", "city", "postalCode", "country"]
      }
    },
    "required": ["id", "name", "address"]
  }
}
```

#### 8. Enumerationen (Erlaubte Werte)

```json
{
  "status": {
    "type": "string",
    "enum": ["draft", "pending", "approved", "rejected", "archived"],
    "description": "Rechnungsstatus - nur diese Werte erlaubt"
  },
  "currency": {
    "type": "string",
    "enum": ["EUR", "USD", "GBP"],
    "default": "EUR"
  }
}
```

#### 9. Bedingte Validierung (if/then/else)

```json
{
  "invoiceType": {
    "type": "string",
    "enum": ["standard", "credit-note"]
  },
  "if": {
    "properties": {
      "invoiceType": { "const": "credit-note" }
    }
  },
  "then": {
    "properties": {
      "originalInvoiceNumber": { "type": "string" },
      "reason": { "type": "string", "enum": ["return", "error", "discount"] }
    },
    "required": ["originalInvoiceNumber", "reason"]
  }
}
```

### Praktisches Beispiel: Invoice-Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Invoice",
  "description": "Vollständiges Rechnungsschema mit allen erforderlichen Feldern",
  "type": "object",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "pattern": "^INV-[0-9]{4}-[0-9]{6}$",
      "description": "Format: INV-YYYY-XXXXXX"
    },
    "issueDate": {
      "type": "string",
      "format": "date",
      "description": "Rechnungsdatum"
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "description": "Fälligkeitsdatum"
    },
    "customer": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "taxId": { "type": "string" }
      },
      "required": ["name"]
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 },
          "unitPrice": { "type": "number", "minimum": 0 },
          "tax": { "type": "number", "minimum": 0, "maximum": 100 }
        },
        "required": ["description", "quantity", "unitPrice"]
      }
    },
    "totalAmount": {
      "type": "number",
      "minimum": 0,
      "description": "Gesamtbetrag (inklusive Steuern)"
    },
    "currency": {
      "type": "string",
      "enum": ["EUR", "USD", "GBP"],
      "default": "EUR"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "sent", "paid", "overdue", "cancelled"],
      "default": "draft"
    }
  },
  "required": [
    "invoiceNumber",
    "issueDate",
    "customer",
    "items",
    "totalAmount"
  ],
  "additionalProperties": false
}
```

### Validierung mit AJV (Der Validator des Systems)

Das System nutzt **AJV** (Another JSON Schema Validator) zur Laufzeit-Validierung:

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = require('./invoice-schema.json');
const validate = ajv.compile(schema);

// Validiere ein Dokument
const data = {
  invoiceNumber: "INV-2026-000042",
  issueDate: "2026-07-07",
  customer: { name: "ACME Corp" },
  items: [{ description: "Service", quantity: 1, unitPrice: 99.99 }],
  totalAmount: 99.99
};

const isValid = validate(data);
if (!isValid) {
  console.error('Validation errors:', validate.errors);
}
```

**Fehler-Format:**
```javascript
{
  "instancePath": "/items/0/quantity",
  "schemaPath": "#/properties/items/items/properties/quantity/minimum",
  "keyword": "minimum",
  "params": { "limit": 1 },
  "message": "must be >= 1"
}
```

### Best Practices

1. **Immer `$schema` angeben** für maximale Kompatibilität
2. **`title` + `description`** für Dokumentation
3. **`required` explizit setzen** - nicht auf Defaults verlassen
4. **`pattern` für Text-Validierung** (z.B. Telefonnummern, IDs)
5. **`format` für Standard-Formate** (Email, Date, URI)
6. **`additionalProperties: false`** um unerwartete Felder zu blockieren
7. **`examples` hinzufügen** für Dokumentation
8. **Validierungsfehler loggend** für Debugging

### Verwendung in Phase 15

Im Extraktions-Workflow:

```
1. User lädt Schema hoch → SchemaAnalyzer parst Draft-07
2. Extraktion findet Werte
3. ResultMapper validiert gegen Schema mit AJV
4. Validierungserrors + Warnings werden gesammelt
5. UI zeigt hierarchisches Ergebnis mit Validierungs-Status
```

---

## �📚 Related Phases

- **Phase 13**: Frontend Workbench (base components exist)
- **Phase 14**: Learning & Corrections (feedback loop)
- **Phase 15**: Schema-Driven Generation ← **YOU ARE HERE**
- **Phase 16**: Advanced Pattern Mining (future)

