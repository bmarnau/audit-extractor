# Manual v0.24.0 - Document Extraction Pipeline

**Version**: 0.24.0  
**Date**: 2026-01-XX  
**Status**: Production Ready  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Introduction

The Audit Safe Document Extractor (v0.24.0) is a TypeScript-based document preparation pipeline that converts documents (PDF, HTML, DOCX, TXT) into a unified representation for further processing.

### Key Features
- **Multi-format Support**: PDF, HTML, DOCX, TXT
- **UnifiedDocument Model**: Language-agnostic representation
- **Type Safety**: Full TypeScript support with strict mode
- **Dependency Injection**: TSyringe-based service architecture
- **Production Ready**: 92.8% test coverage, Docker support

### Version History
- **v0.24.0**: Phase 23.0 complete + Phase 23.1/23.2 planning
- **v0.23.0**: Initial Phase 23.0 foundation
- **v0.22.x**: Job system and schema management

---

## Installation

### Prerequisites
- Node.js 20.x or higher
- npm or yarn package manager
- Docker 20.10.x or higher (for containerized deployment)

### From Source

```bash
# Clone repository
git clone https://github.com/your-org/audit-safe-extractor.git
cd audit-safe-extractor

# Install dependencies
npm install --legacy-peer-deps

# Build TypeScript
npm run build

# Run tests (optional)
npm run test
```

### From Docker

```bash
# Pull latest image
docker pull audit-safe-extractor-backend:0.24.0

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name extractor \
  audit-safe-extractor-backend:0.24.0

# Verify startup
docker logs extractor
```

---

## Quick Start

### Basic Document Processing

```typescript
import { PdfDocumentAdapter } from '@infrastructure/adapters';
import { UnifiedDocument } from '@domain/document';

// 1. Initialize adapter
const adapter = new PdfDocumentAdapter();

// 2. Check if adapter can handle file
if (!adapter.canHandle('invoice.pdf')) {
  throw new Error('Cannot process this file type');
}

// 3. Validate file
await adapter.validate('invoice.pdf');

// 4. Load document
const unifiedDoc = await adapter.load('invoice.pdf', {
  language: 'en',
  encoding: 'utf-8'
});

// 5. Access document data
console.log('Pages:', unifiedDoc.getAllPages().length);
console.log('Metadata:', unifiedDoc.getMetadata());
console.log('Sections:', unifiedDoc.getStructure().rootNodes);
```

### Accessing Document Contents

```typescript
// Get all pages
const pages = unifiedDoc.getAllPages();
pages.forEach((page, idx) => {
  console.log(`Page ${idx + 1}: ${page.rawText.substring(0, 100)}...`);
});

// Get metadata
const metadata = unifiedDoc.getMetadata();
console.log(`Document: ${metadata.filename}`);
console.log(`Type: ${metadata.sourceType}`);
console.log(`Size: ${metadata.fileSizeBytes} bytes`);

// Get document structure
const structure = unifiedDoc.getStructure();
console.log(`Total sections: ${structure.statistics.totalNodes}`);
console.log(`Max depth: ${structure.statistics.maxDepth}`);

// Extract tables
const tables = unifiedDoc.getTables();
tables.forEach((table, idx) => {
  console.log(`Table ${idx + 1}: ${table.rowCount} rows, ${table.columnCount} columns`);
});
```

---

## Architecture

### Domain-Driven Design

The system uses DDD principles with the following layers:

#### 1. Domain Layer (`src/domain/`)
**Responsibility**: Business logic and domain models

- **Core Models**:
  - `UnifiedDocument`: Root aggregate
  - `DocumentPage`: Individual pages
  - `DocumentSection`: Hierarchical sections
  - `DocumentTable`: Structured tables
  - `DocumentMetadata`: Document properties

- **Factories**:
  - `DocumentPageFactory`: Creates pages
  - `DocumentMetadataFactory`: Creates metadata
  - `DocumentStructureFactory`: Creates structure
  - `DocumentChunkFactory`: Creates chunks
  - `ChunkQualityReportFactory`: Creates quality reports

- **Interfaces**:
  - `DocumentAdapter`: Adapter contract
  - `IDocumentValidator`: Validation contract

#### 2. Infrastructure Layer (`src/infrastructure/`)
**Responsibility**: External system integrations

- **Adapters**:
  - `PdfDocumentAdapter`: PDF processing
  - `HtmlDocumentAdapter`: HTML processing
  - *(Phase 24)* `DocxDocumentAdapter`: Word processing
  - *(Phase 24)* `TxtDocumentAdapter`: Text processing

#### 3. Application Layer (`src/application/`)
**Responsibility**: Use cases and services

- *(Phase 24)* `StructureAnalysisService`: Hierarchical analysis
- *(Phase 24)* `SemanticChunkingService`: Token-based segmentation
- *(Phase 24)* `ChunkQualityAnalyzer`: Quality assessment
- *(Phase 24)* `DocumentPreparationPipelineService`: Orchestration

#### 4. Presentation Layer (`src/presentation/`)
**Responsibility**: API endpoints and user interfaces

- *(Phase 24)* HTTP endpoints for document processing
- *(Phase 24)* Job management APIs
- *(Phase 24)* React frontend dashboard

### Data Flow

```
Input Document
    ↓
[Document Adapter]
    ↓ (Extract text, metadata, structure)
[UnifiedDocument]
    ↓ (Phase 24)
[Structure Analysis] → Detect hierarchies
    ↓ (Phase 24)
[Semantic Chunking] → Split into tokens
    ↓ (Phase 24)
[Quality Analysis] → Assess chunks
    ↓ (Phase 24)
[Prepared Document] → Ready for consumption
```

---

## API Reference

### DocumentAdapter Interface

```typescript
interface DocumentAdapter {
  canHandle(filePath: string): boolean;
  validate(filePath: string): Promise<void>;
  load(filePath: string, options?: DocumentAdapterOptions): Promise<UnifiedDocument>;
  getName(): string;
}
```

### UnifiedDocument API

#### Constructor & Factories
```typescript
// Create a new document
UnifiedDocument.create(metadata: DocumentMetadata, pages: DocumentPage[]): UnifiedDocument;

// Get document info
getMetadata(): DocumentMetadata;
getAllPages(): DocumentPage[];
getTables(): DocumentTable[];
getStructure(): DocumentStructure;

// Query operations
findPagesByKeyword(keyword: string): DocumentPage[];
getPageRange(start: number, end: number): DocumentPage[];
```

### DocumentMetadataFactory

```typescript
// Create PDF metadata
DocumentMetadataFactory.createForPdf(config: PdfMetadataConfig): DocumentMetadata;

// Create HTML metadata
DocumentMetadataFactory.createForHtml(config: HtmlMetadataConfig): DocumentMetadata;

// Create DOCX metadata (Phase 24)
DocumentMetadataFactory.createForDocx(config: DocxMetadataConfig): DocumentMetadata;

// Create TXT metadata (Phase 24)
DocumentMetadataFactory.createForText(config: TextMetadataConfig): DocumentMetadata;
```

---

## Configuration

### Environment Variables

```bash
# Node environment
NODE_ENV=production                    # production | development | test

# Service ports
PORT=3000                              # API server port
HEALTH_CHECK_PORT=3001                 # Health check port

# Document processing
MAX_DOCUMENT_SIZE=104857600           # 100MB in bytes
MAX_PAGES_TO_EXTRACT=5000              # Limit for memory efficiency

# Logging
LOG_LEVEL=info                         # error | warn | info | debug
LOG_FORMAT=json                        # json | text

# Feature flags
ENABLE_STRUCTURE_ANALYSIS=false        # Phase 24 feature
ENABLE_SEMANTIC_CHUNKING=false         # Phase 24 feature
ENABLE_QUALITY_ANALYSIS=false          # Phase 24 feature
```

### Configuration Files

**docker-compose.yml** - Multi-container setup
```yaml
version: '3.9'
services:
  backend:
    image: audit-safe-extractor-backend:0.24.0
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      NODE_ENV: production
```

---

## Examples

### Example 1: Process PDF with Structure

```typescript
import { PdfDocumentAdapter } from '@infrastructure/adapters';
import path from 'path';

async function processPdf() {
  const adapter = new PdfDocumentAdapter();
  const filePath = path.join(__dirname, 'documents', 'invoice.pdf');

  try {
    // Validate
    await adapter.validate(filePath);
    console.log('✓ File is valid');

    // Load
    const doc = await adapter.load(filePath);
    console.log('✓ Document loaded');

    // Extract metadata
    const meta = doc.getMetadata();
    console.log(`Document: ${meta.filename}`);
    console.log(`Pages: ${doc.getAllPages().length}`);
    console.log(`Created: ${meta.createdAt}`);

    // Extract tables
    const tables = doc.getTables();
    console.log(`Tables found: ${tables.length}`);

    // Get structure
    const structure = doc.getStructure();
    structure.rootNodes.forEach((node) => {
      console.log(`- ${node.title} (level ${node.level})`);
    });

    return doc;
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}
```

### Example 2: Process HTML Document

```typescript
import { HtmlDocumentAdapter } from '@infrastructure/adapters';

async function processHtml() {
  const adapter = new HtmlDocumentAdapter();
  const html = `
    <html>
      <head><title>Product List</title></head>
      <body>
        <h1>Products</h1>
        <table>
          <tr><th>Name</th><th>Price</th></tr>
          <tr><td>Item A</td><td>$10</td></tr>
        </table>
      </body>
    </html>
  `;

  // This would typically come from file or HTTP
  const doc = await adapter.loadFromHtml(html, 'document.html');

  const tables = doc.getTables();
  console.log(`Extracted ${tables.length} table(s)`);

  return doc;
}
```

### Example 3: Phase 24 - Full Pipeline (Coming Soon)

```typescript
// This example will be available in Phase 24

import { DocumentPreparationPipelineService } from '@application/services';
import { PdfDocumentAdapter } from '@infrastructure/adapters';

async function fullPipeline() {
  // Load document
  const adapter = new PdfDocumentAdapter();
  const doc = await adapter.load('document.pdf');

  // Initialize pipeline (Phase 24)
  const pipelineService = container.resolve(DocumentPreparationPipelineService);

  // Execute 10-stage pipeline
  const result = await pipelineService.prepare(doc);

  // Get results
  console.log(`Pipeline completed in ${result.totalDuration}ms`);
  result.stages.forEach((stage) => {
    console.log(`${stage.name}: ${stage.status} (${stage.duration}ms)`);
  });

  const preparedDoc = result.prepared;
  console.log(`Chunks created: ${preparedDoc.chunks.length}`);
  console.log(`Quality score: ${preparedDoc.qualityReport.overallQualityScore}`);

  return preparedDoc;
}
```

---

## Troubleshooting

### Issue: "Cannot read property 'split' of undefined"
**Cause**: File encoding mismatch  
**Solution**: Specify encoding explicitly
```typescript
const doc = await adapter.load('file.pdf', { encoding: 'utf-8' });
```

### Issue: "PDF text extraction is empty"
**Cause**: Scanned PDF without OCR  
**Solution**: Check `page.isScanImage` property
```typescript
const pages = doc.getAllPages();
pages.forEach((p) => {
  if (p.isScanImage) {
    console.log('This is a scanned image - OCR required');
  }
});
```

### Issue: "Factory method requires N arguments"
**Cause**: Factory signature mismatch (Phase 24 planning)  
**Solution**: Use correct factory call pattern
```typescript
// Correct pattern (Phase 24)
const metadata = DocumentMetadataFactory.create(
  filename,
  sourceType,
  fileSizeBytes,
  options
);
```

---

## FAQ

### Q: What document formats are supported?
**A**: Phase 23.0 supports PDF and HTML. Phase 24 will add DOCX and TXT support.

### Q: Can I process scanned PDFs?
**A**: Phase 23.0 detects scanned pages but doesn't perform OCR. Phase 24 will include OCR support.

### Q: What's the maximum file size?
**A**: Default is 100MB. Configure via `MAX_DOCUMENT_SIZE` environment variable.

### Q: Does the system support multiple languages?
**A**: Metadata is language-aware. Phase 24 will include language-specific processing.

### Q: How do I extend with custom adapters?
**A**: Implement the `DocumentAdapter` interface and register with the container.

### Q: Is there a REST API?
**A**: Phase 24 will include REST endpoints. Phase 23.0 is library-only.

---

## Additional Resources

- [API Reference](API_REFERENCE.md)
- [Release Notes](RELEASE_NOTES_0.24.0.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**End of Manual v0.24.0**
