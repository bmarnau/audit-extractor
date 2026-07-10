# 📐 PHASE 1 - JSON Struktur Referenz

**Vollständige Spezifikation aller JSON Strukturen und Formate**

---

## 1. SCHEMA Struktur

### Übersicht

Das **Schema** definiert die **Zielstruktur** für die Datenextraktion.

**Dateipfad:** `extraction-rules/schemas/{report-name}-schema-v{version}.json`

### Minimales Beispiel

```json
{
  "id": "invoice-schema-v1.0.0",
  "documentType": "invoice",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true
    }
  ]
}
```

### Vollständiges Beispiel mit allen Optionen

```json
{
  "id": "invoice-schema-v1.0.0",
  "documentType": "invoice",
  "version": "1.0.0",
  "description": "Deutsche Rechnungsvorlage für KMU",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "description": "Eindeutige Rechnungsnummer",
      "constraints": {
        "minLength": 1,
        "maxLength": 50,
        "pattern": "^[A-Z0-9\\-]*$",
        "enum": null
      }
    },
    {
      "fieldName": "invoiceDate",
      "fieldType": "date",
      "isRequired": true,
      "description": "Ausstellungsdatum der Rechnung",
      "constraints": {
        "format": "YYYY-MM-DD",
        "minDate": "1900-01-01",
        "maxDate": "2099-12-31"
      }
    },
    {
      "fieldName": "totalAmount",
      "fieldType": "number",
      "isRequired": true,
      "description": "Gesamtbetrag brutto",
      "constraints": {
        "minimum": 0.01,
        "maximum": 999999.99,
        "decimalPlaces": 2
      }
    },
    {
      "fieldName": "currency",
      "fieldType": "string",
      "isRequired": false,
      "description": "Währungscode",
      "constraints": {
        "enum": ["EUR", "USD", "GBP", "CHF"]
      }
    },
    {
      "fieldName": "items",
      "fieldType": "array",
      "isRequired": false,
      "description": "Rechnungspositionen",
      "constraints": {
        "minItems": 1,
        "maxItems": 100
      }
    }
  ]
}
```

### Feld-Referenz

| Eigenschaft | Typ | Required | Beschreibung | Beispiel |
|-------------|-----|----------|--------------|----------|
| `id` | string | ✅ | Eindeutige Schema-ID | `"invoice-schema-v1.0.0"` |
| `documentType` | string | ✅ | Dokumenttyp | `"invoice"`, `"po"`, `"contract"` |
| `version` | string | ⭕ | Schema-Version | `"1.0.0"` |
| `description` | string | ⭕ | Beschreibung | `"Deutsche KMU Rechnung"` |
| `fields` | array | ✅ | Feld-Definitionen | `[{...}, {...}]` |

### Feldtypen

```typescript
type FieldType = 
  | "string"      // Text (Standard)
  | "number"      // Numerische Werte (Integer/Decimal)
  | "date"        // Datumsformat (YYYY-MM-DD)
  | "boolean"     // Wahr/Falsch
  | "array"       // Array von Werten
  | "object";     // Verschachtelter Object (max Tiefe: 2)
```

### Constraints pro Feldtyp

**String:**
```json
{
  "minLength": 1,        // Mindestlänge
  "maxLength": 200,      // Maximallänge
  "pattern": "^[A-Z0-9\\-]*$",  // Regex Pattern
  "enum": ["EUR", "USD"]  // Erlaubte Werte
}
```

**Number:**
```json
{
  "minimum": 0.01,       // Minimumwert
  "maximum": 999999.99,  // Maximumwert
  "decimalPlaces": 2     // Dezimalstellen
}
```

**Date:**
```json
{
  "format": "YYYY-MM-DD",  // Datumsformat
  "minDate": "1900-01-01",
  "maxDate": "2099-12-31"
}
```

**Array:**
```json
{
  "minItems": 1,         // Mindestanzahl
  "maxItems": 100,       // Maximalanzahl
  "itemType": "object"   // Typ der Array-Items
}
```

---

## 2. EXAMPLE Struktur

### Übersicht

Die **Beispieldaten** sind die **Trainings-Daten** für Pattern-Generierung.

**Dateipfad:** `extraction-rules/examples/{report-name}-example.json`

### Minimales Beispiel

```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2026-07-08",
  "totalAmount": 4522.00
}
```

### Realistisches Beispiel

```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2026-07-08",
  "dueDate": "2026-08-08",
  "customerName": "Acme Corporation GmbH",
  "customerAddress": "Musterstraße 123, 12345 Berlin",
  "customerTaxId": "DE123456789",
  "invoiceTotal": 4522.00,
  "taxRate": 0.19,
  "taxAmount": 859.18,
  "currency": "EUR",
  "paymentMethod": "Bank Transfer",
  "bankAccount": "DE89370400440532013000",
  "notes": "Thank you for your business!"
}
```

### Mehrere Beispiele (Array-Format - bessere Generierung!)

```json
[
  {
    "invoiceNumber": "R-2024-001",
    "invoiceDate": "2026-07-01",
    "totalAmount": 1190.00,
    "currency": "EUR"
  },
  {
    "invoiceNumber": "INV-2024-1001",
    "invoiceDate": "2026-07-08",
    "totalAmount": 3567.89,
    "currency": "EUR"
  },
  {
    "invoiceNumber": "2024-0000157",
    "invoiceDate": "2026-07-15",
    "totalAmount": 15234.56,
    "currency": "EUR"
  }
]
```

### Best Practices für Beispieldaten

| Aspekt | DO ✅ | DON'T ❌ |
|--------|------|---------|
| **Realismus** | Nutze reale Daten aus Produktion | Erfundene, unrealistische Werte |
| **Vollständigkeit** | Alle Schema-Felder ausfüllen | Nur 1-2 Felder füllen |
| **Varianten** | Zeige verschiedene Schreibweisen | Nur eine Variante |
| **Menge** | 3-10 Beispiele pro Report | Nur 1 Beispiel |
| **Format** | Deutsches Format (2026-07-08) | US Format (07-08-2026) |
| **Tiefe** | Flache Struktur (max 2 Ebenen) | Tiefe Verschachtelung (5+ Ebenen) |
| **Größe** | < 1MB pro Beispiel | > 10MB |

### Beispiel-Varianten (für besseres Learning)

**Schecht (zu ähnlich):**
```json
[
  { "invoiceNumber": "INV-001", "invoiceDate": "2026-07-01" },
  { "invoiceNumber": "INV-002", "invoiceDate": "2026-07-02" },
  { "invoiceNumber": "INV-003", "invoiceDate": "2026-07-03" }
]
```
→ System lernt: `^INV-[0-9]{3}$` (zu eng!)

**Gut (Varianten zeigen):**
```json
[
  { "invoiceNumber": "R-2024-001", "invoiceDate": "2026-07-01" },
  { "invoiceNumber": "INV-2024-1001", "invoiceDate": "2026-07-08" },
  { "invoiceNumber": "2024-0000157", "invoiceDate": "2026-07-15" }
]
```
→ System lernt: `^[A-Za-z0-9\-]*$` (flexibel!)

---

## 3. GENERATED RULES Struktur

### Übersicht

Die **generierten Regeln** sind die **Output** von Phase 1.

**Dateipfad:** `extraction-rules/generated/{report-name}-rules-v{version}.json`

### Struktur einer generierten Rule

```json
{
  "ruleId": "invoice-field-0a1b2c3d",
  "fieldName": "invoiceNumber",
  "fieldType": "string",
  "pattern": "^[A-Z0-9\\-]*$",
  "confidence": 0.92,
  "alternativePatterns": [
    {
      "pattern": "^[A-Z]{1,5}[0-9]{1,6}$",
      "confidence": 0.65,
      "applicability": "For vendor-specific numbering"
    }
  ],
  "constraints": {
    "minLength": 1,
    "maxLength": 50,
    "required": true
  },
  "matchExamples": [
    "INV-2024-001",
    "R-2024-001",
    "2024-0000157"
  ],
  "generatedAt": "2026-07-08T10:30:00Z",
  "generatedVersion": "1.0.0",
  "notes": "Pattern inferred from 3 examples with 92% confidence"
}
```

### Generiertes Ruleset (mehrere Rules)

```json
{
  "id": "invoice-ruleset-v1.0.0",
  "reportName": "invoice",
  "version": "1.0.0",
  "generatedAt": "2026-07-08T10:30:00Z",
  "metadata": {
    "totalRules": 6,
    "successCount": 6,
    "warningCount": 0,
    "averageConfidence": 0.84,
    "generationDurationMs": 142,
    "generatedBy": "RuleGenerator v1.0.0"
  },
  "rules": [
    { /* Rule 1 */ },
    { /* Rule 2 */ },
    // ... mehr Rules
  ],
  "recommendations": [
    "Field 'dueDate' has optional constraint - consider validating manually",
    "Consider using Pattern Alternative 1 for field 'invoiceNumber' if pattern fails"
  ]
}
```

---

## 4. ERROR & VALIDATION Struktur

### Generierungs-Fehler

```json
{
  "success": false,
  "error": "Invalid field name 'invoice-number': Only a-zA-Z0-9_ allowed",
  "reportName": "invoice",
  "timestamp": "2026-07-08T10:30:00Z"
}
```

### Validierungs-Warnungen

```json
{
  "success": true,
  "rules": [...],
  "warnings": [
    "Field 'taxAmount' has low confidence (0.35) - manual review recommended",
    "Field 'dueDate' is optional but rarely appears in examples",
    "Pattern for 'currency' might be too strict"
  ]
}
```

---

## 5. METADATA Struktur

### Generierungs-Metadaten

```json
{
  "generationMetadata": {
    "timestamp": "2026-07-08T10:30:00Z",
    "version": "1.0.0",
    "generator": "RuleGenerator",
    "generatorVersion": "1.0.0",
    "examplesUsed": 3,
    "exampleFile": "invoice-example.json",
    "schemaFile": "invoice-schema-v1.0.0.json",
    "durationMs": 142,
    "hostname": "workstation-123",
    "userId": "user@company.com"
  }
}
```

### Performance-Metadaten

```json
{
  "performance": {
    "exampleLoadingMs": 10,
    "patternInferenceMs": 50,
    "ruleValidationMs": 32,
    "totalMs": 142,
    "memoryUsedMB": 2.3,
    "rulesPerSecond": 42
  }
}
```

---

## 6. VERSIONIERUNG

### Versionsschema

**Format:** `MAJOR.MINOR.PATCH`

```
Beispiel: "1.2.3"
         │ │ │
         │ │ └─ Patch (Bug fixes, kleine Änderungen)
         │ └─── Minor (Neue Features, new fields)
         └───── Major (Breaking changes)
```

### Versionsbeispiele

```
1.0.0  →  Initial Release
1.1.0  →  Added field 'taxAmount' (Minor bump, neue Phase 2 Verbesserungen)
1.1.1  →  Fixed pattern for invoiceDate (Patch, kleine Fehlerfix)
2.0.0  →  Changed structure of rules (Major, Breaking change)
```

---

## 7. FILE NAMING CONVENTIONS

### Schemas

```
Format: {reportName}-schema-v{version}.json
Beispiele:
  ✅ invoice-schema-v1.0.0.json
  ✅ po-schema-v1.0.0.json
  ✅ contract-schema-v2.1.0.json
  
  ❌ invoice_schema.json (kein Version)
  ❌ InvoiceSchema.json (wrong case)
  ❌ schema-invoice.json (wrong order)
```

### Examples

```
Format: {reportName}-example.json or {reportName}-examples.json
Beispiele:
  ✅ invoice-example.json
  ✅ invoice-examples.json (für Multiple Examples)
  ✅ po-example.json
  
  ❌ example-invoice.json (wrong order)
  ❌ invoiceExample.json (wrong case)
```

### Generated Rules

```
Format: {reportName}-rules-v{version}.json
Beispiele:
  ✅ invoice-rules-v1.0.0.json
  ✅ po-rules-v1.0.0.json
  
  ❌ rules-invoice.json (wrong order)
  ❌ generated-rules.json (zu generisch)
```

---

## 8. DIRECTORY STRUKTUR

```
extraction-rules/
├── schemas/
│   ├── invoice-schema-v1.0.0.json       ← Zielstruktur
│   ├── po-schema-v1.0.0.json
│   └── contract-schema-v1.0.0.json
├── examples/
│   ├── invoice-example.json              ← Trainings-Daten
│   ├── po-example.json
│   └── contract-example.json
└── generated/
    ├── invoice-rules-v1.0.0.json        ← Output Phase 1
    ├── po-rules-v1.0.0.json
    └── contract-rules-v1.0.0.json
```

---

## 9. VALIDATION REGELN

### Schema Validation

- [ ] `id` muss eindeutig sein
- [ ] `documentType` darf nur lowercase alphanumerisch sein
- [ ] Jedes Feld muss eindeutigen `fieldName` haben
- [ ] `fieldType` muss aus erlaubter Liste sein
- [ ] Mindestens 1 erforderliches Feld

### Example Validation

- [ ] Alle erforderlichen Felder (isRequired: true) müssen vorhanden sein
- [ ] Feldtypen müssen dem Schema entsprechen
- [ ] JSON muss valid sein
- [ ] Dateigröße max 10MB
- [ ] JSON Tiefe max 5 Ebenen

### Generated Rules Validation

- [ ] Alle Schema-Felder müssen eine Rule haben
- [ ] Pattern muss valid Regex sein
- [ ] Confidence muss zwischen 0 und 1 sein
- [ ] Jede Rule muss `ruleId` haben

---

**Dies ist die verbindliche Spezifikation für alle JSON Dateien in Phase 1.**

Für Fragen oder Anpassungen: Siehe `PHASE1_USER_GUIDE.md`
