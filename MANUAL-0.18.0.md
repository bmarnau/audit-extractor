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

```bash
# Alle pausieren (Container bleiben)
docker-compose stop

# Alle stoppen & Container löschen (Daten bleiben!)
docker-compose down

# Alles inklusive Daten löschen (⚠️ VORSICHT!)
docker-compose down -v
```

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

## 🔐 Sicherheit

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

**Version 0.18.0 — Docker Containerization Ready** 🐳
