# 📋 JSON-Schema Struktur: Vollständige Anleitung

**Version:** 1.0.0  
**Datum:** 2026-07-08  
**Status:** 🟢 VERFÜGBAR (Für Phase 15 + Phase 14)

---

## 🎯 Überblick: Was ist ein Schema?

Ein **JSON-Schema** beschreibt die **Zielstruktur** Ihrer Daten:

```
Sie haben:  PDF/HTML-Dokument
Sie wollen: JSON mit bestimmter Struktur
Schema sagt: "So sollte die JSON aussehen"
```

### Beispiel
```
Dokument:      "RECHNUNG INV-2024-001 vom 06.07.2024, Betrag 1.500€"
                ↓ (Extraktion mit Schema)
Schema sagt:   "Du sollst extrahieren: Nummer, Datum, Betrag"
                ↓ (System generiert Regelwerk)
Ergebnis:      { invoiceNumber: "INV-2024-001", date: "2024-07-06", amount: 1500 }
```

---

## 📐 Schema-Format: JSON-Schema Draft 7

Das System verwendet **JSON-Schema Draft 7** Standard. Hier sind die wichtigsten Elemente:

### Minimales Schema (Basis-Beispiel)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Invoice",
  "description": "Rechnungsdokument",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Eindeutige Rechnungsnummer"
    },
    "amount": {
      "type": "number",
      "description": "Gesamtbetrag in EUR"
    }
  },
  "required": ["invoiceNumber", "amount"]
}
```

**Was bedeutet das?**
- `$schema`: Welche Schema-Version wird verwendet
- `type`: "object" = ein JSON-Objekt
- `title`: Menschenlesbarer Name
- `description`: Erklärung für das System
- `properties`: Die einzelnen Felder und ihre Typen
- `required`: Diese Felder MÜSSEN vorhanden sein

---

## 🔍 Detaillierte Feld-Definitionen

### 1. STRING-Felder (Text)

```json
"invoiceNumber": {
  "type": "string",
  "description": "Rechnungsnummer (z.B. INV-2024-001)",
  "pattern": "^INV-[0-9]{4}-[0-9]{3}$",
  "minLength": 12,
  "maxLength": 20
}
```

**Optionen:**
| Option | Bedeutung | Beispiel |
|--------|-----------|----------|
| `pattern` | Regex-Pattern für Format-Validierung | `"^INV-[0-9]{4}-[0-9]{3}$"` |
| `minLength` | Minimum Zeichenlänge | `12` |
| `maxLength` | Maximum Zeichenlänge | `20` |
| `enum` | Nur diese Werte erlaubt | `["draft", "final", "sent"]` |
| `format` | Spezial-Formate | `"email"`, `"date"`, `"time"`, `"uri"` |

**Prakische Beispiele:**

```json
"customerEmail": {
  "type": "string",
  "format": "email",
  "description": "E-Mail-Adresse des Kunden"
}
```

```json
"status": {
  "type": "string",
  "enum": ["draft", "sent", "paid", "overdue"],
  "description": "Aktueller Rechnungsstatus"
}
```

```json
"invoiceDate": {
  "type": "string",
  "format": "date",
  "description": "Ausstellungsdatum (Format: YYYY-MM-DD)"
}
```

### 2. NUMBER-Felder (Zahlen)

```json
"totalAmount": {
  "type": "number",
  "description": "Gesamtbetrag in EUR",
  "minimum": 0.01,
  "maximum": 999999.99,
  "multipleOf": 0.01
}
```

**Optionen:**
| Option | Bedeutung | Beispiel |
|--------|-----------|----------|
| `minimum` | Minimaler Wert | `0.01` |
| `maximum` | Maximaler Wert | `999999.99` |
| `exclusiveMinimum` | Ausschluss von Minimum | `true` |
| `exclusiveMaximum` | Ausschluss von Maximum | `true` |
| `multipleOf` | Wert muss Vielfaches sein | `0.01` (nur 2 Dezimalen) |

**Praktische Beispiele:**

```json
"quantity": {
  "type": "integer",
  "description": "Menge (ganze Zahl)",
  "minimum": 1
}
```

```json
"taxRate": {
  "type": "number",
  "description": "Steuersatz in Prozent",
  "minimum": 0,
  "maximum": 100,
  "multipleOf": 0.01
}
```

### 3. BOOLEAN-Felder (Ja/Nein)

```json
"isPaid": {
  "type": "boolean",
  "description": "Wurde die Rechnung bezahlt?"
}
```

### 4. ARRAY-Felder (Listen)

```json
"items": {
  "type": "array",
  "description": "Liste der Rechnungspositionen",
  "minItems": 1,
  "maxItems": 100,
  "items": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Positionsname"
      },
      "price": {
        "type": "number",
        "description": "Einzelpreis in EUR",
        "minimum": 0
      },
      "quantity": {
        "type": "integer",
        "description": "Menge",
        "minimum": 1
      }
    },
    "required": ["name", "price", "quantity"]
  }
}
```

**Optionen:**
| Option | Bedeutung | Beispiel |
|--------|-----------|----------|
| `minItems` | Minimum Array-Elemente | `1` |
| `maxItems` | Maximum Array-Elemente | `100` |
| `items` | Schema für Array-Elemente | `{ "type": "object", ... }` |
| `uniqueItems` | Alle Elemente müssen unique sein | `true` |

### 5. OBJECT-Felder (Verschachtelung)

```json
"vendor": {
  "type": "object",
  "description": "Anbieter-Informationen",
  "properties": {
    "name": {
      "type": "string",
      "description": "Firmennamen"
    },
    "address": {
      "type": "string",
      "description": "Adresse"
    },
    "taxId": {
      "type": "string",
      "pattern": "^[A-Z]{2}[0-9]{10,12}$",
      "description": "Umsatzsteuer-ID"
    }
  },
  "required": ["name", "address"]
}
```

---

## 📝 Vollständiges Beispiel: Invoice-Schema

Hier ist ein **komplettes, produktives Schema** für Rechnungsextraktion:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Invoice Document",
  "description": "Komplette Rechnungsstruktur für automatische Extraktion",
  "properties": {
    "metadata": {
      "type": "object",
      "description": "Metadaten über die Rechnung",
      "properties": {
        "invoiceNumber": {
          "type": "string",
          "description": "Eindeutige Rechnungsnummer (z.B. INV-2024-001)",
          "pattern": "^(INV|INVOICE|RGN)-[0-9]{4}-[0-9]{3,6}$"
        },
        "invoiceDate": {
          "type": "string",
          "format": "date",
          "description": "Ausstellungsdatum (YYYY-MM-DD)"
        },
        "dueDate": {
          "type": "string",
          "format": "date",
          "description": "Fälligkeitsdatum (YYYY-MM-DD)"
        },
        "status": {
          "type": "string",
          "enum": ["draft", "sent", "overdue", "paid"],
          "description": "Rechnungsstatus"
        }
      },
      "required": ["invoiceNumber", "invoiceDate"]
    },
    "vendor": {
      "type": "object",
      "description": "Rechnungssteller (Verkäufer)",
      "properties": {
        "name": {
          "type": "string",
          "description": "Firmenname"
        },
        "address": {
          "type": "string",
          "description": "Postadresse"
        },
        "email": {
          "type": "string",
          "format": "email",
          "description": "Kontakt-E-Mail"
        },
        "taxId": {
          "type": "string",
          "description": "Umsatzsteuer-Identifikationsnummer"
        }
      },
      "required": ["name", "address"]
    },
    "customer": {
      "type": "object",
      "description": "Rechnungsempfänger (Käufer)",
      "properties": {
        "name": {
          "type": "string",
          "description": "Kundenname"
        },
        "address": {
          "type": "string",
          "description": "Lieferadresse"
        },
        "email": {
          "type": "string",
          "format": "email",
          "description": "Kontakt-E-Mail"
        },
        "customerId": {
          "type": "string",
          "description": "Kundennummer"
        }
      },
      "required": ["name"]
    },
    "items": {
      "type": "array",
      "description": "Rechnungspositionen",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "description": "Positionsbeschreibung (Produkt/Service)"
          },
          "quantity": {
            "type": "number",
            "description": "Menge",
            "minimum": 0.01
          },
          "unit": {
            "type": "string",
            "description": "Einheit (z.B. St., h, kg)",
            "enum": ["St.", "h", "kg", "m", "l", "Pkg"]
          },
          "unitPrice": {
            "type": "number",
            "description": "Einzelpreis in EUR",
            "minimum": 0
          },
          "totalPrice": {
            "type": "number",
            "description": "Gesamtpreis (quantity * unitPrice)",
            "minimum": 0
          },
          "taxRate": {
            "type": "number",
            "description": "Steuersatz in Prozent",
            "minimum": 0,
            "maximum": 100
          }
        },
        "required": ["description", "quantity", "unitPrice"]
      }
    },
    "totals": {
      "type": "object",
      "description": "Summenwerte",
      "properties": {
        "subtotal": {
          "type": "number",
          "description": "Gesamtbetrag vor Steuern",
          "minimum": 0
        },
        "taxAmount": {
          "type": "number",
          "description": "Gesamtsteuerbetrag",
          "minimum": 0
        },
        "totalAmount": {
          "type": "number",
          "description": "Gesamtbetrag (inklusive Steuern)",
          "minimum": 0
        }
      },
      "required": ["totalAmount"]
    },
    "paymentTerms": {
      "type": "string",
      "description": "Zahlungsbedingungen (z.B. '14 Tage Netto', '2% Skonto bei Zahlung in 7 Tagen')"
    },
    "notes": {
      "type": "string",
      "description": "Zusätzliche Hinweise oder Fußnoten"
    },
    "attachments": {
      "type": "array",
      "description": "Liste von Anlagen/Referenzen",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["metadata", "vendor", "customer", "items", "totals"]
}
```

---

## 🚀 Wie verwende ich ein Schema?

### Phase 14 (Manueller Prozess)
1. Speicher Schema in: `extraction-rules/schemas/invoice.json`
2. Referenziere in Regelwerk: `extraction-rules/invoice.json`
3. System nutzt Schema zur **Validierung**

### Phase 15 (Automatische Generierung)
1. Lade Schema hoch → System analysiert es
2. Lade Beispiel-JSONs → System lernt Patterns
3. System **generiert Regelwerk automatisch**
4. Extraktion läuft mit generierten Regeln

---

## 💡 Best Practices für Schema-Design

### ✅ DO: Klare Beschreibungen

```json
"invoiceNumber": {
  "type": "string",
  "description": "Eindeutige Rechnungsnummer im Format INV-YYYY-###"
  // ✅ GUT: System kann daraus Keywords generieren
}
```

### ❌ DON'T: Zu allgemeine Beschreibungen

```json
"field": {
  "type": "string",
  "description": "Eine Art Identifikator"
  // ❌ SCHLECHT: Zu vage für automatische Generierung
}
```

### ✅ DO: Pattern für strukturierte Daten

```json
"taxId": {
  "type": "string",
  "pattern": "^[A-Z]{2}[0-9]{10,12}$",
  "description": "Umsatzsteuer-Identifikationsnummer (DE123456789)"
}
```

### ✅ DO: Enum für begrenzte Werte

```json
"status": {
  "type": "string",
  "enum": ["draft", "sent", "paid"],
  "description": "Rechnungsstatus"
}
```

### ✅ DO: Nested Objects für komplexe Strukturen

```json
"vendor": {
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "type": "string" }
  }
}
// ✅ GUT: Klare Hierarchie
```

### ❌ DON'T: Zu flache Struktur

```json
"vendorName": { "type": "string" },
"vendorAddress": { "type": "string" },
"vendorEmail": { "type": "string" }
// ❌ SCHLECHT: Sollte verschachtelt sein
```

---

## 🔗 Referenzen & Links

- **JSON-Schema Official**: https://json-schema.org/draft-07/
- **Projekt-Schema-Referenz**: [JSON-SCHEMA-DRAFT-07-REFERENCE.md](./JSON-SCHEMA-DRAFT-07-REFERENCE.md)
- **Phase 15 Implementierung**: [PHASE-15-USER-GUIDE.md](./PHASE-15-USER-GUIDE.md)
- **Multi-Report Analyse**: [../MULTI_REPORT_RULESET_ANALYSIS.md](../MULTI_REPORT_RULESET_ANALYSIS.md)

---

## 📞 FAQ

### F: Kann ich mein Schema selbst schreiben?
**A:** Ja! Nutzen Sie diesen Guide oder eine Vorlage. Tools wie https://jsonschema.net können helfen.

### F: Muss ich Pattern definieren?
**A:** Nein, aber es hilft dem System bei Extraktion. Optional, aber empfohlen.

### F: Kann ich verschiedene Dokumenttypen mischen?
**A:** Ja, mit `type: "object"` und verschachtelten `properties`. Siehe Beispiel oben.

### F: Wie validiere ich mein Schema?
**A:** Nutzen Sie einen online Validator wie https://www.jsonschemavalidator.net/

