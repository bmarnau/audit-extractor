# 📖 Operationshandbuch - Version 0.21.0

**Version**: 0.21.0  
**Datum**: 2026-07-10  
**Status**: ✅ Produktionsreife (Vorgänger-Version)  
**Phase**: 21 - Asynchrone Job API  
**Zielgruppe**: Endanwender, Administratoren, DevOps, Entwickler

---

⚡ **HINWEIS**: Dies ist die **Vorgänger-Version**. Die **aktuelle Version ist 0.22.0** mit **Job Orchestration & Error Resilience**.

**→ [Zu MANUAL-0.22.0.md wechseln](MANUAL-0.22.0.md)** für die neuesten Features und Best Practices.

---

## 🎯 Was ist neu in Phase 21?

Version 0.21.0 führt **Asynchrone Job API** mit vollständiger Daten-Persistenz ein.

```
Phase 18 (0.18.0):  Docker-Containerisierung
Phase 19 (0.19.0):  Data Persistence
Phase 20 (0.20.0):  Log Viewer & Monitoring  
Phase 21 (0.21.0):  Asynchrone Job Processing ← DIESE VERSION
Phase 22 (0.22.0):  Job Orchestration & Error Resilience ← AKTUELL
  ├─ JobOrchestrator Service
  ├─ 5-Stage Workflow
  ├─ Graceful Degradation
  ├─ Error Tracking
  └─ Debug Mode
```

### Wichtigste Neuerungen in Phase 21

| Feature | Status | Details |
|---------|--------|---------|
| **Job API (REST)** | ✅ | 5 Endpoints für Jobmanagement |
| **Async Processing** | ✅ | Fireand-Forget mit Background Workers |
| **Job Lifecycle** | ✅ | queued → running → completed/failed |
| **Data Persistence** | ✅ | PostgreSQL + Named Volumes |
| **Backup System** | ✅ | Automatisch vor/nach Build |
| **Daten-Sicherung** | ✅ | Schemas, Rules, Results, Backups |
| **Startup Scripts** | ✅ | 15 Skripte für alle Szenarien |
| **Dokumentation** | ✅ | 6 Leitfäden + API-Referenz |

---

## 🚀 Schnellstart (3 Minuten)

### Option 1: Docker Stack (Empfohlen für Produktion)

```powershell
.\start-docker.ps1
```

**Ergebnis nach 45 Sekunden:**
```
Frontend:  http://localhost (80/5173)
Backend:   http://localhost:3000/api
pgAdmin:   http://localhost:5050
Database:  localhost:5432
Cache:     localhost:6379
```

### Option 2: Mit Build und Daten-Persistenz

```powershell
.\build-with-persistence.ps1
```

**Was passiert automatisch:**
1. ✅ Sichert Schemas + Backups
2. ✅ Docker Images neu bauen
3. ✅ Container starten
4. ✅ Daten zurück laden
5. ✅ Alles ist online

### Option 3: Lokal mit npm (für Entwicklung)

```powershell
.\start-app.ps1
```

**Ergebnis:**
- Backend: http://localhost:3000 (Hot-reload aktiv)
- Frontend: http://localhost:5173 (Hot-reload aktiv)
- Schnelle Iteration während Entwicklung

---

## � Referenz-Schemas (Lehr-Beispiele)

Das System wird mit **2 geschützten Referenz-Schemas** initialisiert. Diese können nicht gelöscht werden und dienen als Lehr-Beispiele für Schema-Definition und Extraction-Workflows.

### 1️⃣ Invoice Schema v1.0

**Zweck**: Einfaches und direktes Schema für Rechnungsextraktion  
**Anwendungsfall**: Anfänger, einfache Rechnungen, schnelle Prototypen  
**Schutzstatus**: 🔒 Geschützt (Deletion deaktiviert)

#### Schema-Definition

Das Schema definiert 4 Felder für standardisierte Rechnungs-Extraktion:

```json
{
  "fields": [
    {
      "name": "invoice_number",
      "type": "string",
      "required": true,
      "description": "Eindeutige Rechnungsnummer (z.B. INV-2026-001)"
    },
    {
      "name": "invoice_date",
      "type": "date",
      "required": true,
      "description": "Ausstellungsdatum der Rechnung (ISO 8601: YYYY-MM-DD)"
    },
    {
      "name": "total_amount",
      "type": "number",
      "required": true,
      "description": "Gesamtbetrag inkl. Steuern (z.B. 1299.99)"
    },
    {
      "name": "customer_name",
      "type": "string",
      "required": false,
      "description": "Kundenname oder Firma (optional)"
    }
  ]
}
```

#### Anwendungsbeispiel

**Beispiel-Dokument (PDF/Bild):**
```
═══════════════════════════════════
RECHNUNG
═══════════════════════════════════
Rechnungsnummer: INV-2026-00147
Datum: 10.07.2026

Rechnungsempfänger:
Firma XYZ GmbH
Hauptstraße 42
10115 Berlin

═══════════════════════════════════
GESAMTBETRAG: EUR 2.499,99
═══════════════════════════════════
```

**Extraction-Ergebnis (JSON):**
```json
{
  "extractedFields": {
    "invoice_number": "INV-2026-00147",
    "invoice_date": "2026-07-10",
    "total_amount": 2499.99,
    "customer_name": "Firma XYZ GmbH"
  },
  "confidence": {
    "invoice_number": 0.98,
    "invoice_date": 0.99,
    "total_amount": 0.97,
    "customer_name": 0.85
  },
  "coverage": 100,
  "warnings": []
}
```

#### Wann zu verwenden

✅ **Ideal für:**
- Anfänger die Schemas lernen möchten
- Einfache Rechnungsextraktion ohne komplexe Struktur
- Schnelle Prototypen und Tests
- Lehrmaterial und Dokumentation

❌ **Nicht geeignet für:**
- Komplexe Rechnungen mit mehreren Positionen (Items)
- Mehrseitige Dokumente
- Strukturierte Tabellen-Extraktion
- Kundenspezifische Anforderungen

---

### 2️⃣ JSON Schema Reference

**Zweck**: Fortgeschrittenes Schema mit JSON Schema Standard und Validierung  
**Anwendungsfall**: Komplexe Strukturen, Validierung, Mehrseitige Dokumente  
**Schutzstatus**: 🔒 Geschützt (Deletion deaktiviert)

#### Schema-Definition

JSON Schema Draft 7 Format mit erweiterten Validierungsregeln:

```json
{
  "type": "object",
  "required": ["invoiceNumber", "date", "amount", "vendor"],
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "pattern": "^INV-\\d{6}$",
      "description": "Rechnungsnummer im Format INV-XXXXXX"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Ausstellungsdatum (ISO 8601)"
    },
    "vendor": {
      "type": "string",
      "minLength": 1,
      "description": "Name des Rechnungsstellers"
    },
    "amount": {
      "type": "number",
      "minimum": 0,
      "description": "Gesamtbetrag in Euro"
    },
    "items": {
      "type": "array",
      "description": "Rechnungspositionen",
      "items": {
        "type": "object",
        "required": ["description", "quantity", "price"],
        "properties": {
          "description": {
            "type": "string",
            "description": "Artikelbeschreibung"
          },
          "quantity": {
            "type": "number",
            "minimum": 0.01,
            "description": "Menge"
          },
          "price": {
            "type": "number",
            "minimum": 0,
            "description": "Einzelpreis"
          }
        }
      }
    }
  }
}
```

#### Anwendungsbeispiel

**Komplexes Beispiel-Dokument:**
```
═════════════════════════════════════════════════════════
RECHNUNG / INVOICE
═════════════════════════════════════════════════════════

Rechnungsnummer / Invoice Number: INV-202647
Datum / Date: 10.07.2026

Rechnungssteller / Vendor:
TechCorp Solutions AG
Innovationspark 15
80939 München

═════════════════════════════════════════════════════════
POSITIONEN / ITEMS
═════════════════════════════════════════════════════════

Pos | Beschreibung              | Menge | Einzelpreis | Betrag
----+---------------------------+-------+-------------+----------
 1  | Lizenz Professional        |   2  |   799,99    | 1599,98
 2  | Implementierungsservice    |  40  |   125,00    | 5000,00
 3  | Dokumentation (1 Jahr)     |   1  |   299,99    |  299,99

═════════════════════════════════════════════════════════
ENDSUMME: EUR 6.899,97
═════════════════════════════════════════════════════════
```

**Extraction-Ergebnis (JSON):**
```json
{
  "extractedFields": {
    "invoiceNumber": "INV-202647",
    "date": "2026-07-10",
    "vendor": "TechCorp Solutions AG",
    "amount": 6899.97,
    "items": [
      {
        "description": "Lizenz Professional",
        "quantity": 2,
        "price": 799.99
      },
      {
        "description": "Implementierungsservice",
        "quantity": 40,
        "price": 125.00
      },
      {
        "description": "Dokumentation (1 Jahr)",
        "quantity": 1,
        "price": 299.99
      }
    ]
  },
  "validation": {
    "schemaValid": true,
    "requiredFieldsMissing": [],
    "patternViolations": []
  },
  "coverage": 100,
  "confidence": 0.96
}
```

#### Wann zu verwenden

✅ **Ideal für:**
- Mehrseitige Rechnungen mit Items/Positionen
- Strukturierte Daten mit Arrays
- Validierung gegen JSON Schema
- Produktionsszenarien
- Erweiterte Workflows

❌ **Nicht geeignet für:**
- Einfache Formulare (zu aufwendig)
- Anfänger-Lernmaterial (komplexe Struktur)
- Dokumente ohne Tabellenstruktur

---

### 🛡️ Schema-Schutz

Beide Referenz-Schemas sind **geschützt** und können nicht gelöscht werden:

```powershell
# Versuch zu löschen → 403 Forbidden
DELETE http://localhost:3000/api/schema/550e8400-e29b-41d4-a716-446655440000

# Response:
{
  "error": "Cannot delete protected schema",
  "message": "This schema is protected and cannot be deleted",
  "schemaId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Eigene Schemas erstellen**: Sie können beliebig viele Schemas erstellen, die nicht geschützt sind und normal gelöscht werden können.

---

## �📋 Job API - Die neuen Endpoints

### Übersicht

```
POST   /api/jobs              → Neuen Job erstellen (201 Created)
GET    /api/jobs/{id}         → Job-Details abrufen (200 OK)
GET    /api/jobs/{id}/result  → Extraction-Ergebnis (200 OK)
DELETE /api/jobs/{id}         → Job stornieren (200 OK)
GET    /api/jobs              → Jobs auflisten mit Pagination (200 OK)
```

### Beispiel 1: Neuen Job erstellen

```powershell
$job = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"documentContent":"Invoice #123 Total €1500"}' | ConvertFrom-Json

$jobId = $job.data.id
write-host "Job erstellt: $jobId"
write-host "Status: $($job.data.status)"
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "requestedAt": "2026-07-10T17:00:00.000Z"
  },
  "timestamp": "2026-07-10T17:00:00.000Z",
  "path": "/api/jobs",
  "duration": 15
}
```

### Beispiel 2: Job-Status abfragen

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/$jobId" `
  -Method GET | ConvertFrom-Json

write-host "Status: $($response.data.status)"
write-host "Gestartet: $($response.data.startedAt)"
write-host "Dauer: $($response.data.duration)ms"
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "requestedAt": "2026-07-10T17:00:00.000Z",
    "startedAt": "2026-07-10T17:00:00.500Z",
    "completedAt": "2026-07-10T17:00:05.000Z",
    "duration": 4500,
    "resultData": {
      "fields": {
        "invoice_number": "123",
        "total_amount": "1500"
      }
    }
  },
  "timestamp": "2026-07-10T17:00:05.200Z",
  "path": "/api/jobs/550e8400...",
  "duration": 8
}
```

### Beispiel 3: Job-Ergebnis abrufen

```powershell
$result = Invoke-WebRequest `
  -Uri "http://localhost:3000/api/jobs/$jobId/result" `
  -Method GET | ConvertFrom-Json

# Bei Erfolg:
if ($result.data.resultData) {
  write-host "Extraction erfolgreich!"
  $result.data.resultData | ConvertTo-Json | write-host
}

# Bei Fehler:
if ($result.data.error) {
  write-host "Job fehlgeschlagen: $($result.data.errorMessage)"
}
```

### Beispiel 4: Job stornieren

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/$jobId" `
  -Method DELETE | ConvertFrom-Json
```

### Beispiel 5: Jobs auflisten

```powershell
$list = Invoke-WebRequest `
  -Uri "http://localhost:3000/api/jobs?limit=10&offset=0&status=completed" `
  -Method GET | ConvertFrom-Json

write-host "Gefundene Jobs: $($list.data.total)"
$list.data.jobs | ForEach-Object {
  write-host "$($_.id) - $($_.status) - $($_.duration)ms"
}
```

---

## 🔄 Daten-Persistenz: Backup-Workflow

### Szenario: Sie haben Code geändert und möchten neu bauen

**Problem ohne Persistenz:**
```
Alte Daten weg!
docker-compose down -v
← PostgreSQL Data gelöscht
← Redis Cache gelöscht
← Alle Jobs verloren!
```

**Lösung mit Phase 21:**

```powershell
# Automatisch - 1 Command für alles!
.\build-with-persistence.ps1

# Oder Manual in Schritten:
.\backup-before-build.ps1      # Sichert Schemas + Backups
docker-compose build backend   # Nur Backend neu bauen
docker-compose up -d           # Container starten
.\restore-after-build.ps1      # Daten zurück
```

### Backup Struktur

```
data-backups/
└── 20260710_155130/
    ├── schemas/              # 35 Dateien
    ├── backups/              # 5 Dateien
    ├── extraction-rules/     # 14 Dateien
    ├── results/              # Job-Results
    └── metadata.json         # Backup-Info mit Timestamp
```

### PostgreSQL & Redis Persistierung

```
Docker Named Volumes (Automatisch):
- extractor_postgres_data  → PostgreSQL Daten
- extractor_redis_data     → Redis Snapshots
- extractor_pgadmin_data   → pgAdmin Konfiguration

→ Diese Volumes ÜBERLEBEN docker-compose down!
→ Nur mit 'docker volume rm' löschbar
```

---

## 📚 Alle Startup Befehle

### Docker Stack (5 Skripte)

| Befehl | Zweck | Zeit |
|--------|-------|------|
| `.\start-docker.ps1` | Docker-Stack starten | 45s |
| `.\start-docker.cmd` | Docker-Stack starten (CMD) | 45s |
| `.\stop-docker.ps1` | Docker-Stack stoppen | 10s |
| `.\stop-docker.cmd` | Docker-Stack stoppen (CMD) | 10s |
| `docker-compose ps` | Status prüfen | <1s |

### Lokale Entwicklung npm (5 Skripte)

| Befehl | Zweck | Zeit |
|--------|-------|------|
| `.\start-app.ps1` | Backend + Frontend lokal starten | 30s |
| `.\start-app.cmd` | Backend + Frontend lokal starten (CMD) | 30s |
| `.\start-services.ps1` | Nur bestimmten Service starten | 15s |
| `.\stop-app.ps1` | Lokale Services stoppen | 5s |
| `.\stop-app.cmd` | Lokale Services stoppen (CMD) | 5s |

### Backup & Build (5 Skripte)

| Befehl | Zweck | Zeit |
|--------|-------|------|
| `.\backup-before-build.ps1` | Daten vor Rebuild sichern | 5s |
| `.\restore-after-build.ps1` | Daten nach Rebuild laden | 5s |
| `.\build-with-persistence.ps1` | Alles automatisch (Backup→Build→Restore) | 3-5min |
| `docker-compose build` | Manueller Build | 2-3min |
| `docker-compose up -d` | Manueller Start | <1min |

### Dokumentation (6 Dateien)

| Datei | Inhalt |
|-------|--------|
| `START_PHASE_21.md` | Schnellstart Guide |
| `STARTUP_COMMANDS_REFERENCE.md` | Alle 15 Befehle dokumentiert |
| `DOCKER_VOLUMES_REFERENCE.md` | Volume-System erklärt |
| `API_REFERENCE.md` | Job API Endpoints |
| `DOCKER_DEPLOYMENT_GUIDE.md` | Production Deployment |
| `MANUAL-0.21.0.md` | Dieses Dokument |

---

## 🔍 Monitoring & Troubleshooting

### Status überprüfen

```powershell
# Alle Container
docker-compose ps

# Logs Backend
docker-compose logs backend --tail 50

# Logs alle
docker-compose logs -f

# Health-Status
docker ps --format="table {{.Names}}\t{{.Status}}"
```

### Häufige Probleme

**Problem: "connection refused" auf Port 3000**
```powershell
# Fehler: Backend startet nicht?
docker-compose logs backend | Select-String "error"

# Lösungen:
1. Port 3000 schon belegt?
   netstat -ano | findstr :3000

2. Docker Rebuild:
   docker-compose build --no-cache backend
   docker-compose up -d backend

3. Volumes prüfen:
   docker volume ls
```

**Problem: PostgreSQL Fehler "relation 'jobs' does not exist"**
```powershell
# Fehler: Tabelle nicht erstellt?
# Ursache: NODE_ENV war nicht auf "development"

# Lösung: docker-compose.yml prüfen:
# backend:
#   environment:
#     NODE_ENV: development  ← MUSS sein!
```

**Problem: Frontend laden nicht**
```powershell
# Port 80 schon belegt?
netstat -ano | findstr :80

# Nginx in Container Fehler?
docker-compose logs frontend

# Rebuild:
docker-compose build --no-cache frontend
```

---

## 🎯 Best Practices

### 1. Immer Backup vor großem Change

```powershell
.\backup-before-build.ps1
# → Speichert in data-backups/TIMESTAMP/

# Dann können Sie sicher arbeiten:
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Und Daten zurück:
.\restore-after-build.ps1
```

### 2. Mit -DryRun testen

```powershell
# Schauen was wird wiederhergestellt (keine echten Änderungen):
.\restore-after-build.ps1 -DryRun
```

### 3. Getrennt arbeiten (Backend vs Frontend)

```powershell
# Wenn nur Backend sich ändert:
.\build-with-persistence.ps1 -Services Backend -NoCache
# → Schneller (Frontend wird nicht neu gebaut)
```

### 4. Regelmäßig aufräumen

```powershell
# Alte Backups ansehen:
dir data-backups/ | Select-Object Name, LastWriteTime

# Alte Dateien archivieren:
.\archive-obsolete.ps1
```

---

## 📊 Systemanforderungen

### Minimum

- Docker Desktop 4.10+
- 4GB RAM (Docker)
- 10GB Festplatte (Images + Volumes)
- Windows 10/11 oder Linux

### Empfohlen für Produktion

- Docker Desktop 4.20+
- 8GB RAM (Docker)
- 50GB Festplatte
- SSD für PostgreSQL
- Stable Internet für Image Pulls

---

## 🔐 Sicherheit

### Production Checkliste

- [ ] Passwörter in `.env.production` ändern
- [ ] CORS_ORIGIN anpassen
- [ ] API_KEY für externe Services setzen
- [ ] Database Backups einrichten
- [ ] Health-Checks überprüfen
- [ ] Logs monitoren
- [ ] Rate-Limiting konfigurieren

### Sicherheitstipps

```
DON'T:
✗ `.env` Dateien in Git committen
✗ Passwörter in docker-compose.yml
✗ Backend offen ins Internet
✗ Default pgAdmin Password behalten

DO:
✓ `.env.example` Template halten
✓ Secrets via Docker Secrets oder Vault
✓ Reverse-Proxy vor Backend
✓ pgAdmin nur lokal erreichbar
```

---

## 📞 Support

### Dokumentation lesen

1. **START_PHASE_21.md** - Für schnellen Anfang
2. **STARTUP_COMMANDS_REFERENCE.md** - Für alle Befehle
3. **DOCKER_VOLUMES_REFERENCE.md** - Für Daten-Persistenz
4. **API_REFERENCE.md** - Für Job API Endpoints

### Logs prüfen

```powershell
docker-compose logs [service] --tail 100
docker-compose logs backend --follow
```

### Docker Prüfen

```powershell
docker --version
docker-compose --version
docker ps
docker images
```

---

## 📝 Changelog Phase 21

**Neue Features:**
- ✅ Asynchrone Job API (5 REST Endpoints)
- ✅ Backup/Restore System vor Build
- ✅ Automatische Daten-Persistenz
- ✅ 15 Startup/Stop Befehle
- ✅ 6 Leitfäden + API-Dokumentation

**Verbessert in Phase 21:**
- ✅ Docker Volumes mit Labels
- ✅ Read-Only Flags für Sicherheit
- ✅ Health-Checks für alle Services
- ✅ Bessere Error-Messages
- ✅ Kürzere Startup-Zeit (45s)

**Rückwärts kompatibel:**
- ✅ Phase 18/19/20 Datenstrukturen
- ✅ Alte Volumes werden erkannt
- ✅ Alte docker-compose.yml upgrade-bar

---

**Viel Erfolg bei der Nutzung von Phase 21! 🚀**

Bei Fragen: Siehe Dokumentation oder `docker-compose logs`
