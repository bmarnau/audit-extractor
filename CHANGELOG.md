# CHANGELOG.md

Alle Änderungen an diesem Projekt werden dokumentiert.

Folge [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking Changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

---

## [0.13.0] - 2026-07-06 (Frontend Workbench & Service Container - COMPLETE ✓)

### Added - Phase 13: Frontend Extraction Workbench (Complete)
- ✅ ExtractionWorkbench component: 11-step visualization + dashboard metrics
- ✅ AuditViewer component: Field-level audit trail with source references
- ✅ LogBrowser component: Multi-dimensional log filtering + export
- ✅ HelpBrowser component: Glossar + documentation search with highlighting
- ✅ ConfigEditor component: 4-section configuration with version history
- ✅ BackupManager component: Complete backup lifecycle management
- ✅ App.tsx fully integrated: All 6 workbench components routed and accessible

### Added - Phase 13: Service Container & Dependency Injection (Complete)
- ✅ ServiceContainer.ts: Centralized DI registry for all 12 services
- ✅ initializeServiceContainer(): One-time global registration
- ✅ resolveService<T>(): Runtime service resolution with type safety
- ✅ All services registered as Singletons (DocumentParser, ChunkingEngine, etc.)
- ✅ ConfigManager and BackupService integrated into DI

### Added - Phase 13: Backend Service Implementations (Complete)
- ✅ ConfigManager.ts (280+ lines): Full CRUD + versioning + changelog + revert
- ✅ BackupService.ts (380+ lines): Backup creation, restore, deletion, checksums
- ✅ Backup.ts domain models: BackupMetadata, RestoreRequest, BackupStatistics
- ✅ Config.ts domain models: AppConfig, ConfigChange, all settings
- ✅ Server Startup: ConfigManager.initialize() + BackupService.initialize()
- ✅ All routes skelettized → fully implemented with DI

### Added - Phase 13: Frontend API Hooks (Complete)
- ✅ useConfig hook: GET/PUT/PATCH configuration, load changes, revert, stats
- ✅ useBackup hook: Create/list/delete backups, restore, download, statistics
- ✅ useAudit hook: Fetch audit reports, export (JSON/Markdown)
- ✅ useLogs hook: Fetch logs with filtering, export (JSON/CSV/TXT)
- ✅ useHelp hook: Search glossary, documentation, release notes

### Added - Phase 13: REST API Route Implementation (Complete)
- ✅ config.ts: GET/PUT/PATCH/POST routes fully implemented with ConfigManager
- ✅ backup.ts: POST/GET/DELETE routes with BackupService
- ✅ audit.ts: GET routes for audit reports
- ✅ help.ts: GET routes for search, glossary, statistics
- ✅ logs.ts: GET routes for logs with filtering
- ✅ All routes use DI via resolveService()
- ✅ All routes have comprehensive error handling

### Added - Phase 13: E2E Integration Tests (Complete)
- ✅ Integration tests: Config → Backup → Audit → Help → Logs complete flow
- ✅ Configuration Center test suite
- ✅ Backup Center test suite
- ✅ Audit Center test suite
- ✅ Help Center test suite
- ✅ Log Browser test suite
- ✅ Complete pipeline integration test

### Changed - Phase 13: Version & Infrastructure Updates
- ✅ Version: 0.12.0 → 0.13.0 (package.json, src/version.ts, frontend/version.ts)
- ✅ API Server Banner: Updated to show Phase 13 + all 40+ routes
- ✅ Server Startup: Now initializes ConfigManager + BackupService before routes
- ✅ All route files: Updated version to 0.13.0, phase to 13

### Fixed - Phase 13: Critical Issues
- ✅ HallucinationValidator.ts: Removed duplicate class definition
- ✅ ValidationService.test.ts: Fixed malformed describe block
- ✅ TypeScript compilation: All files now compile without errors (strict mode)

### Status - Phase 13: COMPLETE ✓
- 🟢 Frontend Workbench: 6/6 components complete
- 🟢 Service Container: All 12 services initialized via DI
- 🟢 Backend Services: ConfigManager + BackupService fully implemented
- 🟢 Frontend Hooks: All 5 hooks (useConfig, useBackup, useAudit, useLogs, useHelp)
- 🟢 REST API Routes: All 40+ endpoints fully implemented
- 🟢 E2E Tests: Complete pipeline integration tests
- 🟢 Type Safety: 100% TypeScript strict mode compliant

---

## [0.12.0] - 2026-07-06 (Orchestration & Centers Phase)

### Added - Phase 12: ExtractionPipeline Orchestration
- ExtractionPipeline class: 9-step central orchestrator
- PipelineStep interface: Input/Output/Duration/Errors tracking
- PipelineResult interface: Complete execution report
- AuditEvent interface: Event logging with timestamps
- Audit trail with started/completed/error/warning events
- Per-step error handling and recovery
- Comprehensive logging with metrics visualization
- JSON export for audit trail persistence

### Added - Phase 12: Configuration Center
- ConfigManager service with version control
- AppConfig model: chunking, confidence, LLM, system settings
- ConfigChange records tracking all modifications
- REST endpoints: GET/PUT/PATCH /api/config
- Import/Export configuration as JSON
- Revert to previous configuration versions
- Audit trail for config changes

### Added - Phase 12: Audit Center
- FieldAuditRecord: Value, Confidence, SourceReferences
- DocumentAuditReport: Complete field-level audit
- SourceReference: Chunk ID, page, section, text snippet
- AuditEntry: Action history (extracted/validated/flagged/corrected)
- REST endpoints: /api/audit with export (JSON/Markdown)

### Added - Phase 12: Help Center
- HelpContentItem: Indexed documentation
- GlossaryEntry: Term definitions with examples
- HelpSearchResult: Full-text search with highlights
- HelpIndex: Inverted search index
- REST endpoints: /api/help/search, /help/glossary, /help/stats

### Added - Phase 12: Log Viewer
- LogEntry: Timestamp, source, level, message, context
- LogFilter: Query/source/level/time range filtering
- LogStatistics: Error/warning counts, top errors
- LogRetentionPolicy: Auto-cleanup configuration
- REST endpoints: /api/logs with export (JSON/CSV/TXT)

### Added - Phase 12: Backup Center
- BackupConfig: Include/exclude patterns
- BackupMetadata: Size, item count, checksums
- BackupManifest: Files list with checksums
- RestoreRequest/RestoreResult: Full restore workflow
- BackupRetentionPolicy: Daily/weekly/monthly retention
- REST endpoints: /api/backup (create/restore/delete/stats)

### Added - Test Reference Dataset (invoice_001)
- Sample invoice with 16 extractable fields
- Complete extraction rules (extraction-rules/invoice.txt)
- Expected JSON result with source references
- Audit trail demonstration
- TESTSET documentation

### Changed
- Updated all index.ts exports for Phase 12 models
- Integrated all 5 new API route handlers
- Updated startup banner to show Phase 12 routes
- Version bumped to 0.12.0

---

## [0.11.0] - 2026-07-05 (API Phase)

### Added - Phase 8: LLMExtractor
- LLMExtractor class for LLM-based field extraction
- Prompt engineering: system + user prompts with rule definitions
- Provider support: OpenAI and Azure OpenAI placeholders
- Source reference tracking: Every extracted value linked to actual chunks
- Confidence scoring: Temperature 0.1 for factual extraction
- Mock LLM response for development/fallback
- Hallucination prevention: Conservative extraction (better to miss than invent)
- Token estimation and max-tokens configuration

### Added - Phase 9: HallucinationValidator (Rewrite)
- Source reference verification: Validate chunks exist and contain snippets
- Confidence-based filtering: Discard low-confidence values without sources
- Trustworthiness calculation: Percentage of trustworthy fields
- Text similarity matching: 80% minimum match threshold
- Comprehensive warning system: Error vs warning severity
- Async validation with timing metrics

### Added - Phase 11: REST API Infrastructure
- Express.js server with comprehensive middleware
- Document endpoints: List, Get, Upload (async), Delete
- Rule endpoints: CRUD + Test + Duplicate
- Extraction endpoint: 10-step workflow mock
- Centralized error handling (ApiError class)
- Standard response envelope
- Health check endpoint

### Added - Frontend: Rule Editor UI
- RuleEditor main component with 4-tab interface
- RulesList, RuleEditorForm, RuleTester, RuleChangeLog subcomponents
- Mock services with changelog tracking
- Centralized API client (apiClient.ts)
- Error handling layer (useApiError, ApiErrorAlert)
- TypeScript contracts (api/types.ts)

### Added - Environment Configuration
- Frontend .env (dev/prod): VITE_API_URL, logging, tracing
- Backend .env (dev/prod): LLM_PROVIDER, PORT, CORS
- vite.config.ts: Path aliases and environment loading

### Changed
- Removed old policy-based HallucinationValidator (Phase 9 rewrite)
- Updated App.tsx: Added /rules route with RuleEditor
- vite.config.ts: Added @-prefixed aliases for imports

---

## [0.10.0] - 2026-07-05 (Core Phases)

### Added - Phase 2: Domain Models
- Core domain entities: Document, DocumentChunk, ExtractedField<T>, SourceReference
- DocumentFormat enum (PDF, DOCX, HTML, UNKNOWN)
- DocumentTypeEnum (invoice, contract, resume, email, report, unknown)
- ExtractionResult aggregate
- Type-safe confidence tracking (0.0-1.0)
- SourceReference linking extracted values to document chunks
- 50+ unit tests
- Comprehensive README with architecture patterns

### Added - Phase 3: RuleLoader
- ExtractionRule domain model for policy enforcement
- Rule validation (validateNoHallucination, validateAgainstRule)
- Rule schema definitions
- Rule loading and caching
- Comprehensive README

### Added - Phase 4a: Parser Framework
- IDocumentParser interface with DocumentFormat routing
- PdfParser: pdf-parse integration with image extraction
- DocxParser: mammoth integration with structure preservation
- HtmlParser: cheerio integration with semantic parsing
- ParserFactory for automatic format detection
- BaseParser abstract class with shared logic
- Image handling as references (path, size, position)
- 180+ unit tests
- Complete API documentation

### Added - Phase 5: ExampleRepository
- IExampleRepository interface
- FileSystemExampleRepository implementation
- Test example lifecycle (load, compare, manage)
- Expected JSON + image directory loading
- Comparison metrics (fieldAccuracy, confidenceDeviation, sourcesMatched)
- Example metadata creation
- 50+ unit tests
- Directory structure documentation

### Added - Phase 6: ChunkingEngine
- IChunkingStrategy interface with config validation
- SemanticChunkingStrategy: structure-respecting (Markdown, section boundaries)
- SimpleChunkingStrategy: size-only splitting
- HybridChunkingStrategy: adaptive combination
- ChunkingConfig with validation (maxChunkSize >= 100, etc.)
- Confidence scoring per strategy (0.70-1.0)
- Byte-based overlap with word boundary alignment
- 40+ unit tests
- Strategy comparison documentation

### Added - Phase 7: DocumentClassifier
- IDocumentClassifier interface
- FeatureBasedClassifier: pattern-based (NO ML models)
- scoreInvoice/Contract/Resume/Email/Report/Unknown methods
- Keyword matching + indicator collection
- Confidence constraint (max 0.99, never 1.0)
- Uncertainty documentation (conditional)
- Alternative type suggestions
- 30+ unit tests
- Confidence constraint validation (❌ FALSCH vs ✅ RICHTIG)

### Added - Phase 10: ValidationService
- IValidationService interface
- AjvValidationService: JSON Schema validation (AJV)
- Schema loading from extraction-rules/schemas/
- Required/Optional field detection
- Missing field reporting (NO data generation)
- AJV configuration: useDefaults: false (CRITICAL)
- Schema + validator caching
- Error categorization (errors vs warnings)
- 15+ unit tests
- Complete documentation with examples

### Added - Phase 11a: ResultRepository
- IResultRepository interface (6 methods)
- FileSystemResultRepository implementation with filesystem-based storage
- Versionierte JSON Persistierung: `{baseName}_v{n}.json`
- Auto-incrementing version numbers (v1, v2, v3, etc.)
- saveResult(result, baseName): VersionInfo
- loadResult(baseName, version?): ExtractionResult | null
- listVersions(baseName): VersionInfo[] (descending by version)
- deleteVersion(baseName, version): boolean
- saveReport(content, baseName, format): filePath
- Storage directories: results/json/, results/reports/
- Metadata serialization/deserialization (resultId, documentReference, version, ruleSetVersion, extractedAt)
- NO DATA GENERATION: Result unverändert, nur Persistierung
- 13 unit tests (versioninging, serialization, integrity)

### Added - Phase 11b: QualityEvaluator
- IQualityEvaluator interface (5 methods)
- MetricsBasedQualityEvaluator implementation
- 4-Metric Evaluation (weighted, configurable):
  - **Completeness** (30%): extractedFields / totalExpectedFields
  - **Verifiability** (35%): fieldsWithSources / totalFields (SourceReference validation)
  - **Consistency** (20%): Type/bound checking (confidence ∈ [0.0-1.0], value ≠ undefined, sources = Array)
  - **SchemaConformity** (15%): Optional JSON Schema validation (conforming / total fields)
- evaluate(result, totalExpectedFields): QualityScore
- Detailed violation reporting: fieldsWithoutSources[], typeViolations[]
- Weight validation: Sum must equal 1.0 (throws error if not)
- Immutability guarantee: Read-only evaluation, NO data modification
- 17 unit tests (metrics, weights, violations, schema validation, no-data-generation)

### Added - Phase 12: SimilarityService
- ISimilarityService interface (6 methods)
- ChromaDbSimilarityService implementation (with JSON-file fallback for local testing)
- **Key Methods:**
  - `createEmbedding(text: string)`: Generates 384-dimensional deterministic embeddings (seeded LCG, Unit Vector normalization)
  - `storeEmbedding(documentId, embedding, metadata)`: Persists to JSON + In-Memory index
  - `findSimilarDocuments(queryText, topK=5, threshold=0.5)`: Query-based similarity search
  - `findSimilarByEmbedding(embedding, topK=5, threshold=0.5)`: Vector-based similarity search with filtering
  - `calculateSimilarity(emb1, emb2)`: Cosine Similarity calculation (normalized [0,1])
  - `getLocations()`: Returns storage paths (json, vectors)
- **Similarity Scoring:**
  - Cosine Distance: [-1,1] → normalized [0,1] via (similarity + 1) / 2
  - Threshold filtering (default 0.5)
  - Results sorted descending by similarity
  - Top-K limiting
- **Storage Architecture:**
  - JSON Files: learning/embeddings/documents/
  - Metadata persistence: documentId, documentType, fileName, hash, timestamp
  - In-Memory indexing for performance
- **Implementation Notes:**
  - Deterministic embedding generation for test reproducibility
  - Hash-based seeded random generator (LCG algorithm)
  - 384-dim vectors (all-MiniLM-L6-v2 standard)
  - NO DATA GENERATION: Embeddings input immutability verified
- **Test Coverage:** 19 unit tests
  - createEmbedding: consistency, error handling (empty text)
  - storeEmbedding: file persistence, validation
  - findSimilarDocuments: filtering, threshold enforcement
  - findSimilarByEmbedding: vector search accuracy
  - calculateSimilarity: cosine math, edge cases
  - getLocations: path validation
  - No Data Generation: immutability verification
- Removed ChromaDB dependency (server overhead unnecessary for local tests)
- src/application/similarity/ module with complete exports

### Added - Infrastructure
- ajv@^8.12.0 dependency for JSON Schema validation
- Barrel exports: src/domain/index.ts + src/domain/validation/index.ts + src/infrastructure/repositories/index.ts + src/application/quality/index.ts

### Fixed
- N/A

### Changed
- Expanded domain/index.ts exports
- Updated package.json with validation dependency
- tsconfig.json: Added tests to include array for path alias resolution
- src/application/index.ts: Added quality export

### Added - Phase 8: LLMExtractor
- LLMExtractor class for LLM-based field extraction
- Prompt engineering: system + user prompts with rule definitions
- Provider support: OpenAI and Azure OpenAI placeholders
- Source reference tracking: Every extracted value linked to actual chunks
- Confidence scoring: Temperature 0.1 for factual extraction
- Mock LLM response for development/fallback
- Hallucination prevention: Conservative extraction (better to miss than invent)
- Token estimation and max-tokens configuration
- Complete error handling and validation

### Added - Phase 9: HallucinationValidator
- HallucinationValidator class for hallucination detection
- Source reference verification: Validate chunks exist and contain snippets
- Confidence-based filtering: Discard low-confidence values without sources
- Trustworthiness calculation: Percentage of trustworthy fields
- Text similarity matching: 80% minimum match threshold
- Comprehensive warning system: Error vs warning severity levels
- Field-level validation: Individual field hallucination detection
- Detailed violation reporting with reasons
- Async validation with timing metrics

### Added - Phase 11: REST API Infrastructure
- **Express.js Server**: Production-ready middleware stack
  - JSON parsing (50MB limit)
  - CORS configuration with environment control
  - Request validation (Content-Type enforcement)
  - Response wrapper: Standardized JSON envelope
  - Global error handling with ApiResponseError
  - 404 handler with structured responses
  - Health check endpoint (GET /health)

- **Document Routes** (documents.ts):
  - GET /api/documents: List all documents with pagination
  - GET /api/documents/:id: Get single document metadata
  - POST /api/documents/upload: Create new document (simulated async)
  - DELETE /api/documents/:id: Delete document
  - Mock storage with 2 sample documents
  - 300ms processing delay, async completion simulation

- **Rule Routes** (rules.ts):
  - GET /api/rules: List all extraction rules
  - GET /api/rules/:id: Get single rule
  - POST /api/rules: Create new rule
  - PUT /api/rules/:id: Update existing rule
  - DELETE /api/rules/:id: Delete rule
  - POST /api/rules/:id/duplicate: Duplicate with new name
  - POST /api/rules/:id/test: Test rule with input
  - Pattern testing: regex/keyword/date/custom support
  - Mock storage with 2 sample rules

- **Extraction Route** (extraction.ts):
  - POST /api/extract: Start extraction workflow
  - Returns complete 10-step workflow (mock)
  - Step data: inputs, outputs, duration, timestamp
  - Mock extraction duration: ~3200ms total
  - Realistic LLM simulation with confidence scores

- **Error Types**:
  - ApiError: Base error with code, message, statusCode, details
  - NetworkError: Connection failures
  - TimeoutError: 30s timeout
  - StatusError: HTTP 4xx/5xx parsing

- **Response Format**:
  ```json
  {"data": {...}, "timestamp": "ISO-8601", "path": "/api/...", "duration": 125}
  {"error": {...}, "timestamp": "ISO-8601", "path": "/api/..."}
  ```

### Added - Frontend: Rule Editor UI
- **Main Component** (RuleEditor.tsx): 360 lines
  - 4-tab interface: Rules, Edit, Test, Changelog
  - Integrated CRUD operations
  - Duplicate dialog with name input
  - Document selector

- **Subcomponents**:
  - RulesList.tsx: Tabular view with actions
  - RuleEditorForm.tsx: Form with tags + validation
  - RuleTester.tsx: Input/output test interface
  - RuleChangeLog.tsx: Modification history
  - ApiErrorAlert.tsx: Unified error display

- **Services & Hooks**:
  - ruleService.ts: Mock CRUD with changelog tracking
  - useRules.ts: React state management hook
  - useApiError.ts: Error handling hook

- **API Integration**:
  - apiClient.ts: Centralized HTTP client
  - api/types.ts: TypeScript contracts
  - Error logging and request tracking
  - Mock services with realistic delays (300-500ms)

### Added - Environment Configuration
- Frontend .env files: VITE_API_URL, VITE_LOG_LEVEL, VITE_ENABLE_TRACING
- Backend .env files: NODE_ENV, PORT, CORS_ORIGIN, LOG_LEVEL, LLM_PROVIDER, LLM_API_KEY
- vite.config.ts: Path aliases (@/, @components/, @services/, etc.)
- Environment-specific configurations (dev vs prod)

### Known Limitations
- Phase 8 LLMExtractor: OpenAI/Azure methods not implemented (mock fallback)
- Phase 9 HallucinationValidator: Text similarity uses basic algorithm
- Phase 11 API: All endpoints use mock storage, not connected to domain services
- No production deployment infrastructure yet
- Integration layer (ExtractionPipeline) pending
- DI container (ServiceContainer) not yet implemented

---

## [1.0.0] - 2024-01-15 (Legacy)

### Added
- Initial Release (Legacy foundation)

### Added
- Initial Release
- Core ExtractionEngine mit ProvenanceAuditor
- Domain Layer: ExtractionFieldName, ConfidenceScore
- Application Layer: DocumentRuleAssociation, LearningComponent
- Infrastructure Layer: ResultRepository, RuleSetRepository
- Presentation Layer: AuditReportGenerator
- Unit Tests für kritische Komponenten
- Complete Architecture Documentation
- System Prompt und Halluzinations-Policy

### Fixed
- N/A (initial release)

### Changed
- N/A (initial release)

---

## Format

### Added
Neue Features und Additions.

### Fixed
Bug-Fixes und Patches.

### Changed
Änderungen an bestehenden Features.

### Deprecated
Features, die in Zukunft entfernt werden.

### Removed
Entfernte Features.

### Security
Security-Fixes.

---

---

**Zuletzt aktualisiert**: 2026-07-05
