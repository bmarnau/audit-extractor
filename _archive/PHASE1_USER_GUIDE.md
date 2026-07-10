# 📖 PHASE 1 - Benutzer-Leitfaden

**Wie man automatische Regelwerk-Generierung nutzt**

---

## 🎯 Quick Start (5 Minuten)

### 1. Vorbereitung: Ihre Daten sammeln

Für jeden Report brauchen Sie **3 Dinge**:

```
Beispiel: Invoice Report

1. JSON Schema (Zielstruktur)
   ├─ Feldnamen definieren
   ├─ Feldtypen festlegen
   └─ Required/Optional markieren

2. JSON Beispieldaten (Training)
   ├─ Mit realistischen Werten gefüllt
   └─ Zeigt System was gesucht wird

3. Original-Dokument (optional)
   ├─ PDF oder HTML
   └─ Für Pattern-Validierung
```

### 2. Dateien vorbereiten

```
extraction-rules/examples/
├── invoice-example.json      ← Ihre Beispieldaten
├── po-example.json
└── contract-example.json

extraction-rules/schemas/
├── invoice-schema-v1.0.0.json  ← Ihre Zielstruktur
├── po-schema-v1.0.0.json
└── contract-schema-v1.0.0.json
```

### 3. Ruleset generieren

```typescript
import { ExampleDataLoader } from '@application/generation/ExampleDataLoader';
import { PatternInferrer } from '@application/generation/PatternInferrer';
import { RuleGenerator } from '@application/generation/RuleGenerator';

// 1. Komponenten initialisieren
const exampleLoader = new ExampleDataLoader({
  examplesDir: './extraction-rules/examples'
});
const patternInferrer = new PatternInferrer();
const ruleGenerator = new RuleGenerator(exampleLoader, patternInferrer);

// 2. Ruleset generieren
const result = await ruleGenerator.generate({
  reportName: 'invoice',
  schema: invoiceSchema,
  exampleDataSource: { name: 'invoice-example' },
  version: '1.0.0'
});

// 3. Ergebnis verwenden
if (result.success) {
  console.log(`✅ ${result.rules.length} Rules generiert`);
  console.log(`📊 Average Confidence: ${result.averageConfidence}`);
  
  // Regeln speichern/verwenden
  const rules = result.rules;
  // ...
}
```

### 4. Ergebnis überprüfen

```
{
  reportName: 'invoice',
  rules: [
    {
      ruleId: 'invoice-field-abc123',
      fieldName: 'invoiceNumber',
      pattern: 'INV-[0-9]{4}-[0-9]{3}',
      confidence: 0.92,
      isRequired: true,
      // ... weitere Eigenschaften
    },
    // ... weitere Rules
  ],
  successCount: 13,
  averageConfidence: 0.78,
  success: true
}
```

---

## 🏗️ JSON Zielstrukturen - Spezifikation

### Schema-Struktur (Pflichtformat)

Jede Zielstruktur MUSS dieses Format haben:

```json
{
  "id": "STRING (Required)",
  "documentType": "STRING (Required)",
  "version": "STRING (Optional, default: 1.0.0)",
  "description": "STRING (Optional)",
  "fields": [
    {
      "fieldName": "STRING (Required, regex: ^[a-zA-Z_][a-zA-Z0-9_]*$)",
      "fieldType": "STRING (Required, enum: 'string|number|date|boolean|array')",
      "isRequired": "BOOLEAN (Required)",
      "description": "STRING (Optional)",
      "constraints": "OBJECT (Optional)"
    }
  ]
}
```

### Beispiel-Daten-Struktur (Trainingsformat)

Die Beispieldaten MÜSSEN folgendes Format haben:

```json
{
  "fieldName1": "value",
  "fieldName2": 123,
  "fieldName3": "2026-07-08",
  "fieldName4": true
}
```

**Wichtig:**
- ✅ Alle Feldnamen im Schema müssen im Beispiel vorkommen (erforderliche Felder)
- ✅ Werte müssen realistisch sein (System lernt von den Werten)
- ✅ Wenn verschiedene Varianten existieren, mehrere Beispiele hinzufügen
- ✅ Die Struktur bleibt flach (max 5 Ebenen Tiefe)

### Vollständiges Strukturbeispiel

**Schema (invoice-schema-v1.0.0.json):**

```json
{
  "id": "invoice-schema-v1.0.0",
  "documentType": "invoice",
  "version": "1.0.0",
  "description": "Deutsche Rechnungsvorlage mit allen wichtigen Feldern",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "description": "Eindeutige Rechnungsnummer (z.B. INV-2024-001)",
      "constraints": {
        "minLength": 3,
        "maxLength": 50,
        "pattern": "^[A-Z0-9\\-]*$"
      }
    },
    {
      "fieldName": "invoiceDate",
      "fieldType": "date",
      "isRequired": true,
      "description": "Rechnungsdatum (YYYY-MM-DD Format)",
      "constraints": {
        "format": "YYYY-MM-DD"
      }
    },
    {
      "fieldName": "dueDate",
      "fieldType": "date",
      "isRequired": false,
      "description": "Zahlungsfristig (YYYY-MM-DD Format)"
    },
    {
      "fieldName": "customerName",
      "fieldType": "string",
      "isRequired": true,
      "description": "Name des Kunden",
      "constraints": {
        "minLength": 2,
        "maxLength": 200
      }
    },
    {
      "fieldName": "totalAmount",
      "fieldType": "number",
      "isRequired": true,
      "description": "Gesamtbetrag in EUR",
      "constraints": {
        "minimum": 0.01,
        "maximum": 999999.99
      }
    },
    {
      "fieldName": "currency",
      "fieldType": "string",
      "isRequired": true,
      "description": "Währungscode (z.B. EUR, USD)",
      "constraints": {
        "enum": ["EUR", "USD", "GBP"]
      }
    }
  ]
}
```

**Beispieldaten (invoice-example.json):**

```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2026-07-08",
  "dueDate": "2026-08-08",
  "customerName": "Acme Corporation GmbH",
  "totalAmount": 4522.00,
  "currency": "EUR"
}
```

---

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: JSON Schema erstellen

**Beispiel für Rechnung:**

```json
{
  "id": "invoice-schema-v1.0.0",
  "documentType": "invoice",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "description": "Eindeutige Rechnungsnummer",
      "constraints": {
        "minLength": 3,
        "maxLength": 50
      }
    },
    {
      "fieldName": "invoiceDate",
      "fieldType": "date",
      "isRequired": true,
      "description": "Rechnungsdatum"
    },
    {
      "fieldName": "totalAmount",
      "fieldType": "number",
      "isRequired": true,
      "description": "Gesamtbetrag"
    }
  ]
}
```

**Was muss ich spezifizieren?**
- ✅ Feldname (fieldName)
- ✅ Feldtyp (fieldType: string, number, date, boolean)
- ✅ Required (isRequired: true/false)
- ⭐ Beschreibung (hilft System zu verstehen)
- ⭐ Constraints (minLength, maxLength, etc.)

---

### Schritt 2: Beispieldaten erstellen

**Beispiel für Rechnung:**

```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2026-07-08",
  "dueDate": "2026-08-08",
  "customerName": "Acme Corporation GmbH",
  "totalAmount": 4522.00,
  "currency": "EUR",
  "paymentTerms": "NET 30"
}
```

**Best Practices:**
- ✅ Realistische Werte verwenden
- ✅ Verschiedene Varianten zeigen (z.B. "INV-2024-001" UND "Invoice #2024001")
- ✅ Deutsche Formatierungen nutzen (2026-07-08, 4.522,00)
- ✅ Edge Cases einbeziehen (wenn sinnvoll)
- ✅ Alle erforderlichen Felder füllen

---

### Schritt 3: Ruleset generieren

```typescript
// Mit inline-Daten
const result = await ruleGenerator.generate({
  reportName: 'invoice',
  schema: invoiceSchema,
  exampleDataSource: {
    data: invoiceExampleData  // Direkter Object
  }
});

// Mit Datei
const result = await ruleGenerator.generate({
  reportName: 'invoice',
  schema: invoiceSchema,
  exampleDataSource: {
    name: 'invoice-example'  // Lädt aus examples/invoice-example.json
  }
});
```

---

### Schritt 4: Ergebnisse überprüfen

**Erfolgreich? (success = true)**

```
✅ Alle 13 Felder wurden Rules generiert
✅ Average Confidence: 78%
✅ Keine Fehler
→ Ruleset ist produktionsreif!
```

**Mit Warnungen? (warnings.length > 0)**

```
⚠️ Field 'dueDate': Low confidence (45%)
→ User sollte Rule überprüfen

Lösung:
1. Manuelle Rule-Verbesserung
2. Oder: Mehr Trainings-Beispiele hinzufügen
```

**Fehler? (success = false)**

```
❌ Schema muss mindestens ein Feld haben
→ Schema überprüfen

Häufige Fehler:
- Ungültiger reportName (Nur lowercase alphanumerisch)
- Leeres Schema
- Ungültige Feldnamen (Nur a-zA-Z0-9_)
```

---

## 🔧 Troubleshooting

### Problem: "Invalid field name"

**Ursache:** Feldname hat ungültige Zeichen  
**Lösung:** Nur `a-zA-Z0-9_` verwenden, mit Buchstabe beginnen

```typescript
// ❌ Ungültig
fieldName: 'invoice-number'      // Bindestrich nicht erlaubt
fieldName: 'invoice_number_'     // OK
fieldName: '2invoiceNumber'      // OK, aber nicht empfohlen

// ✅ Empfohlen
fieldName: 'invoiceNumber'       // camelCase
fieldName: 'invoice_number'      // snake_case
```

### Problem: "Pattern has low confidence (0.35)"

**Ursache:** System konnte kein gutes Pattern finden  
**Lösung:** 
1. Mehrere Beispiel-Varianten hinzufügen
2. Feldwert in Beispieldaten besser beschreiben
3. Manuell prüfen und ggf. Pattern anpassen

```json
// ❌ Zu wenig Informationen
{ "invoiceDate": "15" }

// ✅ Bessere Beispiele
{ "invoiceDate": "2026-07-08", "invoiceDateDE": "08.07.2026" }
```

### Problem: "Field too large or too deep"

**Ursache:** JSON-Daten zu groß oder zu tief verschachtelt  
**Lösung:** 
- Maximale Dateigröße: 10MB
- Maximale Tiefe: 5 Ebenen
- Unnötige Verschachtelung entfernen

```json
// ❌ Zu tief
{ 
  "level1": { 
    "level2": { 
      "level3": { 
        "level4": { 
          "level5": { 
            "level6": "value"  // Zu tief!
          }
        }
      }
    }
  }
}

// ✅ Flacher
{
  "level1": { "value": "..." },
  "level2": { "value": "..." }
}
```

---

## 📊 Metriken verstehen

### Confidence Score (0.0 - 1.0)

```
0.9 - 1.0    ✅ Excellente Confidence
             Mehr als 90% der Beispiele passen zum Pattern

0.8 - 0.89   ✅ Gute Confidence
             80-89% der Beispiele passen
             Produktionsreif, aber überprüfen empfohlen

0.7 - 0.79   🟡 Faire Confidence
             70-79% der Beispiele passen
             Manual Review empfohlen

0.5 - 0.69   🟠 Niedrige Confidence
             50-69% der Beispiele passen
             Manuelle Verbesserung erforderlich

< 0.5        ❌ Sehr niedrige Confidence
             Weniger als 50% passen
             Nicht für Production geeignet
             Beispieldaten überprüfen
```

### Duration (Millisekunden)

```
< 100ms      ✅ Sehr schnell (optimal)
100-200ms    ✅ Schnell (OK)
200-500ms    🟡 Akzeptabel
> 500ms      ❌ Langsam (Problem)
```

### Examples Matched

```
13/13        ✅ 100% - Alle Beispiele matchen Pattern
12/13        ✅ 92% - Optimal
10/13        ✅ 77% - Gut
8/13         🟡 62% - Fair, überprüfen
< 50%        ❌ Schlecht, Beispiele überprüfen
```

---

## 🎓 REALES BEISPIEL: Kompletter Prozess End-to-End

Hier ist ein **realistisches Beispiel** für einen vollständigen Ruleset-Generierungsprozess:

### Szenario: Neue Rechnungsextraction für deutsche KMU

**Aufgabe:** 
> "Wir haben Rechnungen von verschiedenen deutschen Lieferanten (Freiberufler, KMUs, Großunternehmen). 
> Wir möchten automatisch aus diesen PDFs die wichtigsten Daten (Rechnungsnummer, Datum, Betrag, Steuern) 
> extrahieren und eine JSON Datei erstellen."

### Phase 0: Vorbereitung - Daten verstehen

**Beispiel Rechnungen (aus der Realität):**

```
Rechnung 1 (Freiberufler):
  Rechnungsnummer: R-2024-001
  Datum: 01.07.2026
  Brutto: 1.190,00 €

Rechnung 2 (KMU):
  Rechnung Nr.: INV-2024-1001
  Ausstellungsdatum: 2026-07-08
  Gesamtbetrag: 3.567,89 EUR

Rechnung 3 (Großunternehmen):
  Belegnummer: 2024-0000157
  Rechnungstag: 08.07.2026
  Summe: 15.234,56€
```

**Problem:** Jeder Lieferant nutzt andere Schreibweisen! ❌
- Rechnungsnummer vs. Rechnung Nr. vs. Belegnummer
- Verschiedene Datumsformate (DD.MM.YYYY vs. YYYY-MM-DD)
- Unterschiedliche Währungsschreibweisen (€ vs. EUR)

**Lösung:** Automatische Regelwerk-Generierung! ✅

### Phase 1: Schema definieren

**Datei: `extraction-rules/schemas/invoice-kmu-schema-v1.0.0.json`**

```json
{
  "id": "invoice-kmu-schema-v1.0.0",
  "documentType": "invoice",
  "version": "1.0.0",
  "description": "Deutsche KMU Rechnungsextraktion - unterstützt verschiedene Lieferantenformate",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "fieldType": "string",
      "isRequired": true,
      "description": "Rechnungsnummer (kann verschiedene Formate haben)",
      "constraints": {
        "minLength": 1,
        "maxLength": 50
      }
    },
    {
      "fieldName": "invoiceDate",
      "fieldType": "date",
      "isRequired": true,
      "description": "Rechnungsdatum",
      "constraints": {
        "format": "YYYY-MM-DD (System konvertiert automatisch)"
      }
    },
    {
      "fieldName": "totalAmount",
      "fieldType": "number",
      "isRequired": true,
      "description": "Gesamtbetrag in EUR",
      "constraints": {
        "minimum": 0.01
      }
    },
    {
      "fieldName": "taxAmount",
      "fieldType": "number",
      "isRequired": false,
      "description": "Steuerbetrag (19% MwSt)"
    },
    {
      "fieldName": "currency",
      "fieldType": "string",
      "isRequired": false,
      "description": "Währung",
      "constraints": {
        "enum": ["EUR", "USD", "GBP"]
      }
    }
  ]
}
```

### Phase 2: Trainings-Daten sammeln

Sie sammeln 3-5 **reale Rechnungsbeispiele** und extrahieren die wichtigsten Felder:

**Datei: `extraction-rules/examples/invoice-kmu-example.json`**

```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2026-07-08",
  "totalAmount": 4522.00,
  "taxAmount": 859.18,
  "currency": "EUR"
}
```

**Alternativ: Mehrere Beispiele (besser für das System!):**

```json
[
  {
    "invoiceNumber": "R-2024-001",
    "invoiceDate": "2026-07-01",
    "totalAmount": 1190.00,
    "taxAmount": 226.10,
    "currency": "EUR"
  },
  {
    "invoiceNumber": "INV-2024-1001",
    "invoiceDate": "2026-07-08",
    "totalAmount": 3567.89,
    "taxAmount": 678.90,
    "currency": "EUR"
  },
  {
    "invoiceNumber": "2024-0000157",
    "invoiceDate": "2026-07-08",
    "totalAmount": 15234.56,
    "taxAmount": 2894.57,
    "currency": "EUR"
  }
]
```

### Phase 3: Ruleset generieren

**Backend Code:**

```typescript
import { ExampleDataLoader } from '@application/generation/ExampleDataLoader';
import { PatternInferrer } from '@application/generation/PatternInferrer';
import { RuleGenerator } from '@application/generation/RuleGenerator';

// 1. Services initialisieren
const exampleLoader = new ExampleDataLoader({
  examplesDir: './extraction-rules/examples'
});
const patternInferrer = new PatternInferrer();
const generator = new RuleGenerator(exampleLoader, patternInferrer);

// 2. Schema laden
const schema = JSON.parse(
  fs.readFileSync('./extraction-rules/schemas/invoice-kmu-schema-v1.0.0.json', 'utf8')
);

// 3. Ruleset generieren
const result = await generator.generate({
  reportName: 'invoice-kmu',
  schema: schema,
  exampleDataSource: {
    name: 'invoice-kmu-example'  // Lädt aus examples/invoice-kmu-example.json
  },
  version: '1.0.0'
});

// 4. Ergebnis prüfen
if (result.success) {
  console.log(`✅ Erfolgreich! ${result.successCount} Regeln generiert`);
  console.log(`📊 Durchschnittliche Confidence: ${(result.averageConfidence * 100).toFixed(1)}%`);
  console.log(`⏱️  Generierung dauerte: ${result.durationMs}ms`);
  
  // Regeln speichern
  await saveRuleset(result.rules, 'invoice-kmu', '1.0.0');
} else {
  console.error(`❌ Fehler: ${result.error}`);
  result.warnings?.forEach(w => console.warn(`⚠️  ${w}`));
}
```

### Phase 4: Regeln überprüfen

**Ausgabe vom System:**

```
✅ Erfolgreich! 5 Regeln generiert
📊 Durchschnittliche Confidence: 78.4%
⏱️  Generierung dauerte: 142ms

Generierte Regeln:
  ✅ invoiceNumber       (Confidence: 85%) Pattern: ^[A-Z0-9\-]*$
  ✅ invoiceDate         (Confidence: 92%) Pattern: ^\d{4}-\d{2}-\d{2}$
  ✅ totalAmount         (Confidence: 88%) Pattern: ^[0-9]{1,6}\.[0-9]{2}$
  ⚠️  taxAmount          (Confidence: 62%) Pattern: ^[0-9]{1,6}\.[0-9]{2}$
  ✅ currency            (Confidence: 100%) Pattern: ^(EUR|USD|GBP)$
```

**Interpretation:**

| Rule | Confidence | Status | Aktion |
|------|------------|--------|--------|
| invoiceNumber | 85% | ✅ OK | Verwenden |
| invoiceDate | 92% | ✅ OK | Verwenden |
| totalAmount | 88% | ✅ OK | Verwenden |
| taxAmount | 62% | ⚠️ WARN | Überprüfen/verbessern |
| currency | 100% | ✅ OK | Verwenden |

### Phase 5: Regeln in Produktion nutzen

**Extraction Engine benutzt die Regeln:**

```typescript
// Mit den generierten Regeln Rechnungen extrahieren
const extractionEngine = new ExtractionEngine();

// Neue PDF kommt rein
const pdfContent = await loadPDF('rechnung-2024-xyz.pdf');

// Engine nutzt die generierten Regeln
const extractedData = await extractionEngine.extract(
  pdfContent,
  'invoice-kmu'  // Verwendet die 5 generierten Regeln
);

// Output:
{
  invoiceNumber: 'INV-2024-0157',
  invoiceDate: '2026-07-15',
  totalAmount: 2899.50,
  taxAmount: 551.05,
  currency: 'EUR'
}
```

### Phase 6: Verbesserung (Learning - Phase 2)

> **HINWEIS:** Learning ist nicht in Phase 1 enthalten (siehe "Learning-Konzept" unten)

Aktuell ist der Prozess **"one-shot"**:
- Einmal generieren
- Regeln nutzen
- Fertig

**In Phase 2 kommt Verbesserung:**
- ✅ System merkt sich, welche Regeln fehlgeschlagen sind
- ✅ Automatische Anpassung basierend auf Produktions-Daten
- ✅ Zweiter Durchlauf nutzt vorherige Erkenntnisse
- ✅ Confidence verbessert sich iterativ

---

## 🧠 Learning-Konzept (Phase 2)

### Status Quo - Phase 1: Statische Regeln

```
Beispieldaten → [Generiere Regeln] → Regeln v1.0.0
                                         ↓
                                    (Verwende für Extraktion)
                                         ↓
                                    ❌ Fehler? Keine Rückkopplung!
```

**Problem:** Wenn Regeln in der Praxis fehlschlagen, lernt das System nicht.

### Geplant - Phase 2: Adaptive Regeln mit Learning

```
Beispieldaten → [Generiere Regeln] → Regeln v1.0.0
                                         ↓
                                    (Verwende für Extraktion)
                                         ↓
                                    ✅ Erfolg: +1 zu Confidence
                                    ❌ Fehler: Fehler logged
                                         ↓
                                    [Analysiere Fehler]
                                         ↓
Erneute Generierung mit gelernten Fehlern → Regeln v1.1.0
(bessere Confidence, weniger Fehler)
```

### Was wird gelernt?

**Fehlertypen, die das System erkennen wird:**

```
1. Pattern Mismatch
   - Rule sagt: "Pattern: INV-[0-9]{4}-[0-9]{3}"
   - Real data: "INV-2024-01", "Rech.2024-01"
   - Learning: Pattern zu eng, anpassen auf "^[A-Za-z]*-?[0-9]*-?[0-9]*$"

2. Type Mismatch
   - Rule sagt: "Feldtyp: number"
   - Real data: "€1.234,50" (mit Währung)
   - Learning: Text extrahieren, dann zu number konvertieren

3. Missing/Optional Fields
   - Rule sagt: "isRequired: true"
   - Real data: Feld kommt nicht vor
   - Learning: Feld als optional markieren

4. Constraint Violations
   - Rule sagt: "maxLength: 10"
   - Real data: "RECHNUNGS-2024-0000157" (23 chars)
   - Learning: maxLength auf 25 erhöhen
```

### Learning Implementation (Pseudo-Code Phase 2)

```typescript
class AdaptiveRuleGenerator {
  // Speichert Fehler aus Produktions-Extraction
  private errorLog: ExtractionError[] = [];

  async improveRules(
    existingRules: GeneratedRule[],
    errorLog: ExtractionError[],
    updatedExamples: any[]
  ): Promise<GeneratedRule[]> {
    // 1. Analysiere Fehler
    const failedFields = this.analyzeFailures(errorLog);
    
    // 2. Verbessere Beispieldaten mit Erkenntnissen
    const improvedExamples = this.augmentExamplesWithErrors(
      updatedExamples,
      failedFields
    );

    // 3. Re-generiere Regeln
    const improvedRules = await this.generate({
      ...config,
      exampleDataSource: { data: improvedExamples },
      baselineRules: existingRules  // Nutze v1.0.0 als Baseline
    });

    // 4. Vergleiche Confidence
    const improvements = this.compareConfidence(
      existingRules,
      improvedRules
    );

    // 5. Gebe bessere Regeln zurück
    return improvedRules;  // vielleicht v1.1.0
  }

  analyzeFailures(errorLog: ExtractionError[]) {
    // Group errors by field
    const byField = new Map<string, ExtractionError[]>();
    
    errorLog.forEach(error => {
      if (!byField.has(error.fieldName)) {
        byField.set(error.fieldName, []);
      }
      byField.get(error.fieldName)!.push(error);
    });

    // Identify patterns
    return Array.from(byField.entries()).map(([field, errors]) => ({
      field,
      errorCount: errors.length,
      errorTypes: this.categorizeErrors(errors),
      commonValues: this.extractCommonValues(errors)
    }));
  }
}
```

### Timeline für Learning

| Phase | Feature | Timeline |
|-------|---------|----------|
| **Phase 1** ✅ | Automatische Generierung | Jetzt |
| **Phase 2** 🔄 | Learning from Errors | 2-3 Wochen |
| **Phase 2** 🔄 | Confidence Improvements | 2-3 Wochen |
| **Phase 3** 🎯 | API für Batch Optimization | 1-2 Wochen |
| **Phase 3** 🎯 | UI für Manual Refinement | 1-2 Wochen |

---

## ✅ Best Practices

### ✅ DO's

```typescript
// ✅ Aussagekräftige Feldnamen
fieldName: 'invoiceNumber'
fieldName: 'customerTaxId'
fieldName: 'dueDate'

// ✅ Realistische Beispiele
data: {
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2026-07-08',
  totalAmount: 4522.00
}

// ✅ Feldtypen richtig setzen
fieldType: 'string'   // Text
fieldType: 'number'   // 123, 45.67
fieldType: 'date'     // 2026-07-08
fieldType: 'boolean'  // true/false

// ✅ Erforderliche Felder kennzeichnen
isRequired: true      // Muss immer vorhanden sein
isRequired: false     // Optional
```

### ❌ DON'Ts

```typescript
// ❌ Zu viele ähnliche Beispiele
examples: ['INV-001', 'INV-002', 'INV-003', 'INV-004', ...]
// Nur unterschiedliche Varianten relevant

// ❌ Zu große Dateien
exampleDataSource: { data: hugeJSONWith500MB }
// Max 10MB

// ❌ Ungültige Feldnamen
fieldName: 'invoice-number'     // ❌ Bindestrich
fieldName: '123field'           // ❌ Anfangszahl
fieldName: 'field$%'            // ❌ Spezialzeichen

// ❌ Zu tiefe Verschachtelung
{ a: { b: { c: { d: { e: { f: value } } } } } }
// Max 5 Ebenen

// ❌ Unrealistische Werte
invoiceNumber: 'abc'  // Sollte Pattern wie INV-YYYY-XXX haben
```

---

## 🔒 Sicherheit

### Inputvalidierung

- ✅ Feldnamen werden validiert (nur `a-zA-Z0-9_`)
- ✅ Dateigrößen sind begrenzt (max 10MB)
- ✅ JSON-Tiefe ist begrenzt (max 5 Ebenen)
- ✅ Path Traversal wird blockiert (`../` nicht erlaubt)

### Regex-Sicherheit

- ✅ Catastrophic Backtracking wird erkannt
- ✅ Nested Quantifiers werden flaggt
- ✅ Performance wird getestet (< 100ms)
- ✅ ReDoS-Risiken werden gewarnt

---

## 📞 Support

**Fragen?**
- Lesen Sie: `MULTI_REPORT_RULESET_ANALYSIS.md`
- Lesen Sie: `PHASE1_IMPLEMENTATION_PLAN.md`
- Schauen Sie: `tests/integration/generation/` für Beispiele

**Probleme?**
- Check: Ist Fieldname valid? (nur `a-zA-Z0-9_`)
- Check: Sind Beispieldaten realistische?
- Check: Ist JSON valid? (`npm install -g jsonlint && jsonlint file.json`)

**Möchten Sie erweitern?**
- Phase 2: Multi-Variant Detection (2-3 Wochen)
- Phase 3: API & Batch Processing (1-2 Wochen)

---

**Viel Erfolg!** 🚀
