import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/lab';
import { Download as DownloadIcon, Info as InfoIcon } from '@mui/icons-material';

interface VersionHistoryProps {
  schemaId: string;
}

interface SchemaVersion {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  generatedRulesCount: number;
  previousVersionId?: string;
  isArchived: boolean;
}

/**
 * VersionHistoryComponent: Display version history with timeline
 * Phase 16D Frontend Component
 * 
 * Shows last 2 versions of schema in a timeline view
 */
export const VersionHistoryComponent: React.FC<VersionHistoryProps> = ({
  schemaId,
}) => {
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersion | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Load version history on mount
  useEffect(() => {
    loadVersionHistory();
  }, [schemaId]);

  /**
   * Load version history from API
   */
  const loadVersionHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/schema/${schemaId}/version-history`
      );
      if (!response.ok) throw new Error('Failed to load version history');

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Mock data for demo
      setVersions([
        {
          id: schemaId,
          version: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          description: 'Current version',
          generatedRulesCount: 24,
          isArchived: false,
        },
        {
          id: schemaId + '-v1',
          version: 1,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          description: 'Initial version',
          generatedRulesCount: 20,
          isArchived: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle version details view
   */
  const handleViewDetails = (version: SchemaVersion) => {
    setSelectedVersion(version);
    setDetailsDialogOpen(true);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Card>
        <CardHeader
          title="Version History"
          subtitle={`Total: ${versions.length} version(s)`}
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {versions.length === 0 ? (
            <Alert severity="info">No version history available</Alert>
          ) : (
            <Timeline position="alternate">
              {versions.map((version, index) => (
                <TimelineItem key={version.id}>
                  <TimelineOppositeContent color="textSecondary">
                    <Typography variant="caption">
                      {formatDate(version.createdAt)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      color={version.isArchived ? 'grey' : 'primary'}
                      variant={version.version === Math.max(...versions.map((v) => v.version)) ? 'filled' : 'outlined'}
                    />
                    {index < versions.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6">
                            Version {version.version}
                          </Typography>
                          {version.isArchived && (
                            <Chip label="Archived" size="small" variant="outlined" />
                          )}
                        </Box>

                        {version.description && (
                          <Typography variant="body2" color="textSecondary">
                            {version.description}
                          </Typography>
                        )}

                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Rules: {version.generatedRulesCount}
                        </Typography>

                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<InfoIcon />}
                            onClick={() => handleViewDetails(version)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                          >
                            Export
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Version {selectedVersion?.version} Details</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2">
              Created: {selectedVersion && formatDate(selectedVersion.createdAt)}
            </Typography>
            <Typography variant="subtitle2">
              Updated: {selectedVersion && formatDate(selectedVersion.updatedAt)}
            </Typography>
            <Typography variant="subtitle2">
              Generated Rules: {selectedVersion?.generatedRulesCount}
            </Typography>
            <Typography variant="subtitle2">
              Status: {selectedVersion?.isArchived ? 'Archived' : 'Active'}
            </Typography>
            {selectedVersion?.description && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  {selectedVersion.description}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="primary">
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionHistoryComponent;
