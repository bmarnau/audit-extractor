# 📈 Migration & Upgrade Guide

## Versions Overview

| Version | Release Date | Status | Breaking Changes |
|---------|--------------|--------|-----------------|
| 0.18.0 | 2026-07-09 | Current | No |
| 0.17.0 | 2026-07-08 | Previous | No |
| 0.16.0 | 2026-07-07 | Archived | No |
| 0.15.0 | 2026-07-06 | Archived | No |

---

## Pre-Migration Checklist

- [ ] Read release notes for target version
- [ ] Backup current database
- [ ] Stop extraction jobs
- [ ] Notify users of downtime window
- [ ] Test migration on staging environment
- [ ] Have rollback plan ready

---

## Migration Path: v0.17.0 → v0.18.0

### **Step 1: Backup Current System**

```bash
# Create database backup
docker-compose exec postgres pg_dump -U extractor_user extractor_db \
  > backup_v0.17.0_$(date +%Y%m%d_%H%M%S).sql

# Backup uploaded files
tar -czf backup_schemas_v0.17.0.tar.gz schemas/
tar -czf backup_results_v0.17.0.tar.gz results/
tar -czf backup_documents_v0.17.0.tar.gz source-documents/
```

### **Step 2: Pull New Version**

```bash
# Option A: Via Git
git fetch origin
git checkout v0.18.0
git pull

# Option B: Manual download
# Download release package from releases page
# Extract to project directory
```

### **Step 3: Rebuild Services**

```bash
# Build new images
docker-compose build backend --no-cache
docker-compose build frontend --no-cache

# Option: Push to registry for rollback capability
docker tag extractor-backend:latest myregistry/extractor-backend:0.18.0
docker push myregistry/extractor-backend:0.18.0
```

### **Step 4: Apply Database Migrations**

```bash
# Run migrations
docker-compose down backend frontend
docker-compose up postgres -d
docker-compose run backend npm run migrate

# Verify schema changes
docker-compose exec postgres psql -U extractor_user -d extractor_db -c "\d schemas"
```

### **Step 5: Deploy New Version**

```bash
# Start updated services
docker-compose up -d backend frontend

# Wait for services to be healthy
# Check health every 5 seconds for 2 minutes
for i in {1..24}; do
  curl -s http://localhost/api/health && echo "✅ Healthy" && break
  echo "⏳ Waiting... ($i/24)"
  sleep 5
done
```

### **Step 6: Validate Upgrade**

```bash
# Check version
curl http://localhost/api/config | jq '.version'
# Should output: 0.18.0

# Verify all schemas still exist
curl http://localhost/api/schema/schemas | jq '.count'

# Run health check
curl http://localhost/api/health | jq '.status'
# Should be: "healthy"

# Test extraction workflow
# Via UI or API call
```

### **Step 7: Rollback (if needed)**

```bash
# Stop current version
docker-compose down

# Restore database from backup
docker volume rm extractor_postgres_data
docker-compose up postgres -d
docker-compose exec postgres psql -U extractor_user extractor_db < backup_v0.17.0_*.sql

# Checkout previous version
git checkout v0.17.0

# Rebuild and restart
docker-compose build backend --no-cache
docker-compose up -d
```

---

## Migration: v0.16.0 → v0.18.0 (Two-Step)

When upgrading more than one minor version, use intermediate version:

```bash
# Step 1: Upgrade to v0.17.0 first
git checkout v0.17.0
docker-compose build backend --no-cache
docker-compose up -d backend
# Wait for health check to pass

# Step 2: Upgrade to v0.18.0
git checkout v0.18.0
docker-compose build backend --no-cache
docker-compose up -d backend

# Verify
curl http://localhost/api/config | jq '.version'
```

---

## Data Migration Scenarios

### **Scenario 1: Migrating from MySQL to PostgreSQL**

This application currently uses PostgreSQL. If migrating from MySQL:

```bash
# Export from MySQL
mysqldump -u user -p database > mysql_dump.sql

# Convert schema to PostgreSQL syntax
# Recommended: Use tools like pgloader or manual conversion

# Import to PostgreSQL
docker-compose exec postgres psql -U extractor_user extractor_db < mysql_dump.sql

# Verify data integrity
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT COUNT(*) FROM schemas;"
```

---

### **Scenario 2: Migrating Schemas Between Instances**

**Export from Source:**
```bash
docker-compose exec postgres pg_dump -U extractor_user extractor_db \
  -t schemas -t extraction_rules > schemas_export.sql

# Or export as JSON
curl http://localhost/api/schema/schemas > schemas_backup.json
```

**Import to Target:**
```bash
# Copy schemas directory
scp -r source:/app/schemas/* target:/app/schemas/

# Import database
docker-compose exec postgres psql -U extractor_user extractor_db < schemas_export.sql

# Verify
curl http://target/api/schema/schemas | jq '.count'
```

---

### **Scenario 3: Environment Variable Changes**

If environment variables change between versions:

```bash
# Copy old .env
cp .env .env.backup

# Create new .env from template
cp .env.example .env

# Update with production values
nano .env

# Restart services with new config
docker-compose down
docker-compose up -d
```

---

## Feature Upgrades

### **Upgrading to Multi-Schema Support (v0.17.0+)**

This version adds support for multiple schemas per user.

**Migration Steps:**
1. Existing single schemas are automatically supported
2. No data migration needed
3. New UI automatically enables multi-schema UI

**Verify:**
```bash
curl http://localhost/api/schema/schemas | jq '.data | length'
# Should show all existing schemas
```

---

### **Upgrading to Advanced Rule Generation (v0.18.0+)**

Enhanced rule generation engine.

**Manual Rebuild of Existing Rules:**
```bash
# For each existing schema:
SCHEMA_ID="<uuid>"

curl -X POST http://localhost/api/schema/$SCHEMA_ID/generate-rules \
  -H "Content-Type: application/json" \
  -d '{"aggressiveness": 0.6}' | jq '.rulesGenerated'
```

---

## Performance Considerations

### **After Upgrade to v0.18.0**

The new version includes performance optimizations:

1. **Redis caching enabled** - No action needed, automatic
2. **Query optimization** - Database indexes automatically used
3. **Batch processing** - Extraction jobs processed more efficiently

**To manually optimize:**

```bash
# Rebuild database indexes
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "REINDEX DATABASE extractor_db;"

# Clear cache
docker-compose exec redis redis-cli FLUSHALL

# Analyze tables
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "ANALYZE;"
```

---

## Downtime Analysis

| Component | Downtime | Notes |
|-----------|----------|-------|
| Database | ~2 minutes | During migration |
| Backend API | ~1 minute | Container restart |
| Frontend | ~30 seconds | Just rebuild |
| Extraction jobs | Paused | Queued jobs resume after restart |
| User Sessions | Lost | Users must re-login after backend restart |

**Total Expected Downtime: 5-10 minutes**

---

## Production Deployment Strategy

### **Blue-Green Deployment** (Recommended)

```bash
# Production running v0.17.0 on "Blue" environment

# Step 1: Prepare "Green" environment with v0.18.0
docker tag extractor-backend:latest myregistry/extractor-backend:0.18.0-green
docker push myregistry/extractor-backend:0.18.0-green

# Deploy to green
kubectl set image deployment/extractor-backend-green \
  backend=myregistry/extractor-backend:0.18.0-green

# Step 2: Run smoke tests on green
curl http://green.extractor.local/api/health

# Step 3: Switch load balancer to green
kubectl patch service extractor-backend -p '{"spec":{"selector":{"version":"green"}}}'

# Step 4: Monitor for issues (5 minutes)
# If all good: blue becomes spare
# If problems: Quickly switch back to blue
```

---

## Rollback Strategy

### **Immediate Rollback (within 1 hour)**

```bash
# Quick switch back to previous version
git checkout v0.17.0
docker-compose build backend --no-cache
docker-compose up -d

# Database will rollback automatically as no schema changes
```

### **Full Rollback (with restore)**

```bash
# Stop new version
docker-compose down

# Restore database from backup
docker-compose up postgres -d
docker-compose exec postgres psql -U extractor_user extractor_db < backup_v0.17.0.sql

# Return to previous code version
git checkout v0.17.0
docker-compose build backend --no-cache
docker-compose up -d
```

---

## Monitoring Post-Migration

**First 24 hours - Critical monitoring:**

```bash
# Check error logs every 5 minutes
docker-compose logs backend --since 5m | grep -i error

# Monitor extraction job success rate
curl http://localhost/api/extraction/stats | jq '.successRate'

# Check database performance
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT * FROM pg_stat_statements LIMIT 10;"

# Monitor resource usage
docker stats --no-stream
```

**Week 1 - Stability monitoring:**
- Track API response times
- Monitor error rates
- Check extraction accuracy
- Verify backup completion

---

## Common Migration Issues

### **Issue: Database migration hangs**

```bash
# Kill stuck migration process
docker-compose exec postgres psql -U postgres -c "SELECT pid, query FROM pg_stat_activity WHERE query LIKE '%migrate%';"
docker-compose exec postgres psql -U postgres -c "SELECT pg_terminate_backend(<PID>);"

# Restart migration
docker-compose down backend
docker-compose up backend
```

### **Issue: Container won't start after migration**

```bash
# Check logs
docker-compose logs backend --tail 50

# Verify config
docker-compose config | grep -A5 "backend:"

# Rebuild clean
docker-compose down backend
docker-compose build backend --no-cache
docker-compose up backend
```

### **Issue: Data appears missing after migration**

```bash
# Verify database was restored correctly
docker-compose exec postgres psql -U extractor_user -d extractor_db \
  -c "SELECT COUNT(*) FROM schemas;"

# If count is 0, restore backup
docker-compose exec postgres psql -U extractor_user extractor_db < backup.sql
```

---

## Testing Before Production Migration

1. **Create test environment** - Clone production data
2. **Run migration** - Test upgrade process
3. **Verify all features** - Test all workflows
4. **Performance test** - Ensure SLA compliance
5. **Backup test** - Verify restore works
6. **Rollback test** - Confirm rollback procedure

---

## Support & Questions

For migration issues not covered here:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review release notes: [RELEASE_NOTES_0.18.0.md](RELEASE_NOTES_0.18.0.md)
3. Check GitHub Issues
4. Contact support team

---

**Last Updated:** 2026-07-09  
**Version:** 0.18.0  
**Next Version:** TBD
