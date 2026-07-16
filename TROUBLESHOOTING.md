# 🔧 Troubleshooting Guide

## Common Issues & Solutions

---

## 1. Backend Service Issues

### **Problem: Backend returns 500 errors**

**Symptoms:**
- All API endpoints return HTTP 500
- Logs show: `ECONNREFUSED` or `Cannot find database`

**Solutions:**

**Step 1:** Check if PostgreSQL is running
```bash
docker-compose ps postgres
# Should show "Up" status
```

**Step 2:** Verify database connectivity
```bash
docker-compose exec backend npm run check-db
```

**Step 3:** Review backend logs
```bash
docker-compose logs backend --tail 50
```

**Step 4:** Restart backend service
```bash
docker-compose restart backend
```

**Root Causes:**
- PostgreSQL container stopped
- Network connectivity issue
- Invalid DATABASE_URL
- Schema migration not applied

---

### **Problem: UUID validation error - "invalid input syntax for type uuid"**

**Symptoms:**
- Rule generation fails with UUID error
- Database rejects UUID parameters

**Solutions:**

**Step 1:** Verify schema ID format
```javascript
// In browser console
console.log(schemaId); // Should be: 744b290c-ed29-466a-bc41-f627ce86ecdf
```

**Step 2:** Check database has schema
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT id, name FROM schemas LIMIT 5;"
```

**Step 3:** Verify TypeORM entity columns
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "\d schemas"
```

**Step 4:** Check API response structure
```bash
curl -X POST http://localhost:3000/api/schema/upload \
  -H "Content-Type: application/json" \
  -d '{"schema":{...},"examples":[...],"name":"test"}' | jq '.schemaId'
```

**Root Causes:**
- schemaRepository.update() not returning entity with id
- UUID generation failed
- Frontend receiving malformed response

---

### **Problem: "Cannot find module" errors**

**Symptoms:**
- Backend crashes with MODULE_NOT_FOUND
- Missing src/ files in dist/

**Solutions:**

```bash
# Clean rebuild
docker-compose down backend
rm -rf src/dist
docker-compose build backend --no-cache
docker-compose up backend

# Check build output
docker-compose logs backend --tail 30
```

---

## 2. Frontend Issues

### **Problem: Blank screen or 404 errors**

**Symptoms:**
- Homepage shows nothing
- Console shows 404 for CSS/JS

**Solutions:**

**Step 1:** Check frontend logs
```bash
docker-compose logs frontend --tail 20
```

**Step 2:** Verify Nginx configuration
```bash
docker-compose exec frontend nginx -t
# Should show: "successful"
```

**Step 3:** Check API endpoint
```bash
curl -X GET http://localhost/api/config
# Should return version info
```

**Step 4:** Force rebuild frontend
```bash
docker-compose down frontend
docker-compose build frontend --no-cache
docker-compose up frontend
```

**Root Causes:**
- Backend not running (API 502/503)
- Frontend build failed
- Nginx misconfigured

---

### **Problem: Schema Wizard fails at Step 5 (Rule Generation)**

**Symptoms:**
- Steps 1-4 work fine
- "Regeln generieren" button shows error alert

**Solutions:**

**Step 1:** Check if schema was saved
```bash
# Query database
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT id, name, created_at FROM schemas ORDER BY created_at DESC LIMIT 1;"
```

**Step 2:** Get exact error from backend
```bash
# Watch logs while clicking button
docker-compose logs backend -f --tail 20
```

**Step 3:** Test rule generation via API
```bash
SCHEMA_ID="<UUID from database>"
curl -X POST http://localhost:3000/api/schema/$SCHEMA_ID/generate-rules \
  -H "Content-Type: application/json" \
  -d '{"aggressiveness": 0.6}' | jq '.'
```

**Step 4:** Check schema validity
```bash
# Verify schema has examples
curl -X GET http://localhost:3000/api/schema/$SCHEMA_ID | jq '.examplesCount'
# Should be > 0
```

---

### **Problem: CORS or proxy errors**

**Symptoms:**
- Frontend requests return CORS errors
- Error: `No 'Access-Control-Allow-Origin'`

**Solutions:**

**Check Nginx proxy config:**
```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf | grep -A5 "proxy_pass"
```

**If blocked:**
```bash
docker-compose down frontend
# Edit frontend/nginx.conf to add proper headers
docker-compose up frontend
```

---

## 3. Database Issues

### **Problem: "relation does not exist" errors**

**Symptoms:**
- Error: `relation "schemas" does not exist`
- API returns 500

**Solutions:**

**Step 1:** Check if tables exist
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db -c "\dt"
```

**Step 2:** If missing, run migration
```bash
docker-compose exec backend npm run migrate
# Or manually:
docker-compose exec postgres psql -U extractor_user -d extractor_db < migrations/schema.sql
```

**Step 3:** Verify schema structure
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "\d schemas"
```

---

### **Problem: Slow queries or timeouts**

**Symptoms:**
- API requests timeout (> 30 seconds)
- Database CPU at 100%

**Solutions:**

**Step 1:** Check active queries
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

**Step 2:** List long-running queries
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

**Step 3:** Kill hung query
```bash
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT pg_terminate_backend(<PID>);"
```

**Step 4:** Enable query logging
```bash
docker-compose exec postgres psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
docker-compose exec postgres psql -U postgres -c "SELECT pg_reload_conf();"
```

---

### **Problem: Backup/Restore failures**

**Symptoms:**
- Backup API returns 500
- Cannot restore from backup

**Solutions:**

**Manual backup:**
```bash
docker-compose exec postgres pg_dump -U extractor_user extractor_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Manual restore:**
```bash
docker-compose exec postgres psql -U extractor_user extractor_db < backup_file.sql
```

**Check backup permissions:**
```bash
ls -la results/backups/
# Should be readable by docker container user
```

---

## 4. Redis Cache Issues

### **Problem: Redis connection refused**

**Symptoms:**
- Error: `ECONNREFUSED 0.37.0.1:6379`
- Cache operations fail

**Solutions:**

```bash
# Check if Redis is running
docker-compose ps redis

# If not running, start it
docker-compose up redis

# Test connection
docker-compose exec backend redis-cli ping
# Should return: PONG

# Clear cache
docker-compose exec redis redis-cli FLUSHALL
```

---

### **Problem: Cache is stale/incorrect data**

**Symptoms:**
- Old data being returned
- Changes not reflected

**Solutions:**

```bash
# Clear all cache
docker-compose exec redis redis-cli FLUSHALL

# Or clear specific key
docker-compose exec redis redis-cli DEL "schema:*"

# Verify cache is empty
docker-compose exec redis redis-cli DBSIZE
# Should return: (integer) 0
```

---

## 5. Docker Networking Issues

### **Problem: Containers can't communicate**

**Symptoms:**
- Backend can't reach database
- Error: `failed to resolve 'postgres': Name or service not known`

**Solutions:**

**Check network:**
```bash
docker network ls | grep extractor
docker network inspect extractor-network
```

**If missing, recreate:**
```bash
docker-compose down
docker network create extractor-network
docker-compose up -d
```

**Test connectivity between containers:**
```bash
docker-compose exec backend ping postgres
docker-compose exec backend nc -zv postgres 5432
```

---

### **Problem: Port conflicts (Address already in use)**

**Symptoms:**
- Error: `bind: address already in use`

**Solutions:**

**Find process using port:**
```bash
# On Windows
netstat -ano | findstr :3000
# Or
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess

# On Linux/Mac
lsof -i :3000
```

**Kill process and restart:**
```bash
docker-compose down
# Wait 10 seconds for ports to release
Start-Sleep 10
docker-compose up -d
```

---

## 6. Performance Tuning

### **Slow Rule Generation**

```bash
# Monitor backend CPU/Memory
docker stats extractor-backend --no-stream

# Reduce aggressiveness setting (0.0 = fast, 1.0 = slow)
# Or reduce number of examples
```

### **Slow PDF Extraction**

```bash
# Check document size
ls -lh /path/to/pdf

# Monitor extraction job
curl http://localhost/api/extraction/<jobId> | jq '.progress'

# Optimize: Convert large PDFs to text first
```

---

## 7. Useful Debug Commands

```bash
# View all environment variables
docker-compose exec backend printenv | grep -E "DB_|REDIS_|NODE_"

# Check disk space
docker exec extractor-postgres df -h

# View recent changes in schemas
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT id, name, updated_at FROM schemas ORDER BY updated_at DESC LIMIT 10;"

# Count total records
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT 'schemas' as table, COUNT(*) FROM schemas 
       UNION ALL SELECT 'extraction_rules', COUNT(*) FROM extraction_rules 
       UNION ALL SELECT 'extraction_runs', COUNT(*) FROM extraction_runs;"

# Monitor network traffic
docker stats extractor-backend extractor-postgres extractor-redis

# Check all container status
docker-compose ps

# Full system health check
curl -s http://localhost/api/health | jq '.'
```

---

## 8. Emergency Procedures

### **Full Reset (⚠️ WARNING: DELETES ALL DATA)**

```bash
# Stop everything
docker-compose down -v
# -v flag removes all volumes (database will be empty)

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Initialize database
docker-compose exec backend npm run migrate
```

### **Restore from Backup**

```bash
# Stop services
docker-compose down

# Clear database volume
docker volume rm extractor_postgres_data

# Start services (empty database)
docker-compose up -d

# Restore from backup
docker-compose exec postgres psql -U extractor_user extractor_db < backup_2026-07-09.sql
```

---

## 9. Getting More Help

1. **Check Backend Logs** (most detailed)
   ```bash
   docker-compose logs backend --tail 100
   ```

2. **Check Frontend Console** (browser F12)
   - Network tab for API calls
   - Console for JavaScript errors

3. **Query Database Directly**
   ```bash
   docker-compose exec postgres psql -U extractor_user -d extractor_db
   # Then SQL queries
   ```

4. **Check System Resources**
   ```bash
   docker stats
   docker-compose ps
   ```

---

**Last Updated:** 2026-07-09  
**Version:** 0.37.0
