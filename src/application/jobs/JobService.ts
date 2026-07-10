/**
 * JobService - Orchestrierung asynchroner Job-Verarbeitung
 *
 * Verwaltet Lifecycle von Jobs mit erweiterte Error Handling:
 * - Exponential Backoff für Retries
 * - Fehlerklassifizierung (TRANSIENT vs PERMANENT)
 * - Dead-Letter Queue für persistente Fehler
 * - Error Logging und Monitoring Hooks
 *
 * @version 0.21.0
 * @phase 21
 */

import { injectable } from 'tsyringe';
import { JobRepository } from '@infrastructure/repositories/JobRepository';
import { ExtractionPipeline } from '@application/ExtractionPipeline';
import { JobEntity } from '@infrastructure/database/entities/JobEntity';

// Error Classification
export type ErrorCategory = 'TRANSIENT' | 'PERMANENT' | 'UNKNOWN';

export interface JobCreateRequest {
  documentContent: string;
  ruleSet?: any;
  extractionConfig?: any;
  jobType?: string;
  description?: string;
  userId?: string;
  documentId?: string;
  ipAddress?: string;
}

// Retry Policy Configuration
export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

@injectable()
export class JobService {
  private readonly DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    initialDelayMs: 1000,      // Start with 1 second
    backoffFactor: 2,           // Double each time
    maxDelayMs: 30000,          // Cap at 30 seconds
  };

  constructor(
    private jobRepository: JobRepository,
    private extractionPipeline: ExtractionPipeline,
  ) {}

  /**
   * Erstellt einen neuen Job und startet Verarbeitung asynchron
   */
  async createJob(request: JobCreateRequest): Promise<JobEntity> {
    console.log('[JobService] Creating new job...');

    // Create job with status 'queued'
    const job = await this.jobRepository.create(
      {
        documentContent: request.documentContent,
        ruleSet: request.ruleSet,
        extractionConfig: request.extractionConfig,
      },
      {
        userId: request.userId,
        documentId: request.documentId,
        jobType: request.jobType || 'extraction',
        description: request.description,
        ipAddress: request.ipAddress,
      }
    );

    console.log(`[JobService] Job created: ${job.id} (status: ${job.status})`);

    // Start async processing (don't await - let it run in background)
    this.processJobAsync(job.id).catch(err => {
      console.error(`[JobService] Error processing job ${job.id}:`, err);
    });

    return job;
  }

  /**
   * Holt Job-Details
   */
  async getJob(jobId: string): Promise<JobEntity | null> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      console.warn(`[JobService] Job not found: ${jobId}`);
      return null;
    }
    return job;
  }

  /**
   * Holt Job-Ergebnis
   */
  async getJobResult(jobId: string): Promise<any> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'queued' || job.status === 'running') {
      return {
        status: job.status,
        message: `Job is ${job.status}`,
        requestedAt: job.requestedAt,
        startedAt: job.startedAt,
      };
    }

    if (job.status === 'failed') {
      return {
        status: 'failed',
        error: job.errorMessage,
        details: job.errorDetails,
        duration: job.duration,
      };
    }

    if (job.status === 'completed') {
      return {
        status: 'completed',
        result: job.resultData,
        duration: job.duration,
        completedAt: job.completedAt,
      };
    }

    // cancelled
    return {
      status: 'cancelled',
      completedAt: job.completedAt,
    };
  }

  /**
   * Bricht einen Job ab
   */
  async cancelJob(jobId: string): Promise<JobEntity> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }

    return await this.jobRepository.cancel(jobId);
  }

  /**
   * Asynchrone Job-Verarbeitung mit Fehlerklassifizierung und Exponential Backoff
   * @private
   */
  private async processJobAsync(jobId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get job
      let job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update status to 'running'
      job = await this.jobRepository.start(jobId);
      console.log(`[JobService] Job started: ${jobId}`);

      // Extract data from input
      const { documentContent, extractionConfig } = job.jobInput;

      // Call extraction pipeline
      console.log(`[JobService] Processing extraction for job ${jobId}...`);
      const extractionResult = await this.extractionPipeline.execute(
        documentContent,
        extractionConfig?.schemaName || 'invoice'
      );

      const duration = Date.now() - startTime;

      // Mark as completed
      job = await this.jobRepository.complete(
        jobId,
        {
          pipelineId: extractionResult.pipelineId,
          extraction: extractionResult.extraction,
          quality: extractionResult.quality,
          hallucination: extractionResult.hallucination,
          status: extractionResult.status,
          steps: extractionResult.steps.length,
        },
        duration
      );

      console.log(`[JobService] Job completed: ${jobId} (duration: ${duration}ms)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || String(error);
      const errorCategory = this.categorizeError(error);
      const errorDetails = {
        stack: error.stack,
        category: errorCategory,
        timestamp: new Date().toISOString(),
      };

      console.error(`[JobService] Job failed: ${jobId} - ${errorMessage} (category: ${errorCategory})`);

      // Get current job state
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        console.error(`[JobService] Cannot update job ${jobId} - not found`);
        return;
      }

      // Decide: retry or dead-letter?
      if (errorCategory === 'TRANSIENT' && job.retryCount < job.maxRetries) {
        // Schedule automatic retry with exponential backoff
        await this.scheduleRetryWithBackoff(jobId, job.retryCount + 1, job.maxRetries);
      } else {
        // Permanent error or max retries exceeded -> Dead-Letter Queue
        await this.moveToDeadLetterQueue(jobId, errorMessage, errorDetails);
      }
    }
  }

  /**
   * Kategorisiert Fehler als TRANSIENT, PERMANENT, oder UNKNOWN
   * @private
   */
  private categorizeError(error: any): ErrorCategory {
    const errorMessage = error.message || String(error);
    const errorString = errorMessage.toLowerCase();

    // TRANSIENT ERRORS (wiederholen)
    const transientPatterns = [
      'timeout',
      'econnrefused',
      'econnreset',
      'enetunreach',
      'temporary failure',
      'unavailable',
      'temporarily',
      'connection',
      'network',
      'EHOSTUNREACH',
      'ENETRESET',
    ];

    if (transientPatterns.some(pattern => errorString.includes(pattern))) {
      return 'TRANSIENT';
    }

    // PERMANENT ERRORS (nicht wiederholen)
    const permanentPatterns = [
      'validation',
      'invalid',
      'malformed',
      'syntax',
      'not found',
      'unauthorized',
      'forbidden',
      'bad request',
      'unsupported',
    ];

    if (permanentPatterns.some(pattern => errorString.includes(pattern))) {
      return 'PERMANENT';
    }

    return 'UNKNOWN';
  }

  /**
   * Plant einen automatischen Retry mit Exponential Backoff
   * @private
   */
  private async scheduleRetryWithBackoff(jobId: string, retryCount: number, maxRetries: number): Promise<void> {
    const policy = this.DEFAULT_RETRY_POLICY;
    const delayMs = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffFactor, retryCount - 1),
      policy.maxDelayMs
    );

    console.log(`[JobService] Scheduling retry for job ${jobId} in ${delayMs}ms (attempt ${retryCount}/${maxRetries})`);

    // Update job metadata with retry schedule
    await this.jobRepository.updateStatus(jobId, 'queued', {
      retryCount,
      errorMessage: null,
      errorDetails: {
        scheduledRetryAt: new Date(Date.now() + delayMs).toISOString(),
        delayMs,
        retryAttempt: retryCount,
      },
    });

    // Schedule retry
    setTimeout(async () => {
      console.log(`[JobService] Executing scheduled retry for job ${jobId}`);
      this.processJobAsync(jobId).catch(err => {
        console.error(`[JobService] Error processing retried job ${jobId}:`, err);
      });
    }, delayMs);
  }

  /**
   * Moves job to Dead-Letter Queue (persistente Fehler)
   * @private
   */
  private async moveToDeadLetterQueue(jobId: string, errorMessage: string, errorDetails: any): Promise<void> {
    console.warn(`[JobService] Moving job ${jobId} to dead-letter queue: ${errorMessage}`);

    // Mark as failed (but keep in DB for manual inspection)
    await this.jobRepository.fail(jobId, errorMessage, errorDetails, 0);

    // Log to monitoring system (you can hook this up to your monitoring)
    this.logDeadLetterEvent({
      jobId,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs dead-letter events for monitoring
   * @private
   */
  private logDeadLetterEvent(event: any): void {
    console.error(`[DEAD_LETTER_QUEUE] ${JSON.stringify(event)}`);
    // TODO: Integrate with monitoring system (e.g., Datadog, New Relic, etc.)
  }

  /**
   * Retries fehlgeschlagene Jobs mit Exponential Backoff
   */
  async retryFailedJob(jobId: string, immediate: boolean = false): Promise<JobEntity> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'failed') {
      throw new Error(`Can only retry failed jobs, current status: ${job.status}`);
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error(`Max retries exceeded (${job.maxRetries})`);
    }

    const nextRetryCount = job.retryCount + 1;

    if (immediate) {
      // Immediate retry (manual retry)
      const updatedJob = await this.jobRepository.updateStatus(jobId, 'queued', {
        errorMessage: null,
        errorDetails: null,
        retryCount: nextRetryCount,
      });

      console.log(`[JobService] Manually retrying job ${jobId} (attempt ${nextRetryCount}/${job.maxRetries})`);

      // Start processing immediately
      this.processJobAsync(jobId).catch(err => {
        console.error(`[JobService] Error processing retried job ${jobId}:`, err);
      });

      return updatedJob;
    } else {
      // Automatic retry with backoff (scheduled)
      await this.scheduleRetryWithBackoff(jobId, nextRetryCount, job.maxRetries);
      return job;
    }
  }

  /**
   * Holt Jobs aus Dead-Letter Queue
   */
  async getDeadLetterQueue(limit: number = 50, offset: number = 0): Promise<any> {
    return await this.jobRepository.query({
      status: 'failed',
      retryCount: { $gte: 3 }, // Filter: max retries exceeded
      limit,
      offset,
    });
  }

  /**
   * Holt Job aus Dead-Letter Queue und analysiert Fehler
   */
  async analyzeDeadLetterJob(jobId: string): Promise<any> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'failed' || job.retryCount < job.maxRetries) {
      throw new Error(`Job ${jobId} is not in dead-letter queue`);
    }

    return {
      jobId: job.id,
      status: job.status,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      errorMessage: job.errorMessage,
      errorDetails: job.errorDetails,
      duration: job.duration,
      jobType: job.jobType,
      description: job.description,
      failedAt: job.completedAt,
      createdAt: job.createdAt,
      userId: job.userId,
    };
  }

  /**
   * Holt Job-Statistiken
   */
  async getStatistics(): Promise<any> {
    return await this.jobRepository.getStatistics();
  }

  /**
   * Abfrage von Jobs
   */
  async queryJobs(filter: any): Promise<any> {
    return await this.jobRepository.query(filter);
  }

  /**
   * Exportiert Jobs
   */
  async exportJobs(format: 'json' | 'csv', filter: any): Promise<any> {
    if (format === 'json') {
      return await this.jobRepository.exportAsJson(filter);
    } else {
      const csv = await this.jobRepository.exportAsCsv(filter);
      return {
        format: 'csv',
        data: csv,
        filename: `jobs-export-${Date.now()}.csv`,
      };
    }
  }

  /**
   * Aufräumen alte Jobs
   */
  async cleanupOldJobs(daysToRetain: number): Promise<number> {
    if (daysToRetain < 1 || daysToRetain > 365) {
      throw new Error('Days to retain must be between 1 and 365');
    }
    const removed = await this.jobRepository.clearOldJobs(daysToRetain);
    console.log(`[JobService] Cleaned up ${removed} old jobs`);
    return removed;
  }
}
