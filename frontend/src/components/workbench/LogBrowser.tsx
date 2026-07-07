/**
 * LogBrowser - Phase 13 (Refactored)
 *
 * Durchsucht und filtert Logs mit Multi-Dimensional Filtering.
 * ✅ Nutzt useLogs Hook - Keine Mockdaten mehr
 *
 * Features:
 * - Volltext-Suche via API
 * - Filter: Source, Level, Zeitraum
 * - Export: JSON/CSV/TXT
 * - Live Updates
 *
 * @version 0.13.0
 * @phase 13
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { useLogs, LogEntry, LogFilter } from '@/hooks/useLogs';

/**
 * LogBrowser Component
 */
export const LogBrowser: React.FC = () => {
  const { logs, error, fetchLogs, exportLogs } = useLogs();
  
  // Local state
  const [filter, setFilter] = useState<LogFilter>({
    query: '',
    source: undefined,
    level: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [displayLogs, setDisplayLogs] = useState<LogEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    handleFetch();
  }, []);

  // Update display logs when filtered logs change
  useEffect(() => {
    setDisplayLogs(logs);
  }, [logs]);

  const handleFetch = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      console.log('[LogBrowser] Fetching logs with filter:', filter);
      await fetchLogs(filter);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs';
      console.error('[LogBrowser] Error:', err);
      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleFilterChange = (key: keyof LogFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const content = exportLogs(displayLogs, format);
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-export-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (level) {
      case 'debug':
        return 'info';
      case 'info':
        return 'info';
      case 'warn':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSourceColor = (source: string): 'primary' | 'secondary' | 'default' => {
    switch (source) {
      case 'parser':
        return 'primary';
      case 'llm':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">📊 Log Browser</Typography>
        <Box>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('json')}
            disabled={displayLogs.length === 0}
            variant="outlined"
            size="small"
            sx={{ mr: 0.5 }}
          >
            JSON
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            disabled={displayLogs.length === 0}
            variant="outlined"
            size="small"
            sx={{ mr: 0.5 }}
          >
            CSV
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('txt')}
            disabled={displayLogs.length === 0}
            variant="outlined"
            size="small"
          >
            TXT
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error">❌ Error: {error}</Alert>}
      {fetchError && <Alert severity="error">❌ {fetchError}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search logs..."
                value={filter.query || ''}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
                disabled={isFetching}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={isFetching}>
                <InputLabel>Level</InputLabel>
                <Select
                  value={filter.level || ''}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  label="Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warn">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={isFetching}>
                <InputLabel>Source</InputLabel>
                <Select
                  value={filter.source || ''}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  label="Source"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="parser">Parser</MenuItem>
                  <MenuItem value="llm">LLM</MenuItem>
                  <MenuItem value="validator">Validator</MenuItem>
                  <MenuItem value="api">API</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                value={filter.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                size="small"
                disabled={isFetching}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                value={filter.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                size="small"
                disabled={isFetching}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleFetch}
                disabled={isFetching}
                fullWidth
              >
                {isFetching ? 'Fetching...' : 'Apply Filters'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Logs Table */}
      {!isFetching && displayLogs.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Message</TableCell>
                <TableCell align="right">Duration (ms)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.source} 
                      size="small" 
                      color={getSourceColor(log.source)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.level.toUpperCase()}
                      size="small"
                      color={getLevelColor(log.level)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption">{log.duration || '-'}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty State */}
      {!isFetching && displayLogs.length === 0 && !error && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1">No logs found. Try adjusting your filters.</Typography>
        </Box>
      )}

      {/* Stats */}
      {displayLogs.length > 0 && (
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>Total Entries</Typography>
            <Typography variant="h5">{displayLogs.length}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>Errors</Typography>
            <Typography variant="h5" sx={{ color: 'red' }}>
              {displayLogs.filter(l => l.level === 'error').length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>Warnings</Typography>
            <Typography variant="h5" sx={{ color: 'orange' }}>
              {displayLogs.filter(l => l.level === 'warn').length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>Avg Duration (ms)</Typography>
            <Typography variant="h5">
              {(displayLogs.filter(l => l.duration).reduce((sum, l) => sum + (l.duration || 0), 0) / 
                displayLogs.filter(l => l.duration).length || 0).toFixed(1)}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
