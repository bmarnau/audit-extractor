/**
 * Domain Layer
 *
 * Business Logic und Validierung.
 * Zentrale Policy-Engine mit System Prompt Enforcement.
 */

export { HallucinationValidator } from './HallucinationValidator';
export type { HallucinationReport } from './HallucinationValidator';

export { ExtractionRule, validateNoHallucination, validateAgainstRule } from './ExtractionRule';
export { ConfidenceScore } from './ConfidenceScore';
export { ExtractionFieldName } from './ExtractionFieldName';
export type { ExtractedValue, ExtractionResult, ExtractionWarning, SourceLocation, DocumentReference, ExtractedField } from './ExtractionModels';

export * from './validation';

// Phase 12: Configuration Management
export type { ChunkingConfig, ConfidenceConfig, LLMConfig, SystemConfig, AppConfig, ConfigChange } from './Configuration';
export { DEFAULT_CONFIG } from './Configuration';

// Phase 12: Audit Center
export type { SourceReference, FieldAuditRecord, DocumentAuditReport, AuditEntry } from './AuditCenter';

// Phase 12: Help Center
export type { HelpContentItem, HelpSearchResult, GlossaryEntry, HelpIndex, HelpSearchQuery, HelpStatistics } from './HelpCenter';

// Phase 12: Log Viewer
export type { LogEntry, LogFilter, LogSearchResult, LogStatistics, LogExport, LogRetentionPolicy } from './LogViewer';

// Phase 12: Backup Center
export type { BackupItem, BackupConfig, BackupMetadata, BackupManifest, RestoreRequest, RestoreResult, BackupStatistics, BackupRetentionPolicy } from './BackupCenter';
export { DEFAULT_BACKUP_CONFIG } from './BackupCenter';
