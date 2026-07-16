/**
 * API Documentation Page - Phase 41
 * 
 * Displays comprehensive API documentation for Audit-Safe Extractor
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Code as CodeIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Record<string, string>;
  responses?: Record<string, string>;
}

const ApiDocsPage: React.FC = () => {
  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiBase}/docs`);
        if (!response.ok) throw new Error('Failed to load API documentation');
        const data = await response.json();
        setDocs(data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
        // Set fallback docs
        setDocs(getFallbackDocs());
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  const getFallbackDocs = () => ({
    title: 'Audit-Safe Document Extractor API',
    version: '0.35.0',
    description: 'REST API for document extraction, schema management, and audit support',
    baseUrl: 'http://localhost:3000/api',
    endpoints: [
      {
        path: '/system/wakeup',
        method: 'POST',
        description: 'Initialize system with database, Redis, and services',
        responses: { 200: 'System initialized successfully' },
      },
      {
        path: '/system/wakeup/status',
        method: 'GET',
        description: 'Get current system initialization status and quality metrics',
        responses: { 200: 'System status and component states' },
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Get system health status and metrics',
        responses: { 200: 'Health report with memory and uptime' },
      },
      {
        path: '/schemas',
        method: 'GET',
        description: 'List all extraction schemas',
        parameters: { page: 'number', limit: 'number' },
        responses: { 200: 'Array of schemas' },
      },
      {
        path: '/schema/:id',
        method: 'GET',
        description: 'Get specific schema metadata',
        responses: { 200: 'Schema object' },
      },
      {
        path: '/rules',
        method: 'GET',
        description: 'List extraction rules',
        responses: { 200: 'Array of rules' },
      },
      {
        path: '/jobs',
        method: 'GET',
        description: 'List extraction jobs',
        responses: { 200: 'Array of jobs' },
      },
      {
        path: '/logs',
        method: 'GET',
        description: 'Get system logs with filtering',
        parameters: { level: 'string', source: 'string', limit: 'number' },
        responses: { 200: 'Array of log entries' },
      },
      {
        path: '/settings',
        method: 'GET',
        description: 'Get application settings and configuration',
        responses: { 200: 'Settings object' },
      },
      {
        path: '/backup',
        method: 'POST',
        description: 'Create system backup',
        responses: { 200: 'Backup created successfully' },
      },
    ],
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="api-docs" sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CodeIcon sx={{ fontSize: 32, color: '#1976d2' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              API Documentation
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Complete REST API reference for Audit-Safe Extractor
            </Typography>
          </Box>
        </Box>
        <Divider />
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Displaying default documentation
        </Alert>
      )}

      {docs && (
        <>
          {/* API Overview */}
          <Card sx={{ mb: 4, backgroundColor: '#f5f5f5' }}>
            <CardHeader title="API Overview" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    API Title
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {docs.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Version
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {docs.version}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Base URL
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.875rem' }}
                  >
                    {docs.baseUrl}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Endpoints
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {docs.endpoints?.length || 0}
                  </Typography>
                </Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 2 }}>
                {docs.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Endpoints Table */}
          <Card>
            <CardHeader title="API Endpoints" subheader={`${docs.endpoints?.length || 0} endpoints available`} />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Path</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {docs.endpoints && docs.endpoints.map((endpoint: ApiEndpoint, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            label={endpoint.method}
                            size="small"
                            color={
                              endpoint.method === 'GET'
                                ? 'info'
                                : endpoint.method === 'POST'
                                  ? 'success'
                                  : endpoint.method === 'PUT'
                                    ? 'warning'
                                    : 'error'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {endpoint.path}
                        </TableCell>
                        <TableCell>{endpoint.description}</TableCell>
                        <TableCell>
                          <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Authentication Info */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="Authentication & Authorization" />
            <CardContent>
              <Alert icon={<InfoIcon />} severity="info" sx={{ mb: 2 }}>
                Most endpoints are accessible without authentication during development. In production, implement
                OAuth 2.0 or API key authentication.
              </Alert>
              <Typography variant="body2">
                All API responses follow a standardized format:
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  mt: 1,
                  fontSize: '0.875rem',
                }}
              >
                {`{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2026-07-16T09:45:00Z",
  "version": "0.35.0"
}`}
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default ApiDocsPage;
