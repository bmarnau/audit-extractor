/**
 * Technical Quality Dashboard - Phase 43
 *
 * Executive Summary für Technical Audit Status
 * Zeigt in 10 Sekunden: Gesundheitsstatus, Risiken, nächste Schritte
 * Daten ausschließlich über Technical Report APIs
 *
 * @version 0.43.0
 * @phase 43
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Divider,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  PowerSettingsNew as WarmstartIcon,
} from '@mui/icons-material';

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
  impactedComponent?: string;
  discoveredAt: string;
}

interface Recommendation {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'completed';
  description: string;
  estimatedEffort?: string;
  relatedFindingIds: string[];
  assignedTo?: string;
}

interface ReportSummary {
  id: string;
  version: string;
  reportDate: string;
  generatedAt: string;
  status: 'draft' | 'reviewed' | 'final' | 'archived';
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    completedRecommendations: number;
    totalRecommendations: number;
  };
}

interface TechnicalReport {
  id: string;
  version: string;
  reportDate: string;
  generatedAt: string;
  status: 'draft' | 'reviewed' | 'final' | 'archived';
  findings: Finding[];
  recommendations: Recommendation[];
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    completedRecommendations: number;
    totalRecommendations: number;
  };
  auditedBy: string;
  reviewedBy?: string;
}

/**
 * Health Status Indicator
 */
const HealthStatusIndicator: React.FC<{ report: TechnicalReport }> = ({ report }) => {
  const { criticalCount, highCount } = report.summary;
  const isHealthy = criticalCount === 0 && highCount === 0;

  return (
    <Card sx={{ background: isHealthy ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {isHealthy ? (
            <HealthyIcon sx={{ fontSize: 60, color: 'white' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 60, color: 'white' }} />
          )}
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {isHealthy ? 'System Healthy' : 'Action Required'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
              {criticalCount + highCount} Critical Issues Found
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Severity Distribution Chart
 */
const SeverityDashboard: React.FC<{ report: TechnicalReport }> = ({ report }) => {
  const { criticalCount, highCount, mediumCount, lowCount, totalFindings } = report.summary;

  const severityData = [
    { label: 'Critical', count: criticalCount, color: '#d32f2f', percentage: (criticalCount / totalFindings) * 100 },
    { label: 'High', count: highCount, color: '#f57c00', percentage: (highCount / totalFindings) * 100 },
    { label: 'Medium', count: mediumCount, color: '#fbc02d', percentage: (mediumCount / totalFindings) * 100 },
    { label: 'Low', count: lowCount, color: '#388e3c', percentage: (lowCount / totalFindings) * 100 },
  ];

  return (
    <Card>
      <CardHeader title="Severity Distribution" />
      <CardContent>
        <Grid container spacing={2}>
          {severityData.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Paper sx={{ p: 2, textAlign: 'center', background: `${item.color}15` }}>
                <Typography variant="h4" sx={{ color: item.color, fontWeight: 'bold' }}>
                  {item.count}
                </Typography>
                <Typography variant="body2" sx={{ color: item.color, mt: 1 }}>
                  {item.label}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{ mt: 1, backgroundColor: `${item.color}30`, '& .MuiLinearProgress-bar': { backgroundColor: item.color } }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Key Insights - Top priorities
 */
const KeyInsights: React.FC<{ report: TechnicalReport }> = ({ report }) => {
  const criticalFindings = report.findings.filter((f) => f.severity === 'critical').slice(0, 3);
  const openRecommendations = report.recommendations.filter((r) => r.status === 'open').slice(0, 3);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="🔴 Critical Findings" avatar={<ErrorIcon sx={{ color: '#d32f2f' }} />} />
          <CardContent>
            {criticalFindings.length === 0 ? (
              <Alert severity="success">No critical findings</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {criticalFindings.map((finding) => (
                  <Box key={finding.id} sx={{ p: 2, border: '1px solid #ffebee', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {finding.title}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {finding.description.substring(0, 100)}...
                    </Typography>
                    <Chip
                      label={finding.category}
                      size="small"
                      sx={{ mt: 1, backgroundColor: '#ffebee', color: '#d32f2f' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="📋 Next Steps" avatar={<TrendingIcon sx={{ color: '#1976d2' }} />} />
          <CardContent>
            {openRecommendations.length === 0 ? (
              <Alert severity="success">All recommendations implemented</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {openRecommendations.map((rec, idx) => (
                  <Box key={rec.id} sx={{ p: 2, border: '1px solid #e3f2fd', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', minWidth: '30px' }}>
                        {idx + 1}.
                      </Typography>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {rec.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Effort: {rec.estimatedEffort || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Findings Table
 */
const FindingsTable: React.FC<{ findings: Finding[] }> = ({ findings }) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Finding</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Component</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((finding) => (
            <TableRow key={finding.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {finding.title}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={finding.severity}
                  size="small"
                  sx={{
                    backgroundColor:
                      finding.severity === 'critical'
                        ? '#ffcdd2'
                        : finding.severity === 'high'
                          ? '#ffe0b2'
                          : finding.severity === 'medium'
                            ? '#fff9c4'
                            : '#c8e6c9',
                    color:
                      finding.severity === 'critical'
                        ? '#d32f2f'
                        : finding.severity === 'high'
                          ? '#f57c00'
                          : finding.severity === 'medium'
                            ? '#f9a825'
                            : '#388e3c',
                  }}
                />
              </TableCell>
              <TableCell>{finding.category}</TableCell>
              <TableCell>{finding.impactedComponent || 'General'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Recommendations Table
 */
const RecommendationsTable: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Recommendation</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Effort</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recommendations.map((rec) => (
            <TableRow key={rec.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {rec.title}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={rec.priority}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor:
                      rec.priority === 'critical'
                        ? '#d32f2f'
                        : rec.priority === 'high'
                          ? '#f57c00'
                          : rec.priority === 'medium'
                            ? '#fbc02d'
                            : '#388e3c',
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={rec.status}
                  size="small"
                  sx={{
                    backgroundColor:
                      rec.status === 'open'
                        ? '#ffcdd2'
                        : rec.status === 'in-progress'
                          ? '#ffe0b2'
                          : '#c8e6c9',
                    color:
                      rec.status === 'open'
                        ? '#d32f2f'
                        : rec.status === 'in-progress'
                          ? '#f57c00'
                          : '#388e3c',
                  }}
                />
              </TableCell>
              <TableCell>{rec.estimatedEffort || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Report History
 */
const ReportHistory: React.FC<{ reports: ReportSummary[] }> = ({ reports }) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Version</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Findings</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Issues Fixed</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} hover>
              <TableCell>
                <Chip label={`v${report.version}`} variant="outlined" size="small" />
              </TableCell>
              <TableCell>{new Date(report.reportDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Chip
                  label={report.status}
                  size="small"
                  sx={{
                    backgroundColor: report.status === 'final' ? '#c8e6c9' : '#fff9c4',
                    color: report.status === 'final' ? '#388e3c' : '#f9a825',
                  }}
                />
              </TableCell>
              <TableCell>{report.summary.totalFindings}</TableCell>
              <TableCell>{report.summary.completedRecommendations}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Main Dashboard Component
 */
const TechnicalQualityDashboard: React.FC = () => {
  const [currentReport, setCurrentReport] = useState<TechnicalReport | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [exportDialog, setExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load latest report on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reports list
      const reportsRes = await fetch('/api/technical-tests/reports');
      if (!reportsRes.ok) throw new Error('Failed to load reports');
      const reportsData = await reportsRes.json();
      setReports(reportsData.data?.reports || []);

      // Load latest report details
      if (reportsData.data?.latest) {
        const reportRes = await fetch(`/api/technical-tests/reports/${reportsData.data.latest.id}`);
        if (!reportRes.ok) throw new Error('Failed to load report details');
        const reportData = await reportRes.json();
        setCurrentReport(reportData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!currentReport) return;

    try {
      setExporting(true);
      const exportRes = await fetch(`/api/technical-tests/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: currentReport.id }),
      });

      if (!exportRes.ok) throw new Error(`Failed to export ${format.toUpperCase()}`);
      const exportData = await exportRes.json();

      // Download file
      const binaryString = atob(exportData.data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: exportData.data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.data.fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      setExportDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Technical Quality Dashboard...</Typography>
      </Container>
    );
  }

  if (error || !currentReport) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'No reports available'}
          <Button onClick={loadDashboard} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Technical Quality Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Report v{currentReport.version} • {new Date(currentReport.reportDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDashboard}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialog(true)}
            variant="contained"
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Executive Summary Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <HealthStatusIndicator report={currentReport} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {currentReport.summary.totalFindings}
                    </Typography>
                    <Typography variant="caption">Total Findings</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: currentReport.summary.completedRecommendations > 0 ? '#4caf50' : '#f57c00',
                        fontWeight: 'bold',
                      }}
                    >
                      {currentReport.summary.completedRecommendations}/{currentReport.summary.totalRecommendations}
                    </Typography>
                    <Typography variant="caption">Recommendations Fixed</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Severity Dashboard */}
      <SeverityDashboard report={currentReport} />

      {/* Key Insights */}
      <Box sx={{ my: 4 }}>
        <KeyInsights report={currentReport} />
      </Box>

      {/* Detailed Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="📊 Findings" />
          <Tab label="✅ Recommendations" />
          <Tab label="📈 Report History" />
        </Tabs>

        {tabValue === 0 && (
          <CardContent>
            <FindingsTable findings={currentReport.findings} />
          </CardContent>
        )}

        {tabValue === 1 && (
          <CardContent>
            <RecommendationsTable recommendations={currentReport.recommendations} />
          </CardContent>
        )}

        {tabValue === 2 && (
          <CardContent>
            <ReportHistory reports={reports} />
          </CardContent>
        )}
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Select export format:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button onClick={() => handleExportReport('pdf')} disabled={exporting}>
              📄 PDF
            </Button>
            <Button onClick={() => handleExportReport('csv')} disabled={exporting}>
              📊 CSV
            </Button>
            <Button onClick={() => handleExportReport('json')} disabled={exporting}>
              {} JSON
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TechnicalQualityDashboard;
