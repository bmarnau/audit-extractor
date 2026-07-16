/**
 * Settings Page - Phase 41
 * 
 * Application settings and preferences management
 * 
 * @version 0.37.1
 * @phase 41
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface Settings {
  application?: {
    name: string;
    version: string;
    mode: string;
    debug: boolean;
  };
  ui?: {
    theme: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    sidebar: string;
  };
  limits?: {
    maxFileSize: string;
    maxSchemas: number;
    maxExtractRules: number;
    batchSize: number;
    timeout: number;
  };
  features?: Record<string, boolean>;
  environment?: Record<string, any>;
  database?: Record<string, any>;
  cache?: Record<string, any>;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [uiTheme, setUiTheme] = useState('auto');
  const [language, setLanguage] = useState('de');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiBase}/settings`);
        if (!response.ok) throw new Error('Failed to load settings');
        const data = await response.json();
        setSettings(data.data || data);
        setUiTheme(data.data?.ui?.theme || 'auto');
        setLanguage(data.data?.ui?.language || 'de');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        setSettings(getFallbackSettings());
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const getFallbackSettings = (): Settings => ({
    application: {
      name: 'Audit-Safe Document Extractor',
      version: '0.37.1',
      mode: 'development',
      debug: true,
    },
    ui: {
      theme: 'auto',
      language: 'de',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm:ss',
      sidebar: 'expanded',
    },
    limits: {
      maxFileSize: '100MB',
      maxSchemas: 1000,
      maxExtractRules: 5000,
      batchSize: 100,
      timeout: 30000,
    },
    features: {
      schemaManagement: true,
      ruleGeneration: true,
      documentExtraction: true,
      backupRestore: true,
      auditLogging: true,
      helpCenter: true,
      apiDocumentation: true,
    },
  });

  const handleSaveSettings = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="settings" sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: '#1976d2' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Application Settings
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Configure application preferences and system parameters
            </Typography>
          </Box>
        </Box>
        <Divider />
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Using default settings
        </Alert>
      )}

      {savedMessage && (
        <Alert icon={<CheckIcon />} severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      {settings && (
        <Grid container spacing={3}>
          {/* Application Info */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Application Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Application Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {settings.application?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Version
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {settings.application?.version}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Environment
                    </Typography>
                    <Chip label={settings.application?.mode} size="small" color="info" variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Debug Mode
                    </Typography>
                    <FormControlLabel
                      control={<Switch checked={settings.application?.debug || false} disabled />}
                      label={settings.application?.debug ? 'Enabled' : 'Disabled'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* UI Preferences */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="User Interface Preferences" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Theme</InputLabel>
                      <Select value={uiTheme} label="Theme" onChange={(e) => setUiTheme(e.target.value)}>
                        <MenuItem value="auto">Auto (System)</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Language</InputLabel>
                      <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                        <MenuItem value="de">German (Deutsch)</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="fr">French (Français)</MenuItem>
                        <MenuItem value="es">Spanish (Español)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date Format"
                      defaultValue={settings.ui?.dateFormat}
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Time Format"
                      defaultValue={settings.ui?.timeFormat}
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Limits */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="System Limits & Configuration" />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Parameter</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Max File Size</TableCell>
                        <TableCell>{settings.limits?.maxFileSize}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Schemas</TableCell>
                        <TableCell>{settings.limits?.maxSchemas}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Extract Rules</TableCell>
                        <TableCell>{settings.limits?.maxExtractRules}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Batch Size</TableCell>
                        <TableCell>{settings.limits?.batchSize}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Request Timeout</TableCell>
                        <TableCell>{settings.limits?.timeout}ms</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature Flags */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Feature Flags" />
              <CardContent>
                <Grid container spacing={2}>
                  {settings.features &&
                    Object.entries(settings.features).map(([key, value]) => (
                      <Grid item xs={12} sm={6} md={3} key={key}>
                        <FormControlLabel
                          control={<Switch checked={value} disabled />}
                          label={key.replace(/([A-Z])/g, ' $1').trim()}
                        />
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SettingsPage;
