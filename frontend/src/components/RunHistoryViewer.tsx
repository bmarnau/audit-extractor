/**
 * Run History Viewer - Phase 15e
 * 
 * Zeigt die Historie aller Extraktions-Läufe für ein Dokument:
 * - Timeline-Ansicht
 * - Metadaten anzeigen
 * - Vergleich ermöglichen
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  History as HistoryIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatDateFull } from '../../utils/dateFormatting';
import { getStatusIcon, getStatusColor } from '../../utils/colorMapping';

/**
 * Domain Model für ExtractedRun
 */
interface ExtractedRun {
  runId: string;
  timestamp: Date | string;
  ruleSetId: string;
  documentId: string;
  documentName: string;
  extractedFields: Record<string, any>;
  coverage: number;
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
  averageConfidence: number;
  fieldCount: number;
  successfulFields: number;
  failedFields: string[];
  executionTimeMs: number;
  ruleVersion: string;
  aggressiveness: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
  notes?: string;
}

interface RunHistoryViewerProps {
  documentId: string;
  onSelectRuns?: (run1: ExtractedRun, run2: ExtractedRun) => void;
  onRunDeleted?: (runId: string) => void;
}

const RunHistoryViewer: React.FC<RunHistoryViewerProps> = ({
  documentId,
  onSelectRuns,
  onRunDeleted,
}) => {
  const [runs, setRuns] = useState<ExtractedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRunDetail, setSelectedRunDetail] = useState<ExtractedRun | null>(null);

  // Laden der Run-Historie für das Dokument
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/revision/history/${documentId}`);

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Run-Historie');
        }

        const result = await response.json();
        const runsData: ExtractedRun[] = result.data?.runs || [];

        // Sortiere nach Timestamp (neueste zuerst)
        runsData.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

        setRuns(runsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchHistory();
    }
  }, [documentId]);

  const handleSelectRun = (runId: string) => {
    const newSelected = new Set(selectedRuns);

    if (newSelected.has(runId)) {
      newSelected.delete(runId);
    } else {
      newSelected.add(runId);
    }

    setSelectedRuns(newSelected);

    // Wenn 2 Läufe ausgewählt, aktiviere Vergleich
    if (newSelected.size === 2) {
      const selectedIds = Array.from(newSelected);
      const run1 = runs.find((r) => r.runId === selectedIds[0]);
      const run2 = runs.find((r) => r.runId === selectedIds[1]);

      if (run1 && run2 && onSelectRuns) {
        onSelectRuns(run1, run2);
      }
    }
  };

  const handleShowDetails = (run: ExtractedRun) => {
    setSelectedRunDetail(run);
    setDetailDialogOpen(true);
  };

  const handleDeleteRun = async (runId: string) => {
    try {
      const response = await fetch(`/api/revision/run/${runId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Runs');
      }

      setRuns(runs.filter((r) => r.runId !== runId));
      setSelectedRuns(new Set([...selectedRuns].filter((id) => id !== runId)));

      if (onRunDeleted) {
        onRunDeleted(runId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };




  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ mr: 2 }} />
        <Typography variant="h6">
          Extraktions-Historie ({runs.length} Läufe)
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {runs.length === 0 ? (
        <Alert severity="info">Keine Extraktions-Läufe vorhanden</Alert>
      ) : (
        <>
          {selectedRuns.size === 2 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              ✓ 2 Läufe ausgewählt - Sie können diese jetzt vergleichen
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell></TableCell>
                  <TableCell>Datum/Zeit</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Abdeckung</TableCell>
                  <TableCell align="center">Vertrauen</TableCell>
                  <TableCell align="center">Felder</TableCell>
                  <TableCell align="center">Zeit</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map((run, idx) => (
                  <TableRow
                    key={run.runId}
                    selected={selectedRuns.has(run.runId)}
                    sx={{
                      backgroundColor: selectedRuns.has(run.runId)
                        ? '#e3f2fd'
                        : 'white',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => handleSelectRun(run.runId)}
                  >
                    <TableCell align="center">{idx + 1}.</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateFull(run.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {getStatusIcon(run.status)}
                        <Chip
                          size="small"
                          label={run.status === 'success' ? 'OK' : 'Warnung'}
                          color={getStatusColor(run.status)}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${(run.coverage * 100).toFixed(0)}%`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(run.averageConfidence * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {run.successfulFields}/{run.fieldCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {run.executionTimeMs}ms
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<InfoIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDetails(run);
                          }}
                          variant="outlined"
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRun(run.runId);
                          }}
                          variant="outlined"
                        >
                          Löschen
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lauf-Details</DialogTitle>
        <DialogContent>
          {selectedRunDetail && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Run ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {selectedRunDetail.runId}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(selectedRunDetail.status)}
                    <Typography variant="body2">{selectedRunDetail.status}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Abdeckung
                  </Typography>
                  <Typography variant="body2">
                    {(selectedRunDetail.coverage * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Vertrauen
                  </Typography>
                  <Typography variant="body2">
                    {(selectedRunDetail.averageConfidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Aggressiveness
                  </Typography>
                  <Typography variant="body2">
                    {(selectedRunDetail.aggressiveness * 100).toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Felder ({selectedRunDetail.fieldCount})
                </Typography>
                <Typography variant="body2">
                  Erfolgreich: {selectedRunDetail.successfulFields}
                </Typography>
                {selectedRunDetail.failedFields.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="error">
                      Fehlgeschlagen: {selectedRunDetail.failedFields.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>

              {selectedRunDetail.validationErrors.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="error">
                      Validierungsfehler
                    </Typography>
                    <List dense>
                      {selectedRunDetail.validationErrors.map((err, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={err}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              )}

              {selectedRunDetail.warnings.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="warning.main">
                      Warnungen
                    </Typography>
                    <List dense>
                      {selectedRunDetail.warnings.map((warn, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={warn}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RunHistoryViewer;
