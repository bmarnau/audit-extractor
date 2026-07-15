/**
 * Health Status Page Component
 * 
 * Displays system health status, database connectivity, cache status,
 * and service availability checks
 * 
 * @version 0.35.0
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  environment: string;
}

const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      const data = await response.json();
      setHealth(data.data);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'degraded':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'unhealthy':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'success';
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            System Health Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
            <RefreshIcon
              onClick={fetchHealth}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && !health ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : health ? (
          <>
            {/* Main Status Card */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Overall Health */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={getStatusIcon(health.status)}
                    title="Overall Status"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label={health.status}
                        color={getStatusColor(health.status)}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      System is operational
                    </Typography>
                    <Typography color="textSecondary" variant="caption">
                      {new Date(health.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* API Server */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={<CheckCircleIcon sx={{ color: 'success.main' }} />}
                    title="API Server"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label="Running"
                        color="success"
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Uptime: {Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s
                    </Typography>
                    <Typography color="textSecondary" variant="caption">
                      Environment: {health.environment}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Memory Usage */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    title="Memory Usage"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Heap: {formatBytes(health.memory.heapUsed)} / {formatBytes(health.memory.heapTotal)} MB
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(health.memory.heapUsed / health.memory.heapTotal) * 100}
                      sx={{ mt: 1, mb: 2 }}
                    />
                    <Typography color="textSecondary" variant="caption">
                      RSS: {formatBytes(health.memory.rss)} MB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Process Info */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    title="External Memory"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      External: {formatBytes(health.memory.external)} MB
                    </Typography>
                    <Typography color="textSecondary" variant="caption">
                      (Memory used by native addons)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed Memory Table */}
            <Card>
              <CardHeader title="Memory Details" />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">MB</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>RSS (Resident Set Size)</TableCell>
                      <TableCell align="right">{health.memory.rss}</TableCell>
                      <TableCell align="right">{formatBytes(health.memory.rss)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Heap Total</TableCell>
                      <TableCell align="right">{health.memory.heapTotal}</TableCell>
                      <TableCell align="right">{formatBytes(health.memory.heapTotal)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Heap Used</TableCell>
                      <TableCell align="right">{health.memory.heapUsed}</TableCell>
                      <TableCell align="right">{formatBytes(health.memory.heapUsed)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>External</TableCell>
                      <TableCell align="right">{health.memory.external}</TableCell>
                      <TableCell align="right">{formatBytes(health.memory.external)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        ) : null}
      </Box>
    </Container>
  );
};

export default HealthPage;
