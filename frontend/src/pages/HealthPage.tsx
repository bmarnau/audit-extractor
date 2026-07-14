/**
 * Health Status Page Component
 * 
 * Displays system health status, database connectivity, cache status,
 * and service availability checks
 * 
 * @version 0.34.0
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
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    connections: number;
    maxConnections: number;
  };
  cache: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    memory: number;
    maxMemory: number;
    hitRate: number;
  };
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastCheck: string;
  }>;
  api: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  timestamp: string;
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
            {/* Overall Status Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Database Health */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={getStatusIcon(health.database.status)}
                    title="Database"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label={health.database.status}
                        color={getStatusColor(health.database.status)}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Response Time: {health.database.responseTime}ms
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Connections: {health.database.connections}/{health.database.maxConnections}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(health.database.connections / health.database.maxConnections) * 100}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Cache Health */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={getStatusIcon(health.cache.status)}
                    title="Cache (Redis)"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label={health.cache.status}
                        color={getStatusColor(health.cache.status)}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Memory: {(health.cache.memory / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Hit Rate: {(health.cache.hitRate * 100).toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(health.cache.memory / health.cache.maxMemory) * 100}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* API Health */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={getStatusIcon(health.api.status)}
                    title="API Server"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label={health.api.status}
                        color={getStatusColor(health.api.status)}
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Uptime: {Math.floor(health.api.uptime / 60)}m
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Req/sec: {health.api.requestsPerSecond.toFixed(2)}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Error Rate: {(health.api.errorRate * 100).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* System Status */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    title="System"
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Chip
                        label="OK"
                        color="success"
                        size="small"
                      />
                    }
                  />
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      All systems operational
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Last check: {new Date(health.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Services Table */}
            {health.services && health.services.length > 0 && (
              <Card>
                <CardHeader title="Service Status" />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell>Service</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Response Time (ms)</TableCell>
                        <TableCell align="right">Last Check</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {health.services.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(service.status)}
                              {service.name}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={service.status}
                              color={getStatusColor(service.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{service.responseTime}</TableCell>
                          <TableCell align="right">
                            {new Date(service.lastCheck).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        ) : null}
      </Box>
    </Container>
  );
};

export default HealthPage;
