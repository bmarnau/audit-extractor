# 🔄 Regelwerk-Verwaltung: Mehrere Reports mit verschiedenen Regelwerken

**Version:** 1.0.0  
**Datum:** 2026-07-08  
**Status:** 🟢 VERFÜGBAR für Phase 14 + 15  
**Zielgruppe:** Nutzer mit mehreren Report-Typen

---

## 🎯 Problem: Verschiedene Reports, verschiedene Regelwerke

### Ihre Situation
```
Sie haben mehrere Dokumenttypen:
  ├─ Rechnungen (Invoices)
  ├─ Bestellungen (POs)
  ├─ Lieferscheine (Delivery Notes)
  └─ Verträge (Contracts)

Jeder Typ hat:
  - Eigene Zielstruktur (Schema)
  - Eigene Extraktionsregeln
  - Eigene Feldnamen

Frage: Wie verwalte ich diese unterschiedlichen Regelwerke?
```

### Die Lösung
Das System kann **mehrere Regelwerke gleichzeitig laden** und je nach Report-Typ umschalten!

---

## 📁 Verzeichnis-Struktur für mehrere Regelwerke

### So sollte Ihre Struktur aussehen:

```
📦 Projekt-Root
├── 📂 extraction-rules/              ← ALLE Regelwerke hier
│   ├── invoice.json                  ← Regelwerk für Rechnungen
│   ├── purchase-order.json           ← Regelwerk für Bestellungen
│   ├── delivery-note.json            ← Regelwerk für Lieferscheine
│   ├── contract.json                 ← Regelwerk für Verträge
│   │
│   └── 📂 schemas/                   ← Zielstrukturen (Schemas)
│       ├── invoice-schema.json       ← JSON-Schema für Rechnungen
│       ├── po-schema.json            ← JSON-Schema für Bestellungen
│       ├── delivery-note-schema.json ← JSON-Schema für Lieferscheine
│       └── contract-schema.json      ← JSON-Schema für Verträge
│
├── 📂 source-documents/              ← Eingangs-Dokumente
│   ├── 📂 invoices/                  ← Rechnungen
│   │   ├── invoice-001.pdf
│   │   ├── invoice-002.html
│   │   └── invoice-003.pdf
│   ├── 📂 purchase-orders/           ← Bestellungen
│   │   ├── po-2024-001.pdf
│   │   └── po-2024-002.pdf
│   └── 📂 delivery-notes/            ← Lieferscheine
│       ├── dn-001.html
│       └── dn-002.html
│
├── 📂 results/
│   ├── 📂 invoices/                  ← Extrahierte Rechnungen
│   │   ├── invoice-001-extracted.json
│   │   └── invoice-002-extracted.json
│   ├── 📂 purchase-orders/           ← Extrahierte Bestellungen
│   │   ├── po-2024-001-extracted.json
│   │   └── ...
│   └── 📂 delivery-notes/            ← Extrahierte Lieferscheine
│       ├── dn-001-extracted.json
│       └── ...
│
└── 📂 learning/
    ├── 📂 invoice-learning/          ← Lern-Daten pro Typ
    ├── 📂 po-learning/
    └── 📂 delivery-note-learning/
```

---

## 🔧 Schritt 1: Erstellen Sie Regelwerke

### Regelwerk-Struktur

Ein Regelwerk ist eine **JSON-Datei mit Extraktionsregeln**:

```json
{
  "ruleSetId": "invoice-v1.0",
  "documentType": "invoice",
  "description": "Extraktionsregeln für Rechnungen",
  "schemaId": "invoice-schema-v1.0.0",
  "rules": [
    {
      "ruleId": "inv_number",
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "searchKeywords": ["invoice number", "invoicenumber", "inv#", "invoice#", "rechnungsnummer"],
      "pattern": "(INV|INVOICE|RGN)-[0-9]{4}-[0-9]{3,6}",
      "confidenceThreshold": 0.85,
      "description": "Eindeutige Rechnungsnummer"
    },
    {
      "ruleId": "inv_date",
      "fieldName": "invoiceDate",
      "fieldType": "date",
      "isRequired": true,
      "searchKeywords": ["invoice date", "date", "issued", "issued on", "ausgestellt am", "rechnungsdatum"],
      "pattern": "([0-3][0-9])\\.([0-1][0-9])\\.([2][0-9]{3})",
      "dateFormat": "DD.MM.YYYY",
      "confidenceThreshold": 0.80,
      "description": "Ausstellungsdatum der Rechnung"
    },
    {
      "ruleId": "inv_amount",
      "fieldName": "totalAmount",
      "fieldType": "number",
      "isRequired": true,
      "searchKeywords": ["total", "amount", "total amount", "sum", "grand total", "gesamtbetrag", "betrag"],
      "pattern": "[0-9]{1,9}[.,][0-9]{2}",
      "confidenceThreshold": 0.90,
      "description": "Gesamtbetrag der Rechnung"
    }
  ]
}
```

**Speicherort:** `extraction-rules/invoice.json`

---

### Template: Neue Regelwerke erstellen

#### Bestellungen (Purchase Orders):

```json
{
  "ruleSetId": "po-v1.0",
  "documentType": "purchase-order",
  "description": "Extraktionsregeln für Bestellungen",
  "schemaId": "po-schema-v1.0.0",
  "rules": [
    {
      "ruleId": "po_number",
      "fieldName": "poNumber",
      "fieldType": "string",
      "isRequired": true,
      "searchKeywords": ["purchase order", "po number", "po#", "order number", "bestellnummer"],
      "pattern": "(PO|ORDER)-[0-9]{4}-[0-9]{3,6}",
      "confidenceThreshold": 0.85,
      "description": "Eindeutige Bestellnummer"
    },
    {
      "ruleId": "po_date",
      "fieldName": "orderDate",
      "fieldType": "date",
      "isRequired": true,
      "searchKeywords": ["order date", "date", "bestelldatum"],
      "pattern": "([0-3][0-9])\\.([0-1][0-9])\\.([2][0-9]{3})",
      "dateFormat": "DD.MM.YYYY",
      "confidenceThreshold": 0.80
    },
    {
      "ruleId": "po_vendor",
      "fieldName": "vendor",
      "fieldType": "string",
      "isRequired": true,
      "searchKeywords": ["vendor", "supplier", "from", "lieferant"],
      "pattern": "[A-Za-z ]+",
      "confidenceThreshold": 0.75
    }
  ]
}
```

**Speicherort:** `extraction-rules/purchase-order.json`

---

#### Lieferscheine (Delivery Notes):

```json
{
  "ruleSetId": "dn-v1.0",
  "documentType": "delivery-note",
  "description": "Extraktionsregeln für Lieferscheine",
  "schemaId": "delivery-note-schema-v1.0.0",
  "rules": [
    {
      "ruleId": "dn_number",
      "fieldName": "deliveryNoteNumber",
      "fieldType": "string",
      "isRequired": true,
      "searchKeywords": ["delivery note", "dn number", "dn#", "lieferschein"],
      "pattern": "(DN|LS)-[0-9]{4}-[0-9]{3,6}",
      "confidenceThreshold": 0.85
    },
    {
      "ruleId": "dn_shipdate",
      "fieldName": "shipmentDate",
      "fieldType": "date",
      "isRequired": true,
      "searchKeywords": ["shipped", "shipment date", "shipped on", "versand", "versandt am"],
      "pattern": "([0-3][0-9])\\.([0-1][0-9])\\.([2][0-9]{3})",
      "dateFormat": "DD.MM.YYYY",
      "confidenceThreshold": 0.85
    }
  ]
}
```

**Speicherort:** `extraction-rules/delivery-note.json`

---

## 🚀 Schritt 2: Regelwerk auswählen (API)

### Programm-Code: Regelwerk laden

```typescript
import { RuleSetRepository } from './src/infrastructure/RuleSetRepository';
import { ExtractionEngine } from './src/application/ExtractionEngine';

// Repository initialisieren
const ruleRepo = new RuleSetRepository('./extraction-rules');

// 1️⃣ Regelwerk für Rechnungen laden
const invoiceRules = await ruleRepo.loadRuleSet('invoice');
console.log('✅ Invoice rules loaded:', invoiceRules.ruleSetId);

// 2️⃣ Extraktion durchführen
const invoiceResult = await extractionEngine.extract(
  pdfContent,
  invoiceRules
);

// 3️⃣ Regelwerk für Bestellungen laden
const poRules = await ruleRepo.loadRuleSet('purchase-order');
console.log('✅ PO rules loaded:', poRules.ruleSetId);

// 4️⃣ Mit anderen Regeln extrahieren
const poResult = await extractionEngine.extract(
  pdfContent,
  poRules
);
```

---

### REST API: Regelwerk umschalten

#### Verfügbare Regelwerke auflisten

```bash
GET /api/rulesets/list

Antwort:
{
  "available": [
    "invoice",
    "purchase-order",
    "delivery-note",
    "contract"
  ]
}
```

---

#### Extraktion mit spezifischem Regelwerk

```bash
POST /api/extract

Body:
{
  "document": <binary PDF oder HTML>,
  "ruleSetId": "invoice"  ← WICHTIG: Hier Regelwerk auswählen
}

Antwort:
{
  "resultId": "extraction-1720347000123-abc12345",
  "ruleSetId": "invoice",
  "documentType": "invoice",
  "extractedFields": [...]
}
```

---

#### Für Bestellungen:

```bash
POST /api/extract

Body:
{
  "document": <binary PDF>,
  "ruleSetId": "purchase-order"  ← Umschalten zu PO
}
```

---

#### Für Lieferscheine:

```bash
POST /api/extract

Body:
{
  "document": <binary HTML>,
  "ruleSetId": "delivery-note"  ← Umschalten zu Delivery Note
}
```

---

## 🎯 Schritt 3: Automatisches Regelwerk generieren (Phase 15)

> ⚠️ **Status:** Phase 15 ist noch in Planung. Hier ist der geplante Workflow.

### Schema-Wizard Workflow

```
Benutzeroberfläche:

SCHRITT 1: Dokumenttyp & Schema auswählen
┌────────────────────────────────┐
│ Welcher Report-Typ?            │
│ ☐ Invoices                     │
│ ☐ Purchase Orders              │
│ ☐ Delivery Notes               │
│ ☐ Contracts                    │
│ ☐ Custom (eigenes Schema)      │
└────────────────────────────────┘

SCHRITT 2: Schema hochladen (oder wählen)
┌────────────────────────────────┐
│ Schema hochladen               │
│ [Choose file]                  │
│ → my-invoice-schema.json       │
└────────────────────────────────┘

SCHRITT 3: Beispiel-JSONs hochladen
┌────────────────────────────────┐
│ Beispiele (optional)           │
│ [Choose file]                  │
│ → examples.zip                 │
│ ├─ invoice-001.json            │
│ ├─ invoice-002.json            │
│ └─ invoice-003.json            │
└────────────────────────────────┘

SCHRITT 4: Regelwerk generieren
┌────────────────────────────────┐
│ Generiere Regeln...            │
│ ▮▮▮▮▮▮▮▮▮▮ 75%                │
└────────────────────────────────┘

SCHRITT 5: Regelwerk speichern
┌────────────────────────────────┐
│ Speicher-Name:                 │
│ [input: invoice-custom-v1]     │
│                                │
│ [Speichern]                    │
└────────────────────────────────┘

ERGEBNIS: Regelwerk unter "invoice-custom-v1" verfügbar
```

---

### Programmcode: Regelwerk generieren (Phase 15)

```typescript
import { SchemaAnalyzer } from './src/domain/schema/SchemaAnalyzer';
import { ExampleAnalyzer } from './src/domain/schema/ExampleAnalyzer';
import { RuleGenerator } from './src/domain/rules/RuleGenerator';
import { RuleSetRepository } from './src/infrastructure/RuleSetRepository';

// 1️⃣ Schema laden
const schema = JSON.parse(fs.readFileSync('invoice-schema.json', 'utf-8'));

// 2️⃣ Beispiele laden
const examples = [
  JSON.parse(fs.readFileSync('example-001.json', 'utf-8')),
  JSON.parse(fs.readFileSync('example-002.json', 'utf-8')),
  JSON.parse(fs.readFileSync('example-003.json', 'utf-8'))
];

// 3️⃣ Schema analysieren
const schemaAnalyzer = new SchemaAnalyzer();
const schemaFields = schemaAnalyzer.analyzeSchema(schema);
console.log('📋 Analyzed schema fields:', schemaFields);

// 4️⃣ Beispiele analysieren
const exampleAnalyzer = new ExampleAnalyzer();
const characteristics = exampleAnalyzer.analyzeExamples(examples);
console.log('📊 Analyzed example characteristics:', characteristics);

// 5️⃣ Regelwerk generieren
const ruleGenerator = new RuleGenerator();
const generatedRules = ruleGenerator.generateRules(
  schemaFields,
  characteristics,
  { aggressiveness: 'balanced' }  // conservative, balanced, aggressive
);
console.log('✅ Generated rules:', generatedRules);

// 6️⃣ Regelwerk speichern
const ruleRepo = new RuleSetRepository('./extraction-rules');
await ruleRepo.saveRuleSet('invoice-custom-v1', generatedRules);
console.log('💾 Ruleset saved as: invoice-custom-v1');

// 7️⃣ Jetzt kann die Extraktion benutzt werden
const extractionEngine = new ExtractionEngine();
const result = await extractionEngine.extract(pdfContent, generatedRules);
```

---

## 📋 Checklist: Mehrere Regelwerke einrichten

### Phase 14 (Manuell):

- [ ] **Schritt 1:** Verzeichnis-Struktur aufbauen
  ```bash
  mkdir -p extraction-rules/schemas
  ```

- [ ] **Schritt 2:** Für jeden Dokumenttyp JSON-Schema erstellen
  - `extraction-rules/schemas/invoice-schema.json`
  - `extraction-rules/schemas/po-schema.json`
  - etc.

- [ ] **Schritt 3:** Für jeden Dokumenttyp Regelwerk erstellen
  - `extraction-rules/invoice.json`
  - `extraction-rules/purchase-order.json`
  - etc.

- [ ] **Schritt 4:** Dokumente in Ordner sortieren
  - `source-documents/invoices/`
  - `source-documents/purchase-orders/`
  - etc.

- [ ] **Schritt 5:** Extraktion mit API starten
  ```bash
  curl -X POST http://localhost:3000/api/extract \
    -F "document=@invoice.pdf" \
    -F "ruleSetId=invoice"
  ```

---

### Phase 15 (Automatisch):

- [ ] **Schritt 1:** Schema hochladen → System generiert Regelwerk
- [ ] **Schritt 2:** Beispiel-JSONs hochladen (Optional, empfohlen)
- [ ] **Schritt 3:** Auf "Generate Rules" klicken
- [ ] **Schritt 4:** Regelwerk wird gespeichert & kann sofort verwendet werden

---

## 🔍 Troubleshooting: Regelwerk-Probleme

### Problem: "Regelwerk nicht gefunden"

```
Fehler: RuleSet 'invoice' not found
```

**Lösung:**
1. Prüfen Sie, ob `extraction-rules/invoice.json` existiert
2. Prüfen Sie die Schreibweise (case-sensitive!)
3. Starten Sie den Server neu

```bash
ls extraction-rules/
# Sollte zeigen: invoice.json, purchase-order.json, etc.
```

---

### Problem: "Falsche Regeln für Dokumenttyp"

```
Document ist eine Bestellung (PO), aber wird als Rechnung (Invoice) extrahiert
```

**Lösung:**
1. Stellen Sie sicher, dass Sie das richtige Regelwerk auswählen
2. Prüfen Sie, ob die Dokumenttypen in der API korrekt unterschieden werden

```bash
# Falsch:
curl -X POST http://localhost:3000/api/extract \
  -F "document=@po.pdf" \
  -F "ruleSetId=invoice"  # ❌ FALSCH!

# Richtig:
curl -X POST http://localhost:3000/api/extract \
  -F "document=@po.pdf" \
  -F "ruleSetId=purchase-order"  # ✅ RICHTIG!
```

---

### Problem: "Regeln generieren nicht automatisch"

> Das ist normal! Phase 15 (Auto-Generation) ist noch in Planung.
> Aktuell müssen Sie Regelwerke manuell erstellen.

**Workaround:**
1. Erstellen Sie eine Vorlage basierend auf bestehendem Regelwerk
2. Kopieren & anpassen Sie die Regeln
3. Testen Sie mit Beispiel-Dokumenten

---

## 📚 Weitere Ressourcen

- [JSON-Schema Struktur Guide](./SCHEMA-STRUCTURE-GUIDE.md)
- [Phase 15 User Guide](./PHASE-15-USER-GUIDE.md)
- [Multi-Report Analyse](../MULTI_REPORT_RULESET_ANALYSIS.md)
- [Regelwerk-Beispiele](../extraction-rules/)

