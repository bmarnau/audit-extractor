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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Cloud as ApiIcon,
  Dataset as DatabaseIcon,
  Rule as RuleIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schema as SchemaIcon,
  Description as DocumentIcon,
  Help as ManualIcon,
  VolumeOff as OfflineIcon,
  Refresh as RestartIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { useConfig } from '@/hooks/useConfig';
import { useBackup } from '@/hooks/useBackup';
import { useRules } from '@/hooks/useRules';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  message: string;
}

interface BuildInfo {
  version: string;
  buildTime: string;
  buildNumber: string;
  environment: string;
  timestamp: string;
  uptime: number;
  gitInfo?: {
    branch: string;
    shortHash: string;
    isDirty: boolean;
    lastCommitTime: string;
  };
  frontendVersion?: string;
  backendVersion?: string;
  versionMatch?: boolean;
  syncStatus?: 'synced' | 'mismatched' | 'unknown';
}

interface GitSyncInfo {
  isSynced: boolean;
  syncMessage: string;
  remote?: {
    branch: string;
    status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'unknown';
    commitsAhead: number;
    commitsBehind: number;
    lastPush: string;
  };
  buildNumberAtLastSync?: string;
}

interface DashboardStats {
  lastConfigUpdate: string | null;
  backupCount: number;
  lastBackupTime: string | null;
  ruleCount: number;
  apiHealth: HealthStatus;
  databaseHealth: HealthStatus;
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
  const [databaseHealth, setDatabaseHealth] = useState<HealthStatus>({
    status: 'error',
    timestamp: new Date().toISOString(),
    message: 'Checking database...',
  });
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [gitSyncInfo, setGitSyncInfo] = useState<GitSyncInfo | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [restartMessage, setRestartMessage] = useState('');

  // Load all dashboard data (reusable function)
  const loadDashboardData = useCallback(async () => {
    setError(null);
    try {
      // Check database health FIRST (critical for persistence)
      let dbHealth: HealthStatus = {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed - schemas will NOT persist after restart',
      };

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const dbCheckResponse = await fetch(`${apiBase}/health/database`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        
        if (dbCheckResponse.ok) {
          const dbStatus = await dbCheckResponse.json();
          if (dbStatus.database === 'connected') {
            dbHealth = {
              status: 'healthy',
              timestamp: new Date().toISOString(),
              message: 'Database connected - data will persist ✅',
            };
          } else {
            dbHealth = {
              status: 'warning',
              timestamp: new Date().toISOString(),
              message: `Database warning: ${dbStatus.message || 'Connection unstable'}`,
            };
          }
        } else {
          dbHealth = {
            status: 'error',
            timestamp: new Date().toISOString(),
            message: `Database error: ${dbCheckResponse.statusText}`,
          };
        }
      } catch (dbErr) {
        dbHealth = {
          status: 'error',
          timestamp: new Date().toISOString(),
          message: `⚠️ Database offline - schemas in memory only (IN-MEMORY MODE)`,
        };
        console.error('[Dashboard] Database health check failed:', dbErr);
      }

      // If DB is offline, show warning to user
      if (dbHealth.status === 'error') {
        setError(
          `CRITICAL: Database is offline! Your schemas are stored in memory and will be LOST after restart.\n\n` +
          `To fix this:\n` +
          `1. Start Docker Desktop\n` +
          `2. Run: docker-compose up -d\n` +
          `3. Restart the backend: npm run dev\n\n` +
          `See: COMPREHENSIVE_CHECK_GUIDE.md for details.`
        );
      }

      // Store database health for display
      setDatabaseHealth(dbHealth);

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

      // Load build info (for Dashboard System Information display)
      try {
        const buildController = new AbortController();
        const buildTimeout = setTimeout(() => buildController.abort(), 2000);
        
        const buildInfoResponse = await fetch(`${apiBase}/health/build`, {
          signal: buildController.signal,
        });
        clearTimeout(buildTimeout);
        
        if (buildInfoResponse.ok) {
          const buildData = await buildInfoResponse.json();
          setBuildInfo(buildData);
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load build info:', err);
        // Not critical - continue without build info
      }

      // Load Git Sync info (for Dashboard GitHub Sync Status)
      try {
        const syncController = new AbortController();
        const syncTimeout = setTimeout(() => syncController.abort(), 2000);
        
        const syncResponse = await fetch(`${apiBase}/health/sync`, {
          signal: syncController.signal,
        });
        clearTimeout(syncTimeout);
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          setGitSyncInfo(syncData);
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load git sync info:', err);
        // Not critical - continue without sync info
      }
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

  // Handle app restart with health check
  const handleRestart = useCallback(async () => {
    setIsRestarting(true);
    setRestartMessage('Initiating restart...');

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const baseUrl = apiBase.replace('/api', '');

      // Send restart request
      await fetch(`${apiBase}/health/restart`, { method: 'POST' }).catch(() => {
        // Expected - backend will close connection
      });

      // Wait 3 seconds for restart
      setRestartMessage('Backend restarting (waiting 3 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if backend is healthy again
      setRestartMessage('Checking backend health...');
      let healthy = false;
      let attempts = 0;

      while (!healthy && attempts < 10) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          
          const healthResponse = await fetch(`${baseUrl}/health`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          
          if (healthResponse.ok) {
            healthy = true;
            setRestartMessage('Backend is healthy again! Reloading dashboard...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await loadDashboardData();
            setRestartMessage('✅ Restart successful!');
            setTimeout(() => {
              setShowRestartDialog(false);
              setRestartMessage('');
            }, 2000);
          }
        } catch {
          attempts++;
          if (attempts < 10) {
            setRestartMessage(`Waiting for backend (attempt ${attempts + 1}/10)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!healthy) {
        setRestartMessage('❌ Backend failed to restart. Please check logs.');
      }
    } catch (err) {
      setRestartMessage(`Restart error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRestarting(false);
    }
  }, [loadDashboardData]);

  // Confirm restart dialog
  const handleConfirmRestart = () => {
    setShowRestartDialog(true);
    handleRestart();
  };

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
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'API is operational',
      };

      const newStats: DashboardStats = {
        lastConfigUpdate: config ? new Date().toISOString() : null,
        backupCount: backups.length,
        lastBackupTime: backups.length > 0 ? backups[0].createdAt : null,
        ruleCount: rules.length,
        apiHealth,
        databaseHealth,
        configCount: 1,
        schemaCount,
        documentCount,
        manualCount,
      };

      setStats(newStats);
    } catch (err) {
      console.error('[Dashboard] Stats calculation failed:', err);
    }
  }, [config, backups, rules, loading, schemaCount, documentCount, manualCount, databaseHealth]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3, p: 2, '& .MuiAlert-message': { width: '100%' } }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: 'error.main' }}>
            ⚠️ CRITICAL ISSUE: Database Connection Failed
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {error}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => window.open('COMPREHENSIVE_CHECK_GUIDE.md')}
              size="small"
            >
              View Help Guide
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
              size="small"
            >
              Retry
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
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
        {/* CRITICAL: Database Status Card (Show first if error) */}
        {stats.databaseHealth.status !== 'healthy' && (
          <Grid item xs={12}>
            <Card sx={{ 
              bgcolor: stats.databaseHealth.status === 'error' ? 'error.light' : 'warning.light',
              border: `2px solid ${stats.databaseHealth.status === 'error' ? '#d32f2f' : '#f57c00'}`,
            }}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ mt: 0.5 }}>
                    {stats.databaseHealth.status === 'error' ? (
                      <OfflineIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    ) : (
                      <WarningIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ 
                      color: stats.databaseHealth.status === 'error' ? 'error.main' : 'warning.main',
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      {stats.databaseHealth.status === 'error' 
                        ? '🚨 Database Connection Failed' 
                        : '⚠️ Database Warning'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      {stats.databaseHealth.message}
                    </Typography>
                    {stats.databaseHealth.status === 'error' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>IMPACT:</strong> Schemas, backups, and jobs are stored in memory only and will be LOST after restart!
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

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
                <ApiIcon sx={{ color: stats.apiHealth.status === 'healthy' ? 'success.main' : 'warning.main', mt: 0.5 }} />
                <Typography color="textSecondary" gutterBottom>
                  API Status
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {getHealthIcon(stats.apiHealth.status)}
                {getHealthChip(stats.apiHealth.status)}
              </Stack>
              <Typography variant="caption" color="textSecondary">
                {stats.apiHealth.message}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Status Card (if healthy or warning) */}
        {stats.databaseHealth.status !== 'error' && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderLeft: `4px solid ${stats.databaseHealth.status === 'healthy' ? '#2e7d32' : '#f57c00'}`,
            }}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <DatabaseIcon sx={{ color: stats.databaseHealth.status === 'healthy' ? 'success.main' : 'warning.main', mt: 0.5 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Database Status
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {getHealthIcon(stats.databaseHealth.status)}
                  {getHealthChip(stats.databaseHealth.status)}
                </Stack>
                <Typography variant="caption" color="textSecondary">
                  {stats.databaseHealth.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

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

        {/* System Info Card - Phase 22: Extended Build & Git Tracking */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  System Information & Build Tracking
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleConfirmRestart}
                  disabled={isRestarting}
                  startIcon={isRestarting ? <CircularProgress size={16} /> : <RestartIcon />}
                >
                  {isRestarting ? 'Restarting...' : 'Restart Backend'}
                </Button>
              </Box>
              
              <Stack spacing={2}>
                {/* Build Information */}
                {buildInfo && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                      🔨 BUILD INFORMATION
                    </Typography>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Version:</Typography>
                        <Chip 
                          label={buildInfo.version} 
                          size="small" 
                          color={buildInfo.versionMatch ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Build #:</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {buildInfo.buildNumber === 'unknown' ? '⏳ Dev Build' : buildInfo.buildNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Build Time:</Typography>
                        <Typography variant="caption">
                          {new Date(buildInfo.buildTime).toLocaleString('de-DE')}
                        </Typography>
                      </Box>
                      {buildInfo.frontendVersion && buildInfo.backendVersion && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="textSecondary">Frontend Version:</Typography>
                            <Chip 
                              label={buildInfo.frontendVersion} 
                              size="small" 
                              color={buildInfo.frontendVersion === buildInfo.version ? 'success' : 'error'}
                              variant="filled"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="textSecondary">Backend Version:</Typography>
                            <Chip 
                              label={buildInfo.backendVersion} 
                              size="small" 
                              color={buildInfo.backendVersion === buildInfo.version ? 'success' : 'error'}
                              variant="filled"
                            />
                          </Box>
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Git Information */}
                {buildInfo?.gitInfo && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                      🌳 GIT STATUS
                    </Typography>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Branch:</Typography>
                        <Chip label={buildInfo.gitInfo.branch} size="small" variant="outlined" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Commit:</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {buildInfo.gitInfo.shortHash}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Status:</Typography>
                        <Chip 
                          label={buildInfo.gitInfo.isDirty ? '⚠️ Uncommitted' : '✅ Clean'} 
                          size="small" 
                          color={buildInfo.gitInfo.isDirty ? 'warning' : 'success'}
                          variant="filled"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Last Commit:</Typography>
                        <Typography variant="caption">
                          {new Date(buildInfo.gitInfo.lastCommitTime).toLocaleString('de-DE')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                {/* GitHub Sync Information */}
                {gitSyncInfo && (
                  <Box sx={{ pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                      🔄 GITHUB SYNC
                    </Typography>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="textSecondary">Status:</Typography>
                        <Chip 
                          label={gitSyncInfo.syncMessage.includes('✅') ? '✅ Synced' : '⚠️ Not Synced'} 
                          size="small" 
                          color={gitSyncInfo.isSynced ? 'success' : 'warning'}
                          variant="filled"
                        />
                      </Box>
                      {gitSyncInfo.remote && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="textSecondary">Remote Status:</Typography>
                            <Chip label={gitSyncInfo.remote.status} size="small" variant="outlined" />
                          </Box>
                          {(gitSyncInfo.remote.commitsAhead > 0 || gitSyncInfo.remote.commitsBehind > 0) && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="textSecondary">Position:</Typography>
                              <Typography variant="caption">
                                {gitSyncInfo.remote.commitsAhead > 0 && `🔼 ${gitSyncInfo.remote.commitsAhead} ahead`}
                                {gitSyncInfo.remote.commitsBehind > 0 && `🔽 ${gitSyncInfo.remote.commitsBehind} behind`}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="textSecondary">Last Push:</Typography>
                            <Typography variant="caption">
                              {gitSyncInfo.remote.lastPush !== 'unknown' 
                                ? new Date(gitSyncInfo.remote.lastPush).toLocaleString('de-DE')
                                : 'unknown'}
                            </Typography>
                          </Box>
                        </>
                      )}
                      {gitSyncInfo.buildNumberAtLastSync && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">Build @ Sync:</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                            {gitSyncInfo.buildNumberAtLastSync}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Runtime Information */}
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                    ⚙️ RUNTIME
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary">Frontend:</Typography>
                      <Typography variant="caption">Port 5173</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary">Backend:</Typography>
                      <Typography variant="caption">Port 3000</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary">Timestamp:</Typography>
                      <Typography variant="caption">
                        {new Date().toLocaleString('de-DE')}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Version Mismatch Warning - Phase 22 */}
        {buildInfo && !buildInfo.versionMatch && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ff9800' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon sx={{ color: '#ff9800', fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      ⚠️ Version Mismatch Detected
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Frontend and Backend versions do not match. This can cause unexpected behavior.
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      🔧 Fix: Run <code>npm run sync:versions</code> to synchronize versions across all components
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Git Divergence Warning - Phase 22 */}
        {gitSyncInfo && gitSyncInfo.remote?.status === 'diverged' && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <OfflineIcon sx={{ color: '#f44336', fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      🔴 Git Branches Diverged
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Local and remote branches have diverged. Manual reconciliation required.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* GitHub Sync Status Card - Phase 22 */}
        {gitSyncInfo && !gitSyncInfo.isSynced && gitSyncInfo.remote?.status !== 'diverged' && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HourglassEmptyIcon sx={{ color: '#2196f3', fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      ℹ️ GitHub Sync Pending
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {gitSyncInfo.syncMessage}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Restart Dialog */}
        <Dialog
          open={showRestartDialog}
          onClose={() => !isRestarting && setShowRestartDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Backend Restart</DialogTitle>
          <DialogContent sx={{ minHeight: 100 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
              {isRestarting && <CircularProgress />}
              <Typography variant="body2" align="center">
                {restartMessage}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowRestartDialog(false)}
              disabled={isRestarting}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default Dashboard;
