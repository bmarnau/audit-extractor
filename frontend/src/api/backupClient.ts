/**
 * Backup API Client
 * 
 * TypeScript client for Backup API communication with comprehensive error handling
 * 
 * @version 1.0.0
 * @phase 21
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BackupMetadata {
  backupId: string;
  backupName: string;
  status: 'completed' | 'failed' | 'in-progress';
  timestamp: string;
  totalSize: number;
  fileCount: number;
  duration: number;
  reason?: string;
  backupBy?: string;
}

export interface BackupListResponse {
  backups: BackupMetadata[];
  total: number;
  limit: number;
}

export interface BackupStatistics {
  totalBackups: number;
  totalBackupSize: number;
  oldestBackup?: {
    backupId: string;
    timestamp: string;
  };
  newestBackup?: {
    backupId: string;
    timestamp: string;
  };
  averageSize: number;
  successCount: number;
  failureCount: number;
}

export interface BackupStatsResponse {
  statistics: BackupStatistics;
}

export interface RestoreRequest {
  targetLocation: string;
  overwrite?: boolean;
  items?: string[];
  verifyChecksums?: boolean;
  reason?: string;
  restoreBy?: string;
}

export interface RestoreResult {
  restoreId: string;
  status: 'completed' | 'failed' | 'in-progress';
  message: string;
  result?: {
    filesRestored: number;
    totalSize: number;
    duration: number;
    errors?: Array<{ file: string; error: string }>;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

// ============================================================================
// BACKUP CLIENT
// ============================================================================

export class BackupClient {
  private apiClient: AxiosInstance;
  private apiBaseUrl: string;

  constructor() {
    // Get API base URL from environment or default to localhost
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    // Initialize axios instance with timeout and default headers
    this.apiClient = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[BackupClient] API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Create a new backup
   * 
   * @param backupName Name for the backup
   * @param reason Optional reason for backup
   * @param backupBy Optional user/process creating backup
   * @returns BackupMetadata with backupId
   */
  async createBackup(
    backupName: string,
    reason?: string,
    backupBy?: string
  ): Promise<BackupMetadata> {
    try {
      const response = await this.apiClient.post<ApiResponse<{ backup: BackupMetadata }>>(
        '/api/backup/create',
        {
          backupName,
          reason,
          backupBy,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create backup');
      }

      return response.data.data.backup;
    } catch (error) {
      throw this.handleError('Failed to create backup', error);
    }
  }

  /**
   * List all backups with pagination
   * 
   * @param limit Maximum number of backups to retrieve (default: 50, max: 200)
   * @returns Array of BackupMetadata objects
   */
  async listBackups(limit: number = 50): Promise<BackupListResponse> {
    try {
      const response = await this.apiClient.get<ApiResponse<BackupListResponse>>(
        `/api/backup/list?limit=${Math.min(limit, 200)}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to list backups');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError('Failed to list backups', error);
    }
  }

  /**
   * Get statistics about backups
   * 
   * @returns BackupStatistics with aggregate data
   */
  async getStatistics(): Promise<BackupStatistics> {
    try {
      const response = await this.apiClient.get<ApiResponse<BackupStatsResponse>>(
        '/api/backup/stats'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get backup statistics');
      }

      return response.data.data.statistics;
    } catch (error) {
      throw this.handleError('Failed to get backup statistics', error);
    }
  }

  /**
   * Get details about a specific backup
   * 
   * @param backupId ID of the backup
   * @returns BackupMetadata for the specified backup
   */
  async getBackupDetails(backupId: string): Promise<BackupMetadata> {
    try {
      const response = await this.apiClient.get<ApiResponse<BackupMetadata>>(
        `/api/backup/${backupId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get backup details');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(`Failed to get backup details for ${backupId}`, error);
    }
  }

  /**
   * Download a backup file
   * 
   * Downloads the backup as a .tar.gz file. Browser will automatically save it.
   * 
   * @param backupId ID of the backup to download
   */
  async downloadBackup(backupId: string): Promise<void> {
    try {
      const response = await this.apiClient.get(
        `/api/backup/${backupId}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${backupId}.tar.gz`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('[BackupClient] Downloaded backup:', backupId);
    } catch (error) {
      throw this.handleError(`Failed to download backup ${backupId}`, error);
    }
  }

  /**
   * Restore data from a backup
   * 
   * @param backupId ID of the backup to restore from
   * @param restoreRequest Restore options
   * @returns RestoreResult with restoration details
   */
  async restoreFromBackup(
    backupId: string,
    restoreRequest: RestoreRequest
  ): Promise<RestoreResult> {
    try {
      const response = await this.apiClient.post<ApiResponse<RestoreResult>>(
        `/api/backup/${backupId}/restore`,
        restoreRequest
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restore from backup');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(`Failed to restore from backup ${backupId}`, error);
    }
  }

  /**
   * Delete a backup
   * 
   * WARNING: This is permanent and cannot be undone!
   * 
   * @param backupId ID of the backup to delete
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const response = await this.apiClient.delete<ApiResponse<{ message: string }>>(
        `/api/backup/${backupId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete backup');
      }

      console.log('[BackupClient] Deleted backup:', backupId);
    } catch (error) {
      throw this.handleError(`Failed to delete backup ${backupId}`, error);
    }
  }

  /**
   * Poll backup status
   * 
   * Useful for monitoring backup creation or restoration progress
   * 
   * @param backupId ID of the backup
   * @param maxAttempts Maximum polling attempts (default: 60)
   * @param interval Polling interval in milliseconds (default: 5000)
   * @param timeout Overall timeout in milliseconds (default: 5min)
   * @returns Promise<BackupMetadata> when status becomes 'completed' or timeout/max attempts reached
   */
  async pollBackupStatus(
    backupId: string,
    maxAttempts: number = 60,
    interval: number = 5000,
    timeout: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<BackupMetadata> {
    const startTime = Date.now();
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        attempts++;

        // Check timeout
        if (Date.now() - startTime > timeout) {
          return reject(new Error(
            `Polling timeout: Backup status polling exceeded ${timeout}ms`
          ));
        }

        // Check max attempts
        if (attempts > maxAttempts) {
          return reject(new Error(
            `Polling max attempts exceeded: ${maxAttempts} attempts`
          ));
        }

        try {
          const backup = await this.getBackupDetails(backupId);

          console.log(`[BackupClient] Poll ${attempts}/${maxAttempts}: ${backup.status}`);

          if (backup.status === 'completed' || backup.status === 'failed') {
            return resolve(backup);
          }

          // Schedule next poll
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  /**
   * Handle API errors and format them appropriately
   */
  private handleError(message: string, error: any): Error {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiErrorResponse;

      if (apiError?.error) {
        return new Error(
          `${message}: ${apiError.error.message} (${apiError.error.code})`
        );
      }

      if (error.message === 'Network Error') {
        return new Error(
          `${message}: Network error - Unable to connect to API (${this.apiBaseUrl})`
        );
      }

      return new Error(
        `${message}: ${error.message} (Status: ${error.response?.status})`
      );
    }

    return new Error(`${message}: ${(error as Error).message}`);
  }
}

// Export singleton instance for easy use
export const backupClient = new BackupClient();
