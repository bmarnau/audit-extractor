# 🔌 API Reference Documentation

## Authentication

All API requests must include authentication headers:

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

Default: Uses `default-user` when not specified.

---

## Schema Management APIs

### 1. Upload Schema
**Endpoint:** `POST /api/schema/upload`

**Purpose:** Upload a JSON Schema and example documents

**Request:**
```json
{
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "title": "Invoice",
    "properties": {
      "invoiceNumber": { "type": "string" },
      "totalAmount": { "type": "number" }
    },
    "required": ["invoiceNumber"]
  },
  "examples": [
    { "invoiceNumber": "INV-2026-001", "totalAmount": 1500.00 }
  ],
  "name": "Invoice Schema"
}
```

**Response (201 Created):**
```json
{
  "schemaId": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "schemaName": "Invoice Schema",
  "userId": "default-user",
  "version": 1,
  "fieldsCount": 2,
  "examplesCount": 1,
  "createdAt": "2026-07-09T04:00:47.404717Z",
  "directoryPath": "/schemas/Invoice Schema",
  "message": "Schema uploaded and persisted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid schema format
- `409 Conflict` - Schema name already exists
- `500 Internal Server Error` - Database error

---

### 2. Get All Schemas
**Endpoint:** `GET /api/schema/schemas`

**Purpose:** List all schemas for current user

**Query Parameters:**
- `userId` (optional): Filter by specific user, defaults to `default-user`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "744b290c-ed29-466a-bc41-f627ce86ecdf",
      "name": "Invoice Schema",
      "version": 1,
      "fieldsCount": 2,
      "examplesCount": 1,
      "status": "active",
      "createdAt": "2026-07-09T04:00:47Z",
      "updatedAt": "2026-07-09T04:00:47Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Schema Details
**Endpoint:** `GET /api/schema/:schemaId`

**Purpose:** Retrieve detailed schema configuration

**Path Parameters:**
- `schemaId` (required): UUID of schema

**Response (200 OK):**
```json
{
  "id": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "name": "Invoice Schema",
  "userId": "default-user",
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": { ... }
  },
  "version": 1,
  "examplesCount": 1,
  "generatedRulesCount": 0,
  "status": "draft",
  "createdAt": "2026-07-09T04:00:47Z",
  "updatedAt": "2026-07-09T04:00:47Z"
}
```

---

### 4. Update Schema
**Endpoint:** `PATCH /api/schema/:schemaId`

**Purpose:** Update schema configuration (creates new version)

**Request:**
```json
{
  "name": "Invoice Schema v2",
  "description": "Updated schema with additional fields",
  "schema": { ... }
}
```

**Response (200 OK):**
```json
{
  "id": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "name": "Invoice Schema v2",
  "version": 2,
  "previousVersionId": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "message": "Schema updated successfully"
}
```

---

### 5. Delete Schema
**Endpoint:** `DELETE /api/schema/:schemaId`

**Purpose:** Archive (soft delete) a schema

**Response (200 OK):**
```json
{
  "message": "Schema archived successfully",
  "schemaId": "744b290c-ed29-466a-bc41-f627ce86ecdf"
}
```

---

## Rule Generation APIs

### 1. Generate Extraction Rules
**Endpoint:** `POST /api/schema/:schemaId/generate-rules`

**Purpose:** Generate extraction rules from schema and examples

**Path Parameters:**
- `schemaId` (required): UUID of schema

**Request Body (Optional):**
```json
{
  "aggressiveness": 0.6,
  "keywords": ["invoice", "receipt", "bill"],
  "customRules": []
}
```

**Response (200 OK):**
```json
{
  "ruleSetId": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "rulesGenerated": 15,
  "averageConfidence": 0.87,
  "rules": [
    {
      "fieldName": "invoiceNumber",
      "patterns": ["INV-\\d{4}-\\d{3}", "Invoice #\\d+"],
      "confidence": 0.95,
      "examples": ["INV-2026-001"]
    }
  ],
  "message": "Rules generated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid aggressiveness value (must be 0-1)
- `404 Not Found` - Schema not found
- `422 Unprocessable Entity` - Insufficient examples
- `500 Internal Server Error` - Generation error

---

## Document Extraction APIs

### 1. Extract Document
**Endpoint:** `POST /api/extraction/extract`

**Purpose:** Extract data from document using schema

**Request:**
```json
{
  "schemaId": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "documentPath": "/path/to/document.pdf",
  "fileType": "pdf"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-abc123def456",
  "schemaId": "744b290c-ed29-466a-bc41-f627ce86ecdf",
  "documentName": "document.pdf",
  "status": "processing",
  "createdAt": "2026-07-09T04:00:47Z",
  "message": "Extraction job created"
}
```

---

### 2. Get Extraction Result
**Endpoint:** `GET /api/extraction/:jobId`

**Purpose:** Poll extraction job status and result

**Path Parameters:**
- `jobId` (required): Job identifier

**Response (200 OK):**
```json
{
  "jobId": "job-abc123def456",
  "status": "completed",
  "progress": 100,
  "extractedData": {
    "invoiceNumber": "INV-2026-001",
    "totalAmount": 1500.00,
    "confidence": 0.92
  },
  "processingTimeMs": 2340,
  "createdAt": "2026-07-09T04:00:47Z",
  "completedAt": "2026-07-09T04:00:50Z"
}
```

**Status Values:**
- `queued` - Waiting to start
- `processing` - Currently extracting
- `completed` - Finished successfully
- `failed` - Error during extraction

---

## Backup APIs

### 1. List Backups
**Endpoint:** `GET /api/backup/list`

**Purpose:** Get all available backups

**Response (200 OK):**
```json
{
  "data": {
    "total": 3,
    "backups": [
      {
        "id": "backup-001",
        "timestamp": "2026-07-09T03:00:00Z",
        "size": "125MB",
        "status": "completed"
      }
    ]
  }
}
```

---

### 2. Create Backup
**Endpoint:** `POST /api/backup/create`

**Purpose:** Trigger manual backup

**Response (200 OK):**
```json
{
  "backupId": "backup-manual-001",
  "timestamp": "2026-07-09T04:00:00Z",
  "message": "Backup started"
}
```

---

### 3. Restore Backup
**Endpoint:** `POST /api/backup/restore/:backupId`

**Purpose:** Restore system from backup

**Warning:** ⚠️ This will overwrite current data!

**Response (200 OK):**
```json
{
  "backupId": "backup-001",
  "message": "Restore completed successfully"
}
```

---

## Health & Status APIs

### 1. System Health
**Endpoint:** `GET /api/health`

**Purpose:** Check system component status

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-09T04:00:47Z",
  "components": {
    "database": "connected",
    "redis": "connected",
    "filesystem": "accessible"
  }
}
```

---

### 2. Configuration
**Endpoint:** `GET /api/config`

**Purpose:** Get system configuration (non-sensitive)

**Response (200 OK):**
```json
{
  "version": "0.18.0",
  "environment": "development",
  "apiUrl": "http://localhost:3000",
  "features": {
    "multiSchema": true,
    "aiGeneration": true,
    "pdfExtraction": true
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_SCHEMA",
    "message": "Schema validation failed",
    "details": [
      {
        "field": "properties.invoiceNumber",
        "issue": "Missing type definition"
      }
    ]
  },
  "timestamp": "2026-07-09T04:00:47Z",
  "requestId": "req-abc123def456"
}
```

---

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Exceeding limit**: Returns `429 Too Many Requests`

---

## Webhook Events (Future)

```json
{
  "event": "extraction.completed",
  "jobId": "job-abc123def456",
  "status": "success",
  "timestamp": "2026-07-09T04:00:47Z",
  "data": { ... }
}
```

Events:
- `extraction.queued`
- `extraction.processing`
- `extraction.completed`
- `extraction.failed`
- `schema.created`
- `schema.updated`

---

**API Version:** v1  
**Last Updated:** 2026-07-09  
**Status:** Active (v0.18.0)
