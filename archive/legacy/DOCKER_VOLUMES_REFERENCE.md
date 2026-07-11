# Docker Volume & Daten-Persistenz (Phase 21)

**Status:** ✅ Optimiert  
**Version:** 0.21.0  
**Datum:** 2026-07-10

---

## 📦 Volume-Architektur

```
Daten-Persistenz in Phase 21:

┌─────────────────────────────────────────────────────────────┐
│  Docker Containers (Ephemeral)                              │
├──────────┬──────────────────┬──────────────┬────────────────┤
│ Backend  │ PostgreSQL       │ Redis        │ Frontend       │
│ (3000)   │ (5432)           │ (6379)       │ (80/5173)      │
└──────────┴──────────────────┴──────────────┴────────────────┘
     │              │                │
     └──────┬───────┴────────┬───────┘
            │                │
       ┌────▼─────┐    ┌─────▼──────┐
       │ Bind     │    │ Named      │
       │ Mounts   │    │ Volumes    │
       │ (lokal)  │    │ (Docker)   │
       └────┬─────┘    └─────┬──────┘
            │                │
    ┌───────┴────────┬──────┬┴──────┐
    │                │      │       │
schemas         extraction- │   postgres_data
backups         rules      │   redis_data
results         source-    │   pgadmin_data
                documents  │
                           │
                      (LocalDriver)
```

---

## 🎯 Volume-Typen

### 1. Named Volumes (Persistent Storage)

**PostgreSQL Datenbank:**
```
Volume Name: extractor_postgres_data
Mount Point: /var/lib/postgresql/data
Driver: local
Purpose: Persistente Speicherung von Job-Daten, Schemas, Backups
Labels:
  - com.extractor.description: PostgreSQL database
  - com.extractor.backup: automatic
```

**Redis Cache:**
```
Volume Name: extractor_redis_data
Mount Point: /data
Driver: local
Purpose: Persistente Cache-Daten mit RDB-Snapshots
```

**pgAdmin Konfiguration:**
```
Volume Name: extractor_pgadmin_data
Mount Point: /var/lib/pgadmin
Driver: local
Purpose: pgAdmin Server-Konfiguration und Verbindungen
```

### 2. Bind-Mounts (Lokal mit Git)

**Schemas** (Read-Only)
```
Host Path:      ./schemas/
Container Path: /app/schemas
Read-Only:      YES (:ro)
Purpose:        Extraction-Schemas (automatisch geladen)
Backup:         Via .\backup-before-build.ps1
```

**Backups** (Read-Only)
```
Host Path:      ./backups/
Container Path: /app/backups
Read-Only:      YES (:ro)
Purpose:        Gespeicherte System-Backups
Backup:         Via .\backup-before-build.ps1
```

**Extraction Rules** (Read-Only)
```
Host Path:      ./extraction-rules/
Container Path: /app/extraction-rules
Read-Only:      YES (:ro)
Purpose:        Regel-Definitionen für Datenextraktion
Git-Tracked:    JA
```

**Results** (Read-Write)
```
Host Path:      ./results/
Container Path: /app/results
Read-Only:      NO
Purpose:        Job-Ergebnisse und Logs
Backup:         Via .\backup-before-build.ps1
```

**Source Documents** (Read-Only)
```
Host Path:      ./source-documents/
Container Path: /app/source-documents
Read-Only:      YES (:ro)
Purpose:        Beispiel-Dokumente für Tests
Git-Tracked:    JA
```

---

## 🔄 Daten-Persistenz Workflow

### Szenario 1: Normaler Start

```powershell
docker-compose up -d

# Was passiert:
1. Neue Container starten
2. Named Volumes werden automatisch mounted
3. Bind-Mounts zeigen auf lokale Verzeichnisse
4. PostgreSQL lädt bestehendeJobs-Daten
5. Redis lädt bestehendeCache-Daten
6. Schemas, Backups, Results werden automatisch verfügbar
```

### Szenario 2: Docker Build mit Daten-Persistenz

```powershell
.\build-with-persistence.ps1

# Was passiert:
1. [BACKUP] Speichert: schemas/, backups/, extraction-rules/, results/
   → data-backups/20260710_155130/
   
2. [BUILD] Docker images werden neu gebaut
   - Named Volumes bleiben intact
   - Alte Container werden gestoppt
   
3. [RESTART] Neue Container starten
   - PostgreSQL: Daten aus postgres_data Volume geladen
   - Redis: Daten aus redis_data Volume geladen
   
4. [RESTORE] Bind-Mounts werden wiederhergestellt
   - schemas/ → aus Backup kopiert
   - backups/ → aus Backup kopiert
   - results/ → aus Backup kopiert
```

### Szenario 3: Vollständiger Reset

```powershell
# ACHTUNG: Löscht ALLE Daten!

# Option A: Container-nur Reset (Daten behalten)
docker-compose down

# Option B: Alles löschen (mit Backup zuerst!)
.\backup-before-build.ps1
docker-compose down -v
docker volume rm extractor_postgres_data extractor_redis_data extractor_pgadmin_data

# Option C: Nur Database zurücksetzen
docker-compose down postgres
docker volume rm extractor_postgres_data
docker-compose up -d postgres
```

---

## 📊 Aktuelle Volumes und Größe

| Volume | Typ | Größe | Backup-Strategie |
|--------|-----|-------|------------------|
| `extractor_postgres_data` | Named | ~5-10MB | Auto-Backup via Skript |
| `extractor_redis_data` | Named | ~1MB | Auto-Backup via Skript |
| `extractor_pgadmin_data` | Named | ~2MB | Auto-Backup via Skript |
| `./schemas/` | Bind | 0.02MB | Before-Build, Git-tracked |
| `./backups/` | Bind | 0.00MB | Before-Build, Git-tracked |
| `./results/` | Bind | 0.00MB | Before-Build |
| `./extraction-rules/` | Bind | 0.03MB | Git-tracked |
| `./source-documents/` | Bind | - | Git-tracked |

---

## 🔍 Volume-Inspektion

### Named Volumes anzeigen
```powershell
docker volume ls | Select-String extractor
docker volume inspect extractor_postgres_data
```

### Bind-Mount Inhalte prüfen
```powershell
ls schemas/
ls backups/
ls results/
```

### Container Mount-Points prüfen
```powershell
docker inspect extractor-backend --format='{{json .Mounts}}' | ConvertFrom-Json
```

---

## ✅ Best Practices

### Daten-Backup
```powershell
# Immer BEVOR Sie etwas riskantes tun:
.\backup-before-build.ps1
.\restore-after-build.ps1 -DryRun  # Prüfe was wiederhergestellt würde
```

### Named Volume Cleanup (mit Bedacht!)
```powershell
# Listen Sie auf, welche Sie löschen:
docker volume ls --filter "label=com.extractor.backup=automatic"

# Löschen Sie NICHT einfach - machen Sie zuerst ein Backup!
docker volume rm extractor_postgres_data  # ACHTUNG: Löscht Jobs!
```

### Bind-Mount Read-Only Flags
```
:ro  = Read-Only (Sicher für Config und Assets)
:rw  = Read-Write (Für Output-Daten)
```

---

## 🚨 Häufige Probleme

### "Permission Denied" on results/
**Ursache:** Container läuft als root, Host als User
**Lösung:** `chmod 777 results/` oder Docker als User config

### Volumes werden nach Docker Down nicht gelöscht
**Standard:** `docker-compose down` behält Volumes!
**Lösung:** `docker-compose down -v` zum Löschen

### PostgreSQL zeigt alte Daten nach Build
**Ursache:** postgres_data Volume wurde nicht geleert
**Lösung:** `docker volume rm extractor_postgres_data` (nach Backup!)

### Bind-Mount Dateiänderungen sichtbar im Container?
**Ja:** Bind-Mounts sind live-synced
**Performance:** Kann auf Windows-Docker langsam sein

---

## 📚 Verknüpfung mit Backup-System

Die 3 Backup-Skripte arbeiten mit dem Volume-System:

```powershell
# 1. Backup vor Build
.\backup-before-build.ps1
→ Speichert: schemas/, backups/, extraction-rules/, results/

# 2. Docker Build (Named Volumes bleiben)
docker-compose build
docker-compose up -d
→ postgres_data und redis_data sind noch da!

# 3. Restore nach Build
.\restore-after-build.ps1
→ Stellt Bind-Mounts wieder her
```

---

## 🎯 Zusammenfassung

**Docker Volumes (Persistent):**
- PostgreSQL, Redis, pgAdmin → Named Volumes
- Überleben Container-Stop/Start automatisch
- Werden von Backup-Skripten gesichert

**Bind-Mounts (Lokal):**
- Schemas, Rules, Results, Documents → Lokal auf Host
- Werden von Backup-Skripten gesichert
- Read-Only für unveränderliche Daten

**Integration:**
- `build-with-persistence.ps1` automatisiert Backup → Build → Restore
- Daten sind IMMER verfügbar nach Build
- Zero Data Loss Design
