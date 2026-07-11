/**
 * Document Domain Exports
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

export { DocumentId } from './DocumentId';
export { DocumentPage, DocumentPageFactory } from './DocumentPage';
export {
  DocumentSection,
  DocumentSectionFactory,
  DocumentTable,
  DocumentTableFactory,
} from './DocumentSection';
export { DocumentMetadata, DocumentMetadataFactory } from './DocumentMetadata';
export { UnifiedDocument } from './UnifiedDocument';
export {
  DocumentAdapter,
  DocumentAdapterOptions,
  DocumentAdapterFactory,
  DocumentAdapterError,
} from './DocumentAdapter';
export { DocumentChunk, DocumentChunkFactory } from './DocumentChunk';
export { DocumentStructure, StructureNode, DocumentStructureFactory } from './DocumentStructure';
export { ChunkQualityReport, ChunkQualityMetrics, ChunkQualityReportFactory } from './ChunkQualityReport';
export {
  PreparedDocument,
  PipelineLogEntry,
  PreparedDocumentFactory,
} from './PreparedDocument';
