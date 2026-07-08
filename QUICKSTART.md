# Quick Start - Audit-Safe Document Extractor (v0.15.0)

**Status**: ✅ PRODUCTION READY  
**Phase 15**: Schema-Driven Rule Generation COMPLETE

## 📦 Installation & Startup

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install
npm run build
npm run test
npm run dev      # Startet Server auf Port 3000
```

Server läuft auf: `http://localhost:3000`

---

## 🚀 Phase 15: Automatische Regelgenerierung (5 Minuten)

### 1️⃣ Schema hochladen

```json
{
  "type": "object",
  "properties": {
    "invoiceNumber": { "type": "string" },
    "totalAmount": { "type": "number" },
    "date": { "type": "string", "format": "date" }
  },
  "required": ["invoiceNumber", "totalAmount"]
}
```

### 2️⃣ Beispieldateien vorbereiten (2-3)

```json
{
  "invoiceNumber": "INV-202601",
  "totalAmount": 1500.00,
  "date": "2026-01-15"
}
```

### 3️⃣ REST API aufrufen

**Upload Schema:**
```bash
curl -X POST http://localhost:3000/api/schema/upload \
  -H "Content-Type: application/json" \
  -d '{
    "schema": { /* your schema */ },
    "examples": [ /* your examples */ ],
    "schemaName": "invoice"
  }'
```

Response:
```json
{
  "schemaId": "uuid-123",
  "fieldsCount": 3,
  "examplesCount": 2,
  "message": "Schema uploaded successfully"
}
```

**Regeln generieren:**
```bash
curl -X POST http://localhost:3000/api/schema/uuid-123/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "aggressiveness": 0.7,
    "customKeywords": ["invoice", "total"]
  }'
```

Response:
```json
{
  "rules": [
    {
      "fieldName": "invoiceNumber",
      "confidence": 0.95,
      "patterns": ["INV-\\d{6}"],
      "extractionStrategy": "pattern_match"
    },
    {
      "fieldName": "totalAmount",
      "confidence": 0.92,
      "patterns": ["Total:", "EUR \\d+\\.\\d{2}"],
      "extractionStrategy": "value_extraction"
    }
  ],
  "stats": {
    "rulesGenerated": 3,
    "averageConfidence": 0.93
  }
}
```

### 4️⃣ Frontend UI (Optional)

Oder verwenden Sie die Web-Benutzeroberfläche:
1. Öffnen Sie `http://localhost:3000`
2. Wählen Sie "Schema Upload Wizard"
3. Folgen Sie den 5 Schritten
4. Ergebnisse werden angezeigt

---

## 📖 Weitere Ressourcen

- **Detailliertes Handbuch**: `PHASE15_USER_GUIDE.md`
- **API Dokumentation**: `RELEASE_NOTES_0.15.0.md`
- **Architektur**: `docs/PHASE-15-SCHEMA-DRIVEN-GENERATION.md`
- **Glossar**: `docs/glossary.md`

---

## 🔧 API Endpoints Übersicht

| Endpoint | Methode | Zweck |
|----------|---------|-------|
| `/api/schema/upload` | POST | Schema + Beispiele hochladen |
| `/api/schema/:schemaId/generate-rules` | POST | Regeln generieren |
| `/api/schema/:schemaId` | GET | Schema-Metadaten |
| `/api/schema/:schemaId/rules` | GET | Generierte Regeln |
| `/api/schema/:schemaId` | DELETE | Schema löschen |

---

## 🏗️ Dateistruktur

| Pfad | Zweck |
|------|-------|
| `src/domain/schema/` | SchemaAnalyzer, ExampleAnalyzer |
| `src/application/rule-generation/` | RuleGenerator |
| `src/presentation/` | SchemaExtractionRoutes (REST API) |
| `src/infrastructure/di/` | Dependency Injection Setup |
| `frontend/src/components/` | SchemaUploadWizard UI |
| `docs/` | Dokumentation |

---

## ⚡ Wichtigste Commands

```bash
npm run build      # TypeScript compilieren
npm run test       # Unit Tests ausführen
npm run test:watch # Watch Mode
npm run test:coverage # Coverage Report
npm run dev        # Entwicklungs-Mode (startet Server)
```

---

## ✅ Phase 15 Status

```
✅ Backend REST API (5 Endpoints)
✅ Frontend UI (5-Step Wizard)
✅ Domain Services (Analyzer + Generator)
✅ Dependency Injection
✅ TypeScript Build (0 errors)
✅ Error Handling
✅ Documentation

→ Einsatzbereit für TESTING & PRODUCTION
```

---

## 🚀 Next Steps

1. **Jetzt**: Phase 15 testen mit Ihrer Daten
2. **Phase 16**: Datenbank-Persistierung (PostgreSQL)
3. **Phase 17**: Erweiterte Validierung
4. **Phase 18**: Multi-User & Sharing

---

## 📞 Probleme?

```bash
# 1. Build-Check
npm run build

# 2. Server-Check
npm run dev

# 3. Browser-Konsole öffnen (F12)
# Auf Fehler prüfen

# 4. Logs anschauen
# Terminal-Ausgabe überprüfen
```

Für detaillierte Hilfe siehe `PHASE15_USER_GUIDE.md`

---

**Version**: 0.15.0  
**Last Updated**: 2026-07-08

## 🔒 Halluzinations-Verhinderung

```typescript
// ❌ FALSCH - Keine Quelle
engine.extract('field', 'value', [], 1.0);

// ❌ FALSCH - Zu unsicher
engine.extract('field', 'value', sources, 0.45);

// ✅ RICHTIG
engine.extract('field', 'value', sources, 0.95);
```

## 📊 Extraktionsergebnis

```typescript
ExtractionResult {
  resultId: 'result-001',
  documentReference: { ... },
  extractedFields: Map {
    'invoiceNumber' → ExtractedValue,
    'amount' → ExtractedValue
  },
  missingFields: ['dueDate'],
  warnings: [
    { field: 'dueDate', level: 'info', message: '...' }
  ],
  extractedAt: Date,
  version: '1.0.0',
  ruleSetVersion: '1.0.0'
}
```

## 🧪 Tests schreiben

```typescript
import { ExtractionEngine } from '@application/ExtractionEngine';

describe('MyExtraction', () => {
  it('should extract invoice number', () => {
    const engine = new ExtractionEngine(rules);
    
    const result = engine.extract(
      'invoiceNumber',
      'INV-2024-001',
      [{ documentReference, textSnippet: '...' }],
      0.99
    );

    expect(result.value).toBe('INV-2024-001');
    expect(result.confidence).toBe(0.99);
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
```

## 📋 Extraktions-Regeln

Erstelle `extraction-rules/my-rule.json`:

```json
[
  {
    "ruleId": "rule-001",
    "fieldName": "fieldName",
    "description": "Beschreibung",
    "fieldType": "string",
    "isRequired": true,
    "constraints": {
      "minLength": 1,
      "maxLength": 100
    },
    "documentTypes": ["pdf"]
  }
]
```

## 🎯 Design-Prinzipien

1. **Keine Halluzinationen**: Jeder Wert braucht eine Quelle
2. **Vertrauenswürdig**: Audit-Trail für alle Operationen
3. **Transparent**: Unsicherheit explizit dokumentiert
4. **Streng**: TypeScript strict mode, SOLID Principles
5. **Testbar**: 80%+ Code Coverage angestrebt

## 📚 Weitere Dokumentation

- [README.md](../README.md) - Umfassendes Manual
- [ARCHITECTURE.md](ARCHITECTURE.md) - System-Architektur
- [systemprompt.md](systemprompt.md) - AI System Prompt

---

**Starte mit**: `npm install && npm run build && npm run test`
