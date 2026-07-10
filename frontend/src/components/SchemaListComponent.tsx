import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Snackbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSchemas, useUpdateSchema, useDeleteSchema } from '../hooks/useSchemaAPI';
import { useSchemaContext } from '../context/SchemaContext';

interface SchemaEntity {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  createdBy: string;
  fieldsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface SchemaListProps {
  onSchemaSelect?: (schema: SchemaEntity) => void;
  onSchemaCreate?: (schema: SchemaEntity) => void;
}

/**
 * SchemaListComponent: Display all schemas in a sortable, filterable table
 * Phase 17: Updated with React Hooks and React Router integration
 */
export const SchemaListComponent: React.FC<SchemaListProps> = ({
  onSchemaSelect,
  onSchemaCreate,
}) => {
  const navigate = useNavigate();
  const { schemas, loading, error, refetch } = useSchemas();
  const { setSchemas, setCurrentSchema, setLoading, setError } = useSchemaContext();
  
  const [selectedSchema, setSelectedSchema] = useState<SchemaEntity | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<SchemaEntity | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { updateSchema } = useUpdateSchema(selectedSchema?.id || null);
  const { deleteSchema } = useDeleteSchema(schemaToDelete?.id || null);

  /**
   * Sync schemas to context on load
   */
  useEffect(() => {
    if (schemas.length > 0) {
      setSchemas(schemas as any);
    }
    setLoading(loading);
    if (error) {
      setError(error);
    }
  }, [schemas, loading, error, setSchemas, setLoading, setError]);

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
      await updateSchema({
        description: editFormData.description,
      });

      setEditDialogOpen(false);
      setSuccessMessage('Schema updated successfully');
      refetch();
      
      if (onSchemaSelect) onSchemaSelect(selectedSchema);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Update failed');
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
      await deleteSchema();
      setDeleteConfirmOpen(false);
      setSchemaToDelete(null);
      setSuccessMessage('Schema deleted successfully');
      refetch();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Delete failed');
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
  const getStatusColor = (isActive: boolean): 'success' | 'default' => {
    return isActive ? 'success' : 'default';
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5">Schema Management</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
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
            <Typography variant="body2" sx={{ mb: 2 }}>
              Create a new schema to get started
            </Typography>
            <Button variant="contained" onClick={() => navigate('/schema-wizard')}>
              Create Schema
            </Button>
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
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fields</TableCell>
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
                    <Typography variant="body2">{schema.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{schema.description || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`v${schema.version}`} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schema.isActive ? 'Active' : 'Inactive'}
                      color={schema.isActive ? 'success' : 'default'}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">{schema.fieldsCount || 0}</TableCell>
                  <TableCell>{new Date(schema.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/schema/${schema.id}/edit`)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/schema/${schema.id}/history`)}
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

      {/* Success Notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>

      {/* API Error Notification */}
      <Snackbar
        open={!!apiError}
        autoHideDuration={6000}
        onClose={() => setApiError(null)}
      >
        <Alert severity="error">{apiError}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SchemaListComponent;
