/**
 * ImprovementDashboard Component
 * Phase 14d: Learning & Feedback
 * 
 * Übersicht der Learning-Fortschritte
 * - Success-Rate Trend (80% → 88% → 94%)
 * - Applied Suggestions Count
 * - Active Feedback Items
 * - Latest Ruleset Version + Changes
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Typography,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

export interface ImprovementDashboardProps {
  docType: string;
}

interface DashboardMetrics {
  currentVersion: string;
  successRate: number;
  appliedSuggestions: number;
  activeFeedbackItems: number;
  successRateTrend: Array<{ version: string; rate: number; appliedAt: string }>;
  recentChanges: Array<{ field: string; change: string; appliedAt: string }>;
}

export const ImprovementDashboard: React.FC<ImprovementDashboardProps> = ({ docType }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Mock data for demonstration
  const mockMetrics: DashboardMetrics = {
    currentVersion: '1.0.8',
    successRate: 0.94,
    appliedSuggestions: 12,
    activeFeedbackItems: 3,
    successRateTrend: [
      { version: '1.0.0', rate: 0.80, appliedAt: '2024-05-01T10:00:00Z' },
      { version: '1.0.3', rate: 0.85, appliedAt: '2024-05-10T14:30:00Z' },
      { version: '1.0.5', rate: 0.88, appliedAt: '2024-05-15T09:15:00Z' },
      { version: '1.0.8', rate: 0.94, appliedAt: '2024-05-20T16:45:00Z' },
    ],
    recentChanges: [
      {
        field: 'invoiceNumber',
        change: 'Pattern improved from (INV-[0-9]{6}) to (INV-[0-9]{6}(-[0-9]{4})?)',
        appliedAt: '2024-05-20T16:45:00Z',
      },
      {
        field: 'invoiceDate',
        change: 'Added support for DD.MM.YYYY format',
        appliedAt: '2024-05-20T15:20:00Z',
      },
      {
        field: 'customerName',
        change: 'Confidence threshold adjusted from 0.7 to 0.6',
        appliedAt: '2024-05-19T11:00:00Z',
      },
    ],
  };

  useEffect(() => {
    loadMetrics();
  }, [docType]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // For Phase 14d, use mock data
      // In Phase 15, integrate with real API
      setTimeout(() => {
        setMetrics(mockMetrics);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Learning Progress" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader title="Learning Progress" />
        <CardContent>
          <Alert severity="error">{error || 'Failed to load metrics'}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Learning Progress"
        subheader={`${docType.toUpperCase()} • Version: ${metrics.currentVersion}`}
        action={
          <Chip
            label="Live"
            color="success"
            icon={<CheckIcon />}
            size="small"
          />
        }
        sx={{ pb: 1 }}
      />
      <Divider />

      {/* Key Metrics */}
      <CardContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Success Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Success Rate
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, color: 'success.main' }}>
                {(metrics.successRate * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.successRate * 100}
                sx={{ mt: 1 }}
                color="success"
              />
            </Paper>
          </Grid>

          {/* Applied Suggestions */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <CheckIcon color="primary" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Applied Suggestions
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {metrics.appliedSuggestions}
              </Typography>
            </Paper>
          </Grid>

          {/* Active Feedback */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <InfoIcon color="warning" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Active Feedback Items
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {metrics.activeFeedbackItems}
              </Typography>
            </Paper>
          </Grid>

          {/* Improvement Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <SpeedIcon color="secondary" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Total Improvement
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                +{((metrics.successRate - 0.8) * 100).toFixed(0)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Tabs */}
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ mb: 2 }}>
          <Tab label="Trend" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Recent Changes" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>

        {/* Trend View */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Success Rate Progression
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 2 }}>
              {metrics.successRateTrend.map((trend, idx) => (
                <Box key={idx} sx={{ flex: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      height: `${trend.rate * 200}px`,
                      backgroundColor: 'primary.light',
                      borderRadius: '4px 4px 0 0',
                      mb: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    }}
                  />
                  <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                    {trend.version}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {(trend.rate * 100).toFixed(0)}%
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Legend */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
              Success rate shows consistent improvement from 80% to 94% through iterative feedback and
              pattern refinement.
            </Alert>
          </Box>
        )}

        {/* Recent Changes View */}
        {tabValue === 1 && (
          <Box>
            <List>
              {metrics.recentChanges.map((change, idx) => (
                <ListItem key={idx} sx={{ py: 1 }}>
                  <ListItemIcon>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={change.field} size="small" variant="outlined" />
                        <Typography variant="body2">{change.change}</Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {new Date(change.appliedAt).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Summary */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Keep submitting feedback to continuously improve extraction accuracy.
            <br />
            Current patterns are locked in production. New suggestions will be available after your feedback is
            analyzed.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
