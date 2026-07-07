/**
 * Local Storage Persistence Service
 * Handles offline storage and sync of extraction results and feedback
 */

import { ExtractionResult, FieldFeedback } from '@/components/learning';

export interface StoredExtractionResult extends ExtractionResult {
  storedAt: string;
  syncedAt?: string;
  isSynced: boolean;
}

export interface StoredFeedback {
  feedbackId: string;
  resultId: string;
  docType: string;
  fieldFeedback: FieldFeedback[];
  userEmail?: string;
  createdAt: string;
  syncedAt?: string;
  isSynced: boolean;
}

const STORAGE_KEYS = {
  EXTRACTION_RESULTS: 'audit-safe:extraction-results',
  FEEDBACK_ITEMS: 'audit-safe:feedback-items',
  SYNC_QUEUE: 'audit-safe:sync-queue',
  LAST_SYNC: 'audit-safe:last-sync',
} as const;

/**
 * LocalStorageService: Manages offline persistence
 */
export class LocalStorageService {
  /**
   * Save extraction result locally
   */
  static saveExtractionResult(result: ExtractionResult): StoredExtractionResult {
    const stored: StoredExtractionResult = {
      ...result,
      storedAt: new Date().toISOString(),
      isSynced: false,
    };

    try {
      const results = this.getAllExtractionResults();
      results.push(stored);
      localStorage.setItem(
        STORAGE_KEYS.EXTRACTION_RESULTS,
        JSON.stringify(results)
      );
      return stored;
    } catch (error) {
      console.error('Failed to save extraction result:', error);
      throw new Error('Failed to save result locally');
    }
  }

  /**
   * Get extraction result from local storage
   */
  static getExtractionResult(resultId: string): StoredExtractionResult | null {
    try {
      const results = this.getAllExtractionResults();
      return results.find(r => r.resultId === resultId) || null;
    } catch (error) {
      console.error('Failed to retrieve extraction result:', error);
      return null;
    }
  }

  /**
   * Get all extraction results
   */
  static getAllExtractionResults(): StoredExtractionResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXTRACTION_RESULTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse extraction results:', error);
      return [];
    }
  }

  /**
   * Save feedback locally
   */
  static saveFeedback(
    resultId: string,
    docType: string,
    fieldFeedback: FieldFeedback[],
    userEmail?: string
  ): StoredFeedback {
    const feedback: StoredFeedback = {
      feedbackId: `feedback-${Date.now()}`,
      resultId,
      docType,
      fieldFeedback,
      userEmail,
      createdAt: new Date().toISOString(),
      isSynced: false,
    };

    try {
      const feedbackItems = this.getAllFeedback();
      feedbackItems.push(feedback);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK_ITEMS, JSON.stringify(feedbackItems));

      // Add to sync queue
      this.addToSyncQueue({
        type: 'feedback',
        id: feedback.feedbackId,
        data: feedback,
      });

      return feedback;
    } catch (error) {
      console.error('Failed to save feedback:', error);
      throw new Error('Failed to save feedback locally');
    }
  }

  /**
   * Get all stored feedback
   */
  static getAllFeedback(): StoredFeedback[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse feedback:', error);
      return [];
    }
  }

  /**
   * Get unsynced feedback (offline mode)
   */
  static getUnsyncedFeedback(): StoredFeedback[] {
    return this.getAllFeedback().filter(f => !f.isSynced);
  }

  /**
   * Mark feedback as synced
   */
  static markFeedbackSynced(feedbackId: string): void {
    try {
      const feedbackItems = this.getAllFeedback();
      const index = feedbackItems.findIndex(f => f.feedbackId === feedbackId);
      if (index !== -1) {
        feedbackItems[index].isSynced = true;
        feedbackItems[index].syncedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.FEEDBACK_ITEMS, JSON.stringify(feedbackItems));
      }
    } catch (error) {
      console.error('Failed to mark feedback as synced:', error);
    }
  }

  /**
   * Sync queue management
   */
  static addToSyncQueue(item: { type: string; id: string; data: any }): void {
    try {
      const queue = this.getSyncQueue();
      queue.push({
        ...item,
        addedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  static getSyncQueue(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  static clearSyncQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  static getLastSyncTime(): Date | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp
   */
  static setLastSyncTime(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  /**
   * Calculate storage usage
   */
  static getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (const key of Object.values(STORAGE_KEYS)) {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      }

      // Estimate available space (5MB typical for localStorage)
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, available: 5242880, percentage: 0 };
    }
  }

  /**
   * Check if storage quota is exceeded
   */
  static isStorageQuotaExceeded(): boolean {
    const { percentage } = this.getStorageUsage();
    return percentage > 90;
  }

  /**
   * Clear all stored data
   */
  static clearAllData(): void {
    try {
      for (const key of Object.values(STORAGE_KEYS)) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  /**
   * Export stored data
   */
  static exportData(): {
    results: StoredExtractionResult[];
    feedback: StoredFeedback[];
    exportedAt: string;
  } {
    return {
      results: this.getAllExtractionResults(),
      feedback: this.getAllFeedback(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import data from export
   */
  static importData(data: {
    results: StoredExtractionResult[];
    feedback: StoredFeedback[];
  }): void {
    try {
      if (data.results) {
        localStorage.setItem(
          STORAGE_KEYS.EXTRACTION_RESULTS,
          JSON.stringify(data.results)
        );
      }
      if (data.feedback) {
        localStorage.setItem(
          STORAGE_KEYS.FEEDBACK_ITEMS,
          JSON.stringify(data.feedback)
        );
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }
}

export default LocalStorageService;
