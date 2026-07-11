/**
 * PreparedDocument - Aggregate for fully prepared document
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline
 */

import { UnifiedDocument } from './UnifiedDocument';
import { DocumentStructure } from './DocumentStructure';
import { DocumentChunk } from './DocumentChunk';
import { DocumentTable } from './DocumentSection';
import { ChunkQualityReport } from './ChunkQualityReport';

/**
 * Pipeline execution log entry
 */
export interface PipelineLogEntry {
  timestamp: string;
  step: string;
  status: 'started' | 'completed' | 'failed';
  durationMs: number;
  message?: string;
  error?: string;
}

/**
 * Prepared document - complete result from preparation pipeline
 */
export interface PreparedDocument {
  preparedDocumentId: string;
  documentId: string;
  unifiedDocument: UnifiedDocument;
  structure: DocumentStructure;
  chunks: DocumentChunk[];
  tables: DocumentTable[];
  qualityReport: ChunkQualityReport;
  pipelineMetadata: {
    startedAt: string;
    completedAt: string;
    totalDurationMs: number;
    successfulSteps: number;
    totalSteps: number;
    status: 'success' | 'partial' | 'failed';
    executionLog: PipelineLogEntry[];
  };
}

/**
 * Factory for PreparedDocument
 */
export class PreparedDocumentFactory {
  private static preparedCounter = 0;

  /**
   * Create prepared document
   */
  static create(
    unifiedDocument: UnifiedDocument,
    structure: DocumentStructure,
    chunks: DocumentChunk[],
    tables: DocumentTable[],
    qualityReport: ChunkQualityReport,
    executionLog: PipelineLogEntry[]
  ): PreparedDocument {
    if (!unifiedDocument) {
      throw new Error('unifiedDocument is required');
    }

    if (!structure) {
      throw new Error('structure is required');
    }

    if (!chunks || chunks.length === 0) {
      throw new Error('chunks cannot be empty');
    }

    if (!qualityReport) {
      throw new Error('qualityReport is required');
    }

    this.preparedCounter++;
    const preparedDocumentId = `prepared_${String(this.preparedCounter).padStart(4, '0')}`;

    const documentId = unifiedDocument.getId().toString();
    const startedAt = executionLog.length > 0 ? executionLog[0].timestamp : new Date().toISOString();
    const completedAt = new Date().toISOString();
    const totalDurationMs = executionLog.reduce((sum, entry) => sum + entry.durationMs, 0);
    const successfulSteps = executionLog.filter((e) => e.status === 'completed').length;
    const totalSteps = executionLog.length;
    const status = successfulSteps === totalSteps ? 'success' : successfulSteps > 0 ? 'partial' : 'failed';

    return {
      preparedDocumentId,
      documentId,
      unifiedDocument,
      structure,
      chunks,
      tables,
      qualityReport,
      pipelineMetadata: {
        startedAt,
        completedAt,
        totalDurationMs,
        successfulSteps,
        totalSteps,
        status,
        executionLog,
      },
    };
  }

  /**
   * Reset counter for testing
   */
  static reset(): void {
    this.preparedCounter = 0;
  }
}
