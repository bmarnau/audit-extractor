# Phase 14b: Rule Management UI - Implementation Plan

## Status: STARTING 🚀

### New Endpoints (Phase 14b)

#### 1. **PUT /api/extract/rules/:docType** 
**Purpose**: Update extraction rules for a document type

**Request**:
```json
{
  "rules": [
    {
      "field": "invoiceNumber",
      "pattern": "(INV-[0-9]{6}|Invoice #[0-9]{4}-[0-9]{2})",
      "confidence": 0.92,
      "required": true
    }
  ],
  "description": "Updated patterns for better invoice matching",
  "changeReason": "Improved pattern for variant invoices"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docType": "invoice",
    "version": "1.0.6",
    "modifyCount": 6,
    "rulesUpdated": 8,
    "lastModified": "2026-07-07T05:00:00Z",
    "changeReason": "Improved pattern for variant invoices",
    "previousVersion": "1.0.5"
  },
  "message": "Ruleset updated successfully"
}
```

---

#### 2. **POST /api/extract/rules/:docType/test-batch**
**Purpose**: Test updated rules against multiple sample documents

**Request**:
```json
{
  "testRules": [
    {
      "field": "invoiceNumber",
      "pattern": "(INV-[0-9]{6}|Rechnungs?nr\\.?\\s+([A-Z0-9-]+))",
      "confidence": 0.92,
      "required": true
    }
  ],
  "sampleCount": 5,
  "compareToVersion": "1.0.5"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "batchTestId": "batch-test-20260707-xyz",
    "docType": "invoice",
    "testRules": 1,
    "samplesProcessed": 5,
    "results": [
      {
        "sampleId": "invoice-1",
        "oldVersion": { "matched": true, "value": "INV-202406", "confidence": 0.9 },
        "newVersion": { "matched": true, "value": "INV-202406", "confidence": 0.92 },
        "improvement": 0.02,
        "status": "IMPROVED"
      }
    ],
    "improvement": {
      "totalMatches": "5/5",
      "confidenceDelta": 0.015,
      "newSuccessRate": 1.0,
      "oldSuccessRate": 0.96,
      "isReady": true
    }
  },
  "message": "Batch test completed - Ready to publish"
}
```

---

#### 3. **GET /api/extract/rules/:docType/history**
**Purpose**: View version history and rollback information

**Response**:
```json
{
  "success": true,
  "data": {
    "docType": "invoice",
    "currentVersion": "1.0.5",
    "totalVersions": 5,
    "history": [
      {
        "version": "1.0.5",
        "modifyCount": 5,
        "lastModified": "2026-07-07T04:30:00Z",
        "changeReason": "Pattern refinement for date fields",
        "owner": "finance-team",
        "rulesChanged": 2,
        "successRateAtRelease": 0.94,
        "status": "PUBLISHED"
      },
      {
        "version": "1.0.4",
        "modifyCount": 4,
        "lastModified": "2026-07-06T14:15:00Z",
        "changeReason": "Added support for variant invoice formats",
        "owner": "finance-team",
        "rulesChanged": 3,
        "successRateAtRelease": 0.91,
        "status": "PUBLISHED"
      }
    ]
  },
  "message": "Version history retrieved"
}
```

---

#### 4. **POST /api/extract/rules/:docType/publish**
**Purpose**: Publish tested rules and lock version

**Request**:
```json
{
  "version": "1.0.6",
  "publishNotes": "Improved invoice number and date extraction patterns",
  "testBatchId": "batch-test-20260707-xyz"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docType": "invoice",
    "publishedVersion": "1.0.6",
    "status": "PUBLISHED",
    "effectiveFrom": "2026-07-07T05:05:00Z",
    "successRate": 0.96,
    "rulesLocked": true,
    "previousVersion": "1.0.5",
    "publishNotes": "Improved invoice number and date extraction patterns"
  },
  "message": "Rules published and locked for production use"
}
```

---

### Implementation Steps

1. **Backend (extract-phase14.ts extensions)**
   - Add rule versioning system
   - Implement batch testing logic
   - Create version history tracking
   - Add publish/lock mechanism

2. **Rule Storage Enhancement**
   - Save version history in extraction-rules/
   - Create version backup structure
   - Track improvement metrics per version

3. **Frontend Components** (After backend)
   - **RuleEditor**: Form to edit patterns
   - **BatchValidator**: Upload samples, see before/after
   - **RuleHistory**: Timeline view of versions
   - **PublishWorkflow**: Preview & publish rules

### Files to Modify/Create

**New Backend Files**:
- `src/infrastructure/api/routes/extract-phase14.ts` (extend with 4 new endpoints)
- `src/infrastructure/api/services/RuleVersioningService.ts` (NEW - manage versions)
- `src/infrastructure/api/services/BatchTestingService.ts` (NEW - batch validation)

**New Frontend Files** (After backend ready):
- `src/presentation/ExtractionRuleEditor.tsx` - Rule editing component
- `src/presentation/BatchTestValidator.tsx` - Test results display
- `src/presentation/RuleVersionHistory.tsx` - Version timeline
- `src/presentation/PublishWorkflow.tsx` - Publish confirmation

### Technical Approach

**Version Management**:
```
extraction-rules/
├── invoice.json                    # Current version
├── invoice.versions.json           # Version history
└── versions/
    ├── invoice-1.0.5.json         # Backup of v1.0.5
    ├── invoice-1.0.4.json         # Backup of v1.0.4
    └── invoice-1.0.3.json
```

**Batch Testing**:
- Use source-documents/pdf/ and source-documents/html/ as samples
- Compare old vs new extraction results
- Calculate improvement metrics (confidence delta, success rate)
- Store test results for reference

**Version History**:
- Keep modify count and last modified date
- Track owner/team who made changes
- Store change reason for context
- Record success rate at time of release

---

## Next Immediate Actions

1. ✅ Extend extract-phase14.ts with new endpoints
2. ⏳ Create RuleVersioningService
3. ⏳ Create BatchTestingService
4. ⏳ Test all 4 new endpoints
5. ⏳ Create frontend components
6. ⏳ Integrate into ExtractionWorkbench

---

*Status: Implementation Starting*
*Estimated Time: 1-2 hours*
