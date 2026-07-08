# Glossar - Audit-Safe Document Extractor

Vollständiges Fachvokabular des Systems mit Definitionen, Beispielen und Projektbezug.

---

## Chunk

**Definition**  
Eine logische Unterteilung eines Dokuments, die ein zusammenhängendes Konzept oder Textabschnitt darstellt.

**Beispiel**  
```
Ein 10-seitiges PDF wird in Chunks zerlegt:
- Chunk 1: Deckblatt (Seite 1)
- Chunk 2: Inhaltsverzeichnis (Seite 2)
- Chunk 3: Einleitung (Seiten 3-4)
- Chunk 4: Körper/Inhalt (Seiten 5-9)
- Chunk 5: Anhang (Seite 10)
```

**Bedeutung im Projekt**  
Chunks ermöglichen effiziente Verarbeitung großer Dokumente, ohne den gesamten Text auf einmal laden zu müssen. Sie bilden die Granularität für Extraktionen und Lernprozesse.

---

## Parser

**Definition**  
Eine Komponente, die ein Dokument in strukturierte Daten zerlegt und normalisiert. Sie konvertiert verschiedene Eingabeformate (PDF, HTML, DOCX) in ein einheitliches internes Format.

**Beispiel**  
```typescript
// HTMLParser konvertiert:
<div class="invoice">
  <span class="number">INV-2024-001</span>
</div>

// In strukturiert:
{
  documentType: "html",
  sections: [
    { id: "invoice", content: {...}, type: "div" }
  ],
  metadata: { language: "de", encoding: "utf-8" }
}
```

**Bedeutung im Projekt**  
Parser ist die erste Stufe der Extraktions-Pipeline. Ein fehlerhafter Parser führt zu falschen Extraktionen. Darum ist Validierung und Unit-Testing für Parser kritisch.

---

## Document

**Definition**  
Das primäre Eingabe-Artefakt des Systems. Ein Dokument ist eine vollständige Datei (PDF, HTML, DOCX, Text) mit eindeutiger ID, Hash und Metadaten.

**Beispiel**  
```typescript
interface Document {
  documentId: "invoice-2024-001",
  fileName: "Invoice_Acme_2024.pdf",
  documentType: "pdf",
  hash: "sha256:abc123...", // Integrität
  uploadedAt: Date,
  fileSize: 245000, // bytes
  language: "de"
}
```

**Bedeutung im Projekt**  
Jede Extraktion ist an ein Document gebunden. Das Hash-Feld ermöglicht Revisionssicherheit: Wurde das Dokument verändert, ist der Hash unterschiedlich. Documents sind immutable.

---

## Metadata

**Definition**  
Strukturierte Zusatzinformationen über ein Dokument oder einen extrahierten Wert, die den Kontext klären aber keine Geschäftsdaten sind.

**Beispiel**  
```json
{
  "document": {
    "createdAt": "2024-01-15T10:00:00Z",
    "author": "Finance Dept",
    "language": "de",
    "pageCount": 5
  },
  "extraction": {
    "extractedAt": "2024-01-15T10:35:00Z",
    "ruleSetVersion": "1.2.0",
    "processingTimeMs": 342
  }
}
```

**Bedeutung im Projekt**  
Metadata ermöglicht Audit-Trails und Performance-Tracking. Sie sind essentiell für Revisionssicherheit und Debugging.

---

## Rule

**Definition**  
Eine deklarative Spezifikation, **WAS** extrahiert werden soll. Eine Rule definiert nicht die Extraktion selbst, sondern nur die Anforderungen (Feldname, Typ, Constraints).

**Beispiel**  
```json
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
```

**Bedeutung im Projekt**  
Rules sind **nicht datengenerierend**. Sie sagen nur: "Suche nach einer Rechnungsnummer mit diesen Eigenschaften". Rules dürfen niemals Werte erfinden oder halluzinieren.

---

## Schema

**Definition**  
Ein Set von Rules, das die Struktur und Anforderungen für Extraktionen aus einem bestimmten Dokumenttyp definiert.

**Beispiel**  
```
invoice.schema.json:
  ├─ invoiceNumber (required, string)
  ├─ invoiceDate (required, date)
  ├─ customerName (required, string)
  ├─ totalAmount (required, number)
  └─ dueDate (optional, date)

contract.schema.json:
  ├─ contractId (required, string)
  ├─ parties (required, array)
  ├─ effectiveDate (required, date)
  └─ terminationClause (optional, string)
```

**Bedeutung im Projekt**  
Schemas sorgen für Konsistenz. Sie sind versioniert und nachverfolgbar. Ein Schema-Update ist eine Breaking Change und muss dokumentiert sein.

---

## Entity

**Definition**  
Ein extrahiertes Geschäftsobjekt mit eindeutiger Identität und Relationen zu anderen Entities. Entities sind komplexer als simple Values.

**Beispiel**  
```typescript
interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  customer: CustomerEntity;
  lineItems: LineItemEntity[];
  totals: TotalEntity;
  metadata: {
    extractedAt: Date;
    confidence: number;
  }
}
```

**Bedeutung im Projekt**  
Entities ermöglichen relationale Extraktionen. Eine Rechnung ist nicht nur eine Nummer, sondern ein Entity mit Beziehungen zu Customer, LineItems, etc. Jede Relation muss mit einer SourceReference versehen sein.

---

## Confidence

**Definition**  
Ein numerischer Wert zwischen 0 und 1, der angibt, wie sicher die Extraktion eines Wertes ist. Basiert auf verfügbaren Quellen und Validierungsergebnissen.

**Beispiel**  
```typescript
// 1.0 = Exakt im Dokument gefunden
engine.extract("invoiceNumber", "INV-2024-001", sources, 1.0);

// 0.95 = Sehr wahrscheinlich, kleine Abweichung vom Standard
engine.extract("customerName", "Acme GmbH", sources, 0.95);

// 0.7 = Wahrscheinlich, aber mehrdeutig
engine.extract("department", "Sales", sources, 0.7);

// < 0.8 = Wird gefiltert, auf null gesetzt
engine.extract("unknownField", "value", sources, 0.5); // → null
```

**Bedeutung im Projekt**  
Confidence ist eine **Pflichtangabe**, nicht optional. Ohne Confidence kann keine Entscheidung getroffen werden. Werte unter 0.8 werden automatisch gefiltert (Halluzinations-Schutz).

---

## MissingField

**Definition**  
Ein Feld, das in der Rule als `isRequired: true` definiert ist, aber im Dokument nicht gefunden wurde.

**Beispiel**  
```json
{
  "resultId": "result-001",
  "missingFields": [
    "customerAddress",
    "paymentTerms",
    "dueDate"
  ],
  "warnings": [
    {
      "field": "customerAddress",
      "level": "error",
      "message": "Required field 'customerAddress' is missing"
    }
  ]
}
```

**Bedeutung im Projekt**  
MissingFields sind nicht optional. Ein Extraktionsergebnis mit MissingFields ist unvollständig und muss gekennzeichnet werden. Sie triggern Error-Level-Warnings.

---

## Hallucination

**Definition**  
Ein Wert, der vom System erfunden oder geschätzt wurde, statt ihn aus dem Dokument zu extrahieren. Halluzinationen sind die **schwerwiegendste** Qualitätsbeeinträchtigung.

**Beispiel**  
```typescript
// ❌ HALLUZINATION: Keine Quelle
{
  value: "Meyer GmbH",
  confidence: 0.9,
  sources: [] // ← FEHLER!
}

// ❌ HALLUZINATION: Geschätzt
{
  value: calculateEstimatedTotal(),
  confidence: 0.5,
  sources: []
}

// ❌ HALLUZINATION: Implizit angenommen
{
  value: document.customerType || "PRIVATE", // ← Erfunden!
  confidence: 0.8,
  sources: []
}

// ✅ KORREKT
{
  value: "Meyer GmbH",
  confidence: 0.99,
  sources: [{
    documentReference: {...},
    textSnippet: "Customer: Meyer GmbH",
    pageNumber: 1
  }]
}
```

**Bedeutung im Projekt**  
Halluzinationen sind das System-Breaking. Sie untergraben Vertrauen und Audit-Sicherheit. Das System ist speziell dafür ausgelegt, sie zu **verhindern**, nicht zu erlauben.

---

## HallucinationValidator

**Definition**  
Eine Komponente, die jeden extrahierten Wert prüft und Halluzinationen blockiert. Sie validiert, dass jeder Wert (außer null) eine Quelle hat.

**Beispiel**  
```typescript
import { validateNoHallucination } from '@domain/ExtractionRule';

const value = {
  value: "Some text",
  confidence: 0.99,
  sources: [] // ← FEHLER!
};

if (!validateNoHallucination(value)) {
  throw new Error('Hallucination detected: No source provided');
}
```

**Bedeutung im Projekt**  
Der HallucinationValidator läuft **automatisch** nach jeder Extraktion. Er ist eine Sicherheitslage, die verhindert, dass fehlerhafte Werte das System verlassen. Kein anderer Code kann ihn überschreiben.

---

## Reflection

**Definition**  
Eine Lernfunktion, die erfolgreiche Extraktionen analysiert und das System über eigene Stärken aufklärt. **Generiert KEINE neuen Daten.**

**Beispiel**  
```typescript
learning.recordSuccessfulExtraction(
  'invoice-header-pattern',
  'document-123',
  0.98 // Confidence
);

// Reflection Output:
{
  pattern: 'invoice-header-pattern',
  frequency: 47,
  successRate: 0.94,
  lastObserved: '2024-01-15T10:35:00Z'
}
```

**Bedeutung im Projekt**  
Reflection ist Statistik, nicht Generierung. Sie antwortet auf "Wie oft funktioniert Pattern X?", nicht "Was sollte das Dokument enthalten?".

---

## Correction

**Definition**  
Ein Mechanismus, durch den sich das System selbst korrigiert, wenn eine Extraktion fehlerhaft erkannt wird. Corrections sind **Lernprozesse**, keine Datenänderungen.

**Beispiel**  
```typescript
// Initiale Extraktion war falsch
initial: { value: "2024-01-15", confidence: 0.7 }

// Nutzer korrigiert
correction: { value: "2024-01-05", confidence: 1.0, reason: "OCR error" }

// System lernt
learning.recordCorrection('date-pattern-ocr', 'low-confidence-dates')

// Nächste ähnliche Extraktion: Score wird berücksichtigt
```

**Bedeutung im Projekt**  
Corrections sind nicht zur Datenbankänderung, sondern zum Tunen der Extraktionsregeln. Sie führen zu besseren Rules, nicht zu faktierten Werten.

---

## Embedding

**Definition**  
Eine vektorielle Darstellung eines Textstücks in einem mehrdimensionalen Raum. Embeddings ermöglichen semantische Ähnlichkeit zu berechnen.

**Beispiel**  
```typescript
// Text
"The quick brown fox"

// Embedding (vereinfacht, real: 768-1024 Dimensionen)
[0.123, -0.456, 0.789, ..., 0.234]

// Ähnliche Embeddings:
"A fast brown fox" → [0.125, -0.455, 0.790, ..., 0.235]
Ähnlichkeit: 0.98

// Unterschiedliche Embeddings:
"Das ist ein Kuchen" → [0.8, 0.2, -0.5, ..., -0.1]
Ähnlichkeit: 0.12
```

**Bedeutung im Projekt**  
Embeddings helfen dem Lern-System, ähnliche Extraktions-Fehler zu identifizieren. Sie werden **nur für Analyse** gespeichert, nie zur Datengenerierung verwendet.

---

## SimilarityScore

**Definition**  
Eine Metrik (0-1), die angibt, wie ähnlich zwei Werte oder Patterns basierend auf ihren Embeddings sind.

**Beispiel**  
```typescript
// Zwei Rechnungsnummern:
score('INV-2024-001', 'INV-2024-002') = 0.97  // Sehr ähnlich (Format)

// Verschiedene Formate:
score('INV-2024-001', 'R/2024/001') = 0.72    // Ähnlich (Jahr)

// Unterschiedliche Domänen:
score('INV-2024-001', 'PO-2024-001') = 0.45   // Wenig ähnlich
```

**Bedeutung im Projekt**  
SimilarityScores helfen dem Learning-System, Muster zu clustern. Sie sind nur Metadaten, **generieren keine Werte**.

---

## LearningEngine

**Definition**  
Die Komponente, die Extraktionsergebnisse analysiert und Optimierungsempfehlungen gibt. **Darf NIEMALS neue Fakten erfinden.**

**Beispiel**  
```typescript
const learning = new LearningComponent();

// ✅ OK: Erfolg tracken
learning.recordSuccessfulExtraction('date-pattern', 'doc-123', 0.95);

// ✅ OK: Empfehlungen geben
suggestions = learning.getOptimizationSuggestions();
// → "Pattern 'X' has 12% error rate - review regex"

// ❌ FALSCH: Werte ergänzen
learning.patterns.set('customerName', 'Unknown Company'); // Nicht erlaubt!
```

**Bedeutung im Projekt**  
LearningEngine ist der Qualitätsberater des Systems. Sie sagt "Das ist verdächtig", nicht "Das ist falsch, hier ist der wahre Wert".

---

## SourceReference

**Definition**  
Die genaue Angabe, woher ein extrahierter Wert im Quell-Dokument stammt. Inklusive Dokument-ID, Seite, Textausschnitt, Byte-Position.

**Beispiel**  
```typescript
interface SourceReference {
  documentReference: {
    documentId: "invoice-123",
    fileName: "Invoice_2024.pdf",
    hash: "sha256:abc123...", // Für Integrität
    uploadedAt: Date
  },
  pageNumber: 1,
  sectionId: "header",
  textSnippet: "Invoice Number: INV-2024-001",
  offsetStart: 1245,    // Byte 1245
  offsetEnd: 1260       // Byte 1260
}
```

**Bedeutung im Projekt**  
SourceReferences sind die **Basis der Revisionssicherheit**. Ohne sie kann nicht bewiesen werden, dass ein Wert echt ist. Jeder Wert muss mindestens eine SourceReference haben.

---

## Regressionstest

**Definition**  
Ein Test, der sicherstellt, dass bekannte Extraktionen weiterhin funktionieren, wenn Code geändert wird. Verhindert, dass Verbesserungen andere Funktionen brechen.

**Beispiel**  
```typescript
describe('Regression Tests', () => {
  it('should still extract invoice numbers correctly', () => {
    const result = engine.extract(
      'invoiceNumber',
      'INV-2024-001',
      sources,
      0.99
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('should still filter low-confidence values', () => {
    const result = engine.applyConfidenceFilter(
      { value: 'test', confidence: 0.5, sources: [] },
      0.8
    );
    expect(result.value).toBeNull();
  });
});
```

**Bedeutung im Projekt**  
Regressionstests sind obligatorisch vor dem Release. Sie verhindern, dass Refactorings die Extraktionsqualität beeinträchtigen.

---

## Revisionssicherheit

**Definition**  
Die Eigenschaft eines Systems, dass alle Operationen nachverfolgbar, überprüfbar und nicht manipulierbar sind. Erforderlich für Audit und Compliance.

**Komponenten:**
- SHA256-Hashes für Dokumenten-Integrität
- Audit-Trails mit Zeitstempeln
- SourceReferences für alle Werte
- Unveränderliche Ergebnisse (append-only)

---

## 🆕 Phase 16: Persistente Datenbankebene

Diese Begriffe wurden in Phase 16 eingeführt.

---

## Schema Persistence

**Definition**  
Die Speicherung von JSON-Schemas in einer relationalen Datenbank (PostgreSQL) statt im Arbeitsspeicher. Schemasdaten überstehen Application-Neustarts.

**Beispiel**  
```typescript
// Phase 15 (Arbeitsspeicher):
const schemaMap = new Map(); // Weg nach Restart!

// Phase 16 (Persistent):
@Entity('schemas')
class SchemaEntity {
  @PrimaryColumn('uuid') id: string;
  @Column('jsonb') schema: Record<string, unknown>;
  @Column() version: number;
  @CreateDateColumn() createdAt: Date;
}
// Bleibt in PostgreSQL gespeichert ✅
```

**Bedeutung im Projekt**  
Schema Persistence ist die Basis von Phase 16. Ohne sie sind alle Extraktionsregeln nach dem Neustart verloren.

---

## SchemaEntity

**Definition**  
Eine TypeORM-Entity, die ein JSON-Schema in einer PostgreSQL-Tabelle darstellt. Mit 13 Spalten für Metadaten, Versionierung und Statusverfolgung.

**Struktur:**
```typescript
{
  id: UUID (Primärschlüssel)
  userId: string (Multi-Mandanten)
  name: string (Schemaname, unique pro Nutzer)
  description: string (Benutzerdefiniert)
  version: number (Versionscounter)
  schema: JSONB (Vollständiges JSON-Schema)
  examplesCount: number (Trainingsbeispiele)
  generatedRulesCount: number (Regelanzahl)
  averageConfidence: number (Durchschn. Konfidenz)
  status: enum('active', 'archived', 'draft')
  directoryPath: string (Dateisystem-Pfad)
  metadata: JSONB (Benutzerdefiniert)
  isArchived: boolean (Versionsflag)
  previousVersionId: UUID (Versionskette)
  createdAt: Date
  updatedAt: Date
}
```

**Bedeutung im Projekt**  
SchemaEntity ist die persistente Repräsentation eines Schemas. Jede Zeile in der `schemas`-Tabelle ist eine Version eines Schemas.

---

## SchemaRepository

**Definition**  
Das Data Access Layer (DAL) für Schemas. Bietet typsichere Datenbankoperationen und filtert automatisch archivierte Schemas.

**9 Hauptmethoden:**
```
create(data)              → Schema erstellen
findById(id)              → Nach ID suchen
findByName(userId, name)  → Nach Name suchen
findAllByUser(userId)     → Alle für Nutzer
findVersionHistory(id)    → Letzte 2 Versionen
update(id, data)          → Update mit Versionierung
deleteAllVersions(id)     → Komplett löschen
getStatistics()           → Statistiken
search(query, pagination) → Volltextsuche (ILIKE)
```

**Beispiel:**
```typescript
const repo = container.resolve(SchemaRepository);

// Neues Schema erstellen
const schema = await repo.create({
  userId: 'user-123',
  name: 'Invoice Schema',
  schema: invoiceSchema
});

// Version abrufen
const versionHistory = await repo.findVersionHistory(schema.id);
// → [ { version: 1, ... }, { version: 2, ... } ]
```

**Bedeutung im Projekt**  
SchemaRepository entkoppelt die Geschäftslogik von Datenbankdetails. Services nutzen das Repository, nicht direkt TypeORM.

---

## SchemaStorageService

**Definition**  
Die Business Logic Layer für Schemas. Koordiniert Repository + Dateisystem + Versionierung. 11 Methoden für Schema-Management.

**Hauptfunktionen:**
```
createSchema()            → Validiere + erstelle
updateSchema()            → Update mit Versioning
getSchema()               → Abrufen mit Error-Handling
listSchemas()             → Alle auflisten
deleteSchema()            → Löschen
getVersionHistory()       → Versionsverlauf
updateMetadata()          → Metadaten ändern
updateExamplesCount()     → Beispiel-Statistik
updateRulesStats()        → Regel-Statistik
searchSchemas()           → Volltextsuche
archive()                 → Archivieren (ohne Löschen)
```

**Beispiel:**
```typescript
@injectable()
class SchemaStorageService {
  async createSchema(input: CreateSchemaInput): Promise<SchemaEntity> {
    // 1. Validiere unique name
    const existing = await this.repo.findByName(
      input.userId,
      input.name
    );
    if (existing) throw new Error('Schema name already exists');

    // 2. Erstelle Verzeichnis
    const dirPath = this.createSchemaDirectory(input.name);

    // 3. Speichere in DB
    return await this.repo.create({
      ...input,
      directoryPath: dirPath
    });
  }

  async updateSchema(
    id: string,
    data: Partial<SchemaEntity>
  ): Promise<SchemaEntity> {
    // Repository handhabt Versionierung automatisch
    // Alte Version wird archiviert
    // Nur 2 Versionen behalten
    return await this.repo.update(id, data);
  }
}
```

**Bedeutung im Projekt**  
SchemaStorageService ist die Single Source of Truth für Schema-Operationen. Sie gewährleistet Konsistenz und Fehlerbehandlung.

---

## Version Retention Policy

**Definition**  
Eine Regel, die bestimmt, wie viele Versionen eines Schemas gespeichert werden. Phase 16 behält die **letzten 2 Versionen**.

**Workflow:**
```
Schema v1 (Original)

↓ (Nutzer aktualisiert Schema)

v1 → ARCHIVIERT
v2 → AKTIV

↓ (Nutzer aktualisiert erneut)

v1 → GELÖSCHT (zu alt)
v2 → ARCHIVIERT
v3 → AKTIV

(Maximal 2 Versionen gespeichert)
```

**Logik in SchemaRepository.update():**
```typescript
async update(id: string, data: Partial<SchemaEntity>) {
  const existing = await this.findById(id);
  if (!existing) throw new Error('Schema not found');

  // Alte Version archivieren
  if (data.version && data.version > existing.version) {
    existing.isArchived = true;
    await this.repository.save(existing);

    // Alle Versionen abrufen
    const allVersions = await this.repository.find({
      where: { name: existing.name, userId: existing.userId },
      order: { version: 'DESC' }
    });

    // Versionen > 2 löschen
    if (allVersions.length > 2) {
      const toDelete = allVersions.slice(2);
      await this.repository.remove(toDelete);
    }
  }

  // Neue Version speichern
  const updated = this.repository.merge(existing, data);
  return await this.repository.save(updated);
}
```

**Bedeutung im Projekt**  
Version Retention Policy verhindert, dass die Datenbank ungebremst wächst. 2 Versionen bieten Backup ohne zu viel Speicher.

---

## Multi-Tenant Architecture

**Definition**  
Ein Systemdesign, bei dem mehrere unabhängige Nutzer in der gleichen Anwendung ihre Daten haben, aber nicht sehen können.

**Umsetzung in Phase 16:**
```typescript
// Jede Datenbankoperation filtert nach userId
async findAllByUser(userId: string): Promise<SchemaEntity[]> {
  return this.repository.find({
    where: { userId }  // ← Nur diesen Nutzer
  });
}

// Schemas sind unique pro Nutzer (nicht global)
@Index(['userId', 'name'], { unique: true })
// Alice kann "Invoice Schema" haben
// Bob kann auch "Invoice Schema" haben
// Sie sind voneinander unabhängig!
```

**Beispiel:**
```
Alice (userId: alice-123):
  ├── Invoice Schema v1
  ├── Purchase Order Schema v2
  └── Contract Schema v1

Bob (userId: bob-456):
  ├── Invoice Schema v1  ← Andere Kopie!
  └── Invoice Schema v2

Carol (userId: carol-789):
  └── (Keine Schemas)

# Jeder sieht nur die eigenen Schemas!
GET /api/schema (Alice)   → [Invoice, PO, Contract]
GET /api/schema (Bob)     → [Invoice v1, Invoice v2]
GET /api/schema (Carol)   → []
```

**Bedeutung im Projekt**  
Multi-Tenant ermöglicht, mehrere Organisationen oder Teams mit einer Instanz zu bedienen. Essentiell für SaaS-Modelle.

---

## TypeORM DataSource

**Definition**  
Die zentrale Konfiguration für PostgreSQL-Verbindung. Initialisiert beim Server-Start, vor allen anderen Services.

**Datei:** `src/infrastructure/database/data-source.ts`

**Konfiguration:**
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'extractor_user',
  password: process.env.DB_PASSWORD || 'extractor_pass',
  database: process.env.DB_NAME || 'extractor_db',
  entities: [SchemaEntity],
  synchronize: true, // Auto-Sync in Dev
  logging: process.env.DB_LOGGING === 'true'
});

export async function initializeDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}
```

**Initialization Order:**
```
1. ServiceContainer (DI)
2. Database (PostgreSQL)  ← DataSource hier
3. ConfigManager
4. BackupService
5. HelpContentLoader
```

**Bedeutung im Projekt**  
DataSource muss zuerst initialisiert werden, damit alle Services die DB nutzen können. Sie ist ein Singleton.

---

## Dependency Injection (DI)

**Definition**  
Ein Pattern, bei dem Services ihre Abhängigkeiten vom Container erhalten (nicht selbst erstellen).

**Phase 16 DI-Registrierung:**
```typescript
// src/infrastructure/di/ServiceContainer.ts
container.registerSingleton(SchemaRepository);
container.registerSingleton(SchemaStorageService);

// In Routes:
@injectable()
class SchemaExtractionRoutes {
  constructor(
    private schemaStorage: SchemaStorageService
  ) {
    // TSyringe injiziert automatisch!
  }
}
```

**Vorteil:**
- Austauschbar (Mock in Tests)
- Singleton (eine Instanz pro App)
- Type-safe (TypeScript)
- Testbar

**Bedeutung im Projekt**  
DI macht die Architektur flexibel und testbar. Phase 16 nutzt TSyringe Container.

---

## Atomic Operations

**Definition**  
Datenbankoperationen, die entweder komplett erfolgreich sind oder komplett rückgängig gemacht werden. Keine Teilzustände.

**Beispiel (Versioning):**
```typescript
// ❌ NICHT ATOMIC (2 separate Queries):
await repository.save(oldVersion);  // Archiviert
await repository.save(newVersion);  // Falls dieser fehlschlägt?

// ✅ ATOMIC (in einer Transaktion):
await AppDataSource.transaction(async (manager) => {
  await manager.save(oldVersion);   // Archiviert
  await manager.save(newVersion);   // Nur wenn beide OK
  // Wenn einer fehlschlägt: Rollback aller
});
```

**Bedeutung im Projekt**  
Atomic Operations garantieren Datenkonsistenz. Eine fehlerhafte Versioning würde sonst das Schema korrumpieren.

---

## Schema Validation (JSONB)

**Definition**  
Die Überprüfung, dass in JSONB gespeicherte Schemas gültig sind (JSON-Schema Draft-07).

**Umsetzung:**
```typescript
// Beim Erstellen eines Schemas
async createSchema(input: CreateSchemaInput): Promise<SchemaEntity> {
  // Validiere: Ist das ein gültiges JSON-Schema?
  const validator = new SchemaValidator();
  if (!validator.isValidSchema(input.schema)) {
    throw new Error('Invalid JSON Schema format');
  }

  // Jetzt OK zu speichern
  return await this.repo.create({
    schema: input.schema,  // JSONB
    // ...
  });
}
```

**Bedeutung im Projekt**  
JSONB-Validierung verhindert, dass ungültige Schemas in die DB gelangen. Sie ist eine Eingangsschutzmaßnahme.

---

## Archive vs Delete

**Definition**  
Zwei verschiedene Operationen:
- **Archive**: Markieren als inaktiv (`isArchived: true`), Daten bleiben
- **Delete**: Komplett aus DB entfernen

**Implementierung:**
```typescript
// Archive (2 Versionen halten):
async update(id: string, newData: Partial<SchemaEntity>) {
  existing.isArchived = true;  // Nur flagged, nicht gelöscht!
  await this.repository.save(existing);
}

// Delete (komplett weg):
async deleteAllVersions(id: string) {
  const allVersions = await this.repository.find({ /* ... */ });
  await this.repository.remove(allVersions);  // Wirklich gelöscht!
}
```

**Unterschiede:**
```
Archive:
  - Daten lesbar für Audit
  - Kann wiederhergestellt werden
  - Schnell (nur Flag-Update)

Delete:
  - Daten wirklich weg
  - Nicht wiederherstellbar
  - Permanent (cascading deletes)
```

**Bedeutung im Projekt**  
Archive ist Standard in Phase 16 (Revisionssicherheit). Delete ist nur Admin-Funktion.
- Confidence-Scores für Validierung

**Beispiel**  
```
Revisionssicher? ✅ Diese Extraktion:
{
  value: "Meyer GmbH",
  confidence: 0.99,
  sources: [{
    documentId: "inv-123",
    hash: "sha256:...",
    textSnippet: "Customer: Meyer GmbH"
  }],
  extractedAt: 2024-01-15T10:35:00Z
}

Nicht sicher? ❌ Diese Extraktion:
{
  value: "Meyer GmbH",
  sources: [],  // ← Keine Quelle!
  confidence: 0.5
}
```

**Bedeutung im Projekt**  
Revisionssicherheit ist das **Kernziel** des Systems. Sie unterscheidet es von normalen Extraktoren. Ohne sie ist das System für Compliance-Anforderungen unbrauchbar.

---

## SemanticVersioning

**Definition**  
Ein Versionierungsschema `MAJOR.MINOR.PATCH`, das angibt, ob Änderungen Breaking Changes sind.

**Schema:**
- `MAJOR`: Breaking change (z.B. neue erforderliche Felder)
- `MINOR`: Neue Feature, rückwärtskompatibel (z.B. neues optionales Feld)
- `PATCH`: Bug-Fix, keine neuen Features

**Beispiel**  
```
1.0.0 → 1.0.1    PATCH: Fixed OCR error in date parsing
1.0.1 → 1.1.0    MINOR: Added optional 'department' field
1.1.0 → 2.0.0    MAJOR: Removed 'legacyId' field (Breaking!)

Regel: Wenn Schema ändert → MAJOR
       Wenn neue optionale Regel → MINOR
       Wenn Rule-Optimierung → PATCH
```

**Bedeutung im Projekt**  
SemanticVersioning macht Änderungen nachvollziehbar. Clients können sehen, ob ihre Extraktionen kompatibel bleiben. Version-Mismatches werden als Errors gemeldet.

---

## Glossar-Verwendung

- **Bei Code-Reviews**: "Ist diese Komponente ein Parser oder ein Transformer?"
- **Bei Diskussionen**: "Das ist eine Halluzination, keine Extraktion"
- **Bei Tests**: "Diesen Test können wir als Regressionstest kategorisieren"
- **Bei Releases**: "Das ist ein MINOR, weil das neue Feld optional ist"

---

**Letzte Aktualisierung**: 2026-01-15  
**Version**: 1.0.0  
**Gültig für**: System v1.0.0+
