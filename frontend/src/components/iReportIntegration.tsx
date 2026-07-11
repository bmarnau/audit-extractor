/**
 * iReport Integration Component
 * 
 * Frontend interface for document conversion and iReport template integration
 * Supports document upload, template selection, conversion preview, and export
 * 
 * @version 0.24.0
 * @phase 24
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

// Types
interface iReportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'xlsx' | 'docx' | 'html';
  dataSource: string;
  createdDate: string;
}

interface ConversionJob {
  id: string;
  templateId: string;
  templateName: string;
  documentName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputFormat: string;
  convertedDate?: string;
  error?: string;
}

/**
 * iReport Integration Component
 * 
 * Features:
 * - iReport template library management
 * - Document upload and template selection
 * - Conversion progress tracking
 * - Format preview capability
 * - Batch conversion history
 */
const IReportIntegration: React.FC = () => {
  // State: Templates
  const [templates, setTemplates] = useState<iReportTemplate[]>([
    {
      id: 'template-001',
      name: 'Invoice Standard',
      description: 'Standard invoice format with company branding',
      format: 'pdf',
      dataSource: 'invoice_schema_v2.0.0',
      createdDate: '2026-07-01',
    },
    {
      id: 'template-002',
      name: 'Purchase Order Report',
      description: 'Detailed purchase order with line items',
      format: 'xlsx',
      dataSource: 'purchase_order_schema_v3.0.0',
      createdDate: '2026-06-15',
    },
    {
      id: 'template-003',
      name: 'Contract Document',
      description: 'Legal contract formatting with signatures',
      format: 'docx',
      dataSource: 'contract_schema_v2.0.0',
      createdDate: '2026-05-20',
    },
    {
      id: 'template-004',
      name: 'Delivery Note HTML',
      description: 'Interactive HTML delivery note',
      format: 'html',
      dataSource: 'delivery_note_schema_v1.5.0',
      createdDate: '2026-04-10',
    },
  ]);

  // State: Conversion Jobs
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([
    {
      id: 'job-001',
      templateId: 'template-001',
      templateName: 'Invoice Standard',
      documentName: 'invoice-2026-07-001.json',
      status: 'completed',
      progress: 100,
      outputFormat: 'pdf',
      convertedDate: '2026-07-11 10:30',
    },
    {
      id: 'job-002',
      templateId: 'template-002',
      templateName: 'Purchase Order Report',
      documentName: 'po-2026-07-045.json',
      status: 'processing',
      progress: 65,
      outputFormat: 'xlsx',
    },
  ]);

  // State: UI Controls
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedJobForPreview, setSelectedJobForPreview] = useState<ConversionJob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Handlers: Template Management
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setConversionError(null);
  };

  // Handlers: Upload Dialog
  const handleOpenUploadDialog = () => {
    setShowUploadDialog(true);
    setUploadedFile(null);
    setConversionError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setUploadedFile(event.target.files[0]);
    }
  };

  const handleUploadCancel = () => {
    setShowUploadDialog(false);
    setUploadedFile(null);
  };

  // Handler: Initiate Conversion
  const handleStartConversion = () => {
    if (!selectedTemplate) {
      setConversionError('Please select a template');
      return;
    }
    if (!uploadedFile) {
      setConversionError('Please select a document to convert');
      return;
    }

    // Simulate conversion
    setIsConverting(true);
    setShowUploadDialog(false);
    setConvertProgress(0);

    // Mock conversion progress
    const interval = setInterval(() => {
      setConvertProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Add new job to history
          const template = templates.find((t) => t.id === selectedTemplate)!;
          const newJob: ConversionJob = {
            id: `job-${Date.now()}`,
            templateId: selectedTemplate,
            templateName: template.name,
            documentName: uploadedFile.name,
            status: 'completed',
            progress: 100,
            outputFormat: template.format,
            convertedDate: new Date().toLocaleString(),
          };
          setConversionJobs([newJob, ...conversionJobs]);
          setIsConverting(false);
          setSelectedTemplate('');
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 800);
  };

  // Handler: Preview Job
  const handlePreviewJob = (job: ConversionJob) => {
    if (job.status !== 'completed') {
      setConversionError('Only completed conversions can be previewed');
      return;
    }
    setSelectedJobForPreview(job);
    setShowPreviewDialog(true);
  };

  // Handler: Download Job
  const handleDownloadJob = (job: ConversionJob) => {
    if (job.status !== 'completed') {
      setConversionError('Only completed conversions can be downloaded');
      return;
    }
    // Mock download
    alert(`Downloading ${job.documentName} as ${job.outputFormat.toUpperCase()}`);
  };

  // Handler: Delete Job
  const handleDeleteJob = (jobId: string) => {
    setConversionJobs(conversionJobs.filter((job) => job.id !== jobId));
  };

  // Handler: Clear History
  const handleClearHistory = () => {
    if (window.confirm('Clear all conversion history?')) {
      setConversionJobs([]);
    }
  };

  // Render: Status Chip
  const renderStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: any; icon?: any }> = {
      completed: { color: 'success', icon: <CheckCircleIcon /> },
      processing: { color: 'info' },
      pending: { color: 'warning' },
      failed: { color: 'error', icon: <ErrorIcon /> },
    };
    const config = statusConfig[status] || { color: 'default' };
    return <Chip label={status} color={config.color} variant="outlined" size="small" />;
  };

  // Render: Template Card
  const renderTemplateCard = (template: iReportTemplate, isSelected: boolean) => (
    <Card
      key={template.id}
      onClick={() => handleTemplateSelect(template.id)}
      sx={{
        cursor: 'pointer',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <CardHeader
        title={template.name}
        subheader={template.format.toUpperCase()}
        avatar={
          isSelected ? (
            <CheckCircleIcon sx={{ color: 'success.main' }} />
          ) : (
            <SettingsIcon sx={{ color: 'action.main' }} />
          )
        }
      />
      <Divider />
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="body2" color="textSecondary">
            {template.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`Data: ${template.dataSource}`} size="small" variant="outlined" />
          </Box>
          <Typography variant="caption" color="textSecondary">
            Created: {template.createdDate}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );

  // Statistics
  const completedCount = conversionJobs.filter((j) => j.status === 'completed').length;
  const processingCount = conversionJobs.filter((j) => j.status === 'processing').length;
  const failedCount = conversionJobs.filter((j) => j.status === 'failed').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          iReport Integration
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Convert documents using iReport templates for consistent formatting and data extraction
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{conversionJobs.length}</Typography>
            <Typography variant="body2" color="textSecondary">
              Total Conversions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
            <Typography variant="h6" sx={{ color: 'success.main' }}>
              {completedCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h6" sx={{ color: 'info.main' }}>
              {processingCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Processing
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
            <Typography variant="h6" sx={{ color: 'error.main' }}>
              {failedCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Failed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {conversionError && (
        <Alert severity="error" onClose={() => setConversionError(null)} sx={{ mb: 2 }}>
          {conversionError}
        </Alert>
      )}

      {/* Template Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Templates
        </Typography>
        <Grid container spacing={2}>
          {templates.map((template) =>
            renderTemplateCard(template, selectedTemplate === template.id)
          )}
        </Grid>
      </Box>

      {/* Conversion Progress */}
      {isConverting && (
        <Box sx={{ mb: 4 }}>
          <Card>
            <CardHeader title="Conversion in Progress" />
            <CardContent>
              <Stack spacing={2}>
                <LinearProgress variant="determinate" value={convertProgress} />
                <Typography variant="body2" color="textSecondary">
                  Converting: {uploadedFile?.name} → {templates.find((t) => t.id === selectedTemplate)?.format.toUpperCase()}
                </Typography>
                <Typography variant="body2">{Math.round(convertProgress)}%</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleOpenUploadDialog}
          disabled={!selectedTemplate || isConverting}
        >
          Convert Document
        </Button>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettings(!showSettings)}
        >
          Settings
        </Button>
        <Button
          variant="text"
          onClick={handleClearHistory}
          disabled={conversionJobs.length === 0}
        >
          Clear History
        </Button>
      </Box>

      {/* Conversion History */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Conversion History
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conversionJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No conversions yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                conversionJobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>{job.documentName}</TableCell>
                    <TableCell>{job.templateName}</TableCell>
                    <TableCell>
                      <Chip label={job.outputFormat.toUpperCase()} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{renderStatusChip(job.status)}</TableCell>
                    <TableCell align="right">{job.convertedDate || '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewJob(job)}
                          disabled={job.status !== 'completed'}
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadJob(job)}
                          disabled={job.status !== 'completed'}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteJob(job.id)}>
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
      </Box>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onClose={handleUploadCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Convert Document with iReport</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected Template
              </Typography>
              <Typography variant="body2">
                {templates.find((t) => t.id === selectedTemplate)?.name || 'None'}
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: '.json,.pdf,.html,.docx,.txt' }}
              onChange={handleFileSelect}
              label="Document"
              variant="outlined"
            />
            {uploadedFile && (
              <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>File:</strong> {uploadedFile.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Size:</strong> {(uploadedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadCancel}>Cancel</Button>
          <Button
            onClick={handleStartConversion}
            variant="contained"
            disabled={!uploadedFile}
          >
            Start Conversion
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conversion Preview</DialogTitle>
        <DialogContent>
          {selectedJobForPreview && (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2">Document</Typography>
                  <Typography variant="body2">{selectedJobForPreview.documentName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Template</Typography>
                  <Typography variant="body2">{selectedJobForPreview.templateName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Format</Typography>
                  <Chip label={selectedJobForPreview.outputFormat.toUpperCase()} />
                </Box>
                <Box>
                  <Typography variant="subtitle2">Converted</Typography>
                  <Typography variant="body2">{selectedJobForPreview.convertedDate}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  minHeight: 200,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  [Preview content would be displayed here based on format]
                  {'\n'}Template: {selectedJobForPreview.templateName}
                  {'\n'}Document: {selectedJobForPreview.documentName}
                  {'\n'}Output Format: {selectedJobForPreview.outputFormat}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (selectedJobForPreview) {
                handleDownloadJob(selectedJobForPreview);
                setShowPreviewDialog(false);
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IReportIntegration;
