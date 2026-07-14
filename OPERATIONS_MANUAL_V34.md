# 📖 Operationshandbuch - Betriebshandbuch
## Audit-Safe Document Extractor v0.34.0

**Version:** 0.34.0  
**Phase:** 34 (Service Consolidation & Navigation Optimization)  
**Datum:** 2026-07-14  
**Status:** Produktionsreif  

---

## 📋 Inhaltsverzeichnis

1. [Was ist die Audit-Safe App?](#was-ist-die-audit-safe-app)
2. [Systemanforderungen](#systemanforderungen)
3. [Installation & Start](#installation--start)
4. [Navigationsstruktur (v0.34.0)](#navigationsstruktur-v0340)
5. [Menüpunkte - Detaillierte Beschreibung](#menüpunkte---detaillierte-beschreibung)
6. [Arbeitsabläufe nach Anwendungsfall](#arbeitsabläufe-nach-anwendungsfall)
7. [Responsive Design (Mobile, Tablet, Desktop)](#responsive-design-mobile-tablet-desktop)
8. [Services & System Management](#services--system-management)
9. [Troubleshooting](#troubleshooting)
10. [System-Checks & Wartung](#system-checks--wartung)
11. [Best Practices](#best-practices)
12. [New in v0.34.0](#new-in-v0340)

---

## Was ist die Audit-Safe App?

### Zweck und Nutzen

Die **Audit-Safe Document Extractor** ist eine spezialisierte Webanwendung zur intelligenten Verarbeitung und Kategorisierung von geschäftlichen Dokumenten (Rechnungen, Belege, Verträge, etc.). Die App automatisiert die Extraktion von Kernpetdaten aus Dokumenten unter Verwendung von:

- **Intelligenter OCR-Technologie** - Erkennung von Text in gescannten Dokumenten
- **Schemabasierte Regeln** - Automatische Kategorisierung nach konfigurierbaren Mustern  
- **Job-Management** - Batch-Verarbeitung mehrerer Dokumente gleichzeitig
- **Audit-Trail** - Vollständige Protokollierung aller Aktionen für Compliance
- **Flexible Regeln-Engine** - Benutzerdefinierte Regeln zum Extrahieren von Informationen
- **Service Management** - Zentralisierte Verwaltung von System-Services

### Zielgruppe

- 📊 **Bookkeeper & Accountants** - Dokumentenverarbeitung für Finanzbuchhaltung
- 🏢 **Unternehmen** - Batch-Verarbeitung von eingehenden Dokumenten
- 🔍 **Revisoren** - Audit-Trail und Compliance-Anforderungen
- ⚙️ **IT-Administratoren** - Systemkonfiguration, Services-Management und -wartung

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
- **Backend:** Node.js 20+ mit Express.js
- **Database:** PostgreSQL 15
- **Cache:** Redis 7+
- **Docker:** Optional für containerisierte Deployments

---

## Installation & Start

### Schnellstart mit Docker

```bash
# 1. Repository klonen
git clone https://github.com/your-org/audit-safe.git
cd audit-safe

# 2. Environment konfigurieren
cp .env.example .env
# Bearbeiten Sie .env mit Ihrer Konfiguration

# 3. Docker-Container starten
docker-compose up -d

# 4. App öffnen
# Frontend: http://localhost:5173 oder http://localhost
# Backend API: http://localhost:3000/api
# PgAdmin (optional): http://localhost:5050
```

### Manual Installation

```bash
# Backend
cd backend
npm install
npm run build
npm run dev

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev
```

---

## Navigationsstruktur (v0.34.0)

### Vereinfachte Navigation (7 Kategorien)

**NEU in v0.34.0:** Services-Kategorie fasst Health, API, Backup und Settings zusammen.

```
┌──────────────────────────────────┐
│  📊 DASHBOARD                    │ ← Home
├──────────────────────────────────┤
│  📋 SCHEMAS                      │ ← Schemas, Create Schema
├──────────────────────────────────┤
│  💼 JOBS                         │ ← Job Monitoring
├──────────────────────────────────┤
│  ⚙️  RULES                       │ ← Rules Editor
├──────────────────────────────────┤
│  📝 LOGS                         │ ← Activity Logs
├──────────────────────────────────┤
│  🔧 SERVICES ⭐ NEW             │ ← Health, API, Backup, Settings
│      ├─ Health Status            │
│      ├─ API Documentation        │
│      ├─ Backups                  │
│      └─ Configuration            │
├──────────────────────────────────┤
│  ❓ HELP                         │ ← Help Center & Docs
└──────────────────────────────────┘
```

### Navigation Items

| Kategorie | Item | Path | Beschreibung |
|-----------|------|------|-------------|
| **Dashboard** | Home | `/` | System-Übersicht & Statistiken |
| **Schemas** | Schemas | `/schemas` | Schema-Verwaltung |
| | Create Schema | `/schemas/create` | Neues Schema erstellen |
| **Jobs** | Jobs | `/jobs` | Job-Monitoring & Historie |
| **Rules** | Rules | `/rules` | Regeln-Editor & Verwaltung |
| **Logs** | Logs | `/logs` | System Activity Logs |
| **Services** | Health | `/health` | System Health Status ⭐ |
| | API Docs | `/api/docs` | API Discovery & Docs ⭐ |
| | Backups | `/backup` | Backup & Restore ⭐ |
| | Settings | `/settings` | Konfiguration ⭐ |
| **Help** | Help Center | `/help` | Dokumentation & Guides |

---

## Menüpunkte - Detaillierte Beschreibung

### 1. Dashboard (📊)
**Ziel:** System-Übersicht und aktuelle Statistiken  
**Zugang:** Klick auf "Home" oder Logo  
**Zeigt an:**
- Gesamtzahl Schemas
- Laufende Jobs
- Letzten Extraktion-Erfolge
- System Health Status (DB, Redis, etc.)
- Versionsinfo (Frontend/Backend)
- Backup-Status

### 2. Schemas (📋)
**Ziel:** Verwaltung von Extraktions-Schemas  
**Zugang:** "Schemas" im Menü  
**Funktionen:**
- Schema-Liste anzeigen
- Neues Schema erstellen
- Schema editieren/löschen
- Schema-Versionshistorie
- Test-Daten laden

### 3. Jobs (💼)
**Ziel:** Batch-Job-Monitoring  
**Zugang:** "Jobs" im Menü  
**Zeigt:**
- Aktive Jobs
- Job-Status (Running, Completed, Failed)
- Erfolgsquote pro Job
- Job-Logs & Details

### 4. Rules (⚙️)
**Ziel:** Extraktions-Regeln konfigurieren  
**Zugang:** "Rules" im Menü  
**Funktionen:**
- Regeln-Editor
- Machine Learning Training
- Regel-Versionshistorie
- Best Practices & Templates

### 5. Logs (📝)
**Ziel:** System Activity Logging & Audit Trail  
**Zugang:** "Logs" im Menü  
**Features:**
- Erweiterte Log-Filterung
- Real-time Log-Streaming
- Export zu CSV
- Log-Retention Policies

### 6. Services (🔧) - **NEU in v0.34.0**

Services konsolidiert vier wichtige System-Management-Punkte:

#### 6a. Health Status (/health)
- System Health Check
- Datenbank-Status
- Redis Cache Status
- API Response Times
- Service Uptime

#### 6b. API Documentation (/api/docs)
- OpenAPI/Swagger Docs
- Endpoint-Discovery
- API-Schema Explorer
- Example Requests

#### 6c. Backups Management (/backup)
- Backup-Liste
- Backup erstellen
- Restore Point auswählen
- Backup Schedule konfigurieren

#### 6d. Settings (/settings)
- System-Konfiguration
- Feature Flags
- Authentifizierung
- Fehlerbehandlung

### 7. Help (❓)
**Ziel:** Dokumentation & Guides  
**Zugang:** "Help Center" im Menü  
**Inhalte:**
- Glossar (31 Begriffe)
- Dokumentation (31 Artikel)
- Manuelle (7 Kapitel)
- Release Notes
- Volltext-Suche

---

## Arbeitsabläufe nach Anwendungsfall

### Use Case 1: Rechnungen automatisch verarbeiten

**Szenario:** Sie haben 500 Rechnungen (PDF), die Sie alle an einem Tag verarbeiten möchten.

**Schritt-für-Schritt:**

```
PHASE 1: SCHEMA VORBEREITEN
  1. Dashboard → Schemas
  2. Bestehendes "Invoice" Schema prüfen
     oder neues Schema erstellen
  3. Schema testen mit 2-3 Beispiel-Rechnungen

PHASE 2: BATCH-IMPORT
  1. Schemas → "Batch Upload"
  2. Alle 500 PDFs hochladen
  3. "Invoice" Schema auswählen
  4. Batch-Verarbeitung starten

PHASE 3: MONITORING
  1. Jobs → aktive Job anschauen
  2. Fortschritt überwachen (z.B. 350/500)
  3. Bei Fehler: Rules anpassen oder Schema verbessern

PHASE 4: ERGEBNISSE EXPORT
  1. Wenn Job fertig → "Export" klicken
  2. CSV oder JSON Format wählen
  3. Datei herunterladen oder in Accounting-System pushen
```

### Use Case 2: Neue Rule trainieren

**Szenario:** Sie möchten ein Pattern für "Kundennummer" erkennen.

**Workflow:**
1. Rules → "Create Rule"
2. Name: "Kundennummer Extraktion"
3. Pattern definieren (Regex oder ML)
4. Test-Dokumente hochladen
5. Training starten
6. Accuracy checken
7. Bei >95% Genauigkeit: in Production nehmen

### Use Case 3: System Health prüfen

**Scenario:** Der Admin möchte täglich die System-Gesundheit überprüfen.

**Workflow:**
1. Services → "Health Status"
2. Alle grünen Checkmarks sollen sichtbar sein:
   - ✅ Backend API (3000)
   - ✅ Database (PostgreSQL)
   - ✅ Cache (Redis)
   - ✅ File Storage
3. Bei Problemen: Logs ansehen

---

## Responsive Design (Mobile, Tablet, Desktop)

### Desktop (1280px+)
- Vollständige Sidebar (280px breit)
- Alle Icons + Labels sichtbar
- 3-spaltige Layouts für Tabellen

### Tablet (768px - 1279px)
- Kompakte Sidebar (80px, Icons nur)
- Hamburger Menu bei Bedarf
- Bottom Navigation für häufig genutzte Items

### Mobile (< 768px)
- Vollständiger Hamburger Menu
- Drawer pusht Content zur Seite
- Single-Column Layouts
- Touch-optimierte Buttons (48px+)

---

## Services & System Management

### Health Check (/health)

```bash
GET /api/health/build
Response: {
  "version": "0.34.0",
  "frontendVersion": "0.34.0",
  "backendVersion": "0.34.0",
  "versionMatch": true,
  "timestamp": "2026-07-14T07:06:21.443Z"
}

GET /api/health/database
Response: {
  "database": "connected",
  "poolSize": 10,
  "connections": 3
}

GET /api/health/redis
Response: {
  "redis": "connected",
  "memory": "12MB",
  "commands": 45000
}
```

### API Discovery (/api/docs)

Die API-Dokumentation ist automatisch generiert und zeigt:
- Alle verfügbaren Endpoints
- Parameter & Response Schemas
- Example Requests/Responses
- Rate Limiting Info

**Zugang:**
- Frontend: Services → API Docs
- Direkt: http://localhost:3000/api/docs

### Backup Management (/backup)

**Backup erstellen:**
1. Services → Backups
2. "Create Backup" klicken
3. Optional: Beschreibung eingeben
4. Starten

**Restore:**
1. Backup aus Liste auswählen
2. "Restore" klicken
3. Bestätigen (⚠️ Warnung!)

### Configuration (/settings)

**Wichtige Settings:**
- Log Level (DEBUG, INFO, WARN, ERROR)
- Max File Size für Upload
- Job Timeout (Minuten)
- Cache TTL (Sekunden)
- Retention Policy

---

## Troubleshooting

### Problem: "Frontend Version mismatch" Warning

**Ursachen:**
- Docker environment variable `FRONTEND_VERSION` falsch
- Frontend/Backend nicht synchron deployed

**Lösung:**
```bash
# docker-compose.yml prüfen:
environment:
  FRONTEND_VERSION: 0.34.0  # ← sollte Backend-Version sein

# Dann:
docker-compose build --no-cache frontend
docker-compose up -d
```

### Problem: Help Seite nicht erreichbar

**Ursache:** Alte Navigation, Help nicht integriert

**Lösung (v0.34.0+):**
- Help sollte im Menü unter "Help" Category sichtbar sein
- Prüfen: Services → Health → Frontend Version

### Problem: Services nicht verfügbar

**Ursachen:**
- PostgreSQL nicht erreichbar
- Redis crashed
- Backend neu gestartet

**Lösung:**
```bash
# Status prüfen:
docker-compose ps

# Services neu starten:
docker-compose restart postgres redis

# Logs ansehen:
docker-compose logs -f backend
```

### Problem: Jobs timeout nach 30 Sekunden

**Ursache:** Große Batch-Verarbeitung, default Timeout zu niedrig

**Lösung:**
Settings → Job Timeout erhöhen auf 300 (5 Min)

---

## System-Checks & Wartung

### Tägliche Checks (Morgens)

```bash
✅ Services Status
   docker-compose ps | grep -E "healthy|up"

✅ Disk Space
   df -h | grep extractor

✅ Log Size
   du -sh ./logs

✅ Database Connections
   GET /api/health/database
```

### Wöchentliche Checks

```bash
✅ Backup Test
   Services → Backups → Test Restore

✅ Log Cleanup
   docker-compose exec backend rm -rf logs/*

✅ Cache Optimization
   GET /api/health/redis → memory usage

✅ API Performance
   Services → API Docs → Test Endpoints
```

### Monatliche Checks

```bash
✅ Database Maintenance
   docker-compose exec postgres vacuum analyze

✅ Version Updates
   Check GitHub Releases

✅ Security Audit
   Review OPERATIONS_MANUAL.md changes

✅ Capacity Planning
   Storage growth analysis
```

---

## Best Practices

### Sicherheit
- ✅ HTTPS in Production verwenden
- ✅ Regelmäßig Backups durchführen
- ✅ API Rate Limiting aktivieren
- ✅ Audit Logs regelmäßig überprüfen

### Performance
- ✅ Redis Cache nutzen (TTL: 600s default)
- ✅ Batch-Größe optimieren (max 100 Dokumente)
- ✅ Job Parallelization aktivieren
- ✅ Unnötige Logs deaktivieren (PROD: INFO level)

### Operations
- ✅ Regelmäßige Monitoring-Reports erstellen
- ✅ Alerts für Fehlerrate >5% konfigurieren
- ✅ Docker Logs rotieren (logrotate)
- ✅ Health Checks alle 5 Min durchführen

---

## New in v0.34.0

### 🎯 Services Consolidation
- Health, API, Backup, Settings unter einer "Services" Kategorie
- Bessere Navigation für System Admins
- Klarer definierte Rollen & Zuständigkeiten

### 🆕 Help Center Enhancement
- 31 Glossar-Einträge
- 31 Dokumentations-Artikel
- 7 Manual-Kapitel
- Full-text Search
- Dark Mode Support

### 🔧 Navigation Simplification
- Reduziert von 10 auf 7 Top-Level Categories
- Bessere Responsive Mobile Experience
- Improved Accessibility (WCAG 2.1)

### 📊 Version Management
- Frontend/Backend Version Sync validiert
- Auto-Detection von Mismatches
- Clear Error Messages

### 🐳 Docker Improvements
- Multi-stage Builds (schneller)
- Health Checks auf allen Services
- Environment Variable Validation

---

## Kontakt & Support

**Bei Fragen oder Problemen:**
- 📖 Dokumentation: `/help` im App
- 🐛 Bug Reports: GitHub Issues
- 💬 Support: support@audit-safe.local
- 📧 Email: ops-team@audit-safe.local

---

**Letzte Aktualisierung:** 2026-07-14  
**Version:** 0.34.0  
**Phase:** 34 (Service Consolidation)
