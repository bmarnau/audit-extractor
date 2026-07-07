/**
 * AuditViewer - Phase 13 (Refactored)
 *
 * Zeigt Audit Trail für jedes extrahierte Feld.
 * ✅ Nutzt useAudit Hook - Keine Mockdaten mehr
 *
 * Features:
 * - Feld-by-Feld Audit via API
 * - Confidence Display
 * - Source Chunk Tracking
 * - Page Number + Section
 * - Export: JSON/Markdown
 * - Filter nach Dokumenten
 *
 * @version 0.13.0
 * @phase 13
 */

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import { useAudit, DocumentAuditReport } from '@/hooks/useAudit';

interface FieldAuditRecord {
  id: string;
  fieldName: string;
  value: any;
  confidence: number;
  validationStatus: 'valid' | 'partial' | 'flagged';
  sources: Array<{
    chunkId: string;
    section: string;
    pageNumber?: number;
    textSnippet: string;
    similarity: number;
  }>;
}

/**
 * AuditViewer Component
 */
export const AuditViewer: React.FC = () => {
  const { error, fetchAuditReport, exportAuditReport } = useAudit();
  
  // Local state
  const [documentId, setDocumentId] = useState<string>('');
  const [auditReport, setAuditReport] = useState<DocumentAuditReport | null>(null);
  const [selectedField, setSelectedField] = useState<FieldAuditRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetchReport = async () => {
    if (!documentId.trim()) return;
    
    setIsFetching(true);
    setFetchError(null);
    try {
      console.log('[AuditViewer] Fetching audit report for:', documentId);
      const report = await fetchAuditReport(documentId);
      setAuditReport(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit report';
      console.error('[AuditViewer] Error:', err);
      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleExport = (format: 'json' | 'markdown') => {
    if (!auditReport) return;
    
    const content = exportAuditReport(auditReport, format);
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/markdown' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-report-${auditReport.documentId}.${format === 'json' ? 'json' : 'md'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'flagged':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">📋 Audit Center</Typography>
        {auditReport && (
          <Box>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('json')}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              JSON
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('markdown')}
              variant="outlined"
            >
              Markdown
            </Button>
          </Box>
        )}
      </Box>

      {error && <Alert severity="error">❌ Error: {error}</Alert>}
      {fetchError && <Alert severity="error">❌ {fetchError}</Alert>}

      {/* Document Input */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          label="Document ID"
          placeholder="Enter document ID (e.g., invoice_001.pdf)"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleFetchReport()}
          disabled={isFetching}
          fullWidth
        />
        <Button 
          variant="contained" 
          onClick={handleFetchReport}
          disabled={isFetching || !documentId.trim()}
          sx={{ px: 3 }}
        >
          {isFetching ? 'Loading...' : 'Fetch'}
        </Button>
      </Box>

      {/* Loading State */}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Audit Records Table */}
      {auditReport && !isFetching && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              📄 {auditReport.documentName} - {auditReport.records.length} fields
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Report ID: {auditReport.reportId}
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="center">Confidence</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Sources</TableCell>
                  <TableCell align="center">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditReport.records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{record.fieldName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {JSON.stringify(record.value).substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${(record.confidence * 100).toFixed(0)}%`}
                        size="small"
                        color={record.confidence > 0.9 ? 'success' : record.confidence > 0.7 ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.validationStatus}
                        size="small"
                        color={getStatusColor(record.validationStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${record.sources?.length || 0}`} size="small" variant="filled" />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => {
                          setSelectedField(record);
                          setDetailsOpen(true);
                        }}
                      >
                        Show
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Statistics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>Total Fields</Typography>
              <Typography variant="h5">{auditReport.statistics?.totalFields || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>Valid Fields</Typography>
              <Typography variant="h5" sx={{ color: 'green' }}>{auditReport.statistics?.validFields || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>Partial Fields</Typography>
              <Typography variant="h5" sx={{ color: 'orange' }}>{auditReport.statistics?.partialFields || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>Flagged Fields</Typography>
              <Typography variant="h5" sx={{ color: 'red' }}>{auditReport.statistics?.flaggedFields || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>Avg Confidence</Typography>
              <Typography variant="h5">
                {((auditReport.statistics?.averageConfidence || 0) * 100).toFixed(1)}%
              </Typography>
            </Paper>
          </Box>
        </>
      )}

      {/* Field Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Field Details: {selectedField?.fieldName}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedField && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Value
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace' }}>
                {JSON.stringify(selectedField.value, null, 2)}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Confidence: {(selectedField.confidence * 100).toFixed(1)}% | Status: {selectedField.validationStatus}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Sources ({selectedField.sources?.length || 0})
              </Typography>
              {(selectedField.sources || []).map((source, idx) => (
                <Paper key={idx} sx={{ mb: 1, p: 1 }}>
                  <Typography variant="body2">
                    <strong>Chunk:</strong> {source.chunkId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Section:</strong> {source.section}
                    {source.pageNumber && ` | Page: ${source.pageNumber}`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Snippet:</strong> "{source.textSnippet}"
                  </Typography>
                  <Typography variant="body2">
                    <strong>Similarity:</strong> {(source.similarity * 100).toFixed(1)}%
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
