/**
 * LearningWorkflowContainer Component
 * Phase 14d: Learning & Feedback
 * 
 * Kombiniert alle Lern-Komponenten in einer Extraction Results View:
 * - Original + Extracted Fields
 * - ExtractionFeedbackForm (inline)
 * - SuggestionReviewPanel (modal/drawer)
 * - ImprovementDashboard (sidebar)
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  SchoolSharp as LearningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ExtractionFeedbackForm } from './ExtractionFeedbackForm';
import { SuggestionReviewPanel } from './SuggestionReviewPanel';
import { ImprovementDashboard } from './ImprovementDashboard';

export interface ExtractionResult {
  resultId: string;
  docType: string;
  extractedFields: Array<{ field: string; value: string; confidence: number }>;
  missingFields: Array<{ field: string; reason: string }>;
  quality: { successRate: number; confidence: number };
}

export interface LearningWorkflowContainerProps {
  result: ExtractionResult;
  onFeedbackSubmitted?: (feedbackId: string) => void;
  onImprovementsApplied?: (count: number) => void;
}

export const LearningWorkflowContainer: React.FC<LearningWorkflowContainerProps> = ({
  result,
  onFeedbackSubmitted,
  onImprovementsApplied,
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [improvementsApplied, setImprovementsApplied] = useState(0);

  const handleFeedbackSubmitted = (feedbackId: string) => {
    setFeedbackSubmitted(true);
    onFeedbackSubmitted?.(feedbackId);
  };

  const handleImprovementsApplied = (count: number) => {
    setImprovementsApplied(count);
    onImprovementsApplied?.(count);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LearningIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4">Learning & Feedback Loop</Typography>
          <Typography variant="body2" color="textSecondary">
            Submit corrections to improve extraction patterns for future documents
          </Typography>
        </Box>
      </Box>

      {/* Status Alert */}
      {feedbackSubmitted && (
        <Alert
          severity="success"
          icon={<CheckIcon />}
          sx={{ mb: 2 }}
          onClose={() => setFeedbackSubmitted(false)}
        >
          Feedback submitted! AI is analyzing your corrections and will generate improvement suggestions.
        </Alert>
      )}

      {improvementsApplied > 0 && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
          {improvementsApplied} improvements applied! New patterns will be used for future extractions.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content (2/3 width) */}
        <Grid item xs={12} md={8}>
          {/* Extraction Results Summary */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Extraction Results"
              subheader={`${result.docType.toUpperCase()} • Result: ${result.resultId}`}
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Overall Quality
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {(result.quality.successRate * 100).toFixed(0)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Average Confidence
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {(result.quality.confidence * 100).toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Extracted Fields */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Extracted Fields ({result.extractedFields.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {result.extractedFields.map((field) => (
                  <Box
                    key={field.field}
                    sx={{
                      p: 1.5,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {field.field}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {field.value}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${(field.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color={field.confidence >= 0.9 ? 'success' : field.confidence >= 0.7 ? 'warning' : 'error'}
                    />
                  </Box>
                ))}
              </Box>

              {/* Missing Fields */}
              {result.missingFields.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Missing Fields ({result.missingFields.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {result.missingFields.map((field) => (
                      <Box
                        key={field.field}
                        sx={{
                          p: 1.5,
                          backgroundColor: '#fff3e0',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {field.field}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {field.reason}
                          </Typography>
                        </Box>
                        <Chip label="MISSING" size="small" variant="outlined" />
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <ExtractionFeedbackForm
            resultId={result.resultId}
            docType={result.docType}
            extractedFields={result.extractedFields}
            onSuccess={handleFeedbackSubmitted}
          />

          {/* Suggestions Panel */}
          <SuggestionReviewPanel
            resultId={result.resultId}
            docType={result.docType}
            onApply={handleImprovementsApplied}
          />
        </Grid>

        {/* Sidebar (1/3 width) */}
        <Grid item xs={12} md={4}>
          {/* Improvement Dashboard */}
          <Box sx={{ mb: 3 }}>
            <ImprovementDashboard docType={result.docType} />
          </Box>

          {/* Learning Tips Card */}
          <Card>
            <CardHeader title="Learning Tips" sx={{ pb: 1 }} />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Chip label="1" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Correct any field values</strong> that are wrong or incomplete.
                  </Typography>
                </Box>

                <Box>
                  <Chip label="2" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Mark missing fields</strong> to help the pattern engine find better patterns.
                  </Typography>
                </Box>

                <Box>
                  <Chip label="3" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Rate the severity</strong> so the system prioritizes high-impact fixes.
                  </Typography>
                </Box>

                <Box>
                  <Chip label="4" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Review AI suggestions</strong> and apply them when confidence is high.
                  </Typography>
                </Box>

                <Box>
                  <Chip label="5" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Monitor improvements</strong> in the dashboard as you provide feedback.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" icon={<InfoIcon />} sx={{ p: 1 }}>
                <Typography variant="caption">
                  Each correction helps the AI learn better patterns. Quality is more important than quantity!
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
