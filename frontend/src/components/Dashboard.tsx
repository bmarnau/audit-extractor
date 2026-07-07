/**
 * Dashboard Component - System Status Overview
 *
 * Zeigt wichtige Systemmetriken und Status-Informationen an:
 * - Config Status und Version
 * - Backup Status
 * - API Status
 * - Anzahl Regeln
 * - Anzahl Konfigurationen
 *
 * @version 0.13.0
 * @phase 13
 */

import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Cloud as ApiIcon,
  Rule as RuleIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
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
}

const Dashboard: React.FC = () => {
  const { config, loadConfig } = useConfig();
  const { backups, listBackups } = useBackup();
  const { rules } = useRules();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all dashboard data on mount only
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load config
        await loadConfig();

        // Load backups
        await listBackups(50);

        // Check API health
        const healthResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/health`
        );
        const apiHealth: HealthStatus = healthResponse.ok
          ? { api: 'healthy', timestamp: new Date().toISOString(), message: 'API is operational' }
          : { api: 'warning', timestamp: new Date().toISOString(), message: 'API response slow' };

        // Calculate stats
        const newStats: DashboardStats = {
          lastConfigUpdate: config ? new Date().toISOString() : null,
          backupCount: backups.length,
          lastBackupTime: backups.length > 0 ? backups[0].createdAt : null,
          ruleCount: rules.length,
          apiHealth,
          configCount: 1, // Currently one active config
        };

        setStats(newStats);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
        console.error('[Dashboard] Load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

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
