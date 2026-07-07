/**
 * ChromaDB-basierte Implementierung des Similarity Service
 * Fallback zu JSON-Speicherung für lokale Tests (ohne ChromaDB-Server)
 */

import path from 'path';
import fs from 'fs/promises';
import {
  ISimilarityService,
  Embedding,
  EmbeddingMetadata,
  SimilarDocument,
  EmbeddingLocation,
  SimilarityServiceError,
} from './SimilarityService';

/**
 * Gespeichertes Embedding mit Metadaten
 */
interface StoredEmbedding {
  documentId: string;
  embedding: Embedding;
  metadata: EmbeddingMetadata;
  storedAt: string;
}

/**
 * ChromaDB Similarity Service Implementation
 * Fallback zu JSON-File-Speicherung für lokale Tests
 * In Production würde man ChromaDB Server mit echter Vektor-DB nutzen
 */
export class ChromaDbSimilarityService implements ISimilarityService {
  private embeddingDir: string;
  private vectorDir: string;
  private defaultCollectionName = 'documents';
  private embeddingIndex: Map<string, StoredEmbedding> = new Map(); // In-Memory Index

  constructor(embeddingDir: string = 'learning/embeddings', vectorDir: string = 'learning/embeddings/vectors') {
    this.embeddingDir = embeddingDir;
    this.vectorDir = vectorDir;
  }

  /**
   * Initialisiert Speicherverzeichnisse
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.embeddingDir, { recursive: true });
    await fs.mkdir(this.vectorDir, { recursive: true });
  }

  /**
   * Erstellt Embedding aus Text
   */
  async createEmbedding(text: string): Promise<Embedding> {
    if (!text || text.trim().length === 0) {
      throw new SimilarityServiceError('Text darf nicht leer sein');
    }

    try {
      // Generiere Embedding-Stub (in Production würde man einen echten Embedding-Model nutzen)
      return this.generateEmbeddingStub(text);
    } catch (error) {
      throw new SimilarityServiceError(`Embedding-Generierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Speichert Embedding mit Metadaten
   */
  async storeEmbedding(
    documentId: string,
    embedding: Embedding,
    metadata: EmbeddingMetadata,
    collectionName: string = this.defaultCollectionName
  ): Promise<void> {
    if (!documentId) {
      throw new SimilarityServiceError('documentId erforderlich');
    }

    if (!embedding || embedding.length === 0) {
      throw new SimilarityServiceError('Embedding darf nicht leer sein', documentId);
    }

    try {
      const stored: StoredEmbedding = {
        documentId,
        embedding,
        metadata,
        storedAt: new Date().toISOString(),
      };

      // Index im Memory
      this.embeddingIndex.set(documentId, stored);

      // Speichere JSON für Persistierung
      const embeddingFile = path.join(this.embeddingDir, collectionName, `${documentId}.json`);
      await fs.mkdir(path.dirname(embeddingFile), { recursive: true });
      await fs.writeFile(embeddingFile, JSON.stringify(stored, null, 2), 'utf-8');
    } catch (error) {
      throw new SimilarityServiceError(
        `Embedding-Speicherung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`,
        documentId
      );
    }
  }

  /**
   * Findet ähnliche Dokumente basierend auf Query-Text
   */
  async findSimilarDocuments(
    queryText: string,
    topK: number = 5,
    threshold: number = 0.5,
    collectionName: string = this.defaultCollectionName
  ): Promise<SimilarDocument[]> {
    if (!queryText || queryText.trim().length === 0) {
      throw new SimilarityServiceError('Query-Text darf nicht leer sein');
    }

    try {
      const queryEmbedding = this.generateEmbeddingStub(queryText);
      return this.findSimilarByEmbedding(queryEmbedding, topK, threshold, collectionName);
    } catch (error) {
      throw new SimilarityServiceError(
        `Ähnlichkeitssuche fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Findet ähnliche Dokumente basierend auf Embedding-Vektor
   */
  async findSimilarByEmbedding(
    embedding: Embedding,
    topK: number = 5,
    threshold: number = 0.5,
    collectionName: string = this.defaultCollectionName
  ): Promise<SimilarDocument[]> {
    if (!embedding || embedding.length === 0) {
      throw new SimilarityServiceError('Embedding darf nicht leer sein');
    }

    try {
      // Lade Embeddings aus Collection
      const collectionDir = path.join(this.embeddingDir, collectionName);
      let files: string[] = [];

      try {
        files = await fs.readdir(collectionDir);
      } catch {
        // Collection existiert noch nicht
        return [];
      }

      const similarities: SimilarDocument[] = [];

      // Berechne Similarity zu allen gespeicherten Embeddings
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(collectionDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const stored: StoredEmbedding = JSON.parse(content);

        const similarity = this.calculateSimilarity(embedding, stored.embedding);

        if (similarity >= threshold) {
          similarities.push({
            documentId: stored.documentId,
            similarity,
            metadata: stored.metadata as Record<string, unknown>,
          });
        }
      }

      // Sortiere nach Similarity (absteigend) und nimm topK
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      if (error instanceof SimilarityServiceError) throw error;
      throw new SimilarityServiceError(
        `Embedding-Suche fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Berechnet Cosine Similarity zwischen zwei Embeddings
   */
  calculateSimilarity(embedding1: Embedding, embedding2: Embedding): number {
    if (embedding1.length !== embedding2.length) {
      throw new SimilarityServiceError('Embeddings müssen gleiche Länge haben');
    }

    if (embedding1.length === 0) {
      throw new SimilarityServiceError('Embeddings dürfen nicht leer sein');
    }

    // Cosine Similarity: A·B / (||A|| * ||B||)
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      normA += embedding1[i] * embedding1[i];
      normB += embedding2[i] * embedding2[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const cosineSimilarity = dotProduct / (normA * normB);
    // Normalize von [-1, 1] zu [0, 1]
    return (cosineSimilarity + 1) / 2;
  }

  /**
   * Gibt Speicherorte zurück
   */
  getLocations(): EmbeddingLocation {
    return {
      json: this.embeddingDir,
      vectors: this.vectorDir,
    };
  }

  /**
   * Hilfsmethode: Generiert Embedding-Stub für Tests
   * In Production würde man einen echten Embedding-Model nutzen
   * @private
   */
  private generateEmbeddingStub(text: string): Embedding {
    // Simple Stub: Text-Hash in Fixed-Size Vector (384 dimensions für all-MiniLM-L6-v2)
    const hash = this.simpleHash(text);
    const vector: Embedding = [];

    for (let i = 0; i < 384; i++) {
      // Pseudo-random Werte basierend auf Hash
      const seed = (hash + i * 31) % 1000;
      vector.push((Math.sin(seed) + 1) / 2); // Normalize zu [0, 1]
    }

    return vector;
  }

  /**
   * Einfache Hash-Funktion für Text
   * @private
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
