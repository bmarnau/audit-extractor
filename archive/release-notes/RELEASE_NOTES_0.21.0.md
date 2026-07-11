# Release Notes - v0.21.0 - Phase 21 Extended: Asynchronous Job API

**Release Date**: 2026-07-10  
**Status**: ✅ COMPLETE & TESTED  
**Phase**: 21 Extended (Async Jobs)

---

## 🎯 Executive Summary

Phase 21 Extended introduces **comprehensive asynchronous job processing** to the Document Extractor, enabling:

1. **Non-blocking extraction** - Jobs run in background without blocking API
2. **Full lifecycle tracking** - Status transitions from queued → running → completed/failed/cancelled
3. **Persistent results** - Job outputs stored in PostgreSQL for later retrieval
4. **Failure handling** - Automatic error capture with retry capability
5. **Production-ready monitoring** - Metrics, statistics, and export capabilities

**Key Metrics**:
- ✅ 4 REST endpoints (POST, GET, GET result, DELETE)
- ✅ 5 job status types
- ✅ 10+ JobRepository methods
- ✅ Full integration with ExtractionPipeline
- ✅ Async processing with proper error handling

---

## 🆕 New Features

### 1. JobEntity - PostgreSQL Table

```typescript
@Entity('jobs')
export class JobEntity {
  id: string (UUID, primary key)
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  
  // Timestamps
  requestedAt: Date (auto)
  startedAt: Date | null
  completedAt: Date | null
  
  // Data
  jobInput: any (JSONB)
  resultData: any (JSONB, nullable)
  
  // Error Handling
  errorMessage: string | null
  errorDetails: any | null
  
  // Metadata
  userId: string | null
  documentId: string | null
  jobType: string ('extraction' | other)
  description: string | null
  
  // Performance
  duration: number (milliseconds)
  retryCount: number
  maxRetries: number (default 3)
}
```

**Indexes** for performance:
- `status` - Fast status filtering
- `requestedAt` - Time-range queries
- `userId` - User-specific job tracking

---

### 2. JobRepository - Data Access Layer

10 methods providing complete CRUD and query operations:

| Method | Purpose | Example |
|--------|---------|---------|
| `create()` | Create new job | `await repo.create(input, metadata)` |
| `findById()` | Get by ID | `await repo.findById('job-123')` |
| `updateStatus()` | Transition status | `await repo.updateStatus(id, 'running')` |
| `start()` | Mark running | `await repo.start(jobId)` |
| `complete()` | Mark finished | `await repo.complete(jobId, results, duration)` |
| `fail()` | Mark failed | `await repo.fail(jobId, errorMsg)` |
| `cancel()` | Mark cancelled | `await repo.cancel(jobId)` |
| `query()` | Filter & paginate | `await repo.query({status, limit, offset})` |
| `getStatistics()` | Metrics | `await repo.getStatistics()` |
| `exportAsJson()` / `exportAsCsv()` | Export | `await repo.exportAsJson(filter)` |

---

### 3. JobService - Business Logic

Orchestrates job lifecycle and ExtractionPipeline integration:

```typescript
// Create and start async job
const job = await jobService.createJob({
  documentContent: "...",
  ruleSet: {...},
  extractionConfig: {...},
  jobType: "extraction",
  userId: "user-123"
});
// Returns immediately with job.id
// Processing happens in background

// Check status
const job = await jobService.getJob(jobId);
console.log(job.status); // 'running' | 'completed' | 'failed'

// Get results
const result = await jobService.getJobResult(jobId);
// Returns { status, result, duration } or { status, error }

// Cancel running job
await jobService.cancelJob(jobId);

// Retry failed job
await jobService.retryFailedJob(jobId);
```

---

### 4. REST API Endpoints

#### **POST /api/jobs** - Create Job

**Request**:
```json
{
  "documentContent": "Document text to extract from",
  "ruleSet": { /* optional rules */ },
  "extractionConfig": { /* optional config */ },
  "jobType": "extraction",
  "description": "Optional description"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "requestedAt": "2026-07-10T12:30:45.123Z"
  },
  "timestamp": "2026-07-10T12:30:45.234Z",
  "path": "/api/jobs",
  "duration": 42
}
```

**Status**: Returns immediately (job queued for processing)

---

#### **GET /api/jobs/{id}** - Get Job Details

**Response**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "jobType": "extraction",
    "requestedAt": "2026-07-10T12:30:45.123Z",
    "startedAt": "2026-07-10T12:30:46.234Z",
    "completedAt": null,
    "duration": 0,
    "retryCount": 0,
    "errorMessage": null
  },
  "timestamp": "2026-07-10T12:30:46.345Z",
  "path": "/api/jobs/550e8400-e29b-41d4-a716-446655440000",
  "duration": 15
}
```

---

#### **GET /api/jobs/{id}/result** - Get Job Result

**Response when running**:
```json
{
  "data": {
    "status": "running",
    "message": "Job is running",
    "requestedAt": "2026-07-10T12:30:45.123Z",
    "startedAt": "2026-07-10T12:30:46.234Z"
  }
}
```

**Response when completed**:
```json
{
  "data": {
    "status": "completed",
    "result": {
      "extractedData": { /* extracted values */ },
      "confidence": 0.95,
      "errors": [],
      "statistics": { /* metrics */ }
    },
    "duration": 2341,
    "completedAt": "2026-07-10T12:30:48.567Z"
  }
}
```

**Response when failed**:
```json
{
  "data": {
    "status": "failed",
    "error": "Processing failed due to invalid input",
    "details": { /* error stack */ },
    "duration": 500
  }
}
```

---

#### **DELETE /api/jobs/{id}** - Cancel Job

**Response**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "message": "Job cancelled"
  },
  "timestamp": "2026-07-10T12:30:49.678Z",
  "path": "/api/jobs/550e8400-e29b-41d4-a716-446655440000",
  "duration": 12
}
```

**Constraints**:
- Cannot cancel completed, failed, or cancelled jobs
- Returns 400 Bad Request if invalid state

---

## 📊 Job Status Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                   Created (POST /api/jobs)              │
│                     id + status=queued                  │
│                     requestedAt = now                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      QUEUED                             │
│         Waiting for processing to start                 │
│         User can: GET status, DELETE to cancel          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      RUNNING                            │
│    startedAt = now, ExtractionPipeline executing       │
│    User can: GET status, DELETE to cancel              │
└──────────────┬────────────────────────┬─────────────────┘
               │                        │
        ✅ Success              ❌ Error Occurs
               │                        │
               ▼                        ▼
    ┌──────────────────┐    ┌──────────────────┐
    │    COMPLETED     │    │      FAILED      │
    │ completedAt=now  │    │ errorMessage set │
    │ resultData saved │    │ retryCount += 1  │
    │ duration tracked │    │ can retryFailedJob
    └──────────────────┘    └──────────────────┘

    Or: DELETE during RUNNING/QUEUED
               │
               ▼
    ┌──────────────────┐
    │    CANCELLED     │
    │ completedAt=now  │
    │ user-initiated   │
    └──────────────────┘
```

---

## 🔧 Integration Points

### Service Container Registration

```typescript
// src/infrastructure/di/ServiceContainer.ts
container.registerSingleton(JobRepository);
container.registerSingleton(JobService);
```

### Database Entity Registration

```typescript
// src/infrastructure/database/data-source.ts
entities: [SchemaEntity, AuditLogEntity, JobEntity]
```

### Route Mounting

```typescript
// src/infrastructure/api/index.ts
const jobRoutes = createJobRoutes();
app.use('/api/jobs', jobRoutes);
```

### Async Processing

Jobs are automatically processed in background:

```typescript
// JobService.createJob() calls processJobAsync() without await
this.processJobAsync(jobId).catch(err => {
  console.error(`[JobService] Error processing job ${jobId}:`, err);
});
```

---

## 📈 Example Workflows

### Workflow 1: Simple Extraction Job

```bash
# 1. Create job (returns immediately)
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "Invoice #123: Total $500",
    "jobType": "extraction"
  }'
# Response: { data: { id: "job-123", status: "queued" } }

# 2. Poll for status
curl http://localhost:3000/api/jobs/job-123
# Response: { data: { status: "running", ... } }

# 3. Get result (when completed)
curl http://localhost:3000/api/jobs/job-123/result
# Response: { data: { status: "completed", result: {...} } }
```

### Workflow 2: Error Handling & Retry

```bash
# Job fails during processing
curl http://localhost:3000/api/jobs/job-456
# Response: { data: { status: "failed", errorMessage: "..." } }

# Retry the job
curl -X POST http://localhost:3000/api/jobs/job-456/retry
# Response: { data: { status: "queued", retryCount: 1 } }

# Check updated status
curl http://localhost:3000/api/jobs/job-456
# Response: { data: { status: "running", retryCount: 1 } }
```

### Workflow 3: Cancel Running Job

```bash
# Check running job
curl http://localhost:3000/api/jobs/job-789
# Response: { data: { status: "running" } }

# Cancel it
curl -X DELETE http://localhost:3000/api/jobs/job-789
# Response: { data: { status: "cancelled" } }
```

---

## 🧪 Testing

**Test Suite**: `test-phase21-jobs.ps1`

```bash
pwsh test-phase21-jobs.ps1
```

**Tests Included**:
1. POST /api/jobs (create job) - 201
2. GET /api/jobs/{id} (get details) - 200
3. GET /api/jobs/{id}/result (get result) - 200
4. GET /api/jobs (list jobs) - 200
5. GET /api/jobs?status=queued (filter) - 200
6. DELETE /api/jobs/{id} (cancel) - 200
7. GET /api/jobs/{invalid-id} (404 error) - 404

---

## 📋 API Response Format

All responses follow the standardized format:

```json
{
  "data": { /* endpoint-specific */ },
  "timestamp": "2026-07-10T12:30:45.123Z",
  "path": "/api/jobs",
  "duration": 42
}
```

**Error Response**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2026-07-10T12:30:45.123Z",
  "path": "/api/jobs",
  "duration": 42
}
```

---

## 🔒 Error Handling

| Error | Status | Code |
|-------|--------|------|
| Invalid input | 400 | `INVALID_INPUT` |
| Job not found | 404 | `JOB_NOT_FOUND` |
| Cannot cancel completed job | 400 | `INVALID_JOB_STATUS` |
| Create error | 500 | `JOB_CREATE_ERROR` |
| Processing error | 500 | `JOB_PROCESSING_ERROR` |

---

## 📊 Statistics & Monitoring

**Get job system statistics**:

```typescript
const stats = await jobService.getStatistics();
// Returns:
{
  totalJobs: 150,
  byStatus: {
    queued: 5,
    running: 2,
    completed: 130,
    failed: 10,
    cancelled: 3
  },
  averageDuration: 2450,    // milliseconds
  failureRate: 6.67,         // percentage
  lastHour: 12              // jobs in last hour
}
```

---

## 🎓 Key Learnings

1. **Async Processing**: Jobs must process asynchronously without blocking API
2. **Status Tracking**: Full lifecycle tracking enables monitoring and retry
3. **Error Resilience**: Automatic error capture allows debugging and recovery
4. **Data Persistence**: Results stored in DB for later retrieval
5. **Integration**: Seamless integration with existing ExtractionPipeline

---

## 🚀 Next Steps (Phase 22+)

- [ ] WebSocket support for real-time job status updates
- [ ] Job scheduling (cron-like patterns)
- [ ] Batch job processing
- [ ] Job priority queues
- [ ] Dead letter queue for permanently failed jobs
- [ ] Job metrics/analytics dashboard
- [ ] Rate limiting per user

---

## 📞 Support & Feedback

For issues or suggestions:
1. Check docs/integration-audit.md for architectural overview
2. Review test-phase21-jobs.ps1 for API usage examples
3. Consult CHANGELOG.md for recent changes

---

**Release Status**: ✅ COMPLETE & TESTED  
**Build Status**: ✅ 0 TypeScript Errors  
**Test Coverage**: ✅ 7/7 API tests passing  
**Docker Status**: ✅ All containers healthy

