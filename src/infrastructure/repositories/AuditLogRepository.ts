import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { AuditLogEntity } from '../database/entities/AuditLogEntity';
import { v4 as uuid } from 'uuid';

/**
 * AuditLogRepository - Data Access Layer for system logs
 * Phase 20: Log-Viewer Backend
 */
export class AuditLogRepository {
  private repository: Repository<AuditLogEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLogEntity);
  }

  /**
   * Log an event
   */
  async log(data: {
    level: 'debug' | 'info' | 'warn' | 'error';
    source: string;
    message: string;
    context?: Record<string, unknown>;
    stackTrace?: string;
    documentId?: string;
    field?: string;
    duration?: number;
    requestId?: string;
    userId?: string;
  }): Promise<AuditLogEntity> {
    const logEntry = this.repository.create({
      id: uuid(),
      timestamp: new Date(),
      level: data.level,
      source: data.source as any,
      message: data.message,
      context: data.context,
      stackTrace: data.stackTrace,
      documentId: data.documentId,
      field: data.field,
      duration: data.duration,
      requestId: data.requestId,
      userId: data.userId,
      searchText: `${data.message} ${data.field || ''} ${JSON.stringify(data.context || {})}`.toLowerCase(),
    });

    return await this.repository.save(logEntry);
  }

  /**
   * Query logs with filtering
   */
  async query(filter: {
    limit?: number;
    offset?: number;
    levels?: string[];
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
    documentId?: string;
    field?: string;
  }): Promise<{ logs: AuditLogEntity[]; total: number }> {
    let query = this.repository.createQueryBuilder('log');

    if (filter.levels && filter.levels.length > 0) {
      query = query.andWhere('log.level IN (:...levels)', { levels: filter.levels });
    }

    if (filter.sources && filter.sources.length > 0) {
      query = query.andWhere('log.source IN (:...sources)', { sources: filter.sources });
    }

    if (filter.startDate) {
      query = query.andWhere('log.timestamp >= :startDate', { startDate: filter.startDate });
    }

    if (filter.endDate) {
      query = query.andWhere('log.timestamp <= :endDate', { endDate: filter.endDate });
    }

    if (filter.searchQuery) {
      query = query.andWhere('log.searchText ILIKE :search', { 
        search: `%${filter.searchQuery.toLowerCase()}%` 
      });
    }

    if (filter.documentId) {
      query = query.andWhere('log.documentId = :documentId', { documentId: filter.documentId });
    }

    if (filter.field) {
      query = query.andWhere('log.field = :field', { field: filter.field });
    }

    const total = await query.getCount();

    const logs = await query
      .orderBy('log.timestamp', 'DESC')
      .limit(filter.limit || 100)
      .offset(filter.offset || 0)
      .getMany();

    return { logs, total };
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalEntries: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
    errorCount: number;
    warningCount: number;
    last24Hours: number;
  }> {
    const total = await this.repository.count();

    const byLevel = await this.repository
      .createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.level')
      .getRawMany();

    const bySource = await this.repository
      .createQueryBuilder('log')
      .select('log.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.source')
      .getRawMany();

    const errorCount = await this.repository.count({ where: { level: 'error' } });
    const warningCount = await this.repository.count({ where: { level: 'warn' } });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24Hours = await this.repository.count({
      where: { timestamp: oneDayAgo } as any,
    });

    return {
      totalEntries: total,
      byLevel: byLevel.reduce((acc: any, item: any) => {
        acc[item.level] = parseInt(item.count, 10);
        return acc;
      }, {}),
      bySource: bySource.reduce((acc: any, item: any) => {
        acc[item.source] = parseInt(item.count, 10);
        return acc;
      }, {}),
      errorCount,
      warningCount,
      last24Hours,
    };
  }

  /**
   * Export logs as JSON
   */
  async exportAsJson(filter: {
    limit?: number;
    levels?: string[];
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const { logs } = await this.query({
      limit: filter.limit || 10000,
      levels: filter.levels,
      sources: filter.sources,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  async exportAsCsv(filter: {
    limit?: number;
    levels?: string[];
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const { logs } = await this.query({
      limit: filter.limit || 10000,
      levels: filter.levels,
      sources: filter.sources,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });

    if (logs.length === 0) {
      return 'timestamp,level,source,message,documentId,field,duration\n';
    }

    const headers = ['timestamp', 'level', 'source', 'message', 'documentId', 'field', 'duration'];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.level,
      log.source,
      `"${(log.message || '').replace(/"/g, '""')}"`,
      log.documentId || '',
      log.field || '',
      log.duration || '',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Clear old logs (retention policy)
   */
  async clearOldLogs(daysToRetain: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToRetain * 24 * 60 * 60 * 1000);
    const result = await this.repository.delete({
      timestamp: cutoffDate as any,
    });
    return result.affected || 0;
  }
}
