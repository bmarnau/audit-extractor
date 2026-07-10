# Phase 16: Database Persistence & Advanced Features
**Date:** 2026-07-07  
**Status:** Planning  
**Previous Phases:** Phase 14 & 15e ✅ Complete

---

## Executive Summary

Phase 16 focuses on moving from **in-memory storage** to **persistent database** storage, enabling production-grade data management and analytics capabilities.

### Key Objectives
- ✅ Migrate in-memory data to persistent storage
- ✅ Implement data versioning and audit trails
- ✅ Add backup/restore functionality
- ✅ Enable multi-tenant support
- ✅ Prepare for machine learning features

---

## Architecture Overview

### Current System (Phase 15e)
```
Frontend (React)
    ↓
API Layer (Express)
    ↓
Services (TSyringe DI)
    ↓
In-Memory Storage (Revision System)
    └─ Lost on restart
```

### Target System (Phase 16)
```
Frontend (React)
    ↓
API Layer (Express)
    ↓
Services (TSyringe DI)
    ↓
Database Layer
    ├─ Documents (PostgreSQL)
    ├─ Extractions (PostgreSQL)
    ├─ Revisions (PostgreSQL)
    └─ Analytics (TimescaleDB)
    ↓
File Storage
    ├─ Uploaded PDFs (Azure Blob)
    ├─ Generated Reports (Azure Blob)
    └─ Backups (Azure Blob)
```

---

## Implementation Strategy

### Phase 16.1: Database Foundation (Weeks 1-2)

#### 1. Database Selection
**PostgreSQL 15+** (Production-Ready)
- ✅ JSONB support for flexible schema
- ✅ Full-text search capabilities
- ✅ Native UUID type
- ✅ Excellent TypeScript support (typeorm, prisma)
- ✅ Azure Database for PostgreSQL available

**Alternative:** SQLite for development, PostgreSQL for production

#### 2. ORM Framework
**TypeORM** (Recommended)
- ✅ Decorators align with TSyringe DI pattern
- ✅ Migration system for schema versioning
- ✅ Query builder for type-safe queries
- ✅ Repository pattern for data access

**Alternative:** Prisma (simpler but less flexible)

#### 3. Data Models to Implement

##### Document Entity
```typescript
@Entity('documents')
class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() originalFileName: string;
  @Column() mimeType: string;
  @Column() fileSize: number;
  @Column('jsonb') metadata: DocumentMetadata;
  @Column() uploadedAt: Date;
  @Column() userId: string; // For multi-user support
  @OneToMany(() => ExtractionRun, run => run.document)
  runs: ExtractionRun[];
}
```

##### ExtractionRun Entity
```typescript
@Entity('extraction_runs')
class ExtractionRun {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() documentId: string;
  @Column('jsonb') extractedFields: Record<string, ExtractedField>;
  @Column() coverage: number;
  @Column('jsonb') validationErrors: ValidationError[];
  @Column() ruleSetVersion: string;
  @Column() completedAt: Date;
  @Column() executionTimeMs: number;
  @Column() processingModel: string; // llm-3.5, llm-4, local-bert, etc.
  @ManyToOne(() => Document, doc => doc.runs)
  document: Document;
}
```

##### Revision Entity (Enhancement)
```typescript
@Entity('revision_history')
class RevisionHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() runId: string;
  @Column() documentId: string;
  @Column('jsonb') changes: DiffItem[];
  @Column() changedBy: string;
  @Column() changeReason: string;
  @Column() createdAt: Date;
  @Index(['documentId', 'createdAt'])
  composite_idx: string;
  @ManyToOne(() => ExtractionRun)
  run: ExtractionRun;
}
```

##### AuditLog Entity (New)
```typescript
@Entity('audit_logs')
class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() action: string; // 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'
  @Column() resourceType: string; // 'Document', 'ExtractionRun', 'Rule'
  @Column() resourceId: string;
  @Column('jsonb') changes: { before?: any; after?: any };
  @Column() ipAddress: string;
  @Column() timestamp: Date;
  @Index(['userId', 'timestamp'])
  user_time_idx: string;
}
```

---

### Phase 16.2: Service Layer Migration (Weeks 2-3)

#### 1. Database Service Implementation
```typescript
@Injectable({ scope: Scope.Singleton })
class ExtractionRepository {
  constructor(private db: DataSource) {}
  
  async saveExtraction(data: ExtractionResult): Promise<ExtractionRun> {
    const repo = this.db.getRepository(ExtractionRun);
    return await repo.save({
      ...data,
      completedAt: new Date(),
      executionTimeMs: calculateDuration()
    });
  }
  
  async getExtractionHistory(documentId: string): Promise<ExtractionRun[]> {
    const repo = this.db.getRepository(ExtractionRun);
    return await repo.find({
      where: { documentId },
      order: { completedAt: 'DESC' },
      relations: ['document']
    });
  }
  
  async getExtractionById(id: string): Promise<ExtractionRun | null> {
    const repo = this.db.getRepository(ExtractionRun);
    return await repo.findOne({ where: { id } });
  }
}
```

#### 2. Migration from In-Memory to Persistent
**Strategy:** Parallel running during transition
- Keep RevisionService in-memory for backward compatibility
- Add DatabaseService alongside
- Route new operations to database
- Batch migrate old in-memory data to DB

#### 3. Service Updates Required
- `RunHistoryService` → Database backed
- `RevisionService` → Database backed
- `ExtractionEngine` → Persist results immediately
- `AuditService` → Log all operations

---

### Phase 16.3: API Enhancements (Week 3)

#### New Endpoints for Reporting

```typescript
// Analytics & Reporting
GET /api/analytics/extraction-summary
  - Total documents processed
  - Success rate
  - Average extraction time
  - Model performance comparison
  - Field extraction accuracy per type

GET /api/analytics/performance-trends
  - Extraction time trends
  - Accuracy trends
  - Model comparison
  - Processing volume over time

GET /api/analytics/export-report
  - Query: startDate, endDate, format (PDF, Excel, JSON)
  - Returns: Complete audit report

// Bulk Operations
POST /api/batch/extract
  - Body: { documentIds: [], ruleSetId, strategy: 'parallel|sequential' }
  - Returns: Job ID for async processing

GET /api/batch/job/:jobId
  - Returns: Progress, status, results

// Backup & Recovery
POST /api/backup/create
  - Body: { type: 'full|incremental' }
  - Returns: Backup ID, size, estimated time

GET /api/backup/list
  - Returns: Available backups with metadata

POST /api/backup/restore
  - Body: { backupId, targetDate? }
  - Returns: Recovery job ID

// Data Management
DELETE /api/data/cleanup
  - Query: olderThan, keepBackups
  - Returns: Deleted records count

POST /api/data/export
  - Query: format (json, csv, sql), range
  - Returns: Download URL
```

---

### Phase 16.4: Frontend Integration (Week 4)

#### New Components
1. **Analytics Dashboard**
   - Extraction metrics
   - Performance trends
   - Model performance comparison

2. **Batch Processing UI**
   - Multi-document selection
   - Progress tracking
   - Results aggregation

3. **Backup Management**
   - Create/restore backups
   - Schedule automated backups
   - Retention policies

4. **Reports Generator**
   - Custom report builder
   - Export options
   - Schedule delivery

---

## Technology Stack

### Backend (Additional)
- **ORM:** TypeORM 0.3.17+
- **Database Driver:** pg (PostgreSQL client)
- **Migrations:** TypeORM migrations
- **Connection Pooling:** pgbouncer (optional)
- **Caching:** Redis (optional, for performance)

### Database
- **Primary:** PostgreSQL 15+
- **Analytics:** TimescaleDB (time-series extension)
- **File Storage:** Azure Blob Storage OR MinIO (local)

### DevOps
- **Docker Compose** for local PostgreSQL
- **Azure Database for PostgreSQL** for production
- **Migration Scripts** for zero-downtime upgrades

---

## Implementation Timeline

```
Week 1 (7/14-7/20):
  ✓ Set up PostgreSQL locally
  ✓ Define all entities
  ✓ Implement repositories
  ✓ Write migrations
  
Week 2 (7/21-7/27):
  ✓ Integrate TypeORM with services
  ✓ Update ExtractionEngine
  ✓ Implement audit logging
  ✓ Data migration scripts
  
Week 3 (7/28-8/3):
  ✓ Add analytics endpoints
  ✓ Implement batch processing
  ✓ Backup/restore functionality
  ✓ Performance optimization
  
Week 4 (8/4-8/10):
  ✓ Frontend analytics dashboard
  ✓ Batch processing UI
  ✓ Backup management interface
  ✓ User acceptance testing

Week 5 (8/11-8/17):
  ✓ Production deployment preparation
  ✓ Data migration
  ✓ Performance tuning
  ✓ Launch Phase 16
```

---

## Phase 16.5: Advanced Features (Future)

### ML Integration (Phase 16+)
- **Training Data Collection**
  - Store all corrections as training data
  - Version control for training sets
  - A/B testing framework for models

- **Model Fine-Tuning**
  - SFT (Supervised Fine-Tuning) pipeline
  - DPO (Direct Preference Optimization)
  - Evaluation metrics tracking

### Multi-Tenant Support
- **Tenant Isolation**
  - Row-level security (RLS)
  - Data segregation
  - Per-tenant configuration

- **Usage Metering**
  - API call tracking
  - Storage tracking
  - Per-tenant billing

### Advanced Analytics
- **Anomaly Detection**
  - Unusual extraction patterns
  - Field value outliers
  - Processing time anomalies

- **Predictive Maintenance**
  - Model performance prediction
  - Resource utilization forecasting
  - Cost optimization recommendations

---

## Database Schema (Initial)

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50),
  file_size BIGINT,
  metadata JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extraction runs table
CREATE TABLE extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  extracted_fields JSONB,
  coverage DECIMAL(3, 2),
  validation_errors JSONB,
  rule_set_version VARCHAR(50),
  completed_at TIMESTAMP,
  execution_time_ms INTEGER,
  processing_model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Revision history (enhanced)
CREATE TABLE revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES extraction_runs(id),
  document_id UUID REFERENCES documents(id),
  changes JSONB,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id, created_at);
CREATE INDEX idx_extraction_runs_document_id ON extraction_runs(document_id);
CREATE INDEX idx_extraction_runs_created_at ON extraction_runs(created_at DESC);
CREATE INDEX idx_revision_history_document_id ON revision_history(document_id, created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);

-- Full-text search
ALTER TABLE extraction_runs ADD COLUMN extracted_fields_text TSVECTOR;
CREATE INDEX idx_extraction_fields_text ON extraction_runs USING gin(extracted_fields_text);
```

---

## Risk Management

### Potential Issues & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data Migration Loss | High | Backup old data, validate counts, test rollback |
| Performance Degradation | Medium | Implement caching, optimize indexes, query optimization |
| Database Connection Issues | Medium | Connection pooling, retry logic, fallback to cache |
| Concurrent Updates | Medium | Row-level locking, versioning, optimistic concurrency |
| Query Performance | Medium | Indexes, materialized views, query optimization |

---

## Testing Strategy

### Unit Tests
- ✅ Repository operations
- ✅ Migration scripts
- ✅ Data transformation

### Integration Tests
- ✅ End-to-end extraction with persistence
- ✅ Backup/restore workflow
- ✅ Concurrent operations

### Performance Tests
- ✅ Bulk extraction (1000+ documents)
- ✅ Query performance (<100ms avg)
- ✅ Connection pooling behavior

### Data Migration Tests
- ✅ In-memory to DB migration
- ✅ Zero-downtime validation
- ✅ Rollback procedures

---

## Success Criteria

- ✅ All Phase 14 & 15e functionality preserved
- ✅ Data persists across restarts
- ✅ Extraction completion time <10ms faster (DB caching)
- ✅ Analytics dashboard functional
- ✅ Backup/restore working
- ✅ Audit logs complete
- ✅ Performance tests passing
- ✅ 100% backward compatibility

---

## Next Steps

1. **Immediate (This Week)**
   - [x] Validate startup scripts
   - [ ] Set up local PostgreSQL with Docker Compose
   - [ ] Create database schema
   - [ ] Write TypeORM entities

2. **Short Term (Next Week)**
   - [ ] Implement repository layer
   - [ ] Update services to use DB
   - [ ] Write migration scripts
   - [ ] Test data migration

3. **Medium Term (2-3 Weeks)**
   - [ ] Add analytics endpoints
   - [ ] Implement backup/restore
   - [ ] Performance optimization
   - [ ] Frontend updates

---

## Dependencies & Requirements

- PostgreSQL 15+ (local or Azure)
- TypeORM 0.3.17+
- pg client
- Docker & Docker Compose (optional, for local dev)
- TypeScript 5.0+ (already in use)
- Node.js 24.0+ (already in use)

---

**Plan Created By:** System Architect  
**Date:** 2026-07-07  
**Status:** Ready for Implementation  
**Estimated Duration:** 4-5 weeks
