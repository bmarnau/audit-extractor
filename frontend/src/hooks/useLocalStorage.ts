/**
 * useLocalStorage Hook
 * React hook for managing local storage persistence
 */

import { useEffect, useState, useCallback } from 'react';
import { LocalStorageService, StoredFeedback } from '@/services/localStorageService';
import { ExtractionResult } from '@/components/learning';

export function useLocalStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsage, setStorageUsage] = useState(0);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update unsynced count
  useEffect(() => {
    const unsynced = LocalStorageService.getUnsyncedFeedback();
    setUnsyncedCount(unsynced.length);
  }, []);

  // Update storage usage
  useEffect(() => {
    const { percentage } = LocalStorageService.getStorageUsage();
    setStorageUsage(percentage);
  }, []);

  /**
   * Save extraction result
   */
  const saveResult = useCallback((result: ExtractionResult) => {
    return LocalStorageService.saveExtractionResult(result);
  }, []);

  /**
   * Get extraction result
   */
  const getResult = useCallback((resultId: string) => {
    return LocalStorageService.getExtractionResult(resultId);
  }, []);

  /**
   * Save feedback
   */
  const saveFeedback = useCallback((
    resultId: string,
    docType: string,
    fieldFeedback: any[],
    userEmail?: string
  ) => {
    const feedback = LocalStorageService.saveFeedback(
      resultId,
      docType,
      fieldFeedback,
      userEmail
    );
    setUnsyncedCount(prev => prev + 1);
    return feedback;
  }, []);

  /**
   * Get unsynced feedback (for sync when online)
   */
  const getUnsyncedFeedback = useCallback(() => {
    return LocalStorageService.getUnsyncedFeedback();
  }, []);

  /**
   * Mark feedback as synced
   */
  const markFeedbackSynced = useCallback((feedbackId: string) => {
    LocalStorageService.markFeedbackSynced(feedbackId);
    setUnsyncedCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Sync unsynced items to server
   */
  const syncPendingItems = useCallback(async (apiClient: any) => {
    if (!isOnline) {
      console.warn('Offline: Cannot sync now');
      return { synced: 0, failed: 0 };
    }

    const unsyncedFeedback = getUnsyncedFeedback();
    let synced = 0;
    let failed = 0;

    for (const feedback of unsyncedFeedback) {
      try {
        // Try to sync to server
        const response = await apiClient.post(
          `/api/extract/extraction/${feedback.resultId}/feedback`,
          {
            docType: feedback.docType,
            fieldFeedback: feedback.fieldFeedback,
            userEmail: feedback.userEmail,
          }
        );

        if (response.success) {
          markFeedbackSynced(feedback.feedbackId);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Sync failed for feedback:', feedback.feedbackId, error);
        failed++;
      }
    }

    LocalStorageService.setLastSyncTime();
    return { synced, failed };
  }, [isOnline, getUnsyncedFeedback, markFeedbackSynced]);

  /**
   * Clear all local data
   */
  const clearAll = useCallback(() => {
    LocalStorageService.clearAllData();
    setUnsyncedCount(0);
    setStorageUsage(0);
  }, []);

  return {
    // Status
    isOnline,
    storageUsage,
    unsyncedCount,
    isStorageQuotaExceeded: LocalStorageService.isStorageQuotaExceeded(),

    // Operations
    saveResult,
    getResult,
    saveFeedback,
    getUnsyncedFeedback,
    markFeedbackSynced,
    syncPendingItems,
    clearAll,

    // Data export/import
    exportData: () => LocalStorageService.exportData(),
    importData: (data: any) => LocalStorageService.importData(data),
  };
}

export default useLocalStorage;
