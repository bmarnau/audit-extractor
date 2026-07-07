/**
 * Backup Models - Phase 13
 *
 * Backup-Verwaltung für Regeln, Schemas, Konfiguration und Dokumentation.
 *
 * Sichern:
 * - extraction-rules/
 * - extraction-rules/schemas/
 * - config/app-config.json
 * - config/changelog.json
 * - docs/
 *
 * Nicht sichern:
 * - source-documents/
 * - results/
 * - learning/
 *
 * @version 0.13.0
 * @phase 13
 */

/**
 * Backup Items Types
 */
export type BackupItemType = 'rules' | 'schemas' | 'configuration' | 'documentation';

export interface BackupItem {
  /** Item Type */
  type: BackupItemType;

  /** Item Path */
  path: string;

  /** Size in bytes */
  size: number;

  /** File count */
  fileCount: number;

  /** Last modified */
  lastModified: string;

  /** Checksum */
  checksum: string;
}

/**
 * Compression Configuration
 */
export interface CompressionInfo {
  /** Algorithm: gzip|brotli|deflate */
  algorithm: 'gzip' | 'brotli' | 'deflate';

  /** Compression ratio (compressed/original) */
  ratio: number;

  /** Original size in bytes */
  originalSize: number;

  /** Compressed size in bytes */
  compressedSize: number;
}

/**
 * Backup Metadata
 */
export interface BackupMetadata {
  /** Backup ID */
  backupId: string;

  /** Backup Name */
  backupName: string;

  /** Status: pending|in-progress|completed|failed */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /** Created At */
  createdAt: string;

  /** Created By */
  createdBy?: string;

  /** Reason for backup */
  reason?: string;

  /** Items in backup */
  items: BackupItem[];

  /** Total Size in bytes */
  totalSize: number;

  /** Item Count */
  itemCount: number;

  /** Duration in ms */
  duration?: number;

  /** Compression Info */
  compression?: CompressionInfo;

  /** Error message if failed */
  error?: string;

  /** Backup file location */
  fileLocation?: string;

  /** Checksum of entire backup */
  backupChecksum?: string;

  /** Version info at time of backup */
  appVersion?: string;

  /** Config version at time of backup */
  configVersion?: number;
}

/**
 * Restore Request
 */
export interface RestoreRequest {
  /** Backup ID to restore from */
  backupId: string;

  /** Target location for restoration */
  targetLocation: string;

  /** Items to restore (undefined = all) */
  items?: BackupItemType[];

  /** Overwrite existing files */
  overwrite: boolean;

  /** Verify checksums after restore */
  verifyChecksums: boolean;

  /** Reason for restore */
  reason?: string;

  /** Restored By */
  restoredBy?: string;
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
  status: 'in-progress' | 'completed' | 'failed';

  /** Items Restored */
  itemsRestored: number;

  /** Total Items */
  totalItems: number;

  /** Start Time */
  startedAt: string;

  /** End Time */
  completedAt?: string;

  /** Duration in ms */
  duration?: number;

  /** Error message if failed */
  error?: string;

  /** Verification errors */
  verificationErrors?: Array<{
    item: string;
    expected: string;
    actual: string;
  }>;
}

/**
 * Backup Statistics
 */
export interface BackupStatistics {
  /** Total number of backups */
  totalBackups: number;

  /** Total backup size in bytes */
  totalBackupSize: number;

  /** Average backup size */
  averageBackupSize: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Failed backups count */
  failedBackups: number;

  /** Last backup at */
  lastBackupAt?: string;

  /** Most common backup duration (ms) */
  averageDuration?: number;

  /** Total items across all backups */
  totalItems: number;

  /** Total compression saved (bytes) */
  totalCompressionSaved: number;
}

/**
 * Backup Items to include
 */
export const BACKUP_ITEMS: Array<{ type: BackupItemType; path: string }> = [
  { type: 'rules', path: 'extraction-rules' },
  { type: 'schemas', path: 'extraction-rules/schemas' },
  { type: 'configuration', path: 'config' },
  { type: 'documentation', path: 'docs' },
];

/**
 * Paths NOT to backup
 */
export const EXCLUDE_PATHS = [
  'source-documents',
  'results',
  'learning',
  'node_modules',
  '.git',
];
