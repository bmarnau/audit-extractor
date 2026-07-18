# 🚀 Quick Start - Audit-Safe Document Extractor (0.37.1)

**Status**: ✅ PRODUCTION READY  
**Phase**: 45 - Project Consistency & Consolidation  
**Last Updated**: 0.37.1 (2026-07-18)

---

## ⚡ Instant Start (30 Sekunden)

### Windows: CMD Script

```cmd
cd c:\Users\bmarn\OneDrive\HTML\extractor
start-docker.cmd
```

**Fertig!** Öffne dann:
- Frontend: http://localhost
- Backend: http://localhost:3000/api
- pgAdmin: http://localhost:5050

### Windows: PowerShell

```powershell
cd c:\Users\bmarn\OneDrive\HTML\extractor
.\start-docker.ps1
```

### macOS / Linux

```bash
cd /path/to/extractor
docker-compose up -d
```

---

## 🎯 Was läuft nach dem Start?

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost | ✅ React UI |
| Backend API | http://localhost:3000/api | ✅ REST Server |
| Database UI | http://localhost:5050 | ✅ pgAdmin |
| Database | localhost:5432 | ✅ PostgreSQL |
| Cache | localhost:6379 | ✅ Redis |

---

## 📊 Logs anzeigen

```bash
# Alle zusammen
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

---

## 🛑 Stoppen

```bash
# Pausieren (Container bleiben)
docker-compose stop

# Komplett herunterfahren
docker-compose down

# Mit Datenlöschung (⚠️)
docker-compose down -v
```

---

## 🔄 Neu starten

```bash
# Mit Rebuild
docker-compose up -d --build

# Nur Backend
docker-compose build backend && docker-compose up -d backend

# Nur Frontend
docker-compose build frontend && docker-compose up -d frontend
```

---

## 🐛 Schnelle Fehlersuche

```bash
# Was läuft?
docker-compose ps

# Fehler in Backend?
docker-compose logs backend | tail -50

# Fehler in Frontend?
docker-compose logs frontend | tail -50

# Datenbank OK?
docker-compose exec postgres pg_isready -U extractor_user
```

---

## 💾 Datenbank-Operationen

### Backup

```bash
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup.sql
```

### Restore

```bash
cat backup.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

### pgAdmin öffnen

http://localhost:5050
- Email: admin@extractor.local
- Password: admin-pass

---

## 📖 Weitere Dokumentation

- **Full Manual**: [MANUAL-0.37.0.md](MANUAL-0.37.0.md)
- **Docker Guide**: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
- **Command Reference**: [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)
- **Release Notes**: [RELEASE_NOTES_0.37.0.md](RELEASE_NOTES_0.37.0.md)

---

**Ready to extract? Start now!** 🚀
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
- **API Dokumentation**: `RELEASE_NOTES_0.37.0.md`
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

**Version**: 0.37.0  
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
  version: '0.37.0',
  ruleSetVersion: '0.37.0'
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
