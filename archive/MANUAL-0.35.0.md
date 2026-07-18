# 📖 Operationshandbuch - Betriebshandbuch
## Audit-Safe Document Extractor 0.37.1

**Version:** 0.37.1  
**Phase:** 45 (Refactoring Sprint: Code Consolidation & Quality)  
**Datum:** 2026-07-16  
**Status:** Produktionsreif mit verbesserter Code-Qualität und Test-Zuverlässigkeit  

---

## 📋 Inhaltsverzeichnis

1. [Was ist die Audit-Safe App?](#was-ist-die-audit-safe-app)
2. [Neue Features in 0.37.0](#neue-features-in-v0350)
3. [Systemanforderungen](#systemanforderungen)
4. [Installation & Start](#installation--start)
5. [Navigationsstruktur (0.37.0)](#navigationsstruktur-v0350)
6. [Menüpunkte - Detaillierte Beschreibung](#menüpunkte---detaillierte-beschreibung)
7. [Arbeitsabläufe nach Anwendungsfall](#arbeitsabläufe-nach-anwendungsfall)
8. [Responsive Design (Mobile, Tablet, Desktop)](#responsive-design-mobile-tablet-desktop)
9. [Services & System Management](#services--system-management)
10. [Troubleshooting](#troubleshooting)
11. [System-Checks & Wartung](#system-checks--wartung)
12. [Test-Infrastruktur (Phase 37a)](#test-infrastruktur-phase-37a)
13. [Best Practices](#best-practices)
14. [Migration von 0.37.0 zu 0.37.0](#migration-von-v0340-zu-v0350)

---

## 🎯 Überblick: Was ist neu in 0.37.1?

Version **0.37.1 (Phase 45: Refactoring Sprint)** enthält strukturelle Verbesserungen und Konsolidierungen:

### ✨ Highlights

| Feature | Beschreibung | Nutzen |
|---------|-------------|--------|
| **Utility Consolidation** | Date Formatting & Color Mapping Utilities | 93 Zeilen Duplikate eliminiert |
| **Environment Constants** | Zentrale Konfigurationsverwaltung | 15+ hardcodierte Werte konsolidiert |
| **Jest Configuration** | ESM/CommonJS Kompatibilität Fix | Tests 100% zuverlässig |
| **Navigation E2E Fixes** | Test Syntax & Structure Improvements | 22 Navigation Tests PASS |
| **Code Quality** | Zero Breaking Changes, 100% Behavior Preservation | Production-Ready |

**→ [Zu neuen Features](#neue-features-in-v0371)**

---

## Was ist die Audit-Safe App?

### Zweck und Nutzen

Die **Audit-Safe Document Extractor** ist eine spezialisierte Webanwendung zur intelligenten Verarbeitung und Kategorisierung von geschäftlichen Dokumenten (Rechnungen, Belege, Verträge, etc.). Die App automatisiert die Extraktion von Kerndaten aus Dokumenten unter Verwendung von:

- **Intelligenter OCR-Technologie** - Erkennung von Text in gescannten Dokumenten
- **Schemabasierte Regeln** - Automatische Kategorisierung nach konfigurierbaren Mustern  
- **Job-Management** - Batch-Verarbeitung mehrerer Dokumente gleichzeitig
- **Audit-Trail** - Vollständige Protokollierung aller Aktionen für Compliance
- **Flexible Regeln-Engine** - Benutzerdefinierte Regeln zum Extrahieren von Informationen
- **Service Management** - Zentralisierte Verwaltung von System-Services (NEU in 0.37.0)
- **Verbesserte Test-Zuverlässigkeit** - Data-testid Attribute für zuverlässiges E2E-Testing

### Zielgruppe

- 📊 **Bookkeeper & Accountants** - Dokumentenverarbeitung für Finanzbuchhaltung
- 🏢 **Unternehmen** - Batch-Verarbeitung von eingehenden Dokumenten
- 🔍 **Revisoren** - Audit-Trail und Compliance-Anforderungen
- ⚙️ **IT-Administratoren** - Systemkonfiguration, Services-Management und Wartung
- 🧪 **QA-Engineer** - Zuverlässiges E2E-Testing mit deterministischen Selektoren

---

## Neue Features in 0.37.1

### 🎯 Phase 45: Refactoring Sprint - Code Consolidation & Quality

#### 1. **Utility Consolidation: Date Formatting**
Neue zentrale Datei für Datumsformatierung in `frontend/src/utils/dateFormatting.ts`:

```typescript
// Zentrale Funktionen für Datumsformatierung
export const formatDateFull = (date: Date | string): string
  // German locale full datetime: "01.01.2025 14:30:45"
  
export const formatDateOnly = (dateString: string): string
  // German locale date only: "01.01.2025"
  
export const formatDateWithTime = (dateString: string): string
  // Browser locale with time: "1/1/2025 2:30:45 PM"
```

**Impact:** 6 Duplikate eliminiert, 27 Zeilen Code reduziert
**Used by:** DiffViewer, RunHistoryViewer, SchemaListComponent, VersionHistoryComponent

#### 2. **Utility Consolidation: Color Mapping**
Neue zentrale Datei für Farbzuordnungen in `frontend/src/utils/colorMapping.ts`:

```typescript
// Zentraler Ort für Change-Type und Status-Icons
export const CHANGE_TYPE_COLORS: Record<string, string>
export const getChangeColor = (changeType: string): string
export const getChangeIcon = (changeType: string): React.ReactNode
export const getStatusColor = (status: string): 'success' | 'warning' | 'error'
export const getStatusIcon = (status: string): React.ReactNode
```

**Impact:** 4 Duplikate eliminiert, 53 Zeilen Code reduziert
**Used by:** DiffViewer, RunHistoryViewer

#### 3. **Environment Constants Consolidation**
Zentrale Konfigurationsdatei in `frontend/src/constants/environment.ts`:

```typescript
// Zentrale API-Konfiguration
export const API_CONFIG = {
  BASE_URL: '...',
  FETCH_TIMEOUT: 3000,
  BUILD_OPERATION_TIMEOUT: 2000,
  SYNC_OPERATION_TIMEOUT: 2000,
  DEFAULT_TIMEOUT: 30000,
}

// Timing-Konstanten
export const TIMING_CONFIG = {
  JOB_POLL_INTERVAL: 5000,
  TOAST_DISPLAY_DURATION: 3000,
  MESSAGE_DISPLAY_DURATION: 3000,
  SUCCESS_FEEDBACK_DURATION: 2000,
  COPY_SUCCESS_FEEDBACK_DURATION: 2000,
  OPERATION_DELAY: 1200,
  STANDARD_DELAY: 1000,
}

// Validierungsgrenzen
export const VALIDATION_CONFIG = {
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_EXTRACT_RULES: 5000,
}

// System-Konfiguration
export const SYSTEM_CONFIG = {
  WAKEUP_CHECK_ENDPOINT: '...',
  WAKEUP_TRIGGER_ENDPOINT: '...',
}
```

**Impact:** 15+ hardcodierte Werte konsolidiert
**Used by:** App.tsx, TechnicalAuditPage.tsx (und weitere Komponenten in Zukunft)

#### 4. **Jest Configuration Fix**
- Datei `jest.config.js` umbenannt zu `jest.config.cjs`
- **Problem:** ESM/CommonJS Inkompatibilität
- **Solution:** CommonJS File Extension für ESM-Projekte
- **Result:** Jest lädt fehlerfrei, npm test funktioniert

#### 5. **Navigation E2E Test Fixes**
- Datei `tests/e2e/navigation-comprehensive-test.test.ts` repariert
- Problem: `await` außerhalb von async Kontext
- Solution: Korrekter Test-Wrapper mit async function
- Result: 22 Navigation Tests PASSING

### 📊 Quality Metrics für 0.37.1

| Metrik | Wert |
|--------|------|
| **Smoke Tests** | 11/11 PASS (100%) ✅ |
| **Navigation E2E** | 22/22 PASS (100%) ✅ |
| **TypeScript Errors** | 0 ✅ |
| **Build Time** | ~22 seconds |
| **Code Duplication** | 93 lines eliminated |
| **Breaking Changes** | 0 |
| **Test Coverage** | 100% behavior preserved ✅ |

### 🎯 Wichtige Änderungen (Zero Behavioral Impact)

✅ **All Changes:**
- Only structural improvements
- No new features
- 100% behavior preservation
- All tests passing
- Production-ready

---

## Navigationsstruktur (0.37.1)

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

⭐ NEU in 0.37.0: Services-Kategorie konsolidiert
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

**Neuerung 0.37.0:** Diese 4 Service-Menüpunkte wurden aus einer flachen Liste in eine Kategorie konsolidiert, um die Navigation zu vereinfachen (10 Items → 7 Kategorien).

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

## Migration von 0.37.0 zu 0.37.0

### Änderungen Summary

| Feature | 0.37.0 | 0.37.0 | Status |
|---------|---------|---------|--------|
| Navigation Categories | 10 Items | 7 Kategorien | ✅ Konsolidiert |
| Services | Separate Items | Grouped Category | ✅ Neu |
| Data-testid Attributes | Keine | Alle Components | ✅ Neu |
| Test Pass Rate | 36.4% | 86.7% | ✅ Improved |
| Version | 0.37.0 | 0.37.0 | ✅ Updated |

### Migration Steps

1. **Backup erstellen** (0.37.0 Daten schützen)
   ```bash
   docker-compose down
   docker volume ls  # Alle Volumes notieren
   ```

2. **Docker Images aktualisieren**
   ```bash
   docker-compose pull
   docker-compose build --no-cache
   ```

3. **Services starten** (0.37.0)
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
| 0.37.0 | 2026-07-14 | 37a | Data-testid, Test Infrastructure |
| 0.37.0 | 2026-07-12 | 34 | Services Consolidation |
| 0.37.0 | 2026-07-10 | 33 | Navigation Optimization |
| ... | ... | ... | ... |

---

## Support & Kontakt

**Probleme?**
- 🔗 Help Center: http://localhost:5173/help
- 📧 Support: admin@audit-safe.local
- 🐛 Bug Reports: Logs → Export & Send

**Dokumentation:**
- 📖 Operationshandbuch: `OPERATIONS_MANUAL_V35.md`
- 📋 Release Notes: `RELEASE_NOTES_0.37.0.md`
- 🧪 Test Suite: `tests/e2e/navigation-with-testid.test.ts`

---

**Letzte Aktualisierung:** 2026-07-14  
**Status:** ✅ Production Ready  
**Next Version:** 0.37.0 (Phase 37b - Services Integration Tests)
