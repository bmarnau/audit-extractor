/**
 * Application Layer
 *
 * Services und Business-Logik: Orchestrierung zwischen Domain und Infrastructure.
 * Keine UI, keine Datenbank-Spezifics.
 *
 * Enthält:
 * - Chunking-Strategien
 * - Extraction-Engine
 * - Classification
 * - Validierung
 * - Aggregation-Services
 */

export * from './chunking';
export * from './classification';
export * from './quality';
export * from './similarity';

// Phase 12: Extraction Pipeline Orchestration
export { ExtractionPipeline } from './ExtractionPipeline';
export type { PipelineStep, PipelineResult, AuditEvent } from './ExtractionPipeline';
