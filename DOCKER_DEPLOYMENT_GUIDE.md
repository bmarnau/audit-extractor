# 🐳 Docker Deployment Guide - Audit-Safe Document Extractor

**Version**: 0.17.0 | **Status**: Production Ready  
**Last Updated**: 8.7.2026

---

## 📋 Prerequisites

Installieren Sie Docker und Docker Compose auf Ihrem System:

- **Docker Desktop** (Windows/Mac): https://www.docker.com/products/docker-desktop
- **Docker + Docker Compose** (Linux): 
  ```bash
  # Ubuntu/Debian
  sudo apt-get install docker.io docker-compose
  
  # Fedora
  sudo dnf install docker docker-compose
  ```

Verifizieren Sie die Installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Schnellstart (5 Minuten)

### Option 1: Vollständiger Stack mit einem Befehl

```bash
# 1. Im Projektverzeichnis
cd extractor

# 2. Docker Compose starten
docker-compose up -d

# 3. Überprüfen Sie den Status
docker-compose ps

# 4. Systeme öffnen
Frontend:   http://localhost:80
Backend:    http://localhost:3000/api
pgAdmin:    http://localhost:5050
```

### Option 2: Mit Build-Caching optimiert

```bash
# Mit frischen Builds
docker-compose up -d --build

# Nur Services neu starten (ohne rebuild)
docker-compose restart

# Logs folgen
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🏗️ Systemarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│  Internet / Local Client                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┴────────────────┐
     │                                │
┌────▼─────────┐              ┌──────▼─────────┐
│  Frontend    │              │   Backend API   │
│  (Nginx)     │              │  (Node.js)      │
│  Port: 80    │◄────────────►│  Port: 3000     │
│  React SPA   │  API Proxy   │  Express.js     │
└──────────────┘              └──────┬──────────┘
                                     │
        ┌────────────────┬───────────┼───────────┬────────────────┐
        │                │           │           │                │
    ┌───▼────┐    ┌──────▼──┐  ┌────▼────┐  ┌──▼──────┐    ┌────▼────┐
    │PostgreSQL│   │  Redis  │  │File Sys │  │  Logs   │    │ Results │
    │Port:5432 │   │:6379    │  │ Storage │  │ Storage │    │ Storage │
    │Database  │   │ Cache   │  │Schemas  │  │ Audit   │    │ Export  │
    └──────────┘   └─────────┘  └─────────┘  └─────────┘    └─────────┘
        │
    ┌───▼──────┐
    │ pgAdmin  │
    │ Port:5050│
    │UI/Manage │
    └──────────┘
```

---

## 📁 Service-Details

### Frontend Service (Nginx)
- **Container**: `extractor-frontend`
- **Port**: 80 (Öffentlich) / 5173 (Alternative)
- **Build**: Multi-Stage React + Vite
- **Features**:
  - API-Proxy zu Backend (/api/*) 
  - SPA-Fallback für React Router
  - Gzip-Kompression aktiviert
  - Security Headers konfiguriert
  - Static File Caching

### Backend Service (Node.js)
- **Container**: `extractor-backend`
- **Port**: 3000
- **Build**: Multi-Stage TypeScript Compilation
- **Features**:
  - PostgreSQL Datenbankverbindung
  - Redis Caching
  - Health Endpoint (/api/health)
  - Document Processing Pipeline
  - Schema-Driven Extraction
  - Revision Management

### PostgreSQL Database
- **Container**: `extractor-postgres`
- **Port**: 5432
- **Version**: 15-Alpine
- **Features**:
  - Automatische Schema-Initialisierung
  - Persistent Volume (postgres_data)
  - Health Checks aktiviert

### Redis Cache
- **Container**: `extractor-redis`
- **Port**: 6379
- **Version**: 7-Alpine
- **Features**:
  - AOF Persistence aktiviert
  - Health Checks aktiviert

### pgAdmin (DB Management UI)
- **Container**: `extractor-pgadmin`
- **Port**: 5050
- **Features**:
  - PostgreSQL-Verwaltung
  - Query-Editor
  - Monitoring

---

## 🔧 Umgebungsvariablen (Environment)

Die folgenden Variablen sind in `docker-compose.yml` konfiguriert:

### Backend
```yaml
NODE_ENV: production              # Produktionsmodus
PORT: 3000                        # Backend Port
DATABASE_URL: postgresql://...    # PostgreSQL Connection
REDIS_URL: redis://redis:6379    # Redis Connection
API_URL: http://backend:3000/api # Interne API URL
CORS_ORIGIN: http://localhost    # CORS Erlaubnis
LOG_LEVEL: info                   # Logging Niveau
```

### Anpassungen
Bearbeiten Sie `docker-compose.yml` direkten oder überschreiben Sie zur Runtime:

```bash
# Mit Environment-Variablen überschreiben
DATABASE_URL=postgresql://user:pass@prod.db:5432/db docker-compose up -d
```

---

## 📊 Monitoring & Logs

### Logs ansehen

```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend

# Mit Timestamps
docker-compose logs -f --timestamps

# Letzte 100 Zeilen
docker-compose logs --tail=100
```

### Service-Status

```bash
# Status aller Container
docker-compose ps

# Container-Details
docker ps

# Container stoppen
docker-compose stop backend
```

### Health Checks

```bash
# Backend Health
curl http://localhost:3000/api/health

# Postgres Health
docker-compose exec postgres pg_isready -U extractor_user

# Redis Health
docker-compose exec redis redis-cli ping
```

---

## 🗄️ Datenbankoperationen

### pgAdmin UI öffnen
```
http://localhost:5050
Email: admin@extractor.local
Passwort: admin-pass
```

### Datenbank direkt verbinden
```bash
# Mit psql (muss lokal installiert sein)
psql -h localhost -U extractor_user -d extractor_db

# Mit Docker exec
docker-compose exec postgres psql -U extractor_user -d extractor_db
```

### Backup erstellen
```bash
# PostgreSQL Backup
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U extractor_user -d extractor_db
```

---

## 🔄 Häufige Operationen

### Services neu starten
```bash
# Alle
docker-compose restart

# Einzeln
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Services neu bauen
```bash
# Mit Update der Images
docker-compose up -d --build

# Nur Backend neu bauen
docker-compose build backend && docker-compose up -d backend
```

### Volumes löschen und neu starten (⚠️ Datenverlust!)
```bash
# Alle Container stoppen
docker-compose down

# Mit Volumes löschen
docker-compose down -v

# Neu starten
docker-compose up -d
```

### Alte Builds entfernen
```bash
# Unused Images
docker image prune -a

# Unused Volumes
docker volume prune

# Unused Networks
docker network prune
```

---

## 🐛 Fehlerbehebung

### Backend startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# TypeScript Kompilierung prüfen
docker-compose build --no-cache backend

# Datenbank-Verbindung testen
docker-compose exec backend npm run test:phase16:e2e
```

### Frontend wird nicht geladen
```bash
# Nginx Logs
docker-compose logs frontend

# Container-Shell öffnen
docker-compose exec frontend sh

# Files überprüfen
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Datenbankfehler
```bash
# Postgres Log
docker-compose logs postgres

# Manuell verbinden
docker-compose exec postgres psql -U extractor_user -d extractor_db

# Init SQL neu ausführen
docker-compose exec postgres psql -U extractor_user -d extractor_db < scripts/init-db.sql
```

### Port-Konflikt (Port bereits in Gebrauch)
```bash
# Prozess auf Port finden
netstat -ano | findstr :3000    # Windows
lsof -i :3000                    # Mac/Linux

# Alternative Ports in docker-compose.yml verwenden
# Oder:
docker-compose down && docker-compose up -d
```

---

## 📈 Performance-Tipps

### 1. Docker Desktop Ressourcen
```
Settings → Resources:
- CPUs: 4+
- Memory: 8GB+
- Disk: 50GB+ verfügbar
```

### 2. Image Caching optimieren
```bash
# .dockerignore überprüfen
cat .dockerignore

# Abhängigkeiten cachen
docker-compose build --no-cache  # Erzwingt komplett neu
docker-compose build              # Nutzt Caching
```

### 3. Volumes optimieren
```bash
# Bind Mount statt Volume (Entwicklung)
# In docker-compose.yml:
volumes:
  - ./extraction-rules:/app/extraction-rules:delegated
```

### 4. Produktionsoptimierung
```bash
# Nur Production Dependencies
RUN npm ci --only=production

# Multi-stage Builds minimieren Image-Größe
# Bereits implementiert in Dockerfile.backend/frontend
```

---

## 🔐 Sicherheit in Produktion

### Vor dem Deployment

1. **Secrets Management**
   ```bash
   # Verwenden Sie Secret Manager statt plaintext
   # AWS Secrets Manager, Azure Key Vault, etc.
   ```

2. **Environment-Variablen sichern**
   ```bash
   # Niemals in docker-compose.yml hardcodieren
   # Verwenden Sie .env Dateien mit:
   echo ".env" >> .gitignore
   ```

3. **Images signieren**
   ```bash
   docker trust inspect extractor-backend
   ```

4. **Network Isolation**
   ```yaml
   # Services nicht öffentlich exponieren
   # Nur Frontend auf Port 80/443
   ```

---

## 🚀 Production Deployment

### Auf Cloud-Plattform deployen

#### Docker Hub
```bash
# Login
docker login

# Tag und Push
docker tag extractor-backend:latest yourname/extractor-backend:latest
docker push yourname/extractor-backend:latest
```

#### Kubernetes
```bash
# Mit Helm
helm install extractor ./helm-chart

# Mit kubectl
kubectl apply -f k8s/
```

#### AWS ECS
```bash
# ECR Repository erstellen
aws ecr create-repository --repository-name extractor-backend

# Push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag extractor-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/extractor-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/extractor-backend:latest
```

#### Azure Container Instances
```bash
# Push zu Azure Container Registry
az acr build --registry <registry-name> --image extractor-backend:latest .

# Deploy
az container create --resource-group <rg> --name extractor --image <acr>.azurecr.io/extractor-backend:latest
```

---

## 📋 Checkliste für Production

- [ ] Secrets in Environment Manager (nicht im Code)
- [ ] HTTPS/TLS konfiguriert (Reverse Proxy vor Nginx)
- [ ] Database Backups automatisiert
- [ ] Monitoring & Alerting aktiviert (Prometheus, Datadog)
- [ ] Log Aggregation konfiguriert (ELK, Splunk)
- [ ] Health Checks regelmäßig prüfen
- [ ] Update-Strategie definiert (Blue/Green Deployment)
- [ ] Disaster Recovery Plan erstellt

---

## 📞 Support & Ressourcen

- **Docker Docs**: https://docs.docker.com
- **Docker Compose**: https://docs.docker.com/compose
- **Project Issues**: GitHub Issues
- **Email**: support@audit-extractor.app

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.17.0 | 8.7.2026 | Docker variant Phase 18 - Full containerization |
| 0.16.0 | 7.7.2026 | Phase 16 - Database & File System Management |
| 0.15.0 | 5.7.2026 | Phase 15 - Schema-Driven Rule Generation |

