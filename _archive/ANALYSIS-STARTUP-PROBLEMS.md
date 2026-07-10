# AUDIT-EXTRACTOR: SYSTEMATISCHE ANALYSE - RACE CONDITIONS & STARTUP-PROBLEME

## KRITISCHE BEFUNDE: 5 NACHWEISBARE PROBLEME

| # | Problem | Datei | Zeile | Ursache | Auswirkung | Schweregrad | Fix |
|---|---------|-------|------|--------|-----------|------------|-----|
| **1** | **Schema-Liste zeigt 0 Einträge nach Fresh Start** | `src/presentation/SchemaExtractionRoutes.ts` | 164 | Private Property Access ohne öffentliche API. `schemaManagementService['schemaRepository']` greift auf private Property zu | Frontend zeigt "No schemas found" obwohl DB Daten enthält | 🔴 **CRITICAL** | Exportiere `getSchemas()` Methode in SchemaManagementService |
| **2** | **Frontend-Nginx startet bevor Backend bereit** | `docker-compose.yml` | 104-110 | Frontend `depends_on: backend` nutzt nur `condition: service_started`, nicht `service_healthy` | Frontend Cache enthält alte 404s vor Backend-Readiness | 🔴 **CRITICAL** | Change zu `condition: service_healthy` |
| **3** | **Backend-Database-Init keine Retry-Logik** | `src/infrastructure/api/index.ts` | 50-60 | `initializeDatabase()` wird sofort ohne Retry aufgerufen, obwohl `depends_on.condition: service_healthy` nur pg_isready prüft | Intermittente "Connection refused" bei langsamen Systemen | 🟠 **HIGH** | Implementiere exponential backoff Retry-Logik (5 versuche) |
| **4** | **Healthcheck nutzt suboptimales Protokoll** | `Dockerfile.backend` | 39 | Healthcheck nutzt Node.js HTTP-Call statt einfaches `wget` wie andere Services | Träge Healthcheck-Evaluierung, höhere CPU-Last | 🟡 **MEDIUM** | Standardisiere auf `wget --no-verbose` wie Frontend |
| **5** | **PostgreSQL Healthcheck zu aggressive** | `docker-compose.yml` | 17 | Interval 10s, Timeout 5s, Retries 5 = nur 50s bis unhealthy, aber DB-Init braucht oft 30-40s | Timeout bei komplexen Init-Skripten | 🟡 **MEDIUM** | Erhöhe Timeout auf 10s, Initial-Delay auf 15s |

---

## ADDITIONALLY FOUND ISSUES

| # | Problem | Datei | Zeile | Ursache | Auswirkung | Schweregrad |
|---|---------|-------|------|--------|-----------|------------|
| **6** | **Frontend .env.production hat relative API URL** | `frontend/.env.production` | 4 | `VITE_API_URL=/api` ist korrekt aber nicht getestet nach Fresh Build | Kann zu lokalen Verwechslungen führen in Dev | 🟢 **LOW** |
| **7** | **SchemaExtractionRoutes hat kein Error Handling** | `src/presentation/SchemaExtractionRoutes.ts` | 158-186 | Bei `findAllByUser()` Fehler = einfaches 500, kein Detail-Logging | Debugging in Production unmöglich | 🟡 **MEDIUM** |

---

## TIMING-ANALYSE: Startup-Sequenz

```
T+0s:   docker-compose up
T+8s:   postgres healthy (15s timeout)
T+8s:   redis healthy (12s healthcheck)
T+10s:  backend container starts (depends_on postgres,redis)
T+12s:  backend Service Container init
T+15s:  backend Database init (BUT NO RETRY - FAILS IF DB NOT 100% READY)
T+50s:  backend healthcheck start (start_period=40s)
T+52s:  backend healthcheck passes
T+10s:  frontend container starts (depends_on backend, BUT NO CONDITION!)
T+15s:  frontend nginx ready BUT BACKEND NOT READY YET
T+20s:  frontend healthcheck succeeds
        ⚠️  RACE CONDITION WINDOW: T+10s to T+52s where Frontend is ready but Backend not
```

---

## ROOT CAUSE ANALYSIS

### Primary Issue:  Private Property Access
```typescript
// WRONG (Line 164, SchemaExtractionRoutes.ts)
const allSchemas = await schemaManagementService['schemaRepository'].findAllByUser(userId);

// Problem:
// - schemaRepository ist private in SchemaManagementService
// - Accessing private properties via string key kann compiliert werden aber:
//   - Wird bei Build/Tree-Shaking entfernt
//   - Ist nicht typsicher
//   - Ist Antipattern
// - Daher: allSchemas = undefined
// - Deshalb: Frontend erhält leeres Array
```

### Secondary Issue: Dependency Timing
```yaml
# docker-compose.yml Line 104-110
frontend:
  depends_on:
    - backend  # ❌ Defaults to condition: service_started, not service_healthy
  healthcheck:
    start_period: 20s  # Frontend starts checking after 20s
    
backend:
  depends_on:
    postgres:
      condition: service_healthy  # ✅ Correct
    redis:
      condition: service_healthy  # ✅ Correct
  healthcheck:
    start_period: 40s  # Backend checks start at T+40s, passes around T+52s
```

Result: Frontend starts at T+10s, backend not ready until T+52s = **42 second gap**

---

## EVIDENCE FROM BROWSER MONITORING

```
API Call: GET /api/schema/schemas?page=1&limit=20
Status: 200 OK
Response Time: 2ms

Response Body:
{
  "data": [],           ← EMPTY ARRAY (but should have 2 schemas)
  "timestamp": "...",
  "path": "/schemas",
  "duration": 25
}

Database has 2 schemas (TestSchema, Test Person Schema)
But API returns: []
```

Conclusion: **Frontend is working correctly, API endpoint returns empty data due to schemaRepository access issue**

---

## AFFECTED COMPONENTS

- ✅ Database: Has data
- ✅ Backend Service: Running  
- ❌ API Endpoint: Returns wrong data
- ❌ Frontend: Shows "No schemas found"

