/**
 * Hook: useRules
 * 
 * Verwaltet Rules-Zustand und Operationen.
 */

import { useState, useEffect, useCallback } from 'react';
import { ruleService, ExtractionRule, ChangeLogEntry } from '../services/ruleService';

interface UseRulesResult {
  rules: ExtractionRule[];
  loading: boolean;
  error: string | null;
  changelog: ChangeLogEntry[];
  listRules: () => Promise<void>;
  getRule: (id: string) => Promise<ExtractionRule | null>;
  saveRule: (rule: ExtractionRule) => Promise<ExtractionRule>;
  duplicateRule: (id: string, newName: string) => Promise<ExtractionRule>;
  deleteRule: (id: string) => Promise<void>;
  testRule: (
    ruleId: string,
    testInput: string
  ) => Promise<{ matched: boolean; result: string | null; testCasePassed: boolean }>;
  getChangelog: (ruleId?: string) => Promise<void>;
}

export const useRules = (): UseRulesResult => {
  const [rules, setRules] = useState<ExtractionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedRules = await ruleService.listRules();
        setRules(loadedRules);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rules');
      } finally {
        setLoading(false);
      }
    };

    loadRules();

    const unsubscribe = ruleService.subscribe(() => {
      loadRules();
    });

    return () => unsubscribe();
  }, []);

  const listRules = useCallback(async () => {
    try {
      setError(null);
      const loadedRules = await ruleService.listRules();
      setRules(loadedRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    }
  }, []);

  const getRule = useCallback(async (id: string) => {
    try {
      setError(null);
      return await ruleService.getRule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get rule');
      return null;
    }
  }, []);

  const saveRule = useCallback(async (rule: ExtractionRule) => {
    try {
      setError(null);
      const saved = await ruleService.saveRule(rule);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
      throw err;
    }
  }, []);

  const duplicateRule = useCallback(async (id: string, newName: string) => {
    try {
      setError(null);
      const duplicated = await ruleService.duplicateRule(id, newName);
      return duplicated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate rule');
      throw err;
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    try {
      setError(null);
      await ruleService.deleteRule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      throw err;
    }
  }, []);

  const testRule = useCallback(
    async (ruleId: string, testInput: string) => {
      try {
        setError(null);
        return await ruleService.testRule(ruleId, testInput);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Test failed');
        throw err;
      }
    },
    []
  );

  const getChangelog = useCallback(async (ruleId?: string) => {
    try {
      setError(null);
      const log = await ruleService.getChangelog(ruleId);
      setChangelog(log);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load changelog');
    }
  }, []);

  return {
    rules,
    loading,
    error,
    changelog,
    listRules,
    getRule,
    saveRule,
    duplicateRule,
    deleteRule,
    testRule,
    getChangelog,
  };
};
