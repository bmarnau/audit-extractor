import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  FileUpload as FileUploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SchemaEntity {
  id: string;
  name: string;
  description: string;
  version: number;
  status: 'active' | 'archived' | 'draft';
  userId: string;
  fieldsCount: number;
  examplesCount: number;
  generatedRulesCount: number;
  averageConfidence: number;
  createdAt: string;
  updatedAt: string;
  directoryPath: string;
}

interface SchemaListProps {
  onSchemaSelect?: (schema: SchemaEntity) => void;
  onSchemaCreate?: (schema: SchemaEntity) => void;
}

/**
 * SchemaListComponent: Display all schemas in a sortable, filterable table
 * Phase 16D Frontend Component
 */
export const SchemaListComponent: React.FC<SchemaListProps> = ({
  onSchemaSelect,
  onSchemaCreate,
}) => {
  const [schemas, setSchemas] = useState<SchemaEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<SchemaEntity | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<SchemaEntity | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  });

  // Load schemas on mount
  useEffect(() => {
    loadSchemas();
  }, []);

  /**
   * Fetch schemas from API
   */
  const loadSchemas = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/schemas?page=1&limit=20');
      if (!response.ok) throw new Error('Failed to load schemas');

      const data = await response.json();
      // Mock: Since full pagination not yet implemented
      setSchemas(data.schemas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle opening edit dialog
   */
  const handleEditOpen = (schema: SchemaEntity) => {
    setSelectedSchema(schema);
    setEditFormData({
      name: schema.name,
      description: schema.description,
    });
    setEditDialogOpen(true);
  };

  /**
   * Handle schema update
   */
  const handleUpdateSchema = async () => {
    if (!selectedSchema) return;

    try {
      const response = await fetch(`/api/schema/${selectedSchema.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editFormData.description,
          metadata: { updatedVia: 'frontend-phase16d' },
        }),
      });

      if (!response.ok) throw new Error('Failed to update schema');

      setEditDialogOpen(false);
      loadSchemas();

      // Notify parent
      const updatedData = await response.json();
      if (onSchemaSelect) onSchemaSelect(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteClick = (schema: SchemaEntity) => {
    setSchemaToDelete(schema);
    setDeleteConfirmOpen(true);
  };

  /**
   * Handle schema deletion
   */
  const handleDeleteSchema = async () => {
    if (!schemaToDelete) return;

    try {
      const response = await fetch(`/api/schema/${schemaToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schema');

      setDeleteConfirmOpen(false);
      setSchemaToDelete(null);
      loadSchemas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  /**
   * Get status color chip
   */
  const getStatusColor = (
    status: 'active' | 'archived' | 'draft'
  ): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'archived':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Schema Manager</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadSchemas}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && schemas.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" gutterBottom>
              No schemas found
            </Typography>
            <Typography variant="body2">
              Create a new schema to get started
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && schemas.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Schema ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Fields
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Rules
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schemas.map((schema) => (
                <TableRow
                  key={schema.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f9f9f9' },
                  }}
                >
                  <TableCell>
                    <code style={{ fontSize: '0.75rem' }}>
                      {schema.id.substring(0, 8)}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      onClick={() => onSchemaSelect?.(schema)}
                    >
                      {schema.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`v${schema.version}`} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schema.status}
                      color={getStatusColor(schema.status)}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">{schema.fieldsCount}</TableCell>
                  <TableCell align="right">{schema.generatedRulesCount}</TableCell>
                  <TableCell>{formatDate(schema.createdAt)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditOpen(schema)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Version History"
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(schema)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Schema</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Schema Name"
              fullWidth
              disabled
              value={editFormData.name}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({ ...editFormData, description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSchema} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Schema?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the schema "{schemaToDelete?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteSchema}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchemaListComponent;
