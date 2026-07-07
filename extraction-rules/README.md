# extraction-rules/

Speichert die Extraktions-Regeln und Schemas, die definieren, WAS extrahiert werden soll.

## Wichtig

**Rules sind NICHT datengenerierend!**

Rules definieren:
- ✅ Welche Felder gesucht werden
- ✅ Welcher Typ diese Felder haben
- ✅ Welche Constraints gelten (Länge, Pattern, etc.)

Rules definieren NICHT:
- ❌ Werte erfinden
- ❌ Fehlende Daten ergänzen
- ❌ Implizite Annahmen

## Struktur

```
extraction-rules/
├── README.md            # Diese Datei
├── schemas/             # Schema-Definitionen
│   ├── invoice.json
│   ├── contract.json
│   └── purchase-order.json
├── invoice.json         # Komplett
├── contract.json        # Komplett
└── purchase-order.json  # Komplett
```

## Beispiel-Rule

```json
[
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
]
```

## Versioning

```
invoice.json
├── v1.0.0 → Initial release
├── v1.1.0 → Added optional field "department"
└── v2.0.0 → Removed "legacyId" (Breaking!)
```

Folge SemanticVersioning:
- **MAJOR**: Breaking changes (neue required Felder)
- **MINOR**: Neue optionale Features
- **PATCH**: Bug-Fixes und Optimierungen

## Rule-Typen

| Typ | Beispiel | Validierung |
|-----|----------|------------|
| string | "Meyer GmbH" | minLength, maxLength, pattern |
| number | 15750.50 | min, max, precision |
| date | "2024-01-15" | format (ISO 8601) |
| boolean | true | - |
| array | [...] | minItems, maxItems |
| object | {...} | nested validation |

## Best Practices

1. **Eine Rule pro Feld**: Nicht mehrere Rules für ein Feld kombinieren
2. **Aussagekräftige IDs**: `invoice-rule-001` statt `rule-1`
3. **Beschreibung**: Jede Rule muss eine aussagekräftige Beschreibung haben
4. **Constraints**: Immer Constraints definieren, auch wenn optional
5. **DocumentTypes**: Spezifizieren, welche Dokumenttypen diese Rule betreffen

## Deployment

```bash
# Rule validieren
npm run validate-rules

# Rule testen
npm run test-rules

# Rule deployen
npm run deploy-rules:production
```

## Archiv

Alte Versionen werden archiviert in `extraction-rules/archive/`.

---

**Letzte Aktualisierung**: 2026-01-15  
**Verantwortung**: Rules & Schema Team
