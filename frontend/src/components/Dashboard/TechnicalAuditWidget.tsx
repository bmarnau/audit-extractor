/**
 * Dashboard Enhancement Widget
 * Technical Audit Summary Widget for main dashboard
 * 
 * @version 0.37.0
 * @phase 43E
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

interface SummaryData {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  totalRecommendations: number;
  completedRecommendations: number;
  openRecommendations: number;
  inProgressRecommendations: number;
}

/**
 * Technical Audit Summary Widget
 */
export const TechnicalAuditWidget: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const [findingsRes, recsRes] = await Promise.all([
        fetch('/api/technical-tests/findings/statistics'),
        fetch('/api/technical-tests/recommendations/statistics'),
      ]);

      if (!findingsRes.ok || !recsRes.ok) {
        throw new Error('Failed to load summary');
      }

      const findingsData = await findingsRes.json();
      const recsData = await recsRes.json();

      const fStats = findingsData.data;
      const rStats = recsData.data;

      setSummary({
        totalFindings: fStats.total || 0,
        criticalFindings: fStats.bySeverity?.critical || 0,
        highFindings: fStats.bySeverity?.high || 0,
        totalRecommendations: rStats.total || 0,
        completedRecommendations: rStats.byStatus?.completed || 0,
        openRecommendations: rStats.byStatus?.open || 0,
        inProgressRecommendations: rStats.byStatus?.['in-progress'] || 0,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      setExporting(true);
      const response = await fetch(`/api/technical-tests/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Technical Audit Report',
          includeFindings: true,
          includeRecommendations: true,
          includeSummary: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'csv' || format === 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `technical-audit.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        // In production, would trigger file download
        console.log('PDF export:', data);
      }

      setExportDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!summary) {
    return <Alert severity="info">No data available</Alert>;
  }

  const completionRate = summary.totalRecommendations > 0 ? (summary.completedRecommendations / summary.totalRecommendations) * 100 : 0;
  const healthStatus =
    summary.criticalFindings > 0 ? 'critical' : summary.highFindings > 0 ? 'warning' : 'healthy';

  return (
    <Card>
      <CardHeader
        title="Technical Audit Summary"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<RefreshIcon />} onClick={loadSummary}>
              Refresh
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialog(true)}
            >
              Export
            </Button>
          </Box>
        }
      />
      <CardContent>
        {/* Health Status Alert */}
        {healthStatus === 'critical' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            ⚠️ Critical findings detected - immediate action required
          </Alert>
        )}
        {healthStatus === 'warning' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ High-severity findings detected - review recommended
          </Alert>
        )}
        {healthStatus === 'healthy' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ System health is good
          </Alert>
        )}

        {/* Summary Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{summary.totalFindings}</Typography>
              <Typography variant="caption">Total Findings</Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={summary.criticalFindings}
                color={summary.criticalFindings > 0 ? 'error' : 'default'}
                sx={{ mb: 0.5 }}
              />
              <Typography variant="caption">Critical</Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{summary.totalRecommendations}</Typography>
              <Typography variant="caption">Recommendations</Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{completionRate.toFixed(0)}%</Typography>
              <Typography variant="caption">Completion</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recommendation Progress
          </Typography>
          <LinearProgress variant="determinate" value={completionRate} sx={{ mb: 1 }} />
          <Typography variant="caption">
            {summary.completedRecommendations} completed / {summary.totalRecommendations} total
          </Typography>
        </Box>

        {/* Recommendation Status */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="caption">In Progress</Typography>
              <Typography variant="h6">{summary.inProgressRecommendations}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1, bgcolor: '#f3e5f5', borderRadius: 1 }}>
              <Typography variant="caption">Open</Typography>
              <Typography variant="h6">{summary.openRecommendations}</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={() => handleExport('pdf')} disabled={exporting}>
              <ListItemText primary="PDF Report" secondary="Download as PDF document" />
            </ListItem>
            <ListItem button onClick={() => handleExport('csv')} disabled={exporting}>
              <ListItemText primary="CSV Export" secondary="Download as CSV spreadsheet" />
            </ListItem>
            <ListItem button onClick={() => handleExport('json')} disabled={exporting}>
              <ListItemText primary="JSON Export" secondary="Download as JSON data" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TechnicalAuditWidget;
