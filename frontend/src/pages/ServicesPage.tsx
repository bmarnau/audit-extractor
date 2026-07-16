/**
 * Services Page - System Services Management
 * 
 * Displays and manages system services status
 * 
 * @version 0.37.1
 * @phase 38C
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/material';
import {
  Cloud as ServiceIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastCheck: string;
  description: string;
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        
        // Fetch health status which includes services
        const response = await fetch(`${apiBase}/health`);
        if (!response.ok) throw new Error('Failed to load services');
        
        const data = await response.json();
        
        // Map health response to services
        const mockServices: Service[] = [
          {
            id: 'database',
            name: 'Database (PostgreSQL)',
            status: data.database?.status === 'healthy' ? 'healthy' : 'error',
            uptime: 99.9,
            lastCheck: new Date().toISOString(),
            description: 'Main data persistence layer',
          },
          {
            id: 'cache',
            name: 'Cache (Redis)',
            status: data.cache?.status === 'healthy' ? 'healthy' : 'warning',
            uptime: 99.8,
            lastCheck: new Date().toISOString(),
            description: 'Session and data caching',
          },
          {
            id: 'api',
            name: 'API Server',
            status: data.status === 'healthy' ? 'healthy' : 'error',
            uptime: 99.95,
            lastCheck: new Date().toISOString(),
            description: 'REST API and business logic',
          },
          {
            id: 'frontend',
            name: 'Frontend Service',
            status: 'healthy',
            uptime: 100,
            lastCheck: new Date().toISOString(),
            description: 'Web UI and static assets',
          },
        ];
        
        setServices(mockServices);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="services" sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          System Services
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Monitor and manage all system services
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ServiceIcon />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Services
                  </Typography>
                  <Typography variant="h5">
                    {services.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HealthyIcon sx={{ color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Healthy
                  </Typography>
                  <Typography variant="h5">
                    {services.filter((s) => s.status === 'healthy').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Warning
                  </Typography>
                  <Typography variant="h5">
                    {services.filter((s) => s.status === 'warning').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ color: 'error.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Errors
                  </Typography>
                  <Typography variant="h5">
                    {services.filter((s) => s.status === 'error').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Services Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>Service Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uptime</TableCell>
                <TableCell>Last Check</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(service.status)}
                      <Chip
                        label={service.status}
                        color={getStatusColor(service.status) as any}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{service.uptime.toFixed(2)}%</TableCell>
                  <TableCell>
                    {new Date(service.lastCheck).toLocaleString()}
                  </TableCell>
                  <TableCell>{service.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ServicesPage;
