/**
 * ChunkQualityReport - Value Object for chunk quality analysis
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline
 */

/**
 * Chunk quality metrics
 */
export interface ChunkQualityMetrics {
  chunkId: string;
  sizeStatus: 'oversized' | 'normal' | 'undersized';
  contentCompleteness: number; // 0-1
  contextQuality: number; // 0-1, based on heading context
  tableIntegrity: number; // 0-1, for table chunks
  issues: string[];
}

/**
 * Chunk quality report
 */
export interface ChunkQualityReport {
  reportId: string; // report_0001 format
  documentId: string;
  analysisMetadata: {
    analyzedAt: string;
    totalChunks: number;
    analysisDurationMs: number;
  };
  configuration: {
    minChunkSize: number;
    maxChunkSize: number;
    targetChunkSize: number;
  };
  statistics: {
    averageChunkSize: number;
    medianChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    standardDeviation: number;
  };
  distribution: {
    oversizedChunks: number;
    normalChunks: number;
    undersizedChunks: number;
    tableChunks: number;
    averageTablesPerChunk: number;
  };
  qualityMetrics: ChunkQualityMetrics[];
  overallQualityScore: number; // 0-1
  recommendations: string[];
}

/**
 * Factory for ChunkQualityReport
 */
export class ChunkQualityReportFactory {
  private static reportCounter = 0;

  /**
   * Create quality metrics for a chunk
   */
  static createMetrics(
    chunkId: string,
    contentSize: number,
    hasContext: boolean,
    tableCount: number,
    config: {
      minChunkSize: number;
      maxChunkSize: number;
      targetChunkSize: number;
    }
  ): ChunkQualityMetrics {
    const issues: string[] = [];
    let sizeStatus: 'oversized' | 'normal' | 'undersized';

    // Determine size status
    if (contentSize > config.maxChunkSize) {
      sizeStatus = 'oversized';
      issues.push(`Chunk exceeds max size: ${contentSize} > ${config.maxChunkSize}`);
    } else if (contentSize < config.minChunkSize) {
      sizeStatus = 'undersized';
      issues.push(`Chunk below min size: ${contentSize} < ${config.minChunkSize}`);
    } else {
      sizeStatus = 'normal';
    }

    // Context quality (0.9 if has context, 0.5 otherwise)
    const contextQuality = hasContext ? 0.9 : 0.5;

    // Completeness based on size relative to target
    const targetRatio = contentSize / config.targetChunkSize;
    const completeness = Math.min(1, Math.max(0, 1 - Math.abs(targetRatio - 1) * 0.3));

    // Table integrity
    const tableIntegrity = tableCount > 0 ? 0.8 : 1.0;

    return {
      chunkId,
      sizeStatus,
      contentCompleteness: completeness,
      contextQuality,
      tableIntegrity,
      issues,
    };
  }

  /**
   * Create quality report
   */
  static create(
    documentId: string,
    metricsArray: ChunkQualityMetrics[],
    config: {
      minChunkSize: number;
      maxChunkSize: number;
      targetChunkSize: number;
    }
  ): ChunkQualityReport {
    if (!metricsArray || metricsArray.length === 0) {
      throw new Error('metricsArray cannot be empty');
    }

    this.reportCounter++;
    const reportId = `report_${String(this.reportCounter).padStart(4, '0')}`;

    // Calculate statistics
    const sizes = metricsArray.map((m) => {
      const match = m.chunkId.match(/chunk_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / sizes.length;
    const stdDev = Math.sqrt(variance);

    const sorted = [...sizes].sort((a, b) => a - b);
    const median = sizes.length % 2 === 0
      ? (sorted[sizes.length / 2 - 1] + sorted[sizes.length / 2]) / 2
      : sorted[Math.floor(sizes.length / 2)];

    // Count distributions
    const oversized = metricsArray.filter((m) => m.sizeStatus === 'oversized').length;
    const normal = metricsArray.filter((m) => m.sizeStatus === 'normal').length;
    const undersized = metricsArray.filter((m) => m.sizeStatus === 'undersized').length;

    // Overall quality score
    const avgCompleteness = metricsArray.reduce((sum, m) => sum + m.contentCompleteness, 0) / metricsArray.length;
    const avgContextQuality = metricsArray.reduce((sum, m) => sum + m.contextQuality, 0) / metricsArray.length;
    const avgTableIntegrity = metricsArray.reduce((sum, m) => sum + m.tableIntegrity, 0) / metricsArray.length;
    const qualityScore = (avgCompleteness + avgContextQuality + avgTableIntegrity) / 3;

    // Generate recommendations
    const recommendations: string[] = [];
    if (oversized > 0) {
      recommendations.push(`${oversized} chunks are oversized. Consider increasing max chunk size or more aggressive splitting.`);
    }
    if (undersized > metricsArray.length * 0.3) {
      recommendations.push(`More than 30% of chunks are undersized. Consider merging smaller chunks.`);
    }
    if (qualityScore < 0.7) {
      recommendations.push('Overall quality score is below 0.7. Review chunking strategy.');
    }

    return {
      reportId,
      documentId,
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        totalChunks: metricsArray.length,
        analysisDurationMs: 0,
      },
      configuration: config,
      statistics: {
        averageChunkSize: mean,
        medianChunkSize: median,
        minChunkSize: Math.min(...sizes),
        maxChunkSize: Math.max(...sizes),
        standardDeviation: stdDev,
      },
      distribution: {
        oversizedChunks: oversized,
        normalChunks: normal,
        undersizedChunks: undersized,
        tableChunks: 0, // Will be updated separately
        averageTablesPerChunk: 0,
      },
      qualityMetrics: metricsArray,
      overallQualityScore: qualityScore,
      recommendations,
    };
  }

  /**
   * Reset counter for testing
   */
  static reset(): void {
    this.reportCounter = 0;
  }
}
