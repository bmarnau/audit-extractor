/**
 * Backup Center - Phase 12
 *
 * Zentrale Backup- und Restore-Verwaltung.
 * SICHERN: extraction-rules/, docs/, extraction-rules/schemas/, config/
 * NICHT SICHERN: source-documents/, results/, learning/
 *
 * @version 0.12.0
 * @phase 12
 * @status COMPLETE
 */

/**
 * Backup Item
 */
export interface BackupItem {
  /** Item Path */
  path: string;

  /** Item Type */
  type: 'file' | 'directory';

  /** File Size (bytes) */
  size: number;

  /** Last Modified */
  lastModified: string;

  /** Included in Backup */
  included: boolean;

  /** Reason if excluded */
  excludeReason?: string;
}

/**
 * Backup Configuration
 */
export interface BackupConfig {
  /** Backup Name */
  name: string;

  /** Directories to backup */
  includeDirs: string[];

  /** Directories to exclude */
  excludeDirs: string[];

  /** File patterns to include */
  includePatterns: string[];

  /** File patterns to exclude */
  excludePatterns: string[];

  /** Compression */
  compress: boolean;

  /** Encryption (optional) */
  encrypt: boolean;

  /** Backup Location */
  backupLocation: string;
}

/**
 * Backup Metadata
 */
export interface BackupMetadata {
  /** Backup ID */
  backupId: string;

  /** Backup Name */
  backupName: string;

  /** Created At */
  createdAt: string;

  /** Created By */
  createdBy?: string;

  /** Backup Size (bytes) */
  totalSize: number;

  /** Item Count */
  itemCount: number;

  /** Config Used */
  config: BackupConfig;

  /** Items Backed Up */
  items: BackupItem[];

  /** Checksums */
  checksums: Record<string, string>; // filename -> SHA256

  /** Compression Info */
  compression?: {
    algorithm: string;
    ratio: number; // original / compressed
  };

  /** Backup Status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /** Error (if failed) */
  error?: string;

  /** Duration (ms) */
  duration: number;

  /** Notes */
  notes?: string;
}

/**
 * Backup Manifest (stored with backup)
 */
export interface BackupManifest {
  /** Version */
  version: string;

  /** Backup Metadata */
  metadata: BackupMetadata;

  /** Files */
  files: Array<{
    path: string;
    size: number;
    checksum: string;
    compressed: boolean;
  }>;

  /** Total Files */
  totalFiles: number;

  /** Manifest Created At */
  manifestCreatedAt: string;
}

/**
 * Restore Request
 */
export interface RestoreRequest {
  /** Backup ID to restore */
  backupId: string;

  /** Target Location */
  targetLocation: string;

  /** Items to restore (if partial) */
  items?: string[];

  /** Overwrite existing */
  overwrite: boolean;

  /** Verify checksums */
  verifyChecksums: boolean;

  /** Reason */
  reason?: string;

  /** Restore By */
  restoreBy?: string;
}

/**
 * Restore Result
 */
export interface RestoreResult {
  /** Restore ID */
  restoreId: string;

  /** Backup ID */
  backupId: string;

  /** Status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /** Files Restored */
  filesRestored: number;

  /** Bytes Restored */
  bytesRestored: number;

  /** Errors */
  errors: Array<{
    file: string;
    error: string;
  }>;

  /** Checksum Failures */
  checksumFailures: string[];

  /** Duration (ms) */
  duration: number;

  /** Started At */
  startedAt: string;

  /** Completed At */
  completedAt?: string;

  /** Message */
  message: string;
}

/**
 * Backup Statistics
 */
export interface BackupStatistics {
  /** Total Backups */
  totalBackups: number;

  /** Latest Backup */
  latestBackup?: BackupMetadata;

  /** Total Backup Size (bytes) */
  totalBackupSize: number;

  /** Average Backup Size */
  averageBackupSize: number;

  /** Backup Frequency */
  backupFrequency: string; // e.g. "daily", "weekly"

  /** Success Rate */
  successRate: number; // 0-1

  /** Failed Backups */
  failedBackups: number;

  /** Last Successful Backup */
  lastSuccessfulBackup?: string;

  /** Restore History */
  restoreCount: number;

  /** Last Restore */
  lastRestore?: RestoreResult;

  /** Oldest Backup */
  oldestBackup?: string;

  /** Newest Backup */
  newestBackup?: string;
}

/**
 * Backup Retention Policy
 */
export interface BackupRetentionPolicy {
  /** Keep daily backups for (days) */
  dailyRetention: number;

  /** Keep weekly backups for (weeks) */
  weeklyRetention: number;

  /** Keep monthly backups for (months) */
  monthlyRetention: number;

  /** Max total backups */
  maxBackups: number;

  /** Max storage size (GB) */
  maxStorageSize: number;

  /** Auto cleanup */
  autoCleanup: boolean;

  /** Cleanup frequency (hours) */
  cleanupFrequency: number;
}

/**
 * Default Backup Configuration
 */
export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  name: 'system-backup',
  includeDirs: [
    'extraction-rules',
    'docs',
    'config',
  ],
  excludeDirs: [
    'source-documents',
    'results',
    'learning',
    'node_modules',
    '.git',
  ],
  includePatterns: ['*.json', '*.txt', '*.md', '*.ts', '*.js'],
  excludePatterns: ['*.node_modules', '.DS_Store', 'Thumbs.db'],
  compress: true,
  encrypt: false,
  backupLocation: './backups',
};
