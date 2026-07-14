# 🚀 Quick Start Guide - Application Usage

**Status**: ✅ Production Ready  
**Version**: 0.18.0  
**Date**: 2026-07-14

---

## 📍 Application Status

✅ **All Services Running**
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:5173
- Database: PostgreSQL (healthy)
- Cache: Redis (healthy)

---

## 🌐 Access the Application

### Via Web Browser
1. **Frontend UI**: Open http://localhost:5173 in your browser
2. **Backend Health**: Check http://localhost:3000/api/health

### Via API (Command Line)

#### Test Basic Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2026-07-14T05:23:00.000Z",
    "uptime": 150
  }
}
```

---

## 📄 Extract Documents

### Option 1: PDF Extraction

**Using cURL**:
```bash
curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@invoice.pdf" \
  -F "docType=invoice"
```

**Using PowerShell**:
```powershell
$form = @{
  document = Get-Item "C:\path\to\invoice.pdf"
  docType = "invoice"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/extract/pdf" `
  -Method Post `
  -Form $form
```

### Option 2: HTML Extraction

```bash
curl -X POST http://localhost:3000/api/extract/html \
  -F "document=@page.html" \
  -F "docType=invoice"
```

---

## 🔍 View Available Rulesets

**Get list of all document types**:
```bash
curl http://localhost:3000/api/extract/rules
```

**Get specific ruleset details**:
```bash
curl http://localhost:3000/api/extract/rules/invoice
```

---

## ✅ Test Pattern Matching

**Test if a regex pattern works**:
```bash
curl -X POST http://localhost:3000/api/extract/validate \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
    "sampleText": "Invoice #INV-2026-001 dated July 14, 2026"
  }'
```

Expected response:
```json
{
  "data": {
    "matched": true,
    "value": "INV-2026-001",
    "confidence": 0.9,
    "matchCount": 1
  }
}
```

---

## 📊 Check Extraction Quality

**Get quality metrics for all extractions**:
```bash
curl http://localhost:3000/api/extract/quality
```

---

## 🔧 Manage Rules

### Update Rules

```bash
curl -X PUT http://localhost:3000/api/extract/rules/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "field": "invoice_number",
        "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
        "confidence": 0.95,
        "required": true
      },
      {
        "field": "amount",
        "pattern": "\\$([0-9,]+\\.\\d{2})",
        "confidence": 0.90,
        "required": true
      }
    ],
    "description": "Updated invoice extraction rules",
    "changeReason": "Improved patterns based on user feedback",
    "owner": "john.doe@example.com"
  }'
```

### Test Rules Against Samples

```bash
curl -X POST http://localhost:3000/api/extract/rules/invoice/test-batch \
  -H "Content-Type: application/json" \
  -d '{
    "testRules": [
      {
        "field": "invoice_number",
        "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
        "confidence": 0.95,
        "required": true
      }
    ],
    "sampleCount": 5
  }'
```

### View Rule History

```bash
curl http://localhost:3000/api/extract/rules/invoice/history
```

### Publish Rules to Production

```bash
curl -X POST http://localhost:3000/api/extract/rules/invoice/publish \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.2.0",
    "publishNotes": "Approved for production use",
    "testBatchId": "test-batch-001"
  }'
```

---

## 💾 Backup Data

### Create Backup

```bash
curl -X POST http://localhost:3000/api/backup/create \
  -H "Content-Type: application/json" \
  -d '{
    "label": "pre-deployment-backup",
    "includeDatabase": true,
    "includeFiles": true
  }'
```

### List Backups

```bash
curl http://localhost:3000/api/backup/list
```

---

## 📋 View System Logs

**Get recent logs**:
```bash
curl "http://localhost:3000/api/logs?limit=20&levels=error,warn"
```

**Search logs**:
```bash
curl "http://localhost:3000/api/logs?search=extraction&limit=50"
```

---

## ⚙️ Configuration

### Get Current Config

```bash
curl http://localhost:3000/api/config
```

### Update Config

```bash
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "defaultRuleSet": "invoice",
    "maxUploadSize": "50MB",
    "extractionTimeout": 30000
  }'
```

---

## 🔄 Frontend UI Navigation

### Main Features

1. **Home / Dashboard**
   - View extraction statistics
   - Access recent extractions
   - Monitor system health

2. **Extract Documents**
   - Upload PDF/HTML files
   - Select document type
   - View extraction results

3. **Manage Rules**
   - View all rulesets
   - Edit extraction patterns
   - Test patterns
   - View version history

4. **Quality Dashboard**
   - View extraction success rates
   - Analyze by document type
   - Identify problem patterns

5. **Settings**
   - Configure system settings
   - Manage backups
   - View logs

6. **Help & Documentation**
   - View glossary
   - Access user manual
   - Find tutorials

---

## 📊 Sample Workflows

### Workflow 1: Extract Invoice & Get Results

```bash
# 1. Upload and extract
RESULT=$(curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@invoice.pdf" \
  -F "docType=invoice" \
  -s | jq '.data.resultId' -r)

echo "Extraction ID: $RESULT"

# 2. View results
curl http://localhost:3000/api/extract/results/$RESULT
```

### Workflow 2: Test New Pattern Before Deployment

```bash
# 1. Test pattern
curl -X POST http://localhost:3000/api/extract/validate \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "INV-([0-9]{4}-[0-9]{6})",
    "sampleText": "Invoice: INV-2026-001234"
  }'

# 2. Update rules
curl -X PUT http://localhost:3000/api/extract/rules/invoice \
  -H "Content-Type: application/json" \
  -d '{"rules": [...], "changeReason": "New pattern"}'

# 3. Test batch
curl -X POST http://localhost:3000/api/extract/rules/invoice/test-batch \
  -H "Content-Type: application/json" \
  -d '{"testRules": [...], "sampleCount": 10}'

# 4. Publish if tests pass
curl -X POST http://localhost:3000/api/extract/rules/invoice/publish \
  -H "Content-Type: application/json" \
  -d '{"version": "2.2.0", "publishNotes": "Approved"}'
```

### Workflow 3: Monitor Extraction Quality

```bash
# 1. Get overall quality metrics
curl http://localhost:3000/api/extract/quality

# 2. Analyze by document type
curl "http://localhost:3000/api/extract/quality?docType=invoice"

# 3. View problem areas
curl "http://localhost:3000/api/logs?search=extraction&levels=error"
```

---

## 🐛 Troubleshooting

### Backend Not Responding

**Check if server is running**:
```bash
curl http://localhost:3000/api/health
```

**If connection refused**:
```bash
# Check Docker status
docker-compose ps

# Restart if needed
docker-compose restart extractor-backend
```

### Database Connection Error

```bash
# Check database health
curl http://localhost:3000/api/health/database

# Restart if needed
docker-compose restart extractor-postgres
```

### Frontend Not Loading

```bash
# Check if frontend is running
curl http://localhost:5173

# If not, restart
docker-compose restart extractor-frontend
```

### File Upload Fails

- Check file format (must be PDF, HTML, or DOCX)
- Check file size (max 50MB)
- Check docType parameter exists

### Pattern Not Matching

- Use online regex tester: https://regex101.com
- Test with `/api/extract/validate` endpoint first
- Make sure pattern is properly escaped in JSON

---

## 📚 Documentation

- **Full API Reference**: See [API_ENDPOINTS_COMPLETE_REFERENCE.md](API_ENDPOINTS_COMPLETE_REFERENCE.md)
- **Architecture**: See [PROJECT.md](PROJECT.md)
- **Release Notes**: See [RELEASE_NOTES_0.26.0.md](RELEASE_NOTES_0.26.0.md)

---

## 🚀 Deployment

### Prerequisites
- Docker & Docker Compose installed
- 2GB free disk space
- Ports 3000, 5173, 5432, 6379 available

### Start Services
```bash
docker-compose up -d
```

### Monitor Startup
```bash
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

---

## 💡 Tips & Best Practices

1. **Always backup before updating rules**
   ```bash
   curl -X POST http://localhost:3000/api/backup/create \
     -H "Content-Type: application/json" \
     -d '{"label": "pre-update"}'
   ```

2. **Test new patterns in isolation first**
   - Use `/api/extract/validate` to test regex
   - Use `/api/extract/rules/:docType/test-batch` to test against multiple samples
   - Only publish after tests pass

3. **Monitor extraction quality regularly**
   ```bash
   curl http://localhost:3000/api/extract/quality
   ```

4. **Keep logs for audit trail**
   - Logs are automatically recorded
   - Access via `/api/logs` endpoint
   - Use for troubleshooting

5. **Use descriptive change reasons**
   - When updating rules, provide clear reason
   - Helps with version history and rollback decisions

---

**Version**: 0.18.0  
**Last Updated**: 2026-07-14  
**Status**: ✅ Production Ready
