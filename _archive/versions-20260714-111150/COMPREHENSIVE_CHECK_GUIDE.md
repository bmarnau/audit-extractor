# 🔍 Umfassender System-Check Guide (v0.26.0+)

**Version:** 1.0.0  
**Phase:** 26+  
**Datum:** 2026-07-12  
**Status:** ✅ Aktiv  

---

## 📋 Inhaltsverzeichnis

1. [Überblick & Zweck](#überblick--zweck)
2. [Komponenten im Check](#komponenten-im-check)
3. [Detaillierte Checkpunkte](#detaillierte-checkpunkte)
4. [Schema-Persistenz Check (NEU)](#schema-persistenz-check-neu)
5. [Integration in Operationshandbuch](#integration-in-operationshandbuch)
6. [Versionierungsprozess](#versionierungsprozess)
7. [Checkfehler & Lösungen](#checkfehler--lösungen)

---

## Überblick & Zweck

Der **Umfassende System-Check** ist eine automatisierte Validierung aller Systemkomponenten, um sicherzustellen, dass:

✅ **Backend-Services** - Läuft und antwortet  
✅ **Frontend-Anwendung** - Erreichbar und funktionsfähig  
✅ **API-Endpoints** - Alle 50+ Endpoints funktionieren  
✅ **Datenpersistierung** - Schemas, Konfigurationen, Backups speichern  
✅ **Schema-Persistenz** - Schemas bleiben nach Restart verfügbar  
✅ **Komponenten-Integration** - Alle UI-Komponenten kommunizieren  
✅ **Performance** - Annehmbare Antwortzeiten  
✅ **Fehlerbehandlung** - Keine kritischen Fehler  

---

## Komponenten im Check

### 🔧 KERN-INFRASTRUKTUR

| Komponente | Was wird überprüft | Status-Kriterium |
|-----------|-------------------|------------------|
| **Backend-Server** | Port 3000 antwortet | `200 OK` on GET /health |
| **Frontend-Server** | Port 5173 erreichbar (Dev) | `200 OK` on GET / |
| **PostgreSQL DB** | Datenbankverbindung | `Connected` & Write-Test OK |
| **Node.js Runtime** | Version & Modul-Dependencies | v16+ & alle npm modules installiert |

### 📡 API-LAYER (50+ Endpoints)

| Kategorie | Anzahl | Beispiele |
|----------|--------|----------|
| **Core API** | 8 | /health, /config, /audit/logs |
| **Schema API** | 12 | /api/schema/upload, /api/schema/list, /api/schema/:id |
| **Job API** | 15 | /api/jobs, /api/jobs/:id, /api/jobs/results |
| **Backup API** | 7 | /api/backup/create, /api/backup/list, /api/backup/restore |
| **Help System** | 4 | /api/help/glossary, /api/help/manual, /api/help/search |
| **Revision System** | 8 | /api/revision/save-run, /api/revision/history |

### 💾 DATENPERSISTIERUNG

| Ressource | Speicherort | Check-Kriterium |
|-----------|-----------|-----------------|
| **Schemas** | PostgreSQL `schemas` table | Schema count = erwartete Anzahl |
| **Konfigurationen** | PostgreSQL `config` table | Alle Keys vorhanden |
| **Backups** | PostgreSQL `backups` table + Dateisystem | Backup count > 0 |
| **Audit-Logs** | PostgreSQL `audit_logs` table | Log entries > 100 |
| **Extraction Results** | PostgreSQL `extraction_results` table | Kann abgefragt werden |

### 🎨 FRONTEND-KOMPONENTEN

| Komponente | Test-Szenario | OK-Kriterium |
|-----------|--------------|-------------|
| **App.tsx** | Lädt ohne Fehler | Keine Console-Fehler |
| **Navigation** | Alle 14 Menu-Items sichtbar | Links zu allen Seiten funktionieren |
| **Dashboard** | System-Status zeigt Metriken | Config, Backup, API, Schema Count angezeigt |
| **Schema Manager** | Schema-Liste lädt | Kann Schemas sortieren & filtern |
| **Job Manager** | Job-Liste anzeigen | Kann Jobs erstellen & Status sehen |
| **Help Center** | Tabs laden Daten | Glossary, Manual, Release Notes verfügbar |
| **Responsive Layout** | Sidebar responsive | Mobile/Tablet/Desktop Layout korrekt |

### 🔄 DATENFLÜSSE

| Flow | Start → Ende | Validierung |
|-----|-------------|------------|
| **Schema Upload** | Frontend → API → DB | Schema in DB gespeichert & kann abgerufen werden |
| **Job Execution** | Job Create → Results → DB | Job Status verändert sich, Results speichern |
| **Config Update** | Frontend → API → DB | Neue Config in DB, wird beim Restart geladen |
| **Backup Creation** | API Trigger → Dateisystem + DB | Backup-Datei existiert, Metadata in DB |
| **Audit Trail** | Benutzeraktion → Log Event → DB | Aktion im Audit-Log sichtbar |

---

## Detaillierte Checkpunkte

### ✅ Checkpunkt 1: Service-Verfügbarkeit

**Automatischer Check:**
```bash
# In Terminal: Überprüfe Backend
curl http://localhost:3000/health

# Erwartete Antwort:
# {"status":"operational","uptime":3542.25,"version":"0.26.0"}
```

**Manuelle Überprüfung:**
1. Terminal 1: `npm run dev` (Backend)
2. Terminal 2: `cd frontend && npm run dev` (Frontend)
3. Browser: http://localhost:5173 öffnen
4. Sollte Dashboard-Seite laden

**Fehler & Lösungen:**
| Problem | Ursache | Lösung |
|---------|--------|-------|
| `ECONNREFUSED :3000` | Backend läuft nicht | `npm run dev` im Backend-Verzeichnis starten |
| `ENOTFOUND localhost` | Netzwerk-Problem | `ping localhost` testen |
| `ERR_NETWORK_CHANGED` | DNS-Problem | Hosts-Datei prüfen oder DNS-Server wechseln |

---

### ✅ Checkpunkt 2: Frontend-Komponenten

**Test-Szenario:**
```
1. http://localhost:5173 öffnen
2. Navigiere zu: /dashboard, /extraction, /schema, /help, /audit
3. Überprüfe:
   - Navigation lädt alle 14 Menü-Items
   - Sidebar expandiert/collapsiert die Kategorien
   - Responsive Layout passt sich an (F12 → Toggle Device Toolbar)
```

**Responsive Breakpoints:**
- **Mobile (<600px):** Hamburger + Bottom Navigation
- **Tablet (600-960px):** Compact sidebar (80px) + Content
- **Desktop (>960px):** Full sidebar (280px) + Content

**Console-Fehler Überprüfung:**
```javascript
// Im Browser DevTools Console sollten KEINE Fehler sein:
// ✅ OK: Nur Warnings & Info-Nachrichten
// ❌ FAIL: React Errors, TypeScript Errors, useLocation() Errors
```

---

### ✅ Checkpunkt 3: API-Endpoint Validierung

**Test 47 Standard-Endpoints:**
```powershell
# Script: scripts/comprehensive-system-check.js
node scripts/pre-phase-16-complete-check.js

# Oder manuell:
curl http://localhost:3000/health
curl http://localhost:3000/api/config
curl http://localhost:3000/api/logs
curl http://localhost:3000/api/audit/logs
curl http://localhost:3000/api/backup/list
curl http://localhost:3000/api/jobs
```

**Erwartete Antworten:**
```
✅ Status: 200 OK (für GET/DELETE)
✅ Status: 201 CREATED (für POST/PUT)
✅ Response Time: < 200ms
✅ Response Body: Valid JSON
```

---

### ✅ Checkpunkt 4: Build & Compilation

**TypeScript Compilation:**
```powershell
# Test 1: Frontend TypeScript
cd frontend
npm run build
# Sollte: dist/ Verzeichnis erstellen, 0 Errors

# Test 2: Backend TypeScript
cd ../backend
npm run build
# Sollte: dist/ Verzeichnis erstellen, 0 Errors
```

**Version-Strings Check:**
```powershell
# Überprüfe ob richtige Version in Build ist:
Select-String "0.26.0" backend/dist/infrastructure/api/routes/help.js
Select-String "0.26.0" frontend/dist/index.html

# Sollte gefunden werden
```

---

### ✅ Checkpunkt 5: Datenbank-Persistierung

**PostgreSQL Connection Test:**
```powershell
# In Backend-Terminal
npm run dev

# In Browser: http://localhost:3000/api/config
# Sollte Config-Daten returnen

# In psql (wenn verfügbar):
psql -U postgres -h localhost -d extractor_db
SELECT COUNT(*) FROM schemas;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM audit_logs;
```

**Backup-Test:**
```bash
# API-Call für Backup:
curl -X POST http://localhost:3000/api/backup/create

# Check ob Backup existiert:
curl http://localhost:3000/api/backup/list

# Sollte Backup in Liste enthalten:
# {"id":1,"name":"backup_2026-07-12_10-30-45","size":"2.5MB","created":"2026-07-12"}
```

---

## Schema-Persistenz Check (NEU)

### 🎯 Ziel
Überprüfen, dass Schemas nach App-Restart verfügbar bleiben (**Phase 26 Issue**)

### 📝 Teste Schemas Persistierung

**Schritt 1: Test-Schemas hochladen**
```
1. Browser: http://localhost:5173/schema
2. Klick: "Upload Schema"
3. Datei wählen: example-schemas/invoice-schema.json
4. Klick: "Save"
5. Notiere: Anzahl der Schemas VORHER (z.B. 3 Schemas)
```

**Schritt 2: App neustarten**
```powershell
# Terminal 1: Backend stoppen (Ctrl+C)
# Warte 3 Sekunden
# Starte erneut: npm run dev

# Terminal 2: Frontend stoppen (Ctrl+C)
# Warte 1 Sekunde
# Starte erneut: cd frontend && npm run dev

# Browser: Warte bis http://localhost:5173 lädt
```

**Schritt 3: Schemas überprüfen**
```
1. Browser: http://localhost:5173/schema
2. Überprüfe: Sind die GLEICHEN Schemas sichtbar wie VORHER?
3. ✅ PASS: Alle 3+ Schemas sichtbar
4. ❌ FAIL: Schemas verschwunden
```

### 🔧 Backend-Check (Technisch)

**Test in Backend-Logs:**
```
Beim Start sollte sichtbar sein:
[Database] Connection established
[SchemaManager] Loading 3 schemas from database
[SchemaManager] Registered: invoice-schema (v1.0)
[SchemaManager] Registered: purchase-order-schema (v2.1)
[SchemaManager] Registered: contract-schema (v1.2)
```

**Test in Browser DevTools:**
```javascript
// In Console:
fetch('/api/schema/list').then(r => r.json()).then(d => console.log(d))

// Sollte zurückgeben:
// {schemas: [{id: 1, name: "invoice-schema", ...}, {...}, {...}]}
```

**Test mit cURL:**
```bash
curl http://localhost:3000/api/schema/list
# Sollte alle Schemas return, auch nach Restart
```

### 📊 Debugging bei Fehler (Schemas nicht sichtbar)

| Symptom | Wahrscheinliche Ursache | Debug-Schritte |
|---------|----------------------|-----------------|
| Schemas nach Restart weg | DB-Verbindung fehlgeschlagen | `npm run dev` logs prüfen auf `ECONNREFUSED` |
| Schemas in Backend, aber nicht Frontend | Frontend Cache | `localStorage` leeren in DevTools |
| Nur 1-2 Schemas sichtbar statt alle | Datenbankabfrage-Problem | `SELECT COUNT(*) FROM schemas;` in psql |
| API returnt `[]` (leere Liste) | Schema-Tabelle leer | `INSERT INTO schemas ...` neuen Test-Schema |

---

## Integration in Operationshandbuch

### Kapitel-Ergänzung für OPERATIONS_MANUAL.md

**Abschnitt: Systemverwaltung & Maintenance**

```markdown
## 11. Umfassender System-Check

### Was ist ein System-Check?
Ein automatisiertes Verfahren zur Überprüfung ALLER Systemkomponenten...

### Wann sollte man einen Check durchführen?
- ✅ Nach Versionsupdate (0.26.0 → 0.27.0)
- ✅ Nach Schema-Änderungen
- ✅ Nach Backup-Restore
- ✅ Nach Konfigurationsänderungen
- ✅ Wenn Benutzer berichten, dass "etwas nicht funktioniert"

### Automatischer Check
```bash
npm run verify-system
```
Dauert 2-5 Minuten, gibt Bericht aus

### Manueller Check (wenn Automatik fehlschlägt)
Siehe: docs/TROUBLESHOOTING-COMPREHENSIVE-CHECK.md

### Wichtige Checkpunkte
1. Service-Verfügbarkeit
2. API-Endpoints
3. Datenpersistierung
4. Schema-Persistierung (NEU)
5. Frontend-Komponenten
6. Performance
7. Error-Handling
```

---

## Versionierungsprozess

### 📦 Was passiert bei einer Versionierung (0.25.0 → 0.26.0)?

#### Phase 1: **Planung & Vorbereitung**
```
1. Feature-Branch erstellen: git checkout -b phase-26-layout
2. Features implementieren
3. Testen & Bugfixes
4. Code-Review durchführen
```

#### Phase 2: **Version-Bumping**

**A) Datei-Updates:**
```
✅ package.json: "version": "0.26.0"
✅ backend/package.json: "version": "0.26.0"
✅ frontend/package.json: "version": "0.26.0"
✅ src/index.ts: const VERSION = "0.26.0"
✅ frontend/src/App.tsx: const VERSION = "0.26.0"
✅ RELEASE_NOTES_0.26.0.md: neu erstellen
✅ MANUAL-0.26.0.md: neu erstellen
```

**B) Dokumentation:**
```
✅ CHANGELOG.md: Neue Sektion für 0.26.0
✅ README.md: Links aktualisieren
✅ API_REFERENCE.md: Neue Endpoints dokumentieren
```

#### Phase 3: **Build & Verify**

```powershell
# 1. Compilation überprüfen
npm run build
npm run verify

# 2. Lintings durchführen
npm run lint

# 3. Tests laufen
npm run test

# 4. Vollständiger System-Check
npm run verify-system
```

#### Phase 4: **Archivierung (Cleanup)**

```powershell
# Alte Phase-Dateien archivieren:
Move-Item PHASE_25_* archive/
Move-Item test-old-* archive/
Move-Item RELEASE_NOTES_0.20.0.md archive/

# Neue Phase-Dateien ins Root:
Copy-Item PHASE_26_COMPLETION_REPORT.md .
```

#### Phase 5: **Git Commit & Push**

```bash
git add -A
git commit -m "Phase 26: Layout restructuring + flex architecture (v0.26.0)"
git tag v0.26.0
git push origin phase-26-layout
git push origin --tags
```

#### Phase 6: **Release Finalization**

```bash
# Merge in main/master
git checkout master
git merge phase-26-layout
git push origin master
```

### 🔄 Automatisierte Version-Updates

**Skript für zukünftige Versionen:**

```powershell
# PowerShell: scripts/bump-version.ps1
param([string]$newVersion = "0.27.0")

Write-Host "Bumping version to $newVersion..."

# 1. Update package.json files
$files = @(
    "package.json",
    "backend/package.json", 
    "frontend/package.json"
)

foreach ($file in $files) {
    (Get-Content $file) -replace '"version":\s*"[\d.]+"', "`"version`": `"$newVersion`"" | 
    Set-Content $file
    Write-Host "✅ Updated $file"
}

# 2. Update TypeScript version constants
$tsSources = @(
    "src/index.ts",
    "frontend/src/App.tsx"
)

foreach ($file in $tsSources) {
    (Get-Content $file) -replace 'const VERSION = "[\d.]+"', "const VERSION = `"$newVersion`"" |
    Set-Content $file
    Write-Host "✅ Updated $file"
}

# 3. Create Release Notes template
$releaseNotes = @"
# Release Notes v$newVersion

**Release Date**: $(Get-Date -Format "yyyy-MM-dd")
**Version**: $newVersion
**Phase**: XX - [Phase Name]

## Key Improvements

(Add improvements here)

## Bug Fixes

(Add fixes here)

## Breaking Changes

(Add if any)
"@

Set-Content -Path "RELEASE_NOTES_$newVersion.md" -Value $releaseNotes
Write-Host "✅ Created RELEASE_NOTES_$newVersion.md"

# 4. Build & Verify
npm run build
npm run verify

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! Ready for commit."
} else {
    Write-Host "❌ Build failed! Fix errors before committing."
    exit 1
}
```

---

## Checkfehler & Lösungen

### ❌ Fehler 1: "Database Connection Failed"

**Symptom:**
```
[Database] Connection Failed (Attempt 5/5)
ECONNREFUSED - Connect refused ::1:5432
```

**Ursachen & Lösungen:**
| Problem | Lösung |
|---------|--------|
| PostgreSQL läuft nicht | `pg_ctl start` oder Service starten |
| Falsche Credentials | `.env.local` überprüfen: `DB_USER`, `DB_PASSWORD` |
| Falsche Port | Port 5432 sollte PostgreSQL sein |
| Firewall blockiert | Firewall-Regel zulassen für localhost:5432 |

---

### ❌ Fehler 2: "No metadata for 'JobEntity' was found"

**Symptom:**
```
EntityMetadataNotFoundError: No metadata for 'JobEntity' was found
```

**Ursachen & Lösungen:**
| Problem | Lösung |
|---------|--------|
| Entity nicht in DataSource | `src/data-source.ts` - JobEntity in `entities` array hinzufügen |
| TypeORM cache veraltet | `rm -rf dist/` && `npm run build` |
| Import-Fehler | `import { JobEntity } from '...'` - Path überprüfen |

---

### ❌ Fehler 3: "Schemas sind nach Restart nicht sichtbar"

**Symptom:**
```
1. 3 Schemas hochgeladen
2. App neugestartet
3. Nur noch 0 Schemas sichtbar
```

**Debug-Schritte:**
```powershell
# 1. PostgreSQL-Daten prüfen
psql -U postgres -d extractor_db
SELECT * FROM schemas;

# Sollte 3 Einträge zeigen

# 2. Frontend-Cache leeren
# Browser DevTools: Application → localStorage → Clear All

# 3. Backend-Logs überprüfen
# Sollte "[SchemaManager] Loading 3 schemas from database" zeigen

# 4. API direkt testen
curl http://localhost:3000/api/schema/list

# Sollte: {"schemas":[{...},{...},{...}]}
```

---

### ❌ Fehler 4: "Frontend zeigt Compile-Error in navigationConfig.tsx"

**Symptom:**
```
Vite error: Expected '>' but found '/'
JSX syntax error at navigationConfig.tsx:62
```

**Lösung:**
```powershell
# 1. Vite-Cache leeren
rm -r frontend/node_modules/.vite

# 2. Frontend neu starten
cd frontend
npm run dev

# Sollte ohne JSX-Fehler starten
```

---

## 📋 Checkliste für Check-Durchführung

**Vor dem Check:**
- [ ] Backend läuft (`npm run dev`)
- [ ] Frontend läuft (`npm run frontend`)
- [ ] PostgreSQL läuft
- [ ] Browser ist offen
- [ ] Keine anderen Services verwenden Port 3000 oder 5173

**Während dem Check:**
- [ ] Service-Health: ✅
- [ ] Frontend lädt: ✅
- [ ] API-Endpoints antwortworten: ✅
- [ ] Keine Console-Fehler: ✅
- [ ] Schemas sind sichtbar: ✅
- [ ] Nach Restart immer noch sichtbar: ✅

**Nach dem Check:**
- [ ] Bericht dokumentieren
- [ ] Fehler notieren (falls vorhanden)
- [ ] Bugfixes durchführen
- [ ] Re-Test durchführen

---

**Letzte Aktualisierung:** 2026-07-12  
**Nächste Überprüfung:** Nach v0.27.0 Release
