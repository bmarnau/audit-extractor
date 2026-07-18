/**
 * Compact Management Overview - Phase 1-15 Implementation
 * 
 * Managementübersicht für Geschäftsführung und Projektleitung
 * Kompakte Darstellung der wesentlichen Aussagen
 * Keine technischen Detailinformationen auf dieser Seite
 * 
 * @version 0.37.1
 * @phase 45+ Management Overview
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  GetApp as DownloadIcon,
  Dashboard as ManagementIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { ManagementStatusService } from '@/services/ManagementStatusService';
import { CompactManagementStatus, StatusValue, ReleaseCriterion, ManagementRisk, ManagementAction } from '@/types/management';

/**
 * KPI Card Component - Compact status display
 */
const KPICard: React.FC<{
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info';
  subtext?: string;
  icon?: React.ReactNode;
}> = ({ label, value, status, subtext, icon }) => {
  const theme = useTheme();
  
  const statusColors = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const getIcon = () => {
    switch (status) {
      case 'success': return <CheckIcon sx={{ fontSize: 40, color: statusColors.success }} />;
      case 'warning': return <WarningIcon sx={{ fontSize: 40, color: statusColors.warning }} />;
      case 'error': return <ErrorIcon sx={{ fontSize: 40, color: statusColors.error }} />;
      default: return icon || <CheckIcon sx={{ fontSize: 40, color: statusColors.info }} />;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `4px solid ${statusColors[status]}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={2}>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {label}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getIcon()}
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
          </Box>
          
          {subtext && (
            <Typography variant="body2" color="textSecondary">
              {subtext}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Maturity Badge Component
 */
const MaturityBadge: React.FC<{ status: 'offen' | 'in_arbeit' | 'weitgehend_erfüllt' | 'erfüllt' }> = ({ status }) => {
  const statusMap = {
    'offen': { label: 'Offen', color: 'error' as const },
    'in_arbeit': { label: 'In Arbeit', color: 'warning' as const },
    'weitgehend_erfüllt': { label: 'Weitgehend erfüllt', color: 'info' as const },
    'erfüllt': { label: 'Erfüllt', color: 'success' as const },
  };
  
  const { label, color } = statusMap[status];
  return <Chip label={label} color={color} size="small" />;
};

/**
 * Main Management Overview Page
 */
const ManagementPage: React.FC = () => {
  const [data, setData] = useState<CompactManagementStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Load management status data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const status = await ManagementStatusService.getCompactStatus();
        setData(status);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load management status:', err);
        setError('Management status data konnte nicht geladen werden. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle PDF export
  const handlePdfExport = async () => {
    try {
      await ManagementStatusService.exportPdf(data);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export fehlgeschlagen. Bitte versuchen Sie es später erneut.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography>Management Übersicht wird geladen...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Daten konnten nicht geladen werden'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* SECTION 1: HEADER */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <ManagementIcon sx={{ fontSize: 32 }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Management Übersicht
              </Typography>
            </Stack>
            <Typography variant="body2" color="textSecondary">
              {data.project.productName}
            </Typography>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Chip
              label={`v${data.project.version}`}
              variant="outlined"
              size="medium"
            />
            <Chip
              label={data.project.releaseStatus}
              color={data.summary.overallStatus === 'Production Ready' ? 'success' : 'warning'}
              size="medium"
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handlePdfExport}
              size={isMobile ? 'small' : 'medium'}
            >
              PDF
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Management Summary */}
        <Paper
          sx={{
            p: 2.5,
            backgroundColor: 'background.default',
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Management Summary
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            {data.summary.text}
          </Typography>
        </Paper>
      </Box>

      {/* SECTION 2: KPI CARDS (6 zentrale Metriken) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Zentrale Statuskarten
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Projektversion"
              value={data.kpis.version.value}
              status={data.kpis.version.status as any}
              subtext={data.kpis.version.details}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Release-Status"
              value={data.kpis.releaseStatus.value}
              status={data.kpis.releaseStatus.status as any}
              subtext={data.kpis.releaseStatus.details}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Buildstatus"
              value={data.kpis.build.value}
              status={data.kpis.build.status as any}
              subtext={data.kpis.build.details}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Teststatus"
              value={data.kpis.tests.value}
              status={data.kpis.tests.status as any}
              subtext={data.kpis.tests.details}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Reifegrad"
              value={data.kpis.maturity.value}
              status={data.kpis.maturity.status as any}
              subtext={data.kpis.maturity.details}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              label="Kritische Risiken"
              value={data.kpis.criticalRisks.value}
              status={data.kpis.criticalRisks.status as any}
              subtext={data.kpis.criticalRisks.details}
            />
          </Grid>
        </Grid>
      </Box>

      {/* SECTION 3: MATURITY & RELEASE READINESS */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Reifegrad */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Reifegrad"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={2}>
                  {data.maturity.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{item.area}</Typography>
                      <MaturityBadge status={item.status} />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Release Readiness */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Release Readiness"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Alert severity={data.releaseReadiness.decision.includes('nicht') ? 'error' : 'success'}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.releaseReadiness.decision}
                    </Typography>
                  </Alert>

                  <Divider />

                  <Stack spacing={1}>
                    {data.releaseReadiness.criteria.slice(0, 5).map((criterion, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          backgroundColor: criterion.status === 'erfüllt' ? 'success.lighter' : 'warning.lighter',
                          borderRadius: 1,
                        }}
                      >
                        {criterion.status === 'erfüllt' ? (
                          <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
                        ) : (
                          <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                        )}
                        <Typography variant="body2">{criterion.name}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* SECTION 4: NUTZEN & ROLLE (wird in separater Datei fortgesetzt) */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Geschäftlicher Nutzen */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Geschäftlicher Nutzen"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={1} component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                  {data.benefits.business.map((benefit, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      • {benefit}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Rolle in der Reportfamilie */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Rolle in der Reportfamilie"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={2} sx={{ fontSize: '0.875rem' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" display="block">Dokumente</Typography>
                    <Typography sx={{ my: 1 }}>↓</Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'primary.lighter',
                      borderRadius: 1,
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    Audit Extractor
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ my: 1 }}>↓</Typography>
                    <Typography variant="caption" display="block">Strukturierte JSON-Daten</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ my: 1 }}>↓</Typography>
                    <Typography variant="caption" display="block">Reports und weitere Systeme</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* SECTION 5: RISIKEN & NÄCHSTE SCHRITTE */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Risiken (max 3) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Wichtigste Risiken"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  {data.risks.slice(0, 3).map((risk, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        backgroundColor: risk.priority === 'critical' ? 'error.lighter' : 'warning.lighter',
                        borderRadius: 1,
                        borderLeft: `3px solid ${risk.priority === 'critical' ? 'error.main' : 'warning.main'}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {risk.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {risk.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Nächste Schritte (max 3) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Nächste Schritte"
                titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  {data.nextSteps.slice(0, 3).map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        backgroundColor: 'success.lighter',
                        borderRadius: 1,
                        borderLeft: '3px solid success.main',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {step.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* SECTION 6: WEITERFÜHRENDE LINKS */}
      <Box>
        <Card>
          <CardHeader
            title="Weiterführende Informationen"
            titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
          />
          <CardContent>
            <Grid container spacing={1}>
              {data.links.map((link, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    href={link.url}
                  >
                    {link.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Last Updated */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Aktualisiert: {new Date(data.project.updatedAt).toLocaleDateString('de-DE')}
        </Typography>
      </Box>
    </Container>
  );
};

export default ManagementPage;
