# MANUAL-0.26.0.md

**Phase 26 Complete Operations & Feature Guide**

**Version:** 0.26.0  
**Status:** Production Ready ✅  
**Last Updated:** 2026-07-12
**Phase:** 26 - Layout Improvements & Flex Architecture

---

## 📖 Inhaltsverzeichnis

- [Quick Start](#quick-start)
- [📊 Was ist die Audit-Safe App?](#-was-ist-die-audit-safe-app)
- [🗂️ Navigationsstruktur & Menüpunkte](#-navigationsstruktur--menüpunkte)
- [💼 Job Manager](#-job-manager)
- [📊 iReport Integration](#-ireport-integration)
- [📁 Documents Management](#-documents-management)
- [🎯 Schema Management](#-schema-management)
- [⚙️ Rule Editor](#-rule-editor)
- [⚙️ Configuration & Admin](#-configuration--admin)
- [🔍 Monitoring & Audit](#-monitoring--audit)
- [🖥️ Responsive Navigation](#-responsive-navigation)
- [🐳 Docker Deployment](#-docker-deployment)
- [❓ Troubleshooting & FAQ](#-troubleshooting--faq)

---

## Quick Start

### Starting the Application

**Backend:**
```powershell
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install
npm run build
npm run dev
# or: npm start
# Backend runs on http://localhost:3000
```

**Frontend:**
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
# Frontend runs on http://localhost:5173
```

Both services must be running for full functionality.

---

## 📊 Was ist die Audit-Safe App?

### Zweck

Die **Audit-Safe Document Extractor** ist eine spezialisierte Webanwendung zur intelligenten Verarbeitung von geschäftlichen Dokumenten:

- 📄 **Dokumentenverarbeitung:** Hochladen & Extraktion von Daten
- 🤖 **Intelligente Automatisierung:** OCR + regelbasierte Extraktion
- 📊 **Batch-Verarbeitung:** Hunderte Dokumente gleichzeitig
- 📋 **Audit Trail:** Vollständige Protokollierung für Compliance
- 📈 **Reporting:** Berichte & Export in verschiedenen Formaten
- 🌐 **Responsive Design:** Funktioniert auf Mobile, Tablet & Desktop

### Zielgruppe

- 📊 **Bookkeeper & Accountants** - Rechnungsverarbeitung
- 🏢 **Unternehmen** - Dokumenten-Batch-Verarbeitung  
- 🔍 **Revisoren** - Compliance & Audit-Anforderungen
- ⚙️ **IT-Administratoren** - System-Konfiguration

### Kernfunktionen

```
Dokument hochladen → Schema wählen → Regeln anwenden → 
Ergebnisse prüfen → Daten exportieren → Audit-Trail einsehen
```

**📖 HINWEIS:** Für umfassende Dokumentation mit Use Cases, Workflows und Best Practices siehe [OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md)

---

## 🗂️ Navigationsstruktur & Menüpunkte

Die App ist in **5 logische Kategorien** organisiert, optimiert für **Mobile, Tablet und Desktop**:

### 📊 EXTRACTION (Dokumenten-Verarbeitung)

| Menüpunkt | Funktion | Für wen? |
|-----------|----------|---------|
| **🏠 Dashboard** | Zentrale Übersicht mit Statistiken | Alle Benutzer |
| **💼 Job Manager** | Batch-Verarbeitung von Dokumenten | Power Users |
| **🔧 Workbench** | Interaktive Einzeldokument-Verarbeitung | Techniker & Debugger |

### 📄 DOCUMENTS & SCHEMA

| Menüpunkt | Funktion | Für wen? |
|-----------|----------|---------|
| **📁 Documents** | Verwaltung hochgeladener Dateien | Alle Benutzer |
| **🎯 Schema Management** | Definition von Dokumenttypen | Admins |
| **⬆️ Schema Upload** | Wizard zum Erstellen neuer Schemas | Admins |
| **📊 iReport Integration** | Reporting & Export | Power Users |

### ⚙️ RULES & LEARNING

| Menüpunkt | Funktion | Für wen? |
|-----------|----------|---------|
| **🎛️ Rule Editor** | Benutzerdefinierte Extraktionsregeln | Techniker |
| **📚 Learning Center** | Tutorials & Best Practices | Alle Benutzer |
| **📜 Version History** | Versionskontrolle für Schemas/Regeln | Admins |

### 🔍 MONITORING & AUDIT

| Menüpunkt | Funktion | Für wen? |
|-----------|----------|---------|
| **📋 Audit Trail** | Protokollierung aller Aktionen | Compliance Officer |
| **📊 Logs** | Technische Debug-Logs | Techniker |
| **💾 Backups** | Sicherung & Wiederherstellung | Admins |

### ⚙️ SYSTEM

| Menüpunkt | Funktion | Für wen? |
|-----------|----------|---------|
| **⚙️ Configuration** | Systemeinstellungen | Admins |
| **📖 Help Center** | Vollständige Dokumentation | Alle Benutzer |

**📖 DETAILLIERTE BESCHREIBUNG:** [OPERATIONS_MANUAL.md - Menüpunkte](OPERATIONS_MANUAL.md#menüpunkte---detaillierte-beschreibung)

---

## 💼 Job Manager

**Access:** http://localhost:5173/jobs

### Was ist Job Manager?

Der Job Manager dient zur **Batch-Verarbeitung mehrerer Dokumente**. Sie können:
- ✅ Eine oder mehrere Dateien hochladen
- ✅ Dokumenttyp auswählen (PDF, HTML, DOCX, etc.)
- ✅ Schema definieren (z.B. "Rechnung")
- ✅ Extraktionsregeln anwenden
- ✅ Ergebnisse als JSON/CSV exportieren
- ✅ Status überwachen

### Schritt-für-Schritt

1. **Gehen Sie zu Job Manager:** Klick auf "💼 Job Manager" im Menü
2. **Klick auf "➕ Neuer Job"** oder "⬆️ Upload Document"
3. **Datei(en) auswählen:**
   - Einzelne Datei: Klick "Datei auswählen"
   - Mehrere Dateien: Drag & Drop auf Dropzone
4. **Dokumenttyp wählen:**
   - PDF, HTML, DOCX, TXT
   - Auto-detect (empfohlen)
5. **Schema auswählen** (z.B. "Rechnung_2024")
6. **Regeln überprüfen** (werden automatisch angewendet)
7. **Klick "🚀 Job starten"**
8. **Status beobachten:**
   - 🟡 Pending → 🔵 Processing → 🟢 Completed
9. **Ergebnisse:**
   - ✅ Completed: Download oder anschauen
   - ❌ Failed: Fehlerdetails anzeigen

### Statistiken & Status

| Feld | Bedeutung |
|------|-----------|
| **Total Jobs** | Alle Jobs (fertig + laufend + Fehler) |
| **Completed** | Erfolgreich verarbeitet |
| **Processing** | Gerade in Verarbeitung |
| **Failed** | Mit Fehler beendet |

### Beispiel: 50 Rechnungen verarbeiten

```
⏱️ Vorher (manuell): 50 × 5 Min = 250 Min = 4h 10min
⏱️ Nachher (Job Manager): 35 Min (Vorbereitung + Prüfung)
💾 Zeitersparnis: 215 Min / Tag = 18h / Woche!
```

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Job Manager](OPERATIONS_MANUAL.md#-job-manager)

---

## 📊 iReport Integration

**Access:** http://localhost:5173/ireport

### Was ist iReport?

iReport ermöglicht die **Erstellung von Berichten aus extrahierten Daten**:
- 📈 Automatische Berichte generieren
- 📋 Berichte nach Schema filtern
- 📥 Berichte als PDF/Excel exportieren
- 📧 Berichte per E-Mail versenden
- 📅 Regelmäßig geplante Berichte

### Verfügbare Templates

| Template | Format | Verwendung |
|----------|--------|-----------|
| Invoice Standard | PDF | Rechnungen |
| Purchase Order Report | XLSX | Bestellungen |
| Contract Document | DOCX | Verträge |
| Delivery Note HTML | HTML | Lieferscheine |

### Arbeitsfluss: Bericht erstellen

1. **Gehen Sie zu iReport Integration**
2. **Klick "📄 Dokument auswählen"** oder Drag & Drop
3. **Template wählen** (z.B. "Invoice Standard")
4. **Klick "👁️ Preview"** um Struktur zu sehen (optional)
5. **Klick "🔄 Convert"** um Umwandlung zu starten
6. **Warten... (2-15 Sekunden)**
7. **Status: ✅ Completed**
8. **Klick "⬇️ Download"** um Datei zu speichern

### Beispiel-Szenario

```
Sie haben 100 Rechnungen in PDF-Format.
Sie möchten diese als Excel-Report für Accounting haben.

1. Job Manager: 100 PDFs hochladen → JSON Ergebnisse
2. iReport: Alle JSON-Daten mit "Purchase Order" Template
3. Result: Excel-Datei mit strukturierten Daten
4. Accounting kann Daten direkt in Buchhaltung importieren
```

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - iReport](OPERATIONS_MANUAL.md#-ireport-integration)

---

## 📁 Documents Management

**Access:** Dashboard → DOCUMENTS & SCHEMA → Documents

### Funktionen

- 📂 Alle hochgeladenen Dokumente auflisten
- 🔍 Schnellsuche nach Dateinamen
- 🏷️ Nach Typ, Datum, Größe filtern
- 👁️ Dokument-Vorschau anzeigen
- 🗑️ Dokumente löschen/archivieren
- 📊 Metadaten anschauen (Größe, Datum, Typ)

### Best Practices

- ✅ Regelmäßig alte Dokumente archivieren (> 1 Jahr)
- ✅ Tags für Kategorisierung verwenden
- ✅ Monatlich: Bereinigung veralteter Dateien
- ✅ Speicherplatz regelmäßig prüfen

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Documents Management](OPERATIONS_MANUAL.md#-documents-&-schema-datenmodelle--vorlagen)

---

## 🎯 Schema Management

**Access:** Dashboard → DOCUMENTS & SCHEMA → Schema Management

### Was ist ein Schema?

Ein **Schema** definiert die Struktur eines Dokumenttyps. Beispiele:
- "Rechnung": Felder wie Rechnungsnummer, Datum, Betrag
- "Beleg": Felder wie Kategorie, Betrag, Datum
- "Vertrag": Felder wie Partner, Laufzeit, Betrag

### Funktionen

1. **Schemas auflisten** - Alle verfügbaren Templates sehen
2. **Neues Schema erstellen** - Eigene Dokumenttypen definieren
3. **Schema bearbeiten** - Felder hinzufügen/ändern
4. **Versionen vergleichen** - Unterschiede zwischen Versionen
5. **Schema löschen** - Veraltete Schemas entfernen (aber Versionierung beibehalten!)

### Schritt-für-Schritt: Neues Schema erstellen

```
1. Klick "➕ Neues Schema"
2. Name eingeben: z.B. "Rechnung_2024"
3. Felder definieren:
   ├─ Rechnungsnummer (Text, erforderlich)
   ├─ Datum (Datum, erforderlich)
   ├─ Lieferant (Text, erforderlich)
   ├─ Gesamtbetrag (Dezimal, erforderlich)
   └─ MwSt. % (Dezimal, optional)
4. Klick "💾 Speichern"
5. Schema ist jetzt verfügbar in Job Manager!
6. Testen mit Beispiel-Dokument
```

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Schema Management](OPERATIONS_MANUAL.md#-schema-management-dokumenttypen-definieren)

---

## ⚙️ Rule Editor

**Access:** Dashboard → RULES & LEARNING → Rule Editor

### Was ist Rule Editor?

Mit dem Rule Editor erstellen Sie **benutzerdefinierte Regeln** zur automatischen Datenextraktion:

```
IF [Bedingung] THEN [Aktion]
```

### Beispiel-Regeln

```
1. IF Betrag > 1000 THEN Priorität = "Hoch"
2. IF Lieferant IN (Amazon, eBay) THEN Kategorie = "E-Commerce"
3. IF Rechnungsnummer MATCHES ^\w{4}-\d{6}$ THEN Format = "Gültig"
```

### Arbeitsfluss: Neue Regel erstellen

1. Gehen Sie zu "Rule Editor"
2. Klick "➕ Neue Regel"
3. **Condition definieren (IF):**
   - Wählen Sie Feld (z.B. "Betrag")
   - Wählen Sie Operator (>, <, ==, IN, MATCHES)
   - Wert eingeben (z.B. "1000")
4. **Action definieren (THEN):**
   - Wählen Sie Zielfeld (z.B. "Priorität")
   - Wählen Sie Wert (z.B. "Hoch")
5. **Testen:** Beispiel-Dokument hochladen → Regel wird angewendet
6. **Speichern & Aktivieren**

### Regel-Typen

| Typ | Beispiel |
|-----|----------|
| **Comparison** | IF Betrag > 1000 |
| **String Match** | IF Lieferant CONTAINS "Amazon" |
| **RegEx** | IF Rechnungsnummer MATCHES ^\d{6}$ |
| **Logical** | IF (Betrag > 1000) AND (Status = "Draft") |

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Rule Editor](OPERATIONS_MANUAL.md#-rule-editor)

---

## ⚙️ Configuration & Admin

**Access:** Dashboard → SYSTEM → Configuration

### ⚠️ Zugriffsschutz

**Nur für Administratoren!** Falsche Konfiguration kann zur Datenverlust führen.

### Konfigurierbare Einstellungen

| Einstellung | Beschreibung |
|------------|-------------|
| **📧 Email Server** | SMTP-Konfiguration für Benachrichtigungen |
| **🔗 API Endpoints** | Backend-URLs und Port-Konfiguration |
| **👥 User Management** | Benutzer & Rollen verwalten |
| **🔒 Security Settings** | Passwort-Richtlinien, 2FA |
| **📝 Logging Level** | Debug, Info, Warning, Error |
| **💾 Storage Quotas** | Max. Speichergröße pro Benutzer |
| **📅 Backup Schedule** | Automatische Sicherungen |
| **🔐 Authentication** | OAuth, LDAP, Basic Auth |

### Checkliste für neue Installation

```
☐ Email Server konfigurieren
☐ Admin-Benutzer erstellen
☐ Automatische Backups planen (täglich)
☐ Logging Level auf "Info" setzen
☐ SSL/HTTPS aktivieren
☐ Firewall-Regeln konfigurieren
☐ Erstes Backup durchführen & testen
```

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Configuration](OPERATIONS_MANUAL.md#-configuration-&-verwaltung)

---

## 🔍 Monitoring & Audit

### Audit Trail

**Zweck:** Vollständige Protokollierung aller Benutzeraktionen für Compliance

**Protokolliert wird:**
- ✏️ Welche Dokumente hochgeladen wurden
- 🎯 Welche Schemas verwendet wurden
- ⚙️ Welche Regeln angewendet wurden
- 📊 Welche Daten extrahiert wurden
- 👤 Wer es gemacht hat
- 🕐 Wann es passiert ist

**Verwendung:**
1. Dashboard → MONITORING & AUDIT → Audit Trail
2. Filter nach: Benutzer, Datum, Dokumenttyp
3. Export für Compliance-Bericht

### Logs

**Arten von Logs:**
- 🔴 **Fehler** - Kritische Probleme
- 🟡 **Warnungen** - Potenzielle Probleme
- 🔵 **Info** - Normales Verhalten
- 🟢 **Debug** - Detaillierte Debugging-Info

**Zugriff:**
- Dashboard → MONITORING & AUDIT → Logs
- Filter nach Log-Level & Zeitraum
- Suche nach Keywords

### Backups

**Funktionen:**
- 📅 Automatische tägliche Backups
- ⏱️ Manuelle Backups erstellen
- 📥 Backup herunterladen
- 🔄 Aus Backup wiederherstellen

**Best Practice:**
- ✅ Wöchentlich: Backup-Restore Test
- ✅ Monatlich: Backup auf externem Storage archivieren

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Monitoring & Audit](OPERATIONS_MANUAL.md#-monitoring--audit-überwachung--compliance)

---

## 🖥️ Responsive Navigation

### Was ist Responsive Navigation?

Die App passt sich automatisch an Ihre **Bildschirmgröße** an:

#### 📱 Mobile (<600px)

```
┌──────────────────┐
│ ☰ Title 🌙 👤 │ ← AppBar
├──────────────────┤
│  Breadcrumb      │
├──────────────────┤
│                  │
│  MAIN CONTENT    │
│  (100% Breite)   │
│                  │
├──────────────────┤
│📊📄⚙️🔍⚙️☰│ ← Bottom Nav
└──────────────────┘
```

**Features:**
- ☰ Hamburger-Menü (Space sparen)
- 📊 Bottom Navigation (5 Kategorien schnell erreichbar)
- 📋 Vollbreite Content
- 🔄 Touch-optimierte Buttons

#### 📊 Tablet (600-960px)

- Schmale Sidebar (80px) mit nur Icons
- Hover → Tooltip mit vollem Namen
- Content nimmt volle Breite

#### 🖥️ Desktop (1200px+)

- Volle 280px Sidebar (permanent)
- Alle Labels sichtbar
- Kategorien expandierbar
- Maximale Funktionalität

### Keyboard Shortcuts

| Shortcut | Funktion |
|----------|----------|
| `Cmd+K` oder `Ctrl+K` | Kommandopalette öffnen |
| `Cmd+J` oder `Ctrl+J` | Zu Job Manager gehen |
| `Cmd+S` oder `Ctrl+S` | Zu Schema gehen |
| `Cmd+R` oder `Ctrl+R` | Zu Rules gehen |
| `Esc` | Palette/Menü schließen |

**📖 ERWEITERTE NUTZUNG:** [OPERATIONS_MANUAL.md - Responsive Design](OPERATIONS_MANUAL.md#responsive-design-mobile-tablet-desktop)

---

## 🐳 Docker Deployment

### Backend Docker

**Build:**
```bash
docker build -f Dockerfile.backend -t audit-extractor:0.25.0 .
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -v /path/to/uploads:/app/uploads \
  audit-extractor:0.25.0
```

### Frontend Docker

**Build:**
```bash
docker build -f Dockerfile.frontend -t audit-extractor-frontend:0.25.0 .
```

**Run:**
```bash
docker run -p 80:80 audit-extractor-frontend:0.25.0
# Access at http://localhost
```

### Docker Compose

```bash
docker-compose up -d
# Backend: http://localhost:3000
# Frontend: http://localhost:80
```

---

## ❓ Troubleshooting & FAQ

### App lädt nicht

**Problem:** Nur weiße Seite nach Öffnen

**Lösungen:**
```
1. Cache löschen: Ctrl+Shift+R (Windows) oder Cmd+Shift+R (Mac)
2. Browser neu starten
3. Backend prüfen: http://localhost:3000/api/health
4. Port-Konflikt: netstat -ano | findstr :5173
```

### Job schlägt fehl

**Problem:** "Schema not found"

**Lösungen:**
```
1. Prüfen Sie: Schema Management → Existiert das Schema wirklich?
2. Überprüfen Sie Namen (Groß-/Kleinschreibung exakt matchen)
3. Backend neustarten: npm run backend:restart
4. Datenbank synchronisieren: Configuration → Sync Schemas
```

### Upload funktioniert nicht

**Problem:** Upload-Button grau oder funktioniert nicht

**Lösungen:**
```
1. Dateisize prüfen (max. 50MB)
2. Dateityp prüfen (PDF, PNG, JPG, TIFF, DOCX)
3. Browser-Problem? In anderem Browser testen?
4. Speicherplatz voll? Configuration → Storage Usage überprüfen
```

### Extraktion hat falsche Ergebnisse

**Problem:** Extrahierte Daten sind falsch oder leer

**Lösungen:**
```
1. Richtiges Schema ausgewählt?
2. Regeln aktiv (grüner Haken)?
3. Dokumentqualität (gescannt vs. digital)?
4. Regeln anpassen in Extraction Workbench
5. Rule Editor: Regeln überarbeiten
6. ML-Modell trainieren (nach ~50 Korrektionen)
```

### Performance-Probleme

**Problem:** App ist langsam

**Schnelle Fixes:**
```
1. Tab aktualisieren: F5
2. Browser-Cache löschen
3. Browser neustarten
4. Datenbank optimieren: npm run db:optimize
5. Alte Dokumente archivieren
```

**📖 UMFASSENDE HILFE:** [OPERATIONS_MANUAL.md - Troubleshooting](OPERATIONS_MANUAL.md#troubleshooting)

---

## Checklisten

### Täglich ✅

- [ ] App öffnen - Dashboard anschauen
- [ ] Fehlerquote prüfen (sollte < 2% sein)
- [ ] Unverarbeitete Jobs ansehen
- [ ] Manuelle Korrektionen durchführen
- [ ] Audit Trail prüfen

### Wöchentlich ✅

- [ ] Alle Jobs der Woche überprüfen
- [ ] Fehlerquote & Trends analysieren
- [ ] Regeln überarbeiten (wenn nötig)
- [ ] Performance prüfen (Logs)
- [ ] Speicherplatz überprüfen

### Monatlich ✅

- [ ] Datenbank-Optimierung: `npm run db:optimize`
- [ ] Backup-Restore Test
- [ ] Sicherheit & Configuration Review
- [ ] Performance Report
- [ ] ML-Modell neu trainieren
- [ ] Benutzer & Berechtigungen überprüfen

---

## Wichtige Links

| Resource | Beschreibung |
|----------|-------------|
| [OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md) | **Umfassendes Betriebshandbuch** mit Use Cases & Workflows |
| [RESPONSIVE_NAVIGATION_PROPOSAL.md](RESPONSIVE_NAVIGATION_PROPOSAL.md) | Design Proposal (Navigation) |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Detaillierte Fehlerbehandlung |
| [API_REFERENCE.md](API_REFERENCE.md) | Backend-API Dokumentation |
| [DOCUMENTATION_INDEX_0.25.0.md](DOCUMENTATION_INDEX_0.25.0.md) | Vollständiger Dokumentations-Index |

---

## Kontakt & Support

**Bei Fragen oder Problemen:**

1. ✅ Dieses Manual durchlesen
2. ✅ [OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md) lesen
3. ✅ [TROUBLESHOOTING.md](TROUBLESHOOTING.md) konsultieren
4. ✅ [API_REFERENCE.md](API_REFERENCE.md) prüfen
5. 📧 Support kontaktieren

---

**Manual Version:** 0.25.0  
**Letzte Aktualisierung:** 2026-07-11  
**Status:** Production Ready ✅

**Phase:** 25 (Responsive Navigation + Job Manager + iReport Integration)
