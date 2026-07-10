# 🧪 Phase 16: Schema Management & Audit Workflow Test Suite

**Version**: 0.16.0  
**Date**: 8.7.2026  
**Status**: Ready for Testing

---

## 📋 Overview

Phase 16 introduces comprehensive schema management with database persistence and filesystem organization. This test suite validates:

1. **Schema Functions**: Load, Save, Versioning, Directory Management
2. **Database Integration**: PostgreSQL persistence, multi-tenancy, CRUD operations
3. **Rule Generation**: Automatic rule extraction from schemas and examples
4. **Audit Workflow Integration**: Complete end-to-end workflow from schema upload to archive
5. **Quality Assurance**: Extraction quality evaluation and confidence scoring

---

## 🚀 Quick Start

### Option 1: Run All Tests (Recommended)

```bash
# Windows
run-phase16-tests.cmd

# Or manually
npm run test:phase16:all
```

### Option 2: Run Individual Tests

```bash
# E2E Test (Schema Functions)
npm run test:phase16:e2e

# Audit Workflow Integration
npm run test:phase16:audit

# Both
npm run test:phase16:all
```

### Option 3: Build & Test

```bash
npm run build
npm run test:phase16:e2e
npm run test:phase16:audit
```

---

## 🧬 Test Suite 1: Phase 16 E2E Test

**File**: `tests/phase16-e2e-test.ts`  
**Purpose**: Comprehensive testing of schema management functions  
**Runtime**: ~3-5 seconds

### Test Scenarios

| Test # | Name | What it Tests | Expected Result |
|--------|------|---------------|-----------------|
| 1 | Database Connection & Schema Repository | PostgreSQL connection, schema CRUD | ✅ Connection verified |
| 2 | Create Schema with Filesystem | Save schema + examples to disk | ✅ Files created |
| 3 | Load Schema from Filesystem | Read schema & examples from disk | ✅ Data loaded correctly |
| 4 | Analyze Schema & Examples | Parse schema fields, analyze examples | ✅ Fields & characteristics extracted |
| 5 | Generate Rules from Schema | Auto-generate extraction rules | ✅ Rules with confidence scores |
| 6 | Load & Verify Rules | Load saved rules from filesystem | ✅ Rules loaded & verified |
| 7 | Update Schema Versioning | Archive & version management | ✅ Version 2 created, v1 archived |
| 8 | Directory Integrity | Verify directory structure | ✅ All files present & valid |
| 9 | Audit Trail Documentation | Create audit logs | ✅ Audit file created |

### Expected Output

```
✅ Database Connection & Schema Repository (45ms)
   Database connection verified
   Details:
     • schemaId: [uuid]
     • userId: test-user-[timestamp]

✅ Create Schema with Filesystem (102ms)
   Schema created successfully
   Details:
     • schemaId: [uuid]
     • directoryPath: /schemas/[uuid]/
     • exampleCount: 2

✅ Load Schema from Filesystem (38ms)
   Schema loaded successfully
   Details:
     • fieldCount: 7
     • exampleCount: 2
     • schemaType: object

... [7 more tests] ...

📊 SUMMARY
  Total Tests: 9
  Passed: 9 ✅
  Failed: 0 ❌
  Total Time: 432ms
```

---

## 🔄 Test Suite 2: Audit Workflow Integration

**File**: `tests/audit-workflow-integration.ts`  
**Purpose**: Test complete workflow integrating Phase 15 & Phase 16  
**Runtime**: ~2-4 seconds

### Workflow Steps

#### Step 1: Schema Upload & Validation
```
Input: Schema with invoice structure
Process: Load schema, validate fields, store in DB + filesystem
Output: Schema stored, validated fields count, storage location
```

**Details Captured**:
- Schema ID and field count
- Required fields count
- Storage location (PostgreSQL + Filesystem)
- Timestamp

#### Step 2: Rule Generation & Confidence Scoring
```
Input: Schema + Examples
Process: Analyze patterns, generate rules, calculate confidence
Output: 5+ rules with average confidence score
```

**Details Captured**:
- Number of rules generated
- Average confidence (0-1.0)
- Rule types (PATTERN_MATCH, DATE_FORMAT, ARRAY_EXTRACTION, etc.)
- Low confidence warnings
- Generation timestamp

**Example Output**:
```
✅ STEP 2: Rule Generation & Confidence Scoring
   ├─ Rules generated: 5
   ├─ Average confidence: 92.3%
   ├─ Rule types: PATTERN_MATCH, DATE_FORMAT, ARRAY_EXTRACTION, CALCULATED_FIELD, FUZZY_MATCH
   └─ Status: ✅ COMPLETED (156ms)
```

#### Step 3: Document Extraction
```
Input: Document (PDF/Word) + Rules from Step 2
Process: Apply rules, extract fields, validate data types
Output: Extracted structured data with field values
```

**Details Captured**:
- Number of fields extracted
- Document processed flag
- Extracted data summary
- Extraction timestamp

#### Step 4: Quality Evaluation
```
Input: Extracted data from Step 3
Process: Calculate quality metrics
- Completeness: all required fields present?
- Accuracy: values match expected patterns?
- Consistency: values align with schema?
Output: Quality scores + hallucination detection
```

**Details Captured**:
- Completeness score (0-1.0)
- Accuracy score (0-1.0)
- Consistency score (0-1.0)
- Overall quality score
- Hallucination risk (0-1.0)
- Quality gate pass/fail

**Example Quality Metrics**:
```
Completeness:   95%  (all required fields found)
Accuracy:       92%  (values match patterns)
Consistency:    98%  (values align with schema)
Overall Score:  95%  (PASS quality gate)
Hallucination:  2%   (low risk)
```

#### Step 5: Results Storage & Versioning
```
Input: Extracted data + Quality metrics
Process: Save to DB, create filesystem record, manage versions
Output: Result ID, version number, storage paths
```

**Details Captured**:
- Result ID (UUID)
- Schema ID & version
- Field count
- Storage paths (DB + filesystem)
- Timestamp
- Previous version reference (for versioning)

#### Step 6: Audit Trail & Archive
```
Input: Complete workflow data
Process: Create comprehensive audit log, archive version
Output: Audit log document, archived schema
```

**Details Captured**:
- Audit log ID
- Storage paths
- Completed steps count
- Total workflow duration
- Archive version number

### Integration Status Report

After all steps complete, you'll see:

```
✅ Schema Management (Phase 16A): INTEGRATED
   └─ Database persistence via SchemaRepository
   └─ Filesystem management via SchemaDirectoryManager

✅ Rule Generation (Phase 15): INTEGRATED
   └─ Automatic rule generation from schema
   └─ Confidence scoring & analysis

✅ Extraction Pipeline: INTEGRATED
   └─ Rules applied to documents
   └─ Quality evaluation & versioning

✅ Audit Trail (Phase 16): INTEGRATED
   └─ Complete workflow documentation
   └─ Step-by-step logging with timestamps

✅ Versioning & Archive (Phase 16): INTEGRATED
   └─ 2-version retention policy
   └─ Automatic archiving of previous versions
```

---

## 📊 Test Results Interpretation

### All Tests Passed ✅

```
📊 SUMMARY
  Total Tests: 9
  Passed: 9 ✅
  Failed: 0 ❌
  Total Time: 432ms

Status: PRODUCTION READY
```

**What this means**:
- Schema functions working correctly
- Database persistence functional
- Versioning system operational
- Audit trail integration complete
- Ready for deployment

### Some Tests Failed ❌

```
❌ Test Name (500ms)
   Error: [error message]
   Details:
     • context: [additional info]
```

**Troubleshooting**:
1. Check database connection
2. Verify filesystem permissions
3. Ensure node_modules installed
4. Check .env.local configuration
5. Review error message in details section

---

## 🔧 Database Requirements

### PostgreSQL Configuration

```
Host: localhost
Port: 5432
Database: extractor_db
User: extractor_user
Password: extractor_pass
```

### Start Database

```bash
# Using Docker Compose
docker-compose up -d

# Verify connection
docker ps | grep postgres
```

### Connection String

```
postgresql://extractor_user:extractor_pass@localhost:5432/extractor_db
```

---

## 📁 Filesystem Structure After Tests

```
schemas/
└── [schema-id]/
    ├── schema.json          ← Schema definition
    ├── metadata.json        ← Schema metadata
    ├── rules/
    │   ├── rules.json       ← Generated extraction rules
    │   └── statistics.json  ← Rule statistics & confidence
    ├── examples/
    │   ├── example-1.json
    │   └── example-2.json
    ├── source-docs/         ← Input documents
    ├── results/             ← Extraction results
    └── .archive/
        ├── v1/
        │   ├── schema.json
        │   └── rules.json
        ├── v2/
        │   └── ...
        └── audit.json       ← Audit trail
```

---

## 🎯 What's Being Tested

### Schema Management (Phase 16A)

✅ Create schema in database  
✅ Load schema from filesystem  
✅ Save schema to filesystem  
✅ Update schema with versioning  
✅ Archive previous versions  
✅ Multi-tenant support (userId isolation)

### Filesystem Organization (Phase 16B)

✅ Create per-schema directories  
✅ Save JSON schema files  
✅ Save/load example files  
✅ Manage rules storage  
✅ Archive old versions  
✅ Directory integrity verification

### Rule Generation (Phase 15 Integration)

✅ Analyze schema structure  
✅ Analyze example data patterns  
✅ Generate extraction rules  
✅ Calculate confidence scores  
✅ Detect low-confidence rules

### Extraction Pipeline (Phase 15)

✅ Apply rules to documents  
✅ Extract structured data  
✅ Type validation

### Quality Evaluation

✅ Completeness scoring  
✅ Accuracy validation  
✅ Consistency checking  
✅ Hallucination detection  
✅ Quality gate pass/fail

### Audit Trail (Phase 16)

✅ Log workflow steps  
✅ Track timestamps  
✅ Record step details  
✅ Calculate durations  
✅ Archive audit logs

### Versioning Strategy

✅ Auto-increment version numbers  
✅ Archive previous versions  
✅ 2-version retention policy  
✅ Previous version references

---

## 📈 Performance Expectations

### Test Suite Timings

| Component | Expected | Range |
|-----------|----------|-------|
| E2E Test | 432ms | 300-600ms |
| Audit Workflow | 185ms | 150-300ms |
| Build | 8-12s | 8-15s |
| **Total** | **~20s** | **15-30s** |

### Database Operations

| Operation | Time |
|-----------|------|
| Schema save | 10-20ms |
| Schema load | 5-10ms |
| Rules generation | 30-50ms |
| Archive version | 15-25ms |

---

## 🐛 Troubleshooting

### "Cannot find module 'reflect-metadata'"

```bash
npm install reflect-metadata
npm install --save-dev @types/node
```

### "Database connection failed"

```bash
# Check if Docker running
docker ps

# Start database
docker-compose up -d

# Verify .env.local
cat .env.local
```

### "Filesystem permission denied"

```bash
# Check schemas directory
ls -la schemas/

# On Windows, ensure write permissions on C:\...\schemas\
```

### "Rules not generated"

```bash
# Verify examples loaded correctly
npm run test:phase16:e2e

# Check example files in schemas/[id]/examples/
```

### "Test timeout"

```bash
# Increase timeout
npm run test:phase16:e2e -- --testTimeout 30000

# Or check for hanging database connections
docker logs extractor-postgres
```

---

## ✨ Test Output Examples

### Successful Schema Load

```
✅ Load Schema from Filesystem (38ms)
   Schema loaded successfully
   
Details:
  • schemaId: 550e8400-e29b-41d4-a716-446655440000
  • fieldCount: 7
  • exampleCount: 2
  • schemaType: object
```

### Successful Rule Generation

```
✅ Generate Rules (156ms)
   Rules generated successfully

Details:
  • schemaId: 550e8400-e29b-41d4-a716-446655440000
  • ruleCount: 5
  • averageConfidence: 0.92
  • ruleSetId: rs-7f3a9c1e
  • warnings: 0
```

### Successful Audit Workflow

```
✅ STEP 1: Schema Upload & Validation (45ms)
   ├─ Fields detected: 7
   ├─ Required fields: 4
   ├─ Storage: PostgreSQL + Filesystem
   └─ Status: ✅ COMPLETED

✅ STEP 2: Rule Generation & Confidence Scoring (156ms)
   ├─ Rules generated: 5
   ├─ Average confidence: 92.3%
   ├─ Rule types: PATTERN_MATCH, DATE_FORMAT, ...
   └─ Status: ✅ COMPLETED

... [more steps] ...
```

---

## 📚 Related Documentation

- [MANUAL-0.16.0.md](./MANUAL-0.16.0.md) - User handbook
- [PHASE_16_COMPLETION_REPORT.md](./PHASE_16_COMPLETION_REPORT.md) - Technical details
- [docs/glossary.md](./docs/glossary.md) - Terminology
- [KOMPLETTER_ABSCHLUSS_CHECK.md](./KOMPLETTER_ABSCHLUSS_CHECK.md) - System status

---

## 🎓 Learning Outcomes

After running these tests, you'll understand:

1. ✅ How schema management works with database + filesystem
2. ✅ How rules are generated from schemas
3. ✅ How the complete audit workflow integrates all components
4. ✅ How quality evaluation and confidence scoring work
5. ✅ How versioning and archiving maintain history
6. ✅ How the audit trail documents every step

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅

1. **Manual Testing**: Try the API endpoints manually
   ```bash
   npm run dev
   # Open http://localhost:3000 in browser
   ```

2. **Integration Testing**: Test with real documents

3. **Performance Testing**: Load test with multiple schemas

4. **Deployment**: Ready for production deployment

### If Tests Fail ❌

1. Review error messages in test output
2. Check troubleshooting section above
3. Verify database connection
4. Check filesystem permissions
5. Review Phase 16 implementation files

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Run all tests | `npm run test:phase16:all` |
| Run E2E test | `npm run test:phase16:e2e` |
| Run audit test | `npm run test:phase16:audit` |
| Build | `npm run build` |
| Start dev server | `npm run dev` |
| Start database | `docker-compose up -d` |
| View database logs | `docker logs extractor-postgres` |

---

**Status**: ✅ Ready for Testing  
**Version**: 0.16.0  
**Last Updated**: 8.7.2026
