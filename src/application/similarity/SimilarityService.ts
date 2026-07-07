/**
 * Similarity Service für Vektor-Embeddings und ähnliche Dokumentensuche
 */

/**
 * Embedding-Vektor (Float-Array)
 */
export type Embedding = number[];

/**
 * Ähnliches Dokument mit Similarity Score
 */
export interface SimilarDocument {
  documentId: string;
  similarity: number; // 0.0-1.0, höher = ähnlicher
  metadata?: Record<string, unknown>;
}

/**
 * Speicherort für Embeddings
 */
export interface EmbeddingLocation {
  json: string;
  vectors: string;
}

/**
 * Dokumentmetadaten für Embedding
 */
export interface EmbeddingMetadata {
  documentId: string;
  documentType: string;
  fileName: string;
  hash: string;
  timestamp: Date;
  [key: string]: unknown;
}

/**
 * Similarity Service Interface
 * Verwaltet Vektor-Embeddings und findet ähnliche Dokumente
 * WICHTIG: Keine Datenmodifikation - nur Analyse und Speicherung
 */
export interface ISimilarityService {
  /**
   * Erstellt Embedding aus Text
   * @param text Text zum Einbetten
   * @returns Float-Array (Embedding-Vektor)
   */
  createEmbedding(text: string): Promise<Embedding>;

  /**
   * Speichert Embedding mit Metadaten
   * @param documentId Eindeutige Dokument-ID
   * @param embedding Embedding-Vektor
   * @param metadata Dokumentmetadaten
   * @param collectionName Optional: Sammlung (default: 'documents')
   */
  storeEmbedding(
    documentId: string,
    embedding: Embedding,
    metadata: EmbeddingMetadata,
    collectionName?: string
  ): Promise<void>;

  /**
   * Findet ähnliche Dokumente basierend auf Query-Text
   * @param queryText Suchtext
   * @param topK Anzahl ähnlichster Dokumente
   * @param threshold Minimal-Similarity-Score (0.0-1.0)
   * @param collectionName Optional: Sammlung durchsuchen
   * @returns Array ähnlicher Dokumente (absteigend nach Similarity)
   */
  findSimilarDocuments(
    queryText: string,
    topK?: number,
    threshold?: number,
    collectionName?: string
  ): Promise<SimilarDocument[]>;

  /**
   * Findet ähnliche Dokumente basierend auf Embedding-Vektor
   * @param embedding Embedding-Vektor
   * @param topK Anzahl ähnlichster Dokumente
   * @param threshold Minimal-Similarity-Score
   * @param collectionName Optional: Sammlung durchsuchen
   * @returns Array ähnlicher Dokumente (absteigend nach Similarity)
   */
  findSimilarByEmbedding(
    embedding: Embedding,
    topK?: number,
    threshold?: number,
    collectionName?: string
  ): Promise<SimilarDocument[]>;

  /**
   * Berechnet Similarity Score zwischen zwei Embeddings
   * @param embedding1 Erstes Embedding
   * @param embedding2 Zweites Embedding
   * @returns Cosine Similarity (0.0-1.0)
   */
  calculateSimilarity(embedding1: Embedding, embedding2: Embedding): number;

  /**
   * Gibt Speicherorte zurück
   */
  getLocations(): EmbeddingLocation;
}

/**
 * Custom Error für Similarity Service
 */
export class SimilarityServiceError extends Error {
  constructor(message: string, public readonly documentId?: string) {
    super(message);
    this.name = 'SimilarityServiceError';
  }
}
