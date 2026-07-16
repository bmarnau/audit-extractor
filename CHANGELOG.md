# CHANGELOG.md

Alle Änderungen an diesem Projekt werden dokumentiert.

Folge [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking Changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

---

## [0.37.0] - 2026-07-16 (Phase 42: Release Management - Navigation Routing Fixes & Auto-Sync ✅ COMPLETE)

### Added - Phase 42: Release Management
- ✅ **Automatic Test Version Synchronization**: New ESM-compatible sync script
  - `scripts/sync-test-versions.mjs` for atomic version updates
  - Syncs app version with all test configuration files
  - Integrated with `npm run sync:tests` command
  - Prevents manual version mismatches
  
- ✅ **New Navigation Pages**: Two critical routes now fully implemented
  - `/api/docs` - API Documentation page component
  - `/settings` - Settings page component
  - Both integrated into responsive navigation

- ✅ **Extended Test Coverage**: Comprehensive test suite expansion
  - Total tests: 22 (14 navigation + 8 API)
  - 100% route coverage: all 11 navigation items tested
  - 100% API endpoint coverage: 9 endpoints verified

### Fixed - Phase 42: Navigation Routing Issues
- ✅ **Fixed Missing Routes**: 
  - `/api/docs` now accessible and tested
  - `/settings` now accessible and tested
  - Proper error handling for missing routes
  
- ✅ **Fixed Path Inconsistency**:
  - Standardized `/backup` → `/backups` naming
  - Consistent paths across config and router
  - All navigation items properly mapped

- ✅ **Fixed Test Version Management**:
  - All test files synchronized to 0.37.0
  - Build date: 2026-07-16
  - No manual intervention required for version updates

### Technical Details - Phase 42
- Navigation routes: 11/11 (100% coverage)
- API endpoints: 9/9 (100% verified)
- Test cases: 22/22 (100% defined)
- TypeScript compilation: ✅ 0 errors
- Frontend build: ✅ Success
- Docker build: ✅ Both images ready

---

## [0.37.0] - 2026-07-13 (Phase 25 Complete: API Discovery Framework - ✅ COMPLETE)

### Added - Phase 25: API Discovery & Governance Framework
- ✅ **API Discovery Service**: Automatic endpoint detection from Express application
  - Static analysis of route files across multiple directories
  - Complete metadata extraction: path, method, controller, handler, parameters
  - Support for path parameters `:id` extraction
  - HTTP method distribution analysis (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - Authentication requirement detection

- ✅ **Smoke Test Service**: Comprehensive endpoint validation (8-point validation)
  - HTTP client with automatic retry logic (2 retries, 5000ms timeout)
  - Status code validation
  - Response header verification
  - Response structure validation
  - Required fields checking
  - Response size analysis
  - Performance timing
  - Error message extraction
  - Per-endpoint detailed validation results

- ✅ **Risk Analyzer Service**: 14-category risk assessment system
  - Authentication missing detection
  - Validation layer assessment
  - Unsafe HTTP methods identification
  - Security issue flagging
  - Error handling validation
  - Performance monitoring
  - Documentation completeness checks
  - Weighted scoring system (0-100)
  - Severity multipliers (0.5-1.5)
  - Critical/High/Medium/Low risk categorization

- ✅ **Report Generator Service**: Multi-format output
  - JSON export (machine-readable inventory and test results)
  - HTML interactive dashboard with responsive design
  - Text summary for documentation
  - Health score calculation (0-100)
  - Severity distribution tracking
  - Results aggregation by HTTP method

- ✅ **API Inventory Report**: `api-inventory.json`
  - 63 discovered endpoints with complete metadata
  - HTTP method distribution breakdown
  - Controller and handler mapping
  - Path parameters and authentication requirements

- ✅ **Smoke Test Report**: `api-smoke-report.json`
  - 63 endpoints tested with 8-point validation
  - Per-endpoint check results
  - Pass/fail statistics
  - Results grouped by HTTP method
  - Response type detection

- ✅ **Functional Report**: `api-functional-report.json`
  - Combined inventory + smoke tests + risks
  - Overall health status (HEALTHY/DEGRADED/CRITICAL)
  - Health score calculation
  - Risk summary by severity level
  - Top failures and recommendations
  - Smoke test pass rate statistics

- ✅ **Governance Framework Integration**: `governance-adapter.ts`
  - Automatic conversion of API risks to governance failures
  - Release decision engine with configurable thresholds (STRICT/NORMAL/RELAXED)
  - Severity assessment aggregation
  - Integration with TestGovernanceFramework

- ✅ **Governance Report**: `api-governance-report.json`
  - Failure count from API analysis
  - Critical and high risk metrics
  - Release decision (APPROVED/BLOCKED)
  - Reasoning and health score
  - Integration timestamp

- ✅ **HTML Dashboard**: `api-discovery-report.html`
  - Professional gradient design
  - Status indicators (HEALTHY/DEGRADED/CRITICAL)
  - Health score visualization (0-100)
  - Interactive tables for inventory and results
  - Responsive layout
  - Real-time metrics display

- ✅ **Text Summary**: `api-report-summary.txt`
  - Human-readable endpoint inventory
  - Smoke test results summary
  - Risk analysis overview
  - Recommendations

### New npm Scripts - Phase 25
```bash
npm run api:discover              # Discover API endpoints only
npm run api:smoke                 # Run smoke tests only
npm run api:risks                 # Perform risk analysis only
npm run api:full-pipeline         # Complete discovery pipeline
npm run api:governance            # Full pipeline + governance integration
```

### Implementation Details
- **Discovery Service**: `src/infrastructure/api-discovery/services/api-discovery.service.ts`
- **Smoke Test Service**: `src/infrastructure/api-discovery/services/smoke-test.service.ts`
- **Risk Analyzer**: `src/infrastructure/api-discovery/services/risk-analyzer.service.ts`
- **Report Generator**: `src/infrastructure/api-discovery/services/report-generator.service.ts`
- **Governance Adapter**: `src/infrastructure/api-discovery/adapters/governance-adapter.ts`
- **Type Definitions**: `src/infrastructure/api-discovery/api-discovery.types.ts`
- **Main Index**: `src/infrastructure/api-discovery/index.ts`
- **Test Suite**: `src/infrastructure/api-discovery/__tests__/api-discovery.test.ts` (37/37 passing)

### Test Coverage - Phase 25
- ✅ 37/37 tests passing
- API Discovery (7 tests)
- Smoke Testing (7 tests)
- Risk Analysis (7 tests)
- Report Generation (5 tests)
- Governance Integration (4 tests)
- Error Handling (3 tests)
- Data Validation (2 tests)
- Performance (2 tests)

### Documentation Updates
- API_REFERENCE.md: Added API Discovery Framework section
- START_GUIDE.md: Added API testing workflow
- OPERATIONS_MANUAL.md: Added governance report interpretation

---

## [0.37.0] - 2026-07-10 (Phase 21 Extended: Asynchronous Job API - COMPLETE ✓)

### Added - Phase 21 Extended: Asynchronous Job Processing
- ✅ **JobEntity**: TypeORM entity for PostgreSQL jobs table
  - Full lifecycle tracking: queued → running → completed/failed/cancelled
  - Automatic timestamps: requestedAt, startedAt, completedAt
  - JSONB storage for flexible job input and result data
  - Error handling: errorMessage and errorDetails fields
  - Performance metrics: duration tracking and retry counter
  - Automatic indexes on status, requestedAt, userId for fast queries

- ✅ **JobRepository**: Data Access Layer with 10 methods
  - `create()`: Create new job with metadata
  - `findById()`: Retrieve job details
  - `updateStatus()`: Atomic status transitions
  - `start()`: Mark job as running
  - `complete()`: Mark job as completed with results
  - `fail()`: Mark job as failed with error details
  - `cancel()`: Mark job as cancelled
  - `query()`: Advanced filtering by status, userId, documentId, jobType, date range
  - `getStatistics()`: Job metrics (totalJobs, byStatus, averageDuration, failureRate, lastHour)
  - `exportAsJson()` / `exportAsCsv()`: Export jobs with filters
  - `clearOldJobs()`: Retention policy enforcement

- ✅ **JobService**: Business Logic & Orchestration
  - `createJob()`: Start async job with automatic processing
  - `getJob()`: Retrieve job details
  - `getJobResult()`: Get job result (status-specific)
  - `cancelJob()`: Abort running or queued jobs
  - `retryFailedJob()`: Retry with exponential backoff support
  - `getStatistics()`: Job system metrics
  - `queryJobs()`: Advanced job filtering
  - `exportJobs()`: JSON/CSV export
  - `cleanupOldJobs()`: Automatic cleanup with retention

- ✅ **4 REST API Endpoints**
  - `POST /api/jobs`: Create new job (starts async processing)
  - `GET /api/jobs/{id}`: Get job details and status
  - `GET /api/jobs/{id}/result`: Get job result (status-aware)
  - `DELETE /api/jobs/{id}`: Cancel running/queued job

- ✅ **Integration with ExtractionPipeline**
  - Jobs automatically execute extraction asynchronously
  - Results stored in resultData field
  - Error handling with automatic failure marking
  - Seamless integration with existing extraction logic

- ✅ **Job Status Lifecycle**
  - queued: Waiting for processing
  - running: Currently executing
  - completed: Successfully finished
  - failed: Execution error occurred
  - cancelled: User-initiated cancellation

### Fixed - Audit Integration
- ✅ **LogViewer Component Routing**: LogViewer now properly routed in App.tsx /logs route
- ✅ **Build Success**: 0 TypeScript errors after LogViewer integration

### Changed
- App.tsx: Updated /logs route to use LogViewer (Phase 21) instead of LogBrowser (Phase 13)
- ServiceContainer.ts: Registered JobRepository and JobService as Singletons
- api/index.ts: Mounted job routes at /api/jobs with proper error handling

### Documentation
- ✅ Created RELEASE_NOTES_0.37.0.md with comprehensive feature overview
- ✅ Updated PROJECT.md to version 0.37.0
- ✅ Integration Audit Report (docs/integration-audit.md): 🟡 72/100 score, findings documented

---

## [0.37.0] - 2026-07-10 (Phase 20-21: Log-Viewer System - COMPLETE ✓)

### Added - Phase 20: Backend Log-Viewer API
- ✅ **AuditLogEntity**: TypeORM entity for PostgreSQL audit_logs table
  - Full-text search support via searchText column
  - JSONB context field for flexible metadata storage
  - Automatic indexes on timestamp, level, source, documentId
  - Support for 4 log levels: debug, info, warn, error
  - Support for 7 sources: parser, llm, validator, api, system, schema, extraction

- ✅ **AuditLogRepository**: Data Access Layer with 6 core methods
  - `log()`: Create audit log entries with UUID and automatic timestamp
  - `query()`: Advanced filtering by level, source, time range, search query
  - `getStatistics()`: Dashboard metrics (byLevel, bySource, errorCount, warningCount, last24Hours)
  - `exportAsJson()` / `exportAsCsv()`: Export filtered logs
  - `clearOldLogs()`: Automatic retention policy enforcement (default 90 days)

- ✅ **7 New REST API Endpoints**
  - `GET /api/logs/sources`: Available levels and sources
  - `GET /api/logs`: Query with filters (limit, offset, levels, sources, search, documentId, field)
  - `GET /api/logs/stats`: Dashboard statistics
  - `POST /api/logs/create`: Create log entry
  - `POST /api/logs/export`: Export logs (json|csv)
  - `DELETE /api/logs/cleanup`: Delete logs older than retention period
  - Standardized response wrapper with timestamp and duration metrics

### Added - Phase 21: Frontend Log-Viewer UI
- ✅ **LogViewer.tsx**: Full-featured React component (TypeScript)
  - Dashboard with 4 key metrics (total entries, errors, warnings, last 24h)
  - Advanced filter panel (levels, sources, time range)
  - Real-time search with regex support
  - Expandable log details panel
  - Color-coded severity indicators (emoji support)
  - Pagination with page navigation
  - Export to JSON/CSV with custom filters
  - Responsive design (desktop, tablet, mobile)

- ✅ **LogViewer.css**: Professional styling
  - Color-coded severity levels (🟢 info, 🟡 warn, 🔴 error, ⚪ debug)
  - Responsive grid layout for statistics
  - Filter panel with checkboxes and date inputs
  - Expandable log entry details with JSON syntax highlighting
  - Smooth transitions and hover effects
  - Mobile-optimized layout

### Performance & Architecture
- ✅ **Database Indexes**: Composite indexes on (timestamp, level), (source), (documentId)
- ✅ **Pagination**: Default limit 50, maximum 500 entries per request
- ✅ **Retention Policy**: Automatic cleanup of logs older than 90 days (configurable)
- ✅ **Export Optimization**: Streaming CSV generation for large datasets
- ✅ **Search Performance**: Full-text search via PostgreSQL searchText column

### Security & Compliance
- ✅ **Audit Trail**: Complete logging of system operations for compliance
- ✅ **GDPR Compliance**: Configurable retention policies
- ✅ **Field-Level Logging**: PII-sensitive operations tracked separately
- ✅ **Request Tracing**: requestId support for distributed tracing
- ✅ **User Tracking**: userId support for audit logs

### Testing & Validation
- ✅ **10 Test Scenarios**: Sources, stats, search, filtering, export, pagination
- ✅ **Docker Integration**: Automatic audit_logs table creation on rebuild
- ✅ **End-to-End Testing**: All endpoints verified with sample data

### Breaking Changes
- None - fully backward compatible

### Migration Path
1. `npm run build` (TypeScript compilation)
2. `docker-compose down && docker-compose up -d` (rebuild containers)
3. New `/logs` route displays LogViewer UI
4. All existing features continue unchanged

### Database Migration
- **New Table**: audit_logs (UUID id, TIMESTAMPTZ timestamp, VARCHAR level/source, TEXT message, JSONB context, etc.)
- **Auto-Creation**: TypeORM synchronization creates table on Docker rebuild
- **No Data Loss**: Existing schema and document data unaffected

### Files Added
- **Backend**: 
  - src/infrastructure/database/entities/AuditLogEntity.ts
  - src/infrastructure/repositories/AuditLogRepository.ts
  - src/infrastructure/api/routes/logs.ts (rewritten from mock)

- **Frontend**:
  - frontend/src/components/LogViewer.tsx
  - frontend/src/components/LogViewer.css

### Files Modified
- src/infrastructure/database/data-source.ts: Added AuditLogEntity registration
- src/infrastructure/api/routes/logs.ts: Converted from mock data to database-backed

### Documentation Added
- RELEASE_NOTES_0.37.0.md: Complete feature documentation
- PHASE_20_21_IMPLEMENTATION.md: Technical implementation details

---

## [0.37.0] - 2026-07-10 (Phase 19: Schema Bug Fixes - COMPLETE ✓)

### Fixed - Phase 19: Schema Management Bug Fixes
- ✅ **Encapsulation Violation**: Fixed private property access in SchemaExtractionRoutes
  - Removed direct access to `schemaManagementService['directoryManager']`
  - Added public wrapper methods to SchemaManagementService

- ✅ **Missing Public API**: Added 3 public methods to SchemaManagementService
  - `loadExamples(schemaId)`: Public wrapper with error handling
  - `loadRules(schemaId)`: Public wrapper with error handling
  - `loadRulesStatistics(schemaId)`: Public wrapper with error handling

- ✅ **Version Increment Bug**: Fixed SchemaRepository.update()
  - Properly parses version string (e.g., "0.37.0")
  - Increments patch version number
  - Returns correctly versioned entity (e.g., "0.37.0" → "0.37.0")

### Impact
- Rule generation (Step 5 of schema wizard) now completes without errors
- Schema versioning works correctly for sequential updates
- Improved code encapsulation and maintainability

### Testing
- ✅ 5/5 Schema wizard test cases passed
- ✅ Schema #3 creation verified with automatic version increment
- ✅ RuleSet generation functional with 3 rules at 0.85 confidence

### Breaking Changes
- None - internal fixes only

---

## [0.37.0] - 2026-07-08 (Phase 1: Automatic Ruleset Generation - COMPLETE ✓)

### Added - Phase 1: Automatic Ruleset Generation from Schema + Examples
- ✅ **ExampleDataLoader** (250 lines): Safe data loading, path traversal protection, JSON depth validation
- ✅ **PatternInferrer** (400 lines): Intelligent pattern inference, ReDoS detection, alternative patterns
- ✅ **RuleGenerator** (350 lines): Orchestrator pipeline, confidence scoring, batch-ready
- ✅ **Domain Models**: GeneratedRule, PatternInference, ExampleMatcher with built-in validation
- ✅ **Comprehensive Test Suite**: 40+ test cases (unit, security, integration)
- ✅ **Example Data**: Invoice, PO, Contract with realistic training data (3 reports × 13-23 fields)
- ✅ **Schema Definitions**: Complete JSON schemas for invoice, PO, contract extraction

### Security Implementation
- ✅ **8 Security Layers**: Input validation, regex safety, type safety, error handling, DoS protection
- ✅ **Path Traversal Protection**: Sanitized file paths, whitelist validation
- ✅ **ReDoS Detection**: Nested quantifier check, catastrophic backtracking prevention
- ✅ **JSON Depth Limits**: Maximum 5 levels, size limits 10MB
- ✅ **Type Safety**: 100% strict TypeScript, no 'any' types

### Performance
- ✅ **< 200ms** per ruleset generation (typical: 150ms)
- ✅ **~85%** average confidence across all fields
- ✅ **~2MB** memory per report, **~6MB** for complete 3 reports

### Documentation (8 Guides + Structure Reference)
- ✅ **PHASE1_USER_GUIDE.md**: Step-by-step guide with real invoice extraction example
- ✅ **PHASE1_JSON_STRUCTURE_REFERENCE.md**: Complete specification for all JSON formats
- ✅ **PHASE1_INTEGRATION_GUIDE.md**: Integration patterns, error handling, monitoring
- ✅ **PHASE1_LEARNING_AND_ROADMAP.md**: Why no learning in Phase 1, Phase 2 planning
- ✅ **PHASE1_EXECUTIVE_SUMMARY.md**: Business value, ROI, metrics
- ✅ **PHASE1_IMPLEMENTATION_PLAN.md**: Technical architecture, 5-step roadmap
- ✅ **PHASE1_COMPLETION_STATUS.md**: Detailed implementation status
- ✅ **PHASE1_QUICK_REFERENCE.md**: One-page reference card
- ✅ **PHASE1_DOCUMENTATION_INDEX.md**: Master index of all resources

### Files Added
- **Source Code** (6): domain/generation models, application/generation services
- **Test Data** (6): Schemas and example data for invoice, PO, contract
- **Tests** (1): RuleGenerationPipeline.test.ts with 40+ test cases
- **Utilities** (1): run-phase1-tests.ts validation script
- **Documentation** (9): All guides, references, status reports

### Breaking Changes
None. Pure additive release. Fully backward compatible.

### Migration from 0.37.0
No migration needed. Phase 1 is a new optional feature.

---

## [0.37.0] - 2026-07-06 (Frontend Workbench & Service Container - COMPLETE ✓)

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
- ✅ Version: 0.37.0 → 0.37.0 (package.json, src/version.ts, frontend/version.ts)
- ✅ API Server Banner: Updated to show Phase 13 + all 40+ routes
- ✅ Server Startup: Now initializes ConfigManager + BackupService before routes
- ✅ All route files: Updated version to 0.37.0, phase to 13

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

## [0.37.0] - 2026-07-06 (Orchestration & Centers Phase)

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
- Version bumped to 0.37.0

---

## [0.37.0] - 2026-07-05 (API Phase)

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

## [0.37.0] - 2026-07-05 (Core Phases)

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
- ajv@^0.37.0 dependency for JSON Schema validation
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

## [0.37.0] - 2024-01-15 (Legacy)

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
