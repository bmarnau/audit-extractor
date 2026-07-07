/**
 * ExtractionFeedbackForm Component
 * Phase 14d: Learning & Feedback
 * 
 * Erfasst Nutzer-Korrektionen auf Extraction Results
 * - Field-Feedback mit Issue-Typ
 * - Severity-Bewertung
 * - Optional: Benutzer-Email
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Send as SendIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { apiClient, ApiError } from '@/services/apiClient';
import { API_CONFIG } from '@/config/api.config';

export interface FieldFeedback {
  field: string;
  originalValue?: string;
  correctedValue: string;
  issue: 'WRONG_VALUE' | 'MISSING' | 'FALSE_POSITIVE' | 'LOW_CONFIDENCE';
  severity: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ExtractionFeedbackFormProps {
  resultId: string;
  docType: string;
  extractedFields: Array<{ field: string; value: string; confidence: number }>;
  onSuccess?: (feedbackId: string) => void;
  onError?: (error: string) => void;
  loading?: boolean;
}

const ISSUE_OPTIONS = [
  { value: 'WRONG_VALUE', label: 'Wrong Value', icon: ErrorIcon, color: 'error' },
  { value: 'MISSING', label: 'Missing Field', icon: WarningIcon, color: 'warning' },
  { value: 'FALSE_POSITIVE', label: 'False Positive', icon: InfoIcon, color: 'info' },
  { value: 'LOW_CONFIDENCE', label: 'Low Confidence', icon: WarningIcon, color: 'warning' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'error' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'low', label: 'Low', color: 'success' },
];

export const ExtractionFeedbackForm: React.FC<ExtractionFeedbackFormProps> = ({
  resultId,
  docType,
  extractedFields,
  onSuccess,
  onError,
  loading: externalLoading = false,
}) => {
  const [feedback, setFeedback] = useState<FieldFeedback[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [includeEmail, setIncludeEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);

  const addFieldFeedback = (fieldFeedback: FieldFeedback) => {
    setFeedback((prev) => {
      const existing = prev.findIndex((f) => f.field === fieldFeedback.field);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = fieldFeedback;
        return updated;
      }
      return [...prev, fieldFeedback];
    });
    setError(null);
  };

  const removeFieldFeedback = (field: string) => {
    setFeedback((prev) => prev.filter((f) => f.field !== field));
  };

  const handleSubmit = async () => {
    if (feedback.length === 0) {
      setError('Please add at least one feedback item');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const feedbackPath = API_CONFIG.EXTRACT.FEEDBACK(resultId);
      
      const response = await apiClient.post(feedbackPath, {
        docType,
        fieldFeedback: feedback,
        userEmail: includeEmail ? userEmail : undefined,
      });

      if (response.success && response.data) {
        setSuccess(`Feedback recorded successfully (${response.data.feedbackRecorded} items)`);
        setFeedback([]);
        setUserEmail('');
        onSuccess?.(response.data.resultId);
      } else {
        throw new Error(response.error || 'Failed to submit feedback');
      }
    } catch (err: any) {
      let msg = 'Failed to submit feedback';
      
      if (err instanceof ApiError) {
        msg = err.userMessage;
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
      onError?.(msg);
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title="Extraction Feedback"
        subheader={`${docType.toUpperCase()} • Result: ${resultId}`}
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ pt: 2 }}>
        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Instructions */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Help improve extraction accuracy by correcting any extracted fields below.
        </Alert>

        {/* Field Feedback Editor */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Extracted Fields ({extractedFields.length})
          </Typography>

          {extractedFields.length > 0 && (
            <>
              {/* Field Selector */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {extractedFields.map((field, idx) => (
                  <Chip
                    key={field.field}
                    label={`${field.field} (${(field.confidence * 100).toFixed(0)}%)`}
                    onClick={() => setSelectedFieldIndex(idx)}
                    variant={selectedFieldIndex === idx ? 'filled' : 'outlined'}
                    color={
                      field.confidence >= 0.9
                        ? 'success'
                        : field.confidence >= 0.7
                          ? 'warning'
                          : 'error'
                    }
                  />
                ))}
              </Box>

              {/* Current Field Feedback Form */}
              {extractedFields[selectedFieldIndex] && (
                <FieldFeedbackEditor
                  field={extractedFields[selectedFieldIndex]}
                  currentFeedback={feedback.find(
                    (f) => f.field === extractedFields[selectedFieldIndex].field
                  )}
                  onSave={(fb) => addFieldFeedback(fb)}
                  onRemove={(fieldName) => removeFieldFeedback(fieldName)}
                />
              )}
            </>
          )}
        </Box>

        {/* Feedback Summary */}
        {feedback.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Feedback Items ({feedback.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {feedback.map((f) => (
                <Chip
                  key={f.field}
                  label={`${f.field}: ${f.issue}`}
                  onDelete={() => removeFieldFeedback(f.field)}
                  color={SEVERITY_OPTIONS.find((s) => s.value === f.severity)?.color as any}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* User Email (Optional) */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeEmail}
                onChange={(e) => setIncludeEmail(e.target.checked)}
              />
            }
            label="Include email (optional)"
          />
          {includeEmail && (
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your.email@example.com"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={loading || externalLoading ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={feedback.length === 0 || loading || externalLoading}
          >
            Submit Feedback
          </Button>
          {feedback.length > 0 && (
            <Button variant="outlined" onClick={() => setFeedback([])}>
              Clear All
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Sub-component: Field Feedback Editor
 */
interface FieldFeedbackEditorProps {
  field: { field: string; value: string; confidence: number };
  currentFeedback?: FieldFeedback;
  onSave: (feedback: FieldFeedback) => void;
  onRemove: (field: string) => void;
}

const FieldFeedbackEditor: React.FC<FieldFeedbackEditorProps> = ({
  field,
  currentFeedback,
  onSave,
  onRemove,
}) => {
  const [correctedValue, setCorrectedValue] = useState(
    currentFeedback?.correctedValue || field.value
  );
  const [issue, setIssue] = useState<FieldFeedback['issue']>(
    currentFeedback?.issue || 'WRONG_VALUE'
  );
  const [severity, setSeverity] = useState<FieldFeedback['severity']>(
    currentFeedback?.severity || 'medium'
  );
  const [notes, setNotes] = useState(currentFeedback?.notes || '');

  const handleSave = () => {
    onSave({
      field: field.field,
      originalValue: field.value,
      correctedValue,
      issue,
      severity,
      notes: notes || undefined,
    });
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Grid container spacing={2}>
        {/* Original Value (Read-only) */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Original Value"
            value={field.value}
            disabled
            size="small"
            helperText={`Confidence: ${(field.confidence * 100).toFixed(1)}%`}
          />
        </Grid>

        {/* Corrected Value */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Corrected Value"
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            size="small"
            placeholder="Enter correct value"
          />
        </Grid>

        {/* Issue Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Issue Type</InputLabel>
            <Select value={issue} onChange={(e) => setIssue(e.target.value as any)} label="Issue Type">
              {ISSUE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Severity */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Severity</InputLabel>
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              label="Severity"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            placeholder="Any additional context..."
          />
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleSave}>
              Save Feedback
            </Button>
            {currentFeedback && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => onRemove(field.field)}
              >
                Remove
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
