# JSON Schema Draft-07 - Vollständige Referenz

**Version**: Draft-07  
**Standard-URL**: http://json-schema.org/draft-07/  
**Verwendung im System**: Phase 15 Schema-Driven Extraction  
**Last Updated**: 2026-07-07

---

## 📑 Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Kern-Keywords](#kern-keywords)
3. [Datentypen](#datentypen)
4. [Validierungsschlüsselwörter](#validierungsschlüsselwörter)
5. [Komplexe Strukturen](#komplexe-strukturen)
6. [Validierung & Fehlerbehandlung](#validierung--fehlerbehandlung)
7. [Best Practices](#best-practices)
8. [FAQ & Häufige Fehler](#faq--häufige-fehler)
9. [Cheat Sheet](#cheat-sheet)

---

## Einführung

### Was ist JSON Schema?

JSON Schema ist ein Standard zur **Validierung und Dokumentation von JSON-Daten**. Es beschreibt:
- ✅ Welche Felder ein JSON-Objekt haben darf/muss
- ✅ Welche Datentypen für jedes Feld erlaubt sind
- ✅ Welche Constraints gelten (Min/Max, Patterns, etc.)
- ✅ Die Struktur von verschachtelten Daten

### Warum Draft-07?

```
JSON Schema Versionsgeschichte:
Draft-03 (2009) → Draft-04 (2013) → Draft-05/06 (2017) → Draft-07 (2018) ← WIR NUTZEN DIESE
                                                        ↓
                                                    Draft-2019-09
                                                    Draft-2020-12 (neu, weniger Support)
```

**Gründe für Draft-07:**
- ✅ Stabil seit 2018 (7+ Jahre Produktivumgebungen)
- ✅ Exzellente Tooling-Unterstützung (AJV, Online Validators)
- ✅ Nicht zu alt (Draft-04) aber auch nicht zu neu (2020-12)
- ✅ Performance optimiert
- ✅ Enterprise Standard

---

## Kern-Keywords

### 1. `$schema`

Gibt die JSON Schema Version an.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

**Wichtig:** Immer angeben für Kompatibilität!

### 2. `title` und `description`

Dokumentation des Schemas.

```json
{
  "title": "Rechnungs-Datenmodell",
  "description": "Beschreibung von Rechnungen gemäß DE-Rechnungsgesetz",
  "type": "object"
}
```

### 3. `type`

Definiert den Datentyp.

```json
{
  "type": "object"          // oder "array", "string", "number", etc.
}
```

### 4. `properties`

Definiert Objektfelder.

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" }
  }
}
```

### 5. `required`

Welche Felder sind Pflichtfelder?

```json
{
  "properties": { ... },
  "required": ["name", "age"]  // name und age MÜSSEN vorhanden sein
}
```

### 6. `default`

Standardwert wenn Feld nicht vorhanden.

```json
{
  "currency": {
    "type": "string",
    "default": "EUR"  // Wenn nicht angegeben, wird EUR angenommen
  }
}
```

### 7. `examples`

Beispielwerte für Dokumentation.

```json
{
  "invoiceNumber": {
    "type": "string",
    "examples": ["INV-2026-000001", "INV-2026-000042"]
  }
}
```

### 8. `enum`

Nur diese Werte sind erlaubt.

```json
{
  "status": {
    "enum": ["draft", "pending", "approved", "rejected"]
  }
}
```

---

## Datentypen

### String

```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 255,
  "pattern": "^[A-Z]",
  "format": "email"
}
```

### Number / Integer

```json
{
  "number": { "type": "number", "minimum": 0, "maximum": 1000.99 },
  "count": { "type": "integer", "minimum": 0 }
}
```

### Boolean

```json
{
  "isActive": { "type": "boolean" }
}
```

### Array

```json
{
  "tags": {
    "type": "array",
    "items": { "type": "string" },
    "minItems": 1,
    "maxItems": 10
  }
}
```

### Object

```json
{
  "address": {
    "type": "object",
    "properties": { ... },
    "required": [ ... ]
  }
}
```

### Null

```json
{
  "optional": { "type": "null" }
}
```

### Multiple Types

```json
{
  "amount": {
    "type": ["number", "null"]  // Kann Zahl ODER null sein
  }
}
```

---

## Validierungsschlüsselwörter

### String-Validierung

| Keyword | Zweck | Beispiel |
|---------|-------|----------|
| `minLength` | Min. Zeichenanzahl | `"minLength": 3` |
| `maxLength` | Max. Zeichenanzahl | `"maxLength": 50` |
| `pattern` | Regex-Pattern | `"pattern": "^[0-9]{4}$"` |
| `format` | Spezialformat | `"format": "email"` |

```json
{
  "postalCode": {
    "type": "string",
    "pattern": "^[0-9]{5}$",
    "description": "5-stellige deutsche PLZ"
  }
}
```

### Zahlen-Validierung

| Keyword | Zweck | Beispiel |
|---------|-------|----------|
| `minimum` | ≥ (inklusive) | `"minimum": 0` |
| `maximum` | ≤ (inklusive) | `"maximum": 100` |
| `exclusiveMinimum` | > (exklusiv) | `"exclusiveMinimum": 0` |
| `exclusiveMaximum` | < (exklusiv) | `"exclusiveMaximum": 100` |
| `multipleOf` | Muss Vielfaches sein | `"multipleOf": 0.01` |

```json
{
  "percentage": {
    "type": "number",
    "minimum": 0,
    "maximum": 100,
    "multipleOf": 0.01,
    "description": "Prozentanteil mit 2 Dezimalstellen"
  }
}
```

### Array-Validierung

| Keyword | Zweck | Beispiel |
|---------|-------|----------|
| `minItems` | Min. Anzahl | `"minItems": 1` |
| `maxItems` | Max. Anzahl | `"maxItems": 100` |
| `uniqueItems` | Alle unterschiedlich? | `"uniqueItems": true` |
| `items` | Struktur der Items | `"items": { "type": "string" }` |

```json
{
  "lineItems": {
    "type": "array",
    "minItems": 1,
    "maxItems": 1000,
    "items": {
      "type": "object",
      "properties": { ... }
    }
  }
}
```

### Objekt-Validierung

| Keyword | Zweck | Beispiel |
|---------|-------|----------|
| `minProperties` | Min. Anzahl Props | `"minProperties": 1` |
| `maxProperties` | Max. Anzahl Props | `"maxProperties": 50` |
| `additionalProperties` | Extra Props erlaubt? | `"additionalProperties": false` |
| `patternProperties` | Props nach Pattern | `"patternProperties": { "^x-": {} }` |
| `dependencies` | Abhängigkeiten | `"dependencies": { "credit_card": ["cvv"] }` |

```json
{
  "type": "object",
  "properties": { ... },
  "additionalProperties": false,
  "description": "Keine unbekannten Felder erlaubt"
}
```

---

## Komplexe Strukturen

### Nested Objects (Verschachtelte Objekte)

```json
{
  "type": "object",
  "properties": {
    "customer": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": {
          "type": "object",
          "properties": {
            "street": { "type": "string" },
            "city": { "type": "string" },
            "zip": { "type": "string" }
          },
          "required": ["street", "city", "zip"]
        }
      },
      "required": ["name", "address"]
    }
  }
}
```

### Array of Objects

```json
{
  "items": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "quantity": { "type": "integer" }
      },
      "required": ["id", "quantity"]
    }
  }
}
```

### Conditional Schemas (if/then/else)

```json
{
  "properties": {
    "invoiceType": { "enum": ["standard", "credit-note"] }
  },
  "if": {
    "properties": { "invoiceType": { "const": "credit-note" } }
  },
  "then": {
    "required": ["originalInvoiceNumber", "reason"]
  },
  "else": {
    "required": ["dueDate"]
  }
}
```

### Allof / OneOf / AnyOf

```json
{
  "allOf": [
    { "properties": { "name": { "type": "string" } } },
    { "required": ["name"] }
  ]
}
```

---

## Validierung & Fehlerbehandlung

### AJV Validator Setup

```typescript
import Ajv from 'ajv';

const ajv = new Ajv({
  allErrors: true,              // Sammle ALLE Fehler
  verbose: true,                // Detaillierte Fehlermeldungen
  strict: true,                 // Strenge Validierung
  ownProperties: true           // Validiere nur eigene Properties
});

// Schema laden
const schema = require('./invoice-schema.json');

// Validator compilieren
const validate = ajv.compile(schema);
```

### Validierung durchführen

```typescript
const data = {
  invoiceNumber: "INV-2026-000001",
  amount: 99.99,
  items: []  // Fehler: minItems = 1
};

const isValid = validate(data);

if (!isValid) {
  console.error('Validation Errors:', validate.errors);
  // Ausgabe:
  // [{
  //   "keyword": "minItems",
  //   "dataPath": ".items",
  //   "schemaPath": "#/properties/items/minItems",
  //   "params": { "limit": 1 },
  //   "message": "must have 1 items"
  // }]
}
```

### Fehlerstruktur verstehen

```javascript
{
  "keyword": "type",                    // Welche Regel verletzt?
  "dataPath": ".customer.age",          // Wo im Objekt?
  "schemaPath": "#/properties/customer/properties/age/type",
  "params": { "type": "string" },       // Was war erwartet?
  "message": "must be string"           // Lesbare Meldung
}
```

---

## Best Practices

### ✅ DO: Best Practices

1. **Immer $schema am Anfang**
   ```json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     ...
   }
   ```

2. **Title und Description für alle komplexen Felder**
   ```json
   {
     "invoiceNumber": {
       "type": "string",
       "title": "Rechnungsnummer",
       "description": "Eindeutige ID im Format INV-YYYY-XXXXXX"
     }
   }
   ```

3. **Pattern für Formatvalidierung**
   ```json
   {
     "phone": {
       "type": "string",
       "pattern": "^\\+?[0-9\\s-()]+$",
       "description": "Telefonnummer mit internationalem Format"
     }
   }
   ```

4. **Required Liste explizit**
   ```json
   {
     "required": ["id", "name", "amount"]
   }
   ```

5. **Examples zur Dokumentation**
   ```json
   {
     "date": {
       "type": "string",
       "format": "date",
       "examples": ["2026-07-07", "2026-12-31"]
     }
   }
   ```

### ❌ DON'T: Häufige Fehler

1. **$schema weglassen**
   ```json
   // ❌ FALSCH
   { "type": "object", ... }
   
   // ✅ RICHTIG
   { "$schema": "http://json-schema.org/draft-07/schema#", ... }
   ```

2. **Required vergessen**
   ```json
   // ❌ FALSCH
   { "properties": { "id": { "type": "string" } } }
   
   // ✅ RICHTIG
   { "properties": { "id": { "type": "string" } }, "required": ["id"] }
   ```

3. **Pattern ohne Escaping**
   ```json
   // ❌ FALSCH
   { "pattern": "^\d{4}$" }      // Wird als String interpretiert
   
   // ✅ RICHTIG
   { "pattern": "^\\d{4}$" }     // Properly escaped
   ```

4. **Keine Validierungsgrenzen**
   ```json
   // ❌ FALSCH
   { "type": "string" }           // Unbegrenzter String
   
   // ✅ RICHTIG
   { "type": "string", "maxLength": 255, "minLength": 1 }
   ```

---

## FAQ & Häufige Fehler

### Q: Kann ich mehrere Typen erlauben?
**A:** Ja, mit `type` als Array:
```json
{ "type": ["string", "number"] }
```

### Q: Wie validiere ich E-Mail Adressen?
**A:** Mit `format: "email"`:
```json
{ "type": "string", "format": "email" }
```

### Q: Können Felder optional sein?
**A:** Ja, wenn sie nicht in `required` sind:
```json
{
  "properties": { "middleName": { "type": "string" } },
  "required": ["firstName", "lastName"]  // middleName ist optional
}
```

### Q: Wie verhindere ich unbekannte Felder?
**A:** Mit `additionalProperties: false`:
```json
{
  "type": "object",
  "properties": { ... },
  "additionalProperties": false
}
```

### Q: Kann ich Validierungsfehler anpassen?
**A:** Ja, in deinem Frontend Code:
```typescript
const errors = validate.errors;
const customErrors = errors.map(e => ({
  field: e.dataPath,
  message: translateError(e)  // Benutzerdefinierte Nachricht
}));
```

---

## Cheat Sheet

### Minimales Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {},
  "required": []
}
```

### Invoice Template

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Invoice",
  "type": "object",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "pattern": "^INV-[0-9]{4}-[0-9]{6}$"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "amount": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "status": {
      "type": "string",
      "enum": ["draft", "sent", "paid"]
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 },
          "price": { "type": "number", "minimum": 0 }
        },
        "required": ["description", "quantity", "price"]
      }
    }
  },
  "required": ["invoiceNumber", "date", "amount", "items"],
  "additionalProperties": false
}
```

### Format Übersicht

```
String Formats:
- "date" → YYYY-MM-DD
- "time" → HH:mm:ss
- "date-time" → RFC 3339 (2026-07-07T14:30:00Z)
- "email" → user@example.com
- "hostname" → example.com
- "ipv4" → 192.168.1.1
- "ipv6" → 2001:db8::1
- "uri" → https://example.com/path
- "uri-reference" → /path?query=1
```

---

## Externe Ressourcen

- **Offizielle Spez**: https://json-schema.org/draft-07/
- **AJV Validator**: https://ajv.js.org/
- **Online Validator**: https://www.jsonschemavalidator.net/
- **Schema Generator**: https://jsonschema.net/

---

**Stand**: 2026-07-07 | **Phase**: 15 Schema-Driven Extraction
