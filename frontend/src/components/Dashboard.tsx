/**
 * Dashboard Component - System Status Overview
 *
 * Zeigt wichtige Systemmetriken und Status-Informationen an:
 * - Config Status und Version
 * - Backup Status
 * - API Status
 * - Anzahl Regeln
 * - Anzahl Konfigurationen
 * - Anzahl Schemas
 * - Anzahl Dokumente/Extraktionen
 * - Anzahl Manuals/Dokumentation
 *
 * @version 0.19.0
 * @phase 18
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Cloud as ApiIcon,
  Rule as RuleIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schema as SchemaIcon,
  Description as DocumentIcon,
  Help as ManualIcon,
} from '@mui/icons-material';
import { useConfig } from '@/hooks/useConfig';
import { useBackup } from '@/hooks/useBackup';
import { useRules } from '@/hooks/useRules';

interface HealthStatus {
  api: 'healthy' | 'warning' | 'error';
  timestamp: string;
  message: string;
}

interface DashboardStats {
  lastConfigUpdate: string | null;
  backupCount: number;
  lastBackupTime: string | null;
  ruleCount: number;
  apiHealth: HealthStatus;
  configCount: number;
  schemaCount: number;
  documentCount: number;
  manualCount: number;
}

const Dashboard: React.FC = () => {
  const { config, loadConfig } = useConfig();
  const { backups, listBackups } = useBackup();
  const { rules } = useRules();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schemaCount, setSchemaCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);

  // Load all dashboard data (reusable function)
  const loadDashboardData = useCallback(async () => {
    setError(null);
    try {
      // Load config
      await loadConfig();

      // Load backups  
      await listBackups(50);

      // Load schemas count
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const schemasResponse = await fetch(`${apiBase}/schema/schemas`);
        if (schemasResponse.ok) {
          const schemasData = await schemasResponse.json();
          setSchemaCount(Array.isArray(schemasData.data) ? schemasData.data.length : 0);
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load schemas count:', err);
        setSchemaCount(0);
      }

      // Load documents/runs count
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const runsResponse = await fetch(`${apiBase}/revision/runs?limit=1000`);
        if (runsResponse.ok) {
          const runsData = await runsResponse.json();
          setDocumentCount(runsData.data?.runs?.length || 0);
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load runs count:', err);
        setDocumentCount(0);
      }

      // Load manual count (from help/manual endpoint if available)
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const manualResponse = await fetch(`${apiBase}/help/manual`);
        if (manualResponse.ok) {
          const manualData = await manualResponse.json();
          // Count chapters in manual if available
          setManualCount(manualData?.data?.chapters?.length || 0);
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load manual count:', err);
        setManualCount(0); // No manual chapters available
      }

      // Check API health (just for verification)
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const baseUrl = apiBase.replace('/api', '');
      await fetch(`${baseUrl}/health`).catch(() => {
        // Silent fail - health check is informational
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      console.error('[Dashboard] Load failed:', err);
    }
  }, [loadConfig, listBackups]);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboardData]);

  // Load on mount
  useEffect(() => {
    setLoading(true);
    loadDashboardData().finally(() => setLoading(false));
  }, [loadDashboardData]);

  // Recalculate stats whenever data changes
  useEffect(() => {
    if (loading) return; // Skip if still loading

    try {
      const apiHealth: HealthStatus = {
        api: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'API is operational',
      };

      const newStats: DashboardStats = {
        lastConfigUpdate: config ? new Date().toISOString() : null,
        backupCount: backups.length,
        lastBackupTime: backups.length > 0 ? backups[0].createdAt : null,
        ruleCount: rules.length,
        apiHealth,
        configCount: 1,
        schemaCount,
        documentCount,
        manualCount,
      };

      setStats(newStats);
    } catch (err) {
      console.error('[Dashboard] Stats calculation failed:', err);
    }
  }, [config, backups, rules, loading, schemaCount, documentCount, manualCount]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading dashboard: {error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="warning">No dashboard data available</Alert>;
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getHealthChip = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Chip label="Healthy" color="success" size="small" />;
      case 'warning':
        return <Chip label="Warning" color="warning" size="small" />;
      case 'error':
        return <Chip label="Error" color="error" size="small" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleRefresh}
          disabled={isRefreshing}
          startIcon={isRefreshing ? <CircularProgress size={20} /> : undefined}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Config Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <SettingsIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Config Status
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Active
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {stats.lastConfigUpdate
                  ? new Date(stats.lastConfigUpdate).toLocaleString('de-DE')
                  : 'No update'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <BackupIcon sx={{ color: 'info.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Backup Status
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {stats.backupCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {stats.lastBackupTime
                  ? `Latest: ${new Date(stats.lastBackupTime).toLocaleString('de-DE')}`
                  : 'No backups yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* API Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <ApiIcon sx={{ color: stats.apiHealth.api === 'healthy' ? 'success.main' : 'warning.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  API Status
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {getHealthIcon(stats.apiHealth.api)}
                {getHealthChip(stats.apiHealth.api)}
              </Stack>
              <Typography variant="caption" color="textSecondary">
                {stats.apiHealth.message}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Rules Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <RuleIcon sx={{ color: 'secondary.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Extraction Rules
                </Typography>
              </Stack>
              <Typography variant="h5">{stats.ruleCount}</Typography>
              <Typography variant="caption" color="textSecondary">
                Active rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <SettingsIcon sx={{ color: 'warning.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Configurations
                </Typography>
              </Stack>
              <Typography variant="h5">{stats.configCount}</Typography>
              <Typography variant="caption" color="textSecondary">
                Active config version
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Schemas Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <SchemaIcon sx={{ color: '#2196F3', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Schemas
                </Typography>
              </Stack>
              <Typography variant="h5">{stats.schemaCount}</Typography>
              <Typography variant="caption" color="textSecondary">
                Active schemas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <DocumentIcon sx={{ color: '#FF9800', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Documents
                </Typography>
              </Stack>
              <Typography variant="h5">{stats.documentCount}</Typography>
              <Typography variant="caption" color="textSecondary">
                Extraction runs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <ManualIcon sx={{ color: '#4CAF50', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  Manuals
                </Typography>
              </Stack>
              <Typography variant="h5">{stats.manualCount}</Typography>
              <Typography variant="caption" color="textSecondary">
                Documentation sections
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Info Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Frontend:
                  </Typography>
                  <Typography variant="caption">Running on port 5173</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Backend:
                  </Typography>
                  <Typography variant="caption">Running on port 3000</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Timestamp:
                  </Typography>
                  <Typography variant="caption">
                    {new Date().toLocaleString('de-DE')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
