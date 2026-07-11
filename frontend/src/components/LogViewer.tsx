import React, { useState, useEffect } from 'react';
import './LogViewer.css';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  documentId?: string;
  field?: string;
  duration?: number;
  context?: Record<string, unknown>;
}

interface LogStats {
  totalEntries: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
  errorCount: number;
  warningCount: number;
  last24Hours: number;
}

const levelColors: Record<string, string> = {
  debug: '#999999',
  info: '#0066cc',
  warn: '#ff9900',
  error: '#cc0000',
};

const levelEmojis: Record<string, string> = {
  debug: '⚪',
  info: '🟢',
  warn: '🟡',
  error: '🔴',
};

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['error', 'warn', 'info']);
  const [selectedSources, setSelectedSources] = useState<string[]>(['api', 'schema', 'extraction']);
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const sources = ['parser', 'llm', 'validator', 'api', 'system', 'schema', 'extraction'];
  const levels = ['debug', 'info', 'warn', 'error'];

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (selectedLevels.length > 0) params.append('levels', selectedLevels.join(','));
      if (selectedSources.length > 0) params.append('sources', selectedSources.join(','));
      if (timeRange.start) params.append('startDate', timeRange.start);
      if (timeRange.end) params.append('endDate', timeRange.end);

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      setLogs(data.data?.logs || []);
      setTotalCount(data.data?.totalCount || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const handleSearch = () => {
    setOffset(0);
    fetchLogs();
  };

  const handleLevelToggle = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const body = {
        format,
        levels: selectedLevels,
        sources: selectedSources,
        startDate: timeRange.start || undefined,
        endDate: timeRange.end || undefined,
        limit: 10000,
      };

      const response = await fetch('/api/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      // Decode and download
      const content = decodeURIComponent(data.data.dataUrl.split(',')[1]);
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/${format};charset=utf-8,${encodeURIComponent(content)}`);
      element.setAttribute('download', data.data.filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const hasMore = offset + limit < totalCount;

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h1>📊 Log Browser</h1>
        <p>Real-time system logs with filtering, search, and export</p>
      </div>

      {/* Statistics Card */}
      {stats && (
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-label">Total Entries</span>
            <span className="stat-value">{stats.totalEntries}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🔴 Errors</span>
            <span className="stat-value">{stats.errorCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🟡 Warnings</span>
            <span className="stat-value">{stats.warningCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last 24h</span>
            <span className="stat-value">{stats.last24Hours}</span>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="filter-panel">
        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search logs (e.g., 'error', 'schema', 'extraction')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            Search
          </button>
          <button onClick={() => { setSearchQuery(''); setOffset(0); }} className="btn-secondary">
            Clear
          </button>
        </div>

        {/* Level Filter */}
        <div className="filter-section">
          <label className="filter-label">Log Levels</label>
          <div className="filter-options">
            {levels.map(level => (
              <label key={level} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                />
                <span className="emoji">{levelEmojis[level]}</span>
                <span>{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <div className="filter-section">
          <label className="filter-label">Log Sources</label>
          <div className="filter-options">
            {sources.map(source => (
              <label key={source} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                />
                <span>{source}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="filter-section">
          <label className="filter-label">Time Range</label>
          <div className="time-inputs">
            <input
              type="datetime-local"
              value={timeRange.start}
              onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
              placeholder="From"
            />
            <span className="to-text">to</span>
            <input
              type="datetime-local"
              value={timeRange.end}
              onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
              placeholder="To"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="filter-actions">
          <button onClick={handleSearch} disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button onClick={() => handleExport('json')} className="btn-secondary">
            📥 Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <div className="logs-container">
        <div className="logs-info">
          Showing {logs.length} of {totalCount} logs
          <span className="pagination-info">
            (Page {Math.floor(offset / limit) + 1})
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="no-logs">No logs found. Try adjusting your filters.</div>
        ) : (
          <div className="logs-list">
            {logs.map(log => (
              <div
                key={log.id}
                className={`log-entry ${log.level}`}
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="log-header">
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="log-level" style={{ color: levelColors[log.level] }}>
                    {levelEmojis[log.level]} {log.level.toUpperCase()}
                  </span>
                  <span className="log-source">{log.source}</span>
                  {log.duration && (
                    <span className="log-duration">{log.duration}ms</span>
                  )}
                </div>
                <div className="log-message">{log.message}</div>

                {expandedLog === log.id && (
                  <div className="log-details">
                    {log.documentId && (
                      <div className="detail-row">
                        <span className="detail-label">Document:</span>
                        <span className="detail-value">{log.documentId}</span>
                      </div>
                    )}
                    {log.field && (
                      <div className="detail-row">
                        <span className="detail-label">Field:</span>
                        <span className="detail-value">{log.field}</span>
                      </div>
                    )}
                    {log.context && (
                      <div className="detail-row">
                        <span className="detail-label">Context:</span>
                        <pre className="detail-value">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Timestamp:</span>
                      <span className="detail-value">
                        {new Date(log.timestamp).toISOString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="pagination">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {Math.floor(offset / limit) + 1} of{' '}
              {Math.ceil(totalCount / limit)}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
