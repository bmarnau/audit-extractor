# Startliste Phase 21 - Asynchrone Job API

**Status:** ✅ Production Ready  
**Version:** 0.21.0  
**Datum:** 2026-07-10

---

## 🚀 Schnellstart (2 Minuten)

```powershell
# Alles starten (Backend + Frontend + Datenbanken)
docker-compose up -d

# Status prüfen (sollte ~40 Sekunden für Startup brauchen)
docker-compose ps

# API testen
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" -Method GET
```

---

## 📋 Detaillierte Startanleitung

### 1️⃣ **Voraussetzungen**
- Docker Desktop installiert und laufend
- PowerShell 5.0+ oder cmd.exe
- Port 3000 (Backend), 5173/80 (Frontend), 5432 (DB), 6379 (Redis) frei

### 2️⃣ **Services starten**

#### Option A: Alles auf einmal (empfohlen)
```powershell
# Komplett von oben starten
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 45

# Alle 4 Services sollten "Healthy" oder "Up" sein
docker-compose ps
```

#### Option B: Einzelne Services
```powershell
# Nur Backend + DB
docker-compose up -d backend postgres redis

# Später Frontend hinzufügen
docker-compose up -d frontend
```

### 3️⃣ **Startup-Statusmeldungen**

| Service | Port | Healthcheck | Startup-Zeit |
|---------|------|-------------|--------------|
| Backend | 3000 | `GET /health` | 20-30 sec |
| Frontend | 80, 5173 | Nginx läuft | 5-10 sec |
| PostgreSQL | 5432 | `pg_isready` | 10-15 sec |
| Redis | 6379 | `PING` | 5-10 sec |

**Status prüfen:**
```powershell
docker-compose ps

# Ausgabe sollte sein:
# extractor-backend     ... healthy
# extractor-frontend    ... up
# extractor-postgres    ... healthy
# extractor-redis       ... healthy
```

---

## 🧪 Schnelltests (manuelle Verifikation)

### Test 1: Backend Online?
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs?limit=5" -Method GET

# ✅ Erfolg: Status 200, JSON mit "data" und "total"
# ❌ Fehler: Connection refused → Backend startet noch (warten Sie 30 sec)
```

### Test 2: Frontend Online?
```powershell
Invoke-WebRequest -Uri "http://localhost:5173/" -Method GET

# ✅ Erfolg: Status 200, HTML-Seite zurück
# ❌ Fehler: Connection refused → Frontend startet noch (warten Sie 10 sec)
```

### Test 3: Job erstellen (wichtigster Test)
```powershell
$body = @{
  documentContent = "Invoice INV-2026-001 total €1500"
  jobType = "extraction"
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "http://localhost:3000/api/jobs" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# ✅ Erfolg: Status 201, Response enthält "id" und "status": "queued"
# ❌ Fehler: 500 → Logs mit 'docker-compose logs backend' checken
```

---

## 🔍 Fehlerbehandlung

### Backend startet nicht?
```powershell
# Logs anschauen
docker-compose logs backend --tail 50

# Häufige Fehler:
# "Cannot inject dependency" → DI-Container Fehler (sollte nicht mehr vorkommen)
# "relation 'jobs' does not exist" → DB nicht synced
# "connect ECONNREFUSED" → DB/Redis nicht erreichbar
```

### Frontend lädt nicht?
```powershell
# Logs prüfen
docker-compose logs frontend --tail 30

# Typical: "Port 5173 already in use" → Lokaler dev-server läuft
# Kill: Get-Process node | Stop-Process -Force
```

### Datenbank-Probleme?
```powershell
# DB Container neu starten
docker-compose restart postgres
Start-Sleep -Seconds 15

# Oder alles bereinigen und neu starten
docker-compose down -v
docker-compose up -d
```

---

## 📊 Systemstatus

### Status-Dashboard
```powershell
# Schnell alle Infos in einem Command
docker-compose ps; `
echo ""; `
echo "=== Backend API ==="; `
try { (Invoke-WebRequest -Uri "http://localhost:3000/api/jobs?limit=1" -TimeoutSec 3).StatusCode } `
catch { "OFFLINE" }; `
echo ""; `
echo "=== Frontend ==="; `
try { (Invoke-WebRequest -Uri "http://localhost:5173/" -TimeoutSec 3).StatusCode } `
catch { "OFFLINE" }
```

---

## 🛑 Herunterfahren

```powershell
# Elegantes Herunterfahren (behält Daten)
docker-compose down

# Mit Datenlöschung (für frischen Start)
docker-compose down -v

# Nur Services stoppen (behalte Container)
docker-compose stop
```

---

## 📚 Phase 21 Job API Endpoints

Nach dem Start erreichbar:

| Methode | Endpoint | Beschreibung | Status Code |
|---------|----------|-------------|------------|
| POST | `/api/jobs` | Neuen Job erstellen | 201 Created |
| GET | `/api/jobs/{id}` | Job-Status abrufen | 200 OK |
| GET | `/api/jobs/{id}/result` | Extraction-Ergebnis | 200 OK |
| DELETE | `/api/jobs/{id}` | Job stornieren | 200 OK |
| GET | `/api/jobs` | Jobs auflisten | 200 OK |

**Beispiel: Job Liste**
```powershell
curl -X GET http://localhost:3000/api/jobs?limit=10&offset=0
# oder
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" -Method GET | ConvertFrom-Json
```

---

## 🐳 Docker Compose Befehle

```powershell
# Status
docker-compose ps
docker-compose logs backend
docker-compose logs frontend

# Neu starten
docker-compose restart backend

# Neu bauen
docker-compose build --no-cache backend

# Vollreset
docker-compose down -v && docker-compose up -d

# Einzelne Services
docker-compose up -d backend
docker-compose down frontend
docker-compose restart postgres
```

---

## 💾 Persistente Daten

- **PostgreSQL**: `/var/lib/postgresql/data` (Docker Volume)
- **Redis**: `/data` (Docker Volume)
- **Job Results**: `./results` (lokal im Container gemappt)
- **Extraction Rules**: `./extraction-rules` (lokal im Container gemappt)

**Volumes löschen:**
```powershell
docker volume ls | Select-String extractor
docker volume rm extractor_postgres_data extractor_redis_data
```

---

## 🔄 Typischer Workflow

1. **Starten**
   ```powershell
   docker-compose up -d
   Start-Sleep -Seconds 45
   ```

2. **Prüfen**
   ```powershell
   docker-compose ps  # Alle sollten "healthy" sein
   ```

3. **Testen**
   ```powershell
   # Job erstellen
   $body = @{ documentContent = "Rechnung 123" } | ConvertTo-Json
   $job = (Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" -Method POST -Body $body -ContentType "application/json").Content | ConvertFrom-Json
   
   # Status prüfen
   Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/$($job.data.id)" -Method GET
   ```

4. **Herunterfahren** (wenn fertig)
   ```powershell
   docker-compose down
   ```

---

## 📞 Support

Probleme? Check diese Dateien:
- `TROUBLESHOOTING.md` - Häufige Probleme
- `DOCKER_DEPLOYMENT_GUIDE.md` - Docker-spezifische Issues
- Docker Logs: `docker-compose logs [service]`

---

**Fertig! Die App sollte jetzt live sein. 🎉**
