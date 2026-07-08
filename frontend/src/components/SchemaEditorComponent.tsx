import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

interface SchemaEditorProps {
  schemaId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface SchemaData {
  id: string;
  name: string;
  description: string;
  version: number;
  schema: Record<string, unknown>;
  generatedRulesCount: number;
  averageConfidence: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * SchemaEditorComponent: Edit schema metadata and description
 * Phase 16D Frontend Component
 */
export const SchemaEditorComponent: React.FC<SchemaEditorProps> = ({
  schemaId,
  onSave,
  onCancel,
}) => {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Load schema on mount
  useEffect(() => {
    loadSchema();
  }, [schemaId]);

  /**
   * Load schema from API
   */
  const loadSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schema/${schemaId}`);
      if (!response.ok) throw new Error('Failed to load schema');

      const data = await response.json();
      setSchema(data);
      setFormData({
        name: data.name,
        description: data.description,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/schema/${schemaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          metadata: { lastEditVia: 'frontend-editor' },
        }),
      });

      if (!response.ok) throw new Error('Failed to save schema');

      // Reload schema to get updated version
      await loadSchema();
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!schema) {
    return (
      <Alert severity="error">Schema not found</Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Card>
        <CardHeader
          title={`Edit Schema: ${schema.name}`}
          subtitle={`Version ${schema.version} • ID: ${schema.id.substring(0, 8)}...`}
        />
        <Divider />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Schema Info Grid */}
          <Grid container spacing={2} sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Version
              </Typography>
              <Typography variant="body2">{schema.version}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Created
              </Typography>
              <Typography variant="body2">
                {new Date(schema.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Generated Rules
              </Typography>
              <Typography variant="body2">{schema.generatedRulesCount}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Average Confidence
              </Typography>
              <Typography variant="body2">
                {(schema.averageConfidence * 100).toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          {/* Edit Fields */}
          <TextField
            label="Schema Name"
            fullWidth
            disabled
            value={formData.name}
            helperText="Schema name cannot be changed. Create a new version to modify."
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter schema description..."
            helperText="Update the schema description to track changes."
          />

          {/* Field Count */}
          <Typography variant="body2" color="textSecondary">
            This schema defines {schema.schema.properties ? Object.keys(schema.schema.properties).length : 0} fields
          </Typography>

          <Divider />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SchemaEditorComponent;
