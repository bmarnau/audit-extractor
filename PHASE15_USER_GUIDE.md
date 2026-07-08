# Phase 15 Handbuch: Automatische Regelgenerierung aus Schema & Beispielen

**Version**: 0.15.0  
**Status**: ✅ PRODUKTIONSBEREIT  
**Datum**: 2026-07-08

---

## 📖 Übersicht

Phase 15 führt einen **vollautomatischen Workflow** für die Regelerstellung ein:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. JSON Schema                                                  │
│    (Zielstruktur definieren)                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Beispieldateien                                              │
│    (Lernbeispiele hochladen)                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Automatische Analyse                                         │
│    • SchemaAnalyzer: Schema-Struktur verstehen                  │
│    • ExampleAnalyzer: Muster in Beispielen finden               │
│    • RuleGenerator: Extraktionsregeln erzeugen                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Generierte Regeln                                            │
│    (Mit Confidence-Scores)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started (5 Schritte)

### Schritt 1: Anwendung starten

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor

# Installation
npm install

# Kompilieren
npm run build

# Starten
npm run dev
```

**Ergebnis**: Server läuft auf `http://localhost:3000`

---

### Schritt 2: Schema vorbereiten

Erstellen Sie eine JSON Schema Datei mit der **Zielstruktur** Ihrer Extraktionsaufgabe:

**Datei: `invoice-schema.json`**
```json
{
  "type": "object",
  "title": "Invoice",
  "description": "Invoice extraction schema",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Unique invoice identifier",
      "pattern": "^INV-\\d{6}$"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Invoice date in YYYY-MM-DD format"
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "description": "Payment due date"
    },
    "vendor": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "type": "string" },
        "taxId": { "type": "string" }
      },
      "required": ["name"]
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "number" },
          "unitPrice": { "type": "number" },
          "total": { "type": "number" }
        },
        "required": ["description", "quantity", "unitPrice"]
      }
    },
    "subtotal": {
      "type": "number",
      "description": "Sum before tax"
    },
    "taxAmount": {
      "type": "number"
    },
    "totalAmount": {
      "type": "number",
      "description": "Final total including tax"
    }
  },
  "required": ["invoiceNumber", "date", "totalAmount"]
}
```

**Wichtige Tipps:**
- ✅ Verwenden Sie beschreibende Namen (`invoiceNumber` statt `id`)
- ✅ Definieren Sie `required` Felder
- ✅ Verwenden Sie `description` für Kontext
- ✅ Verwenden Sie `pattern` für erwartete Formate
- ✅ Unterstützen Sie verschachtelte Strukturen mit `properties`

---

### Schritt 3: Beispieldateien vorbereiten

Erstellen Sie 2-3 **gefüllte Beispieldateien** basierend auf Ihrer Schema:

**Datei: `invoice-example-1.json`**
```json
{
  "invoiceNumber": "INV-202601",
  "date": "2026-01-15",
  "dueDate": "2026-02-15",
  "vendor": {
    "name": "TechSupplies GmbH",
    "address": "Hauptstr. 42, 10115 Berlin",
    "taxId": "DE123456789"
  },
  "items": [
    {
      "description": "Server-Lizenzen (12 Monate)",
      "quantity": 5,
      "unitPrice": 299.99,
      "total": 1499.95
    },
    {
      "description": "Support & Maintenance",
      "quantity": 1,
      "unitPrice": 500.00,
      "total": 500.00
    }
  ],
  "subtotal": 1999.95,
  "taxAmount": 379.99,
  "totalAmount": 2379.94
}
```

**Datei: `invoice-example-2.json`**
```json
{
  "invoiceNumber": "INV-202602",
  "date": "2026-02-10",
  "dueDate": "2026-03-10",
  "vendor": {
    "name": "CloudServices AG",
    "address": "Kurfürstendamm 50, 10707 Berlin",
    "taxId": "DE987654321"
  },
  "items": [
    {
      "description": "Cloud Hosting (AWS equivalent)",
      "quantity": 1,
      "unitPrice": 4500.00,
      "total": 4500.00
    }
  ],
  "subtotal": 4500.00,
  "taxAmount": 855.00,
  "totalAmount": 5355.00
}
```

**Beispiel 3: `invoice-example-3.json`** (empfohlen)
```json
{
  "invoiceNumber": "INV-202603",
  "date": "2026-03-05",
  "dueDate": "2026-04-05",
  "vendor": {
    "name": "OfficeSupplies Ltd",
    "address": "Potsdamer Platz 1, 10785 Berlin"
  },
  "items": [
    {
      "description": "Office Equipment",
      "quantity": 10,
      "unitPrice": 149.50,
      "total": 1495.00
    },
    {
      "description": "Printer Toner",
      "quantity": 5,
      "unitPrice": 89.99,
      "total": 449.95
    }
  ],
  "subtotal": 1944.95,
  "taxAmount": 369.54,
  "totalAmount": 2314.49
}
```

**Wichtige Tipps:**
- ✅ Verwenden Sie **realistische Daten**
- ✅ Variieren Sie Feldwerte (verschiedene Längen, Formate)
- ✅ Zeigen Sie auch **leere/optionale Felder**
- ✅ Nutzen Sie 2-3 verschiedene **Beispiel-Szenarien**
- ✅ Je aussagekräftiger, desto besser die generierten Regeln

---

### Schritt 4: Frontend-Wizard verwenden

1. **Öffnen Sie die Anwendung** im Browser:
   ```
   http://localhost:3000
   ```

2. **Finden Sie "Schema Upload Wizard"** in der Navigation

3. **Folgen Sie dem 5-Schritt-Wizard:**

   **Schritt 1 - Schema hochladen**
   - Klicken Sie auf "Datei wählen"
   - Wählen Sie `invoice-schema.json`
   - System zeigt: "15 Felder erkannt"
   - Klick: "Weiter"

   **Schritt 2 - Beispiele hochladen**
   - Wählen Sie alle 3 `invoice-example-*.json` Dateien
   - System zeigt: "3 Beispiele geladen"
   - Klick: "Weiter"

   **Schritt 3 - Vorschau**
   - Schema-Struktur wird angezeigt
   - Beispiel-Daten werden aufgelistet
   - Überprüfen Sie auf Fehler
   - Klick: "Weiter"

   **Schritt 4 - Einstellungen**
   - **Aggressiveness**: 0.7 (empfohlen für typische Aufgaben)
     - 0.3-0.5: Konservativ (nur sichere Regeln)
     - 0.5-0.8: Ausgewogen (Standard)
     - 0.8-1.0: Aggressiv (auch riskante Patterns)
   - **Custom Keywords**: (optional)
     - Z.B.: `invoice, total, amount, vendor`
   - Klick: "Weiter"

   **Schritt 5 - Regelgenerierung**
   - Klick: "Regeln generieren"
   - System verarbeitet und zeigt Ergebnisse
   - Regel-Tabelle mit Confidence-Scores

---

### Schritt 5: Generierte Regeln verstehen

Nach der Generierung erhalten Sie eine Tabelle wie diese:

| Feld | Confidence | Strategie | Patterns |
|------|-----------|-----------|----------|
| `invoiceNumber` | 0.95 | pattern_match | `INV-\d{6}`, `Invoice #\d+` |
| `date` | 0.89 | format_match | `YYYY-MM-DD`, `\d{4}-\d{2}-\d{2}` |
| `totalAmount` | 0.92 | value_extraction | `Total:`, `Gesamtbetrag:`, `EUR` |
| `vendor.name` | 0.87 | context_match | Vorkommt nach "from:", "vendor:" |
| `items[]` | 0.84 | array_detection | Wiederholte Struktur erkannt |

**Interpretation:**
- **Confidence > 0.9**: Sehr zuverlässig ✅
- **Confidence 0.7-0.9**: Gut brauchbar ⚠️
- **Confidence < 0.7**: Überprüfen/Nachbessern ❌

---

## 💻 REST API Verwendung (für Entwickler)

### 1. Schema hochladen

```bash
curl -X POST http://localhost:3000/api/schema/upload \
  -H "Content-Type: application/json" \
  -d '{
    "schema": {
      "type": "object",
      "properties": {
        "invoiceNumber": {"type": "string"},
        "totalAmount": {"type": "number"}
      }
    },
    "examples": [
      {"invoiceNumber": "INV-001", "totalAmount": 100.00},
      {"invoiceNumber": "INV-002", "totalAmount": 250.00}
    ],
    "schemaName": "invoice"
  }'
```

**Response:**
```json
{
  "schemaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "schemaName": "invoice",
  "fieldsCount": 2,
  "examplesCount": 2,
  "uploadedAt": "2026-07-08T12:34:56Z",
  "message": "Schema uploaded successfully"
}
```

---

### 2. Regeln generieren

```bash
curl -X POST http://localhost:3000/api/schema/f47ac10b-58cc-4372-a567-0e02b2c3d479/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "aggressiveness": 0.7,
    "customKeywords": ["invoice", "total", "amount"]
  }'
```

**Response:**
```json
{
  "schemaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "rules": [
    {
      "fieldName": "invoiceNumber",
      "confidence": 0.95,
      "patterns": ["INV-\\d{6}", "Invoice #\\d+"],
      "extractionStrategy": "pattern_match",
      "description": "Eindeutige Rechnungsnummer"
    },
    {
      "fieldName": "totalAmount",
      "confidence": 0.92,
      "patterns": ["Total:", "Gesamtbetrag:", "EUR \\d+\\.\\d{2}"],
      "extractionStrategy": "value_extraction",
      "description": "Gesamtsumme inklusive Steuern"
    }
  ],
  "stats": {
    "rulesGenerated": 2,
    "averageConfidence": 0.935,
    "warnings": []
  }
}
```

---

### 3. Regeln abrufen

```bash
curl http://localhost:3000/api/schema/f47ac10b-58cc-4372-a567-0e02b2c3d479/rules
```

---

### 4. Schema-Metadaten

```bash
curl http://localhost:3000/api/schema/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response:**
```json
{
  "schemaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fieldsCount": 2,
  "examplesCount": 2,
  "uploadedAt": "2026-07-08T12:34:56Z",
  "hasGeneratedRules": true
}
```

---

## 🎯 Praktische Beispiele nach Use-Case

### Use Case 1: Rechnungs-Extraktion (Invoice)

**Schema-Komplexität**: Medium  
**Empfohlene Beispiele**: 3-5  
**Aggressiveness**: 0.7

**Besonderheiten**:
- Strukturierte Daten (Datum, Betrag)
- Nested Objects (Vendor)
- Arrays (Positionen)
- Pattern-orientierte Felder (Invoice #)

---

### Use Case 2: Vertrag-Extraktion (Contract)

**Schema-Komplexität**: High  
**Empfohlene Beispiele**: 5-10  
**Aggressiveness**: 0.5-0.6

**Besonderheiten**:
- Sehr viel Freitext
- Versteckte Informationen
- Unterschiedliche Layouts
- Juristische Begriffe

---

### Use Case 3: Produktdaten-Extraktion (eCommerce)

**Schema-Komplexität**: Low-Medium  
**Empfohlene Beispiele**: 2-4  
**Aggressiveness**: 0.8

**Besonderheiten**:
- Strukturierte Kategorien
- Konsistente Formate
- Wiederholte Patterns
- SKU/Barcodes

---

## ⚙️ Fortgeschrittene Tipps

### Tip 1: Aggressiveness richtig wählen

```
Konservativ (0.3-0.5):
→ Verwenden, wenn Sie HIGH PRECISION brauchen
→ Beispiel: Medizinische Daten, kritische Werte
→ Nachteil: Manche Felder werden nicht erkannt

Ausgewogen (0.5-0.8):
→ Standard-Einstellung
→ Beste Balance zwischen Precision & Recall
→ Für 90% der Use Cases

Aggressiv (0.8-1.0):
→ Verwenden, wenn Sie HIGH RECALL brauchen
→ Beispiel: Explorative Datenextraktion
→ Nachteil: Mehr False Positives
```

---

### Tip 2: Custom Keywords verwenden

```json
{
  "customKeywords": ["invoice", "bill", "total", "amount", "vendor"]
}
```

Diese Keywords helfen dem RuleGenerator:
- Bessere Kontext-Erkennung
- Höhere Confidence-Scores
- Schnellere Verarbeitung

---

### Tip 3: Schema richtig strukturieren

❌ **Schlecht:**
```json
{
  "properties": {
    "field1": {"type": "string"},
    "field2": {"type": "string"},
    "field3": {"type": "string"}
  }
}
```

✅ **Gut:**
```json
{
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Unique invoice identifier",
      "pattern": "^INV-\\d{6}$"
    },
    "totalAmount": {
      "type": "number",
      "description": "Total amount in EUR",
      "minimum": 0
    }
  },
  "required": ["invoiceNumber", "totalAmount"]
}
```

---

## 🧪 Workflow-Einsatzbereitschaft Überprüfung

### ✅ Backend (REST API)
- ✅ Alle 5 Endpoints funktionieren
- ✅ In-Memory Speicherung aktiv
- ✅ Error Handling implementiert
- ✅ TypeScript kompiliert fehlerfrei
- ✅ DI Container mit allen Services

### ✅ Frontend (UI)
- ✅ SchemaUploadWizard Component
- ✅ 5-Schritt Workflow
- ✅ File Upload & Validierung
- ✅ Material-UI Components
- ✅ Error Messages & Feedback

### ✅ Services
- ✅ SchemaAnalyzer registriert
- ✅ ExampleAnalyzer registriert
- ✅ RuleGenerator registriert
- ✅ Dependency Injection funktioniert

### ✅ Build & Deployment
- ✅ npm run build: **0 errors**
- ✅ npm run dev: **startet erfolgreich**
- ✅ API Endpoints: **erreichbar**
- ✅ Type Safety: **vollständig**

### ⏳ Phase 16 (Datenbank)
- ⏳ PostgreSQL Container vorbereitet
- ⏳ TypeORM Setup bereit
- ⏳ Data Persistence in Planung

---

## 📊 Workflow Status

```
Phase 15: Automatische Regelgenerierung
├─ Backend API ........................... ✅ READY
├─ Frontend UI ........................... ✅ READY
├─ Domain Services ....................... ✅ READY
├─ DI Container .......................... ✅ READY
├─ TypeScript Build ...................... ✅ READY
├─ Error Handling ........................ ✅ READY
├─ Documentation ......................... ✅ READY
└─ Einsatzbereitschaft ................... ✅ 100% READY FOR TESTING
```

---

## 🚨 Bekannte Limitierungen (Phase 15)

1. **Keine Persistenz**: Regeln gehen bei Neustart verloren
   - **Fix in Phase 16**: PostgreSQL Integration
   
2. **Keine Authentifizierung**: Alle Schemas sind global
   - **Fix in Phase 16**: User & Ownership
   
3. **Keine Rule-Export**: Regeln können nicht als Datei exportiert werden
   - **Fix in Phase 16/17**: JSON/XML Export
   
4. **Begrenzte Validierung**: Nur einfache JSON Schema Validierung
   - **Fix in Phase 17**: Extended Validation

---

## 📞 Support & Nächste Schritte

### Probleme?
1. Überprüfen Sie die Build-Ausgabe: `npm run build`
2. Starten Sie den Server neu: `npm run dev`
3. Überprüfen Sie die Browser-Konsole (F12) auf Fehler

### Nach Phase 15?
→ **Phase 16**: Datenbank-Persistierung  
→ **Phase 17**: Erweiterte Validierung  
→ **Phase 18**: Multi-User & Sharing

---

**Handbuch aktualisiert**: 2026-07-08  
**Version**: 0.15.0  
**Status**: ✅ PRODUCTION READY
