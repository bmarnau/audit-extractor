# 🚀 Startup Guide - Version 0.18.0

**Version**: 0.18.0  
**Status**: Production Ready  
**Last Updated**: 8.7.2026  
**Phase**: 18 - Docker Containerization

---

## ⚡ Quick Start (3 Optionen)

### Option 1: Windows CMD (Einfach & Empfohlen)

```cmd
cd c:\Users\bmarn\OneDrive\HTML\extractor
start-docker.cmd
```

Was passiert:
- ✅ Docker wird überprüft
- ✅ Alle 5 Services starten
- ✅ Health Checks prüfen ob alles OK ist
- ✅ URLs werden angezeigt

**Ergebnis:**
```
Frontend:   http://localhost
Backend:    http://localhost:3000/api
pgAdmin:    http://localhost:5050
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

### Option 2: PowerShell (Mit Optionen)

```powershell
# Standard-Start
.\start-docker.ps1

# Mit Rebuild aller Images
.\start-docker.ps1 -Rebuild

# Mit Live-Logs
.\start-docker.ps1 -ShowLogs

# Kombiniert
.\start-docker.ps1 -Rebuild -ShowLogs
```

### Option 3: Manuell (Docker CLI)

```bash
# 1. Services starten
docker-compose up -d

# 2. Status prüfen
docker-compose ps

# 3. Logs ansehen
docker-compose logs -f backend
```

---

## 📍 Zugriffspunkte nach dem Start

### Frontend (React SPA)
```
URL:    http://localhost
Port:   80 (oder 5173)
Browser: Firefox / Chrome / Safari
```

### Backend API
```
URL:    http://localhost:3000/api
Port:   3000
Status: curl http://localhost:3000/api/health
```

### pgAdmin (Database Management)
```
URL:      http://localhost:5050
Email:    admin@extractor.local
Password: admin-pass
```

### PostgreSQL (Direct Access)
```
Host:     localhost
Port:     5432
User:     extractor_user
Password: extractor_pass
DB:       extractor_db
Tool:     DBeaver, pgAdmin, or psql CLI
```

### Redis Cache
```
Host: localhost
Port: 6379
```

---

## 📊 System-Status überprüfen

```bash
# Alle Container Status
docker-compose ps

# Nur laufende Services
docker-compose ps --services

# Detaillierte Infos
docker inspect extractor-backend
docker inspect extractor-frontend
```

---

## 🔄 Services verwalten

### Neu starten

```bash
# Alle Services
docker-compose restart

# Einzeln
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Stoppen

```bash
# Pausieren (Container bleiben)
docker-compose stop

# Vollständig beenden
docker-compose down

# Alles löschen (⚠️ Datenverlust!)
docker-compose down -v
```

### Neu bauen

```bash
# Alles mit gecachten Layern
docker-compose up -d --build

# Alles ohne Cache (längsamerer Rebuild)
docker-compose build --no-cache

# Nur Backend
docker-compose build --no-cache backend && docker-compose up -d backend

# Nur Frontend
docker-compose build --no-cache frontend && docker-compose up -d frontend
```

---

## 📖 Logs analysieren

```bash
# Alle Services zusammen
docker-compose logs -f

# Mit Timestamps
docker-compose logs --timestamps

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend

# Nur PostgreSQL
docker-compose logs -f postgres

# Letzte 50 Zeilen
docker-compose logs --tail=50

# Fehler suchen
docker-compose logs backend | grep -i error
```

---

## 💾 Datenbank-Operationen

### Backup erstellen

```bash
# SQL Dump
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup-$(date +%Y%m%d).sql

# Mit Kompression
docker-compose exec postgres pg_dump -U extractor_user extractor_db | gzip > backup.sql.gz
```

### Backup restore

```bash
# SQL Dump
cat backup-20260708.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db

# Aus Komprimierung
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

### Direkt auf Datenbank zugreifen

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U extractor_user -d extractor_db

# Query ausführen
docker-compose exec postgres psql -U extractor_user -d extractor_db -c "SELECT * FROM schemas;"
```

### pgAdmin nutzen

1. Öffne: http://localhost:5050
2. Login: admin@extractor.local / admin-pass
3. Register Server:
   - Name: extractor-postgres
   - Host: postgres
   - User: extractor_user
   - Password: extractor_pass

---

## 🐛 Fehlerbehebung

### "Docker nicht installiert"

**Lösung:**
```bash
# Windows/Mac: Docker Desktop
https://www.docker.com/products/docker-desktop

# Linux:
sudo apt-get install docker.io docker-compose
```

Verifizieren:
```bash
docker --version
docker-compose --version
```

### "Port bereits in Gebrauch"

**Ursache:** Ein anderer Service nutzt Port 3000, 80, etc.

**Lösung 1 - Port freigeben:**
```bash
# Windows - Prozess finden
netstat -ano | findstr :3000

# Prozess beenden
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Lösung 2 - Port ändern:**
Edit `docker-compose.yml`:
```yaml
backend:
  ports:
    - "3001:3000"   # 3001 statt 3000

frontend:
  ports:
    - "8080:80"     # 8080 statt 80
```

Dann:
```bash
docker-compose up -d
```

### Backend antwortet nicht

```bash
# Logs überprüfen
docker-compose logs backend

# 10 letzte Zeilen Fehler
docker-compose logs backend | tail -10 | grep -i error

# Container neu starten
docker-compose restart backend

# Komplett neu bauen
docker-compose build --no-cache backend && docker-compose up -d backend

# Health Check
curl http://localhost:3000/api/health
```

### Frontend zeigt Fehler

```bash
# Nginx Logs
docker-compose logs frontend

# Files überprüfen
docker-compose exec frontend ls -la /usr/share/nginx/html

# Nginx testen
docker-compose exec frontend nginx -t

# Neu starten
docker-compose restart frontend
```

### Datenbank-Fehler

```bash
# PostgreSQL Status
docker-compose logs postgres

# Verbindung testen
docker-compose exec postgres pg_isready -U extractor_user

# Backend Health testen
curl http://localhost:3000/api/health

# pgAdmin nutzen zur Debugging
http://localhost:5050
```

---

## 📈 Performance & Monitoring

### Resource Usage

```bash
# Docker Stats anzeigen (live)
docker stats

# Nur Backend
docker stats extractor-backend

# CSV Export für Analyse
docker stats --no-stream > docker-stats.csv
```

**Erwartet (Idle):**
- CPU: < 5%
- Memory: ~1.2GB

### Health Checks

Alle Services haben Health Checks:

```bash
# Backend
curl http://localhost:3000/api/health

# Frontend (Nginx)
curl -I http://localhost/index.html

# PostgreSQL
docker-compose exec postgres pg_isready -U extractor_user

# Redis
docker-compose exec redis redis-cli ping
```

---

## 🔐 Sicherheit

### Standard-Credentials (DEVELOPMENT ONLY!)

```
PostgreSQL:
  User:     extractor_user
  Password: extractor_pass

pgAdmin:
  Email:    admin@extractor.local
  Password: admin-pass
```

### Vor Production

1. **Passwörter ändern**
   ```bash
   docker-compose exec postgres psql -U extractor_user -d extractor_db
   ALTER USER extractor_user WITH PASSWORD 'new_secure_password';
   ```

2. **HTTPS einrichten**
   - Reverse Proxy (Nginx, Traefik)
   - SSL Zertifikat (Let's Encrypt)

3. **Secrets Manager**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

4. **Security Headers überprüfen**
   ```bash
   curl -I http://localhost
   ```

---

## 📚 Weitere Dokumentation

| Datei | Beschreibung |
|-------|-------------|
| [MANUAL-0.18.0.md](MANUAL-0.18.0.md) | Vollständiges Operationshandbuch |
| [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) | Docker Deployment Leitfaden |
| [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md) | Schnelle Befehls-Referenz |
| [QUICKSTART.md](QUICKSTART.md) | 30-Sekunden Quick Start |
| [RELEASE_NOTES_0.18.0.md](RELEASE_NOTES_0.18.0.md) | Was ist neu in 0.18.0 |
| [README.md](README.md) | Projekt-Überblick |

---

## 🎯 Nächste Schritte

### 1. System starten
```bash
start-docker.cmd
```

### 2. Frontend testen
```
http://localhost
```

### 3. Backend testen
```bash
curl http://localhost:3000/api/health
```

### 4. Datenbank verwalten
```
http://localhost:5050
```

### 5. Logs überwachen
```bash
docker-compose logs -f
```

---

**Ready to go? Start now!** 🐳

### Schritt 1: Prerequisites Check
- ✅ Node.js installiert?
- ✅ npm installiert?
- ✅ Docker installiert? (optional)
- ✅ Git installiert? (optional)

### Schritt 2: Database Startup
```bash
docker-compose up -d
```
- Startet PostgreSQL 15 Container
- Verbindung auf localhost:5432
- Credentials: extractor_user / extractor_pass

### Schritt 3: Dependencies Installation
```bash
npm install --no-optional --ignore-scripts
```
- Installiert alle npm packages (645 Pakete)
- Skip: --ignore-scripts (verhindert Husky-Fehler)

### Schritt 4: TypeScript Build
```bash
npm run build
```
- Kompiliert TypeScript → JavaScript
- Ziel: dist/ Folder
- Verifyzes: 0 Compilation Errors

### Schritt 5: Development Server
```bash
npm run dev
```
- Startet Express API auf http://localhost:3000
- Startet Frontend auf http://localhost:3000
- Watch-Mode: Automatisches Rebuild bei Änderungen

---

## ✅ Erfolgreiche Startup-Signale

Wenn alles klappt, siehst du:

```
=========================================================================
                      STARTUP COMPLETE!

   Web Interface:  http://localhost:3000
   API Server:     http://localhost:3000/api
   Database:       localhost:5432

   Documentation:  MANUAL-0.16.0.md
   Status:         Phase 16 - Production Ready

   Press Ctrl+C to stop the server
=========================================================================
```

---

## 🐛 Troubleshooting

### Problem: "Node.js is not installed"

**Lösung**: Node.js installieren
```bash
# Windows: Download von https://nodejs.org/
# Oder: Winget
winget install OpenJS.NodeJS

# Danach: Terminal neu starten
```

### Problem: "Docker is not installed"

**Lösung**: Docker Desktop installieren
```bash
# Option 1: Download von https://www.docker.com/products/docker-desktop
# Option 2: Winget
winget install Docker.DockerDesktop
```

**Oder**: Ohne Docker starten (nur wenn DB nicht nötig)
```powershell
.\start-phase16.ps1 -Skip "docker"
```

### Problem: "npm install failed with vulnerabilities"

**Lösung**: Das ist normal (pre-existing, nicht blocking)
```bash
# Trotzdem weitermachen - die Vulnerabilities sind in Dependencies
# Alle Tests passen
npm run build  # sollte funktionieren
npm run dev    # sollte starten
```

### Problem: "Build failed with TypeScript errors"

**Lösung**: 
```bash
# Manuelle Überprüfung
npm run build

# Oder spezifische Fehler checken
npx tsc --noEmit
```

### Problem: "Port 3000 is already in use"

**Lösung**: Anderen Process beenden oder anderen Port verwenden
```bash
# Windows: Prozess mit Port 3000 finden und beenden
netstat -ano | findstr :3000

# Dann bei PID beenden
taskkill /PID <PID> /F

# Oder: PORT Env setzen
$env:PORT=3001
npm run dev
```

### Problem: "Cannot connect to PostgreSQL"

**Lösung**:
```bash
# 1. Docker prüfen
docker ps

# 2. Container logs prüfen
docker logs extractor-postgres

# 3. Neu starten
docker-compose restart

# 4. Oder: Manuell starten
docker-compose up -d
```

---

## 🔧 Umgebungsvariablen

Diese sind in `.env.local` konfiguriert:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=extractor_user
DB_PASSWORD=extractor_pass
DB_NAME=extractor_db

# App
NODE_ENV=development
PORT=3000

# Logging
DB_LOGGING=false
DB_SSL=false
```

### Ändern:
```bash
# .env.local bearbeiten
code .env.local

# Dann neu starten
npm run dev
```

---

## 📊 System Information

Nach dem Start siehst du ungefähr das hier:

```
[Server] Service Container initialized
[Server] ✓ Database Connection initialized
[Server] ✓ ConfigManager initialized
[Server] ✓ BackupService initialized
[Server] ✓ HelpContentLoader initialized
[Server] ✓ SchemaDirectoryManager initialized

[Server] Express Server running on port 3000
[Server] API available at http://localhost:3000/api
```

---

## 🧪 Erste Tests nach Startup

### Test 1: API läuft?
```bash
curl http://localhost:3000/api/config
```

### Test 2: Database verbunden?
```bash
curl http://localhost:3000/api/health
```

### Test 3: Web UI?
Öffne http://localhost:3000 im Browser

---

## ⏹️ Server Stoppen

### In der Konsole:
```
Drücke Ctrl+C
```

### Oder: Docker Container stoppen
```bash
docker-compose down
```

---

## 📚 Weitere Dokumentation

- [MANUAL-0.16.0.md](./MANUAL-0.16.0.md) - User Handbook
- [PHASE_16_COMPLETION_REPORT.md](./PHASE_16_COMPLETION_REPORT.md) - Technical Details
- [KOMPLETTER_ABSCHLUSS_CHECK.md](./KOMPLETTER_ABSCHLUSS_CHECK.md) - Status Overview
- [docs/DOCUMENTATION-INDEX.md](./docs/DOCUMENTATION-INDEX.md) - Full Documentation Index

---

## 💡 Pro Tips

### Schneller Start (Skip alles außer Dev)
```powershell
.\start-phase16.ps1 -Skip "docker,install,build"
```

### Nur Database starten (ohne Server)
```bash
docker-compose up -d
```

### Nur Frontend bauen (kein Server)
```bash
npm run build
```

### Watch Mode (auto rebuild)
```bash
npm run build:watch
```

### Production Build
```bash
npm run build
# Dann die dist/ folder deployen
```

---

## ✨ Was bist du jetzt ready für?

Nach erfolgreichem Startup:

✅ Schemas hochladen (POST /api/schema/upload)
✅ Extraction Rules generieren (POST /api/schema/:id/generate-rules)
✅ Schemas verwalten (GET, PATCH, DELETE /api/schema/:id)
✅ Versioning system (auto versioning bei Updates)
✅ Multi-tenant support (userId isolation)
✅ Full database persistence (PostgreSQL)

---

## 🎉 Ready to Go!

Die App läuft jetzt vollständig auf Phase 16!

**Database**: ✅ PostgreSQL  
**Backend**: ✅ Express + TypeORM  
**Frontend**: ✅ React + Material-UI  
**Documentation**: ✅ Complete  

**Viel Erfolg! 🚀**

---

**Version**: 0.16.0  
**Created**: 8.7.2026  
**Status**: Production Ready
