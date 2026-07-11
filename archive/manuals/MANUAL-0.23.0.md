# Phase 23 - Document Extraction Pipeline Foundation
## Unified Document Model & Format Adapters

**Version:** 0.23.0  
**Released:** 2026-07-11  
**Phase Focus:** Document-agnostic processing infrastructure with DDD domain models and adapter pattern  
**Status:** ✅ Foundation Complete - Services Implementation Pending (Phase 23.2)

---

## 📋 Übersicht

Phase 23 stellt die Grundlage für ein **flexibles, dokumentformat-agnostisches Extraktionssystem** bereit:

### Kernkomponenten
1. **UnifiedDocument** - Aggregates Root für alle Dokumentformate
2. **Document Adapters** - Format-spezifische Parser (PDF, HTML, DOCX, TXT)
3. **Domain Models** - Value Objects für strukturierte Dokumentdaten
4. **Quality Assurance** - Chunk-Qualitätsanalyse und Struktur-Validierung

### Phasen-Überblick
```
Phase 22 (0.22.0):   Job Orchestration & API           ✅ COMPLETE
    ↓
Phase 23 (0.23.0):   Extraction Pipeline Foundation    🔨 IN PROGRESS
    ├─ UnifiedDocument model                           ✅ COMPLETE
    ├─ PDF/HTML Adapters                              ✅ COMPLETE
    ├─ Domain Models (9 Value Objects)                 ✅ COMPLETE
    ├─ Unit Tests (68 tests)                           ✅ COMPLETE
    ├─ DOCX/TXT Adapters                              🔨 TODO (Phase 23.1)
    ├─ Structure Analysis Service                     🔨 TODO (Phase 23.2)
    ├─ Semantic Chunking Service                      🔨 TODO (Phase 23.2)
    ├─ Quality Analysis Service                       🔨 TODO (Phase 23.2)
    └─ JobOrchestrator Extension (10-stage)           🔨 TODO (Phase 23.2)
    ↓
Phase 24 (0.24.0):   Frontend Job Manager + iReport    🔮 PLANNED
```

---

## 🚀 Quick Start - 5-Schritt Workflow

### Schritt 1: Document Detection (Adapter Selection)
```typescript
import { DocumentAdapterFactory } from '@infrastructure/adapters';

const factory = new DocumentAdapterFactory();
const adapter = factory.getAdapterByName('pdf'); // or 'html'
```

### Schritt 2: Document Loading & Validation
```typescript
const filePath = './documents/invoice.pdf';
await adapter.validate(filePath);

const unifiedDoc = await adapter.load(filePath, {
  maxPageSize: 1000,
  timeout: 30000,
  language: 'de',
  encoding: 'utf-8'
});
```

### Schritt 3: Unified Document Inspection
```typescript
// Zugriff auf strukturierte Daten
const pages = unifiedDoc.getPages();
const sections = unifiedDoc.getSections();
const tables = unifiedDoc.getTables();
const metadata = unifiedDoc.getMetadata();

console.log(`Document: ${metadata.filename}`);
console.log(`Pages: ${pages.length}`);
console.log(`Tables: ${tables.length}`);
```

### Schritt 4: Structure Analysis (Phase 23.2)
```typescript
// Zukünftig: Hierarchische Struktur-Analyse
const structure = await structureAnalysisService.analyze(unifiedDoc);
console.log(structure.rootNodes); // Kapitel/Abschnitte
```

### Schritt 5: Semantic Chunking (Phase 23.2)
```typescript
// Zukünftig: Token-basierte Chunking mit Chapter-Grenzen
const chunks = await semanticChunkingService.chunk(unifiedDoc, {
  minChunkSize: 500,
  maxChunkSize: 2000,
  targetChunkSize: 1500
});
```

---

## 📊 Domain Models (DDD Architecture)

### Value Objects

#### 1. **DocumentId** - Unique Document Identifier
```typescript
// Format: DOC-{RFC4122-v4-UUID}
const docId = DocumentId.create();
console.log(docId.toString()); // "DOC-550e8400-e29b-41d4-a716-446655440000"
```
- Immutable
- Format validation: RFC4122 v4 UUID
- Equality support
- Methods: create(), fromString(), toString(), getUuid(), equals()

#### 2. **DocumentPage** - Single Page Representation
```typescript
const page = DocumentPageFactory.create({
  pageNumber: 1,
  rawText: "Invoice content...",
  textLength: 1234,
  lineCount: 42,
  width: 210,
  height: 297
});
```
- Fields: pageNumber, pageId, rawText, textLength, lineCount
- Metadata: width, height, rotation, hasImages, imagePaths, encoding
- Quality: textConfidence, isScanImage, extractedAt
- Methods: merge() for multi-column layouts

#### 3. **DocumentSection** - Hierarchical Content Structure
```typescript
const section = DocumentSectionFactory.create({
  title: "Chapter 1: Introduction",
  level: 1,
  pageRange: { start: 1, end: 5 },
  content: "Chapter content..."
});
```
- Fields: title, level (1+), pageRange, content, subsectionIds
- Supports: Hierarchical nesting, table detection, metadata

#### 4. **DocumentTable** - Table Data Extraction
```typescript
const table = DocumentTableFactory.create({
  pageNumber: 1,
  position: { row: 0, column: 0 },
  rowCount: 5,
  columnCount: 3,
  rows: [["Header1", "Header2", "Header3"], ...],
  hasHeaderRow: true
});
```
- Fields: tableId, pageNumber, position, rowCount, columnCount
- Data: headerRow[], rows[][]
- Metadata: hasHeaderRow, rawTableText

#### 5. **DocumentMetadata** - Document-Level Metadata
```typescript
const metadata = DocumentMetadataFactory.createForPdf({
  filename: "invoice_2024.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 245632,
  title: "Invoice 2024",
  author: "Accounting",
  language: "de",
  encoding: "utf-8"
});
```
- Fields: filename, sourceType, mimeType, fileSizeBytes
- Document Info: title, author, subject, keywords
- Timestamps: createdAt, modifiedAt, extractedAt
- Features: hasEncryption, hasSignatures, customMetadata

#### 6. **DocumentChunk** - Semantic Content Chunk (NEW)
```typescript
const chunk = DocumentChunkFactory.create({
  chunkId: "chunk_001",
  unifiedDocumentId: docId,
  content: "Chunked content...",
  chunkIndex: 0,
  startPageNumber: 1,
  metadata: {
    sectionId: "sec_001",
    isTableChunk: false,
    wordCount: 250,
    estimatedReadingTimeSeconds: 45
  }
});
```
- Used by: Semantic chunking service for AI processing
- Respects: Chapter boundaries, semantic units

#### 7. **DocumentStructure** - Hierarchical Structure Analysis (NEW)
```typescript
const structure = DocumentStructureFactory.create({
  rootNodes: [
    {
      nodeId: "node_001",
      title: "Chapter 1",
      level: 1,
      type: "chapter",
      pageRange: { start: 1, end: 15 },
      children: [
        { nodeId: "node_002", title: "Section 1.1", level: 2, type: "section" }
      ]
    }
  ],
  statistics: {
    totalNodes: 42,
    maxDepth: 3,
    chapterCount: 5
  }
});
```
- Used for: Table of Contents generation, navigation
- Detection: Numeration schemes, heading hierarchies

#### 8. **ChunkQualityReport** - Chunk Quality Analysis (NEW)
```typescript
const qualityReport = ChunkQualityReportFactory.create({
  chunks: [chunk1, chunk2, ...],
  config: {
    minChunkSize: 500,
    maxChunkSize: 2000,
    targetChunkSize: 1500
  }
});

console.log(qualityReport.overallQualityScore); // 0-1 score
console.log(qualityReport.qualityMetrics); // Detailed per-chunk metrics
```
- Metrics: Size distribution, completeness, context quality
- Reports: Oversized, undersized, normal chunks
- Recommendations: Adjustments for next run

#### 9. **PreparedDocument** - Pipeline Output Aggregate (NEW)
```typescript
const prepared = PreparedDocumentFactory.create({
  unifiedDocument: doc,
  structure: structure,
  chunks: chunks,
  tables: tables,
  qualityReport: report
});

console.log(prepared.pipelineMetadata);
// { startedAt, completedAt, totalDurationMs, successfulSteps, status }
```
- Aggregates: All pipeline outputs
- Metadata: Pipeline execution information

---

## 📦 Document Adapters

### Adapter Pattern Overview
```
DocumentAdapter (Interface)
  ├─ PdfDocumentAdapter    ✅ IMPLEMENTED
  ├─ HtmlDocumentAdapter   ✅ IMPLEMENTED
  ├─ DocxDocumentAdapter   🔨 TODO
  └─ TxtDocumentAdapter    🔨 TODO
```

### PDF Adapter
**Status:** ✅ Production Ready

```typescript
import { PdfDocumentAdapter } from '@infrastructure/adapters';

const adapter = new PdfDocumentAdapter();

// Supported MIME types
adapter.getSupportedMimeTypes(); 
// → ['application/pdf']

// Validation
await adapter.validate('./document.pdf');

// Loading
const unifiedDoc = await adapter.load('./document.pdf', {
  maxPageSize: 1000,
  timeout: 30000,
  encoding: 'utf-8',
  password: 'optional_pdf_password' // For encrypted PDFs
});
```

**Features:**
- ✅ Text extraction per page (form feed splitting)
- ✅ Confidence scoring heuristics
- ✅ Encrypted PDF support
- ✅ Page range filtering
- ✅ Metadata extraction (title, author, subject)
- ✅ Scan image detection

**Error Handling:**
```typescript
try {
  await adapter.load(filePath, options);
} catch (error: DocumentAdapterError) {
  console.error(`${error.code}: ${error.message}`);
  console.error(`Adapter: ${error.adapter}`);
  console.error(`Details: ${error.details}`);
}
```

### HTML Adapter
**Status:** ✅ Production Ready

```typescript
import { HtmlDocumentAdapter } from '@infrastructure/adapters';

const adapter = new HtmlDocumentAdapter();

// Supported MIME types
adapter.getSupportedMimeTypes();
// → ['text/html', 'application/xhtml+xml']

// Loading with section extraction
const unifiedDoc = await adapter.load('./document.html', {
  maxPageSize: 5000,
  extractSections: true,      // h1-h6 hierarchy
  extractTables: true,         // <table> elements
  language: 'de'
});
```

**Features:**
- ✅ DOM parsing with cheerio
- ✅ Heading hierarchy (h1-h6) as sections
- ✅ Table extraction with header detection
- ✅ Link handling and metadata extraction
- ✅ Script/style tag removal
- ✅ Metadata from meta tags (og:title, description, author)

**Section Extraction Example:**
```
<h1>Chapter 1</h1>
  <h2>Section 1.1</h2>
    <h3>Subsection 1.1.1</h3>
    <h2>Section 1.2</h2>
<h1>Chapter 2</h1>
```
→ Becomes hierarchical sections with level tracking

---

## 🏗️ Architecture & DDD Design

### Layered Architecture
```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  (REST API Endpoints)               │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Application Layer                  │
│  (Services, Use Cases)              │
│  - DocumentPreparationPipeline      │
│  - StructureAnalysisService         │
│  - SemanticChunkingService          │
│  - ChunkQualityAnalyzer             │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Domain Layer (DDD)                 │
│  - UnifiedDocument (Aggregate Root) │
│  - Document Value Objects (9 types) │
│  - Domain Factories                 │
│  - DocumentAdapter (Interface)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Infrastructure Layer               │
│  - PdfDocumentAdapter               │
│  - HtmlDocumentAdapter              │
│  - ServiceContainer (DI)            │
└─────────────────────────────────────┘
```

### Key DDD Patterns Applied
- **Value Objects:** DocumentId, DocumentPage, DocumentSection, etc. - Immutable, self-validating
- **Aggregate Root:** UnifiedDocument - Manages consistency of pages, sections, tables
- **Factories:** One factory per domain model for complex creation logic
- **Repository Pattern:** (Phase 23.2) For persistence
- **Adapter Pattern:** Multiple document format implementations

---

## 🔄 Workflow Integration (Phase 23.2)

### Erweiterte JobOrchestrator Workflow (10-Stages)
```
Stage 1: Job Initialization
  → Input: Job ID, Document Path, Schema ID
  → Output: job-metadata.json

Stage 2: Document Type Detection
  → Input: File extension/MIME type
  → Output: Selected adapter

Stage 3: Document Loading & Validation
  → Input: Document path + adapter options
  → Output: UnifiedDocument

Stage 4: Structure Analysis
  → Input: UnifiedDocument
  → Output: document-structure.json (TOC, chapters, sections)

Stage 5: Table Extraction
  → Input: UnifiedDocument
  → Output: tables.json (structured table data)

Stage 6: Semantic Chunking
  → Input: UnifiedDocument + structure
  → Output: chunks.json (1000-1500 token chunks)

Stage 7: Quality Assurance
  → Input: Chunks
  → Output: chunks-quality-report.json

Stage 8: Schema Validation
  → Input: Chunks + Schema
  → Output: validation-report.json

Stage 9: AI Extraction (Phase 22 Integration)
  → Input: Chunks + Schema + Extraction Rules
  → Output: extraction-results.json

Stage 10: Reporting & Persistence
  → Input: All outputs
  → Output: Complete prepared-document.json

Output Files:
├── prepared-document.json          # Complete pipeline output
├── document-structure.json         # Hierarchical structure
├── chunks.json                     # Semantic chunks
├── tables.json                     # Extracted tables
└── preparation-report.json         # Pipeline metrics
```

---

## 📋 Configuration Reference

### PdfDocumentAdapter Options
```typescript
interface DocumentAdapterOptions {
  maxPageSize?: number;           // Default: 1000
  timeout?: number;               // milliseconds, default: 30000
  encoding?: string;              // Default: 'utf-8'
  language?: string;              // Default: 'en'
  password?: string;              // For encrypted PDFs
  pageRange?: {
    start: number;
    end: number;
  };
}
```

### HtmlDocumentAdapter Options
```typescript
interface DocumentAdapterOptions {
  maxPageSize?: number;           // Default: 5000
  timeout?: number;               // milliseconds, default: 30000
  encoding?: string;              // Default: 'utf-8'
  language?: string;              // Default: 'en'
  extractSections?: boolean;      // Parse h1-h6 as sections
  extractTables?: boolean;        // Parse <table> elements
}
```

### Semantic Chunking Config (Phase 23.2)
```typescript
interface ChunkingConfig {
  minChunkSize: number;           // Default: 500 tokens
  maxChunkSize: number;           // Default: 2000 tokens
  targetChunkSize: number;        // Default: 1500 tokens
  respectChapterBoundaries: boolean; // Default: true
  overlapPercentage?: number;     // Default: 10%
}
```

---

## 🧪 Testing

### Test Coverage (Phase 23)
```
UnifiedDocument.test.ts
├─ DocumentId Tests (8 tests)
│  ├─ Creation & Validation
│  └─ Equality & Serialization
├─ DocumentPage Tests (8 tests)
│  ├─ Factory creation
│  └─ Metadata handling
├─ DocumentSection Tests (8 tests)
│  ├─ Hierarchical structure
│  └─ Table detection
├─ DocumentMetadata Tests (8 tests)
│  ├─ Format-specific factories
│  └─ Reading time estimation
└─ UnifiedDocument Tests (20+ tests)
   ├─ Creation & Validation
   ├─ Section/Table management
   ├─ Content analysis
   └─ Serialization

DocumentAdapters.test.ts
├─ PdfDocumentAdapter Tests
│  ├─ File validation
│  ├─ Metadata extraction
│  └─ Error handling
├─ HtmlDocumentAdapter Tests
│  ├─ Section extraction
│  ├─ Table parsing
│  └─ Hierarchy building
└─ DocumentAdapterError Tests
   └─ Error creation & formatting

Total: 68 Tests ✅ PASS
```

**Run Tests:**
```bash
npm run test -- --testPathPattern="Unified|DocumentAdapter"
```

---

## 🔗 API Reference

### REST Endpoints (Existing in Phase 22)
```
POST   /api/v1/jobs/structure         # Create job
GET    /api/v1/jobs/:jobId/structure  # Get job metadata
GET    /api/v1/jobs/:jobId/validate   # Validate structure
PUT    /api/v1/jobs/:jobId            # Update job status
GET    /api/v1/jobs/:jobId/size       # Calculate size
DELETE /api/v1/jobs/:jobId            # Delete job
GET    /api/v1/jobs                   # List all jobs
```

**Phase 23.2 Planned Endpoints:**
```
POST   /api/v1/documents/prepare      # Prepare document (full pipeline)
GET    /api/v1/documents/:docId/structure
GET    /api/v1/documents/:docId/chunks
GET    /api/v1/documents/:docId/tables
GET    /api/v1/documents/:docId/quality
```

---

## 🚨 Known Limitations

### Phase 23.0 (Foundation)
- ✅ Adapters: PDF, HTML fully implemented
- 🔨 Adapters: DOCX, TXT pending (Phase 23.1)
- 🔨 Services: Not yet implemented (Phase 23.2)
- 🔨 Extended JobOrchestrator: Not yet extended (Phase 23.2)
- 🔮 Frontend UI: Not yet implemented (Phase 24)

### Performance Notes
- PDF extraction: ~100-500ms per document (100-200 pages)
- HTML parsing: ~50-200ms
- Large documents (>10MB): May require chunking

---

## 📚 Related Documentation

- [README.md](../README.md) - Project overview
- [API_REFERENCE.md](../API_REFERENCE.md) - Complete API reference
- [MANUAL-0.22.0.md](./MANUAL-0.22.0.md) - Phase 22 Job Structure
- [RELEASE_NOTES_0.23.0.md](./RELEASE_NOTES_0.23.0.md) - Phase 23 Release Notes

---

## 🔄 Next Steps (Phase 23.2 & 24)

### Phase 23.2 - Services Implementation
1. **StructureAnalysisService** (Heuristic-based, no LLM)
   - Heading hierarchy detection
   - Chapter/section identification
   - TOC generation

2. **SemanticChunkingService**
   - Token-based chunking (1000-1500 tokens)
   - Chapter boundary respect
   - Overlap support

3. **ChunkQualityAnalyzer**
   - Size distribution analysis
   - Completeness scoring
   - Quality recommendations

4. **DocumentPreparationPipelineService**
   - Orchestrates all services
   - Error recovery
   - Comprehensive logging

### Phase 24 - Frontend & iReport
- Job Processing UI Dashboard
- Live job execution monitor
- Manual reprocessing interface
- iReport integration and data export

---

**Version 0.23.0** | Phase 23 Foundation Complete ✅ | Services Pending 🔨
