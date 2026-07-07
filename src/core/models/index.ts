/**
 * Core Domain Models
 *
 * Zentrale Domänenmodelle des Audit-Safe Document Extractors.
 * Alle Modelle sind Interfaces/Enums - keine konkrete Implementierung.
 *
 * Exportiert:
 * - Document & DocumentMetadata
 * - DocumentChunk & DocumentImage
 * - ExtractionResult & ValidationResult
 * - QualityReport & ReflectionReport
 * - CorrectionRecord
 */

export type { Document } from './Document';
export type { DocumentMetadata } from './DocumentMetadata';
export { DocumentFormat } from './DocumentMetadata';

export type { DocumentChunk } from './DocumentChunk';
export type { DocumentImage } from './DocumentImage';

export type {
  ExtractionResult,
  ExtractedField,
  SourceReference,
  ExtractionWarning,
} from './ExtractionResult';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './ValidationResult';

export type {
  QualityReport,
  QualityMetrics,
} from './QualityReport';

export type {
  ReflectionReport,
  ReflectionReports,
} from './ReflectionReport';

export type {
  CorrectionRecord,
  CorrectionReports,
} from './CorrectionRecord';
export { ErrorCategory } from './CorrectionRecord';
