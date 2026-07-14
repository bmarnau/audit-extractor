# 📖 Operationshandbuch - Betriebshandbuch
## Audit-Safe Document Extractor v0.35.0

**Version:** 0.35.0  
**Phase:** 37a (Navigation Test Infrastructure Refinement)  
**Datum:** 2026-07-14  
**Status:** Produktionsreif mit verbesserter Test-Zuverlässigkeit  

---

## 📋 Inhaltsverzeichnis

1. [Was ist die Audit-Safe App?](#was-ist-die-audit-safe-app)
2. [Neue Features in v0.35.0](#neue-features-in-v0350)
3. [Systemanforderungen](#systemanforderungen)
4. [Installation & Start](#installation--start)
5. [Navigationsstruktur (v0.35.0)](#navigationsstruktur-v0350)
6. [Menüpunkte - Detaillierte Beschreibung](#menüpunkte---detaillierte-beschreibung)
7. [Arbeitsabläufe nach Anwendungsfall](#arbeitsabläufe-nach-anwendungsfall)
8. [Responsive Design (Mobile, Tablet, Desktop)](#responsive-design-mobile-tablet-desktop)
9. [Services & System Management](#services--system-management)
10. [Troubleshooting](#troubleshooting)
11. [System-Checks & Wartung](#system-checks--wartung)
12. [Test-Infrastruktur (Phase 37a)](#test-infrastruktur-phase-37a)
13. [Best Practices](#best-practices)
14. [Migration von v0.34.0 zu v0.35.0](#migration-von-v0340-zu-v0350)

---

## Was ist die Audit-Safe App?

### Zweck und Nutzen

Die **Audit-Safe Document Extractor** ist eine spezialisierte Webanwendung zur intelligenten Verarbeitung und Kategorisierung von geschäftlichen Dokumenten (Rechnungen, Belege, Verträge, etc.). Die App automatisiert die Extraktion von Kerndaten aus Dokumenten unter Verwendung von:

- **Intelligenter OCR-Technologie** - Erkennung von Text in gescannten Dokumenten
- **Schemabasierte Regeln** - Automatische Kategorisierung nach konfigurierbaren Mustern  
- **Job-Management** - Batch-Verarbeitung mehrerer Dokumente gleichzeitig
- **Audit-Trail** - Vollständige Protokollierung aller Aktionen für Compliance
- **Flexible Regeln-Engine** - Benutzerdefinierte Regeln zum Extrahieren von Informationen
- **Service Management** - Zentralisierte Verwaltung von System-Services (NEU in v0.35.0)
- **Verbesserte Test-Zuverlässigkeit** - Data-testid Attribute für zuverlässiges E2E-Testing

### Zielgruppe

- 📊 **Bookkeeper & Accountants** - Dokumentenverarbeitung für Finanzbuchhaltung
- 🏢 **Unternehmen** - Batch-Verarbeitung von eingehenden Dokumenten
- 🔍 **Revisoren** - Audit-Trail und Compliance-Anforderungen
- ⚙️ **IT-Administratoren** - Systemkonfiguration, Services-Management und Wartung
- 🧪 **QA-Engineer** - Zuverlässiges E2E-Testing mit deterministischen Selektoren

---

## Neue Features in v0.35.0

### 🎯 Phase 37a: Navigation Test Infrastructure Refinement

#### 1. **Data-testid Attribute Implementation**
Navigation-Komponenten wurden mit `data-testid` Attributen aktualisiert für zuverlässiges E2E-Testing:

```typescript
// Navigation Kategorien - eindeutige Selektoren
[data-testid="nav-category-dashboard"]
[data-testid="nav-category-schemas"]
[data-testid="nav-category-jobs"]
[data-testid="nav-category-rules"]
[data-testid="nav-category-logs"]
[data-testid="nav-category-services"]
[data-testid="nav-category-help"]

// Services Sub-Items
[data-testid="nav-item-health-check"]
[data-testid="nav-item-api-docs"]
[data-testid="nav-item-backup-list"]
[data-testid="nav-item-settings-config"]
```

#### 2. **Verbesserte Test-Suite**
- Neue Datei: `tests/e2e/navigation-with-testid.test.ts`
- 15 comprehensive Tests
- **Pass Rate: 86.7%** (vorher 36.4%)
- Deterministic element targeting (keine flaky Tests mehr)

#### 3. **Test-Zuverlässigkeitsmetriken**
```
Test Execution Results (Phase 37a):
✅ PASSED:    13/15 Tests (86.7%)
❌ FAILED:    2/15 Tests (13.3% - Edge Cases)
⏱️  Duration:  ~44.6 Sekunden
📊 Improvement: +50.3% Pass Rate vs v0.34.0
```

---

## Systemanforderungen

### Minimale Hardware-Anforderungen
- **CPU:** 2 Cores (x86_64)
- **RAM:** 4 GB (8 GB empfohlen)
- **Festplatte:** 10 GB freier Speicher
- **Netzwerk:** 1 Mbps Upload/Download

### Software-Anforderungen
| Komponente | Version | Hinweise |
|-----------|---------|---------|
| Docker | 20.10+ | Mit docker-compose |
| Node.js | 20.x LTS | Im Container |
| PostgreSQL | 15 | Im Container |
| Redis | 7 | Im Container |
| Browser | Chrome/Edge (modern) | Für Frontend |

### Unterstützte Browser
- ✅ Chrome/Chromium v90+
- ✅ Firefox v88+
- ✅ Safari v14+
- ✅ Edge v90+

---

## Installation & Start

### Option 1: Docker Compose (Empfohlen)

```bash
# 1. Verzeichnis öffnen
cd c:\Users\bmarn\OneDrive\HTML\extractor

# 2. Services starten
docker-compose up -d

# 3. Überprüfen, dass alle Services laufen
docker-compose ps

# 4. Browser öffnen
# Frontend: http://localhost:5173
# API Docs: http://localhost:3000/api-docs
# pgAdmin: http://localhost:5050
```

### Option 2: Manuelle Installation

```bash
# Backend (Port 3000)
cd backend && npm install && npm start

# Frontend (Port 5173)
cd frontend && npm install && npm run dev

# PostgreSQL (Port 5432) + Redis (Port 6379)
# Manuell installieren oder über andere Tools
```

---

## Navigationsstruktur (v0.35.0)

### 7 Hauptkategorien (Flache Struktur für bessere UX)

```
┌─────────────────────────────────────────────────┐
│  Audit-Safe Document Extractor                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Dashboard         → System Übersicht        │
│  📋 Schemas           → Schema-Verwaltung       │
│  ⚙️ Jobs              → Job-Monitoring         │
│  🔧 Rules             → Extraktionsregeln      │
│  📝 Logs              → Activity Logs          │
│  ⚙️ Services ⭐       → System Services        │
│  ❓ Help              → Dokumentation          │
│                                                 │
└─────────────────────────────────────────────────┘

⭐ NEU in v0.35.0: Services-Kategorie konsolidiert
   - Health Check
   - API Dokumentation
   - Backup-Manager
   - Einstellungen
```

### Detaillierte Navigation

#### 1. **Dashboard** (`/`)
- System-Übersicht und Statistiken
- Schnell-Zugriff auf wichtige Funktionen
- Anzahl Schemas, Jobs, aktive Regeln

#### 2. **Schemas** (`/schemas`)
- Schema-Liste mit Such- und Filter-Funktionen
- Create Schema Button
- Schema-Details und -Versionshistorie
- Import/Export Funktionen

#### 3. **Jobs** (`/jobs`)
- Job-Verwaltung und -Monitoring
- Status: Pending, Running, Completed, Failed
- Batch-Verarbeitung von Dokumenten
- Job-Historie und -Details

#### 4. **Rules** (`/rules`)
- Extraktionsregeln-Editor
- Regex-Pattern Tester
- Regelsammlung nach Schema
- Test-Sandbox

#### 5. **Logs** (`/logs`)
- Activity Log mit Filterung
- Suchfunktion nach Benutzer/Aktion/Datum
- Audit Trail für Compliance
- Export zu CSV/JSON

#### 6. **Services ⭐ NEW** (`/services`)
Neue konsolidierte Kategorie mit 4 System-Services:

##### 6.1 Health Check (`/health`)
- System-Status Monitor
- Uptime-Statistiken
- Komponenten-Health
- Ressourcennutzung (CPU, RAM, Disk)

##### 6.2 API Dokumentation (`/api/docs`)
- OpenAPI/Swagger-Spezifikation
- Alle API-Endpoints dokumentiert
- Try-It-Out Funktionalität
- Authentifizierung und Autorisierung

##### 6.3 Backup Manager (`/backup`)
- Datenbank-Backups
- Snapshot-Verwaltung
- Restore-Funktionen
- Backup-Zeitplan konfigurieren

##### 6.4 Einstellungen (`/settings`)
- Systemkonfiguration
- Benachrichtigungseinstellungen
- Benutzerverwaltung
- Theme und Sprache

#### 7. **Help** (`/help`)
- Help Center mit 31 Dokumentation-Artikel
- Glossar mit 31 Begriffen
- FAQs
- Support-Links

---

## Menüpunkte - Detaillierte Beschreibung

### Dashboard
**Pfad:** `/`  
**Icon:** 📊 BarChart  
**Funktion:** Zentrale Übersicht

```
┌─ Dashboard
   ├─ Home (/)  → System Übersicht
   └─ [Statistiken, Quick-Actions]
```

### Schemas
**Pfad:** `/schemas`  
**Icon:** 📋 Schema  
**Funktion:** Schema-Management

```
┌─ Schemas
   ├─ Schemas (/schemas)          → Liste, Suche, Filter
   ├─ Create Schema (/schemas/create) → Neues Schema erstellen
   └─ [Schema-Editor, Versionierung]
```

### Jobs
**Pfad:** `/jobs`  
**Icon:** 🔨 Work  
**Funktion:** Job-Verwaltung

```
┌─ Jobs
   └─ Jobs (/jobs) → Monitoring, Historie, Details
```

### Rules
**Pfad:** `/rules`  
**Icon:** 🔧 Rule  
**Funktion:** Regel-Management

```
┌─ Rules
   ├─ Rules (/rules)         → Regel-Liste
   ├─ Editor                 → Regex-Editor
   └─ Test-Sandbox           → Rule Tester
```

### Logs
**Pfad:** `/logs`  
**Icon:** 📝 Description  
**Funktion:** Activity Logging

```
┌─ Logs
   └─ Logs (/logs) → Filter, Suche, Export
```

### Services ⭐ NEW
**Pfad:** `/services`  
**Icon:** ⚙️ Tune  
**Funktion:** System Services (Konsolidiert)

```
┌─ Services
   ├─ Health Check (/health)        → System-Status
   ├─ API Docs (/api/docs)          → OpenAPI/Swagger
   ├─ Backups (/backup)             → Backup-Manager
   └─ Settings (/settings)          → Konfiguration
```

**Neuerung v0.35.0:** Diese 4 Service-Menüpunkte wurden aus einer flachen Liste in eine Kategorie konsolidiert, um die Navigation zu vereinfachen (10 Items → 7 Kategorien).

### Help
**Pfad:** `/help`  
**Icon:** ❓ Help  
**Funktion:** Dokumentation und Support

```
┌─ Help
   └─ Help Center (/help)
       ├─ 31 Dokumentation-Artikel
       ├─ 31 Glossar-Begriffe
       └─ FAQs & Support-Links
```

---

## Arbeitsabläufe nach Anwendungsfall

### Szenario 1: Neue Rechnungen verarbeiten

```
1. Dashboard öffnen (/)
2. "Create Job" Button klicken
3. Dokumente hochladen (Rechnungen)
4. Schema auswählen (z.B. "Invoice-Template")
5. Regeln anwenden
6. Job starten
7. In "Jobs" Sektion Monitor anschauen
8. Ergebnisse exportieren
```

### Szenario 2: Neue Regel erstellen

```
1. Rules Sektion öffnen (/rules)
2. "New Rule" Button klicken
3. Regex-Pattern schreiben
4. Test-Sandbox benutzen zum Validieren
5. Rule speichern
6. Zu Schemas zuordnen
```

### Szenario 3: System-Health überprüfen

```
1. Services → Health Check öffnen (/health)
2. System-Status prüfen
3. CPU, RAM, Disk-Nutzung anschauen
4. Falls problematisch → Admin benachrichtigen
```

### Szenario 4: Backup erstellen

```
1. Services → Backups öffnen (/backup)
2. "Create Backup" Button klicken
3. Snapshot-Name eingeben
4. Backup starten
5. Status in Liste verfolgen
```

---

## Responsive Design (Mobile, Tablet, Desktop)

### Layout-Anpassungen nach Bildschirmgröße

#### Desktop (> 960px)
```
┌─────────────────────────────────────────┐
│ [Navigation 280px] │ [Content Area]     │
│                    │                     │
│ • Full Labels      │ Full UI             │
│ • Icons + Text     │ Desktop Layout      │
│ • Expanded Menu    │                     │
└─────────────────────────────────────────┘
```

#### Tablet (600-960px)
```
┌──────────────────────────────────┐
│[Nav 80px] │ [Content Area]       │
│           │                       │
│ • Icons   │ Optimiert für         │
│ • Compact │ Tablet-Größe          │
│ • Tooltip │                       │
└──────────────────────────────────┘
```

#### Mobile (< 600px)
```
┌──────────────────┐
│ [Hamburger Menu] │ [Content]
│                  │
│ • Drawer-Modus   │
│ • Fullscreen     │
│ • Touch-friendly │
└──────────────────┘
Menü: [≡] Tap zum öffnen
```

---

## Services & System Management

### Health Check Service

**Zweck:** Überwachung der System-Gesundheit  
**Zugriff:** Services → Health Check (`/health`)

```json
{
  "status": "healthy",
  "uptime": "48h 23m",
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "api": "healthy"
  },
  "resources": {
    "cpu": "35%",
    "memory": "2.4GB / 8GB",
    "disk": "45%"
  }
}
```

### Backup Manager

**Zweck:** Datensicherung und Wiederherstellung  
**Zugriff:** Services → Backups (`/backup`)

```
Aktive Backups:
├─ backup-2026-07-14-full      (2.3 GB)
├─ backup-2026-07-13-full      (2.3 GB)
└─ backup-2026-07-12-full      (2.3 GB)

Aktionen: Create | Restore | Download | Delete
```

### API Documentation

**Zweck:** OpenAPI-Spezifikation und Testumgebung  
**Zugriff:** Services → API Docs (`/api/docs`)

```
GET  /api/schemas
POST /api/schemas
GET  /api/schemas/{id}
PUT  /api/schemas/{id}
DELETE /api/schemas/{id}
...
```

### Settings

**Zweck:** Systemkonfiguration  
**Zugriff:** Services → Settings (`/settings`)

```
• Allgemeine Einstellungen
  - App Name
  - Branding
  - Sprache & Zeitzone

• Benachrichtigungen
  - E-Mail Alerts
  - Job Completion Notifications
  - Error Alerts

• Sicherheit
  - 2FA
  - API Keys
  - Session Timeout
```

---

## Troubleshooting

### Problem 1: Navigation wird nicht angezeigt

**Symptom:** Menü-Icons/Links sind leer oder unsichtbar

**Lösungen:**
1. Browser-Cache löschen (Strg+Shift+Entf)
2. Hard Refresh (Strg+Shift+R)
3. Browser dev tools (F12) → Application → Clear All
4. `docker-compose restart frontend`

### Problem 2: Services-Kategorie funktioniert nicht

**Symptom:** Auf Services klicken zeigt keine Sub-Items

**Lösungen:**
1. Category expand/collapse Button neu klicken
2. Netzwerk prüfen (Dev Tools → Network)
3. `docker-compose logs backend` prüfen
4. Health Check aufrufen: `curl http://localhost:3000/api/health`

### Problem 3: Mobile Navigation laggy

**Symptom:** Drawer-Animation ist langsam

**Lösungen:**
1. Browser Hardware-Beschleunigung aktivieren
2. Chrome/Edge in Mobile-Ansicht testen (DevTools)
3. Weniger Kategorien-Items gleichzeitig öffnen
4. Ältere Browser aktualisieren

---

## System-Checks & Wartung

### Täglich
- [ ] Health Check öffnen und Status prüfen
- [ ] Fehler-Logs prüfen (Logs → Filter: level=ERROR)
- [ ] Job-Queue auf Backlog prüfen

### Wöchentlich
- [ ] Backup erstellen (Services → Backups)
- [ ] Disk-Speicher überprüfen (Health Check)
- [ ] API-Response Zeiten monitoren

### Monatlich
- [ ] Database Cleanup ausführen
- [ ] Alte Logs archivieren
- [ ] Sicherheits-Updates einspielen
- [ ] Performance-Reports generieren

---

## Test-Infrastruktur (Phase 37a)

### Data-testid Attribute für automatisierte Tests

Navigation-Komponenten enthalten jetzt `data-testid` Attribute für zuverlässiges E2E-Testing:

```typescript
// Beispiel: Health Check navigieren
const healthButton = page.locator('[data-testid="nav-item-health-check"]');
await healthButton.click();
expect(page.url()).toContain('/health');
```

### Test-Ausführung

```bash
# Phase 37a Test-Suite ausführen
npx playwright test tests/e2e/navigation-with-testid.test.ts

# Mit HTML-Report
npx playwright test tests/e2e/navigation-with-testid.test.ts --reporter=html

# Spezifischen Test ausführen
npx playwright test -g "Services category"
```

### Verfügbare Selektoren

```typescript
// Navigation Kategorien
[data-testid="nav-category-dashboard"]
[data-testid="nav-category-schemas"]
[data-testid="nav-category-jobs"]
[data-testid="nav-category-rules"]
[data-testid="nav-category-logs"]
[data-testid="nav-category-services"]
[data-testid="nav-category-help"]

// Services Items
[data-testid="nav-item-health-check"]
[data-testid="nav-item-api-docs"]
[data-testid="nav-item-backup-list"]
[data-testid="nav-item-settings-config"]

// Navigation Container
[data-testid="navigation-drawer-content"]
[data-testid="navigation-header"]
[data-testid="navigation-list"]
[data-testid="navigation-footer"]
```

---

## Best Practices

### 1. **Regelmäßige Backups**
- Wöchentlich automatisches Backup einrichten
- Restore-Prozedur regelmäßig testen
- Offline-Speicherung für kritische Daten

### 2. **Regel-Verwaltung**
- Regex-Patterns gut dokumentieren
- Test-Sandbox vor Production nutzen
- Versionierung für Regel-Änderungen

### 3. **Job-Verarbeitung**
- Batch-Größe auf Hardware abstimmen (max 100 Items)
- Fehlerhafte Jobs separate prüfen
- Schedule-Jobs zu Off-Peak-Zeiten

### 4. **Performance**
- Regelmäßig Database-Indizes prüfen
- Cache (Redis) zu 80%+ nutzen
- Logs regelmäßig archivieren

### 5. **Sicherheit**
- API Keys regelmäßig rotieren
- 2FA auf allen Admin-Accounts aktivieren
- Zugriffe auditieren und protokollieren

---

## Migration von v0.34.0 zu v0.35.0

### Änderungen Summary

| Feature | v0.34.0 | v0.35.0 | Status |
|---------|---------|---------|--------|
| Navigation Categories | 10 Items | 7 Kategorien | ✅ Konsolidiert |
| Services | Separate Items | Grouped Category | ✅ Neu |
| Data-testid Attributes | Keine | Alle Components | ✅ Neu |
| Test Pass Rate | 36.4% | 86.7% | ✅ Improved |
| Version | 0.34.0 | 0.35.0 | ✅ Updated |

### Migration Steps

1. **Backup erstellen** (v0.34.0 Daten schützen)
   ```bash
   docker-compose down
   docker volume ls  # Alle Volumes notieren
   ```

2. **Docker Images aktualisieren**
   ```bash
   docker-compose pull
   docker-compose build --no-cache
   ```

3. **Services starten** (v0.35.0)
   ```bash
   docker-compose up -d
   ```

4. **Migration testen**
   - Browser öffnen: http://localhost:5173
   - Navigation prüfen (7 Kategorien sichtbar)
   - Health Check aufrufen
   - Services testen

5. **Daten validieren**
   - Alle Schemas noch vorhanden?
   - Jobs-Historie korrekt?
   - Backups verfügbar?

### Backward Compatibility

✅ **Volständig kompatibel** - Keine Datenmigration nötig
- Alte API-Calls funktionieren weiterhin
- Datenbank-Schema unverändert
- nur UI/UX Verbesserungen

---

## Version History

| Version | Datum | Phase | Highlights |
|---------|-------|-------|-----------|
| 0.35.0 | 2026-07-14 | 37a | Data-testid, Test Infrastructure |
| 0.34.0 | 2026-07-12 | 34 | Services Consolidation |
| 0.33.0 | 2026-07-10 | 33 | Navigation Optimization |
| ... | ... | ... | ... |

---

## Support & Kontakt

**Probleme?**
- 🔗 Help Center: http://localhost:5173/help
- 📧 Support: admin@audit-safe.local
- 🐛 Bug Reports: Logs → Export & Send

**Dokumentation:**
- 📖 Operationshandbuch: `OPERATIONS_MANUAL_V35.md`
- 📋 Release Notes: `RELEASE_NOTES_0.35.0.md`
- 🧪 Test Suite: `tests/e2e/navigation-with-testid.test.ts`

---

**Letzte Aktualisierung:** 2026-07-14  
**Status:** ✅ Production Ready  
**Next Version:** 0.36.0 (Phase 37b - Services Integration Tests)
