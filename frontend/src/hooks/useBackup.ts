/**
 * useBackup Hook - Backup Management
 *
 * CRUD operations für Backup- und Restore-Verwaltung
 *
 * @version 0.13.0
 * @phase 13
 */

import { useState, useCallback, useEffect } from 'react';
import { BackupMetadata, RestoreRequest, RestoreResult, BackupStatistics } from '@/types/Backup';

const API_URL = '/api';

interface UseBackupResult {
  // State
  backups: BackupMetadata[];
  statistics: BackupStatistics | null;
  loading: boolean;
  error: string | null;

  // Actions
  listBackups: (limit?: number) => Promise<void>;
  getBackup: (backupId: string) => Promise<BackupMetadata>;
  createBackup: (name: string, reason?: string) => Promise<BackupMetadata>;
  restoreBackup: (request: RestoreRequest) => Promise<RestoreResult>;
  deleteBackup: (backupId: string) => Promise<void>;
  downloadBackup: (backupId: string) => void;
  getStatistics: () => Promise<void>;
}

export function useBackup(): UseBackupResult {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List all backups
  const listBackups = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/backup/list?limit=${limit}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Failed to list backups: ${response.statusText}`);
      const data = await response.json();
      setBackups(data.data.backups);
    } catch (err) {
      const _message = err instanceof Error ? err.message : 'Failed to list backups';
      setError(_message);
      console.error('[useBackup] List failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single backup
  const getBackup = useCallback(async (backupId: string): Promise<BackupMetadata> => {
    try {
      const response = await fetch(`${API_URL}/backup/${backupId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Failed to get backup: ${response.statusText}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('[useBackup] Get failed:', err);
      throw err;
    }
  }, []);

  // Create backup
  const createBackup = useCallback(
    async (name: string, reason?: string): Promise<BackupMetadata> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/backup/create`, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({
            backupName: name,
            reason,
            backupBy: 'ui-user',
          }),
        });

        if (!response.ok) throw new Error(`Failed to create backup: ${response.statusText}`);
        const data = await response.json();
        console.log('[useBackup] Create response:', data);
        
        const backup = data.data.backup;
        console.log('[useBackup] Parsed backup:', backup);
        console.log('[useBackup] Backup totalSize:', backup.totalSize, 'bytes');

        setBackups((prev) => [backup, ...prev]);
        return backup;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create backup';
        setError(message);
        console.error('[useBackup] Create failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Restore from backup
  const restoreBackup = useCallback(
    async (request: RestoreRequest): Promise<RestoreResult> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/backup/${request.backupId}/restore`, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({
            ...request,
            restoredBy: 'ui-user',
          }),
        });

        if (!response.ok) throw new Error(`Failed to restore backup: ${response.statusText}`);
        const data = await response.json();
        return data.data.result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to restore backup';
        setError(message);
        console.error('[useBackup] Restore failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete backup
  const deleteBackup = useCallback(
    async (backupId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/backup/${backupId}`, {
          method: 'DELETE',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({
            deletedBy: 'ui-user',
          }),
        });

        if (!response.ok) throw new Error(`Failed to delete backup: ${response.statusText}`);

        setBackups((prev) => prev.filter((b) => b.backupId !== backupId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete backup';
        setError(message);
        console.error('[useBackup] Delete failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Download backup file
  const downloadBackup = useCallback((backupId: string) => {
    const downloadUrl = `${API_URL}/backup/${backupId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${backupId}.tar.gz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Get backup statistics
  const getStatistics = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/backup/stats`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Failed to get statistics: ${response.statusText}`);
      const data = await response.json();
      setStatistics(data.data.statistics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get statistics';
      setError(message);
      console.error('[useBackup] Get stats failed:', err);
    }
  }, []);

  // Load backups and statistics on mount
  useEffect(() => {
    listBackups();
    getStatistics();
  }, [listBackups, getStatistics]);

  return {
    backups,
    statistics,
    loading,
    error,
    listBackups,
    getBackup,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    getStatistics,
  };
}
