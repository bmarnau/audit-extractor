# Startup/Stop Befehle Referenz (Phase 21)

**Status:** ✅ Komplett Dokumentiert  
**Version:** 0.21.0  
**Datum:** 2026-07-10

---

## 🚀 Quick Reference Tabelle

| Befehl | Typ | Zweck | Platform | Zeit |
|--------|-----|-------|----------|------|
| **Docker Stack** | | | | |
| `.\start-docker.cmd` | Start | Alle Services starten | Windows CMD | 45s |
| `.\start-docker.ps1` | Start | Alle Services (mit Optionen) | PowerShell | 45s |
| `.\stop-docker.cmd` | Stop | Alle Services stoppen | Windows CMD | 10s |
| `.\stop-docker.ps1` | Stop | Alle Services stoppen | PowerShell | 10s |
| **Lokale Entwicklung** | | | | |
| `.\start-app.cmd` | Start | Backend + Frontend lokal | Windows CMD | 30s |
| `.\start-app.ps1` | Start | Backend + Frontend lokal | PowerShell | 30s |
| `.\start-services.ps1` | Start | Getrennte Backend/Frontend | PowerShell | 30s |
| `.\stop-app.cmd` | Stop | Beende lokale Services | Windows CMD | 5s |
| `.\stop-app.ps1` | Stop | Beende lokale Services | PowerShell | 5s |
| **Backup & Build** | | | | |
| `.\backup-before-build.ps1` | Backup | Sichert Schemas + Backups | PowerShell | 5s |
| `.\restore-after-build.ps1` | Restore | Stellt Daten wieder her | PowerShell | 5s |
| `.\build-with-persistence.ps1` | Build | Backup→Build→Restore | PowerShell | 3-5min |
| **Maintenance** | | | | |
| `.\archive-obsolete.ps1` | Archive | Archiviert alte Dateien | PowerShell | 2s |

---

## 📋 Detaillierte Dokumentation

### Docker Stack (Produktionsweise)

#### `start-docker.cmd` - Docker Stack starten (CMD)
**Typ:** Windows Command Script  
**Zweck:** Einfacher Start aller Docker Services  
**Plattform:** Windows CMD, PowerShell  
**Abhängigkeiten:** Docker Desktop, docker-compose  

```cmd
start-docker.cmd
```

**Was passiert:**
1. Überprüft Docker Installation
2. Überprüft docker-compose
3. Startet alle 5 Services (Backend, Frontend, Postgres, Redis, pgAdmin)
4. Wartet auf Health-Checks (45 Sekunden)
5. Zeigt Zugangs-URLs an

**Output Beispiel:**
```
Docker Stack wird gestartet...
[✓] Docker ist installiert
[✓] docker-compose ist verfügbar
[✓] Services werden gestartet...
[✓] Alle Services sind online

Frontend:  http://localhost
Backend:   http://localhost:3000/api
pgAdmin:   http://localhost:5050
```

**Probleme?**
- "Docker not found" → Docker Desktop nicht laufen
- Services starten nicht → Port-Konflikt? `netstat -ano | findstr :3000`
- Langsam → `-

Check: `docker ps` ob alle Container laufen

---

#### `start-docker.ps1` - Docker Stack starten (PowerShell)
**Typ:** PowerShell Script  
**Zweck:** Erweiterte Kontrolle mit Optionen  
**Plattform:** Windows PowerShell, PowerShell Core  

```powershell
# Standard-Start
.\start-docker.ps1

# Mit Rebuild (alle Images neu bauen)
.\start-docker.ps1 -Rebuild

# Mit Live-Logs (Echtzeit-Output)
.\start-docker.ps1 -ShowLogs

# Kombiniert
.\start-docker.ps1 -Rebuild -ShowLogs
```

**Parameter:**
- `-Rebuild`: Docker Images neu bauen (`docker-compose build --no-cache`)
- `-ShowLogs`: Zeigt Live-Logs nach Start (`docker-compose logs -f`)
- `-Version`: Zeigt Versions-Info

**Wann verwenden?**
- Nach Code-Änderungen: `.\start-docker.ps1 -Rebuild`
- Debugging: `.\start-docker.ps1 -ShowLogs`
- Erstes mal: `.\start-docker.ps1`

---

#### `stop-docker.cmd` / `stop-docker.ps1` - Docker Stack stoppen
**Typ:** Windows CMD / PowerShell  
**Zweck:** Elegantes Herunterfahren aller Services  

```cmd
stop-docker.cmd
```

```powershell
.\stop-docker.ps1
```

**Was passiert:**
1. Alle Container werden gestoppt (graceful shutdown, 30s timeout)
2. Network wird bereinigt
3. Volumes bleiben erhalten

**Unterschied zu `docker-compose down -v`:**
- `stop-docker.*` → Containers stoppen, Daten behalten
- `down -v` → Alles löschen inkl. Datenbanken!

---

### Lokale Entwicklung (npm ohne Docker)

#### `start-app.cmd` / `start-app.ps1` - Lokale Entwicklung
**Typ:** Windows CMD / PowerShell  
**Zweck:** Backend + Frontend lokal mit npm starten  
**Abhängigkeiten:** Node.js 20+, npm, PostgreSQL, Redis lokal laufend  

```cmd
start-app.cmd
```

```powershell
.\start-app.ps1
```

**Was passiert:**
1. Installiert npm dependencies (falls nötig)
2. Startet Backend auf Port 3000
3. Startet Frontend auf Port 5173
4. Öffnet Browser auf http://localhost:5173

**Wann verwenden?**
- Lokale Entwicklung (schnelle Iterationen)
- Hot-Reload während Änderungen
- Debugging mit Browser DevTools

**Voraussetzungen:**
- Node.js 20.20+ installiert
- PostgreSQL läuft (lokal oder remote)
- Redis läuft (lokal oder remote)

**Ports:**
- Backend: http://localhost:3000/api
- Frontend: http://localhost:5173
- Debug: http://localhost:9229 (Node Inspector)

---

#### `start-services.ps1` - Backend & Frontend separat
**Typ:** PowerShell  
**Zweck:** Getrennte Kontrolle über Backend und Frontend  

```powershell
# Nur Backend starten
.\start-services.ps1 -Service Backend

# Nur Frontend starten
.\start-services.ps1 -Service Frontend

# Beide (Standard)
.\start-services.ps1
```

**Wann sinnvoll?**
- Backend debuggen, Frontend schon laufend
- Frontend-Tests ohne Backend
- Schneller neu-starten von nur einem Service

---

#### `stop-app.cmd` / `stop-app.ps1` - Lokale Services stoppen
**Typ:** Windows CMD / PowerShell  
**Zweck:** Backend und Frontend beenden  

```cmd
stop-app.cmd
```

```powershell
.\stop-app.ps1
```

**Was passiert:**
- Findet npm Prozesse (`node` auf Port 3000, 5173)
- Beendet sie sauber (SIGTERM, dann SIGKILL)
- Gibt Ports frei

---

### Backup & Build (mit Daten-Persistenz)

#### `backup-before-build.ps1` - Daten sichern
**Typ:** PowerShell  
**Zweck:** Sichert Schemas + Backups vor Docker Rebuild  
**Dauer:** 1-5 Sekunden  

```powershell
.\backup-before-build.ps1
```

**Was wird gesichert:**
```
data-backups/
└── 20260710_155130/              # Timestamp-Ordner
    ├── schemas/                  # 35 Dateien
    ├── backups/                  # 5 Dateien
    ├── extraction-rules/         # 14 Dateien
    ├── results/                  # 1+ Dateien
    └── metadata.json             # Backup-Info
```

**Output Beispiel:**
```
[BACKUP] Starting data backup...
         Directory: data-backups/20260710_155130
         [OK] schemas: 35 files
         [OK] backups: 5 files
         [OK] extraction-rules: 14 files
         [OK] results: 1 files

[OK] Backup complete!
     Total files: 55
```

**Wann aufrufen?**
- Bevor Sie `docker-compose down -v` machen
- Bevor Sie großes Update/Rebuild machen
- Vor dem Löschen von Datenbanken
- Optional: Automatisch in `build-with-persistence.ps1`

---

#### `restore-after-build.ps1` - Daten wiederherstellen
**Typ:** PowerShell  
**Zweck:** Stellt gesicherte Daten wieder her  
**Dauer:** 1-5 Sekunden  

```powershell
# Neuestes Backup wiederherstellen
.\restore-after-build.ps1

# Spezifisches Backup
.\restore-after-build.ps1 -BackupDir data-backups/20260710_155130

# Test: Zeige was würde wiederhergestellt (ohne Änderungen)
.\restore-after-build.ps1 -DryRun
```

**Parameter:**
- `-BackupDir`: Backups von bestimmtem Ordner wiederherstellen
- `-DryRun`: Simulation, keine echten Änderungen

**Output Beispiel:**
```
[RESTORE] Starting data restore...
          Source: C:\...\data-backups\20260710_155130
          Date: 2026-07-10 15:51:30
          [OK] schemas: 35 files
          [OK] backups: 5 files
          [OK] extraction-rules: 14 files
          [OK] results: 1 files

[OK] Restore complete!
     Total files: 55
```

**WICHTIG:** Überschreibt aktuelle Dateien! Mit `-DryRun` erst prüfen!

---

#### `build-with-persistence.ps1` - Kompletter Build-Workflow
**Typ:** PowerShell  
**Zweck:** Automatisiert: Backup → Build → Restore  
**Dauer:** 3-5 Minuten  

```powershell
# Kompletter Build mit Persistence
.\build-with-persistence.ps1

# Nur Backend neu bauen (Frontend skip)
.\build-with-persistence.ps1 -Services Backend

# Ohne Cache (neue Base Images)
.\build-with-persistence.ps1 -NoCache

# Build ohne Restore (für Testing)
.\build-with-persistence.ps1 -NoRestore

# Kombiniert
.\build-with-persistence.ps1 -Services Backend -NoCache
```

**Parameter:**
- `-NoCache`: `docker-compose build --no-cache`
- `-Services`: Backend, Frontend, oder All (Standard)
- `-NoRestore`: Skip restore phase (manuelles Testing)

**Workflow:**
```
[1/4] Creating backup...
      → data-backups/20260710_155130/

[2/4] Building Docker images...
      → docker-compose build [--no-cache] [service]

[3/4] Starting containers...
      → docker-compose up -d
      → (wartet 15 Sekunden für Health-Checks)

[4/4] Restoring data...
      → Wiederherstellen aller Dateien
```

**Output:**
```
===============================================
  Build mit Daten-Persistenz (Phase 21)
===============================================

[1/4] Creating backup...
      Directory: data-backups/20260710_160000
      Total files: 55

[2/4] Building Docker images...
      Building backend ...
      Building frontend ...
      [SUCCESS]

[3/4] Starting containers...
      extractor-backend  Up healthy
      extractor-frontend Up healthy
      extractor-postgres Up healthy
      extractor-redis    Up healthy

[4/4] Restoring data...
      [OK] schemas: 35 files
      [OK] backups: 5 files
      [OK] extraction-rules: 14 files
      [OK] results: 1 files

===============================================
  SUCCESS! Build complete
===============================================

Summary:
  Duration: 2.5 minutes
  Services: All
  Cache: used

Access:
  Frontend:  http://localhost
  Backend:   http://localhost:3000/api
```

**Garantie:**
✅ Daten vor Build gesichert  
✅ Build mit neuesten Code/Images  
✅ Container laufen  
✅ Alle Daten zurück vorhanden  
✅ ZERO DATA LOSS

---

### Maintenance

#### `archive-obsolete.ps1` - Alte Dateien archivieren
**Typ:** PowerShell  
**Zweck:** Räumt alte Phase 16/17 Dateien auf  
**Dauer:** < 1 Sekunde  

```powershell
.\archive-obsolete.ps1
```

**Was wird archiviert:**
```
_archive/
├── Phase 16 Skripte
├── Phase 16/17 Dokumentation
├── Alte Start/Stop Befehle
└── Veraltete Guides
```

**Ausgabe:**
```
[OK] Archived: start-phase16.ps1 → _archive/
[OK] Archived: START_HERE_PHASE16_TO_PHASE17.md → _archive/
...

Active Files (Phase 21):
  Docker:
    • start-docker.cmd
    • start-docker.ps1
    • stop-docker.cmd
    • stop-docker.ps1
  
  Local Development (npm):
    • start-app.cmd
    • start-app.ps1
    • start-services.ps1
    • stop-app.cmd
    • stop-app.ps1
```

---

## 🎯 Cheat Sheet

### "Ich möchte..."

**...Docker mit allen Services starten**
```powershell
.\start-docker.ps1
```

**...lokal mit npm entwickeln**
```powershell
.\start-app.ps1
```

**...Docker neu bauen nach Code-Änderungen**
```powershell
.\build-with-persistence.ps1
```

**...Nur Backend neu bauen (schneller)**
```powershell
.\build-with-persistence.ps1 -Services Backend
```

**...Docker stoppen (Daten behalten)**
```powershell
.\stop-docker.ps1
```

**...Vor riskantem Rebuild sichern**
```powershell
.\backup-before-build.ps1
```

**...Alles löschen und neu starten**
```powershell
.\backup-before-build.ps1     # Erst Backup!
docker-compose down -v         # Alles löschen
.\start-docker.ps1            # Neu starten
.\restore-after-build.ps1     # Daten zurück
```

**...Testen ob Restore funktioniert**
```powershell
.\restore-after-build.ps1 -DryRun
```

---

## 📊 Übersicht: Welches Skript wann?

```
┌─────────────────────────────────────────────────┐
│ INTENTION                                       │
└─────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────┐
│ PRODUKTIVE UMGEBUNG (Docker)                   │
├──────────────────┼──────────────────────────────┤
│ Starten          → .\start-docker.ps1          │
│ Stoppen          → .\stop-docker.ps1           │
│ Nach Code-Chg    → .\build-with-persistence.ps1│
│ Herunterfahren   → docker-compose down         │
└──────────────────┴──────────────────────────────┘

┌──────────────────┬──────────────────────────────┐
│ ENTWICKLUNG (Lokal npm)                        │
├──────────────────┼──────────────────────────────┤
│ Starten          → .\start-app.ps1             │
│ Stoppen          → .\stop-app.ps1              │
│ Hot-Reload       → (automatisch)               │
│ Debuggen         → Browser DevTools            │
└──────────────────┴──────────────────────────────┘

┌──────────────────┬──────────────────────────────┐
│ BACKUP & RESTORE                               │
├──────────────────┼──────────────────────────────┤
│ Vor Rebuild      → .\backup-before-build.ps1   │
│ Nach Rebuild     → .\restore-after-build.ps1   │
│ Alles Automatisch→ .\build-with-persistence.ps1│
└──────────────────┴──────────────────────────────┘
```

---

## ✅ Best Practices

1. **Immer Backup vor großem Change**
   ```powershell
   .\backup-before-build.ps1
   ```

2. **Überprüfe mit -DryRun**
   ```powershell
   .\restore-after-build.ps1 -DryRun
   ```

3. **Verifiziere nach Restore**
   ```powershell
   dir schemas/
   docker-compose ps
   ```

4. **Halte docker-compose.yml aktuell**
   - Alle Volumes dokumentiert
   - Alle Services mit Health-Checks
   - Network-Konfiguration definiert

5. **Logs prüfen bei Problemen**
   ```powershell
   docker-compose logs backend
   docker-compose logs postgres
   ```

---

## 📚 Zusätzliche Dokumentation

- **START_PHASE_21.md** - Vollständiger Startup-Guide
- **DOCKER_VOLUMES_REFERENCE.md** - Volume-System erklärt
- **DOCKER_DEPLOYMENT_GUIDE.md** - Production Deployment
- **MANUAL-0.18.0.md** - Operationshandbuch (veraltet, wird aktualisiert)
