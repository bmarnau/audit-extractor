/**
 * Diff Viewer - Phase 15e
 * 
 * Zeigt Side-by-Side Vergleich zwischen zwei Extraktions-Läufen:
 * - Feldwert-Unterschiede
 * - Grüne Hervorhebung für neue/geänderte Werte
 * - Rote Hervorhebung für entfernte Werte
 * - Statistiken zu Unterschieden
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Compare as CompareIcon,
} from '@mui/icons-material';
import { formatDateFull } from '../../utils/dateFormatting';
import { getChangeIcon, getChangeColor } from '../../utils/colorMapping';

interface ExtractedRun {
  runId: string;
  timestamp: Date | string;
  documentId: string;
  extractedFields: Record<string, any>;
  coverage: number;
  averageConfidence: number;
  fieldCount: number;
  successfulFields: number;
  status: 'success' | 'partial' | 'failed';
}

interface FieldDifference {
  fieldName: string;
  changeType: 'added' | 'removed' | 'changed';
  previousValue: any;
  currentValue: any;
}

interface ComparisonResult {
  similarity: number;
  fieldsChanged: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  differences: FieldDifference[];
  summary: string;
}

interface DiffViewerProps {
  run1: ExtractedRun;
  run2: ExtractedRun;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ run1, run2 }) => {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiffDialog, setSelectedDiffDialog] = useState<FieldDifference | null>(null);

  // Fetch comparison data from API
  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/revision/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId1: run1.runId,
            runId2: run2.runId,
          }),
        });

        if (!response.ok) {
          throw new Error('Fehler beim Vergleichen der Läufe');
        }

        const result = await response.json();
        setComparison(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [run1, run2]);

  const formatValue = (value: any, maxLength = 50): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, maxLength) + '...';
    }
    return String(value).substring(0, maxLength);
  };




  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!comparison) {
    return <Alert severity="info">Keine Vergleichsdaten verfügbar</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CompareIcon sx={{ mr: 2 }} />
        <Typography variant="h6">Vergleich: {run1.documentId}</Typography>
      </Box>

      {/* Run Information Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardHeader
              title="Lauf 1"
              subheader={formatDateFull(run1.timestamp)}
              titleTypographyProps={{ variant: 'subtitle1' }}
              subheaderTypographyProps={{ variant: 'caption' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Felder: <strong>{run1.successfulFields}/{run1.fieldCount}</strong>
                </Typography>
                <Typography variant="body2">
                  Abdeckung: <strong>{(run1.coverage * 100).toFixed(1)}%</strong>
                </Typography>
                <Typography variant="body2">
                  Vertrauen: <strong>{(run1.averageConfidence * 100).toFixed(1)}%</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardHeader
              title="Lauf 2"
              subheader={formatDateFull(run2.timestamp)}
              titleTypographyProps={{ variant: 'subtitle1' }}
              subheaderTypographyProps={{ variant: 'caption' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Felder: <strong>{run2.successfulFields}/{run2.fieldCount}</strong>
                </Typography>
                <Typography variant="body2">
                  Abdeckung: <strong>{(run2.coverage * 100).toFixed(1)}%</strong>
                </Typography>
                <Typography variant="body2">
                  Vertrauen: <strong>{(run2.averageConfidence * 100).toFixed(1)}%</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comparison Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vergleich-Statistik
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Ähnlichkeit</Typography>
              <Typography variant="body2">
                <strong>{comparison.similarity.toFixed(1)}%</strong>
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, comparison.similarity))}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="orange">
                  {comparison.fieldsChanged}
                </Typography>
                <Typography variant="caption">Geändert</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="green">
                  {comparison.fieldsAdded}
                </Typography>
                <Typography variant="caption">Hinzugefügt</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="red">
                  {comparison.fieldsRemoved}
                </Typography>
                <Typography variant="caption">Entfernt</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">
                  {comparison.differences.length}
                </Typography>
                <Typography variant="caption">Unterschiede</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Field Differences Table */}
      {comparison.differences.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Typ</TableCell>
                <TableCell>Feldname</TableCell>
                <TableCell>Lauf 1 Wert</TableCell>
                <TableCell>Lauf 2 Wert</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparison.differences.map((diff, idx) => (
                <TableRow
                  key={idx}
                  sx={{ backgroundColor: getChangeColor(diff.changeType) }}
                >
                  <TableCell align="center" sx={{ width: 60 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {getChangeIcon(diff.changeType)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{diff.fieldName}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {diff.changeType === 'removed' || diff.changeType === 'changed'
                        ? formatValue(diff.previousValue)
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {diff.changeType === 'added' || diff.changeType === 'changed'
                        ? formatValue(diff.currentValue)
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => setSelectedDiffDialog(diff)}
                      variant="outlined"
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="success">✓ Keine Unterschiede gefunden - Läufe sind identisch</Alert>
      )}

      {/* Summary */}
      {comparison.summary && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Zusammenfassung
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="body2">{comparison.summary}</Typography>
          </Paper>
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={selectedDiffDialog !== null}
        onClose={() => setSelectedDiffDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Feldunterschiede</DialogTitle>
        <DialogContent>
          {selectedDiffDialog && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Feldname
                </Typography>
                <Typography variant="body2">{selectedDiffDialog.fieldName}</Typography>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getChangeIcon(selectedDiffDialog.changeType)}
                  <Typography variant="subtitle2" color="textSecondary">
                    Änderungstyp
                  </Typography>
                </Box>
                <Chip label={selectedDiffDialog.changeType} size="small" />
              </Box>

              <Divider />

              {(selectedDiffDialog.changeType === 'removed' ||
                selectedDiffDialog.changeType === 'changed') && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Lauf 1 Wert
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: '#ffcdd2',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      wordBreak: 'break-word',
                      overflowX: 'auto',
                    }}
                  >
                    <code>{JSON.stringify(selectedDiffDialog.previousValue, null, 2)}</code>
                  </Paper>
                </Box>
              )}

              {(selectedDiffDialog.changeType === 'added' ||
                selectedDiffDialog.changeType === 'changed') && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Lauf 2 Wert
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: '#c8e6c9',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      wordBreak: 'break-word',
                      overflowX: 'auto',
                    }}
                  >
                    <code>{JSON.stringify(selectedDiffDialog.currentValue, null, 2)}</code>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDiffDialog(null)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiffViewer;
