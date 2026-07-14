# 📚 Complete API Endpoints Reference

**Version**: 0.18.0  
**Status**: ✅ Production-Ready  
**Last Updated**: 2026-07-14

---

## 🌐 Base URL

```
http://localhost:3000/api
```

---

## ✅ Health & Status Endpoints

### 1. GET /api/health
**Description**: Check if backend server is running  
**Response**: 200 OK
```json
{
  "status": "healthy",
  "timestamp": "2026-07-14T05:23:00.000Z",
  "uptime": 125.5
}
```

### 2. GET /api/health/database
**Description**: Check PostgreSQL database connection  
**Response**: 200 OK if connected, 503 if disconnected
```json
{
  "database": "connected",
  "status": "healthy",
  "message": "PostgreSQL database connection is active"
}
```

### 3. GET /api/health/info
**Description**: Get build and version information  
**Response**: 200 OK
```json
{
  "version": "0.18.0",
  "buildTime": "2026-07-14T05:20:00.000Z",
  "buildNumber": "unknown",
  "environment": "development",
  "uptime": 125.5
}
```

### 4. GET /api/health/build
**Description**: Get detailed build metadata  
**Response**: 200 OK
```json
{
  "version": "0.18.0",
  "buildNumber": "build-123",
  "gitInfo": {
    "branch": "main",
    "shortHash": "a1b2c3d4",
    "isDirty": false
  }
}
```

### 5. GET /api/health/sync
**Description**: Check Git synchronization status  
**Response**: 200 OK
```json
{
  "isSynced": true,
  "syncMessage": "Repository is in sync",
  "remote": {
    "branch": "main",
    "commitsAhead": 0,
    "commitsBehind": 0
  }
}
```

### 6. POST /api/health/restart
**Description**: Restart backend server (development only)  
**Response**: 200 OK
```json
{
  "status": "restart_initiated",
  "message": "Backend restart initiated - reconnect in 3 seconds"
}
```

### 7. POST /api/health/verify
**Description**: Verify version compatibility  
**Response**: 200 OK or 422 if mismatches detected
```json
{
  "isValid": true,
  "versions": {
    "frontend": "0.18.0",
    "backend": "0.18.0"
  },
  "versionMatch": true
}
```

---

## 📄 Configuration Endpoints

### 1. GET /api/config
**Description**: Retrieve current configuration  
**Response**: 200 OK
```json
{
  "data": {
    "defaultRuleSet": "invoice",
    "maxUploadSize": "50MB",
    "extractionTimeout": 30000,
    "validationRules": {...}
  }
}
```

### 2. PUT /api/config
**Description**: Update configuration  
**Request**: `Content-Type: application/json`
```json
{
  "defaultRuleSet": "contract",
  "extractionTimeout": 45000
}
```
**Response**: 200 OK with updated config

---

## 🔍 Audit Endpoints

### 1. GET /api/audit/{documentId}
**Description**: Get audit trail for a specific document  
**Parameters**: 
- `documentId` (path): Document ID to audit
- `limit` (query): Number of records (default: 50)
- `offset` (query): Pagination offset

**Response**: 200 OK
```json
{
  "data": {
    "documentId": "doc-123",
    "events": [
      {
        "timestamp": "2026-07-14T05:20:00Z",
        "action": "EXTRACTION_STARTED",
        "user": "system",
        "details": {...}
      }
    ]
  }
}
```

---

## 📖 Help & Documentation Endpoints

### 1. GET /api/help/glossary
**Description**: Get glossary of terms  
**Response**: 200 OK
```json
{
  "data": {
    "terms": [
      {
        "term": "ruleset",
        "definition": "Set of extraction patterns..."
      }
    ]
  }
}
```

### 2. GET /api/help/manual
**Description**: Get user manual documentation  
**Response**: 200 OK with markdown content

---

## 📋 Logs Endpoints

### 1. GET /api/logs
**Description**: Query system logs  
**Query Parameters**:
- `limit` (int): Number of logs (default: 50)
- `search` (string): Search term
- `levels` (string): Comma-separated log levels (error,warn,info)

**Response**: 200 OK
```json
{
  "data": {
    "logs": [
      {
        "timestamp": "2026-07-14T05:20:00Z",
        "level": "info",
        "message": "Server started",
        "source": "index.ts"
      }
    ],
    "total": 150
  }
}
```

---

## 💾 Backup Endpoints

### 1. GET /api/backup/list
**Description**: List all available backups  
**Response**: 200 OK
```json
{
  "data": {
    "backups": [
      {
        "id": "backup-001",
        "timestamp": "2026-07-14T05:00:00Z",
        "size": "1.2 MB",
        "status": "completed"
      }
    ]
  }
}
```

### 2. POST /api/backup/create
**Description**: Create a new backup  
**Request**: `Content-Type: application/json`
```json
{
  "label": "pre-deployment-backup",
  "includeDatabase": true,
  "includeFiles": true
}
```
**Response**: 201 Created
```json
{
  "data": {
    "backupId": "backup-002",
    "status": "completed",
    "timestamp": "2026-07-14T05:25:00Z",
    "size": "1.5 MB"
  }
}
```

---

## 🔧 Extraction Endpoints

### ⚠️ Important: Base Path `/api/extract` is NOT an endpoint
The `/api/extract` path is a **base path only**. You must use specific sub-endpoints like those below.

### 1. GET /api/extract/rules
**Description**: List all available extraction rulesets  
**Response**: 200 OK
```json
{
  "data": {
    "rulesList": [
      {
        "docType": "invoice",
        "version": "2.1.0",
        "fieldCount": 12,
        "successRate": 0.94,
        "description": "Invoice extraction rules"
      },
      {
        "docType": "contract",
        "version": "1.5.0",
        "fieldCount": 8,
        "successRate": 0.87
      }
    ],
    "totalRulesets": 2
  }
}
```

### 2. GET /api/extract/rules/:docType
**Description**: Get specific ruleset details  
**Parameters**: 
- `docType` (path): Document type (e.g., "invoice", "contract")

**Response**: 200 OK
```json
{
  "data": {
    "docType": "invoice",
    "version": "2.1.0",
    "rules": [
      {
        "field": "invoice_number",
        "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
        "confidence": 0.95,
        "required": true
      }
    ],
    "rulesCount": 12
  }
}
```

### 3. POST /api/extract/pdf
**Description**: Upload PDF file and extract data using rules  
**Content-Type**: `multipart/form-data`  
**Parameters**:
- `document` (file, required): PDF file to extract from
- `docType` (form field, required): Document type (e.g., "invoice")

**Example with cURL**:
```bash
curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@invoice.pdf" \
  -F "docType=invoice"
```

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "resultId": "extraction-1721009101234-a1b2c3d4",
    "documentReference": {
      "fileName": "invoice.pdf",
      "docType": "invoice",
      "fileSize": 125432,
      "uploadedAt": "2026-07-14T05:25:00Z"
    },
    "extractedFields": [
      {
        "field": "invoice_number",
        "value": "INV-2026-001",
        "confidence": 0.95
      }
    ],
    "missingFields": [],
    "warnings": []
  },
  "message": "PDF extracted successfully",
  "timestamp": "2026-07-14T05:25:00Z"
}
```

### 4. POST /api/extract/html
**Description**: Upload HTML file and extract data using rules  
**Content-Type**: `multipart/form-data`  
**Parameters**:
- `document` (file, required): HTML file to extract from
- `docType` (form field, required): Document type

**Response**: 200 OK (same format as PDF)

### 5. POST /api/extract/validate
**Description**: Test regex pattern against sample text  
**Content-Type**: `application/json`  
**Request Body**:
```json
{
  "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
  "sampleText": "Invoice #INV-2026-001 dated..."
}
```

**Response**: 200 OK
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

### 6. GET /api/extract/quality
**Description**: Get extraction quality metrics and statistics  
**Response**: 200 OK
```json
{
  "data": {
    "summary": {
      "totalExtractions": 45,
      "successfulExtractions": 42,
      "overallSuccessRate": 0.933
    },
    "byDocType": {
      "invoice": {
        "count": 25,
        "avgSuccessRate": 0.94
      },
      "contract": {
        "count": 20,
        "avgSuccessRate": 0.92
      }
    }
  }
}
```

### 7. PUT /api/extract/rules/:docType
**Description**: Update extraction rules (creates new version)  
**Content-Type**: `application/json`  
**Request Body**:
```json
{
  "rules": [
    {
      "field": "invoice_number",
      "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
      "confidence": 0.95,
      "required": true
    }
  ],
  "description": "Updated invoice extraction rules",
  "changeReason": "Improved pattern for invoices with new formats",
  "owner": "john.doe@example.com"
}
```

**Response**: 200 OK
```json
{
  "data": {
    "docType": "invoice",
    "version": "2.2.0",
    "modifyCount": 5,
    "rulesUpdated": 12,
    "changeReason": "Improved pattern for invoices with new formats"
  }
}
```

### 8. POST /api/extract/rules/:docType/test-batch
**Description**: Test updated rules against multiple samples  
**Content-Type**: `application/json`  
**Request Body**:
```json
{
  "testRules": [
    {
      "field": "invoice_number",
      "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
      "confidence": 0.95,
      "required": true
    }
  ],
  "sampleCount": 5
}
```

**Response**: 200 OK
```json
{
  "data": {
    "docType": "invoice",
    "testSamples": 5,
    "passedTests": 5,
    "failedTests": 0,
    "successRate": 1.0,
    "recommendations": []
  }
}
```

### 9. GET /api/extract/rules/:docType/history
**Description**: View version history for a ruleset  
**Response**: 200 OK
```json
{
  "data": {
    "docType": "invoice",
    "versions": [
      {
        "version": "2.2.0",
        "changeReason": "Improved pattern for invoices with new formats",
        "modifiedAt": "2026-07-14T05:20:00Z",
        "modifiedBy": "john.doe@example.com"
      },
      {
        "version": "2.1.0",
        "changeReason": "Initial release",
        "modifiedAt": "2026-07-10T10:00:00Z",
        "modifiedBy": "system"
      }
    ]
  }
}
```

### 10. POST /api/extract/rules/:docType/publish
**Description**: Publish and lock a ruleset version for production  
**Content-Type**: `application/json`  
**Request Body**:
```json
{
  "version": "2.2.0",
  "publishNotes": "Approved for production use",
  "testBatchId": "test-batch-001"
}
```

**Response**: 200 OK
```json
{
  "data": {
    "docType": "invoice",
    "publishedVersion": "2.2.0",
    "status": "PUBLISHED",
    "effectiveFrom": "2026-07-14T05:25:00Z",
    "rulesLocked": true
  }
}
```

---

## 🔄 Revision Endpoints

### 1. GET /api/revision/runs
**Description**: List extraction runs and revision history  
**Response**: 200 OK

### 2. POST /api/revision/save-run
**Description**: Save extraction run for comparison  
**Request Body**:
```json
{
  "runId": "run-001",
  "extractedFields": {...},
  "metadata": {...}
}
```

---

## 📊 Schema Endpoints

### 1. GET /api/schema/...
**Description**: Schema-driven extraction and analysis  
**Response**: 200 OK

---

## 🏢 Jobs Endpoints

### 1. GET /api/jobs/...
**Description**: Asynchronous job management (Phase 21)  
**Response**: 200 OK

---

## ⚠️ Common Errors

### 404 Not Found
**Cause**: Endpoint path is incorrect  
**Example**: `POST /api/extract` (base path without sub-endpoint)  
**Fix**: Use specific endpoint like `POST /api/extract/pdf`

### 400 Bad Request
**Cause**: Missing required parameters or invalid JSON  
**Fix**: Check request body and query parameters

### 401 Unauthorized
**Cause**: Missing or invalid authentication  
**Fix**: Add proper authorization headers if required

### 503 Service Unavailable
**Cause**: Database connection failed  
**Fix**: Ensure PostgreSQL container is running: `docker-compose ps`

---

## 🧪 Quick Test Commands

### Test Backend Health
```bash
curl http://localhost:3000/api/health
```

### List Available Rulesets
```bash
curl http://localhost:3000/api/extract/rules
```

### Test Pattern Validation
```bash
curl -X POST http://localhost:3000/api/extract/validate \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "Invoice\\s+#?([A-Z0-9-]+)",
    "sampleText": "Invoice #INV-2026-001"
  }'
```

### Upload and Extract PDF
```bash
curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@sample.pdf" \
  -F "docType=invoice"
```

---

## 📚 Frontend

**URL**: http://localhost:5173

---

## 🔧 Troubleshooting

### "Cannot GET /api/extract"
**Problem**: Trying to call `/api/extract` directly  
**Solution**: Use specific endpoints like `/api/extract/rules` or `/api/extract/pdf`

### "Database disconnected"
**Problem**: PostgreSQL container not running  
**Solution**: 
```bash
docker-compose ps
docker-compose up -d
```

### "Connection refused on port 3000"
**Problem**: Backend not running  
**Solution**:
```bash
npm run dev
# or if in Docker:
docker logs extractor-backend
```

---

**Version**: 0.18.0  
**Last Updated**: 2026-07-14 05:25 UTC+2  
**Status**: ✅ All endpoints operational
