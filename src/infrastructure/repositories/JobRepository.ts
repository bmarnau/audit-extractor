/**
 * JobRepository - Data Access Layer für Job Verarbeitung
 *
 * Verwaltet Persistierung und Abfragen von asynchronen Jobs
 *
 * @version 0.21.0
 * @phase 21
 */

import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { JobEntity, JobStatus } from '../database/entities/JobEntity';
import { v4 as uuidv4 } from 'uuid';

export interface JobFilter {
  status?: JobStatus;
  userId?: string;
  documentId?: string;
  jobType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface JobQueryResult {
  jobs: JobEntity[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

@injectable()
export class JobRepository {
  private getRepository(): Repository<JobEntity> {
    return AppDataSource.getRepository(JobEntity);
  }

  /**
   * Erstellt einen neuen Job
   */
  async create(jobInput: any, metadata?: {
    userId?: string;
    documentId?: string;
    jobType?: string;
    description?: string;
    ipAddress?: string;
  }): Promise<JobEntity> {
    const jobId = uuidv4();
    const now = new Date();

    const job = this.getRepository().create({
      id: jobId,
      status: 'queued',
      requestedAt: now,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      errorDetails: null,
      jobInput,
      resultData: null,
      userId: metadata?.userId || null,
      documentId: metadata?.documentId || null,
      jobType: metadata?.jobType || 'extraction',
      description: metadata?.description || null,
      duration: 0,
      retryCount: 0,
      maxRetries: 3,
      ipAddress: metadata?.ipAddress || null,
      metadata: {},
    });

    return await this.getRepository().save(job);
  }

  /**
   * Findet einen Job nach ID
   */
  async findById(jobId: string): Promise<JobEntity | null> {
    return await this.getRepository().findOne({
      where: { id: jobId }
    });
  }

  /**
   * Aktualisiert Job-Status
   */
  async updateStatus(jobId: string, status: JobStatus, updates?: {
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
    errorDetails?: any;
    duration?: number;
    resultData?: any;
    retryCount?: number;
  }): Promise<JobEntity> {
    const job = await this.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update status
    job.status = status;

    // Apply additional updates
    if (updates) {
      if (updates.startedAt !== undefined) job.startedAt = updates.startedAt;
      if (updates.completedAt !== undefined) job.completedAt = updates.completedAt;
      if (updates.errorMessage !== undefined) job.errorMessage = updates.errorMessage;
      if (updates.errorDetails !== undefined) job.errorDetails = updates.errorDetails;
      if (updates.duration !== undefined) job.duration = updates.duration;
      if (updates.resultData !== undefined) job.resultData = updates.resultData;
      if (updates.retryCount !== undefined) job.retryCount = updates.retryCount;
    }

    return await this.getRepository().save(job);
  }

  /**
   * Startet einen Job (Status: queued → running)
   */
  async start(jobId: string): Promise<JobEntity> {
    return await this.updateStatus(jobId, 'running', {
      startedAt: new Date(),
    });
  }

  /**
   * Markiert Job als erfolgreich abgeschlossen
   */
  async complete(jobId: string, resultData: any, duration: number): Promise<JobEntity> {
    return await this.updateStatus(jobId, 'completed', {
      completedAt: new Date(),
      resultData,
      duration,
    });
  }

  /**
   * Markiert Job als fehlgeschlagen
   */
  async fail(jobId: string, errorMessage: string, errorDetails?: any, duration?: number): Promise<JobEntity> {
    return await this.updateStatus(jobId, 'failed', {
      completedAt: new Date(),
      errorMessage,
      errorDetails,
      duration: duration || 0,
    });
  }

  /**
   * Markiert Job als abgebrochen
   */
  async cancel(jobId: string): Promise<JobEntity> {
    return await this.updateStatus(jobId, 'cancelled', {
      completedAt: new Date(),
    });
  }

  /**
   * Abfrage von Jobs mit Filtern
   */
  async query(filter: JobFilter): Promise<JobQueryResult> {
    let query = this.getRepository().createQueryBuilder('job');

    // Status filter
    if (filter.status) {
      query = query.where('job.status = :status', { status: filter.status });
    }

    // User filter
    if (filter.userId) {
      query = query.andWhere('job.userId = :userId', { userId: filter.userId });
    }

    // Document filter
    if (filter.documentId) {
      query = query.andWhere('job.documentId = :documentId', { documentId: filter.documentId });
    }

    // Job type filter
    if (filter.jobType) {
      query = query.andWhere('job.jobType = :jobType', { jobType: filter.jobType });
    }

    // Date range filter
    if (filter.startDate) {
      query = query.andWhere('job.requestedAt >= :startDate', { startDate: filter.startDate });
    }
    if (filter.endDate) {
      query = query.andWhere('job.requestedAt <= :endDate', { endDate: filter.endDate });
    }

    // Count total
    const total = await query.getCount();

    // Order and paginate
    query = query.orderBy('job.requestedAt', 'DESC');
    
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    
    const jobs = await query
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      jobs,
      total,
      limit,
      offset,
      hasMore: offset + jobs.length < total,
    };
  }

  /**
   * Holt alle Jobs mit bestimmtem Status
   */
  async findByStatus(status: JobStatus): Promise<JobEntity[]> {
    return await this.getRepository().find({
      where: { status },
      order: { requestedAt: 'ASC' },
    });
  }

  /**
   * Löscht einen Job
   */
  async delete(jobId: string): Promise<boolean> {
    const result = await this.getRepository().delete(jobId);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Holt Job-Statistiken
   */
  async getStatistics(): Promise<{
    totalJobs: number;
    byStatus: Record<JobStatus, number>;
    averageDuration: number;
    failureRate: number;
    lastHour: number;
  }> {
    const jobs = await this.getRepository().find();
    
    const byStatus: Record<JobStatus, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    jobs.forEach(job => {
      byStatus[job.status]++;
    });

    const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed');
    const averageDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => sum + j.duration, 0) / completedJobs.length
      : 0;

    const failedJobs = jobs.filter(j => j.status === 'failed');
    const failureRate = jobs.length > 0 ? (failedJobs.length / jobs.length) * 100 : 0;

    // Last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const lastHour = jobs.filter(j => j.requestedAt > oneHourAgo).length;

    return {
      totalJobs: jobs.length,
      byStatus,
      averageDuration: Math.round(averageDuration),
      failureRate: Math.round(failureRate * 100) / 100,
      lastHour,
    };
  }

  /**
   * Exportiert Jobs als JSON
   */
  async exportAsJson(filter: JobFilter): Promise<any> {
    const result = await this.query(filter);
    return {
      exported: true,
      timestamp: new Date().toISOString(),
      filter,
      jobs: result.jobs,
      total: result.total,
    };
  }

  /**
   * Exportiert Jobs als CSV
   */
  async exportAsCsv(filter: JobFilter): Promise<string> {
    const result = await this.query({ ...filter, limit: 10000, offset: 0 });

    const headers = [
      'Job ID',
      'Status',
      'Job Type',
      'Requested At',
      'Started At',
      'Completed At',
      'Duration (ms)',
      'User ID',
      'Document ID',
      'Error Message',
    ];

    const rows = result.jobs.map(job => [
      job.id,
      job.status,
      job.jobType || '',
      job.requestedAt.toISOString(),
      job.startedAt?.toISOString() || '',
      job.completedAt?.toISOString() || '',
      job.duration,
      job.userId || '',
      job.documentId || '',
      job.errorMessage || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Löscht alte Jobs (Retention Policy)
   */
  async clearOldJobs(daysToRetain: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToRetain);

    const result = await this.getRepository().delete({
      completedAt: () => `"completedAt" < '${cutoffDate.toISOString()}'`,
    } as any);

    return result.affected || 0;
  }
}
