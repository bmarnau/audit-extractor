# src/core/

Kern-Domain-Layer des Audit-Safe Document Extractors.

## Verzeichnisstruktur

```
src/core/
├── models/              # Domänenmodelle (Interfaces/Enums)
│   ├── Document.ts
│   ├── DocumentMetadata.ts
│   ├── DocumentChunk.ts
│   ├── DocumentImage.ts
│   ├── ExtractionResult.ts
│   ├── ValidationResult.ts
│   ├── QualityReport.ts
│   ├── ReflectionReport.ts
│   ├── CorrectionRecord.ts
│   └── index.ts
│
└── rules/               # Rule- und Schema-Management
    ├── Rule.ts
    ├── Schema.ts
    ├── RuleLoader.ts    # Lädt Rules & Schemas aus Dateien
    └── index.ts
```

## Domänenmodelle (`models/`)

Alle reinen Interfaces und Enums - **KEINE Implementierung**.

| Modell | Zweck |
|--------|-------|
| `Document` | Repräsentiert ein Eingabedokument |
| `DocumentMetadata` | Metadaten des Dokuments (Hash, Größe, Format, etc.) |
| `DocumentChunk` | Ein Text-Chunk aus dem Dokument |
| `DocumentImage` | Referenzen zu Bildern im Dokument |
| `ExtractionResult` | Extraktionsergebnisse mit Quellen & Confidence |
| `ValidationResult` | Validierungsergebnisse (Fehler & Warnungen) |
| `QualityReport` | Qualitätsmetriken für Extraktionsergebnisse |
| `ReflectionReport` | Pattern aus erfolgreichen Extraktionen |
| `CorrectionRecord` | Korrigierte (fehlerhafte) Extraktionen |

**Kritisch**: 
- ✅ Modelle beschreiben nur die Struktur
- ✅ Keine Datengenerierung
- ✅ Explizite Type Safety (TypeScript strict mode)
- ❌ Keine Default-Werte
- ❌ Keine Auto-Completion fehlender Felder

## Rules & Schemas (`rules/`)

### Modelle

| Modell | Zweck |
|--------|-------|
| `Rule` | Einzelne Extraktionsregel (WAS wird gesucht) |
| `RuleSet` | Sammlung von Rules |
| `Schema` | Struktur eines Dokumenttyps |
| `FieldGroup` | Logische Gruppierung von Feldern |

**Kritisch**:
- ✅ Rules/Schemas definieren NUR die Struktur
- ✅ Keine Implementierungslogik
- ✅ Keine Beispieldaten in Rules
- ❌ KEINE Datengenerierung aus Rules

### RuleLoader

Lädt Rules und Schemas aus Dateien.

#### Quellen

```
extraction-rules/
├── *.txt           # Individual Rules
└── schemas/
    └── *.json      # Schemas (Sammlungen von Rules)
```

#### Beispiel-Rule (`.txt`)

```
id: invoice-field-001
fieldName: invoiceNumber
fieldType: string
isRequired: true
description: Eindeutige Rechnungsnummer
documentTypes: pdf, docx
schemaVersion: 1.0.0
isActive: true
hints: Suche nach "INV-", "Invoice #", "Rechnungs-Nr."
```

#### Beispiel-Schema (`.json`)

```json
{
  "id": "invoice-schema-v1.0.0",
  "name": "Invoice Schema",
  "documentType": "invoice",
  "version": "1.0.0",
  "fields": [
    { "id": "invoice-field-001", ... },
    { "id": "invoice-field-002", ... }
  ],
  "fieldGroups": [
    {
      "id": "header",
      "fieldIds": ["invoice-field-001", "invoice-field-002"]
    }
  ]
}
```

#### API

```typescript
const loader = new RuleLoader('./extraction-rules');

// Alle Rules laden
const rules = await loader.loadRules();
console.log(rules.get('invoice-field-001'));

// Alle Schemas laden
const schemas = await loader.loadSchemas();

// Ein Schema laden
const schema = await loader.loadSchema('invoice-v1.0.0');

// Einzelne Rule abrufen
const rule = loader.getRule('invoice-field-001');

// Cache löschen
loader.clearCache();
```

#### Fehlerbehandlung

```typescript
import { RuleLoadError } from '@core/rules';

try {
  const rules = await loader.loadRules();
} catch (error) {
  if (error instanceof RuleLoadError) {
    console.error('Failed to load rules:', error.message);
    console.error('File:', error.fileName);
    console.error('Line:', error.lineNumber);
  }
}
```

## Kritische Policies

### 1. Keine Datengenerierung

Rules und Schemas sind **Vorlagen**, nicht **Datenquellen**.

```typescript
// ❌ FALSCH: Rule generiert Daten
{
  "fieldName": "customerName",
  "defaultValue": "Unknown Customer"  // ← Halluzination!
}

// ✅ RICHTIG: Rule beschreibt nur Struktur
{
  "fieldName": "customerName",
  "fieldType": "string",
  "isRequired": true,
  "description": "Name des Kunden"
}
```

### 2. Keine Auto-Completion fehlender Felder

Wenn ein Feld fehlt, bleibt es weg - wird nicht gefüllt!

```typescript
// ❌ FALSCH: Loader füllt fehlende Felder
rule.examples = rule.examples || [];

// ✅ RICHTIG: Loader lädt nur explizite Werte
rule.examples = rule.examples; // undefined, falls nicht in Datei
```

### 3. Explizite Fehlerbehandlung

```typescript
// ❌ FALSCH: Fehler werden ignoriert
const rule = JSON.parse(content) || {};

// ✅ RICHTIG: Fehler werden geworfen
if (!data.id) {
  throw new RuleLoadError('Rule missing required field: id');
}
```

## Verwendungsbeispiel

```typescript
import { RuleLoader } from '@core/rules';
import { Document } from '@core/models';

async function extractDocument(doc: Document) {
  const loader = new RuleLoader('./extraction-rules');
  
  // Lade das passende Schema für den Dokumenttyp
  const schema = await loader.loadSchema(`${doc.type}-v1.0.0`);
  
  if (!schema) {
    throw new Error(`No schema found for type: ${doc.type}`);
  }
  
  // Iteriere über alle Rules im Schema
  for (const rule of schema.fields) {
    if (!rule.isActive) continue;
    
    // Extraktionslogik würde hier starten
    console.log(`Processing field: ${rule.fieldName}`);
  }
}
```

---

**Letzte Aktualisierung**: 2026-07-05
