# Phase 15 Use Case: Schema-Driven Extraction Guide

**Status**: 🟡 PROPOSED (Feature specification ready, implementation pending)  
**Version**: 0.15.0-rc1

---

## 📖 Nutzer-Szenario

### Das Problem
"Ich habe ein PDF-Dokument und eine JSON-Zielstruktur (Schema), die ich füllen möchte.
Ich möchte nicht alle Extraktionsregeln manuell definieren, sondern sie vom System automatisch generieren lassen.
Falls ich auch Beispiel-JSON-Dateien habe, sollen diese zur Verbesserung der Regeln verwendet werden."

### Die Lösung (Phase 15)
Ein **Schema-Driven Rule Generation Workflow**, der:
1. ✅ JSON-Schema hochladen kann
2. ✅ Beispiel-JSON-Dateien als "Learn-by-Example" akzeptiert
3. ✅ Automatisch optimale Extraktionsregeln generiert
4. ✅ Extraktionen basierend auf diesen Regeln durchführt
5. ✅ Ergebnisse validiert und hierarchisch anzeigt

---

## 🔄 Kompletter Workflow

### Schritt 1: Schema hochladen

```
BenutzerOberfläche:
┌─────────────────────────────┐
│ Schema-Driven Extractor     │
├─────────────────────────────┤
│ Step 1/5: Upload Schema     │
│                             │
│ [Choose File] → Select JSON │
│  (invoice-schema.json)      │
│                             │
│ Waiting for schema...       │
└─────────────────────────────┘
```

**Was passiert im Backend**:
- SchemaAnalyzer parsed das JSON-Schema
- Fieldlisten werden extrahiert:
  - `invoiceNumber` (string, required, pattern: "INV-\d{4}")
  - `invoiceDate` (string, required, format: "date")
  - `amount` (number, required, minimum: 0)
  - `items` (array of objects, with nested `name`, `price`, `qty`)
  - etc.

**Resultat**:
```json
{
  "schemaId": "sch_invoice_001",
  "fieldCount": 15,
  "analysisReport": {
    "fields": [
      {
        "fieldName": "invoiceNumber",
        "jsonPath": "invoice.number",
        "dataType": "string",
        "isRequired": true,
        "pattern": "INV-\\d{4}"
      },
      ...
    ]
  }
}
```

---

### Schritt 2: Beispiele hochladen (optional)

```
BenutzerOberfläche:
┌─────────────────────────────┐
│ Step 2/5: Upload Examples   │
│ (Optional, but recommended) │
│                             │
│ [Choose ZIP] → Select ...   │
│  (examples.zip)             │
│                             │
│ Contains:                   │
│  ├─ invoice-001.json        │
│  ├─ invoice-002.json        │
│  └─ invoice-003.json        │
│                             │
│ [Skip] [Next]               │
└─────────────────────────────┘
```

**Was passiert im Backend**:
- ExampleAnalyzer lädt alle JSON-Dateien
- Für jedes Feld werden Muster erkannt:
  - `invoiceNumber`: ["INV-2024-001", "INV-2024-002", "INV-2024-003"]
    - → Regex: `INV-\d{4}-\d{3}`
    - → Keywords: ["invoice number", "invoicenumber", "inv#"]
  - `amount`: [1500.00, 2300.50, 850.00]
    - → Type: number
    - → Average: ~1500
    - → Pattern: `\d+\.\d{2}` (EUR format)
  - `items`: [array mit 3, 5, 2 items]
    - → Frequency: 100% (alle Beispiele haben items)

**Resultat**:
```json
{
  "fieldCharacteristics": [
    {
      "fieldName": "invoiceNumber",
      "observedTypes": ["string"],
      "sampleValues": ["INV-2024-001", "INV-2024-002"],
      "frequencyInExamples": 1.0,
      "pattern": "INV-\\d{4}-\\d{3}",
      "confidence": 0.95
    },
    ...
  ]
}
```

---

### Schritt 3: Regelsatz generieren

```
BenutzerOberfläche:
┌─────────────────────────────┐
│ Step 3/5: Generate Rules    │
│                             │
│ Aggressiveness:             │
│ [Slider: Conservative ←→ A] │
│                             │
│ More aggressive = higher    │
│ confidence threshold        │
│                             │
│ [Generate Rules]            │
└─────────────────────────────┘
```

**Was passiert im Backend**:
- RuleGenerator kombiniert Schema + Beispiele
- Pro Feld wird generiert:
  - Suchkeywords (aus Beispielen + Schema-Beschreibung)
  - Regex-Pattern (aus Beispielformat)
  - Confidence-Threshold (basierend auf Frequenz + Aggressiveness)
  - Field-Type validation

**Resultat**:
```json
{
  "ruleSetId": "rs_invoice_001",
  "rules": [
    {
      "ruleId": "inv_number",
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "searchKeywords": [
        "invoice number",
        "invoicenumber",
        "inv#",
        "invoice#"
      ],
      "pattern": "INV-\\d{4}-\\d{3}",
      "confidenceThreshold": 0.85,
      "extractionHint": "Invoice identifiers start with INV-"
    },
    {
      "ruleId": "inv_amount",
      "fieldName": "amount",
      "fieldType": "number",
      "isRequired": true,
      "searchKeywords": ["total", "amount", "sum", "grand total"],
      "pattern": "\\d+\\.\\d{2}",
      "confidenceThreshold": 0.80,
      "dataType": "number"
    },
    ...
  ]
}
```

---

### Schritt 4: Regeln Review & Edit

```
BenutzerOberfläche:
┌──────────────────────────────────────────────┐
│ Step 4/5: Review Generated Rules             │
├──────────────────────────────────────────────┤
│                                              │
│ Field Name    | Type    | Pattern    | Conf  │
│───────────────┼─────────┼────────────┼───────│
│invoiceNumber  │ string  │INV-\d{4}   │ 85%   │
│invoiceDate    │ string  │\d{4}-\d{2} │ 90%   │
│amount         │ number  │\d+\.\d{2}  │ 80%   │
│vendor         │ string  │[A-Za-z ]+  │ 75%   │
│items[]        │ array   │ -          │ 95%   │
│items[].name   │ string  │[A-Za-z ]+  │ 88%   │
│items[].price  │ number  │\d+\.\d{2}  │ 92%   │
│               │         │            │       │
│ [Edit] [Back] [Accept & Continue]           │
└──────────────────────────────────────────────┘
```

**Nutzer kann**:
- ✏️ Keywords hinzufügen/entfernen
- ✏️ Regex-Pattern anpassen
- ✏️ Confidence-Threshold ändern
- 🔄 Regeln regenerieren
- ✅ Akzeptieren und fortfahren

---

### Schritt 5: Run Extraction

```
BenutzerOberfläche:
┌──────────────────────────────────────────┐
│ Step 5/5: Run Extraction                 │
├──────────────────────────────────────────┤
│                                          │
│ [Choose Document]                        │
│  → invoice.pdf                           │
│                                          │
│ [Start Extraction]                       │
│                                          │
│ Extracting...                            │
│ ▮▮▮▮▮▮▮▮▮▮▮▮ 75%                         │
│                                          │
│ Validating against schema...             │
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮ 100%                    │
│                                          │
│ [View Results]                           │
└──────────────────────────────────────────┘
```

---

## 📊 Extraktionsergebnisse - Hierarchische Anzeige

```
┌─────────────────────────────────────────────────┐
│ Extraction Results                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Schema Validation Status: ✅ VALID               │
│ Coverage: 14/15 fields filled (93%)             │
│                                                 │
│ ┌─ invoice (object) ✅                          │
│ │                                              │
│ │ ├─ number: "INV-2024-001" ✅                  │
│ │ │  └ Confidence: 99% | Source: Page 1, L5   │
│ │                                              │
│ │ ├─ date: "2024-01-15" ✅                      │
│ │ │  └ Confidence: 96% | Source: Page 1, L6   │
│ │                                              │
│ │ ├─ amount: 1500.00 ✅                         │
│ │ │  └ Confidence: 94% | Source: Page 2, Total│
│ │                                              │
│ │ ├─ vendor: ❌ NOT FOUND                       │
│ │ │  └ Required field missing                  │
│ │                                              │
│ │ ├─ items: (array: 3 items) ✅                │
│ │ │                                            │
│ │ │ ├─[0] (object) ✅                           │
│ │ │ │ ├─ name: "Service A" ✅                   │
│ │ │ │ │ └ Confidence: 92%                      │
│ │ │ │ ├─ price: 500.00 ✅                       │
│ │ │ │ │ └ Confidence: 95%                      │
│ │ │ │ └─ qty: 1 ✅                              │
│ │ │ │   └ Confidence: 88%                      │
│ │ │                                            │
│ │ │ ├─[1] (object) ✅                           │
│ │ │ │ ├─ name: "Service B" ✅                   │
│ │ │ │ ├─ price: 750.00 ✅                       │
│ │ │ │ └─ qty: 1 ✅                              │
│ │ │                                            │
│ │ │ └─[2] (object) ✅                           │
│ │ │   ├─ name: "Service C" ✅                   │
│ │ │   ├─ price: 250.00 ✅                       │
│ │ │   └─ qty: 1 ✅                              │
│ │                                              │
│ │ └─ notes: "Please confirm receipt" ✅        │
│ │    └ Confidence: 85%                         │
│                                                 │
│ ┌─ Summary ─────────────────────────────────┐  │
│ │ Validation Errors: 1                       │  │
│ │  └─ vendor: Required but not found        │  │
│ │                                            │  │
│ │ Coverage Analysis:                         │  │
│ │  - Required fields: 14 total              │  │
│ │  - Filled required: 13 (93%)              │  │
│ │  - Optional fields: 1                     │  │
│ │  - Filled optional: 1 (100%)              │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ [Export as JSON] [Export as CSV]                │
│ [Correct & Learn] [Back]                        │
└─────────────────────────────────────────────────┘
```

---

## 💡 Key Differentiators vs. Manual Workflow

| Aspekt | Manual | Phase 15 |
|--------|--------|----------|
| **Time to create rules** | 30-60 min | 2-3 min |
| **Require domain expert** | Yes | No |
| **Learn from examples** | No | Yes |
| **Coverage visibility** | Manual check | Automatic % |
| **Result validation** | Manual | Automatic (AJV) |
| **Hierarchical display** | No | Yes (nested) |
| **Pattern reuse** | No | Yes (regex + keywords) |

---

## 🎯 Success Metrics (Phase 15)

**For Users**:
- ✅ Can create rules in < 3 minutes (vs. 30+ min manual)
- ✅ Don't need to write regex patterns
- ✅ Can see coverage % immediately
- ✅ Can validate results against schema

**For System**:
- ✅ 80%+ unit test coverage
- ✅ Performance: Schema analysis < 2 sec
- ✅ Performance: Rule generation < 5 sec
- ✅ Zero hallucination guarantee maintained
- ✅ All existing tests still pass

---

## 📚 Example: Complete Invoice Workflow

### Starting Point: Files from User

**invoice-schema.json** (15 fields):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "invoiceNumber": { "type": "string", "pattern": "^INV-" },
    "invoiceDate": { "type": "string", "format": "date" },
    "vendor": { "type": "string" },
    "amount": { "type": "number", "minimum": 0 },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "quantity": { "type": "integer" }
        },
        "required": ["name", "price", "quantity"]
      }
    }
  },
  "required": ["invoiceNumber", "invoiceDate", "vendor", "amount"]
}
```

**examples.zip** with 3 sample invoices:
```
examples/
├─ sample-1.json  (15 fields filled)
├─ sample-2.json  (13 fields filled, vendor missing)
└─ sample-3.json  (all 15 fields filled)
```

**invoice.pdf** (to extract):
- 2 pages
- Contains: Invoice#, Date, Vendor, Items table, Total

### System Process

**1. Schema Analysis** → 15 fields identified (3 required, 12 optional, nested array)

**2. Example Analysis** → 
- All fields found in at least 1 example
- `vendor` only in 2/3 examples (confidence: 0.66)
- `items[]` in all examples, typically 3-5 items

**3. Rule Generation** →
```json
15 rules created:
- invoiceNumber: regex "INV-\d{4}", confidence 0.95
- invoiceDate: regex "\d{4}-\d{2}-\d{2}", confidence 0.90
- vendor: keywords ["vendor", "seller", "from"], confidence 0.70
- amount: regex "\d+\.\d{2}", confidence 0.92
- items[].name: keywords ["item", "service", "description"], conf 0.85
- items[].price: regex "\d+\.\d{2}", confidence 0.93
- items[].quantity: regex "\d+", confidence 0.88
... (8 more)
```

**4. Extraction** →
- PDF parsed → 2 pages extracted
- Rules applied to each page
- 14 of 15 fields found
- `vendor` missing (0.70 confidence not met in document)

**5. Validation** →
- Check against schema
- 14/15 required fields: VALID (vendor is actually required - ⚠️ Warning)
- Array structure: VALID (3 items correctly nested)
- Data types: VALID (all numbers are numbers, strings are strings)

**6. Display** →
Hierarchical view shows all 15 fields with validation status, coverage 93%

---

## 🚀 Expected Impact

### Time Savings
- **Before**: 1 hour per document type to create rules
- **After**: 2 minutes to upload schema + examples
- **Gain**: 95% time reduction

### Quality Improvement
- Schema-based validation prevents hallucinations
- Automatic pattern recognition more accurate than manual
- Learn-by-example leverages past successful extractions

### User Experience
- No regex/pattern knowledge required
- Instant feedback on coverage
- Clear visualization of nested structures
- Export results in any format

---

## 🔗 Related Documentation

- [Phase 15 Full Spec](../PHASE-15-SCHEMA-DRIVEN-GENERATION.md)
- [General User Guide](./USER-GUIDE.md)
- [REST API Reference](./README.md)
- [Glossary](./glossary.md)

