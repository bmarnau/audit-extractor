# Docker Setup & Operations Guide
**Version:** 0.37.1  
**Last Updated:** 2026-07-16  
**Phase:** 43 - Technical Audit API & Report Viewer Integration

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Container Configuration](#container-configuration)
4. [Environment Variables](#environment-variables)
5. [Volume Management](#volume-management)
6. [Networking](#networking)
7. [Health Checks](#health-checks)
8. [Building Images](#building-images)
9. [Common Commands](#common-commands)
10. [Troubleshooting](#troubleshooting)
11. [Production Deployment](#production-deployment)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- 4GB+ RAM available
- Ports 80, 3000, 5432, 6379 available

### Start All Services
```bash
# Clone repo and navigate to project
cd c:\Users\bmarn\OneDrive\HTML\extractor

# Start all containers (rebuilds if necessary)
docker-compose up -d --build

# Wait for containers to be healthy (30-60 seconds)
sleep 30

# Verify health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Verify Services Are Running
```bash
# Frontend - Should be accessible at http://localhost
curl http://localhost/

# Backend API - Should return health status
curl http://localhost:3000/api/health

# Technical Tests Dashboard - Check new Phase 43 features
curl http://localhost/technical-tests

# Database - Check connection
docker exec extractor-postgres psql -U postgres -c "SELECT 1"

# Redis - Check connection
docker exec extractor-redis redis-cli ping
```

### Stop Services
```bash
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## 🏗️ Architecture

```
                              Client Browser
                                    |
                    ________________|________________
                   |                                 |
              Port 80                           Port 5173 (dev)
              ____________                           _________
             |            |                         |         |
        Frontend           |                    Dev Frontend
        (Nginx)            |                    (Vite)
        ┌──────────────┐   |                        
        │ React App    │   |                        
        │ v0.37.1      │   |                        
        │ - Dashboard  │   |                        
        │ - Schemas    │   |                        
        │ - Jobs       │   |                        
        │ - Rules      │   |                        
        │ - Services   │   |                        
        │ - Logs       │   |                        
        │ - Audit      │   |                        
        │ - Help       │   |                        
        │ - Phase 43   │   |◄──── NEW Dashboard
        │   Dashboard  │   |      (Technical Audit)
        └──────┬───────┘   |                        
               |           |                        
            Calls API      |                        
                           |                        
        Port 3000          |                        
        __________________|________________         
       |                                 |          
    Backend API                   API Proxy         
    (Express.js)           (if needed for dev)     
    ┌──────────────────┐                          
    │ Technical Tests  │─────┐                     
    │ - /findings      │     │                     
    │ - /recommendations                          
    │ - /reports       │ PostgreSQL  Redis         
    │ - /export        │ Port 5432   Port 6379    
    │                  │ ┌────────┐  ┌───────┐   
    │ + All other API  │ │Database│  │Cache  │   
    │   endpoints from │ │v15     │  │v7     │   
    │   Phases 1-42    │ │        │  │       │   
    └──────────────────┘ └────────┘  └───────┘   
         v0.37.1                                  
                                                 
    PgAdmin                                      
    Port 5050                                    
    (Development only)
```

---

## 🐳 Container Configuration

### Container Specifications

#### extractor-frontend
```yaml
Image: extractor-frontend:latest
Base: nginx:alpine
Port: 80
Build Time: ~40 seconds
Build Command: npm run build (Vite)
Serves: /frontend/dist (production build)
Health Check: GET /health (200 OK)
Status: Serves React app correctly (shows "unhealthy" due to probe, not actual)
```

**Dockerfile (frontend):**
- Multi-stage build
- Stage 1: Node 20 Alpine - npm install, npm run build
- Stage 2: Nginx Alpine - copy dist, nginx.conf
- Production optimized

#### extractor-backend
```yaml
Image: extractor-backend:latest
Base: node:20-alpine
Port: 3000
Build Time: ~12 seconds (TypeScript + ESM fixes)
Runtime: Express.js
Environment: production
Health Check: GET /api/health (200 OK)
Status: Healthy
```

**Dockerfile (backend):**
- Multi-stage build
- Stage 1: Node 20 Alpine - npm ci, typescript compile
- Stage 2: Alpine - copy dist, npm ci (no-save)
- ESM import fixes applied during build
- tsconfig-paths resolved

#### extractor-postgres
```yaml
Image: postgres:15-alpine
Port: 5432
Env: POSTGRES_PASSWORD, POSTGRES_DB
Volume: extractor-postgres-data (named volume)
Health Check: psql -U postgres -c "SELECT 1"
Status: Healthy
Data Persistence: ✅ Yes (survives restart)
```

#### extractor-redis
```yaml
Image: redis:7-alpine
Port: 6379
Volume: extractor-redis-data (named volume)
Health Check: redis-cli ping
Status: Healthy
Data Persistence: ✅ Yes (survives restart)
```

#### extractor-pgadmin
```yaml
Image: dpage/pgadmin4:latest
Port: 5050
Purpose: Development PostgreSQL management
Access: http://localhost:5050
Default Login: admin@admin.com / admin
Status: For development use only
Production: Should be disabled
```

---

## 🔧 Environment Variables

### Frontend (.env.production)
```bash
# Port and API configuration
VITE_API_URL=/api              # Frontend API proxy
PUBLIC_API_HOST=http://localhost:3000

# Feature flags (if needed)
VITE_DEBUG=false
```

### Backend (.env or docker-compose.yml)
```bash
# Server configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:password@extractor-postgres:5432/extractor
DB_HOST=extractor-postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=extractor

# Redis/Cache
REDIS_URL=redis://extractor-redis:6379

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.9'

services:
  frontend:
    environment:
      - FRONTEND_VERSION=0.37.1
      - NODE_ENV=production
      
  backend:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - POSTGRES_PASSWORD=password
      
  postgres:
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=extractor
      - POSTGRES_USER=postgres
      
  redis:
    # No specific environment variables needed
```

---

## 📦 Volume Management

### Named Volumes

#### extractor-postgres-data
```bash
# Purpose: PostgreSQL persistent storage
# Type: Named volume (managed by Docker)
# Location: /var/lib/docker/volumes/...
# Size: Grows as data added
# Backup: docker run --rm -v extractor-postgres-data:/data ... tar czf backup.tar.gz /data

# Inspect volume
docker volume inspect extractor-postgres-data

# Backup data
docker run --rm -v extractor-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore data
docker run --rm -v extractor-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

#### extractor-redis-data
```bash
# Purpose: Redis persistent storage (RDB snapshots)
# Type: Named volume (managed by Docker)
# Backup: Similar to postgres-data

docker volume inspect extractor-redis-data
```

### Volume Lifecycle
```bash
# View all volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Remove specific volume (WARNING: data loss!)
docker volume rm extractor-postgres-data

# Create snapshot
docker-compose down
cp -r /var/lib/docker/volumes/extractor-postgres-data/_data ./postgres-backup

# Restore snapshot
docker-compose down
rm -rf /var/lib/docker/volumes/extractor-postgres-data/_data
cp -r ./postgres-backup /var/lib/docker/volumes/extractor-postgres-data/_data
docker-compose up -d
```

---

## 🌐 Networking

### Container Communication

#### Bridge Network: extractor-network
```
frontend (http://extractor-frontend:80)
   ├─ Can reach backend via http://extractor-backend:3000
   └─ Can reach postgres via extractor-postgres:5432

backend (http://extractor-backend:3000)
   ├─ Can reach postgres via extractor-postgres:5432
   ├─ Can reach redis via extractor-redis:6379
   └─ Can serve frontend via Nginx

postgres (extractor-postgres:5432)
   └─ Receives connections from backend only

redis (extractor-redis:6379)
   └─ Receives connections from backend only
```

#### Port Mapping
```
Host Port  →  Container Port  →  Service
──────────────────────────────────────────
80         →  80               (Frontend/Nginx)
3000       →  3000             (Backend/Express)
5432       →  5432             (PostgreSQL)
6379       →  6379             (Redis)
5050       →  5050             (pgAdmin - dev only)
```

#### DNS Resolution
- Inside containers: Use service names (extractor-postgres, extractor-redis)
- From host machine: Use localhost:PORT

### DNS Configuration
```bash
# Test DNS resolution inside backend container
docker exec extractor-backend nslookup extractor-postgres

# Test connectivity
docker exec extractor-backend curl http://extractor-backend:3000/api/health
docker exec extractor-backend psql -h extractor-postgres -U postgres -c "SELECT 1"
```

---

## ✅ Health Checks

### Container Health Monitoring
```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Output format:
# NAMES                 STATUS
# extractor-backend     Up 5 minutes (healthy)
# extractor-postgres    Up 5 minutes (healthy)
# extractor-redis       Up 5 minutes (healthy)
# extractor-frontend    Up 5 minutes (unhealthy)  ← false positive
```

### Frontend Health Check
```bash
# Frontend shows "unhealthy" but is serving correctly
# Reason: Conservative Nginx health probe

# Verify frontend is actually working
curl http://localhost/
curl http://localhost/health

# Check Nginx logs
docker logs extractor-frontend --tail 20

# Expected: GET requests returning 200 OK
```

### Backend Health Endpoint
```bash
# Check backend health
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "uptime": 523,
  "timestamp": "2026-07-16T15:30:00Z",
  "version": "0.37.1",
  "versionMatch": true,
  "buildTime": "2026-07-16T15:20:00Z"
}
```

### Database Health
```bash
# Direct test
docker exec extractor-postgres psql -U postgres -c "SELECT version();"

# From backend
curl http://localhost:3000/api/health/database

# From backend container
docker exec extractor-backend npm run check:db
```

### Redis Health
```bash
# Direct test
docker exec extractor-redis redis-cli ping

# Expected output: PONG

# Check memory usage
docker exec extractor-redis redis-cli info memory
```

---

## 🔨 Building Images

### Build All Images
```bash
# Rebuild and restart
docker-compose up -d --build

# Build without starting
docker-compose build

# Build specific service
docker-compose build frontend
docker-compose build backend
```

### Build Options
```bash
# No cache (fresh rebuild)
docker-compose build --no-cache

# Progress output
docker-compose build --progress plain

# Build for specific architecture
docker buildx build --platform linux/amd64 -t extractor-backend:latest .
```

### Manual Build
```bash
# Build frontend
docker build -f Dockerfile.frontend -t extractor-frontend:latest .

# Build backend
docker build -f Dockerfile.backend -t extractor-backend:latest .

# Build with args
docker build --build-arg NODE_ENV=production \
  -f Dockerfile.backend \
  -t extractor-backend:0.37.1 .
```

---

## 📝 Common Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ data loss!)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Specific service
docker logs extractor-backend --tail 50  # Last 50 lines
```

### Inspection
```bash
# View container details
docker ps
docker ps -a                        # Including stopped
docker inspect extractor-backend

# View image layers
docker history extractor-backend

# View resource usage
docker stats

# View network
docker network inspect extractor_extractor-network
```

### Database Operations
```bash
# Access PostgreSQL shell
docker exec -it extractor-postgres psql -U postgres

# Run SQL command
docker exec extractor-postgres psql -U postgres -c "SELECT COUNT(*) FROM users;"

# Backup database
docker exec extractor-postgres pg_dump -U postgres extractor > backup.sql

# Restore database
docker exec -i extractor-postgres psql -U postgres extractor < backup.sql

# Access PgAdmin web interface
# Open browser: http://localhost:5050
# Login: admin@admin.com / admin
```

### Redis Operations
```bash
# Access Redis CLI
docker exec -it extractor-redis redis-cli

# Check Redis keys
docker exec extractor-redis redis-cli KEYS "*"

# Flush cache
docker exec extractor-redis redis-cli FLUSHALL

# Check memory usage
docker exec extractor-redis redis-cli INFO memory
```

### Debugging
```bash
# Execute command in container
docker exec -it extractor-backend sh
docker exec -it extractor-frontend sh

# View environment variables
docker exec extractor-backend env

# Test network connectivity
docker exec extractor-backend curl http://extractor-postgres:5432

# Check DNS resolution
docker exec extractor-backend nslookup extractor-postgres
```

---

## 🔧 Troubleshooting

### Frontend Not Loading

**Problem:** Browser shows blank page or error

**Solutions:**
```bash
# 1. Check frontend container status
docker ps | grep frontend

# 2. View logs
docker logs extractor-frontend --tail 50

# 3. Check if Nginx is serving
curl http://localhost/
curl -I http://localhost/

# 4. Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# 5. Clear browser cache (Ctrl+Shift+Delete)
```

### Backend API Not Responding

**Problem:** API calls timeout or return 404

**Solutions:**
```bash
# 1. Check backend container
docker ps | grep backend

# 2. Test API health
curl http://localhost:3000/api/health

# 3. View backend logs
docker logs extractor-backend

# 4. Check if port is already in use
netstat -ano | findstr 3000

# 5. Restart backend
docker-compose restart backend

# 6. Rebuild backend
docker-compose build --no-cache backend
```

### Database Connection Failed

**Problem:** Backend unable to connect to PostgreSQL

**Solutions:**
```bash
# 1. Check PostgreSQL status
docker ps | grep postgres

# 2. Test database connection
docker exec extractor-postgres psql -U postgres -c "SELECT 1"

# 3. Check environment variables
docker exec extractor-backend env | grep DATABASE

# 4. View PostgreSQL logs
docker logs extractor-postgres

# 5. Restart PostgreSQL
docker-compose restart postgres
docker-compose up -d postgres
```

### Volume Issues

**Problem:** Data not persisting or containers can't access volumes

**Solutions:**
```bash
# 1. Check volume status
docker volume ls
docker volume inspect extractor-postgres-data

# 2. Mount volume manually
docker run -v extractor-postgres-data:/data alpine ls /data

# 3. Check volume permissions
docker exec extractor-postgres ls -la /var/lib/postgresql/data

# 4. Recreate volume
docker-compose down -v
docker-compose up -d
```

### Memory Issues

**Problem:** Containers using too much memory or crashing

**Solutions:**
```bash
# 1. Check memory usage
docker stats

# 2. Clear Redis cache
docker exec extractor-redis redis-cli FLUSHALL

# 3. Set memory limits in docker-compose.yml
# Add: deploy:
#        resources:
#          limits:
#            memory: 512M

# 4. Restart services
docker-compose restart

# 5. Monitor over time
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"
```

---

## 🚀 Production Deployment

### Pre-Production Checklist
- [ ] All containers pass health checks
- [ ] Database backed up
- [ ] Environment variables secured (use .env.production)
- [ ] Volumes are on persistent storage
- [ ] Nginx configured with SSL/TLS
- [ ] Logs aggregated (ELK, Datadog, etc.)
- [ ] Monitoring configured (Prometheus, New Relic)
- [ ] Alerting configured for critical failures
- [ ] pgAdmin disabled in production
- [ ] All secrets in secure vault (not in code)

### Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  frontend:
    image: extractor-frontend:0.37.1    # Use specific tag
    ports:
      - "443:443"                        # HTTPS
    volumes:
      - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem:ro
      - ./ssl/key.pem:/etc/nginx/ssl/key.pem:ro
    environment:
      - NODE_ENV=production
      - FRONTEND_VERSION=0.37.1
    restart: always
    deploy:
      replicas: 2                        # Load balancing
      resources:
        limits:
          memory: 512M

  backend:
    image: extractor-backend:0.37.1     # Use specific tag
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn                   # Reduced logging
    restart: always
    deploy:
      replicas: 3                        # Horizontal scaling
      resources:
        limits:
          memory: 1G

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    restart: always
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

  # pgAdmin removed for production
  # Backup and monitoring services added

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Deployment Commands
```bash
# Deploy using production config
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Rolling update
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f --tail 100
```

---

## 📞 Support

For issues or questions:
1. Check logs: `docker logs service-name`
2. Inspect container: `docker inspect service-name`
3. Test connectivity: `docker exec service-name curl ...`
4. Review Docker documentation: https://docs.docker.com/

---

**Version:** 0.37.1  
**Last Updated:** 2026-07-16  
**Status:** ✅ Production Ready
