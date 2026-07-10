# 📖 Operationshandbuch - Version 0.18.0

**Version**: 0.18.0  
**Datum**: 8.7.2026  
**Status**: ✅ Produktionsreife  
**Phase**: 18 - Docker Containerization  
**Zielgruppe**: Endanwender, Administratoren, DevOps

---

## 🎯 Überblick: Was ist neu in 0.18.0?

Version 0.18.0 führt **vollständige Docker-Containerisierung** ein. Das komplette System (Frontend, Backend, Datenbank, Cache) läuft jetzt in isolierten Containern.

```
Alt (0.17.0):
  npm install → npm run build → npm run dev → Lokale Installation

Neu (0.18.0):
  docker-compose up -d → Alles läuft in Containern → Production-Ready!
```

### Wichtigste Neuerungen

| Feature | Status |
|---------|--------|
| **Docker Backend** | ✅ Multi-Stage Build, ~250MB |
| **Docker Frontend** | ✅ Nginx Reverse Proxy, ~20MB |
| **Docker Compose Stack** | ✅ 5 Services (Backend, Frontend, Postgres, Redis, pgAdmin) |
| **Startup Skripte** | ✅ Windows .cmd + PowerShell .ps1 |
| **Vollständige Dokumentation** | ✅ 3 Guide-Dateien |

---

## 🚀 Schnellstart (5 Minuten)

### Option 1: Windows CMD (Empfohlen)

```cmd
cd c:\Users\bmarn\OneDrive\HTML\extractor
start-docker.cmd
```

**Was passiert:**
1. Docker & Docker Compose werden überprüft
2. Alle 5 Services werden gestartet
3. Health Checks prüfen ob alles läuft
4. URLs werden angezeigt

**Ergebnis:**
```
✓ Frontend:   http://localhost
✓ Backend:    http://localhost:3000/api
✓ pgAdmin:    http://localhost:5050
✓ PostgreSQL: localhost:5432
✓ Redis:      localhost:6379
```

### Option 2: PowerShell (Mit mehr Optionen)

```powershell
# Standard-Start mit Logs
.\start-docker.ps1

# Mit Rebuild aller Images
.\start-docker.ps1 -Rebuild

# Mit Live-Logs anzeigen
.\start-docker.ps1 -ShowLogs
```

### Option 3: Manuell (Docker Compose)

```bash
# Alle Services starten
docker-compose up -d

# Status prüfen
docker-compose ps

# Logs ansehen
docker-compose logs -f backend
```

### Option 4: Lokale Entwicklung (npm, ohne Docker)

```powershell
# Windows PowerShell
.\start-app.ps1

# Oder manuell 2 Terminal-Fenster:
# Terminal 1 - Backend (Port 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (Port 5173)
cd frontend
npm run dev
```

⚠️ **Voraussetzung**: Node.js 18+, npm, lokale PostgreSQL (falls ohne Docker-DB)

---

## 📍 Zugriffspunkte

Nach dem Start sind folgende Services erreichbar:

### Frontend (React)
- **URL**: http://localhost
- **Port**: 80
- **Browser öffnen**: `start http://localhost`
- **Status**: http://localhost/index.html (Nginx)

### Backend API (Node.js/Express)
- **URL**: http://localhost:3000/api
- **Port**: 3000
- **Health Check**: `curl http://localhost:3000/api/health`
- **Dokumentation**: [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)

### pgAdmin (Datenbank-UI)
- **URL**: http://localhost:5050
- **Email**: admin@extractor.local
- **Passwort**: admin-pass
- **Verwendung**: Schema-Verwaltung, Queries, Monitoring

### PostgreSQL (Direkter Zugriff)
- **Host**: localhost
- **Port**: 5432
- **Benutzer**: extractor_user
- **Passwort**: extractor_pass
- **Datenbank**: extractor_db
- **Tool**: DBeaver, pgAdmin, oder `psql` CLI

### Redis (Cache)
- **Host**: localhost
- **Port**: 6379
- **Verwendung**: Session-Caching, Performance-Optimierung

---

## 🔧 Häufige Aufgaben

### 1. Logs ansehen

```bash
# Alle Services zusammen
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend  
docker-compose logs -f frontend

# Letzte 50 Zeilen
docker-compose logs --tail=50
```

### 2. Service neu starten

```bash
# Alle Services
docker-compose restart

# Einzeln
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### 3. Services neu bauen und starten

```bash
# Alle neu bauen
docker-compose up -d --build

# Nur Backend
docker-compose build backend && docker-compose up -d backend

# Ohne Cache (kompletter Rebuild)
docker-compose build --no-cache backend
```

### 4. Services stoppen

#### Option 1: Automatisierte Stop-Skripte (Empfohlen)

**Docker stoppen (mit Option zum Löschen von Volumes):**
```cmd
# Windows CMD
stop-docker.cmd

# PowerShell
.\stop-docker.ps1              # Normalerweise stoppen
.\stop-docker.ps1 -RemoveVolumes  # Mit Datenlöschung
```

#### Option 2: Manuelle Befehle

```bash
# Alle pausieren (Container bleiben)
docker-compose stop

# Alle stoppen & Container löschen (Daten bleiben!)
docker-compose down

# Alles inklusive Daten löschen (⚠️ VORSICHT!)
docker-compose down -v
```

#### Option 3: Lokale Entwicklung stoppen

Falls Sie lokal (ohne Docker) arbeiten:
```cmd
# Windows CMD
stop-app.cmd

# PowerShell
.\stop-app.ps1
```

Dies killt alle Node.js Prozesse auf Port 3000 (Backend) und 5173 (Frontend).

### 5. Datenbank-Backup

```bash
# Backup erstellen
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup-$(date +%Y%m%d).sql

# Backup restore
cat backup-20260708.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

### 6. Container-Shell öffnen

```bash
# Backend-Shell
docker-compose exec backend sh

# Datenbank-Shell
docker-compose exec postgres psql -U extractor_user -d extractor_db

# Frontend-Shell
docker-compose exec frontend sh
```

---

## 🐛 Fehlerbehebung

### Problem: "Docker nicht installiert"

**Lösung:**
```bash
# Windows: Docker Desktop installieren
https://www.docker.com/products/docker-desktop

# Linux (Ubuntu/Debian):
sudo apt-get install docker.io docker-compose

# Verifizieren:
docker --version
docker-compose --version
```

### Problem: "Port bereits in Gebrauch"

**Symptom**: Fehler wie `Error response from daemon: Ports are not available`

**Lösung 1 - Port ändern:**
Edit `docker-compose.yml`:
```yaml
backend:
  ports:
    - "3001:3000"  # Ändere 3000 zu 3001

frontend:
  ports:
    - "8080:80"    # Ändere 80 zu 8080
```

**Lösung 2 - Prozess beenden:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Problem: Backend antwortet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Container inspizieren
docker inspect extractor-backend

# Neu starten
docker-compose restart backend

# Komplett neu bauen
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Problem: Frontend zeigt Fehler

```bash
# Nginx Logs
docker-compose logs frontend

# Container-Shell öffnen
docker-compose exec frontend sh

# Files überprüfen
docker-compose exec frontend ls -la /usr/share/nginx/html

# Nginx Test
docker-compose exec frontend nginx -t
```

### Problem: Datenbank-Fehler

```bash
# PostgreSQL Status
docker-compose logs postgres

# Datenbank testen
docker-compose exec postgres pg_isready -U extractor_user

# Verbindung testen
curl http://localhost:3000/api/health  # Backend Health Check
```

---

## 📊 Systemüberblick

### Architektur

```
┌─────────────────────────────────────┐
│   Browser / Local Client            │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼────┐
   │Frontend   │        │Backend   │
   │(Nginx)    │◄──────►│(Node.js) │
   │Port: 80   │        │Port:3000 │
   └───────────┘        └────┬─────┘
                             │
        ┌────────────┬────────┼────────┬──────────┐
        │            │        │        │          │
   ┌────▼──┐  ┌──────▼──┐ ┌──▼──┐ ┌──▼──┐ ┌────▼────┐
   │Postgres│  │ Redis  │ │Files│ │Logs │ │Results  │
   │:5432   │  │ :6379  │ │Data │ │Audit│ │Storage  │
   └────────┘  └────────┘ └─────┘ └─────┘ └─────────┘
        │
   ┌────▼─────┐
   │ pgAdmin  │
   │ :5050    │
   └──────────┘
```

### Services

| Service | Image | Port | Funktion |
|---------|-------|------|----------|
| **Backend** | Node 20 | 3000 | REST API, Document Processing |
| **Frontend** | Nginx | 80 | React SPA, UI |
| **PostgreSQL** | PG 15 | 5432 | Persistente Datenbank |
| **Redis** | Redis 7 | 6379 | Cache & Sessions |
| **pgAdmin** | pgAdmin | 5050 | DB Management UI |

### Volumes (Persistente Speicherung)

```bash
# Vor Neustart bleiben erhalten:
- postgres_data       → Alle Datenbank-Inhalte
- pgadmin_data       → pgAdmin Konfiguration
- redis_data         → Redis Persistierung
- ./extraction-rules  → Extraktionsregeln
- ./results          → Extraktions-Ergebnisse
- ./schemas          → Hochgeladene Schemas
- ./source-documents → Quell-Dokumente
```

---

## � Docker Container-Architektur & Migration

### Container-Namen und Speicherpfade

Alle Container laufen in einem gemeinsamen Docker Network und sind wie folgt konfiguriert:

#### Container-Namen im System

| Container | Name | Netzwerk-Hostname | Status |
|-----------|------|------------------|--------|
| **Backend** | `extractor-backend` | `backend:3000` | Node.js API Server |
| **Frontend** | `extractor-frontend` | `frontend:80` | Nginx Reverse Proxy |
| **Datenbank** | `extractor-postgres` | `postgres:5432` | PostgreSQL 15 |
| **Cache** | `extractor-redis` | `redis:6379` | Redis 7 |
| **Admin** | `extractor-pgadmin` | `pgadmin:5050` | pgAdmin Web UI |

**Docker Network**: `extractor-network` (172.20.0.0/16)

#### Container-Filesystem-Struktur

```
Jeder Container hat sein eigenes Filesystem:

Backend Container (/app):
├── src/                           # TypeScript Source Code
├── dist/                          # Compiled JavaScript
├── extraction-rules/              # Extraktionsregeln (Bind Mount)
├── results/                       # Extraktions-Ergebnisse (Bind Mount)
├── schemas/                       # Hochgeladene Schemas (Bind Mount)
├── source-documents/              # Quell-Dokumente (Bind Mount)
├── backups/                       # Backup-Dateien (Named Volume)
├── MANUAL-0.18.0.md              # Diese Dokumentation
├── RELEASE_NOTES_0.18.0.md       # Release Notes
└── node_modules/                  # Dependencies

Frontend Container (/usr/share/nginx/html):
├── index.html                     # React SPA Entry Point
├── assets/                        # Bundled JavaScript/CSS
└── ...                            # Andere static Files

PostgreSQL Container (/var/lib/postgresql):
├── data/                          # Datenbank-Dateien
└── ...

Redis Container (/data):
├── dump.rdb                       # Persistente Data (Optional)
└── ...
```

#### Named Volumes (Persistente Speicherung)

Diese Volumes speichern Daten über Container-Neustarts hinweg:

```yaml
postgres_data:
  - Speicherort (Host): 
    Windows: %ProgramData%\Docker\volumes\extractor_postgres_data\_data
    Linux: /var/lib/docker/volumes/extractor_postgres_data/_data
  - Inhalt: PostgreSQL Datenbank-Dateien
  - Größe: ~500MB (typisch)

redis_data:
  - Speicherort: %ProgramData%\Docker\volumes\extractor_redis_data\_data
  - Inhalt: Redis Persistierung (RDB)
  - Größe: ~50MB

pgadmin_data:
  - Speicherort: %ProgramData%\Docker\volumes\extractor_pgadmin_data\_data
  - Inhalt: pgAdmin Konfiguration und Server-Definitionen
  - Größe: ~20MB
```

#### Bind Mounts (Host-Verzeichnis)

Diese Ordner sind direkt im Projekt gespeichert (Host-Dateisystem):

```bash
c:\Users\bmarn\OneDrive\HTML\extractor\
├── extraction-rules/      # Rules (.txt, .json Dateien)
├── results/              # Extraktions-Ergebnisse (.json)
├── schemas/              # Hochgeladene Schemas (.json)
└── source-documents/     # Quelldateien (.pdf, .docx, .html)
    ├── pdf/
    ├── docx/
    └── html/
```

**Diese Dateien bleiben auf dem Host erhalten, auch wenn Container gelöscht werden!**

#### Speicherorte für verschiedene Datentypen

| Datentyp | Speicherort | Typ | Persistiert |
|----------|------------|------|------------|
| Datenbank | Named Volume `postgres_data` | Container | ✅ Ja |
| Cache | Named Volume `redis_data` | Container | ✅ Teilweise |
| Extraktionsregeln | `./extraction-rules/` | Bind Mount | ✅ Ja |
| Ergebnisse | `./results/` | Bind Mount | ✅ Ja |
| Hochgeladene Schemas | `./schemas/` | Bind Mount | ✅ Ja |
| Quelldokumente | `./source-documents/` | Bind Mount | ✅ Ja |
| Logs | Container Stdout | Ephemeral | ❌ Nein |

### Docker Container auf anderen Host migrieren

#### Vorbereitung: Kompletter Export

**Schritt 1: Alle Daten sichern**

```bash
# 1. Datenbank-Backup
docker-compose exec postgres pg_dump -U extractor_user extractor_db > db-backup.sql

# 2. Redis-Daten
docker-compose exec redis redis-cli BGSAVE

# 3. Alle Bind Mounts in ZIP-Datei
# Windows (PowerShell):
Compress-Archive -Path extraction-rules, results, schemas, source-documents -DestinationPath extractor-data.zip

# Linux/Mac:
zip -r extractor-data.zip extraction-rules results schemas source-documents
```

**Schritt 2: Named Volumes exportieren**

```bash
# Volumes als Tarball exportieren
docker run --rm -v extractor_postgres_data:/data -v $(pwd):/backup busybox tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v extractor_redis_data:/data -v $(pwd):/backup busybox tar czf /backup/redis_data.tar.gz -C /data .
docker run --rm -v extractor_pgadmin_data:/data -v $(pwd):/backup busybox tar czf /backup/pgadmin_data.tar.gz -C /data .

# Oder einfacher: Backup-Skript
docker-compose exec postgres pg_dump -U extractor_user extractor_db | gzip > db-backup.sql.gz
```

**Schritt 3: Docker Images exportieren**

```bash
# Alle Images speichern
docker save extractor-backend extractor-frontend -o extractor-images.tar

# Images komprimieren (Optional, spart Speicher)
docker save extractor-backend extractor-frontend | gzip > extractor-images.tar.gz
```

#### Migration auf anderem Host

**Schritt 1: Dateien kopieren**

```bash
# Alle notwendigen Dateien auf neuen Host kopieren:
- docker-compose.yml              (Service-Definition)
- Dockerfile.backend              (Backend Build-Rezept)
- Dockerfile.frontend             (Frontend Build-Rezept)
- frontend/nginx.conf             (Nginx-Konfiguration)
- db-backup.sql                   (Datenbank)
- extractor-data.zip              (Arbeitsdaten)
- extractor-images.tar.gz         (Docker Images - Optional)

# Windows (PowerShell):
scp -r c:\Users\bmarn\OneDrive\HTML\extractor newhost:/opt/extractor/

# oder via USB/Cloud:
# 1. ZIP-Dateien erstellen und auf Cloud hochladen (Google Drive, OneDrive, S3)
# 2. Auf neuem Host herunterladen
```

**Schritt 2: Auf neuem Host vorbereiten**

```bash
# Verzeichnis-Struktur erstellen
mkdir -p /opt/extractor/extraction-rules
mkdir -p /opt/extractor/results
mkdir -p /opt/extractor/schemas
mkdir -p /opt/extractor/source-documents

# Daten entpacken
unzip extractor-data.zip -d /opt/extractor/
cd /opt/extractor/
```

**Schritt 3: Images laden (falls exportiert)**

```bash
# Falls als Tarball exportiert:
docker load -i extractor-images.tar.gz

# Falls nicht exportiert (normal): Neu bauen
docker-compose build
```

**Schritt 4: Services starten**

```bash
# Services mit den gesicherten Daten starten
docker-compose up -d

# Datenbank restore (falls nur SQL-Backup)
cat db-backup.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

**Schritt 5: Verifikation**

```bash
# Services prüfen
docker-compose ps

# Backend Health Check
curl http://localhost:3000/api/health

# Datenbank-Verbindung testen
docker-compose exec postgres pg_isready -U extractor_user

# Daten verifizieren (sollte 2+ Backups zeigen)
curl http://localhost/api/backup/list
```

#### Checkliste für Migration

- [ ] Datenbank-Backup erstellt: `db-backup.sql`
- [ ] Bind Mounts gepackt: `extractor-data.zip`
- [ ] Images exportiert: `extractor-images.tar.gz` (Optional)
- [ ] `docker-compose.yml` kopiert
- [ ] Alle Dockerfiles kopiert
- [ ] Nginx Config kopiert: `frontend/nginx.conf`
- [ ] Docker auf neuem Host installiert
- [ ] Dateien auf neuem Host entpackt
- [ ] Services gestartet: `docker-compose up -d`
- [ ] Health Checks bestätigt ✅

---

## 📊 Vollständiger Extraction-Workflow für Reportingsystem

### Szenario: Automatische Rechnungs-Extraktion

Sie haben mehrere Rechnungen (PDF) und möchten ein Reporting-System automatisch speisen mit:
- Rechnungsnummer
- Kundennamen
- Rechnungsbetrag
- Zahlungsfälligkeitsdatum

**Alle Schritte mit dem System:**

### Phase 1: Schema definieren

**1.1 Schema erstellen (UI oder API)**

Navigieren zu: http://localhost/schemas

Oder via API:
```bash
curl -X POST http://localhost/api/schema/upload \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invoice_Report_Schema",
    "version": "1.0",
    "fields": [
      {
        "fieldName": "invoiceNumber",
        "type": "string",
        "isRequired": true,
        "pattern": "^[0-9]{6,12}$",
        "confidence": 0.95
      },
      {
        "fieldName": "customerName",
        "type": "string",
        "isRequired": true,
        "confidence": 0.90
      },
      {
        "fieldName": "invoiceAmount",
        "type": "number",
        "isRequired": true,
        "pattern": "^[0-9]{1,10}\\.[0-9]{2}$",
        "confidence": 0.98
      },
      {
        "fieldName": "dueDate",
        "type": "date",
        "isRequired": true,
        "pattern": "^\\d{2}\\.\\d{2}\\.\\d{4}$",
        "confidence": 0.92
      }
    ],
    "documentType": "invoice"
  }'
```

**Rückgabe:**
```json
{
  "schemaId": "schema-12345",
  "version": "1.0",
  "fieldCount": 4,
  "created": "2026-07-09T12:30:00Z"
}
```

### Phase 2: Extraktionsregeln generieren

**2.1 Automatische Regel-Generierung**

```bash
curl -X POST http://localhost/api/schema/schema-12345/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "pattern-matching",
    "sampleDocuments": [
      {
        "path": "./source-documents/pdf/invoice-sample-1.pdf",
        "knownValues": {
          "invoiceNumber": "2026-001234",
          "customerName": "Acme Corp GmbH",
          "invoiceAmount": "15999.99",
          "dueDate": "15.08.2026"
        }
      },
      {
        "path": "./source-documents/pdf/invoice-sample-2.pdf",
        "knownValues": {
          "invoiceNumber": "2026-001235",
          "customerName": "Tech Solutions LLC",
          "invoiceAmount": "8500.50",
          "dueDate": "20.08.2026"
        }
      }
    ]
  }'
```

**Rückgabe:**
```json
{
  "rulesId": "rules-invoice-v1",
  "generatedRules": 4,
  "accuracy": 0.945,
  "rules": [
    {
      "field": "invoiceNumber",
      "pattern": "Rechnungsnr\\.?.*?([0-9]{6,12})",
      "confidence": 0.98
    },
    {
      "field": "customerName",
      "pattern": "^Kunde.*?:\\s*(.+?)\\n",
      "confidence": 0.92
    },
    ...
  ]
}
```

### Phase 3: Batch-Extraktion durchführen

**3.1 Mehrere Rechnungen verarbeiten**

```bash
# Für alle PDFs im Verzeichnis
for file in ./source-documents/pdf/*.pdf; do
  echo "Extrahiere: $file"
  curl -X POST http://localhost/api/extract/pdf \
    -F "file=@$file" \
    -F "schemaId=schema-12345" \
    -F "rulesId=rules-invoice-v1" \
    > results/$(basename $file .pdf).json
done
```

**Oder als Single API-Call:**

```bash
curl -X POST http://localhost/api/extract/batch \
  -H "Content-Type: application/json" \
  -d '{
    "schemaId": "schema-12345",
    "rulesId": "rules-invoice-v1",
    "files": [
      "./source-documents/pdf/invoice-2026-001234.pdf",
      "./source-documents/pdf/invoice-2026-001235.pdf",
      "./source-documents/pdf/invoice-2026-001236.pdf"
    ],
    "outputFormat": "json",
    "includeAuditTrail": true,
    "includeConfidence": true
  }'
```

**Rückgabe (für jede Datei):**
```json
{
  "fileId": "file-12345",
  "fileName": "invoice-2026-001234.pdf",
  "status": "success",
  "extractedData": {
    "invoiceNumber": {
      "value": "2026-001234",
      "confidence": 0.99,
      "source": "text@page-1"
    },
    "customerName": {
      "value": "Acme Corp GmbH",
      "confidence": 0.95,
      "source": "text@page-1"
    },
    "invoiceAmount": {
      "value": "15999.99",
      "confidence": 0.98,
      "source": "text@page-1"
    },
    "dueDate": {
      "value": "15.08.2026",
      "confidence": 0.93,
      "source": "text@page-2"
    }
  },
  "quality": {
    "averageConfidence": 0.9625,
    "missingFields": [],
    "hallucinations": 0,
    "validationsPassed": 4
  },
  "auditTrail": {
    "processedAt": "2026-07-09T12:35:22Z",
    "processor": "document-extractor-v0.18.0",
    "ruleVersion": "1.0",
    "accuracy": 0.96
  }
}
```

### Phase 4: Ergebnisse für Reporting aufbereiten

**4.1 JSON → CSV für Reporting-System**

```bash
# Alle Ergebnisse in eine CSV konvertieren
cd results

# Header schreiben
echo "Rechnungsnummer,Kundenname,Betrag,Zahlungsfällig,Confidence,Status" > invoices-report.csv

# Jede JSON-Datei verarbeiten
for file in *.json; do
  jq -r '[
    .extractedData.invoiceNumber.value,
    .extractedData.customerName.value,
    .extractedData.invoiceAmount.value,
    .extractedData.dueDate.value,
    .quality.averageConfidence,
    .status
  ] | @csv' "$file" >> invoices-report.csv
done
```

**Ergebnis (invoices-report.csv):**
```csv
Rechnungsnummer,Kundenname,Betrag,Zahlungsfällig,Confidence,Status
2026-001234,Acme Corp GmbH,15999.99,15.08.2026,0.9625,success
2026-001235,Tech Solutions LLC,8500.50,20.08.2026,0.9450,success
2026-001236,Global Trade Inc,42300.00,25.08.2026,0.9700,success
```

**4.2 Ergebnisse in Datenbank importieren**

```bash
# CSV in PostgreSQL-Tabelle laden
docker-compose exec postgres psql -U extractor_user -d extractor_db << EOF
CREATE TABLE extracted_invoices (
  invoice_number VARCHAR(20) PRIMARY KEY,
  customer_name VARCHAR(255),
  amount DECIMAL(10,2),
  due_date DATE,
  confidence DECIMAL(3,2),
  extracted_at TIMESTAMP DEFAULT NOW()
);

COPY extracted_invoices(invoice_number, customer_name, amount, due_date, confidence) 
FROM STDIN WITH (FORMAT csv, HEADER);
$(cat invoices-report.csv)
EOF
```

**4.3 Reporting-Query ausführen**

```sql
-- Top Rechnungen nach Betrag
SELECT 
  invoice_number,
  customer_name,
  amount,
  due_date,
  ROUND((confidence * 100)::numeric, 2) as confidence_percent
FROM extracted_invoices
ORDER BY amount DESC
LIMIT 10;

-- Fälligkeiten überwachen
SELECT 
  COUNT(*) as pending_count,
  SUM(amount) as total_amount,
  MIN(due_date) as first_due
FROM extracted_invoices
WHERE due_date <= CURRENT_DATE + INTERVAL '7 days';

-- Qualitätsmetriken
SELECT 
  AVG(confidence) as avg_confidence,
  MIN(confidence) as min_confidence,
  STDDEV(confidence) as confidence_std_dev,
  COUNT(*) as processed_invoices
FROM extracted_invoices;
```

### Phase 5: Fehlerbehandlung und Re-Prozessierung

**5.1 Fehlgeschlagene Extraktion identifizieren**

```bash
# Alle Fehler prüfen
grep -l '"status": "failed"' results/*.json

# Fehlerrate berechnen
total=$(ls results/*.json | wc -l)
failed=$(grep -l '"status": "failed"' results/*.json | wc -l)
success=$((total - failed))
percentage=$((success * 100 / total))

echo "Erfolg: $success/$total ($percentage%)"
```

**5.2 Korrektur und Re-Prozessierung**

```bash
# Fehlerhafte Dateien manuell überprüfen
cat results/invoice-2026-001240.json | jq '.extractedData'

# Regeln verfeinern (falls Pattern-Fehler)
curl -X POST http://localhost/api/schema/schema-12345/refine-rules \
  -H "Content-Type: application/json" \
  -d '{
    "failedFileId": "file-12340",
    "corrections": {
      "invoiceNumber": "2026-001240"
    }
  }'

# Datei neu verarbeiten
curl -X POST http://localhost/api/extract/pdf \
  -F "file=@./source-documents/pdf/invoice-2026-001240.pdf" \
  -F "schemaId=schema-12345" \
  -F "rulesId=rules-invoice-v1-refined" \
  > results/invoice-2026-001240-retry.json
```

### Phase 6: Audit und Überwachung

**6.1 Audit-Trail prüfen**

```bash
# Alle Extraktionen einer Datei prüfen
curl http://localhost/api/audit/file-12345

# Zeitrahmen abfragen
curl http://localhost/api/audit/file-12345?from=2026-07-09&to=2026-07-10

# Benutzer-Historie
curl http://localhost/api/audit/user/extractor-service
```

**6.2 Quality Metrics Dashboard**

```bash
# Durchschnittliche Qualität
curl http://localhost/api/extract/quality

# Ausgabe:
{
  "totalExtracted": 127,
  "averageConfidence": 0.9542,
  "averageProcessingTime": "2.34s",
  "successRate": 0.987,
  "commonErrors": [
    {
      "field": "invoiceAmount",
      "errorRate": 0.008,
      "type": "formatting"
    }
  ],
  "recommendations": [
    "Verbesserung Pattern für Betrag-Erkennung",
    "Mehr Trainingsbeispiele für Kundennamen-Varianten"
  ]
}
```

### Zusammenfassung: Workflow-Pipeline

```
1. Schema definieren
   └─ "Invoice_Report_Schema" mit 4 Feldern

2. Trainingsbeispiele bereitstellen
   └─ 2+ Muster-Rechnungen mit korrekten Werten

3. Regeln generieren
   └─ Automatische Patterns für Feldextraktion

4. Batch-Extraktion durchführen
   └─ 100+ Rechnungen verarbeiten

5. Ergebnisse exportieren
   └─ JSON → CSV

6. In Datenbank importieren
   └─ SQL-Tabelle für Reporting

7. Reporting-Queries ausführen
   └─ Top Rechnungen, Fälligkeiten, Qualitätsmetriken

8. Fehler identifizieren & korrigieren
   └─ Manuelle Review + Re-Prozessierung

9. Audit & Überwachung
   └─ Quality Metrics & History
```

**Zeit für diesen kompletten Workflow:**
- Schema definieren: 5 Min
- Regeln generieren: 3 Min
- 100 Rechnungen extrahieren: 5 Min
- Ergebnisse exportieren: 2 Min
- **GESAMT: ~15 Min für 100 Dokumente**

---

## �🔐 Sicherheit

### Standard-Passwörter (FÜR ENTWICKLUNG)

⚠️ **NICHT für Production verwenden!**

```yaml
PostgreSQL:
  User: extractor_user
  Passwort: extractor_pass

pgAdmin:
  Email: admin@extractor.local
  Passwort: admin-pass
```

### Vor Production-Deployment

1. **Passwörter ändern**
   ```bash
   # PostgreSQL User ändern
   docker-compose exec postgres psql -U extractor_user
   ALTER USER extractor_user WITH PASSWORD 'new_secure_password';
   ```

2. **Secrets Manager verwenden**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

3. **HTTPS aktivieren**
   - Reverse Proxy vor Nginx (Caddy, Traefik)
   - SSL Zertifikat (Let's Encrypt)

4. **Security Header überprüfen**
   - X-Frame-Options
   - Content-Security-Policy
   - X-XSS-Protection
   (Alle bereits in nginx.conf konfiguriert)

---

## 📈 Performance & Monitoring

### Ressourcen-Nutzung

```bash
# Docker Stats anzeigen
docker stats

# Nur Backend
docker stats extractor-backend
```

**Erwartet (Idle):**
- CPU: < 5%
- Memory: ~1.2GB

### Health Checks

Alle Services haben automatische Health Checks:

```bash
# Backend Health
curl http://localhost:3000/api/health

# Frontend Health
curl http://localhost/index.html

# PostgreSQL
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping
```

### Logs Analysieren

```bash
# Fehler suchen
docker-compose logs backend | grep -i error

# Warnings
docker-compose logs backend | grep -i warn

# Mit Timestamps
docker-compose logs --timestamps backend

# Live folgen
docker-compose logs -f --tail=50 backend
```

---

## 🚀 Produktions-Deployment

### Vorbereitung

```bash
# 1. Alle Secrets in Environment Manager speichern
# AWS Secrets Manager / Azure Key Vault / Vault

# 2. Docker Images bauen
docker-compose build

# 3. In Registry pushen
docker tag extractor-backend:latest registry.example.com/extractor-backend:0.18.0
docker push registry.example.com/extractor-backend:0.18.0

# 4. In Production deployen
# AWS ECS / Azure Container Instances / Google Cloud Run
```

### Checkliste

- [ ] Alle Umgebungsvariablen gesetzt
- [ ] SSL/HTTPS aktiviert
- [ ] Secrets Manager konfiguriert
- [ ] Backups automatisiert
- [ ] Monitoring eingerichtet
- [ ] Logs zentralisiert

---

## 👨‍💻 Entwicklungsworkflow für neue Features

Dieser Workflow wird für **jede neue Funktion** verwendet. Er verbindet lokale Entwicklung, Testen, Dokumentation und Docker-Deployment.

### Phase 1: Feature planen & Branch erstellen

```bash
# Feature Branch erstellen
git checkout -b feature/schema-validation-v2
git branch -u origin/develop feature/schema-validation-v2
```

### Phase 2: Lokal entwickeln & testen

**2.1 Backend-Feature entwickeln (TypeScript, Express)**

```powershell
# Terminal 1: Backend starten (Port 3000)
cd backend
npm install  # Falls neue Dependencies
npm run dev

# Code schreiben im Editor: src/services/*, src/routes/*
# Tests schreiben: src/**/__tests__/*.test.ts
npm run test
npm run lint
```

**2.2 Frontend-Feature entwickeln (React, TypeScript)**

```powershell
# Terminal 2: Frontend starten (Port 5173)
cd frontend
npm install  # Falls neue Dependencies
npm run dev

# Code schreiben: src/components/*, src/pages/*
# Tests schreiben: src/**/__tests__/*.test.tsx
npm run test
npm run lint
```

**2.3 Lokale Integration testen**

```bash
# Beide Services auf Port 3000 & 5173 laufen
# Frontend http://localhost:5173
# Backend  http://localhost:3000/api

# Manuell testen in Browser oder:
curl http://localhost:3000/api/health  # Backend Health
curl http://localhost:3000/api/config  # Sample Endpoint
```

### Phase 3: Dokumentation & Manual aktualisieren

**3.1 Code-Dokumentation (JSDoc/TypeDoc)**

```typescript
/**
 * Generates extraction rules from sample documents
 * @param schemaId - The schema ID to generate rules for
 * @param samples - Array of sample documents with known values
 * @returns Promise<GeneratedRules> with confidence scores
 * @example
 * const rules = await generateExtractionRules('invoice-schema', [...]);
 */
export async function generateExtractionRules(
  schemaId: string,
  samples: SampleDocument[]
): Promise<GeneratedRules> {
  // Implementation
}
```

**3.2 Manual (MANUAL-0.18.0.md) aktualisieren**

Falls neue Features für Endanwender relevant sind:
- Neues Kapitel unter "🚀 Schnellstart" oder "🔧 Häufige Aufgaben"
- Beispiele & Screenshots
- API-Endpoints dokumentieren
- Fehlerbehebung hinzufügen

```bash
# Beispiel: Für neue Schema-Validierung
## Neue Feature: Schema-Validierung

Mit Version 0.18.1 können Schemas vor dem Upload validiert werden.

### Schema validieren

\`\`\`bash
curl -X POST http://localhost:3000/api/schema/validate \
  -H "Content-Type: application/json" \
  -d @schema-invoice.json
\`\`\`
```

**3.3 CHANGELOG.md aktualisieren**

```markdown
## [0.18.1] - 2026-07-15

### Added
- Schema validation endpoint (/api/schema/validate)
- Pre-upload field type checking
- Confidence score requirements

### Fixed
- Schema name uniqueness validation now case-insensitive
- Improved error messages for invalid field definitions
```

### Phase 4: Commit & Push zu GitHub

```bash
# Changes prüfen
git status
git diff

# Committen
git add .
git commit -m "feat: Add schema validation

- Endpoint POST /api/schema/validate
- Field type checking with comprehensive rules
- Confidence score validation min 0.5
- Returns detailed validation errors

Fixes #123"

# Zu remote pushen
git push origin feature/schema-validation-v2
```

**Commit Message Format (Conventional Commits):**
- `feat:` Neue Feature
- `fix:` Bugfix
- `docs:` Dokumentation nur
- `test:` Tests hinzufügen/ändern
- `refactor:` Code-Umstrukturierung
- `perf:` Performance-Optimierung

### Phase 5: PR & Code Review

1. **Pull Request erstellen** auf GitHub
2. **Description mit:**
   - Was wurde implementiert?
   - Warum? (Context)
   - Testing durchgeführt?
   - Breaking Changes?
3. **Warten auf Review & Tests** (CI/CD Pipeline)
4. **Merge zu develop** (nach Approval)

### Phase 6: Docker aktualisieren

Nachdem PR gemerged ist:

**6.1 Version in package.json erhöhen**

```json
{
  "name": "extractor",
  "version": "0.18.1",  // ← Erhöhen
  "description": "Audit-Safe Document Extractor"
}
```

**6.2 Docker Images bauen**

```bash
# Nur geänderte Services bauen
docker-compose build backend   # Falls nur Backend geändert
docker-compose build frontend  # Falls nur Frontend geändert

# Oder alles
docker-compose build

# Mit Fresh (ohne Cache)
docker-compose build --no-cache
```

**6.3 Docker Images testen**

```bash
# Images mit neuem Code starten
docker-compose down
docker-compose up -d

# Health Checks warten
sleep 5

# Test der neuen Feature
curl http://localhost:3000/api/schema/validate
curl http://localhost/schemas  # Frontend öffnen

# Logs kontrollieren
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error
```

**6.4 Tagging & Deployment**

```bash
# Version taggen in Git
git tag v0.18.1
git push origin v0.18.1

# Docker Images taggen (für Registry)
docker tag extractor-backend:latest myregistry.azurecr.io/extractor-backend:0.18.1
docker tag extractor-frontend:latest myregistry.azurecr.io/extractor-frontend:0.18.1

# In Registry pushen
docker push myregistry.azurecr.io/extractor-backend:0.18.1
docker push myregistry.azurecr.io/extractor-frontend:0.18.1
```

### Workflow Checkliste für jede neue Feature

```
✓ Feature Branch erstellen
✓ Lokal entwickeln & npm run dev testen
✓ Unit Tests schreiben & testen (npm run test)
✓ Linting überprüfen (npm run lint)
✓ Manual/Dokumentation aktualisieren
✓ CHANGELOG.md aktualisieren
✓ Commit mit Conventional Commit Format
✓ Push & PR erstellen
✓ Code Review warten & Fix Feedback
✓ Merge zu develop
✓ Version in package.json erhöhen
✓ docker-compose build (alle Services)
✓ docker-compose up -d & Health Check
✓ Feature Test im Container
✓ Git Tag erstellen (v0.18.1)
✓ Docker Images in Registry pushen
```

---

## 📋 Schema-Erstellung in der Praxis: Rechnungsextraktion mit Beispielschema

Dieses Kapitel führt Sie **Schritt-für-Schritt** durch die Erstellung eines Rechnungs-Extraction-Schemas mit unserem vorbereiteten **invoice-schema.json** Beispiel.

### Szenario

Sie möchten automatisch Rechnungs-PDFs verarbeiten und folgende Daten extrahieren:
- Rechnungsnummer
- Rechnungsdatum
- Kundenname
- Rechnungsbetrag
- Zahlungsfälligkeitsdatum
- Einzelne Rechnungspositionen (Artikel, Menge, Preis)

**Unser Beispielschema ist bereits vorkonfiguriert mit realistischen Mustern!**

### Schritt 1: Beispielschema ansehen

Die Datei `example-schemas/invoice-schema.json` liegt im Projekt vor:

```json
{
  "name": "Invoice Extraction Schema",
  "description": "Schema for automated invoice data extraction from PDF documents",
  "documentType": "invoice",
  "version": "1.0.0",
  "fields": [
    {
      "fieldName": "invoiceNumber",
      "type": "string",
      "isRequired": true,
      "pattern": "^(?:INV|RG|RECH)?[-]?[0-9]{4,12}$",
      "confidence": 0.95,
      "description": "Invoice number from header section"
    },
    {
      "fieldName": "invoiceDate",
      "type": "date",
      "isRequired": true,
      "pattern": "^\\d{1,2}[./\\\\-]\\d{1,2}[./\\\\-]\\d{4}$",
      "confidence": 0.98,
      "description": "Invoice issue date"
    },
    {
      "fieldName": "customerName",
      "type": "string",
      "isRequired": true,
      "pattern": "^[A-Za-zÄÖÜäöü0-9\\s.,&-]{3,100}$",
      "confidence": 0.92,
      "description": "Customer company name from bill-to section"
    },
    {
      "fieldName": "invoiceAmount",
      "type": "number",
      "isRequired": true,
      "pattern": "^[0-9]{1,10}[.,][0-9]{2}$",
      "confidence": 0.97,
      "description": "Total invoice amount in EUR"
    },
    {
      "fieldName": "dueDate",
      "type": "date",
      "isRequired": true,
      "pattern": "^\\d{1,2}[./\\\\-]\\d{1,2}[./\\\\-]\\d{4}$",
      "confidence": 0.94,
      "description": "Payment due date"
    },
    {
      "fieldName": "lineItems",
      "type": "array",
      "isRequired": false,
      "confidence": 0.85,
      "description": "Array of invoice line items with description, quantity, unit price, total"
    }
  ]
}
```

**Dieses Schema ist optimiert für echte Rechnungs-PDFs mit:**
- ✅ Realistische Regex-Muster für Nummern, Daten, Beträge
- ✅ Deutsche Umlaute in Kundennamen-Pattern
- ✅ Flexible Datums-Formate (dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy)
- ✅ Betrag mit Dezimaltrennzeichen (1000,50 oder 1000.50)
- ✅ Line Items als Array für mehrzeilige Positionen

### Schritt 2: Schema hochladen via UI

**2.1 Frontend öffnen**

```bash
# Frontend läuft (von docker-compose up)
# Browser: http://localhost
# Oder: http://localhost:5173 (Dev-Mode)
```

**2.2 Schema Upload aufrufen**

- Menu öffnen (Hamburger Icon)
- "Schema Upload" klicken
- Oder direkt: http://localhost/#/schema-wizard

**2.3 Schema hochladen**

```
1. "Create New Schema" Button klicken
2. Name: "Invoice Extraction Schema"
3. Description: "Automated extraction of invoice data from PDF documents"
4. Document Type: "invoice"
5. Fields hinzufügen (oder JSON einfügen):
   - invoiceNumber (String, required, pattern)
   - invoiceDate (Date, required, pattern)
   - customerName (String, required, pattern)
   - invoiceAmount (Number, required, pattern)
   - dueDate (Date, required, pattern)
   - lineItems (Array, optional)
6. "Create Schema" Button klicken
```

**Oder per Datei hochladen:**
```
1. "Upload from JSON File" Button
2. example-schemas/invoice-schema.json wählen
3. "Upload" klicken
```

### Schritt 3: Schema hochladen via API (PowerShell)

Falls Sie lieber automatisieren möchten:

```powershell
# invoice-schema.json hochladen
$schemaPath = "example-schemas/invoice-schema.json"
$schema = Get-Content $schemaPath | ConvertFrom-Json

$body = @{
    name = $schema.name
    description = $schema.description
    documentType = $schema.documentType
    version = $schema.version
    fields = $schema.fields
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/schema/upload" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | Select-Object StatusCode, @{
        Name = "Response"
        Expression = { $_.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 }
    }
```

**Erwartete Antwort (200 OK):**
```json
{
  "schemaId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "name": "Invoice Extraction Schema",
  "version": "1.0.0",
  "fieldCount": 6,
  "created": "2026-07-10T12:34:56.789Z",
  "message": "Schema created successfully"
}
```

### Schritt 4: Extraktionsregeln generieren

Nachdem Schema hochgeladen ist, können automatische Extraktionsregeln generiert werden:

**4.1 Beispieldokument vorbereiten**

```
example-schemas/invoice-example-1.json

{
  "filename": "invoice-techcorp-2026-001234.pdf",
  "knownValues": {
    "invoiceNumber": "INV-2026-001234",
    "invoiceDate": "10.07.2026",
    "customerName": "TechCorp GmbH",
    "invoiceAmount": "15999.99",
    "dueDate": "24.08.2026",
    "lineItems": [
      {"description": "Softwarelizenzen", "quantity": 5, "unitPrice": "1000.00", "total": "5000.00"},
      {"description": "Support & Maintenance", "quantity": 12, "unitPrice": "1000.00", "total": "12000.00"}
    ]
  }
}
```

**4.2 Regeln generieren (API)**

```bash
curl -X POST http://localhost:3000/api/schema/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "pattern-learning",
    "confidence": 0.85,
    "sampleDocuments": [
      {
        "documentPath": "example-schemas/invoice-example-1.json",
        "knownValues": {
          "invoiceNumber": "INV-2026-001234",
          "invoiceDate": "10.07.2026",
          "customerName": "TechCorp GmbH",
          "invoiceAmount": "15999.99",
          "dueDate": "24.08.2026"
        }
      }
    ]
  }'
```

**Rückgabe: Gelernte Muster**

```json
{
  "rulesId": "rules-invoice-v1-2026",
  "schemaId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "generatedRules": 6,
  "averageConfidence": 0.945,
  "rules": [
    {
      "field": "invoiceNumber",
      "extractionPattern": "(?:Invoice|Rech|INV).*?([A-Z]+-?\\d{4,12})",
      "confidence": 0.98,
      "exampleMatches": ["INV-2026-001234", "INV-2026-001235"]
    },
    {
      "field": "customerName",
      "extractionPattern": "Bill To:?\\s*([A-Za-z0-9äöü\\s.,&-]{3,100})",
      "confidence": 0.92,
      "exampleMatches": ["TechCorp GmbH", "Tech Solutions LLC"]
    }
  ]
}
```

### Schritt 5: Mit echtem Rechnungs-PDF testen

**5.1 Test-PDF hochladen**

```bash
# PDF mit Rechnungsdaten hochladen
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@path/to/invoice-sample.pdf" \
  -F "schemaId=a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
```

**5.2 Extraktion ausführen**

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc-uuid-123",
    "schemaId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "rulesId": "rules-invoice-v1-2026"
  }'
```

**Erwartete Ergebnisse:**

```json
{
  "extractionId": "extr-uuid-456",
  "documentId": "doc-uuid-123",
  "schemaId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "timestamp": "2026-07-10T12:40:15.123Z",
  "extractedData": {
    "invoiceNumber": {
      "value": "INV-2026-001234",
      "confidence": 0.98,
      "source": "page 1, position (150, 50)"
    },
    "invoiceDate": {
      "value": "10.07.2026",
      "confidence": 0.99,
      "source": "page 1, position (300, 150)"
    },
    "customerName": {
      "value": "TechCorp GmbH",
      "confidence": 0.91,
      "source": "page 1, position (100, 200)"
    },
    "invoiceAmount": {
      "value": "15999.99",
      "confidence": 0.97,
      "source": "page 1, position (500, 500)"
    },
    "dueDate": {
      "value": "24.08.2026",
      "confidence": 0.96,
      "source": "page 1, position (300, 520)"
    }
  },
  "overallConfidence": 0.962,
  "status": "SUCCESS"
}
```

### Schritt 6: Schema im UI verwalten

Navigieren zu: http://localhost/#/schemas

**Ansicht:**
```
Schema Management

ID: a1b2c3d4...
Name: Invoice Extraction Schema
Description: Automated extraction of invoice data from PDF documents
Version: 1.0.0
Status: Active
Fields: 6
Created: 7/10/2026

Aktionen: [Edit] [Version History] [Delete]
```

**Mögliche Aktionen:**
- **Edit**: Schema-Felder anpassen, Patterns optimieren
- **Version History**: Frühere Versionen ansehen & Rollback
- **Delete**: Schema entfernen (⚠️ Vorsicht mit aktiven Extraktionen)

### Häufige Probleme & Lösungen

#### Problem 1: "Schema name already exists"

**Ursache:** Schema mit gleichem Namen existiert bereits

**Lösung:**
```bash
# Eindeutigen Namen verwenden
curl http://localhost:3000/api/schema/list  # Existierende Schemas prüfen
# Name ändern zu: "Invoice Extraction Schema v2.0"
```

#### Problem 2: "Field pattern is invalid"

**Ursache:** Regex-Pattern ist fehlerhaft

**Lösung:**
```bash
# Regex in Online-Tool testen: https://regex101.com/
# Pattern beispiel testen:
pattern: "^[0-9]{1,10}[.,][0-9]{2}$"
test-value: "15999.99"  # ✅ Match
test-value: "15999,99"  # ✅ Match
test-value: "abc"       # ❌ No match
```

#### Problem 3: "Confidence too low"

**Ursache:** Extraktionsregeln haben zu niedrige Confidence Scores

**Lösung:**
```bash
# Mehr/bessere Beispiele hinzufügen für generate-rules
# Oder Pattern manuell verfeinern
# Confidence-Threshold senken (aber: mehr False Positives möglich)
```

- [ ] Passwörter geändert
- [ ] Secrets in Manager gespeichert
- [ ] HTTPS/TLS konfiguriert
- [ ] Backups automatisiert
- [ ] Monitoring aktiviert
- [ ] Logging aggregiert
- [ ] Health Checks verifiziert

---

## 📚 Weitere Dokumentation

| Datei | Inhalt |
|-------|--------|
| [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) | Vollständiger Docker-Leitfaden |
| [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md) | Schnelle Befehls-Referenz |
| [PHASE_18_DOCKER_COMPLETION_REPORT.md](PHASE_18_DOCKER_COMPLETION_REPORT.md) | Technische Details |
| [README.md](README.md) | Projekt-Überblick |
| [RELEASE_NOTES_0.18.0.md](RELEASE_NOTES_0.18.0.md) | Was ist neu |

---

## 🎯 Tipps & Tricks

### 1. Schneller neu starten
```bash
# Mit gecachten Layern (schneller)
docker-compose restart backend

# Vs. kompletter Rebuild (langsam)
docker-compose build --no-cache backend
```

### 2. Fehler schnell debuggen
```bash
# Live logs mit Grep
docker-compose logs -f backend | grep -i error

# Letzte Fehler anzeigen
docker-compose logs backend | tail -100 | grep -i error
```

### 3. Entwicklung beschleunigen
```bash
# Mount lokale Dateien für hot-reload
volumes:
  - ./src:/app/src:delegated    # Backend Code
  - ./frontend/src:/app/src:delegated  # Frontend Code
```

### 4. Datenbank-Zustand speichern
```bash
# Vor experimentellen Änderungen
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup-safe.sql

# Nach dem Experiment: restore
cat backup-safe.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

---

## � REST API Übersicht

### Health & Status

```
GET /api/health
  → Status: OK/ERROR
  → Antwortwert: { status: "ok", timestamp: "2026-07-08T..." }
```

### Extraktion (Phase 14)

```
POST /api/extract/pdf
  Datei: PDF (bis 50MB)
  Rückgabe: Extrahierte Daten + Audit-Log
  Beispiel: curl -F "file=@document.pdf" http://localhost:3000/api/extract/pdf

POST /api/extract/html
  Datei: HTML (bis 50MB)
  Rückgabe: Extrahierte Daten + Audit-Log

GET /api/extract/rules
  Rückgabe: Liste aller verfügbaren Dokumenttypen und Regeln
  Beispiel: curl http://localhost:3000/api/extract/rules

GET /api/extract/rules/:docType
  docType: z.B. "invoice", "contract"
  Rückgabe: Spezifische Ruleset für Dokumenttyp

GET /api/extract/quality
  Rückgabe: Quality Metrics & Success Rates
```

### Konfiguration (Phase 13)

```
GET /api/config
  Rückgabe: Aktuelle Systemkonfiguration
  Beispiel: curl http://localhost:3000/api/config

PUT /api/config
  Body: { "updates": {...}, "changedBy": "admin", "reason": "..." }
  Rückgabe: Aktualisierte Konfiguration
```

### Help Center (Phase 14)

```
GET /api/help/search?query=...&category=...&limit=20
  query: Suchbegriff
  category: Optional (glossary, documentation, release-notes)
  Rückgabe: Gefilterte Help-Inhalte

GET /api/help/categories
  Rückgabe: Liste aller verfügbaren Kategorien

GET /api/help/:category
  category: z.B. "glossary", "getting-started"
  Rückgabe: Inhalte für Kategorie
```

### Audit Trail

```
GET /api/audit/:documentId
  documentId: UUID des Dokuments
  Rückgabe: Vollständiger Audit Trail mit alle Änderungen und Nutzer
```

### Schemas (Phase 14)

```
POST /api/schema/upload
  Body: { "schema": {...}, "examples": [...] }
  Rückgabe: Schema-ID + Status

POST /api/schema/:schemaId/generate-rules
  schemaId: ID des hochgeladenen Schemas
  Rückgabe: Automatisch generierte Extraktionsregeln

GET /api/schema/:schemaId
  Rückgabe: Schema-Metadaten
```

### Backup & Logs

```
GET /api/backup/list
  Rückgabe: Liste aller verfügbaren Backups

POST /api/backup/create
  Rückgabe: Backup-Datei und Status

GET /api/logs?limit=100&filter=error
  limit: Anzahl der Zeilen (max 1000)
  filter: error, warn, info
  Rückgabe: Gefilterte Logs
```

---

## 🔧 Umgebungsvariablen (.env)

### Für Docker Deployment (.env.docker)

**Backend Service:**
```bash
NODE_ENV=production
PORT=3000
API_URL=http://backend:3000/api
CORS_ORIGIN=http://localhost,http://127.0.0.1

LOG_LEVEL=info
```

**Database (PostgreSQL):**
```bash
# Container-intern:
DB_HOST=postgres          # NICHT localhost!
DB_PORT=5432
DB_USER=extractor_user
DB_PASSWORD=extractor_pass
DB_NAME=extractor_db

# Optional für Backup/Restore:
DATABASE_URL=postgresql://extractor_user:extractor_pass@postgres:5432/extractor_db
```

**Cache (Redis):**
```bash
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
```

### Für Local Development (.env.local)

```bash
# Backend
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Files
SOURCE_DOCUMENTS_PATH=./source-documents
EXTRACTION_RULES_PATH=./extraction-rules
RESULTS_PATH=./results

# Extraction
MIN_CONFIDENCE_THRESHOLD=0.8
MAX_CHUNK_SIZE=5000
ENABLE_AUDIT_TRAIL=true

# Datenbank (optional, nur wenn nicht Docker)
DATABASE_URL=postgresql://user:password@localhost:5432/extractor
```

### Wichtige Unterschiede

| Variable | Docker | Lokal |
|----------|--------|-------|
| DB_HOST | `postgres` | `localhost` |
| NODE_ENV | `production` | `development` |
| REDIS_HOST | `redis` | `localhost` |
| LOG_LEVEL | `info` | `debug` |

⚠️ **Docker Best Practice:** Verwende NIEMALS `localhost` in Docker-Umgebungen! Nutze Container-Namen als Hostnames (postgres, redis, backend).

---

## 👥 Frontend User Guide

### Dashboard

**Zugriff:** http://localhost (Hauptseite)

**Features:**
- 📊 **Statistiken:** Anzahl verarbeiteter Dokumente, erfolgreiche Extraktion, Fehlerquote
- 📈 **Trends:** Zeitliche Entwicklung der Erfolgsquote
- 🔄 **Letzte Extraktionen:** 10 neueste Verarbeitungen mit Status
- ⚙️ **Schnelle Links:** Zu Extraktionsregeln, Help, Backup

**Fehlerbehebung:**
```
Problem: Dashboard zeigt "Failed to fetch"
Lösung: 
  1. Browser Console öffnen (F12)
  2. Prüfe ob API-Anfragen zu http://localhost/api/* gehen
  3. Starte Backend neu: docker-compose restart backend
  4. Prüfe Backend Logs: docker-compose logs backend
```

### Help Center

**Zugriff:** http://localhost/help

**Inhalte:**
- 📚 **Dokumentation:** Benutzerhandbuch, API-Guides
- 📖 **Glossar:** Erklärungen von Fachbegriffen
- 🎯 **Getting Started:** Schnelleinstieg in 5 Minuten
- 📝 **Release Notes:** Was ist neu in v0.18.0

**Suche:**
- Suchfeld oben verwenden oder direkt in Category navigieren
- Volltextsuche durchsucht Titel, Inhalt und Tags

### Document Upload & Extraction

**Zugriff:** http://localhost/extract

**Schritte:**
1. **Datei wählen:** PDF, HTML oder DOCX (bis 50MB)
2. **Dokumenttyp wählen:** Invoice, Contract, Report, etc.
3. **Upload:** Datei wird hochgeladen und verarbeitet
4. **Ergebnisse:** Extrahierte Felder werden angezeigt

**Beispiele:**
- Invoices: Betrag, Rechnungsnummer, Zahlungskonditionen
- Contracts: Vertragsparteien, Gültigkeitszeitraum, Besonderheiten
- Reports: Kapitel, KPIs, Zusammenfassungen

**Fehlerbehebung:**
```
Problem: Upload funktioniert nicht / zeitlich lang
Lösung:
  1. Datei-Größe überprüfen (max 50MB)
  2. Format überprüfen (nur PDF, HTML, DOCX)
  3. PDF ggf. in Text-Format konvertieren
  4. Backend Logs überprüfen: docker-compose logs backend
```

### Rules Management

**Zugriff:** http://localhost/rules

**Funktionen:**
- 📋 **Vorhandene Regeln:** Alle definierten Extraktionsregeln
- ➕ **Neue Regel:** Regel von Scratch erstellen
- 📤 **Schema Import:** Automatische Regelgenerierung aus JSON-Schema
- ✏️ **Bearbeiten:** Regeln anpassen und testen
- 🧪 **Test:** Regel gegen Sample-Text testen

**Beispiel Rule:**
```json
{
  "fieldName": "invoice_number",
  "pattern": "Invoice #([A-Z]{2}\\d{8})",
  "type": "string",
  "required": true,
  "confidence": 0.95
}
```

### Settings & Configuration

**Zugriff:** http://localhost/settings

**Optionen:**
- 🔐 **Security:** CORS, SSL, API Keys
- 📊 **Extraction:** Confidence Threshold, Chunk Size
- 📝 **Logging:** Log Level, Retention Policy
- 🗃️ **Backup:** Backup-Häufigkeit, Speicherort
- 🎨 **UI:** Theme, Language (Deutsch/English)

---

## 📞 Support

- 🐛 **Fehler?** Prüfen Sie [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) → Troubleshooting
- ❓ **Fragen?** Siehe [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)
- 🚀 **Deployment?** Siehe Production Deployment oben
- 📖 **Mehr Details?** Siehe [PHASE_18_DOCKER_COMPLETION_REPORT.md](PHASE_18_DOCKER_COMPLETION_REPORT.md)
- 🔌 **API-Fragen?** Siehe REST API Übersicht oben


---

## ?? Log File Viewer - Logs und Fehler durchsuchen

### Zugriff

Die **Log File Viewer** Komponente ist �ber das Men� erreichbar:
- **URL**: http://localhost/#/logs
- **Menu**: Logs (Icon: ??)
- **Status**: ? Production-Ready

### Features

#### 1. **Filtern nach Log-Level**
- debug - Detaillierte Informationen
- info - Allgemeine Informationen  
- warn - Warnungen
- error - Fehler

#### 2. **Filtern nach Source**
- parser - Schema-Parser
- llm - LLM-Integration
- alidator - Datenvalidation
- pi - API-Calls
- system - Systemereignisse

#### 3. **Zeitraum-Filter**
Geben Sie Start- und Enddatum ein, um Logs f�r einen bestimmten Zeitraum zu sehen.

#### 4. **Suche**
Volltext-Suche mit regul�ren Ausdr�cken.

#### 5. **Export**
Logs exportieren in:
- **JSON** - Vollst�ndige Daten mit Context
- **CSV** - Tabellarisches Format
- **TXT** - Lesbar formatiert

### Beispiel-Workflow

`
1. �ffne Logs: http://localhost/#/logs
2. Filtere nach Level: 'error'
3. Gebe Zeitraum ein: Letzte 24 Stunden
4. Suche nach Stichwort: 'schema'
5. Klicke auf Eintrag f�r vollst�ndige Details
6. Exportiere in JSON f�r weitere Analyse
`

### Fehlerbehebung

**Problem**: Keine Logs angezeigt
- **L�sung**: F�hre einen Extract durch, um Logs zu generieren
- **Check**: Backend-Health �berpr�fen (http://localhost:3000/health)

**Problem**: Logs zu alt
- **L�sung**: Verwende Zeitraum-Filter um relevante Logs zu finden
- **Cleanup**: Alte Logs werden automatisch nach 30 Tagen gel�scht

**Problem**: Export fehlgeschlagen
- **L�sung**: Browser-Konsole �berpr�fen (F12 ? Console)
- **Alternative**: Copy-Paste aus UI oder API direkt abfragen

---

### Technical Details

- **Component**: [frontend/src/components/workbench/LogBrowser.tsx]
- **Hook**: [frontend/src/hooks/useLogs.ts]
- **Route**: GET /api/logs (Backend)
- **Limit**: Max 500 Logs pro Anfrage (Pagination m�glich)
- **Format**: ISO-8601 Timestamps, Millisekunden-Genauigkeit
---

**Version 0.18.0 — Docker Containerization Ready** 🐳

