import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Snackbar,
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineOppositeContent, TimelineDot } from '@mui/lab';
import { ArrowBack as BackIcon, Info as InfoIcon } from '@mui/icons-material';
import { useVersionHistory } from '../hooks/useSchemaAPI';
import { useSchemaContext } from '../context/SchemaContext';

interface SchemaVersion {
  version: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * VersionHistoryComponent: Display version history with timeline
 * Phase 17: Updated with React Router and API Hooks
 */
export const VersionHistoryComponent: React.FC = () => {
  const { id: schemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { versions, loading, error } = useVersionHistory(schemaId || null);
  const { setVersionHistory } = useSchemaContext();
  
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersion | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Sync version history to context on load
   */
  useEffect(() => {
    if (versions && versions.length > 0) {
      setVersionHistory(versions);
    }
  }, [versions, setVersionHistory]);


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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !versions.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => navigate('/schemas')}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/schemas')}
        >
          Back
        </Button>
        <Typography variant="h5">Version History</Typography>
      </Box>

      <Card>
        <CardContent>
          {versions.length === 0 ? (
            <Alert severity="info">No version history available</Alert>
          ) : (
            <Timeline position="alternate">
              {versions.map((version, index) => (
                <TimelineItem key={`v${version.version}`}>
                  <TimelineOppositeContent color="textSecondary" sx={{ flex: 0.3 }}>
                    <Typography variant="caption">
                      {formatDate(version.createdAt)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      color={index === 0 ? 'primary' : 'grey'}
                      variant={index === 0 ? 'filled' : 'outlined'}
                    />
                    {index < versions.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2, flex: 1 }}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          Version {version.version}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Current" size="small" color="primary" variant="filled" />
                        )}
                      </Box>

                      {version.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {version.description}
                        </Typography>
                      )}

                      <Typography variant="caption" display="block" color="textSecondary">
                        Last updated: {formatDate(version.updatedAt)}
                      </Typography>

                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<InfoIcon />}
                          onClick={() => handleViewDetails(version)}
                        >
                          Details
                        </Button>
                      </Box>
                    </Paper>
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
          {selectedVersion && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedVersion.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedVersion.updatedAt)}
                </Typography>
              </Box>
              {selectedVersion.description && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedVersion.description}
                  </Typography>
                </Box>
              )}
              {selectedVersion.metadata && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Metadata
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {JSON.stringify(selectedVersion.metadata, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VersionHistoryComponent;
