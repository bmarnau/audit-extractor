/**
 * Backup Type Definitions
 */

export interface BackupMetadata {
  backupId: string;
  backupName: string;
  documentCount: number;
  totalSize: number;
  createdAt: string;
  createdBy?: string;
  reason?: string;
  checksum?: string;
  retentionDays?: number;
}

export interface RestoreRequest {
  backupId: string;
  targetLocation?: string;
  overwrite?: boolean;
  items?: string[];
  verifyChecksums?: boolean;
  reason?: string;
  restoreBy?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredItemsCount: number;
  restoredSize: number;
  failedItems: string[];
  warnings: string[];
  duration: number;
  restoredAt: string;
}

export interface BackupStatistics {
  totalBackups: number;
  totalSize: number;
  oldestBackup: string;
  newestBackup: string;
  averageBackupSize: number;
  retentionDaysAverage: number;
}
