/**
 * Chunking Strategy Interface
 *
 * Verschiedene Strategien zum Teilen von Dokumenten in Chunks.
 * Strategy Pattern für flexible Chunking-Implementierungen.
 */

import { Document, DocumentChunk } from '@core/models';

/**
 * Konfiguration für Chunking.
 */
export interface ChunkingConfig {
  maxChunkSize: number; // Bytes
  overlapSize: number; // Bytes (0 = keine Überlappung)
  minChunkSize?: number; // Mindestgröße (default: maxChunkSize / 4)
  preserveHeadings?: boolean; // Behalte Überschriften?
  preserveSections?: boolean; // Behalte Abschnitte?
  respectParagraphs?: boolean; // Splitte nicht in der Mitte von Absätzen?
}

/**
 * Strategy für Text-Chunking.
 */
export interface IChunkingStrategy {
  /**
   * Teilt Document in Chunks.
   *
   * @param document Source Document
   * @param config Chunking Konfiguration
   * @returns Array von DocumentChunk
   */
  chunk(document: Document, config: ChunkingConfig): Promise<DocumentChunk[]>;

  /**
   * Gibt Namen der Strategie zurück.
   */
  getName(): string;
}

/**
 * Fehlerklasse für Chunking-Fehler.
 */
export class ChunkingError extends Error {
  constructor(
    message: string,
    public readonly strategy?: string,
    public readonly documentId?: string
  ) {
    super(message);
    this.name = 'ChunkingError';
  }
}

/**
 * Validierungsergebnis für Konfiguration.
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validiert ChunkingConfig.
 */
export function validateChunkingConfig(config: ChunkingConfig): ConfigValidationResult {
  const errors: string[] = [];

  if (config.maxChunkSize < 100) {
    errors.push('maxChunkSize must be at least 100 bytes');
  }

  if (config.overlapSize < 0) {
    errors.push('overlapSize cannot be negative');
  }

  if (config.overlapSize >= config.maxChunkSize) {
    errors.push('overlapSize must be less than maxChunkSize');
  }

  if (config.minChunkSize && config.minChunkSize > config.maxChunkSize) {
    errors.push('minChunkSize cannot be greater than maxChunkSize');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
