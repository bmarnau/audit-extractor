/**
 * RuleEditorForm - Formular zum Erstellen/Bearbeiten von Regeln
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { ExtractionRule } from '../services/ruleService';

interface RuleEditorFormProps {
  rule?: ExtractionRule;
  onSave: (rule: ExtractionRule) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const RuleEditorForm: React.FC<RuleEditorFormProps> = ({
  rule,
  onSave,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<ExtractionRule>(
    rule || {
      id: `rule-${Date.now()}`,
      fieldName: '',
      pattern: 'regex',
      expression: '',
      description: '',
      isRequired: false,
      confidence: 0.85,
      testCases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      tags: [],
    }
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const handleFieldChange = (field: keyof ExtractionRule, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormError(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.fieldName.trim()) {
      setFormError('Field Name ist erforderlich');
      return false;
    }
    if (!formData.expression.trim()) {
      setFormError('Expression ist erforderlich');
      return false;
    }
    if (!formData.description.trim()) {
      setFormError('Description ist erforderlich');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || formError}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Field Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Field Name"
            value={formData.fieldName}
            onChange={(e) => handleFieldChange('fieldName', e.target.value)}
            placeholder="z.B. invoiceNumber"
            disabled={isLoading}
          />
        </Grid>

        {/* Pattern Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isLoading}>
            <InputLabel>Pattern Type</InputLabel>
            <Select
              value={formData.pattern}
              onChange={(e) => handleFieldChange('pattern', e.target.value)}
              label="Pattern Type"
            >
              <MenuItem value="regex">Regex</MenuItem>
              <MenuItem value="keyword">Keyword</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <FormHelperText>
              {formData.pattern === 'regex' && 'Regulärer Ausdruck (z.B. /INV-\\d+/)'}
              {formData.pattern === 'keyword' && 'Suchtext (z.B. "Kunde:")'}
              {formData.pattern === 'date' && 'Datumsformat (z.B. DD.MM.YYYY)'}
              {formData.pattern === 'custom' && 'Benutzerdefinierte Logik'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Expression */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Expression"
            value={formData.expression}
            onChange={(e) => handleFieldChange('expression', e.target.value)}
            placeholder={
              formData.pattern === 'regex'
                ? '/INV-\\d{4}-\\d{3}/'
                : formData.pattern === 'keyword'
                  ? 'Kunde:'
                  : 'DD.MM.YYYY'
            }
            disabled={isLoading}
            helperText="Pattern oder Ausdruck für die Extraktion"
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Beschreibung dieser Regel"
            disabled={isLoading}
          />
        </Grid>

        {/* Tags */}
        <Grid item xs={12}>
          <Box sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {(formData.tags || []).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  disabled={isLoading}
                />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Neues Tag eingeben"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              disabled={isLoading}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleAddTag}
              disabled={isLoading || !newTag.trim()}
            >
              Hinzufügen
            </Button>
          </Stack>
        </Grid>

        {/* Confidence */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ px: 1 }}>
            <Box sx={{ mb: 1 }}>
              <strong>Confidence: {(formData.confidence * 100).toFixed(0)}%</strong>
            </Box>
            <Slider
              value={formData.confidence}
              onChange={(_e, value) => handleFieldChange('confidence', Array.isArray(value) ? value[0] : value)}
              min={0}
              max={1}
              step={0.01}
              disabled={isLoading}
              marks={[
                { value: 0, label: '0%' },
                { value: 0.5, label: '50%' },
                { value: 1, label: '100%' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
            />
          </Box>
        </Grid>

        {/* Required */}
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRequired}
                onChange={(e) => handleFieldChange('isRequired', e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Erforderlich (Required)"
          />
        </Grid>

        {/* Version */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Version"
            value={formData.version}
            onChange={(e) => handleFieldChange('version', e.target.value)}
            placeholder="1.0.0"
            disabled={isLoading}
            helperText="Semantic Versioning"
          />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              onClick={onCancel}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Speichert...' : 'Speichern'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};
