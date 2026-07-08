# Phase 15: Schema-Verwaltung & Lifecycle

**Dokumentation zur Schema-Verwaltung**  
**Status**: Phase 15 (MVP) / Phase 16 (Erweitert)  
**Datum**: 2026-07-08

---

## 🎯 Schema Lifecycle Overview

```
┌─────────────────┐
│  Neues Schema   │  ← Sie sind hier (Phase 15)
│  hochladen      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Beispiele      │  ← Sie sind hier (Phase 15)
│  hochladen      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Regeln         │  ← Sie sind hier (Phase 15)
│  generieren     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Im System          │  ← Phase 15: In-Memory
│  speichern          │  → Phase 16: PostgreSQL
└─────────────────────┘
```

---

## 📋 Schema-Verwaltung: Phase 15 (Aktuell)

### ✅ Verfügbare Funktionen (Phase 15)

#### 1. Schema hochladen
**Funktionsweise**:
- Datei-Upload: `invoice-schema.json`
- JSON Validierung
- Feld-Zähler
- Error Handling

**API Endpoint**:
```bash
POST /api/schema/upload
Content-Type: application/json

{
  "schema": { /* JSON Schema */ },
  "examples": [ /* Array of objects */ ],
  "schemaName": "invoice"
}
```

**Response**:
```json
{
  "schemaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "schemaName": "invoice",
  "fieldsCount": 12,
  "examplesCount": 3,
  "uploadedAt": "2026-07-08T14:30:00Z",
  "message": "Schema uploaded successfully"
}
```

---

#### 2. Regeln generieren
**Funktionsweise**:
- Mit generierten `schemaId`
- Parameter: aggressiveness, customKeywords
- Speichert Regeln in-memory

**API Endpoint**:
```bash
POST /api/schema/{schemaId}/generate-rules
Content-Type: application/json

{
  "aggressiveness": 0.7,
  "customKeywords": ["invoice", "total"]
}
```

---

#### 3. Schema-Metadaten abrufen
**Funktionsweise**:
- Gibt Informationen über hochgeladenes Schema
- Zeigt Feld-Anzahl, Beispiel-Anzahl
- Zeigt, ob Regeln generiert wurden

**API Endpoint**:
```bash
GET /api/schema/{schemaId}
```

**Response**:
```json
{
  "schemaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fieldsCount": 12,
  "examplesCount": 3,
  "uploadedAt": "2026-07-08T14:30:00Z",
  "hasGeneratedRules": true
}
```

---

#### 4. Generierte Regeln abrufen
**Funktionsweise**:
- Gibt alle generierten Regeln zurück
- Mit Confidence-Scores
- Mit Statistics

**API Endpoint**:
```bash
GET /api/schema/{schemaId}/rules
```

---

#### 5. Schema löschen
**Funktionsweise**:
- Löscht Schema + zugehörige Regeln
- Aus In-Memory Store

**API Endpoint**:
```bash
DELETE /api/schema/{schemaId}
```

---

### ⏳ Nicht verfügbar (Phase 15)

#### ❌ Schema-Liste anzeigen
**Status**: Geplant für Phase 16
- Liste aller hochgeladenen Schemas
- Filtierung & Suche
- Datum & Größe anzeigen

#### ❌ Schema auswählen & wiederverwenden
**Status**: Geplant für Phase 16
- Bestehende Schemas aus Liste
- Schnelle Regel-Neugewinnung
- Multi-Use Workflows

#### ❌ Schema-Versioning
**Status**: Geplant für Phase 16/17
- Version History
- Rollback zu älteren Versionen
- Change Tracking

#### ❌ Schema-Sharing
**Status**: Geplant für Phase 18
- Schema mit anderen Nutzern teilen
- Permissions & Access Control
- Team Collaboration

#### ❌ Schema-Export/Import
**Status**: Geplant für Phase 16/17
- Export als JSON/YAML
- Import aus Dateien
- API Definition Export (OpenAPI)

---

## 🗄️ Schema-Speicherung: Comparison

### Phase 15: In-Memory

```typescript
// Aktuell
const schemaStore = new Map<string, {
  schemaId: string;
  schema: any;
  uploadedAt: Date;
  examples: any[];
  generatedRules?: any;
  stats?: any;
}>();
```

**Eigenschaften**:
- ✅ Schnell (< 1ms)
- ✅ Einfach (Map-basiert)
- ✅ MVP-gerecht
- ❌ Nicht persistent
- ❌ Verloren bei Neustart
- ❌ Multi-Server nicht möglich

---

### Phase 16: PostgreSQL (Geplant)

```typescript
// Ziel
@Entity()
class Schema {
  @PrimaryColumn()
  schemaId: string;

  @Column('jsonb')
  schema: JSONSchemaDefinition;

  @Column()
  uploadedAt: Date;

  @OneToMany(() => Example, ex => ex.schema)
  examples: Example[];

  @OneToMany(() => GeneratedRule, rule => rule.schema)
  generatedRules: GeneratedRule[];

  @Column('jsonb')
  stats: GenerationStats;

  @Column({ nullable: true })
  userId: string;  // Multi-User Support
}
```

**Eigenschaften**:
- ✅ Persistent
- ✅ Multi-Server
- ✅ Multi-User
- ✅ Query & Search
- ✅ Schema Versioning
- ❌ Etwas langsamer (~5-10ms)

---

## 📱 UI/UX: Schema-Verwaltung Roadmap

### Phase 15 (Aktuell)

```
┌─────────────────────────────────┐
│ Schema Upload Wizard            │
├─────────────────────────────────┤
│ Step 1: Upload Schema           │
│ Step 2: Upload Examples         │
│ Step 3: Preview                 │
│ Step 4: Settings                │
│ Step 5: Generate Rules          │
└─────────────────────────────────┘
```

**Features**:
- ✅ Upload neuer Schemas
- ✅ Beispiel-Upload
- ✅ Regelgenerierung
- ✅ Ergebnisanzeige

---

### Phase 16 (Geplant)

```
┌─────────────────────────────────┐
│ Schema Manager                  │
├─────────────────────────────────┤
│ ▶ My Schemas                    │
│   ├─ Invoice (3 Beispiele)      │
│   ├─ Contract (5 Beispiele)     │
│   └─ Product (2 Beispiele)      │
│                                 │
│ ▶ Upload new Schema             │
│ ▶ Browse shared Schemas         │
└─────────────────────────────────┘
```

**Features**:
- ✅ Schema-Liste
- ✅ Bestehende nutzen
- ✅ Löschen
- ✅ Editieren
- ✅ Teilen
- ✅ Versioning

---

### Phase 17 (Geplant)

```
┌─────────────────────────────────┐
│ Advanced Schema Management      │
├─────────────────────────────────┤
│ ▶ Schema Editor (WYSIWYG)       │
│ ▶ Version History               │
│ ▶ A/B Testing (Ruleset A/B)     │
│ ▶ Import/Export (JSON, YAML)    │
│ ▶ Schema Analytics              │
│ ▶ Team Collaboration            │
└─────────────────────────────────┘
```

---

## 🔄 Workflow Scenarios

### Scenario 1: Einmaliger Use (Phase 15) ✅

```
1. Upload Invoice Schema
2. Upload 3 Beispiele
3. Generate Rules
4. Use Rules
5. Done (Regeln sind weg bei Neustart)
```

**Best For**: Entwicklung, Prototyping, Testing

---

### Scenario 2: Wiederholter Use (Phase 16+) 🔜

```
1. First Time:
   - Upload Schema
   - Generate Rules
   - Save in Database ← NEW

2. Later:
   - Open Schema Manager
   - Select "Invoice Schema"
   - Rules are already there!
```

**Best For**: Produktion, häufige Nutzung

---

### Scenario 3: Team Collaboration (Phase 18+) 🔜

```
1. User A:
   - Creates Invoice Schema
   - Shares with Team

2. User B:
   - Can see "Invoice" in shared schemas
   - Use it for new documents
   - Saves extraction results
```

**Best For**: Enterprise, Team-basiert

---

## ✅ Einsatzbereitschaft: Schema-Handling

### Phase 15 (Aktuell)

```
Neues Schema hochladen:           ✅ READY
Beispiele hochladen:              ✅ READY
Regeln generieren:                ✅ READY
Ergebnisse anzeigen:              ✅ READY
In-Memory Speicherung:            ✅ READY
Single-User Workflow:             ✅ READY
─────────────────────────────────────────
Bestehende Schemas nutzen:        ❌ N/A
Multi-User Support:               ❌ N/A
Persistenz über Restart:          ❌ N/A
Schema Versioning:                ❌ N/A
```

### Best Practices (Phase 15)

```
✅ DO:
   - Ein Schema pro Session laden
   - Regeln direkt nach Generierung nutzen
   - Session-Daten speichern (extern)
   - Frontend-Komponente refreshen wenn nötig

❌ DON'T:
   - Schema länger als nötig speichern
   - Neustart erwarten ohne Neuupload
   - Multi-Schema gleichzeitig nutzen
   - Auf Datenpersistenz verlassen
```

---

## 🚀 Migration Path: Phase 15 → Phase 16

### Zu Tun in Phase 16

1. **TypeORM Entities erstellen**
   ```typescript
   Schema, Example, GeneratedRule, ExtractionRun
   ```

2. **API aufbauen**
   ```bash
   POST /api/schema/list          # List all
   GET /api/schema/{id}           # Details
   PUT /api/schema/{id}           # Update
   DELETE /api/schema/{id}        # Delete
   ```

3. **Migration durchführen**
   - In-Memory → PostgreSQL
   - Bestehende Workflows updaten

4. **UI erweitern**
   - Schema Manager (neue Komponente)
   - Schema Selection Dialog
   - History Viewer

---

## 📞 FAQ

### F: Wo werden meine Schemas gespeichert?
**A (Phase 15)**: In-Memory (verloren bei Neustart)  
**A (Phase 16+)**: PostgreSQL Datenbank

### F: Kann ich ein Schema mehrfach nutzen?
**A (Phase 15)**: Nein, müssen jedes Mal neu hochladen  
**A (Phase 16+)**: Ja, aus der Schema-Liste auswählen

### F: Werden Regeln automatisch gespeichert?
**A (Phase 15)**: Ja, aber nur während der Session  
**A (Phase 16+)**: Ja, persistent in der Datenbank

### F: Kann ich Schemas mit anderen teilen?
**A (Phase 15)**: Nein  
**A (Phase 16+)**: Ja, mit Permissions (Phase 18)

---

## 📝 Checkliste: Schema-Management Readiness

### Phase 15 ✅

- ✅ Schema Upload funktioniert
- ✅ Beispiele können hochgeladen werden
- ✅ Regeln werden generiert
- ✅ In-Memory Speicher funktioniert
- ✅ API Endpoints funktionieren
- ✅ Error Handling vorhanden
- ✅ Frontend Component fertig

### Phase 16 (Geplant)

- 🔜 PostgreSQL Integration
- 🔜 Schema Persistence
- 🔜 Schema Manager UI
- 🔜 Schema Selection
- 🔜 Schema Versioning
- 🔜 Multi-User Support

---

**Documentation Updated**: 2026-07-08  
**Phase**: 15 (MVP) / Roadmap für 16+  
**Status**: ✅ PHASE 15 READY
