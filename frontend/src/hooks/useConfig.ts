/**
 * useConfig Hook - Configuration Management
 *
 * CRUD operations für Konfigurationsverwaltung mit Versionierung
 *
 * @version 0.13.0
 * @phase 13
 */

import { useState, useCallback, useEffect } from 'react';
import { AppConfig, ConfigChange } from '@/types/Configuration';

const API_URL = '/api';

interface UseConfigResult {
  // State
  config: AppConfig | null;
  changes: ConfigChange[];
  loading: boolean;
  error: string | null;

  // Actions
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<AppConfig>, reason?: string) => Promise<AppConfig>;
  updateSection: (
    section: 'chunking' | 'confidence' | 'llm' | 'system',
    updates: Record<string, unknown>,
    reason?: string
  ) => Promise<AppConfig>;
  loadChanges: (limit?: number) => Promise<void>;
  revertToVersion: (version: number, reason?: string) => Promise<AppConfig>;
  exportConfig: () => string;
  importConfig: (jsonString: string, reason?: string) => Promise<AppConfig>;
  getStats: () => Promise<{ currentVersion: number; totalChanges: number; lastUpdated: string }>;
}

export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [changes, setChanges] = useState<ConfigChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current configuration
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/config`);
      if (!response.ok) throw new Error(`Failed to load config: ${response.statusText}`);
      const data = await response.json();
      setConfig(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(message);
      console.error('[useConfig] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update entire configuration
  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>, reason?: string): Promise<AppConfig> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates,
            changedBy: 'ui-user',
            reason,
          }),
        });

        if (!response.ok) throw new Error(`Failed to update config: ${response.statusText}`);
        const data = await response.json();
        setConfig(data.data);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update configuration';
        setError(message);
        console.error('[useConfig] Update failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update specific section
  const updateSection = useCallback(
    async (
      section: 'chunking' | 'confidence' | 'llm' | 'system',
      updates: Record<string, unknown>,
      reason?: string
    ): Promise<AppConfig> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/config/${section}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates,
            changedBy: 'ui-user',
            reason,
          }),
        });

        if (!response.ok) throw new Error(`Failed to update section: ${response.statusText}`);
        const data = await response.json();
        setConfig(data.data);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update configuration section';
        setError(message);
        console.error('[useConfig] Section update failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load configuration changes
  const loadChanges = useCallback(async (limit: number = 100) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/config/changes?limit=${limit}`);
      if (!response.ok) throw new Error(`Failed to load changes: ${response.statusText}`);
      const data = await response.json();
      setChanges(data.data.changes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration changes';
      setError(message);
      console.error('[useConfig] Load changes failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Revert to previous version
  const revertToVersion = useCallback(
    async (version: number, reason?: string): Promise<AppConfig> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/config/${version}/revert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            changedBy: 'ui-user',
            reason,
          }),
        });

        if (!response.ok) throw new Error(`Failed to revert config: ${response.statusText}`);
        const data = await response.json();
        setConfig(data.data);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to revert configuration';
        setError(message);
        console.error('[useConfig] Revert failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Export configuration as JSON
  const exportConfig = useCallback((): string => {
    if (!config) return '';
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Import configuration from JSON
  const importConfig = useCallback(
    async (jsonString: string, reason?: string): Promise<AppConfig> => {
      setLoading(true);
      setError(null);
      try {
        const imported = JSON.parse(jsonString);

        const response = await fetch(`${API_URL}/config/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: imported,
            changedBy: 'ui-user',
            reason,
          }),
        });

        if (!response.ok) throw new Error(`Failed to import config: ${response.statusText}`);
        const data = await response.json();
        setConfig(data.data);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import configuration';
        setError(message);
        console.error('[useConfig] Import failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get configuration statistics
  const getStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/config/stats`);
      if (!response.ok) throw new Error(`Failed to get stats: ${response.statusText}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('[useConfig] Get stats failed:', err);
      throw err;
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    changes,
    loading,
    error,
    loadConfig,
    updateConfig,
    updateSection,
    loadChanges,
    revertToVersion,
    exportConfig,
    importConfig,
    getStats,
  };
}
