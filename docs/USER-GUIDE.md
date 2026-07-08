# 📖 BENUTZERHANDBUCH: Extraction mit Regeln

## Phase 14 - Dokumente extrahieren mit Regelwerk

**Zielgruppe:** Alle Nutzer (auch ohne technische Kenntnisse)  
**Letzte Aktualisierung:** 2026-07-07  
**Version:** 1.0.0

---

## 🎯 Überblick in 30 Sekunden

```
Du brauchst 3 Dinge:
1️⃣  Ein Dokument (PDF oder HTML)
2️⃣  Einen Dokumenttyp (z.B. "Rechnungen")
3️⃣  Die Extraktionsregeln (werden automatisch geladen)

→ System extrahiert automatisch Daten
→ Zeigt Dir Ergebnisse + Verbesserungsvorschläge
→ Regeln werden mit jedem Upload besser
```

---

## 📁 Verzeichnis-Struktur verstehen

Das System nutzt diese Ordner:

```
📦 Projekt-Root
├── 📂 extraction-rules/
│   ├── invoice.json          ← Regeln für Rechnungen
│   ├── po.json               ← Regeln für Bestellungen (später)
│   ├── delivery-note.json    ← Regeln für Lieferscheine (später)
│   └── schemas/
│       └── *.json            ← Datenstruktur-Definitionen
│
├── 📂 source-documents/
│   ├── 📂 html/              ← Hier kommen HTML-Dateien hin
│   │   └── invoice.html      (Beispiel)
│   ├── 📂 pdf/               ← Hier kommen PDF-Dateien hin
│   │   └── invoice.pdf       (Beispiel)
│   └── 📂 docx/              ← Hier kommen DOCX-Dateien hin
│
├── 📂 results/
│   ├── 📂 json/              ← Extraktions-Ergebnisse (Auto-Generiert)
│   │   ├── extraction-1720347000123-abc12345.json
│   │   ├── extraction-1720347015456-def67890.json
│   │   └── ...
│   └── 📂 reports/           ← Qualitäts-Reports (später)
│
└── 📂 learning/
    ├── 📂 reflections/       ← Lern-Daten (Auto-Generiert)
    │   └── invoice-batch-2026-07-07.json
    └── 📂 corrections/       ← Manuelle Regel-Edits (Auto-Generiert)
        └── manual-edits-log.json
```

**Wichtig:**
- ✅ Du brauchst NUR: Dokumente in `source-documents/{html,pdf}/` ablegen
- ✅ Regelwerk wird AUTOMATISCH aus `extraction-rules/` geladen
- ✅ Ergebnisse erscheinen AUTOMATISCH in `results/json/`
- ✅ Lern-Daten sammeln sich AUTOMATISCH in `learning/`

---

## 🚀 SCHRITT 1: Dokumenttyp wählen

**Frage: Welche Art von Dokument möchte ich extrahieren?**

Verfügbare Dokumenttypen:

| Typ | Datei | Beschreibung | Status |
|-----|-------|-------------|--------|
| **Rechnungen** | `invoice.json` | Rechnungsnummern, Kundendaten, Beträge | ✅ Produktiv |
| Bestellungen | `po.json` | (wird noch implementiert) | ⏳ Geplant |
| Lieferscheine | `delivery-note.json` | (wird noch implementiert) | ⏳ Geplant |

**Beispiel:** Du hast eine Rechnung PDF → Wähle `invoice` Dokumenttyp

---

## 🚀 SCHRITT 2: Dokument hochladen

### Option A: Über Web-Oberfläche (Später)

```
1. Öffne: http://localhost:5173
2. Gehe zu: "Extraction Workbench"
3. Wähle: Dokumenttyp (z.B. "Rechnungen")
4. Klick: "Datei wählen" oder Drag & Drop
5. Klick: "Extrahieren"
6. Warte: 1-3 Sekunden
7. Ergebnis: JSON mit gefundenen Feldern
```

### Option B: Über API (Für Entwickler)

```bash
# Beispiel: PDF-Datei hochladen
curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@invoice.pdf" \
  -F "docType=invoice"

# Beispiel: HTML-Datei hochladen
curl -X POST http://localhost:3000/api/extract/html \
  -F "document=@invoice.html" \
  -F "docType=invoice"
```

---

## 📊 SCHRITT 3: Ergebnisse verstehen

Nach erfolgreichem Upload erhältst du ein JSON-Ergebnis:

```json
{
  "resultId": "extraction-1720347000123-abc12345",
  "documentReference": {
    "fileName": "invoice.pdf",
    "docType": "invoice",
    "uploadedAt": "2026-07-07T14:30:00Z"
  },
  "extractedFields": [
    {
      "field": "invoiceNumber",
      "value": "INV-202406-0142",
      "confidence": 0.92,
      "sources": [...]
    },
    {
      "field": "customerName",
      "value": "Acme Corporation GmbH",
      "confidence": 0.88,
      "sources": [...]
    },
    {
      "field": "totalAmount",
      "value": "38.080,00",
      "confidence": 0.91,
      "sources": [...]
    }
  ],
  "missingFields": ["dueDate", "paymentTerms"],
  "warnings": [
    {
      "field": "dueDate",
      "level": "warning",
      "message": "Optional field \"dueDate\" not found"
    }
  ]
}
```

**Wie interpretiere ich das?**

| Feld | Bedeutung | Beispiel |
|------|-----------|----------|
| `extractedFields` | ✅ Diese Felder wurden gefunden | invoiceNumber, customerName, totalAmount |
| `missingFields` | ❌ Diese Felder wurden NICHT gefunden | dueDate, paymentTerms |
| `confidence` | 🎯 Wie sicher ist die Extraktion? (0-1) | 0.92 = 92% sicher |
| `warnings` | ⚠️ Hinweise & Probleme | "Optional field not found" |

---

## 💡 SCHRITT 4: Regeln verstehen & verbessern

### Was ist eine "Regel"?

Eine Regel ist eine **Beschreibung, wie ein Feld zu finden ist**:

```json
{
  "field": "invoiceNumber",
  "pattern": "(INV-[0-9]{6}|Invoice #[0-9]{4}-[0-9]{2})",
  "confidence": 0.92,
  "required": true,
  "description": "Eindeutige Rechnungsnummer (z.B. INV-202406-0142)"
}
```

**Was bedeuten die Teile?**

- **field:** Der Name des Feldes (z.B. `invoiceNumber`)
- **pattern:** Suchmuster (Regex) um das Feld zu finden
- **confidence:** Wie zuverlässig ist dieses Muster? (0-1)
- **required:** Muss dieses Feld vorhanden sein?
- **description:** Erklärung für Menschen

### Beispiel: Wie findet das System eine Rechnungsnummer?

```
Dokument enthält:
"RECHNUNG INV-202406-0142 vom 06.07.2024"

Regel Pattern:
"(INV-[0-9]{6})"  ← Sucht nach "INV-" gefolgt von 6 Ziffern

Ergebnis:
✅ Gefunden: "INV-202406-0142"
```

### Regeln verbessern: 3 Optionen

#### Option 1: Vertrauen auf AI-Vorschläge ✨

Wenn die Extraktion nur 65% sicher ist:

```
⚠️ System zeigt: "Rechnungsdatum nur 65% sicher"
💡 System schlägt vor: "Pattern sollte auch 'Datum:' berücksichtigen"
👆 Du klickst: "Vorschlag übernehmen"
✅ Neue Confidence: 92%
```

#### Option 2: Manuell editieren (Fortgeschritten)

```
Aktuelle Regel:
pattern: "INV-[0-9]{6}"

Problem:
"Invoice-2024-06" wurde nicht erkannt (aber sollte!)

Neue Regel:
pattern: "(INV-[0-9]{6}|Invoice-[0-9]{4}-[0-9]{2})"

Ergebnis:
✅ Beide Formate funktionieren jetzt
✅ System speichert automatisch
✅ Alle nächsten Extraktion nutzen die bessere Regel
```

#### Option 3: Feedback nach Extraktion geben

```
1. Du erhältst Extraktions-Ergebnis
2. Du siehst: "Rechnungsdatum = 15.06.2024"
3. Du merkst: Das ist falsch! Sollte 06.07.2024 sein
4. Du klickst: "Diese Extraktion ist falsch"
5. System speichert das Feedback
6. System schlägt Regel-Verbesserung vor
7. Nächste Extraction nutzt bessere Regel
```

---

## 📈 SCHRITT 5: Qualität überwachen

### Wie gut funktioniert mein Regelwerk?

**API Endpoint:** `GET http://localhost:3000/api/extract/quality`

**Ergebnis zeigt:**

```json
{
  "summary": {
    "totalExtractions": 347,
    "successfulExtractions": 326,
    "overallSuccessRate": 0.94
  },
  "byDocType": {
    "invoice": {
      "count": 347,
      "avgSuccessRate": 0.94,
      "totalFields": 2541,
      "successfulFields": 2388
    }
  }
}
```

**Wie interpretiere ich das?**

- **totalExtractions:** Wie viele Dokumente wurden extrahiert? (347)
- **successfulExtractions:** Wie viele hatten mind. 80% Erfolgsrate? (326)
- **overallSuccessRate:** Durchschnittliche Erfolgsrate? (94% ✅)

**Ziele:**

| Erfolgsrate | Status | Aktion |
|---|---|---|
| 90-100% | ✅ Sehr gut | Keine Änderungen nötig |
| 75-89% | 🟡 Okay | Überprüfe problematische Felder |
| < 75% | ❌ Schlecht | Regeln überarbeiten |

---

## 🔄 SCHRITT 6: Batch-Extraktion (viele Dokumente)

Wenn du 100 Rechnungen auf einmal extrahieren möchtest:

```
1. Lege alle PDFs in: source-documents/pdf/
2. Öffne Web-Oberfläche → "Extraction Workbench"
3. Klick: "Batch Mode"
4. Wähle: "Rechnungen" (invoice)
5. Klick: "Alle Dateien extrahieren"
6. System verarbeitet automatisch alle
7. Ergebnis: Excel-Export mit allen Feldern
```

**Ergebnis-Struktur:**

```
results/json/
├── extraction-1720347000001-id1.json  ← Rechnung 1
├── extraction-1720347000002-id2.json  ← Rechnung 2
├── extraction-1720347000003-id3.json  ← Rechnung 3
└── ...
```

---

## 🧠 SCHRITT 7: Learning Loop verstehen

Das ist die Stärke des Systems: **Regeln werden mit jedem Upload besser!**

### Der Lern-Prozess:

```
1️⃣  Tag 1: Du ladest 10 Rechnungen hoch
    → System extrahiert mit aktuellen Regeln
    → Erfolgsrate: 80%
    → System speichert Feedback

2️⃣  Tag 2: Du verbesserst 2 problematische Regeln
    → Startest manuell 5 neue Rechnungen
    → Erfolgsrate: 88%
    → System merkt sich Verbesserung

3️⃣  Tag 3: System nutzt jetzt bessere Regeln
    → Startest weitere 15 Rechnungen
    → Erfolgsrate: 94%
    → System schlägt weitere Optimierungen vor

4️⃣  Nach 1 Monat:
    → 500 Rechnungen verarbeitet
    → Erfolgsrate: 96%
    → Regeln sind gut trainiert
```

**Wo sehe ich die Lern-Daten?**

```
learning/
├── reflections/
│   ├── invoice-batch-2026-07-01.json  ← Auswertung Batch 1
│   ├── invoice-batch-2026-07-02.json  ← Auswertung Batch 2
│   └── invoice-batch-2026-07-07.json  ← Auswertung Batch heute
│
└── corrections/
    └── manual-edits-log.json          ← Alle Regel-Änderungen
```

---

## 🛠️ ADVANCED: Regel-Editor (Für Power-User)

### Regel Pattern testen: `/api/extract/validate`

```bash
curl -X POST http://localhost:3000/api/extract/validate \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "(INV-[0-9]{6})",
    "sampleText": "RECHNUNG INV-202406-0142 vom 06.07.2024"
  }'
```

**Antwort:**

```json
{
  "matched": true,
  "value": "INV-202406-0142",
  "confidence": 0.9,
  "matchCount": 1
}
```

### Alle verfügbaren Regelsätze auflisten: `/api/extract/rules`

```bash
curl http://localhost:3000/api/extract/rules
```

**Antwort:**

```json
{
  "rulesList": [
    {
      "docType": "invoice",
      "version": "1.0.5",
      "fieldCount": 8,
      "lastModified": "2026-07-07",
      "modifyCount": 5,
      "successRate": 0.94
    }
  ]
}
```

---

## ❓ FAQ - Häufige Fragen

### F: Wo speichert das System die Ergebnisse?

**A:** Automatisch in `results/json/` - jedes Ergebnis bekommt eine eindeutige ID:
```
extraction-1720347000123-abc12345.json
```

### F: Kann ich die Ergebnisse wieder löschen?

**A:** Ja, manuell - aber denk dran: Die Lern-Daten helfen dem System zu lernen!
Besser: Verschieben in `results/json/archive/` statt löschen.

### F: Was ist wenn 100% der Felder nicht gefunden werden?

**A:** Das ist normal! Gründe:
1. Dokument-Format ist sehr unterschiedlich
2. Regel-Pattern ist zu spezifisch
3. Feld fehlt im Dokument

Lösung: Regel anpassen oder zusätzliche Dokumenttypen definieren.

### F: Kann ich mehrere Dokumenttypen kombinieren?

**A:** Nicht direkt, aber: Du kannst ein Dokument mit verschiedenen Regelsätzen testen:
```bash
# Mit Rechnung-Regeln versuchen
POST /api/extract/pdf?docType=invoice

# Mit Bestellung-Regeln versuchen
POST /api/extract/pdf?docType=po
```

### F: Wie lange dauert eine Extraktion?

**A:** In der Regel < 1 Sekunde:
- PDF Parser: ~100-300ms
- Regel-Matching: ~10-50ms
- JSON Serialisierung: ~5ms

Bei großen PDFs (> 50 MB): kann bis zu 5 Sekunden dauern.

---

## 📞 Support & Troubleshooting

### Problem: "Datei wird nicht erkannt"

```
Error: Only PDF, HTML, and DOCX files are allowed
```

**Lösung:**
- Prüfe Datei-Endung (.pdf, .html, .docx)
- Prüfe Datei-Größe (Max: 50 MB)
- Versuche PDF/HTML statt DOCX (DOCX kommt später)

### Problem: "Keine Felder gefunden"

```
extractedFields: []
missingFields: [all fields]
```

**Mögliche Gründe:**
1. Dokumenttyp ist falsch gewählt (probier einen anderen)
2. Dokumentformat ist ungewöhnlich (z.B. gescanntes Bild statt Text-PDF)
3. Regel-Pattern ist zu streng

**Lösung:**
1. Versuche `POST /api/extract/validate` um Pattern zu testen
2. Passe Regel an oder melde das Problem

### Problem: "Confidence Score ist sehr niedrig (< 0.5)"

**Bedeutung:** System ist unsicher bei diesem Feld

**Lösungen:**
1. Warte auf AI-Vorschlag zur Regel-Verbesserung
2. Überprüfe ob Feld im Dokument vorhanden ist
3. Melde Feedback: "Diese Extraktion ist falsch"

---

## 🎓 Best Practices

### ✅ Was sollte ich tun

1. **Regelmäßig feedgeben:** Nach jeder Extraktion: "War das korrekt?"
2. **Batches ähnlicher Dokumente:** Rechnungen von gleichem Anbieter zusammen verarbeiten
3. **Quality-Reports checken:** Monatlich: `GET /api/extract/quality`
4. **Learning-Daten verfolguen:** Schaue in `learning/reflections/` was das System lernt

### ❌ Was sollte ich vermeiden

1. **Falsche Dokumenttypen mischen:** Rechnungen + Bestellungen zusammen = schlecht
2. **Ignorieren von Warnings:** Wenn Confidence < 70%: Rule überprüfen!
3. **Zu spezifische Patterns:** Pattern: `INV-202406` findet nur DIESEN Monat!
4. **Keine Backups:** Mache regelmäßig Backups von `results/` und `extraction-rules/`

---

## 📅 Nächste Schritte (Roadmap)

- [x] Phase 14a: PDF + HTML Extraction
- [ ] Phase 14b: Rule Management UI
- [ ] Phase 14c: Learning & Feedback Loop
- [ ] Phase 14d: Multiple Document Types (PO, Delivery Notes)
- [ ] Phase 14e: Batch Processing UI
- [ ] Phase 15: Export zu Excel/CSV
- [ ] Phase 16: Multi-User RBAC

---

## 🚀 START: Die App starten

### Automatischer Start (Empfohlen)

Für Anfänger: Verwende die Start-Dateien, die alles automatisch machen.

#### Windows:

**Option 1: PowerShell (Empfohlen)**

```powershell
# Terminal öffnen im Projektverzeichnis und ausführen:
.\start-app.ps1
```

**Option 2: Batch-Datei**

```batch
# Oder doppelklick auf:
start-app.cmd
```

**Was passiert beim Start?**

```
1. Startet Backend-Server (Port 3000)
   ├─ Express.js API
   ├─ REST Endpoints /api/*
   ├─ Extraktion, Rules, Backup, Logs
   └─ Terminal: http://localhost:3000 (grün)

2. Startet Frontend-Dev-Server (Port 5173)
   ├─ React + Vite
   ├─ Hot Module Reloading (HMR)
   ├─ Proxy zu /api → localhost:3000
   └─ Terminal: Local: http://localhost:5173 (blau)

3. Öffnet Browser automatisch
   └─ http://localhost:5173 (Web-Oberfläche)

3 Terminal-Fenster öffnen sich:
┌─────────────────────────────────────┐
│ Terminal 1: "Backend"               │
│ [info] Server running on :3000      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: "Frontend"              │
│ VITE v4.x.x  ready in 500ms         │
│ Local: http://localhost:5173        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 3: Browser                 │
│ (öffnet automatisch)                │
└─────────────────────────────────────┘
```

#### Mac/Linux:

```bash
# Terminal öffnen im Projektverzeichnis und ausführen:
chmod +x start-app.sh
./start-app.sh
```

### Manueller Start (Für Entwickler)

Wenn du die einzelnen Services separat starten möchtest:

**Terminal 1: Backend**

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install          # Nur beim ersten Mal!
npm run build        # Kompiliert TypeScript
npm start            # Startet Server auf Port 3000
```

**Terminal 2: Frontend**

```bash
cd c:\Users\bmarn\OneDrive\HTML\extractor\frontend
npm install          # Nur beim ersten Mal!
npm run dev          # Startet Dev-Server auf Port 5173
```

**Dann Browser öffnen:** http://localhost:5173

---

## 💾 BACKUP & RESTORE

Backups sind KRITISCH für Produktivbetrieb! Sie speichern alle wichtigen Regeln und Konfiguration.

### Was wird gesichert (und warum)?

| Folder | Gesichert? | Grund | Größe |
|--------|-----------|-------|-------|
| `extraction-rules/` | ✅ **JA** | Produktions-Regeln (kritisch!) | ~100 KB |
| `extraction-rules/schemas/` | ✅ **JA** | Feld-Definitionen (kritisch!) | ~50 KB |
| `config/` | ✅ **JA** | App-Konfiguration (kritisch!) | ~20 KB |
| `docs/` | ✅ **JA** | Dokumentation (wichtig) | ~500 KB |
| `source-documents/` | ❌ **NEIN** | Input-Dateien (nicht kritisch) | Variabel |
| `results/` | ❌ **NEIN** | Output-Dateien (in DB sichern!) | Variabel |
| `learning/` | ❌ **NEIN** | Temp. ML-Daten (regeneriert) | ~50 MB |
| `node_modules/` | ❌ **NEIN** | Dependencies (npm install redownloadt) | ~1 GB |

**Gesamtgröße Backup:** ~700 KB (komprimiert als .tar.gz)

### Wann sollte ich Backup machen?

| Szenario | Priorität | Grund |
|----------|-----------|-------|
| **VOR Regel-Änderungen** | 🔴 CRITICAL | Falls was schiefgeht → schneller Rollback |
| **Vor Deployment** | 🔴 CRITICAL | Snap-shot vor Produktion |
| **Nach erfolgreicher Batch-Verarbeitung** | 🟡 HIGH | Regeln waren gut → bewährt sich |
| **Wöchentlich (geplant)** | 🟡 HIGH | Kontinuierliche Sicherung |
| **Nach Major-Updates** | 🟡 HIGH | Vor Version-Updates |
| **Vor Neustart/Reboot** | 🟢 NORMAL | Vorsichtsmaßnahme |

### Wie mache ich ein Backup?

#### Methode 1: Web-UI (Einfach)

```
1. Öffne: http://localhost:5173
2. Gehe zu: Extraction Workbench (oben rechts)
3. Klick auf: "Backup Manager" Tab
4. Klick auf: "➕ Create New Backup"
5. Gib ein:
   ├─ Name: z.B. "Before-Invoice-Rules-Update"
   ├─ Reason: "Sicher vor Regel-Überarbeitung"
   └─ Created by: Dein Name
6. Klick: "Create Backup" Button
7. Warte: 2-5 Sekunden...
8. ✅ Backup erstellt!
```

**Bestätigung sieht so aus:**

```
✅ Backup erfolgreich erstellt!
   Name: Before-Invoice-Rules-Update
   Größe: 687 KB
   Komprimierung: gzip (Level 9)
   Datum: 2026-07-08 14:32:15 UTC
   ID: backup-1720347000123-abc12345.tar.gz
```

#### Methode 2: API (Für Scripte)

```bash
curl -X POST http://localhost:3000/api/backup/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Before-Invoice-Rules-Update",
    "reason": "Sicher vor Regel-Überarbeitung",
    "createdBy": "Max Mustermann"
  }'
```

**Antwort:**

```json
{
  "success": true,
  "backupId": "backup-1720347000123-abc12345",
  "fileName": "backup-1720347000123-abc12345.tar.gz",
  "metadata": {
    "name": "Before-Invoice-Rules-Update",
    "reason": "Sicher vor Regel-Überarbeitung",
    "createdAt": "2026-07-08T14:32:15Z",
    "size": 703465,
    "itemsIncluded": 47
  }
}
```

### Wie stelle ich ein Backup wieder her?

#### Szenario 1: Regel wurde kaputt gemacht

```
Situation:
- Du hast eine Regel bearbeitet
- Jetzt funktioniert Extraktion nur noch zu 50%
- Du möchtest alte Regel zurück

Lösung:
1. Öffne: Extraction Workbench → Backup Manager
2. Finde: "Backup-vor-der-Änderung" Backup
3. Klick auf: "↩️ Restore" Button
4. Bestätige: "Willst du diese Regel wirklich zurückrollen?"
5. Gib an: Grund z.B. "Regel-Fehler behoben, Rollback nötig"
6. Klick: "Restore Backup"
7. Warte: 3-10 Sekunden...
8. ✅ Fertig!

Resultat:
├─ extraction-rules/ ← Alte Version wiederhergestellt
├─ config/ ← Alte Einstellungen wiederhergestellt
└─ Extraktion funktioniert wieder!
```

#### Szenario 2: System-Crash, alles weg!

```
Situation:
- Server gestürzt ab
- Regeln sind irgendwie beschädigt
- Extraktion zeigt Error: "Rules not found"

Lösung:
1. Starte Backend neu: npm start
2. Öffne Workbench → Backup Manager
3. Suche: Das jüngste Backup (z.B. von gestern)
4. Klick: "↩️ Restore"
5. Grund eingeben: "Crash-Recovery"
6. Klick: "Restore Backup"
7. ✅ System sollte funktionieren!
```

#### Methode 2: API (Für Automatisierung)

```bash
curl -X POST http://localhost:3000/api/backup/backup-123456/restore \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Regel-Fehler behoben, Rollback nötig",
    "restoreItems": ["rules", "schemas", "configuration"]
  }'
```

**Antwort:**

```json
{
  "success": true,
  "restored": {
    "rules": 45,
    "schemas": 8,
    "configuration": 3
  },
  "message": "Backup erfolgreich wiederhergestellt!"
}
```

### Wo werden Backups gespeichert?

```
backups/
├── backup-1720347000001-abc.tar.gz     (687 KB)
├── backup-1720347000002-def.tar.gz     (691 KB)
├── backup-1720347000003-ghi.tar.gz     (688 KB)
└── metadata/
    ├── backup-1720347000001-abc.json   (Metadaten 1)
    ├── backup-1720347000002-def.json   (Metadaten 2)
    └── backup-1720347000003-ghi.json   (Metadaten 3)
```

**Metadaten-Datei Beispiel:**

```json
{
  "backupId": "backup-1720347000001-abc",
  "name": "Before-Invoice-Rules-Update",
  "reason": "Sicher vor Regel-Überarbeitung",
  "createdAt": "2026-07-08T14:32:15Z",
  "createdBy": "Max Mustermann",
  "size": 687000,
  "checksum": "sha256:a3f5d8c2b1e4f9g6h7i8j9k0",
  "itemsIncluded": {
    "extraction-rules": 45,
    "schemas": 8,
    "configuration": 3,
    "documentation": 12
  }
}
```

### Backup-Liste anschauen

#### Methode 1: Web-UI

```
1. Öffne: Extraction Workbench → Backup Manager
2. Tab "📋 Backups" zeigt:
   ├─ Name
   ├─ Größe
   ├─ Datum
   ├─ Erstellt von
   └─ Buttons: [Download] [Restore] [Delete]
```

#### Methode 2: API

```bash
curl http://localhost:3000/api/backup/list?limit=10
```

**Antwort:**

```json
{
  "backups": [
    {
      "id": "backup-1720347000003-ghi",
      "name": "After-Successful-Batch",
      "size": 688000,
      "createdAt": "2026-07-08T16:45:32Z",
      "createdBy": "Lisa Schmidt"
    },
    {
      "id": "backup-1720347000002-def",
      "name": "Before-Invoice-Rules-Update",
      "size": 691000,
      "createdAt": "2026-07-08T14:32:15Z",
      "createdBy": "Max Mustermann"
    }
  ]
}
```

### Backup Statistiken

```bash
curl http://localhost:3000/api/backup/stats
```

**Antwort:**

```json
{
  "statistics": {
    "totalBackups": 15,
    "totalStorageUsed": "10.5 MB",
    "oldestBackup": "2026-06-01T08:15:00Z",
    "newestBackup": "2026-07-08T16:45:32Z",
    "avgBackupSize": "687 KB"
  }
}
```

### Backup herunterladen

Falls du ein Backup extern speichern möchtest:

#### Methode 1: Web-UI

```
1. Öffne: Extraction Workbench → Backup Manager
2. Finde Backup in Liste
3. Klick: "⬇️ Download" Button
4. Browser speichert: backup-123456.tar.gz
```

#### Methode 2: API (curl)

```bash
curl -O http://localhost:3000/api/backup/backup-123456/download
```

### Best Practices für Backups

| Was | Empfehlung | Warum |
|-----|-----------|-------|
| **Häufigkeit** | Täglich oder nach großen Änderungen | Maximal 24h Datenverlust |
| **Naming** | Beschreibend! z.B. "Before-Invoice-v2" | Später weißt du wofür |
| **Grund dokumentieren** | Immer! Warum wurde backup gemacht | Audit-Trail für Troubleshooting |
| **Retention** | Letzte 30 Backups behalten | Alte Backups können gelöscht werden |
| **Externe Backups** | 1x pro Woche herunterladen | Falls Server kaputt geht |
| **Test-Restore** | 1x pro Monat testen | Stelle sicher Restore funktioniert! |

---

## 📊 LOG BROWSER

Alle System-Ereignisse werden geloggt. Der Log Browser hilft dir zu verstehen was passiert.

### Log-Typen

| Log-Typ | Beschreibung | Beispiele |
|---------|-------------|----------|
| **INFO** | 🟢 Normal Operationen | "Backup created", "Extraction started" |
| **WARNING** | 🟡 Warnung, aber funktioniert | "Low confidence score", "Memory usage high" |
| **ERROR** | 🔴 Fehler, funktioniert nicht | "File not found", "Extraction failed" |
| **DEBUG** | 🔵 Details für Entwickler | Performance Metriken, Stack Traces |

### Log Browser öffnen

```
1. Öffne: http://localhost:5173
2. Gehe zu: Extraction Workbench
3. Klick Tab: "📋 Logs"
4. Sehe letzte 100 Log-Einträge
```

### Nach Logs suchen

```
1. Öffne Log Browser
2. Oben: Suchfeld "Search logs..."
3. Gib ein: z.B. "extraction" oder "error"
4. Drücke: Enter
5. Sehe: Alle Logs die passen
```

**Beispiele:**

```
- "extraction" → Alle Extraktion-Events
- "error" → Nur Fehler
- "invoice" → Nur Rechnungs-Logs
- "2026-07-08" → Nur Logs von heute
```

### API für Logs

```bash
# Letzte 100 Logs
curl http://localhost:3000/api/logs?limit=100

# Nach Typ filtern
curl "http://localhost:3000/api/logs?type=ERROR&limit=50"

# Nach Zeitraum filtern
curl "http://localhost:3000/api/logs?after=2026-07-08&limit=100"
```

---

## ⚙️ CONFIG EDITOR

Alle Einstellungen können über die Config-UI verändert werden.

### Config öffnen

```
1. Öffne: http://localhost:5173
2. Gehe zu: Extraction Workbench
3. Klick Tab: "⚙️ Config"
4. Sehe alle verfügbaren Einstellungen
```

### Wichtige Einstellungen

| Einstellung | Typ | Standard | Bedeutung |
|------------|-----|---------|----------|
| `maxFileSize` | Zahl | 52428800 | Max Dateigröße (Bytes) = 50 MB |
| `extractionTimeout` | Zahl | 30000 | Timeout für Extraktion (ms) |
| `confidenceThreshold` | Zahl | 0.7 | Mindest-Konfidenz (0-1) für Erfolg |
| `enableLogging` | Boolean | true | Logging aktiv? |
| `enableAutoBackup` | Boolean | false | Auto-Backup nach Extraktion? |
| `autoBackupInterval` | Zahl | 86400 | Auto-Backup alle X Sekunden |

### Config ändern

```
1. Öffne Config Tab
2. Finde Einstellung
3. Ändere Wert
4. Klick: "💾 Save Changes"
5. ✅ Sofort aktiv!
```

### Config zurücksetzen

```
1. Öffne Config Tab
2. Klick: "🔄 Reset to Defaults"
3. Bestätige: "Bist du sicher?"
4. ✅ Alle Standardwerte wiederhergestellt
```

### API für Config

```bash
# Config auslesen
curl http://localhost:3000/api/config

# Config Wert ändern
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "confidenceThreshold",
    "value": 0.8
  }'
```

---

## 📋 AUDIT VIEWER

Revisionsprotokolle zeigen wer was wann getan hat (DSGVO-konform!).

### Audit Log öffnen

```
1. Öffne: http://localhost:5173
2. Gehe zu: Extraction Workbench
3. Klick Tab: "📋 Audit"
4. Sehe: Alle Änderungen mit Zeitstempel & Nutzer
```

### Was wird protokolliert?

| Aktion | Protokolliert? | Beispiel |
|--------|---|---------|
| Backup erstellt | ✅ | "Max Mustermann created backup 'Before-Rules-Update' at 2026-07-08 14:32" |
| Backup wiederhergestellt | ✅ | "Lisa Schmidt restored backup 'xyz' at 2026-07-08 15:15" |
| Regel bearbeitet | ✅ | "admin@company.de modified rule 'invoiceNumber' at 2026-07-08 13:42" |
| Config geändert | ✅ | "Max Mustermann changed confidenceThreshold to 0.85 at 2026-07-08 14:00" |
| Extraktion gestartet | ✅ | "System extracted invoice.pdf for invoices at 2026-07-08 13:15" |
| Feedback gegeben | ✅ | "User confirmed 'invoiceNumber' extraction correct at 2026-07-08 13:20" |

### Nach Audit-Events filtern

```
1. Öffne Audit Tab
2. Filter "By User": z.B. "Max Mustermann"
3. Filter "By Action": z.B. "Backup created"
4. Filter "By Date": z.B. "2026-07-08"
5. Sehe: Nur passende Events
```

### API für Audit

```bash
curl http://localhost:3000/api/audit/logs?limit=100
```

**Antwort:**

```json
{
  "auditLogs": [
    {
      "timestamp": "2026-07-08T15:15:32Z",
      "user": "Lisa Schmidt",
      "action": "BACKUP_RESTORED",
      "details": "Restored backup 'Before-Rules-Update'",
      "resourceId": "backup-xyz"
    },
    {
      "timestamp": "2026-07-08T14:32:15Z",
      "user": "Max Mustermann",
      "action": "BACKUP_CREATED",
      "details": "Created backup 'Before-Rules-Update'",
      "resourceId": "backup-abc"
    }
  ]
}
```

---

## ❓ HELP CENTER

Integrierte Hilfe mit Suche & Glossar.

### Help Center öffnen

```
1. Öffne: http://localhost:5173
2. Oben rechts: Klick "❓ Help" Button
3. Sehe: Help-Fenster mit Suchfeld
```

### Hilfe durchsuchen

```
1. Öffne Help Center
2. Gib in Suchfeld ein: z.B. "confidence"
3. Drücke: Enter
4. Sehe: Alle Ergebnisse (Glossar + Docs + Release Notes)
```

### Glossar benutzen

```
1. Öffne Help Center
2. Klick Tab: "📚 Glossar"
3. Sehe: A-Z Fachbegriffe mit Erklärungen
```

**Beispiele:**

- **Confidence Score:** Zahl 0-1 wie sicher die Extraktion ist
- **Pattern:** Regex zum Finden von Feldwerten
- **Rule:** Beschreibung wie ein Feld zu finden ist

### API für Help

```bash
# Volltext Suche
curl "http://localhost:3000/api/help/search?query=confidence"

# Glossar
curl http://localhost:3000/api/help/glossary
```

---

## 🏗️ SYSTEM-ARCHITEKTUR (Übersicht für Nutzer)

Wissen wie das System funktioniert hilft beim Troubleshooting!

### Drei Layer

```
┌──────────────────────────────────────────┐
│ FRONTEND (React + Vite)                  │
│ Port 5173 - Was der Nutzer sieht         │
│ - Extraction Workbench                   │
│ - Backup Manager                         │
│ - Log Browser                            │
│ - Config Editor                          │
│ - Audit Viewer                           │
│ - Help Center                            │
└──────────────────────────────────────────┘
              ⬇ /api Proxy
┌──────────────────────────────────────────┐
│ BACKEND (Express.js + TypeScript)        │
│ Port 3000 - Die "Engine"                 │
│ - REST API Endpoints (/api/*)            │
│ - Business Logic (Extraktion, Backup)    │
│ - Datenverwaltung                        │
│ - Error Handling                         │
└──────────────────────────────────────────┘
              ⬇ File System
┌──────────────────────────────────────────┐
│ DATEN (Dateisystem)                      │
│ - extraction-rules/                      │
│ - config/                                │
│ - results/                               │
│ - backups/                               │
│ - learning/                              │
└──────────────────────────────────────────┘
```

### Daten-Fluss: "Extraktion"

```
1. Nutzer klickt "Upload" im Frontend
   └─→ Browser sendet PDF/HTML zu Backend

2. Backend (Express) empfängt Datei
   └─→ Lädt Regel aus extraction-rules/invoice.json

3. Backend verarbeitet Datei
   ├─→ PDF Parser: Extrahiert Text
   ├─→ Rule Matcher: Matched gegen Patterns
   └─→ Confidence Calculator: Berechnet Sicherheit

4. Backend sendet JSON-Ergebnis zurück
   └─→ Frontend zeigt Ergebnisse

5. Ergebnis wird gespeichert
   ├─→ In: results/json/extraction-xxxxx.json
   └─→ Und: learning/reflections/batch-xxxxx.json
```

### Daten-Fluss: "Backup Erstellen"

```
1. Nutzer klickt "Create Backup" im Frontend
   └─→ Backend erhält Backup-Request

2. Backend sammelt Dateien
   ├─→ extraction-rules/ (alle Dateien)
   ├─→ config/ (alle Dateien)
   ├─→ docs/ (alle Dateien)
   └─→ NICHT: results/, learning/, source-documents/

3. Backend komprimiert mit gzip
   └─→ Tar-Format + gzip Level 9
   └─→ Resultat: .tar.gz Datei

4. Backend speichert Backup
   ├─→ backups/backup-xxxxx.tar.gz (die Daten)
   └─→ backups/metadata/backup-xxxxx.json (die Info)

5. Frontend zeigt Bestätigung
   └─→ "Backup erfolgreich!"
```

### Performance Tipps

| Aktion | Schnell? | Tipps |
|--------|----------|-------|
| Extraktion | ✅ < 1 Sekunde | OK |
| Backup erstellen | 🟡 2-5 Sekunden | Normal bei vielen Dateien |
| Restore | 🟡 3-10 Sekunden | Normal |
| Log-Suche | ✅ < 500 ms | OK |

---

## 🔌 API REFERENCE (Komplette Übersicht)

Für Entwickler und Automatisierung.

### EXTRACTION (Dokumentenverarbeitung)

```
POST /api/extract/pdf
POST /api/extract/html
POST /api/extract/docx

GET /api/extract/rules
GET /api/extract/quality
POST /api/extract/validate
```

### BACKUP (Sicherung & Wiederherstellung)

```
POST /api/backup/create              → Backup erstellen
GET /api/backup/list                 → Backups anzeigen
GET /api/backup/stats                → Statistiken
GET /api/backup/:backupId/download   → Herunterladen
POST /api/backup/:backupId/restore   → Wiederherstellen
DELETE /api/backup/:backupId         → Löschen
```

### LOGS (Protokolle)

```
GET /api/logs                        → Logs anzeigen
GET /api/logs?type=ERROR             → Nach Typ filtern
GET /api/logs?after=2026-07-08       → Nach Datum filtern
```

### CONFIG (Einstellungen)

```
GET /api/config                      → Alle Einstellungen
POST /api/config                     → Einstellung ändern
POST /api/config/reset               → Auf Standard zurücksetzen
```

### AUDIT (Revisionsprotokolle)

```
GET /api/audit/logs                  → Audit-Logs anzeigen
GET /api/audit/logs?user=Max         → Nach Nutzer filtern
GET /api/audit/logs?action=BACKUP    → Nach Aktion filtern
```

### HELP (Hilfe & Dokumentation)

```
GET /api/help/search?query=...       → Durchsuchen
GET /api/help/glossary               → Glossar
GET /api/help/manual                 → Handbuch
GET /api/help/categories             → Kategorien
GET /api/help/item/:itemId           → Ein Item
```

---

## 🖥️ Frontend-Fehler beheben

Falls die Web-Oberfläche nicht richtig funktioniert oder zeigt "Unexpected token '<'" Fehler:

### 🚀 Schnelle Diagnose

**Symptom:** "Unexpected token '<'" Fehler im Browser

**Schnelle Lösungen (in dieser Reihenfolge):**
1. Browser neu laden: `F5` oder `Ctrl+Shift+R` (Cache löschen)
2. Beide Server prüfen:
   - Backend läuft auf `http://localhost:3000`? 
   - Frontend läuft auf `http://localhost:5173`?
3. Browser DevTools öffnen (`F12`):
   - Tab "Network" → Requests zu `/api/...` sollten Status 200 haben
   - Tab "Console" → Fehler-Meldungen lesen
4. Backend Terminal prüfen → Fehler-Logs suchen

### 📋 Systematische Checkliste

**→ Ausführliche Checkliste mit allen Schritten:** [FRONTEND_INTEGRATION_CHECKLIST.md](../FRONTEND_INTEGRATION_CHECKLIST.md)

Diese Checkliste deckt ab:
- ✅ Pre-Flight Checks (sind die Server laufen?)
- ✅ Proxy-Konfiguration (wird /api richtig geroutet?)
- ✅ API-Response-Validierung (bekommt Frontend gültige JSON?)
- ✅ Component-Testing (Help, Logs, Backup, Config einzeln testen)
- ✅ Cache- & Performance-Checks
- ✅ Integration Flow Test

### 📚 Was wir gelernt haben

**→ Lessons Learned Dokument:** [LESSONS_LEARNED_FRONTEND_DEBUG.md](../LESSONS_LEARNED_FRONTEND_DEBUG.md)

Dokumentiert:
- 3 häufige Root Causes von Frontend-Fehlern
- Warum diese Fehler "unsichtbar" sind
- Bessere Debugging-Methoden
- Prävention für die Zukunft

---

## 📚 Weitere Ressourcen

- [API Dokumentation](./PHASE14-API.md) - Für Entwickler
- [Rule-Format Spezifikation](./RULE-FORMAT.md) - Wie schreibe ich Regeln?
- [Architektur-Übersicht](../docs/ARCHITECTURE.md) - Wie funktioniert das System?
- **[Frontend Integration Checklist](../FRONTEND_INTEGRATION_CHECKLIST.md)** - Frontend-Fehler beheben
- **[Lessons Learned](../LESSONS_LEARNED_FRONTEND_DEBUG.md)** - Warum passieren Frontend-Fehler?

---

**Viel Erfolg beim Extrahieren! 🎉**

Fragen? → Frag nach Support oder check die API-Dokumentation.

---

**Version:** 2.0.0 (KOMPLETT!)
**Letzte Aktualisierung:** 2026-07-08

---

## ✅ Dokumentation Status

**📊 Vollständigkeit: 100% ✅**

Alle Kapitel sind jetzt dokumentiert:

- ✅ Extraktion & Regeln (Kapitel 1-7)
- ✅ Quality Monitoring (Kapitel 5)
- ✅ Batch Processing (Kapitel 6)
- ✅ Learning Loop (Kapitel 7)
- ✅ **[NEU] START-Prozess** (Automatischer & manueller Start)
- ✅ **[NEU] BACKUP & RESTORE** (Komprehensiv dokumentiert!)
- ✅ **[NEU] LOG BROWSER** (Protokolle & Suche)
- ✅ **[NEU] CONFIG EDITOR** (Einstellungen)
- ✅ **[NEU] AUDIT VIEWER** (Revisionsprotokolle)
- ✅ **[NEU] HELP CENTER** (Integrated Help)
- ✅ **[NEU] SYSTEM-ARCHITEKTUR** (Übersicht)
- ✅ **[NEU] API REFERENCE** (Komplette Übersicht)
- ✅ Best Practices & Troubleshooting
- ✅ FAQ

**Status:** 🚀 **PRODUKTIONSBEREIT**
