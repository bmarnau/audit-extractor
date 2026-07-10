# 📖 Anwenderhandbuch - Version 0.16.0
## Datenbankgestützte Schema-Verwaltung mit Versionskontrolle

**Version:** 0.16.0  
**Datum:** 2026-07-08  
**Status:** ✅ Produktionsreife (Phase 16A - Datenbankebene)  
**Zielgruppe:** Endanwender, Administratoren, Systemintegratoren

---

## 🎯 Überblick: Was ist neu in 0.16.0?

Version 0.16.0 führt **persistente Datenbankgestützte Speicherung** ein. Ihre Extraktionsschemas sind jetzt nach dem Neustart noch vorhanden!

```
Alt (Version 0.15 und früher):
  Schemas speichern → App neustarten → ❌ Schemas weg!

Neu (Version 0.16):
  Schemas speichern → PostgreSQL-Datenbank → App neustarten → ✅ Schemas noch da!
  Plus: Automatische Versionskontrolle + Archiv-Funktion
```

### Wichtigste Neuerungen
- ✅ **Persistente Speicherung** - Schemas überstehen App-Neustarts
- ✅ **Automatische Versionierung** - Letzte 2 Versionen immer verfügbar
- ✅ **Benutzer-Isolation** - Multi-Mandanten-Ready (jeder Nutzer hat eigene Schemas)
- ✅ **Vollständige Rückwärtskompatibilität** - Phase 15 funktioniert weiterhin!

---

## 📚 Was war Phase 15?

### Phase 15: "Lernen von Beispielen" ✅

Phase 15 führte den **automatischen Regelgenerator** ein:

#### Der Phase 15 Workflow
```
1. JSON-Schema hochladen
   (Zielstruktur definieren: Rechnungsnummern, Datum, Betrag, etc.)
   ↓
2. Beispiel-JSON-Dateien hochladen
   (3-5 gefüllte Beispiele als Trainingsmaterial)
   ↓
3. System generiert Extraktionsregeln automatisch
   (Muster erkennen, Suchstrings identifizieren)
   ↓
4. Regeln auf neue Dokumente anwenden
   (Automatische Extraktion mit erkannten Regeln)
   ↓
5. Ergebnisse gegen Schema validieren
   (Stellt sicher: alle erforderlichen Felder ausgefüllt)
```

#### Phase 15 Komponenten
- **SchemaAnalyzer** - Analysiert die Schemastruktur
- **ExampleAnalyzer** - Lernt von den Beispiel-Dateien
- **RuleGenerator** - Erstellt Extraktionsregeln automatisch
- **5 REST-APIs** - Vollständige Verwaltung über HTTP
- **Assistent-Oberfläche** - 5-Schritte-Wizard für Anfänger

#### Phase 15 REST-APIs (noch vorhanden in 0.16!)
```
POST   /api/schema/upload                    → Schema + Beispiele hochladen
POST   /api/schema/:schemaId/generate-rules  → Regeln generieren
GET    /api/schema/:schemaId                 → Schema anzeigen
GET    /api/schema/:schemaId/rules           → Generierte Regeln anzeigen
DELETE /api/schema/:schemaId                 → Schema löschen
```

---

## 🚀 Schnellstart: In 5 Minuten starten

### Schritt 0: Voraussetzungen

Sie brauchen:
- Ein Webbrowser (Chrome, Firefox, Safari, Edge)
- Die URL der Anwendung (z.B. http://localhost:3000)
- Ein PDF zum Testen

### Schritt 1: Schema erstellen

Definieren Sie, **welche Daten** Sie extrahieren möchten. Beispiel für Rechnungen:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Invoice",
  "description": "Rechnungsdaten",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Rechnungsnummer (z.B. INV-2024-001)"
    },
    "invoiceDate": {
      "type": "string",
      "format": "date",
      "description": "Ausstellungsdatum (YYYY-MM-DD)"
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "description": "Zahlungsfrist (YYYY-MM-DD)"
    },
    "customerName": {
      "type": "string",
      "description": "Name des Kunden"
    },
    "totalAmount": {
      "type": "number",
      "description": "Gesamtbetrag in EUR"
    },
    "currency": {
      "type": "string",
      "description": "Währung (EUR, USD, etc.)"
    },
    "paymentTerms": {
      "type": "string",
      "description": "Zahlungsbedingungen (z.B. Net 30)"
    },
    "vendorName": {
      "type": "string",
      "description": "Name des Verkäufers"
    },
    "taxAmount": {
      "type": "number",
      "description": "Steuerbetrag"
    },
    "status": {
      "type": "string",
      "enum": ["paid", "pending", "overdue"],
      "description": "Zahlungsstatus"
    }
  },
  "required": [
    "invoiceNumber",
    "invoiceDate",
    "customerName",
    "totalAmount"
  ]
}
```

**Wichtig**: 
- `required` = Diese Felder MÜSSEN extrahiert werden
- `properties` = Alle möglichen Felder
- `type` = Datentyp (string, number, boolean, date, etc.)

### Schritt 2: Beispiel-Dateien vorbereiten

Erstellen Sie 3-5 gefüllte JSON-Dateien als Beispiele für das Lernen:

**Beispiel 1: invoice-example-1.json**
```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-14",
  "customerName": "Acme Corp",
  "totalAmount": 1500.50,
  "currency": "EUR",
  "paymentTerms": "Net 30",
  "vendorName": "Tech Solutions GmbH",
  "taxAmount": 285.10,
  "status": "pending"
}
```

**Beispiel 2: invoice-example-2.json**
```json
{
  "invoiceNumber": "INV-2024-002",
  "invoiceDate": "2024-02-01",
  "dueDate": "2024-03-02",
  "customerName": "Global Trading Ltd",
  "totalAmount": 3200.00,
  "currency": "EUR",
  "paymentTerms": "Net 45",
  "vendorName": "Tech Solutions GmbH",
  "taxAmount": 608.00,
  "status": "paid"
}
```

**Warum Beispiele?**
- Das System lernt von realen Daten
- Es erkennt Muster (z.B. "INV-" bei Rechnungsnummern)
- Je besser die Beispiele, desto besser die Regeln
- 3-5 Beispiele reichen normalerweise aus

### Schritt 3: Hochladen im Assistenten

1. Gehen Sie zur **Assistenten-Seite** (Schema-Upload-Wizard)
2. **Schritt 1**: Schema-JSON-Datei hochladen
3. **Schritt 2**: Beispiel-JSON-Dateien hochladen (alle 3-5 Dateien)
4. **Schritt 3**: Vorschau - kontrollieren Sie die erkannten Felder
5. **Schritt 4**: Einstellungen - "Moderate" Aggressivität ist Standard
6. **Schritt 5**: Klicken Sie "Regeln generieren"

**Was passiert dann?**
```
✅ Schema wird in PostgreSQL-Datenbank gespeichert
✅ Automatische UUID wird generiert
✅ Versionsnummer auf 1 gesetzt
✅ Extraktionsregeln werden generiert
✅ Durchschnittliche Konfidenz berechnet
✅ Regeln werden auch in DB gespeichert
```

### Schritt 4: Regeln testen

Jetzt können Sie die generierten Regeln verwenden:

```bash
# 1. PDF hochladen mit den generierten Regeln
POST /api/extraction/with-schema/:schemaId
Body: FormData { documentFile: invoice.pdf }

# 2. Ergebnis anzeigen
{
  "data": {
    "invoiceNumber": "INV-2024-789",
    "invoiceDate": "2024-03-10",
    "dueDate": "2024-04-09",
    "customerName": "New Customer GmbH",
    "totalAmount": 2500.00,
    "currency": "EUR",
    "paymentTerms": "Net 30",
    "vendorName": "Tech Solutions GmbH",
    "taxAmount": 475.00,
    "status": "pending"
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "coverage": {
    "requiredFields": 4,
    "filledRequired": 4,
    "optionalFields": 6,
    "filledOptional": 6
  }
}
```

---

## 🆕 Phase 16: Persistente Datenspeicherung

### Was hat sich geändert?

Hauptänderung: **Schemas sind jetzt persistent!**

```
VORHER (Version 0.15):
  Schema hochladen → Alles im RAM → App neustarten → Weg! 😱

NACHHER (Version 0.16):
  Schema hochladen → In PostgreSQL gespeichert → App neustarten → Noch da! ✅
  Zusätzlich: Automatische Versionierung
```

### Neue Funktionen in 0.16

#### 1. Automatische Versionierung

Jedes Mal, wenn Sie ein Schema aktualisieren:

```
Version 1 (Original)
  ↓ (Sie machen Änderungen)
Version 2 (Neue Version, Version 1 wird archiviert)
  ↓ (Sie machen weitere Änderungen)
Version 3 (Neue Version, Version 1 wird gelöscht, nur Version 2 & 3 bleiben)
```

**Die Regel**: System behält immer die **letzten 2 Versionen**
- Neueste Version: Aktiv
- Zweite neueste: Im Archiv (Backup)
- Ältere Versionen: Automatisch gelöscht

#### 2. Multi-Benutzer-Unterstützung

Jeder Benutzer kann seine eigenen Schemas haben:

```
Benutzer Alice:
  ├── Invoice Schema (v2)
  └── Purchase Order Schema (v1)

Benutzer Bob:
  ├── Invoice Schema (v1)  ← Separate Kopie!
  └── Contract Schema (v1)
```

**Alice's "Invoice Schema"** ist völlig getrennt von **Bob's "Invoice Schema"**
- Können unterschiedliche Versionen haben
- Können unterschiedliche Regeln haben
- Sind vollständig voneinander isoliert

#### 3. Persistente Metadaten

Das System speichert jetzt:
- Erstellungsdatum
- Letzte Änderung
- Anzahl der hochgeladenen Beispiele
- Anzahl der generierten Regeln
- Durchschnittliche Regel-Konfidenz
- Benutzerdefinierte Metadaten

**Wozu ist das wichtig?**
```json
{
  "schemaId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Invoice Schema",
  "version": 2,
  "createdAt": "2026-07-08T10:30:00Z",
  "updatedAt": "2026-07-08T14:45:30Z",
  "examplesCount": 5,
  "generatedRulesCount": 10,
  "averageConfidence": 0.87,
  "status": "active"
}
```

Sie können damit:
- Schemas filtern nach Änderungsdatum
- Regeln vergleichen nach Konfidenz
- Problematische Schemas (niedrige Konfidenz) identifizieren

---

## 📖 Referenz: REST-APIs

### 1. Schema hochladen

```
POST /api/schema/upload
Content-Type: application/json

{
  "schema": { /* JSON-Schema-Objekt */ },
  "examples": [ /* Array von Beispiel-Objekten */ ],
  "schemaName": "Invoice"  // Optional
}

Response (201 Created):
{
  "schemaId": "550e8400-e29b-41d4-a716-446655440000",
  "schemaName": "Invoice",
  "fieldsCount": 10,
  "examplesCount": 5,
  "uploadedAt": "2026-07-08T12:34:56Z",
  "version": 1,
  "message": "Schema erfolgreich hochgeladen"
}
```

### 2. Regeln generieren

```
POST /api/schema/:schemaId/generate-rules
Content-Type: application/json

{
  "aggressiveness": 0.7,
  "customKeywords": ["invoice", "total"]
}

Response (200 OK):
{
  "schemaId": "550e8400-e29b-41d4-a716-446655440000",
  "rules": [
    {
      "fieldName": "invoiceNumber",
      "confidence": 0.95,
      "patterns": ["Invoice #", "INV-", "Rechnungs"],
      "extractionStrategy": "pattern_match"
    },
    // ... mehr Regeln
  ],
  "stats": {
    "rulesGenerated": 10,
    "averageConfidence": 0.87,
    "warnings": []
  }
}
```

### 3. Schema abrufen

```
GET /api/schema/:schemaId

Response (200 OK):
{
  "schemaId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Invoice Schema",
  "version": 2,
  "fieldsCount": 10,
  "examplesCount": 5,
  "status": "active",
  "createdAt": "2026-07-08T10:30:00Z",
  "updatedAt": "2026-07-08T14:45:30Z",
  "hasGeneratedRules": true,
  "schema": { /* vollständiges Schema */ }
}
```

### 4. Versionsverlauf anzeigen

```
GET /api/schema/:schemaId/history

Response (200 OK):
{
  "schemaId": "550e8400-e29b-41d4-a716-446655440000",
  "versions": [
    {
      "version": 2,
      "status": "active",
      "createdAt": "2026-07-08T14:45:30Z",
      "updatedAt": "2026-07-08T14:45:30Z"
    },
    {
      "version": 1,
      "status": "archived",
      "createdAt": "2026-07-08T10:30:00Z",
      "updatedAt": "2026-07-08T14:45:30Z"
    }
  ]
}
```

### 5. Schema löschen

```
DELETE /api/schema/:schemaId

Response (200 OK):
{
  "message": "Schema und alle Versionen erfolgreich gelöscht"
}
```

### 6. Mit Schema extrahieren

```
POST /api/extraction/with-schema/:schemaId
Content-Type: multipart/form-data

Body:
  documentFile: invoice.pdf

Response (200 OK):
{
  "data": {
    "invoiceNumber": "INV-2024-789",
    "invoiceDate": "2024-03-10",
    // ... alle Felder
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "coverage": {
    "requiredFields": 4,
    "filledRequired": 4,
    "optionalFields": 6,
    "filledOptional": 6
  }
}
```

---

## ⚙️ Installation & Setup

### Voraussetzungen

```
✅ Node.js 24.x
✅ npm 10.x
✅ PostgreSQL 15 (wird via Docker bereitgestellt)
✅ Docker & Docker Compose (optional, aber empfohlen)
```

### Setup in 3 Schritten

#### Schritt 1: Dependencies installieren

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install --ignore-scripts
```

**Was passiert:**
- Alle npm-Pakete werden heruntergeladen
- TypeORM, PostgreSQL-Treiber, Express, etc.
- Dauert 2-3 Minuten beim ersten Mal

#### Schritt 2: PostgreSQL starten

```bash
# Mit Docker Compose:
docker-compose up -d postgres

# Das startet:
# - PostgreSQL 15 auf Port 5432
# - Datenbank: extractor_db
# - Benutzer: extractor_user
# - Passwort: extractor_pass

# Dauert 30 Sekunden beim ersten Start
```

#### Schritt 3: Application starten

```bash
npm run build
npm run dev

# Output sollte sein:
# > Server starting on port 3000
# > Database connected successfully
# > All systems ready ✅
```

**Fertig!** Die Application ist jetzt verfügbar unter:
```
http://localhost:3000
```

---

## 🆘 Häufig gestellte Fragen

### F: Wo werden meine Schemas gespeichert?
A: In der PostgreSQL-Datenbank `extractor_db`. Daten überleben App-Neustarts.

### F: Was passiert beim Update eines Schemas?
A: Das System erstellt automatisch eine neue Version. Die letzte Version wird archiviert. Versionen älter als 2 werden gelöscht.

### F: Kann ich ein Schema wiederherstellen, nachdem ich es gelöscht habe?
A: In Phase 16A: Nein (wird gelöscht). In Phase 16B+ werden wir einen Papierkorb hinzufügen.

### F: Kann mehrere Benutzer auf das gleiche Schema zugreifen?
A: Phase 16A: Nein, jeder Benutzer hat eigene Schemas. In Phase 16+ werden wir Sharing hinzufügen.

### F: Funktioniert meine alte Version 0.15 noch?
A: Ja! Version 0.16 ist 100% rückwärtskompatibel. Alle APIs funktionieren wie vorher.

### F: Wie viele Schemas kann ich speichern?
A: Unbegrenzt (begrenzt durch Ihre PostgreSQL-Speichergröße).

### F: Ist meine Datenbank sicher?
A: PostgreSQL bietet Verschlüsselung, Zugangsschutz und ACID-Garantien. Für Produktion: SSL aktivieren.

---

## 📋 Checkliste für Produktivsysteme

Wenn Sie 0.16 in Produktion gehen, überprüfen Sie:

- [ ] PostgreSQL läuft auf separatem Server
- [ ] SSL ist aktiviert (DB_SSL=true)
- [ ] Backups sind konfiguriert
- [ ] Monitoring ist eingerichtet
- [ ] Zugangsrechte sind korrekt gesetzt
- [ ] Umgebungsvariablen in .env.production gespeichert
- [ ] Logs werden aufgezeichnet
- [ ] Performance-Tests durchgeführt

---

## 📞 Support

**Phase 16A Status**: ✅ Datenbankebene fertig

**Bekannte Einschränkungen**:
- Dateisystem-Organisation (Phase 16B) noch nicht implementiert
- Frontend-UI für Schema-Verwaltung (Phase 16D) noch nicht gebaut
- Archive/Restore UI (Phase 16C) noch nicht implementiert

**Nächste Phase**:
- Phase 16B: Dateisystem-Management
- Phase 16C: Backend-Route Integration
- Phase 16D: Frontend-UI-Komponenten

---

## 📚 Zusätzliche Ressourcen

- **JSON-Schema Referenz**: Siehe `docs/JSON-SCHEMA-DRAFT-07-REFERENCE.md`
- **Glossar**: Siehe `docs/glossary.md`
- **Release Notes**: Siehe `RELEASE_NOTES_0.16.0.md`
- **API-Dokumentation**: Siehe `docs/DOCUMENTATION-INDEX.md`
