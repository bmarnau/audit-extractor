/**
 * ExtractionWorkbench Component
 * 
 * Zeigt den gesamten Extraktionsfluss mit allen 10 Schritten.
 * Vollständige Transparenz - nichts versteckt!
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Divider,
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments';
import { useExtraction } from '../hooks/useExtraction';
import { ExtractionStep } from '../services/extractionService';

const STEP_LABELS = [
  'Source Document',
  'Parser Result',
  'Chunks',
  'Rules',
  'Prompt',
  'LLM Response',
  'Validation',
  'JSON Result',
  'Reflection',
  'Quality Report',
];

export const ExtractionWorkbench: React.FC = () => {
  const { documents } = useDocuments();
  const { workflow, loading, error, progress, startExtraction, reset } = useExtraction();
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [_copySuccess, setCopySuccess] = useState<number | null>(null);

  const handleStartExtraction = async () => {
    if (!selectedDocument) return;
    const doc = documents.find((d) => d.id === selectedDocument);
    if (!doc) return;

    await startExtraction(doc.id, doc.name);
  };

  const handleCopyToClipboard = (content: unknown) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(text);
    setCopySuccess(Date.now());
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (!workflow && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Extraction Workbench
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'textSecondary' }}>
          Wählen Sie ein Dokument und starten Sie den Extraktionsprozess. Alle Schritte werden
          transparent angezeigt.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Dokument auswählen
          </Typography>

          <Grid container spacing={2}>
            {documents.slice(0, 4).map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card
                  onClick={() => setSelectedDocument(doc.id)}
                  sx={{
                    cursor: 'pointer',
                    border:
                      selectedDocument === doc.id
                        ? '2px solid primary.main'
                        : '1px solid divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(1)} KB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleStartExtraction}
              disabled={!selectedDocument}
            >
              Start Extraction
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!workflow) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Extraction Workbench</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Reset">
            <IconButton onClick={reset} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Progress Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Processing Progress</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {workflow.steps.length}/10 steps
            </Typography>
          </Box>
          <Box sx={{ width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 1 }}>
            <Box
              sx={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#4caf50' : '#1976d2',
                borderRadius: 1,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Timeline / Stepper */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stepper activeStep={workflow.steps.length - 1} orientation="vertical">
          {STEP_LABELS.map((label, index) => {
            const step = workflow.steps[index];
            const isCompleted = step && step.status === 'completed';
            const isActive = index === workflow.steps.length - 1;

            return (
              <Step key={index} completed={isCompleted}>
                <StepLabel
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  sx={{ cursor: 'pointer' }}
                  icon={
                    isCompleted ? (
                      <CheckIcon sx={{ color: 'success.main' }} />
                    ) : isActive ? (
                      <CircularProgress size={24} />
                    ) : undefined
                  }
                >
                  <Typography
                    sx={{
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isCompleted ? 'success.main' : 'inherit',
                    }}
                  >
                    {label}
                  </Typography>
                </StepLabel>

                {/* Expanded Step Details */}
                {expandedStep === index && step && (
                  <Box sx={{ ml: 4, mt: 2, mb: 3 }}>
                    <StepDetails step={step} onCopy={handleCopyToClipboard} />
                  </Box>
                )}
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Loading Indicator */}
      {loading && workflow.steps.length < 10 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={32} />
          <Typography>Processing step {workflow.steps.length + 1} of 10...</Typography>
        </Box>
      )}

      {/* Completion Summary */}
      {workflow.overallStatus === 'completed' && (
        <Card sx={{ mt: 3, backgroundColor: '#f0f7f4' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
              <Typography variant="h6">Extraction Completed Successfully</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Total Duration
                </Typography>
                <Typography variant="body2">
                  {workflow.steps.reduce((sum, s) => sum + s.duration, 0)}ms
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Steps Completed
                </Typography>
                <Typography variant="body2">{workflow.steps.length}/10</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  Success
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Quality
                </Typography>
                <Typography variant="body2">96%</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

/**
 * StepDetails Komponente
 */
interface StepDetailsProps {
  step: ExtractionStep;
  onCopy: (content: unknown) => void;
}

const StepDetails: React.FC<StepDetailsProps> = ({ step, onCopy }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Duration: {step.duration}ms • {step.timestamp.toLocaleTimeString('de-DE')}
        </Typography>
        <Tooltip title={`Copy ${activeTab}`}>
          <IconButton
            size="small"
            onClick={() =>
              onCopy(activeTab === 'input' ? step.input : step.output)
            }
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Input" value="input" />
          <Tab label="Output" value="output" />
        </Tabs>

        <Box sx={{ p: 2, backgroundColor: '#fafafa', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {activeTab === 'input' ? (
            <JsonDisplay data={step.input} />
          ) : (
            <JsonDisplay data={step.output} />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * JSON Display Komponente
 */
interface JsonDisplayProps {
  data: Record<string, unknown>;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  return (
    <pre style={{ margin: 0, overflow: 'auto', maxHeight: 400 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};
