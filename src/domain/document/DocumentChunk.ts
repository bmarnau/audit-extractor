/**
 * DocumentChunk - Value Object for semantic chunks
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline
 */

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  sectionId?: string;
  sectionTitle?: string;
  headingLevel?: number;
  isTableChunk: boolean;
  tableCount: number;
  wordCount: number;
  estimatedReadingTimeSeconds: number;
  extractedAt: string;
}

/**
 * Document chunk value object
 */
export interface DocumentChunk {
  chunkId: string; // chunk_0001 format
  pageStart: number;
  pageEnd: number;
  sequenceNumber: number;
  content: string;
  contentLength: number;
  metadata: ChunkMetadata;
}

/**
 * Factory for DocumentChunk
 */
export class DocumentChunkFactory {
  private static chunkCounter = 0;

  /**
   * Create new chunk
   */
  static create(
    pageStart: number,
    pageEnd: number,
    sequenceNumber: number,
    content: string,
    metadata: ChunkMetadata
  ): DocumentChunk {
    if (pageStart < 1) {
      throw new Error('pageStart must be >= 1');
    }

    if (pageEnd < pageStart) {
      throw new Error('pageEnd cannot be less than pageStart');
    }

    if (sequenceNumber < 1) {
      throw new Error('sequenceNumber must be >= 1');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('content cannot be empty');
    }

    this.chunkCounter++;
    const chunkId = `chunk_${String(this.chunkCounter).padStart(4, '0')}`;

    return {
      chunkId,
      pageStart,
      pageEnd,
      sequenceNumber,
      content,
      contentLength: content.length,
      metadata: {
        ...metadata,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Estimate reading time in seconds (200 words per minute)
   */
  static estimateReadingTime(wordCount: number): number {
    return Math.ceil((wordCount / 200) * 60); // seconds
  }

  /**
   * Reset counter for testing
   */
  static reset(): void {
    this.chunkCounter = 0;
  }
}
