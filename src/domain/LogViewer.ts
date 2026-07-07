/**
 * Log Viewer - Phase 12
 *
 * Zentrale Log-Verwaltung mit Volltextsuche, Filter, Zeitbereich, Download.
 * Quellen: Parser, LLM, Validator, API, System Logs
 *
 * @version 0.12.0
 * @phase 12
 * @status COMPLETE
 */

/**
 * Log Entry
 */
export interface LogEntry {
  /** Log ID */
  id: string;

  /** Timestamp */
  timestamp: string;

  /** Log Source */
  source: 'parser' | 'llm' | 'validator' | 'api' | 'system';

  /** Log Level */
  level: 'debug' | 'info' | 'warn' | 'error';

  /** Message */
  message: string;

  /** Context Data */
  context?: Record<string, unknown>;

  /** Stack Trace (für Errors) */
  stackTrace?: string;

  /** Request/Response Data */
  data?: {
    request?: unknown;
    response?: unknown;
  };

  /** Duration (ms) */
  duration?: number;

  /** Associated Document ID */
  documentId?: string;

  /** Associated Field */
  field?: string;

  /** Severity Score (0-1) */
  severity: number;

  /** Searchable Text */
  searchText: string;
}

/**
 * Log Filter
 */
export interface LogFilter {
  /** Search Query */
  query?: string;

  /** Source Filter */
  sources?: ('parser' | 'llm' | 'validator' | 'api' | 'system')[];

  /** Level Filter */
  levels?: ('debug' | 'info' | 'warn' | 'error')[];

  /** Time Range */
  timeRange?: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
  };

  /** Document Filter */
  documentId?: string;

  /** Field Filter */
  field?: string;

  /** Severity Min */
  minSeverity?: number;

  /** Limit */
  limit?: number;

  /** Offset */
  offset?: number;
}

/**
 * Log Search Result
 */
export interface LogSearchResult {
  /** Results */
  logs: LogEntry[];

  /** Total Count */
  totalCount: number;

  /** Has More */
  hasMore: boolean;

  /** Search Duration (ms) */
  searchDuration: number;

  /** Query Used */
  queryUsed: LogFilter;
}

/**
 * Log Statistics
 */
export interface LogStatistics {
  /** Total Entries */
  totalEntries: number;

  /** By Source */
  bySource: Record<string, number>;

  /** By Level */
  byLevel: Record<string, number>;

  /** By Severity */
  bySeverity: Array<{
    range: string;
    count: number;
  }>;

  /** Error Count */
  errorCount: number;

  /** Warning Count */
  warningCount: number;

  /** Average Response Time (ms) */
  averageResponseTime: number;

  /** Time Range */
  timeRange: {
    earliest: string;
    latest: string;
  };

  /** Storage Size */
  storageSize: number;

  /** Top Sources */
  topSources: Array<{
    source: string;
    count: number;
  }>;

  /** Top Error Messages */
  topErrors: Array<{
    message: string;
    count: number;
  }>;
}

/**
 * Log Export Format
 */
export interface LogExport {
  /** Format */
  format: 'json' | 'csv' | 'txt';

  /** Filename */
  filename: string;

  /** Content */
  content: string;

  /** Metadata */
  metadata: {
    exportedAt: string;
    entryCount: number;
    filter: LogFilter;
  };
}

/**
 * Log Retention Policy
 */
export interface LogRetentionPolicy {
  /** Debug Retention (days) */
  debugRetention: number;

  /** Info Retention (days) */
  infoRetention: number;

  /** Warning Retention (days) */
  warningRetention: number;

  /** Error Retention (days) */
  errorRetention: number;

  /** Max Storage (MB) */
  maxStorageSize: number;

  /** Auto Cleanup */
  autoCleanup: boolean;

  /** Last Cleanup */
  lastCleanup?: string;
}
