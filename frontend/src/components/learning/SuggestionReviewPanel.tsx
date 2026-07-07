/**
 * SuggestionReviewPanel Component
 * Phase 14d: Learning & Feedback
 * 
 * Zeigt AI-Vorschläge zur Regelverbesserung
 * - Liste verbesserter Muster mit Confidence-Score
 * - Estimated Improvement % pro Suggestion
 * - Toggle zum Ausführen (alle oder manuell select)
 * - Bestätigung → Apply improvements
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  AutoFixHigh as AutoFixIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { apiClient, ApiError } from '@/services/apiClient';
import { API_CONFIG } from '@/config/api.config';

export interface ExtractionSuggestion {
  field: string;
  currentPattern: string;
  suggestedPattern: string;
  reason: string;
  confidence: number;
  exampleCorrections: Array<{ original: string; corrected: string }>;
  estimatedImprovement: number;
}

export interface SuggestionReviewPanelProps {
  resultId: string;
  docType: string;
  onApply?: (appliedCount: number) => void;
  onError?: (error: string) => void;
}

export const SuggestionReviewPanel: React.FC<SuggestionReviewPanelProps> = ({
  resultId,
  docType,
  onApply,
  onError,
}) => {
  const [suggestions, setSuggestions] = useState<ExtractionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyAll, setApplyAll] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [resultId, docType]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const suggestionsPath = API_CONFIG.EXTRACT.SUGGESTIONS(resultId, docType);
      const response = await apiClient.get(suggestionsPath);

      if (response.success && response.data) {
        setSuggestions(response.data.suggestions || []);

        // Pre-select high-confidence suggestions
        if (response.data.suggestions) {
          const highConfidence = response.data.suggestions
            .filter((s: ExtractionSuggestion) => s.confidence > 0.8)
            .map((s: ExtractionSuggestion) => s.field);
          setSelectedSuggestions(new Set(highConfidence));
        }
      } else {
        throw new Error(response.error || 'Failed to load suggestions');
      }
    } catch (err: any) {
      let msg = 'Failed to load suggestions';
      
      if (err instanceof ApiError) {
        msg = err.userMessage;
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (field: string) => {
    const updated = new Set(selectedSuggestions);
    if (updated.has(field)) {
      updated.delete(field);
    } else {
      updated.add(field);
    }
    setSelectedSuggestions(updated);
  };

  const handleApply = async () => {
    setApplyLoading(true);
    setError(null);

    try {
      const suggestionsToApply = suggestions.filter(
        (s) => applyAll || selectedSuggestions.has(s.field)
      );

      const improvePath = API_CONFIG.EXTRACT.IMPROVE_RULES(docType);
      
      const response = await apiClient.post(improvePath, {
        suggestions: suggestionsToApply,
        applyAll,
      });

      if (response.success && response.data) {
        setApplyDialogOpen(false);
        setSuggestions([]); // Clear after applying
        onApply?.(response.data.suggestionsApplied);
      } else {
        throw new Error(response.error || 'Failed to apply improvements');
      }
    } catch (err: any) {
      let msg = 'Failed to apply improvements';
      
      if (err instanceof ApiError) {
        msg = err.userMessage;
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
      onError?.(msg);
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardHeader title="AI Suggestions" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardHeader title="AI Suggestions" />
        <CardContent>
          <Alert severity="info" icon={<InfoIcon />}>
            No improvement suggestions available yet. Submit feedback to generate suggestions.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const avgConfidence = (
    suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
  ).toFixed(2);
  const avgImprovement = (
    suggestions.reduce((sum, s) => sum + s.estimatedImprovement, 0) / suggestions.length
  ).toFixed(1);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title="AI Suggestions"
        subheader={`${suggestions.length} improvement(s) available`}
        action={
          <Button
            variant="contained"
            startIcon={<AutoFixIcon />}
            onClick={() => setApplyDialogOpen(true)}
            size="small"
          >
            Apply
          </Button>
        }
        sx={{ pb: 1 }}
      />
      <Divider />

      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <CardContent sx={{ pt: 0 }}>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Avg Confidence
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {(parseFloat(avgConfidence) * 100).toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={parseFloat(avgConfidence) * 100}
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Avg Improvement
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                +{avgImprovement}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(parseFloat(avgImprovement) * 10, 100)}
                color="success"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Suggestions List */}
        <List>
          {suggestions.map((suggestion, idx) => (
            <Box key={suggestion.field}>
              <ListItemButton
                selected={expandedSuggestion === suggestion.field}
                onClick={() =>
                  setExpandedSuggestion(
                    expandedSuggestion === suggestion.field ? null : suggestion.field
                  )
                }
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedSuggestions.has(suggestion.field)}
                      onChange={() => toggleSuggestion(suggestion.field)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label=""
                  sx={{ mr: 1 }}
                />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {suggestion.field}
                      </Typography>
                      <Chip
                        icon={<CheckIcon />}
                        label={`+${(suggestion.estimatedImprovement * 100).toFixed(0)}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={`${(suggestion.confidence * 100).toFixed(0)}% confident`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={suggestion.reason}
                />
              </ListItemButton>

              {expandedSuggestion === suggestion.field && (
                <Box sx={{ p: 2, backgroundColor: 'background.default', ml: 4 }}>
                  <Grid container spacing={2}>
                    {/* Pattern Comparison */}
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        Pattern Comparison
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: '#ffebee',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          mb: 1,
                        }}
                      >
                        <Typography variant="caption" display="block">
                          Current: {suggestion.currentPattern}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          backgroundColor: '#e8f5e9',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        }}
                      >
                        <Typography variant="caption" display="block">
                          Suggested: {suggestion.suggestedPattern}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Example Corrections */}
                    {suggestion.exampleCorrections && suggestion.exampleCorrections.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Example Corrections ({suggestion.exampleCorrections.length})
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {suggestion.exampleCorrections.slice(0, 3).map((ex, i) => (
                            <Box
                              key={i}
                              sx={{
                                p: 1,
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 0.5,
                              }}
                            >
                              <Typography variant="caption" display="block" color="textSecondary">
                                Before: {ex.original}
                              </Typography>
                              <Typography variant="caption" display="block" color="success.main">
                                After: {ex.corrected}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {idx < suggestions.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm">
        <DialogTitle>Apply Improvements</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />}
              label="Apply all suggestions"
            />
            {!applyAll && (
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                {selectedSuggestions.size} suggestion(s) selected
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={applyLoading || (!applyAll && selectedSuggestions.size === 0)}
            startIcon={applyLoading ? <CircularProgress size={20} /> : <AutoFixIcon />}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
