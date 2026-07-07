# extraction-rules/schemas/

Speichert komplette Schema-Definitionen für verschiedene Dokumenttypen.

## Zweck

Ein Schema ist ein Satz von Rules, die zusammen die Struktur für einen Dokumenttyp definieren.

## Struktur

```
schemas/
├── invoice.json        # Alle Rules für Rechnungen
├── contract.json       # Alle Rules für Verträge
├── purchase-order.json # Alle Rules für Bestellungen
└── README.md          # Diese Datei
```

## Beispiel: invoice.json

```json
[
  {
    "ruleId": "invoice-001",
    "fieldName": "invoiceNumber",
    "fieldType": "string",
    "isRequired": true,
    "documentTypes": ["pdf"]
  },
  {
    "ruleId": "invoice-002",
    "fieldName": "invoiceDate",
    "fieldType": "date",
    "isRequired": true,
    "documentTypes": ["pdf"]
  },
  {
    "ruleId": "invoice-003",
    "fieldName": "customerName",
    "fieldType": "string",
    "isRequired": true,
    "documentTypes": ["pdf"]
  },
  {
    "ruleId": "invoice-004",
    "fieldName": "totalAmount",
    "fieldType": "number",
    "isRequired": true,
    "documentTypes": ["pdf"]
  }
]
```

## Verwendung

```typescript
import { RuleSetRepository } from '@infrastructure/RuleSetRepository';

const ruleRepo = new RuleSetRepository('./extraction-rules');
const invoiceRules = ruleRepo.loadRuleSet('invoice');

// invoiceRules = [ { ruleId: 'invoice-001', ... }, ... ]
```

## Versionierung

Schemas folgen SemanticVersioning. Die aktuelle Version wird in `package.json` oder in den Metadaten definiert.

---

**Letzte Aktualisierung**: 2026-01-15
