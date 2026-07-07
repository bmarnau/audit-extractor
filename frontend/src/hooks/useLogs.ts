/**
 * useLogs Hook - Log Management
 *
 * Multi-dimensional filtering und Export von System-Logs
 *
 * @version 0.13.0
 * @phase 13
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'parser' | 'llm' | 'validator' | 'api' | 'system';
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  duration?: number;
}

export interface LogFilter {
  query?: string;
  source?: LogEntry['source'];
  level?: LogEntry['level'];
  startDate?: string;
  endDate?: string;
}

interface UseLogsResult {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  fetchLogs: (filter?: LogFilter, limit?: number) => Promise<void>;
  exportLogs: (logs: LogEntry[], format: 'json' | 'csv' | 'txt') => string;
}

export function useLogs(): UseLogsResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (filter?: LogFilter, limit: number = 100) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', Math.min(limit, 500).toString());

      if (filter?.query) params.set('query', filter.query);
      if (filter?.source) params.set('source', filter.source);
      if (filter?.level) params.set('level', filter.level);
      if (filter?.startDate) params.set('startDate', filter.startDate);
      if (filter?.endDate) params.set('endDate', filter.endDate);

      const response = await fetch(`${API_URL}/logs?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch logs: ${response.statusText}`);
      const data = await response.json();
      setLogs(data.data.logs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(message);
      console.error('[useLogs] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportLogs = useCallback((logs: LogEntry[], format: 'json' | 'csv' | 'txt'): string => {
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['timestamp', 'source', 'level', 'message', 'duration'];
      const rows = logs.map((log) => [
        log.timestamp,
        log.source,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.duration || '',
      ]);

      return (
        [headers, ...rows].map((row) => row.join(',')).join('\n') + '\n'
      );
    }

    // TXT format
    let txt = 'System Logs Export\n';
    txt += `Generated: ${new Date().toISOString()}\n`;
    txt += `Total Entries: ${logs.length}\n`;
    txt += '\n' + '='.repeat(80) + '\n\n';

    for (const log of logs) {
      txt += `[${log.timestamp}] [${log.source}] [${log.level.toUpperCase()}]\n`;
      txt += `${log.message}\n`;
      if (log.duration) txt += `Duration: ${log.duration}ms\n`;
      txt += '\n';
    }

    return txt;
  }, []);

  return {
    logs,
    loading,
    error,
    fetchLogs,
    exportLogs,
  };
}
