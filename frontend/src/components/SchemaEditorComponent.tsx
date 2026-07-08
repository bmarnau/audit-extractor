import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Snackbar,
  Grid,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useSchema, useUpdateSchema } from '../hooks/useSchemaAPI';
import { useSchemaContext } from '../context/SchemaContext';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';

interface SchemaData {
  id: string;
  name: string;
  description: string;
  version: number;
  schema: Record<string, unknown>;
  generatedRulesCount?: number;
  averageConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * SchemaEditorComponent: Edit schema metadata and description
 * Phase 17: Updated with React Router and API Hooks
 */
export const SchemaEditorComponent: React.FC = () => {
  const { id: schemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { schema, loading, error: loadError, refetch } = useSchema(schemaId || null);
  const { updateSchema, loading: saving, error: saveError } = useUpdateSchema(schemaId || null);
  const { setCurrentSchema } = useSchemaContext();
  
  // Validation rules
  const validationRules: ValidationRules = {
    description: [
      value => {
        if (value && value.length > 5000) {
          return 'Description must be less than 5000 characters';
        }
        return null;
      },
    ],
  };

  // Form validation hook
  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
  } = useFormValidation(
    { description: '' },
    async (values) => {
      await updateSchema({
        description: values.description,
        metadata: { updatedVia: 'frontend-phase17' },
      });
      setSuccessMessage('Schema updated successfully');
      refetch();
    },
    validationRules
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // Update form when schema loads
  useEffect(() => {
    if (schema) {
      // setFormData({
      //   description: schema.description || '',
      // });
      setCurrentSchema(schema as any);
    }
  }, [schema, setCurrentSchema]);

  /**
   * Handle save
   */
  const handleSave = async () => {
    try {
      await updateSchema({
        description: formData.description,
        metadata: { lastEditVia: 'frontend-editor' },
      });
      setSuccessMessage('Schema updated successfully');
      refetch();
    } catch (err) {
      // Error is handled by the hook and displayed below
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError && !schema) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => navigate('/schemas')}>
          {loadError}
        </Alert>
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => navigate('/schemas')}>
          Schema not found
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
        <Typography variant="h5">Edit Schema</Typography>
      </Box>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Error Alert */}
          {saveError && (
            <Alert severity="error" onClose={() => {}}>
              {saveError}
            </Alert>
          )}

          {/* Schema Info Grid */}
          <Grid container spacing={2} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Schema ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {schema.id.substring(0, 12)}...
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Version
              </Typography>
              <Chip label={`v${schema.version}`} size="small" />
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
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date(schema.updatedAt).toLocaleDateString()}
              </Typography>
            </Grid>
            {schema.generatedRulesCount && (
              <>
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
                    {schema.averageConfidence ? (schema.averageConfidence * 100).toFixed(1) : 'N/A'}%
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>

          {/* Edit Fields */}
          <TextField
            label="Schema Name"
            fullWidth
            disabled
            value={schema.name}
            helperText="Schema name cannot be changed"
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter schema description..."
            helperText="Update the description to track changes"
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
            <Button
              onClick={() => navigate('/schemas')}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

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

export default SchemaEditorComponent;
