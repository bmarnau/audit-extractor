# 🔧 Fehlersuche & Umfassende System-Checks

**Version:** 1.0.0  
**Datum:** 2026-07-08  
**Status:** ✅ NEUER LEITFADEN

---

## 📋 Überblick

Dieses Kapitel beschreibt:
1. **Umfassenden System-Check** - Alle kritischen Komponenten prüfen
2. **Checkpunkte** - Was wird überprüft?
3. **Wie man den Check aufruft** - Befehle & Scripts
4. **Fehlerbehandlung** - Was bedeuten die Ergebnisse?

---

## 🔍 Was ist ein "Umfassender Check"?

Ein **Umfassender Check** ist eine automatische Überprüfung des **gesamten Systems**, um sicherzustellen, dass:

- ✅ Backend-Server läuft und antwortet
- ✅ Frontend-Anwendung ist erreichbar  
- ✅ Alle 47+ API-Endpoints funktionieren
- ✅ Datenflüsse arbeiten korrekt
- ✅ Komponenten kommunizieren richtig
- ✅ Keine kritischen Fehler vorhanden
- ✅ Performance ist akzeptabel

---

## 📊 Checkpunkte des Umfassenden Checks

### Checkpunkt 1: Service-Health (Service-Verfügbarkeit)

**Was wird überprüft:**
- ✅ Backend-Server läuft (Port 3000)
- ✅ Health-Endpoint antwortet
- ✅ Uptime wird gemessen
- ✅ Response-Zeit wird gemessen

**Wenn OK:**
```
✅ Backend Health: 200 OK [45ms]
   • Uptime: 3542.25s
   • Status: OPERATIONAL
```

**Wenn Fehler:**
```
❌ Backend: Connection refused
   Problem: Server läuft nicht
   Lösung: npm run dev starten
```

---

### Checkpunkt 2: API-Endpoint Verifikation

**Was wird überprüft:**
- 47+ verschiedene API-Endpoints testen
- Jeder Endpoint wird aufgerufen
- Response-Status wird überprüft (sollte 200 oder 201 sein)
- Response-Zeit wird gemessen

**Kategorien der getesteten Endpoints:**

```
CORE ENDPOINTS (9 Endpoints):
  ✅ GET /health
  ✅ POST /api/extract
  ✅ GET /api/extract/results
  ✅ GET /api/config
  ✅ GET /api/logs

HELP CENTER (3 Endpoints):
  ✅ GET /api/help/glossary
  ✅ GET /api/help/manual
  ✅ GET /api/help/search

BACKUP CENTER (7 Endpoints):
  ✅ POST /api/backup/create
  ✅ GET /api/backup/list
  ✅ POST /api/backup/restore
  ✅ DELETE /api/backup/:id

AUDIT CENTER (2 Endpoints):
  ✅ GET /api/audit/logs
  ✅ GET /api/audit/logs/stats

REVISION SYSTEM Phase 15e (7 Endpoints):
  ✅ POST /api/revision/save-run
  ✅ GET /api/revision/run/:id
  ✅ GET /api/revision/history
  ✅ GET /api/revision/runs
  ✅ POST /api/revision/stats
  ✅ DELETE /api/revision/run
  ✅ POST /api/revision/compare

KONFIGURATION & MEHR (19+ Endpoints)
  ✅ GET/PUT/PATCH Config Endpoints
  ✅ Logs & Statistiken
  ✅ und viele mehr...
```

**Wenn OK:**
```
✅ [1/47] GET /health              [200 OK] [45ms]
✅ [2/47] GET /api/config          [200 OK] [62ms]
✅ [3/47] GET /api/help/glossary   [200 OK] [81ms]
...
✅ [47/47] POST /api/revision/compare [200 OK] [120ms]

RESULT: 47/47 endpoints verified (100%)
```

---

### Checkpunkt 3: Daten-Flow Validierung

**Was wird überprüft:**

Der **Complete Data Pipeline** wird überprüft:

```
Frontend Request
  ↓
HTTP call to Backend
  ↓
API Handler processes request
  ↓
Business Logic executes
  ↓
Response generated
  ↓
Data returned to Frontend
  ↓
Frontend renders UI
```

**Beispiel: Help Center Pipeline**

```
Frontend Help Center Click
  ↓
useHelp Hook (React)
  ↓
Fetch: GET /api/help/glossary
  ↓
Backend: Help Routes
  ↓
Mock/Database: 10 Glossary Entries
  ↓
Response: 200 OK + Data
  ↓
React State Updated
  ↓
UI: Glossary displayed
```

**Wenn OK:**
```
✅ Help Center Pipeline: WORKING
   ├─ Data fetched: 10 entries
   ├─ Data structure: VALID
   ├─ UI rendering: SUCCESS
   └─ Response time: 81ms
```

---

### Checkpunkt 4: Build & Compilation Status

**Was wird überprüft:**

- ✅ TypeScript Backend kompiliert ohne Fehler
- ✅ Keine Compile-Errors (nur Warnings ok)
- ✅ Frontend Build erfolgreich
- ✅ Dependencies sind korrekt installiert

**Wenn OK:**
```
✅ TypeScript Compilation: SUCCESS
   • Files compiled: 47 TypeScript files
   • Build time: 4.2 seconds
   • Errors: 0
   • Warnings: 0
   • Output: dist/ directory created

✅ Frontend Build: SUCCESS
   • React/Vite Build complete
   • Bundle size: 340 KB (gzipped)
   • Components: 15 active
   • Warnings: 12 (non-critical)
```

---

### Checkpunkt 5: Frontend Components & Routing

**Was wird überprüft:**

- ✅ React Components laden
- ✅ Material-UI Komponenten verfügbar
- ✅ React Router funktioniert
- ✅ Alle Seiten erreichbar

**Wenn OK:**
```
✅ React Components: LOADED
   ├─ App.tsx: ✅
   ├─ Pages: ✅ (7 pages)
   ├─ Material-UI: ✅
   └─ React Router: ✅

✅ Frontend Routing: WORKING
   ├─ /              → Home
   ├─ /extract       → Extractor
   ├─ /help          → Help Center
   ├─ /backup        → Backups
   ├─ /audit         → Audit Logs
   ├─ /config        → Configuration
   └─ /revision      → Revision System
```

---

### Checkpunkt 6: Performance Benchmarks

**Was wird überprüft:**

- ✅ Durchschnittliche API Response-Zeit
- ✅ P95 Response-Time (95% sind schneller)
- ✅ Größte Performance-Verbraucher identifizieren

**Wenn OK:**
```
✅ Performance Metrics:
   • Average Response Time: 65ms
   • P95 Response Time: 120ms
   • P99 Response Time: 250ms
   • Slowest Endpoint: POST /api/revision/compare (120ms)
   • Fastest Endpoint: GET /health (5ms)
```

---

### Checkpunkt 7: Error Handling

**Was wird überprüft:**

- ✅ Ungültige Requests werden korrekt abgelehnt
- ✅ Error-Messages sind aussagekräftig
- ✅ HTTP Status-Codes sind korrekt
- ✅ Stack-Traces sind nicht im Response

**Wenn OK:**
```
✅ Error Handling: CORRECT
   ├─ Invalid GET request → 400 Bad Request
   ├─ Missing auth → 401 Unauthorized
   ├─ Not found → 404 Not Found
   ├─ Invalid JSON → 400 Bad Request
   └─ Server error → 500 Internal Server Error
```

---

## 🚀 Wie man den Umfassenden Check aufruft

### Option 1: Automatisiertes Check-Script (Empfohlen)

**Schritt 1: Backend & Frontend starten**

```bash
# Terminal öffnen im Projektverzeichnis
npm run dev
# oder
./start-app.cmd    # Windows
./start-app.sh     # Mac/Linux
```

Warten Sie, bis beide Server laufen:
```
Backend: ✅ Server running on :3000
Frontend: ✅ Local: http://localhost:5173
```

**Schritt 2: Check-Script ausführen (neues Terminal)**

```bash
# Terminal 3 öffnen im Projektverzeichnis
node scripts/pre-phase-16-complete-check.js
```

**Schritt 3: Ergebnisse anschauen**

```
╔════════════════════════════════════════════════════════════════╗
║     PRE-PHASE-16 COMPLETE SYSTEM CHECK v2.0                   ║
║     Date: 2026-07-08 | Scope: Full System Validation         ║
╚════════════════════════════════════════════════════════════════╝

🔍 PHASE 1: SERVICE HEALTH CHECK
✅ Backend Health: 200 OK [45ms]
   • Uptime: 3542.25s

📊 PHASE 2: API ENDPOINT VERIFICATION
✅ [1/47] GET /health              [200 OK] [5ms]
✅ [2/47] GET /api/config          [200 OK] [62ms]
... (weitere 45 Endpoints)
✅ [47/47] POST /api/revision/compare [200 OK] [120ms]

RESULT: 47/47 endpoints verified (100%)

✅ COMPLETE SYSTEM CHECK: SUCCESS
```

---

### Option 2: Frontend Integration Audit

```bash
# Terminal 3 öffnen
node scripts/comprehensive-frontend-audit.js
```

**Ergebnis:**

```
╔════════════════════════════════════════════════════════════════╗
║     COMPREHENSIVE FRONTEND INTEGRATION AUDIT v1.0              ║
║     Date: 2026-07-08 | Test Suite: Complete System Check     ║
╚════════════════════════════════════════════════════════════════╝

🧪 TEST 1: Help Center - Glossary Data Structure
├─ API Response: ✅ 200 OK
├─ Data Structure: ✅ VALID
├─ Entry Count: ✅ 10 entries
└─ Fields: ✅ [term, definition, category]

🧪 TEST 2: Logs Section Data Structure
├─ API Response: ✅ 200 OK
├─ Data Structure: ✅ VALID
├─ Entry Count: ✅ 20+ entries
└─ Fields: ✅ [timestamp, level, message, source]

... (weitere Tests)

✅ ALL INTEGRATION TESTS PASSED
```

---

### Option 3: Manuell mit curl (Für Power-User)

```bash
# Einzelnen Endpoint testen
curl http://localhost:3000/health

# Alle Endpoints testen (Linux/Mac)
for endpoint in /health /api/config /api/help/glossary \
  /api/logs /api/extract/results/test /api/revision/runs; do
  echo "Testing: $endpoint"
  curl http://localhost:3000$endpoint
done
```

---

## 📊 Ergebnisse interpretieren

### ✅ Erfolg: "COMPLETE SYSTEM CHECK: SUCCESS"

Das bedeutet:
- ✅ Alle 47 Endpoints funktionieren
- ✅ Backend & Frontend kommunizieren korrekt
- ✅ Alle Datenflüsse sind aktiv
- ✅ System ist produktionsbereit

**Was tun:** Nichts! System läuft perfekt.

---

### ⚠️ Warnung: "Service partially available"

Das bedeutet:
- ⚠️ Einige Endpoints antworten nicht
- ⚠️ Aber kritische Funktionen arbeiten
- ⚠️ Weniger kritische Features können fehlen

**Was tun:**
1. Prüfen Sie welche Endpoints fehlen
2. Starten Sie den Backend-Server neu: `npm run dev`
3. Warten Sie 10 Sekunden, dann erneut testen

---

### ❌ Fehler: "Backend connection refused"

Das bedeutet:
- ❌ Backend-Server läuft nicht
- ❌ Port 3000 ist nicht erreichbar

**Was tun:**

```bash
# 1. Backend starten
npm run dev

# 2. Prüfen dass es läuft
curl http://localhost:3000/health

# 3. Wenn immer noch fehlt:
# Port 3000 prüfen ob bereits verwendet
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000
```

---

### ❌ Fehler: "Frontend: Connection refused"

Das bedeutet:
- ❌ Frontend-Server läuft nicht
- ❌ Port 5173 ist nicht erreichbar

**Was tun:**

```bash
# 1. Frontend starten
cd frontend
npm run dev

# 2. Browser öffnen
# http://localhost:5173

# 3. Wenn immer noch fehlt:
# Port 5173 prüfen
netstat -ano | findstr :5173
```

---

### ⚠️ Warnung: "Slow API Response" (z.B. > 500ms)

Das bedeutet:
- ⚠️ Ein oder mehrere Endpoints sind langsam
- ⚠️ Response-Zeit ist suboptimal

**Langsamer Endpoint Beispiel:**
```
⚠️ POST /api/revision/compare: 850ms (SLOW)
   Expected: < 300ms
   Actual: 850ms
```

**Was tun:**

```bash
# 1. Prüfen ob Backend-Machine überlastet ist
# Windows Task Manager öffnen (Ctrl+Shift+Esc)
# Oder:
wmic os get totalvisiblememorysizesize

# 2. System neu starten
npm run dev

# 3. Wenn weiter langsam:
# Prüfen ob große Datasets bearbeitet werden
# Diese könnten Performance reduzieren
```

---

## 🔧 Häufige Fehler & Lösungen

### Fehler 1: "Cannot connect to localhost:3000"

**Ursache:**
- Backend läuft nicht
- Port 3000 ist in Verwendung
- Firewall blockiert Zugriff

**Lösung:**

```bash
# Option 1: Backend neu starten
npm run dev

# Option 2: Port überprüfen
netstat -ano | findstr :3000

# Option 3: Prozess beenden (Windows)
taskkill /PID <PID> /F

# Option 4: Anderen Port verwenden
PORT=3001 npm run dev
```

---

### Fehler 2: "GET /api/help/glossary - 404 Not Found"

**Ursache:**
- Endpoint ist nicht implementiert
- Falsche URL
- Backend-Code hat Fehler

**Lösung:**

```bash
# 1. Backend-Build überprüfen
npm run build

# 2. Kompilier-Fehler überprüfen
# Sollte "0 errors" zeigen

# 3. Backend neu starten
npm run dev

# 4. Endpoint überprüfen
curl http://localhost:3000/api/help/glossary
```

---

### Fehler 3: "Frontend won't load - blank page"

**Ursache:**
- Frontend Build fehlgeschlagen
- React App startet nicht
- Browser-Cache Problem

**Lösung:**

```bash
# 1. Frontend neu bauen
cd frontend
npm run build

# 2. Dev Server neu starten
npm run dev

# 3. Browser-Cache leeren
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete

# 4. Hard-Reload
# Chrome/Firefox: Ctrl+F5
```

---

### Fehler 4: "EADDRINUSE: address already in use :::3000"

**Ursache:**
- Port 3000 wird bereits verwendet
- Anderes Programm nutzt Port
- Alter Prozess läuft noch

**Lösung:**

```bash
# Windows - Prozess finden & beenden
netstat -ano | findstr :3000
# Zeigt PID an, dann:
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
# Zeigt PID an, dann:
kill -9 <PID>

# Oder anderen Port verwenden:
PORT=3001 npm run dev
```

---

## 📋 Checkliste für Umfassenden Check

- [ ] Backend läuft (`http://localhost:3000/health` → 200 OK)
- [ ] Frontend läuft (`http://localhost:5173` → Seite sichtbar)
- [ ] Check-Script ausgeführt (`node scripts/pre-phase-16-complete-check.js`)
- [ ] Mindestens 40/47 Endpoints OK (> 85%)
- [ ] Keine kritischen Fehler (❌) angezeigt
- [ ] Frontend Integration Test erfolgreich
- [ ] Response-Zeiten akzeptabel (< 300ms durchschnittlich)

**Wenn alle Häkchen ✅:** System ist bereit! 🎉

---

## 🔗 Weitere Informationen

- [USER-GUIDE.md](./USER-GUIDE.md) - Basis-Bedienung
- [COMPREHENSIVE_SYSTEM_AUDIT_2026-07-07.md](../COMPREHENSIVE_SYSTEM_AUDIT_2026-07-07.md) - Detaillierte Audit-Reports
- [PRE_PHASE_16_SYSTEM_CHECK_2026-07-07.md](../PRE_PHASE_16_SYSTEM_CHECK_2026-07-07.md) - Phase 16 Überprüfung

---

## 📞 Wenn nichts funktioniert

**Letzte Rettung:**

```bash
# 1. Alles stoppen (Ctrl+C in allen Terminals)

# 2. Saubere Installation
rm -rf node_modules
rm -rf frontend/node_modules
npm install
cd frontend && npm install

# 3. Build von Grund auf
npm run clean    # Falls existiert
npm run build

# 4. Neu starten
npm run dev

# 5. Prüfen
node scripts/pre-phase-16-complete-check.js
```

Wenn noch Probleme: Prüfen Sie die [COMPREHENSIVE_SYSTEM_AUDIT_2026-07-07.md](../COMPREHENSIVE_SYSTEM_AUDIT_2026-07-07.md) Report für Details.

