/**
 * Barrel exports für Similarity Service
 */

export type { ISimilarityService, Embedding, SimilarDocument, EmbeddingMetadata, EmbeddingLocation } from './SimilarityService';
export { SimilarityServiceError } from './SimilarityService';
export { ChromaDbSimilarityService } from './ChromaDbSimilarityService';
