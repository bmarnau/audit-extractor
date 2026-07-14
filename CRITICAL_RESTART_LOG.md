# KRITISCHER NEUSTART - DOKUMENTATION
**Datum:** 2026-07-14  
**Status:** LÄUFT  
**Ziel:** Kompletter Neustart mit systematischem Test aller Endpoints und Routen

---

## PHASE 1: PRE-FLIGHT CHECK

### 1.1 Docker-Status
- ✅ Docker Compose v5.2.0 installiert
- ✅ Keine Container laufend
- ✅ Bereit für sauberen Start

### 1.2 Konfigurationsvalidierung
- [ ] docker-compose.yml validieren
- [ ] Backend Dockerfile prüfen
- [ ] Frontend Dockerfile prüfen
- [ ] Ports verfügbar (3000, 5173, 5432, 6379)

---

## PHASE 2: SERVICE STARTUP

### 2.1 Docker Build (Backend)
- [ ] Beginn: --
- [ ] Ende: --
- [ ] Status: --
- [ ] Fehler: --

### 2.2 Docker Build (Frontend)
- [ ] Beginn: --
- [ ] Ende: --
- [ ] Status: --
- [ ] Fehler: --

### 2.3 Container Startup
- [ ] postgres: --
- [ ] redis: --
- [ ] backend: --
- [ ] pgadmin: --
- [ ] frontend: --

---

## PHASE 3: HEALTH CHECKS

### 3.1 Service Connectivity
- [ ] PostgreSQL (5432): --
- [ ] Redis (6379): --
- [ ] Backend (3000): --
- [ ] Frontend (5173): --

### 3.2 Health Endpoints
- [ ] GET /api/health: --
- [ ] GET /api/buildInfo: --

---

## PHASE 4: API ROUTE TESTING

### Backend Routes (/api/*)
- [ ] GET /api/health - Expected: 200
- [ ] GET /api/buildInfo - Expected: 200
- [ ] GET /api/audit - Expected: 200
- [ ] GET /api/documents - Expected: 200
- [ ] GET /api/rules - Expected: 200
- [ ] GET /api/extraction - Expected: 200
- [ ] POST /api/extract - Expected: 200/202

### Frontend Routes (localhost:5173/*)
- [ ] GET / (Dashboard) - Expected: 200
- [ ] GET /health - Expected: 200
- [ ] GET /help - Expected: 200
- [ ] GET /logs - Expected: 200
- [ ] GET /schemas - Expected: 200
- [ ] GET /jobs - Expected: 200
- [ ] GET /rules - Expected: 200
- [ ] GET /backup - Expected: 200
- [ ] GET /api - Expected: 200
- [ ] GET /settings - Expected: 200
- [ ] GET /extraction - Expected: 200
- [ ] GET /workbench - Expected: 200
- [ ] GET /audit - Expected: 200
- [ ] GET /configuration - Expected: 200
- [ ] GET /documents - Expected: 200
- [ ] GET /ireport - Expected: 200
- [ ] GET /schema-wizard - Expected: 200

---

## PHASE 5: DATA VALIDATION

### 5.1 API Response Structure
- [ ] /api/health returns {data: {status, timestamp, uptime, memory, environment}}
- [ ] /api/buildInfo returns {data: {version, buildNumber, buildTime, nodeVersion, environment}}

### 5.2 Frontend State
- [ ] Dashboard renders correctly
- [ ] Navigation drawer functional
- [ ] Dark mode toggle works
- [ ] Version displayed: 0.34.0

### 5.3 Database Connectivity
- [ ] PostgreSQL connection established
- [ ] Redis connection established
- [ ] Schema data available

---

## PHASE 6: CRITICAL ISSUES TRACKING

### Issues Found
| Issue | Severity | Status | Solution |
|-------|----------|--------|----------|
| -- | -- | -- | -- |

---

## PHASE 7: FINAL STATUS

### Services Status
- [ ] Backend: HEALTHY
- [ ] Frontend: HEALTHY
- [ ] Database: HEALTHY
- [ ] Cache: HEALTHY

### Endpoints Status
- [ ] All API endpoints: RESPONSIVE
- [ ] All Frontend routes: ACCESSIBLE

### User-Facing Features
- [ ] Frontend usable: YES/NO
- [ ] Critical bugs found: YES/NO
- [ ] Performance acceptable: YES/NO

---

## TIMELINE

| Time | Event | Duration |
|------|-------|----------|
| 00:00 | Start | -- |
| -- | Pre-flight checks | -- |
| -- | Docker build backend | -- |
| -- | Docker build frontend | -- |
| -- | Service startup | -- |
| -- | Health checks | -- |
| -- | API testing | -- |
| -- | Frontend testing | -- |
| -- | **COMPLETE** | -- |

---

## NÄCHSTE SCHRITTE
1. Backend Dockerfile validieren
2. Docker-Compose starten
3. Alle Services hochfahren
4. Endpoints systematisch testen
5. Frontend Routes prüfen
6. Fehlerbericht erstellen
