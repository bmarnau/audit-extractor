/**
 * DocumentExplorer Component
 * 
 * Zeigt Dokumente aus source-documents/ an.
 * Funktionen: Anzeige, Upload, Löschen, Metadaten.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Typography,
  Grid,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentMetadata } from '../services/documentService';

export const DocumentExplorer: React.FC = () => {
  const {
    documents,
    loading,
    error,
    uploadProgress,
    refreshDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentContent,
  } = useDocuments();

  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [contentPreviewOpen, setContentPreviewOpen] = useState(false);
  const [contentPreview, setContentPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  /**
   * Handelt Datei-Upload.
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDocument(files[i]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      event.currentTarget.value = ''; // Reset input
    }
  };

  /**
   * Öffnet Löschen-Dialog.
   */
  const handleDeleteClick = (id: string) => {
    setDocToDelete(id);
    setDeleteConfirmOpen(true);
  };

  /**
   * Bestätigt Löschen.
   */
  const handleConfirmDelete = async () => {
    if (docToDelete) {
      try {
        await deleteDocument(docToDelete);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
    setDeleteConfirmOpen(false);
    setDocToDelete(null);
  };

  /**
   * Zeigt Metadaten-Dialog.
   */
  const handleShowMetadata = (doc: DocumentMetadata) => {
    setSelectedDoc(doc);
    setMetadataDialogOpen(true);
  };

  /**
   * Zeigt Content-Preview.
   */
  const handleShowContent = async (doc: DocumentMetadata) => {
    try {
      const blob = await getDocumentContent(doc.id);
      const text = await blob.text();
      setContentPreview(text);
      setSelectedDoc(doc);
      setContentPreviewOpen(true);
    } catch (err) {
      console.error('Failed to get content:', err);
    }
  };

  /**
   * Formatiert Dateigröße.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Gibt Status-Chip-Farbe zurück.
   */
  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Document Explorer
      </Typography>

      {/* Fehler-Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          component="label"
          disabled={uploading}
        >
          Upload Files
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.html"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshDocuments}
          disabled={loading || uploading}
        >
          Refresh
        </Button>

        {uploading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        <Typography variant="body2" sx={{ ml: 'auto' }}>
          {documents.length} Dokument{documents.length !== 1 ? 'e' : ''}
        </Typography>
      </Box>

      {/* Upload-Progress */}
      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />
      )}

      {/* Dokumente-Tabelle */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Name</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Uploaded</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Keine Dokumente vorhanden. Laden Sie eine Datei hoch.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {doc.name}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={doc.type.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatFileSize(doc.size)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={doc.extractionStatus}
                      size="small"
                      color={getStatusColor(doc.extractionStatus)}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {doc.uploadedAt.toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Metadaten">
                      <IconButton
                        size="small"
                        onClick={() => handleShowMetadata(doc)}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Vorschau">
                      <IconButton
                        size="small"
                        onClick={() => handleShowContent(doc)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Löschen">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(doc.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Metadaten-Dialog */}
      <Dialog open={metadataDialogOpen} onClose={() => setMetadataDialogOpen(false)}>
        <DialogTitle>Document Metadata</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  {selectedDoc.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedDoc.type.toUpperCase()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Size
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formatFileSize(selectedDoc.size)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedDoc.extractionStatus}
                </Typography>
              </Grid>
              {selectedDoc.confidenceScore !== undefined && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Confidence
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {(selectedDoc.confidenceScore * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              )}
              {selectedDoc.pageCount !== undefined && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Pages
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {selectedDoc.pageCount}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  Uploaded
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedDoc.uploadedAt.toLocaleString('de-DE')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Content Preview Dialog */}
      <Dialog
        open={contentPreviewOpen}
        onClose={() => setContentPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview: {selectedDoc?.name}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={contentPreview}
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContentPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Document?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
