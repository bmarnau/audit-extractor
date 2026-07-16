# 📖 Operationshandbuch - Betriebshandbuch
## Audit-Safe Document Extractor 0.37.0

**Version:** 0.37.0  
**Phase:** 43 (Technical Audit API & Report Viewer) + 38C (Technical Test Runner)  
**Datum:** 2026-07-16  
**Status:** Produktionsreif mit Technical Audit API, Report Viewer und Dashboard Widget  

---

## 📋 Inhaltsverzeichnis

1. [🆕 Phase 38C: Technical Test Runner](#-phase-38c-technical-test-runner)
2. [🆕 Phase 43: Technical Audit API & Report Viewer](#-phase-43-technical-audit-api--report-viewer-v037)
3. [Was ist die Audit-Safe App?](#was-ist-die-audit-safe-app)
4. [Systemanforderungen](#systemanforderungen)
5. [Installation & Start](#installation--start)
6. [Navigationsstruktur](#navigationsstruktur)
7. [Menüpunkte - Detaillierte Beschreibung](#menüpunkte---detaillierte-beschreibung)
8. [Grundlegende Bedienung](#grundlegende-bedienung)
9. [Arbeitsabläufe nach Anwendungsfall](#arbeitsabläufe-nach-anwendungsfall)
10. [Responsive Design (Mobile, Tablet, Desktop)](#responsive-design-mobile-tablet-desktop)
11. [Troubleshooting](#troubleshooting)
12. [System-Checks & Wartung](#system-checks--wartung)
13. [Best Practices](#best-practices)

---

## 🆕 Phase 38C: Technical Test Runner

### Überblick

Die **Technical Test Runner** ist eine zentralisierte Infrastruktur zur Ausführung aller 28 technischen Tests des Systems. Sie bietet vollständige Lifecycle-Verwaltung, Parallelisierung, Fehlerklassifizierung und Multi-Format-Berichterstattung.

**Schnelle Referenz:**
```bash
# Alle Tests ausführen
npm run test:technical

# Nur kritische Tests
npm run test:technical:critical

# Smoke Tests (schnelle Validierung)
npm run test:technical:smoke

# Mit ausführlicher Ausgabe
npm run test:technical:verbose
```

### Test-Kategorien (28 Tests)

| Kategorie | Tests | Fokus |
|-----------|-------|-------|
| **INF** (Infrastructure) | 5 | Systemkonfiguration, Docker, Node.js |
| **DAT** (Persistence) | 8 | PostgreSQL, Redis, Datenspeicherung |
| **SRV** (Services) | 6 | Kernservices, DI-Container, Logger |
| **API** | 6 | REST-Endpunkte, HTTP-Protokoll |
| **CFG** (Configuration) | 5 | Konfigurationsmanagement, Umgebungsvariablen |
| **OPS** (Operations) | 5 | Monitoring, Logging, Health Checks |
| **UI** (Frontend) | 5 | Navigation, Views, Responsive Design |
| **GOV** (Governance) | 3 | Compliance, Audit, Security |

### Ausführungsmodi

**FULL Mode** (Standard)
- Führt alle 28 implementierten Tests aus
- Parallelisierung: Bis zu 4 Tests gleichzeitig
- Ausführungszeit: ~2-5 Sekunden
- Befehl: `npm run test:technical`

**CRITICAL Mode**
- Nur HIGH und CRITICAL Severity Tests
- Schnelle Validierung kritischer Funktionen
- Ausführungszeit: ~1 Sekunde
- Befehl: `npm run test:technical:critical`

**SMOKE Mode**
- Minimale Subset-Tests für schnelle Validierung
- Ideal für CI/CD-Pipelines
- Ausführungszeit: <500ms
- Befehl: `node scripts/run-technical-tests.mjs SMOKE`

**SUBSET Mode**
- Spezifische Test-IDs auswählen
- Befehl: `node scripts/run-technical-tests.mjs SUBSET INF-001,DAT-005,API-003`

**Sequential Mode**
- Tests nacheinander (nicht parallel)
- Für detailliertes Debugging
- Befehl: `node scripts/run-technical-tests.mjs FULL --sequential`

### Ergebnis-Artefakte

Alle Tests generieren automatisch 5 Output-Formate in `test-results/runs/[RUN-ID]/`:

**1. metadata.json** - Laufzeitinformation
```json
{
  "runId": "20260715_082323_951",
  "environment": {
    "host": "LAPTOP-ABC",
    "platform": "win32",
    "nodeVersion": "0.37.0"
  },
  "configuration": {
    "mode": "FULL",
    "parallel": true,
    "maxConcurrent": 4
  }
}
```

**2. summary.json** - Aggregierte Statistiken
```json
{
  "total": 28,
  "passed": 28,
  "failed": 0,
  "skipped": 0,
  "error": 0,
  "stats": {
    "CRITICAL": { "total": 8, "passed": 8 },
    "HIGH": { "total": 10, "passed": 10 }
  }
}
```

**3. findings.json** - Detaillierte Erkenntnisse
- Fehleranalyse mit Severity-Klassifizierung
- Root-Cause-Kategorien
- Betroffene Tests und Empfehlungen
- Audit Trail für jede Klassifizierung

**4. results.csv** - Spreadsheet-Format
```
TestId,Category,Severity,Status,DurationMs,ErrorCode,ErrorMessage
INF-001,INFRASTRUCTURE,CRITICAL,PASSED,234,,
DAT-001,PERSISTENCE,HIGH,PASSED,567,,
```

**5. report.html** - Interaktives Dashboard
- Visuelle Übersicht mit Charts
- Filter nach Kategorie/Severity
- Responsive Design
- Export-Funktionen

### Beispiel: Test-Ausführung

```bash
$ npm run test:technical

> npm run build

  ✓ TypeScript compilation complete
  ✓ ESM imports fixed for 87 files

  ✅ Test Framework Validated
  ✓ 42 tests loaded (28 implemented + 14 placeholders)
  
  🏃 Executing tests in parallel (concurrency: 4)...

  ✅ CRITICAL (8):   ████████░░ 100% → PASSED (0.234s)
  ✅ HIGH (10):      ██████░░░░ 100% → PASSED (0.456s)
  ✅ MEDIUM (5):     ████░░░░░░ 100% → PASSED (0.189s)
  ✅ LOW (3):        ███░░░░░░░ 100% → PASSED (0.098s)
  ✅ INFO (2):       ██░░░░░░░░ 100% → PASSED (0.067s)

  📊 Results Summary:
     Total:   28 | Passed: 28 | Failed: 0 | Skipped: 0 | Errors: 0
     Duration: 0.044s | Status: ✅ ALL TESTS PASSED

  📁 Results saved to:
     test-results/runs/20260715_082323_951/

  📄 Generated Artifacts:
     ✓ metadata.json       (Run Info & Config)
     ✓ summary.json        (Statistics)
     ✓ findings.json       (Detailed Findings)
     ✓ results.csv         (Spreadsheet Format)
     ✓ report.html         (Interactive Dashboard)
```

### Severity Engine (20 Klassifizierungsregeln)

Das System klassifiziert Fehler automatisch nach 20 Regeln:

- **AUTH_MISSING**: Authentifizierung erforderlich
- **VALIDATION_FAILED**: Eingabevalidierung
- **DATABASE_CONNECTION**: Datenbankverbindung
- **SERVICE_TIMEOUT**: Service-Timeout
- **CONFIGURATION_INVALID**: Ungültige Konfiguration
- **RESOURCE_NOT_FOUND**: Ressource nicht gefunden
- ... (15 weitere Kategorien)

Jede Regel hat:
- Test-ID-Muster (Array oder Regex)
- Keywords zur Fehler-Identifizierung
- Severity-Level (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- Impact & Recommendation
- Root-Cause-Kategorie
- Priorität

### Docker-Integration

Tests können auch im Container ausgeführt werden:

```bash
# Tests im Backend-Container
docker exec extractor-backend npm run test:technical

# Mit Verbose-Output
docker exec extractor-backend npm run test:technical:verbose

# Nur CRITICAL Tests
docker exec extractor-backend npm run test:technical:critical
```

### ESM Module-System (Phase 38C)

- **TypeScript Target**: ES2020
- **Module System**: ESNext (ESM native)
- **Node.js Unterstützung**: v24+ erforderlich
- **Import-Auflösung**: Automatische .js-Erweiterungen
- **Directory-Imports**: Auflösung zu /index.js

**Build-Prozess:**
```bash
npm run build
  → tsc (TypeScript kompilieren)
  → tsc-alias (Pfad-Alias auflösen)  
  → fix-esm-imports.mjs (ESM-Korrekturen)
```

Gesamtdauer: ~10 Sekunden

---

## 🆕 Phase 43: Technical Audit API & Report Viewer (v0.37.0)

### Überblick - Technical Tests Framework

**Phase 43** erweitert das System um eine umfassende REST API für technische Audit-Ergebnisse, Report-Visualisierung und Multi-Format-Export.

| Component | Purpose | Status |
|-----------|---------|--------|
| **Phase 43A** | Findings API | ✅ Live |
| **Phase 43B** | Recommendations API | ✅ Live |
| **Phase 43C** | Report Viewer UI | ✅ Live |
| **Phase 43D** | Export Services (PDF/CSV/JSON) | ✅ Live |
| **Phase 43E** | Dashboard Widget | ✅ Live |

### API Endpoints

#### Phase 43A: Findings API

Retrieve technical audit findings with filtering and statistics.

**Base Endpoint:** `GET /api/technical-tests/findings`

**Request Parameters:**
```
?severity=critical      (Optional: critical, high, medium, low)
?limit=50              (Optional: Results per page, default 20)
?offset=0              (Optional: Pagination offset)
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "findings": [
      {
        "id": "string",
        "title": "string",
        "severity": "critical|high|medium|low",
        "component": "string",
        "description": "string",
        "affectedArea": "string",
        "timestamp": "ISO-8601"
      }
    ],
    "total": 0,
    "filtered": 0,
    "severityBreakdown": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    }
  }
}
```

**Additional Endpoints:**
- `GET /api/technical-tests/findings/:id` - Get single finding
- `GET /api/technical-tests/findings/severity/:level` - Filter by severity
- `GET /api/technical-tests/findings/statistics` - Get statistics

**Example:**
```bash
curl http://localhost:3000/api/technical-tests/findings?severity=critical&limit=10
```

---

#### Phase 43B: Recommendations API

Retrieve technical recommendations with priority and status tracking.

**Base Endpoint:** `GET /api/technical-tests/recommendations`

**Request Parameters:**
```
?priority=high         (Optional: critical, high, medium, low)
?status=open           (Optional: open, in-progress, resolved)
?limit=50              (Optional: Results per page)
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "string",
        "title": "string",
        "priority": "critical|high|medium|low",
        "status": "open|in-progress|resolved",
        "description": "string",
        "estimatedEffort": "string",
        "tags": ["string"]
      }
    ],
    "total": 0,
    "byPriority": { "critical": 0, "high": 0 },
    "byStatus": { "open": 0, "in-progress": 0, "resolved": 0 }
  }
}
```

**Additional Endpoints:**
- `GET /api/technical-tests/recommendations/:id` - Get single recommendation
- `GET /api/technical-tests/recommendations/priority/:priority` - Filter by priority
- `GET /api/technical-tests/recommendations/status/:status` - Filter by status
- `GET /api/technical-tests/recommendations/statistics` - Get statistics

---

#### Phase 43D: Export Services

Export technical audit reports in multiple formats.

**PDF Export**
```bash
POST /api/technical-tests/export/pdf
Content-Type: application/json

{
  "title": "Technical Audit Report",
  "author": "Audit Team",
  "includeFindings": true,
  "includeRecommendations": true,
  "includeSummary": true
}
```

**CSV Export**
```bash
POST /api/technical-tests/export/csv
Content-Type: application/json

{
  "title": "Technical Findings Export",
  "includeFindings": true
}
```

**JSON Export**
```bash
POST /api/technical-tests/export/json
Content-Type: application/json

{
  "title": "Technical Audit Data",
  "includeRecommendations": true
}
```

**Response:** File download with appropriate MIME type

---

### React Components

#### Phase 43C: Report Viewer Component

Location: `frontend/src/components/ReportViewer/`

**Features:**
- Tabular display of findings with severity color-coding
- Recommendations table with priority indicators
- Report summary cards with key metrics
- Auto-refresh polling (60-second interval)
- Responsive Material-UI design

**Usage:**
```jsx
<ReportViewer
  autoRefresh={true}
  refreshInterval={60000}
  severityFilter="all"
/>
```

**Severity Color Scheme:**
- 🔴 **Critical** - Red
- 🟠 **High** - Orange
- 🟡 **Medium** - Yellow
- 🟢 **Low** - Green

---

#### Phase 43E: Dashboard Widget

Location: `frontend/src/components/Dashboard/TechnicalAuditWidget.tsx`

**Features:**
- Real-time technical audit summary on main dashboard
- Health indicator (Critical/Warning/Healthy)
- Export dialog with 3 format options
- 60-second auto-refresh
- Quick statistics overview

**Health Status Logic:**
```
🔴 CRITICAL   → if critical findings > 0
🟡 WARNING    → if high findings > 0
🟢 HEALTHY    → if no critical/high findings
```

**Integration:**
Automatically integrated into the main dashboard. No additional configuration required.

---

### Database Schema (Phase 43)

**technical_findings table:**
```sql
CREATE TABLE technical_findings (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  component VARCHAR(100),
  description TEXT,
  affected_area VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_severity ON technical_findings(severity);
CREATE INDEX idx_component ON technical_findings(component);
```

**technical_recommendations table:**
```sql
CREATE TABLE technical_recommendations (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  description TEXT,
  estimated_effort VARCHAR(50),
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_priority ON technical_recommendations(priority);
CREATE INDEX idx_status ON technical_recommendations(status);
```

---

### Error Handling

All Phase 43 endpoints return standardized error responses:

```json
{
  "error": {
    "code": "NOT_FOUND|VALIDATION_ERROR|INTERNAL_ERROR",
    "message": "Descriptive error message",
    "details": {
      "field": "description of issue"
    }
  },
  "timestamp": "ISO-8601",
  "path": "/api/technical-tests/findings"
}
```

---

### Performance Considerations

| Operation | Timeout | Caching |
|-----------|---------|---------|
| Find all findings | 5s | 5 min |
| Find all recommendations | 5s | 5 min |
| Export PDF | 30s | None |
| Export CSV | 30s | None |
| Export JSON | 10s | None |

---

### Testing Phase 43

**Run all Phase 43 tests:**
```bash
npm run test:technical:phase43
```

**Expected results:**
- ✅ 16/16 tests passing
- ✅ 0 TypeScript errors
- ✅ All 5 components functioning

---

### Troubleshooting Phase 43

| Issue | Solution |
|-------|----------|
| API returns 404 | Check if backend container is healthy: `docker-compose ps` |
| Export fails | Verify request body JSON is valid |
| No findings in response | Load test data: `npm run seed:findings` |
| Dashboard widget not showing | Refresh browser and check browser console |

---

## Was ist die Audit-Safe App?

### Zweck und Nutzen

Die **Audit-Safe Document Extractor** ist eine spezialisierte Webanwendung zur intelligenten Verarbeitung und Kategorisierung von geschäftlichen Dokumenten (Rechnungen, Belege, Verträge, etc.). Die App automatisiert die Extraktion von Kernpetdaten aus Dokumenten unter Verwendung von:

- **Intelligenter OCR-Technologie** - Erkennung von Text in gescannten Dokumenten
- **Schemabasierte Regeln** - Automatische Kategorisierung nach konfigurierbaren Mustern  
- **Job-Management** - Batch-Verarbeitung mehrerer Dokumente gleichzeitig
- **Audit-Trail** - Vollständige Protokollierung aller Aktionen für Compliance
- **Flexible Regeln-Engine** - Benutzerdefinierte Regeln zum Extrahieren von Informationen

### Zielgruppe

- 📊 **Bookkeeper & Accountants** - Dokumentenverarbeitung für Finanzbuchhaltung
- 🏢 **Unternehmen** - Batch-Verarbeitung von eingehenden Dokumenten
- 🔍 **Revisoren** - Audit-Trail und Compliance-Anforderungen
- ⚙️ **IT-Administratoren** - Systemkonfiguration und -wartung

### Kernfunktionen auf einen Blick

```
┌─────────────────────────────────────────────────────────┐
│                 AUDIT-SAFE APP FLOW                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. DOKUMENT HOCHLADEN                                  │
│     ↓                                                   │
│  2. SCHEMA AUSWÄHLEN (z.B. "Rechnung")                  │
│     ↓                                                   │
│  3. REGELN ANWENDEN (Automatische Extraktion)           │
│     ↓                                                   │
│  4. ERGEBNISSE PRÜFEN & BEARBEITEN                      │
│     ↓                                                   │
│  5. DATEN EXPORTIEREN oder IN JOB SPEICHERN             │
│     ↓                                                   │
│  6. AUDIT-TRAIL EINSEHEN                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Systemanforderungen

### Hardware
- **Prozessor:** Intel Core i5 oder äquivalent
- **RAM:** Mindestens 4 GB (8 GB empfohlen)
- **Speicher:** 5 GB für Datenbank und Dokumente
- **Netzwerk:** Stabile Internetverbindung

### Software
- **Browser:** Unterstützte Versionen:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
  - Mobile Browser (iOS Safari, Chrome Mobile)

### Backend-Services
- **PostgreSQL 12+** - Datenbank
- **Node.js 16+** - Backend-Server
- **npm 7+** - Paketmanager

---

## Installation & Start

### Schnellstart

```powershell
# 1. Repository klonen
git clone <repository-url>
cd extractor

# 2. Dependencies installieren
npm install

# 3. Datenbank initialisieren (wenn nötig)
npm run setup:db

# 4. Application starten
npm start

# 5. Im Browser öffnen
# http://localhost:5173 (Frontend - Vite Dev Server)
# http://localhost:3000/api (Backend - Express)
```

### Verfügbare Start-Scripts

| Script | Befehl | Zweck |
|--------|--------|-------|
| Frontend Dev | `npm run frontend` | Startet VITE Dev Server (Port 5173) |
| Backend | `npm run backend` | Startet Express Backend (Port 3000) |
| Both | `npm start` | Startet Frontend + Backend |
| Build | `npm run build` | Erstellt produktiven Build |
| Verify | `npm run verify` | Validiert Build mit Runtime-Test |
| Docker | `npm run docker:up` | Startet in Docker Container |

---

## Navigationsstruktur

### Desktop Layout (1200px+)
```
┌────────────────────────────────────────────────────────┐
│ ☰ Audit-Safe Extractor     🌙  👤              (AppBar)│
├─────────┬──────────────────────────────────────────────┤
│ 📊 EX   │ Dashboard > Schema Management               │
│  ├ D    │ ─────────────────────────────────────────  │
│  ├ J [2]│                                             │
│  ├ W    │                MAIN CONTENT                 │
│         │                                             │
│ 📄 DO   │  • Responsive Layout                       │
│  ├ Dc   │  • Full Feature Access                     │
│  ├ SM   │  • Sidebar immer sichtbar                  │
│  ├ U    │                                             │
│  ├ iR   │                                             │
│         │                                             │
│ ⚙️ RUL  │                                             │
│ 🔍 MON  │                                             │
│ ⚙️ SYS  │                                             │
│         │                                             │
│ 0.37.0 │                                             │
├─────────┴──────────────────────────────────────────────┤
│ Sidebar: 280px (permanent)    │ Main: Responsive       │
└─────────────────────────────────────────────────────────┘
```

### Tablet Layout (600-960px)
```
┌──────────────────────────────────┐
│ ☰ Audit-Safe     🌙  👤  (AppBar)│
├────┬──────────────────────────────┤
│ 📊 │ Dashboard > Job Manager      │
│ 📄 │ ─────────────────────────    │
│ ⚙️ │                              │
│ 🔍 │    MAIN CONTENT              │
│ ⚙️ │    (Full Width)              │
│    │                              │
├────┴──────────────────────────────┤
│ Sidebar: 80px (icons)  │ Main    │
└──────────────────────────────────┘
```

### Mobile Layout (<600px)
```
Portrait:                  Landscape:
┌──────────────────┐      ┌────────────────────────────┐
│ ☰ Audit-Safe 🌙 │      │ ☰ Audit-Safe  🌙 👤      │
├──────────────────┤      ├────┬─────────────────────────┤
│ Dashboard >Job M │      │ 📊 │ Dashboard > Job Manager│
├──────────────────┤      │ 📄 │ ─────────────────────  │
│                  │      │ ⚙️ │                        │
│  MAIN CONTENT    │      │ 🔍 │  MAIN CONTENT         │
│  (Full Width)    │      │ ⚙️ │  (Responsive)         │
│                  │      │ ☰ │                        │
│                  │      ├────┴─────────────────────────┤
├──────────────────┤      │ Bottom Nav: 5 Icons         │
│📊 📄 ⚙️ 🔍 ⚙️ ☰│      └────────────────────────────┘
└──────────────────┘ 
Bottom: 5 Kategorien + Menü
```

---

## Menüpunkte - Detaillierte Beschreibung

### 📊 EXTRACTION (Dokumenten-Verarbeitung)

#### 🏠 Dashboard
- **Zweck:** Zentrale Übersichtsseite mit allen wichtigen Kennzahlen
- **Was Sie sehen:**
  - 📈 Verarbeitete Dokumente (heute, diese Woche, insgesamt)
  - 🎯 Erfolgsquote bei Extraktion
  - 📊 Statistiken zu Dokumenttypen
  - 🔄 Aktuelle Jobs und deren Status
  - ⚠️ Fehler oder Probleme
- **Wann Sie es brauchen:** Beim Start der Arbeit, um schnell den Status zu sehen

#### 💼 Job Manager
- **Zweck:** Verwaltung von Batch-Verarbeitungsaufträgen
- **Funktionen:**
  - ➕ Neuen Job erstellen (mehrere Dokumente hochladen)
  - 📋 Job-Liste mit Status anschauen
  - 🔍 Jobs suchen und filtern
  - ⏱️ Laufzeit der Jobs sehen
  - 📥 Ergebnisse herunterladen
  - ❌ Fehlgeschlagene Jobs neu verarbeiten
- **Badge [2]:** Zeigt, dass 2 Jobs derzeit ausstehend sind
- **Arbeitsfluss:**
  1. Klick auf "Job Manager"
  2. Klick auf "Neuer Job"
  3. Dokumente auswählen
  4. Schema wählen (z.B. "Rechnungen")
  5. Regeln konfigurieren
  6. Job starten
  7. Status beobachten

#### 🔧 Extraction Workbench
- **Zweck:** Interaktive Verarbeitung von einzelnen Dokumenten
- **Für:** Testen, manuelles Anpassen, Feintuning
- **Features:**
  - 📄 Dokument hochladen oder aus Dateimanager wählen
  - 👁️ Dokument-Vorschau anzeigen
  - 🎯 Schema auswählen
  - ⚙️ Regeln inline bearbeiten
  - 🔄 Extraction-Ergebnis live sehen
  - ✏️ Extrahierte Daten manuell korrigieren
  - 💾 Ergebnisse speichern
- **Wann:** Wenn Sie feintuning brauchen oder Regeln debuggen

---

### 📄 DOCUMENTS & SCHEMA (Datenmodelle & Vorlagen)

#### 📁 Documents
- **Zweck:** Verwaltung aller hochgeladenen Dokumente
- **Was Sie können:**
  - 📂 Dokumente nach Typ, Datum, Größe filtern
  - 🔍 Schnellsuche nach Dokumenten
  - 👁️ Dokument-Vorschau anzeigen
  - 🏷️ Tags oder Kategorien hinzufügen
  - 🗑️ Dokumente löschen
  - 📊 Metadaten anschauen
- **Tipp:** Regelmäßig alte Dokumente archivieren/löschen

#### 🎯 Schema Management
- **Zweck:** Verwaltung von Dokumenten-Schemen (Templates für verschiedene Dokumenttypen)
- **Was Sie können:**
  - 📋 Verfügbare Schemas auflisten (Rechnung, Beleg, Vertrag, etc.)
  - ➕ Neues Schema erstellen
  - ✏️ Schema bearbeiten (Felder definieren)
  - 🔍 Schemaversionen vergleichen
  - 🗑️ Veraltete Schemas löschen
- **Schema-Beispiel:** Eine "Rechnung" könnte folgende Felder haben:
  - Rechnungsnummer
  - Datum
  - Lieferant
  - Gesamtbetrag
  - MwSt.

#### ⬆️ Schema Upload
- **Zweck:** Neuen Dokumenttyp definieren (Guided Wizard)
- **Schritte:**
  1. Schema-Name eingeben (z.B. "Lieferschein")
  2. Felder definieren (Name, Typ, erforderlich ja/nein)
  3. Beispiel-Dokument hochladen
  4. Schema testen
  5. Speichern
- **Nutzen:** Sie können beliebig neue Dokumenttypen hinzufügen

#### 📊 iReport Integration
- **Zweck:** Erstellung und Management von Berichten
- **Was Sie können:**
  - 📈 Berichte aus extrahierten Daten generieren
  - 📋 Berichte nach Schema filtern
  - 📥 Berichte als PDF/Excel exportieren
  - 📧 Berichte per E-Mail versenden
  - 🔔 Berichte zeitlich planen (automatisch generieren)
- **Beispiele:**
  - Tägliche Zusammenfassung aller Rechnungen
  - Monatliche Kostenausgabe nach Kategorie
  - Lieferanten-Performance-Report

---

### ⚙️ RULES & LEARNING (Automatisierung & Intelligenz)

#### 🎛️ Rule Editor
- **Zweck:** Definieren von benutzerdefinierten Regeln zur automatischen Daten-Extraktion
- **Beispiel-Regeln:**
  - "Wenn das Feld 'Sender' 'Amazon' enthält → Kategorie = 'E-Commerce'"
  - "Wenn Rechnungsbetrag > 1000 → Höhere Priorität"
  - "RegEx: Steuernummer als ^\d{11}$ extrahieren"
- **So funktioniert es:**
  1. Gehen Sie zu "Rule Editor"
  2. "Neue Regel erstellen"
  3. Condition definieren (IF...)
  4. Action definieren (THEN...)
  5. Regel testen mit Beispiel-Dokumenten
  6. Speichern und aktivieren
- **Anwendung:** Regeln werden automatisch bei der Extraction angewendet

#### 📚 Learning Center
- **Zweck:** Dokumentation, Tutorials, Best Practices
- **Inhalte:**
  - 📖 Video-Tutorials für alle Features
  - ❓ FAQ (Häufige Fragen)
  - 🎓 Schritt-für-Schritt-Anleitungen
  - 💡 Best Practices für Schema-Design
  - 🔗 Link zu Support und Community
- **Wann:** Wenn Sie etwas nicht verstehen oder lernen möchten

#### 📜 Version History
- **Zweck:** Verlaufskontrolle für Schemas und Regeln
- **Was Sie sehen:**
  - 🕐 Alle Versionen chronologisch
  - 👤 Wer die Änderung gemacht hat
  - 📝 Was genau geändert wurde
  - 🔄 Version wiederherstellen (Rollback)
  - 🔄 Zwei Versionen vergleichen
- **Nutzen:** Transparenz und Möglichkeit, Fehler rückgängig zu machen

---

### 🔍 MONITORING & AUDIT (Überwachung & Compliance)

#### 📋 Audit Trail
- **Zweck:** Vollständige Protokollierung aller Benutzeraktionen für Compliance
- **Was protokolliert wird:**
  - ✏️ Welche Dokumente hochgeladen wurden
  - 🎯 Welche Schemas verwendet wurden
  - ⚙️ Welche Regeln angewendet wurden
  - 📊 Welche Daten extrahiert wurden
  - 🔧 Welche Einstellungen geändert wurden
  - 👤 Wer es gemacht hat
  - 🕐 Wann es passiert ist
- **Verwendung:**
  - Compliance-Anforderungen erfüllen
  - Fehler nachvollziehen
  - Wer hat die Daten verändert?
- **Filter & Suche:**
  - Nach Benutzer filtern
  - Nach Datum-Bereich suchen
  - Nach Dokumenttyp oder ID suchen

#### 📊 Logs
- **Zweck:** Detaillierte technische Logs für Debugging
- **Arten von Logs:**
  - 🔴 Fehler (rot) - Kritische Probleme
  - 🟡 Warnungen (gelb) - Potenzielle Probleme
  - 🔵 Info (blau) - Normales Verhalten
  - 🟢 Debug (grün) - Detaillierte Debug-Infos
- **Wann Sie es brauchen:**
  - Job ist fehlgeschlagen - Logs durchsuchen
  - Performance-Problem - Logs auf langsame Operationen prüfen
  - API-Fehler - Im Backend-Log nachsehen
- **Log-Level konfigurieren:** Siehe Konfiguration

#### 💾 Backups
- **Zweck:** Sicherung und Wiederherstellung von Daten
- **Funktionen:**
  - 📅 Automatische tägliche Backups
  - ⏱️ Manuelle Backups erstellen
  - 📥 Backup herunterladen
  - 🔄 Aus Backup wiederherstellen
  - 🗑️ Alte Backups löschen
- **Best Practice:** Wöchentlich Backups überprüfen

---

### ⚙️ SYSTEM (Konfiguration & Verwaltung)

#### ⚙️ Configuration
- **Zweck:** Verwaltung aller Systemeinstellungen
- **Was Sie konfigurieren können:**
  - 📧 Email-Server (für Berichte & Benachrichtigungen)
  - 🌐 API-Endpoints konfigurieren
  - 👥 Benutzer & Rollen verwalten
  - 🔐 Sicherheitseinstellungen (Passwörter, 2FA)
  - 📊 Logging-Level einstellen
  - 📅 Automatische Berichte planen
  - 🗂️ Speicherquoten für Dokumente
- **WARNUNG:** Nur für Administratoren! Falsche Konfiguration kann zur Datenverlust führen.

#### 📖 Help Center
- **Zweck:** Zugang zur kompletten Dokumentation
- **Inhalte:**
  - 📘 Operationshandbuch (dieses Dokument)
  - 📗 Technische Dokumentation
  - 🔗 API-Referenz
  - 📞 Support-Kontakte
  - 🔍 Volltext-Suche in der Dokumentation
- **Schnellsuche:** Drücken Sie Cmd+? für schnelle Hilfe

---

## Grundlegende Bedienung

### Navigation unter verschiedenen Geräten

#### 🖥️ Desktop (1200px+)

**Menü öffnen:** Nicht nötig - Sidebar ist immer sichtbar

**Navigation:**
1. Klick auf einen Kategorie-Header (z.B. "📊 EXTRACTION")
2. Kategorie expandiert/kollabiert (150ms Animation)
3. Klick auf einen Menüpunkt
4. Aktive Seite wird in hauptem Content-Bereich angezeigt
5. Breadcrumb oben zeigt aktuelle Position

**Tastaturkürzel:**
- `Cmd+K` oder `Ctrl+K` - Kommandopalette öffnen (Suche)
- `Cmd+J` oder `Ctrl+J` - Zu Job Manager gehen
- `Cmd+S` oder `Ctrl+S` - Zu Schema Management gehen  
- `Cmd+R` oder `Ctrl+R` - Zu Rule Editor gehen
- `Esc` - Palette schließen

#### 📱 Mobile (<600px)

**Menü öffnen:** Tippen Sie auf das **☰** Symbol oben links

**Navigation:**
1. Tippen Sie ☰ (Hamburger-Icon)
2. Drawer öffnet sich von links (300ms Animation)
3. Tippen Sie auf einen Menüpunkt
4. Drawer schließt sich automatisch
5. Seite wird angezeigt

**Bottom Navigation:**
- Oben sehen Sie: **📊 📄 ⚙️ 🔍 ⚙️ ☰**
- Tippen Sie auf Icon für schnelle Navigation
- ☰ öffnet das komplette Menü

**Swipe Gesten:**
- Swipe von rechts nach links → Drawer schließen
- Swipe von links nach rechts → Drawer öffnen

#### 📊 Tablet (600-960px)

**Menü-Sidebar:** 80px breit mit Icons nur

**Navigation:**
1. Hover über das Icon → Tooltip zeigt Namen
2. Klick auf Icon → Öffnet volle Kategorie-Liste
3. Klick auf Menüpunkt → Navigation

**Responsive:**
- Content nimmt volle verfügbare Breite
- Icons-Sidebar bleibt sichtbar (smart!)

---

### Allgemeine Gesten & Interaktionen

#### Häufig verwendete Icons & ihre Bedeutung

| Icon | Name | Bedeutung |
|------|------|----------|
| 🔍 | Search | Suchfunktion |
| 💾 | Save | Speichern/Bestätigen |
| ✏️ | Edit | Bearbeiten |
| 🗑️ | Delete | Löschen (vorsicht!) |
| ⬇️ | Download | Datei herunterladen |
| ⬆️ | Upload | Datei hochladen |
| 🔄 | Refresh/Reload | Aktualisieren |
| ⚙️ | Settings | Einstellungen/Optionen |
| ❌ | Close | Schließen/Abbrechen |
| ✅ | Confirm | Bestätigen/OK |
| ⏸️ | Pause | Verarbeitung unterbrechen |
| ▶️ | Play | Verarbeitung starten |
| ⚠️ | Warning | Achtung/Warnung |
| ℹ️ | Info | Information |

#### Häufige Aktionen

**Dokument hochladen:**
1. Gehen Sie zu "Documents" oder "Extraction Workbench"
2. Klick auf "⬆️ Upload" Button
3. Datei auswählen oder Drag-and-Drop
4. Hochladen warten
5. Bestätigung

**Schema auswählen:**
1. In der Regel wird danach gefragt
2. Dropdown-Menü öffnet sich
3. Schema auswählen (z.B. "Rechnung 2024")
4. Bestätigen mit "Weiter" oder "OK"

**Job starten:**
1. Dokumente hochladen
2. Schema & Regeln auswählen
3. Klick "Job starten" oder "▶️ Verarbeiten"
4. Status-Anzeige lädt
5. Ergebnisse nach Fertigstellung verfügbar

**Daten exportieren:**
1. Gehen Sie zu Job/Ergebnisse
2. Klick auf "⬇️ Export"
3. Format wählen: PDF, Excel, CSV
4. Download startet
5. Datei im Downloads-Ordner verfügbar

---

## Arbeitsabläufe nach Anwendungsfall

### Use Case 1: Rechnungen täglich verarbeiten

**Szenario:** Sie erhalten jeden Tag 50 Rechnungen per Email und möchten diese automatisch kategorisieren und in Ihr Buchhaltungssystem exportieren.

**Schritt für Schritt:**

```
Tag 1: EINMALIGE KONFIGURATION
├─ 1. Gehen Sie zu "Schema Management"
├─ 2. Erstellen Sie Schema "Rechnung_2024" mit Feldern:
│  ├─ Rechnungsnummer (Text)
│  ├─ Datum (Datum)
│  ├─ Lieferant (Text)
│  ├─ Gesamtbetrag (Dezimal)
│  └─ MwSt. Prozent (Dezimal)
├─ 3. Gehen Sie zu "Rule Editor"
├─ 4. Erstellen Sie Regeln:
│  ├─ "Wenn Betrag > 1000 → Priorität=Hoch"
│  ├─ "Wenn Lieferant=(Liste)→ Kategorie=..."
│  └─ "RegEx Rechnungsnummer: ^\w{4}-\d{6}$"
├─ 5. Testen mit Beispiel-Rechnung
└─ 6. Speichern & aktivieren

Jeden Tag: AUTOMATISCHE VERARBEITUNG
├─ 1. Alle Rechnungen in einen Ordner speichern
├─ 2. Gehen Sie zu "Job Manager"
├─ 3. Klick "Neuer Job"
├─ 4. Alle Rechnungen hochladen (Drag-and-Drop möglich!)
├─ 5. Schema "Rechnung_2024" wählen
├─ 6. "Job starten"
├─ 7. Warten... (ggf. Kaffee trinken ☕)
├─ 8. Ergebnisse überprüfen (Dashboard zeigt Status)
├─ 9. Fehler korrigieren (mit Extraction Workbench)
└─ 10. In Excel exportieren & zur Buchhaltung senden
```

**Zeit sparen:**
- Vorher: 50 Rechnungen × 5 Min = 250 Minuten = 4h 10min
- Nachher: Job vorbereiten (5min) + Prüfen (30min) = 35 Minuten
- **Zeiteinsparung: 215 Minuten pro Tag = 18h pro Woche!**

---

### Use Case 2: Belege von Geschäftsreisen verarbeiten

**Szenario:** Mitarbeiter reichen monatlich Reisebelege ein (Hotel, Flug, Taxi, Restaurants). Sie müssen diese kategorisieren und genehmigen.

**Arbeitsablauf:**

```
SETUP (einmalig)
├─ Schema "Reisebeleg" erstellen mit:
│  ├─ Kategorie (Hotel/Flug/Taxi/Restaurant/Sonstiges)
│  ├─ Datum
│  ├─ Betrag
│  └─ Mitarbeiter (optional)
└─ Regeln erstellen:
   ├─ "Wenn Betrag < 50 → Auto-genehmigt"
   ├─ "Wenn Betrag 50-200 → Manager-genehmigung"
   └─ "Wenn Betrag > 200 → CEO-genehmigung"

MONATLICH
├─ 1. Mitarbeiter laden Belege hoch (via "Documents")
├─ 2. Sie gehen zu "Job Manager"
├─ 3. Alle neuen Belege verarbeiten (1 Job)
├─ 4. System extrahiert automatisch Betrag & Kategorie
├─ 5. Sie überprüfen Dashboard (Statistiken)
├─ 6. Fehler in Extraction Workbench korrigieren
├─ 7. Audit Trail exportieren (für Prüfung)
└─ 8. Genehmigungsbericht in Excel exportieren
```

**Ablauf im Detail (erste Woche):**

1. **Montag, 09:00 Uhr:**
   - Öffnen Sie die App
   - Dashboard zeigt: "14 neue Belege ausstehend"

2. **Montag, 09:05 Uhr:**
   - Gehen Sie zu "Job Manager"
   - Klick "Neuer Job"
   - Alle 14 Belege hochladen (können gleichzeitig sein)
   - Schema "Reisebeleg" wählen
   - "Job starten"

3. **Montag, 09:15 Uhr:**
   - Job läuft (Status: 45% verarbeitet)
   - Sie können anderen Aufgaben nachgehen

4. **Montag, 09:25 Uhr:**
   - Job fertig: 13 erfolgreich, 1 Fehler
   - Sie klicken auf den Fehler (Foto war zu dunkel)
   - Gehen Sie zu "Extraction Workbench"
   - Laden Sie den fehlerhaften Beleg
   - Manuell korrigieren (Betrag: 87€ statt "8*€")
   - Speichern

5. **Montag, 09:30 Uhr:**
   - Alle 14 Belege fertig kategorisiert
   - Gehen Sie zu iReport
   - Klick "Genehmigungsbericht"
   - Export als PDF/Excel
   - An Accounting-Team versenden

**Resultat:** Was vorher 2-3 Stunden dauerte, ist jetzt in 30 Minuten erledigt!

---

### Use Case 3: Verträge verwalten & versionieren

**Szenario:** Sie haben tausende Verträge. Sie möchten bestimmte Daten extrahieren (Vertragspartnerin, Laufzeit, Betrag) und alte Versionen nachverfolgbar machen.

**Lösung:**

```
PHASE 1: SCHEMA & REGELN
├─ Schema "Vertrag_2024" erstellen:
│  ├─ Vertragspartner
│  ├─ Startdatum
│  ├─ Enddatum
│  ├─ Jährlicher Betrag
│  └─ Vertragstyp (Kunde/Lieferant/Miete/etc.)
└─ Regeln mit RegEx:
   ├─ Datum-Format erkennen (DD.MM.YYYY)
   ├─ Beträge extrahieren (auch mit EUR/€)
   └─ Email-Adressen finden

PHASE 2: BATCH-IMPORT
├─ Alle Verträge hochladen (Job Manager)
├─ Masse verarbeiten (500+ Verträge möglich)
├─ Fehler korrigieren

PHASE 3: ÜBERWACHUNG
├─ Audit Trail zeigt: Wann wurde welcher Vertrag gelesen?
├─ Version History zeigt: Welche Daten änderten sich?
├─ Sie können alles älteren Versionen vergleichen
└─ Compliance: Vollständige Dokumentation
```

---

## Responsive Design (Mobile, Tablet, Desktop)

### Adaptive Interfaces

Die App passt sich automatisch an Ihre Bildschirmgröße an. Sie müssen nichts konfigurieren!

#### 📱 Mobile First

**Breakpoint:** < 600px (iPhone, kleine Tablets im Portrait)

**Features:**
- ☰ Hamburger-Menü (Space sparen)
- 📊 Bottom Navigation (5 Kategorien schnell erreichbar)
- 📋 Vollbreite Content
- 🔄 Touch-optimierte Buttons (min. 44px für leichte Bedienung)
- 📏 Responsive Schriftgrößen
- 🎨 Optimierte Farben für kleine Screens

**Layout:**
```
┌─────────────────┐
│ ☰ Title 🌙 👤 │
├─────────────────┤
│  Breadcrumb     │
├─────────────────┤
│                 │
│  MAIN CONTENT   │
│  (100% Breite)  │
│                 │
├─────────────────┤
│📊📄⚙️🔍⚙️☰│
└─────────────────┘
```

**Tipps für Mobile-Nutzer:**
- Nutzen Sie Bottom Navigation für schnelle Navigation
- Tippen Sie ☰ um vollständiges Menü zu sehen
- Swipe nach oben zum Scrollen (normal)
- Landscape-Modus hat auch Tab-Navigation (bequem!)

#### 📊 Tablet (Landscape & Portrait)

**Breakpoint:** 600px - 960px

**Features:**
- Schmale Sidebar (80px) mit nur Icons
- Hover → Tooltip mit vollem Namen
- Content nimmt 80% der Breite
- 🖥️ Desktop-ähnliche Bedienung aber kompakt

**Layout:**
```
┌────────────────────────────┐
│ ☰ Title         🌙 👤    │
├────┬─────────────────────────┤
│📊  │                        │
│📄  │  MAIN CONTENT          │
│⚙️  │                        │
│🔍  │  (Optimal für Tablet)  │
│⚙️  │                        │
├────┴─────────────────────────┤
│ Compact: 80px │ Main: 80% │
└────────────────────────────┘
```

**Tipps für Tablet-Nutzer:**
- Hover über Icons → Tooltips zeigen Namen
- Portrait-Modus: Ähnlich wie Mobile
- Landscape-Modus: Ideal für Content-Browsing
- Nutzen Sie Apple Pencil/Stylus zum Bearbeiten

#### 🖥️ Desktop (1200px+)

**Features:**
- Volle 280px Sidebar (permanent)
- Alle Labels sichtbar
- Kategorien expandierbar/kollapsierbar
- Breadcrumb-Navigation oben
- Maximale Funktionalität
- Dunkelmodus/Lightmodus

**Layout:**
```
┌──────────────────────────────────────┐
│ ☰ Title         🌙 👤             │
├─────┬──────────────────────────────────┤
│ 📊  │ Dashboard > Schema Management   │
│ EX  │ ─────────────────────────────   │
│ ┌───┤                                 │
│ └─► │  MAIN CONTENT                  │
│     │  (Optimiert für Arbeit)        │
│ 📄  │                                 │
│ DO  │                                 │
│ ...  │                                 │
├─────┴──────────────────────────────────┤
│ Full: 280px │ Main: Flexible │ Breadcrumb
└──────────────────────────────────────┘
```

**Tipps für Desktop-Nutzer:**
- Nutzen Sie Tastaturkürzel (Cmd+K, Cmd+J, etc.)
- Dragging & Dropping von Dateien funktioniert
- Maximale Effizienz durch permanentes Menü
- Breadcrumb hilft bei Navigation

### Dark Mode / Light Mode

**Aktivieren:**
- Klick auf 🌙 oder ☀️ Icon oben rechts
- App speichert Ihre Vorliebe automatisch
- Die Einstellung wird im Browser-Storage gespeichert

**Wann Dark Mode hilfreich:**
- Weniger Augenbelastung bei längerer Arbeit (Nacht)
- Hellere Displays können gedimmt werden
- Besserer Kontrast für manche User
- Batterie spart Strom auf OLED-Displays

---

## Troubleshooting

### Häufige Probleme & Lösungen

#### Problem 1: App lädt nicht / zeigt weiße Seite

**Symptome:**
- Nur weiße Seite nach Öffnen von localhost:5173
- Console zeigt keine Fehler

**Lösungen:**
```
1. Cache löschen:
   - Drücken Sie Ctrl+Shift+R (oder Cmd+Shift+R auf Mac)
   - Oder: F12 → DevTools → Application → Clear Storage

2. Browser neu starten:
   - Alle Tabs schließen
   - Browser komplett beenden
   - Öffnen Sie die App erneut

3. Backend prüfen:
   - Öffnen Sie http://localhost:3000/api/health
   - Sollte {"status":"ok"} zeigen
   - Wenn nicht: Backend ist down, siehe "Backend startet nicht"

4. Port-Konflikt:
   - Ist Port 5173 schon belegt?
   - Terminal: netstat -ano | findstr :5173 (Windows)
   - Oder: lsof -i :5173 (Mac/Linux)
   - Prozess beenden oder Port ändern
```

#### Problem 2: Job schlägt fehl mit "Schema not found"

**Symptom:** Job-Status zeigt: "❌ Error: Schema 'Rechnungen' not found"

**Lösungen:**
```
1. Schema existiert nicht:
   - Gehen Sie zu "Schema Management"
   - Überprüfen Sie: Ist das Schema wirklich erstellt?
   - Falls nicht: Erstellen Sie das Schema neu

2. Falcher Schema-Name:
   - Job Manager: Welches Schema wurde ausgewählt?
   - Schema Management: Welcher Name ist dort?
   - Namen müssen EXAKT matchen (Groß-/Kleinschreibung!)
   - Löschen Sie Leerzeichen am Anfang/Ende

3. Datenbank-Synchronisationsfehler:
   - Gehen Sie zu "Configuration"
   - Klick "Sync Schemas" oder Datenbank-Refresh
   - Warten Sie 30 Sekunden
   - Job erneut versuchen

4. Im schlimmsten Fall: Backend neustarten
   - Öffnen Sie Terminal
   - npm run backend:restart
   - Warten Sie auf "✅ Backend ready"
```

#### Problem 3: Dokument-Upload funktioniert nicht

**Symptom:** Upload-Button grau oder funktioniert nicht / "File too large"

**Lösungen:**
```
1. Datei zu groß:
   - Max. Dateigröße: 50 MB (meist konfigurierbar)
   - Prüfen Sie: Ist Ihr Dokument < 50 MB?
   - Falls > 50 MB: Datei komprimieren oder in mehrere Jobs aufteilen

2. Falscher Dateityp:
   - Unterstützte Typen: PDF, PNG, JPG, TIFF, DOCX
   - Sie probieren: .doc (veraltet), .bmp (unkomprimiert)?
   - Umwandlung: Online-Tools oder ImageMagick verwenden

3. Browser-Problem:
   - Funktioniert Upload in anderem Browser?
   - Ja → Ihr Standard-Browser hat Problem (Cache, Extension)
   - Nein → Backend-Problem oder Datei-Permission

4. Backend-Speicherplatz voll:
   - Gehen Sie zu "Configuration"
   - Prüfen Sie: "Storage Usage" unter 90%?
   - Falls über 90%: Alte Dokumente löschen oder Speicher erweitern
```

#### Problem 4: Extraktion hat falsche Ergebnisse

**Symptom:** Extrahierte Daten sind falsch oder leer

**Lösungen:**
```
1. Falsches Schema:
   - Ist das Richtige Schema ausgewählt?
   - Schema-Felder passen zum Dokument?
   - Z.B. "Rechnung"-Schema für Lieferschein ist falsch

2. Regeln nicht aktiv:
   - Gehen Sie zu "Rule Editor"
   - Prüfen Sie: Alle Regeln "Active" (grüner Haken)?
   - Falls nicht: Aktivieren Sie die Regeln

3. Schlechte Dokumentqualität:
   - Ist das PDF gescannt oder digital?
   - Gescannte PDFs: OCR wird verwendet (weniger genau)
   - Digitale PDFs: Text wird direkt extrahiert (genauer)
   - Lösungen: Besseres Scan oder anderes Original-Dokument

4. Regeln sind zu restriktiv:
   - Gehen Sie zur Extraction Workbench
   - Laden Sie das Problem-Dokument
   - Edieren Sie die Regeln "on the fly"
   - Testen Sie die neue Regel
   - Speichern Sie die korrigierte Regel

5. Machine Learning trainieren:
   - Gehen Sie zu "Learning Center"
   - System lernt aus Ihren Korrektionen
   - Nach ~50 manuellen Korrektionen: ML trainiert automatisch
   - Genauigkeit verbessert sich über Zeit
```

#### Problem 5: Audit Trail zeigt falsche Einträge

**Symptom:** Audit Trail fehlen Einträge oder zeigen falsches "Wer"

**Lösungen:**
```
1. Audit ist deaktiviert:
   - Gehen Sie zu "Configuration"
   - Prüfen Sie: "Enable Audit Trail" = ON
   - Falls OFF: Aktivieren Sie es

2. Falscher Benutzer angezeigt:
   - Audit Trail zeigt: "wer die Action gemacht hat"
   - Falls "System" angezeigt: Job wurde automatisch/im Background gestartet
   - Falls "Anonymous": Benutzer war nicht angemeldet → Backend-Fehler

3. Audit Logs zu alt / gelöscht:
   - Audit Logs werden nach ~90 Tagen gelöscht (Standard)
   - Falls Sie ältere Logs brauchen: Configuration → Retention ändern
   - Oder: Backups verwenden (alte Daten sind dort archiviert)
```

#### Problem 6: Performance / App ist langsam

**Symptom:** App reagiert langsam, Jobs dauern lange

**Lösungen:**
```
SCHNELLE FIXES:
1. Browser-Tab aktualisieren: F5 oder Cmd+R
2. Browser-Cache löschen: Ctrl+Shift+Delete
3. Browser neustarten: Vollständig schließen & neu öffnen

MITTELFRISTIGE FIXES:
1. Datenbank-Indizes erstellen:
   - Terminal: npm run db:optimize
   - Das dauert 5-10 Minuten
   - Aber: Zukünftige Queries sind schneller

2. Alte Dokumente archivieren:
   - Documents-Seite: Filter "Older than 1 year"
   - Alle auswählen & archivieren
   - Datenbank wird kleiner = schneller

3. Backend-Neustarten (Cache clearen):
   - Terminal: npm run dev (im Backend-Verzeichnis)
   - Oder im Taskmanager Node-Prozess beenden und erneut starten
```

---

## 10. System-Checks & Wartung

### Überblick

Ein **System-Check** ist eine automatisierte Überprüfung aller Systemkomponenten, um sicherzustellen, dass die Anwendung korrekt funktioniert.

### Wann sollte man einen Check durchführen?

✅ **Nach Versions-Update** - Wenn die Version erhöht wurde (0.37.0 → 0.37.0)  
✅ **Nach Schema-Änderungen** - Wenn neue Schemas hochgeladen wurden  
✅ **Nach Backup-Restore** - Nach dem Wiederherstellen eines Backups  
✅ **Nach Konfigurationsänderungen** - Nach wichtigen Einstellungsänderungen  
✅ **Nach Restart** - Um zu überprüfen, dass alle Daten persistent sind  
✅ **Wenn Fehler auftreten** - Zur Diagnose von Problemen  

### Detaillierter Guide

**📖 Vollständige Dokumentation:** [COMPREHENSIVE_CHECK_GUIDE.md](COMPREHENSIVE_CHECK_GUIDE.md)

Der umfassende Check-Guide dokumentiert:
- **7 Checkpunkte** - Service-Health, APIs, Frontend, Database, Performance, etc.
- **Schema-Persistenz Test** - Überprüft, dass Schemas nach Restart verfügbar bleiben
- **Fehlerbehandlung** - Lösungen für häufige Check-Fehler
- **Automatisierte vs. Manuelle Checks** - Je nach Anforderung

### Schnell-Check (2 Minuten)

```powershell
# 1. Backend läuft?
curl http://localhost:3000/health

# 2. Frontend erreichbar?
curl http://localhost:5173

# 3. API antwortet?
curl http://localhost:3000/api/config

# 4. Schemas vorhanden?
curl http://localhost:3000/api/schema/list

# Ergebnis: Alle sollten "200 OK" zurückgeben
```

### Schema-Persistenz Überprüfung (Wichtig!)

**Phase 26 Issue:** "Schemas sind nach Restart nicht sichtbar"

**Test:**
```
1. http://localhost:5173/schema öffnen
2. Anzahl der Schemas notieren (z.B. 5)
3. App Restart: Backend & Frontend neu starten
4. Schemas-Seite neu laden
5. ✅ PASS: Gleiche Anzahl Schemas sichtbar
6. ❌ FAIL: Weniger oder keine Schemas sichtbar
```

**Falls FAIL - Debugging:**
```bash
# Prüfe PostgreSQL direkt:
psql -U postgres -d extractor_db
SELECT COUNT(*) FROM schemas;

# Falls 0: Schemas sind nicht in DB
# Falls > 0: Problem ist im Frontend/API-Abfrage
```

### Versionierungsprozess

**Was passiert bei 0.37.0 → 0.37.0?**

1. **Version-Bumping**: package.json, App.tsx, etc. aktualisieren
2. **Compilation**: `npm run build` durchführen
3. **Testing**: System-Tests laufen
4. **Documentation**: RELEASE_NOTES.md, MANUAL.md erstellen
5. **Archivierung**: Alte Phase-Dateien in archive/ verschieben
6. **Git Commit**: `git commit -m "Phase 26: ..."`
7. **Git Tag**: `git tag 0.37.0`
8. **Git Push**: `git push origin master --tags`

**Dokumentation dazu:** [COMPREHENSIVE_CHECK_GUIDE.md#versionierungsprozess](COMPREHENSIVE_CHECK_GUIDE.md#versionierungsprozess)

### Best Practices für Wartung

- 🔄 **Regelmäßige Backups**: Mindestens täglich
- 📊 **Performance-Monitoring**: Jede Woche prüfen
- 🔍 **Audit-Logs überprüfen**: Auf verdächtige Aktivitäten prüfen
- 📦 **Datenbank-Optimierung**: Monatlich `npm run db:optimize`
- 🔐 **Security-Updates**: Sobald verfügbar installieren

---
   - Terminal: npm run backend:restart
   - Warten Sie bis "✅ Backend ready"

LANGFRISTIGE FIXES:
1. Database migrieren:
   - Aktuelle DB zu schnellerem Hardware
   - Oder: ReadReplica für Lesezugriffe

2. Caching aktivieren:
   - Configuration → Advanced → Enable Caching
   - Cache TTL: 5 Minuten (für häufig gelesene Daten)

DIAGNOSE:
- F12 → Network Tab → Welche Requests sind langsam? (> 2s)
- F12 → Performance Tab → Record & analyze
- Backend Logs prüfen: /logs → "Performance" Filter
```

### Support Kontakt

Wenn nichts hilft:

**Online Support:**
- Email: support@audit-safe.de
- Ticket-System: https://support.audit-safe.de
- Community Forum: https://forum.audit-safe.de

**Debug-Info sammeln:**
```
1. Öffnen Sie DevTools (F12)
2. Console Tab: Alle Fehler kopieren (rot angezeigt)
3. Network Tab: Screenshot von langsamen Requests
4. Application Tab: Browser Info
5. Browser-Konsole-Output: Rechtsklick → Save as...
6. Alles in ein Ticket packen + Beschreibung
```

---

## Best Practices

### Allgemeine Tipps & Tricks

#### 🎯 Effiziente Nutzung

1. **Tastaturkürzel nutzen**
   - Cmd+K / Ctrl+K: Kommandopalette (Schnellsuche)
   - Cmd+J / Ctrl+J: Zu Job Manager
   - Cmd+S / Ctrl+S: Zu Schema Management
   - Spart Zeit bei häufigem Wechsel

2. **Batch-Processing verwenden**
   - Jobs mit 100+ Dokumenten sind effizienter
   - Bessere Ressourcennutzung
   - Parallelverarbeitung möglich
   - Pro Job: Overhead gibt es nur einmal

3. **Regeln regelmäßig überprüfen**
   - Monthly Review: Welche Regeln werden verwendet?
   - Welche sind obsolet?
   - Löschen Sie veraltete Regeln
   - System bleibt schnell & übersichtlich

4. **Schemas versionieren**
   - Nicht alte Schemas löschen!
   - Stattdessen: Version History nutzen
   - Alte Jobs müssen auch alter Schemas funktionieren
   - Neue Jobs: auf neue Schema-Version wechseln

5. **Dokumentation im Learning Center lesen**
   - Für jedes Feature gibt es Tutorials
   - FAQ beantwortet 90% der Fragen
   - Best Practices für Ihren Use Case

#### 🔒 Sicherheit & Datenschutz

1. **Daten-Klassifizierung**
   - Markieren Sie vertrauliche Dokumente
   - Beschränkten Sie Zugriff in Configuration
   - Audit Trail ist unveränderbar (Compliance)

2. **Backups regelmäßig testen**
   - Wöchentlich: Ein Backup-Restore durchführen
   - Überprüfen Sie: Sind alle Daten vorhanden?
   - Dokumentieren Sie: Restore dauert X Minuten

3. **Passwort-Richtlinie**
   - Mindestens 12 Zeichen
   - Groß-, Kleinbuchstaben, Zahlen, Sonderzeichen
   - Passwort nicht mit anderen teilen
   - 2-Faktor-Authentifizierung aktivieren

4. **Access Control**
   - Geben Sie Benutzer nur Zugriff, den sie brauchen
   - "Least Privilege" Prinzip
   - Review Berechtigungen monatlich
   - Deaktivieren Sie inaktive Benutzer

#### 📊 Datenqualität

1. **Regelmäßige Qualitätsprüfung**
   - Monatlich 5-10 Jobs stichprobenartig prüfen
   - Fehlerquote > 5%? → Regeln überarbeiten
   - Trend nachverfolgen (verbessert sich Quality über Zeit?)

2. **Fehler dokumentieren**
   - Wenn Sie einen Fehler finden:
   - Speichern Sie das Original-Dokument
   - Notieren Sie: Was war falsch?
   - Geben Sie an: Welche Regel muss angepasst werden?
   - Das hilft Team, Fehler zu identifizieren

3. **Machine Learning nutzen**
   - Nach ~50 Korrektionen: System lernt automatisch
   - Fehlerquote sinkt über Zeit (wenn Sie konsistent korrigieren)
   - Regelmäßig ML-Modell neu trainieren
   - Best Practice: Monatliches Retraining

4. **Schlechte Dokumente aussortieren**
   - Manchmal ist Quelle schlecht (zu dunkel, handschriftlich)
   - Diese Dokumente manuell bearbeiten oder ablehnen
   - Nicht versuchen, 100% Automatisierung zu erreichen
   - "Good enough" ist oft besser als "Perfect but slow"

#### 📈 Skalierung & Performance

1. **Wenn Sie wachsen...**
   - Aktuell: < 100 Jobs/Tag → 1 Server reicht
   - Bei 100-500 Jobs/Tag → Skalieren Sie zu 2 Backend-Server
   - Bei > 500 Jobs/Tag → Full Kubernetes Cluster

2. **Database Optimization**
   - Monatlich: npm run db:optimize
   - Indices werden neu erstellt
   - Alte Query-Cache wird geleert
   - Resultat: 30-50% schneller

3. **Archivierung**
   - Dokumente älter 1 Jahr: In Cold Storage archivieren
   - Spart Hauptspeicher (ist teuer)
   - Archivierte Dokumente sind noch zugänglich (nur langsamer)
   - Best Practice: Monatliche Archivierung durchführen

---

## Checklisten & Verfahren

### Daily Checklist (Täglich durchführen)

```
☐ App öffnen - Dashboard anschauen
☐ Fehlerquote prüfen (sollte < 2% sein)
☐ Unverarbeitete Jobs anschauen
☐ Manuelle Korrektionen durchführen (Extraction Workbench)
☐ Audit Trail prüfen (unerwartete Aktivitäten?)
☐ Bei Feierabend: Eine Backup durchführen
```

### Weekly Checklist (Wöchentlich durchführen)

```
☐ Alle Jobs der Woche überprüfen
☐ Fehlerquote und Trends analysieren
☐ Regeln überarbeiten (wenn nötig)
☐ Performance prüfen (Logs anschauen)
☐ Audit Trail Export für Compliance
☐ Speicherplatz prüfen (noch Platz vorhanden?)
☐ Ältere Logs archivieren
```

### Monthly Checklist (Monatlich durchführen)

```
☐ Datenbank-Optimierung durchführen (npm run db:optimize)
☐ Backup-Restore Test durchführen
☐ Security Audit (Configuration prüfen)
☐ Performance Report generieren
☐ Schemas überprüfen & outdated löschen
☐ ML-Modell neu trainieren
☐ Benutzer & Berechtigungen überprüfen
☐ Storage-Nutzung überprüfen (Archivierung?)
```

### Quarterly Checklist (Quartalsweise)

```
☐ Compliance-Review (Audit Trail vollständig?)
☐ Disaster-Recovery Test durchführen
☐ Sicherheitsupdate durchführen
☐ Version-Update Planung
☐ Budget-Review (Speicher, Lizenzen)
☐ Team-Schulung (neue Features?)
```

---

## Zusammenfassung

Die **Audit-Safe Document Extractor** ist ein mächtiges Tool zur Automatisierung von Dokumentenverarbeitung. Mit den richtigen Workflows sparen Sie Stunden an manueller Arbeit ein.

### Key Takeaways

✅ **Automatisierung:** 70-90% der Dokumentenverarbeitung kann automatisiert werden  
✅ **Responsiv:** Funktioniert auf allen Geräten (Mobile, Tablet, Desktop)  
✅ **Sicher:** Vollständiger Audit Trail für Compliance  
✅ **Skalierbar:** Von 10 bis 10.000 Dokumenten pro Tag  
✅ **Benutzerfreundlich:** Intuitive Navigation und Bedienung  

### Nächste Schritte

1. **Erkunden:** Nehmen Sie sich Zeit, die App zu erkunden
2. **Experimentieren:** Laden Sie Test-Dokumente hoch
3. **Schema erstellen:** Definieren Sie Ihr erstes Schema
4. **Regeln testen:** Erstellen Sie Regeln für Ihren Use Case
5. **Batch verarbeiten:** Starten Sie Ihren ersten Job
6. **Optimieren:** Passen Sie Regeln an Fehler an

---

**📞 Fragen?** Siehe Help Center oder kontaktieren Sie Support.

**Version:** 0.37.0 | Letzte Aktualisierung: 2026-07-11 | Status: Produktionsreif ✅
