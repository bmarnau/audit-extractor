/**
 * Report Viewer Components
 * React components for displaying technical audit reports
 * 
 * @version 0.37.0
 * @phase 43C
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';

// Types
interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
  impactedComponent?: string;
}

interface Recommendation {
  id: string;
  title: string;
  priority: string;
  status: 'open' | 'in-progress' | 'completed';
  recommendation: string;
  estimatedEffort?: string;
  relatedFindingIds: string[];
}

// Severity color mapping
const severityColors: Record<string, string> = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
};

// Status color mapping
const statusColors: Record<string, string> = {
  open: '#d32f2f',
  'in-progress': '#f57c00',
  completed: '#388e3c',
};

/**
 * Findings Table Component
 */
export const FindingsTable: React.FC<{ findings: Finding[] }> = ({ findings }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Severity</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Component</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((finding) => (
            <TableRow key={finding.id}>
              <TableCell>
                <Chip
                  label={finding.severity}
                  size="small"
                  style={{ backgroundColor: severityColors[finding.severity], color: 'white' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" title={finding.description}>
                  {finding.title.substring(0, 50)}...
                </Typography>
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
 * Recommendations Table Component
 */
export const RecommendationsTable: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Priority</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Effort</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recommendations.map((rec) => (
            <TableRow key={rec.id}>
              <TableCell>
                <Chip
                  label={rec.priority}
                  size="small"
                  style={{ backgroundColor: '#1976d2', color: 'white' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{rec.title.substring(0, 50)}...</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={rec.status}
                  size="small"
                  style={{ backgroundColor: statusColors[rec.status], color: 'white' }}
                />
              </TableCell>
              <TableCell>{rec.estimatedEffort || 'TBD'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Summary Cards Component
 */
export const ReportSummaryCards: React.FC<{
  totalFindings: number;
  criticalFindings: number;
  totalRecommendations: number;
  completedRecommendations: number;
}> = ({ totalFindings, criticalFindings, totalRecommendations, completedRecommendations }) => {
  const completionRate = totalRecommendations > 0 ? (completedRecommendations / totalRecommendations) * 100 : 0;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Total Findings</Typography>
            <Typography variant="h4">{totalFindings}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="error">Critical Findings</Typography>
            <Typography variant="h4">{criticalFindings}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Total Recommendations</Typography>
            <Typography variant="h4">{totalRecommendations}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Completion Rate</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4">{completionRate.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={completionRate} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Report Viewer Main Component
 */
export const ReportViewer: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [findingsRes, recsRes] = await Promise.all([
          fetch('/api/technical-tests/findings'),
          fetch('/api/technical-tests/recommendations'),
        ]);

        if (!findingsRes.ok || !recsRes.ok) {
          throw new Error('Failed to load report data');
        }

        const findingsData = await findingsRes.json();
        const recsData = await recsRes.json();

        setFindings(findingsData.data?.findings || []);
        setRecommendations(recsData.data?.recommendations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
  const completedRecs = recommendations.filter((r) => r.status === 'completed').length;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Technical Audit Report
      </Typography>

      <ReportSummaryCards
        totalFindings={findings.length}
        criticalFindings={criticalFindings}
        totalRecommendations={recommendations.length}
        completedRecommendations={completedRecs}
      />

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader title="Findings" />
          <CardContent>
            {findings.length > 0 ? (
              <FindingsTable findings={findings} />
            ) : (
              <Alert severity="info">No findings</Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader title="Recommendations" />
          <CardContent>
            {recommendations.length > 0 ? (
              <RecommendationsTable recommendations={recommendations} />
            ) : (
              <Alert severity="info">No recommendations</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ReportViewer;
