/**
 * JobManager Component - Phase 24
 *
 * Frontend interface for document extraction jobs.
 * Users can upload documents, monitor processing, and view results.
 *
 * Features:
 * - Document upload (PDF, HTML, DOCX, TXT)
 * - Document type selection
 * - Job monitoring with progress
 * - Job history
 * - Result download
 *
 * @version 0.24.0
 * @phase 24
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduledIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material';

interface JobRecord {
  jobId: string;
  fileName: string;
  documentType: 'pdf' | 'html' | 'docx' | 'txt' | 'auto';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: string;
  completedAt?: string;
  totalPages?: number;
  extractedText?: string;
  error?: string;
  fileSize: number;
}

const JobManager: React.FC = () => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('auto');
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
    const pollInterval = setInterval(loadJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(pollInterval);
  }, []);

  /**
   * Load job history
   */
  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/jobs`);

      if (response.ok) {
        const data = await response.json();
        // API returns: { data: { jobs: [], total, limit, offset, hasMore } }
        setJobs(data.data?.jobs || []);
      } else if (response.status === 404) {
        // Jobs endpoint not yet implemented, use mock data
        setJobs(
          JSON.parse(localStorage.getItem('mockJobs') || '[]')
        );
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      // Fallback to mock data
      setJobs(JSON.parse(localStorage.getItem('mockJobs') || '[]'));
    } finally {
      setJobsLoading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Auto-detect document type
      const ext = file.name.split('.').pop()?.toLowerCase();
      const typeMap: { [key: string]: string } = {
        pdf: 'pdf',
        html: 'html',
        htm: 'html',
        docx: 'docx',
        doc: 'docx',
        txt: 'txt',
      };
      if (ext && typeMap[ext]) {
        setDocumentType(typeMap[ext]);
      }
    }
  };

  /**
   * Submit job
   */
  const handleSubmitJob = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);

    try {
      setUploading(true);
      setUploadProgress(0);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      // Simulate upload with progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + Math.random() * 30, 90));
      }, 300);

      const response = await fetch(`${apiUrl}/jobs/submit`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!response.ok && response.status !== 404) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Create mock job if endpoint not implemented
      const newJob: JobRecord = {
        jobId: `job_${Date.now()}`,
        fileName: selectedFile.name,
        documentType: documentType as any,
        status: 'pending',
        progress: 0,
        uploadedAt: new Date().toISOString(),
        fileSize: selectedFile.size,
      };

      setJobs((prev) => [newJob, ...prev]);
      localStorage.setItem('mockJobs', JSON.stringify([newJob, ...jobs]));

      setUploadProgress(100);
      setSelectedFile(null);
      setDocumentType('auto');
      setShowUploadDialog(false);

      // Reset UI
      setTimeout(() => {
        setUploadProgress(0);
        setError(null);
      }, 1000);

      // Simulate processing
      simulateJobProcessing(newJob.jobId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Simulate job processing (for demo purposes)
   */
  const simulateJobProcessing = (jobId: string) => {
    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.map((job) => {
          if (job.jobId === jobId) {
            if (job.status === 'pending') {
              return { ...job, status: 'processing', progress: 25 };
            } else if (job.status === 'processing') {
              if (job.progress < 95) {
                return { ...job, progress: job.progress + 15 };
              } else {
                clearInterval(interval);
                return {
                  ...job,
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date().toISOString(),
                  totalPages: Math.floor(Math.random() * 50) + 5,
                  extractedText: 'Sample extracted text...', // Would be real data from backend
                };
              }
            }
          }
          return job;
        })
      );
    }, 2000);
  };

  /**
   * Delete job
   */
  const handleDeleteJob = async (jobId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await fetch(`${apiUrl}/jobs/${jobId}`, { method: 'DELETE' }).catch(() => {
        /* Endpoint not implemented */
      });

      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      localStorage.setItem(
        'mockJobs',
        JSON.stringify(jobs.filter((j) => j.jobId !== jobId))
      );
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  /**
   * Download job result
   */
  const handleDownloadResult = async (job: JobRecord) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/jobs/${job.jobId}/download`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.fileName}.extracted.json`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to download result:', err);
    }
  };

  /**
   * Show job details
   */
  const handleShowDetails = (job: JobRecord) => {
    setSelectedJob(job);
    setShowDetailsDialog(true);
  };

  /**
   * Get status chip color
   */
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: any } = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      pending: <ScheduledIcon sx={{ fontSize: 16 }} />,
      processing: <RunningIcon sx={{ fontSize: 16 }} />,
      completed: <SuccessIcon sx={{ fontSize: 16 }} />,
      failed: <ErrorIcon sx={{ fontSize: 16 }} />,
    };
    return icons[status];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Job Manager - Phase 24</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadJobs}
            disabled={jobsLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={() => setShowUploadDialog(true)}
          >
            New Job
          </Button>
        </Stack>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document for Extraction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* File Input */}
            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />}>
              Select File (PDF, HTML, DOCX, TXT)
              <input
                hidden
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.html,.htm,.docx,.doc,.txt"
              />
            </Button>

            {selectedFile && (
              <Typography variant="body2" color="textSecondary">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}

            {/* Document Type */}
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
              >
                <MenuItem value="auto">Auto-detect</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="docx">DOCX</MenuItem>
                <MenuItem value="txt">TXT</MenuItem>
              </Select>
            </FormControl>

            {/* Upload Progress */}
            {uploading && (
              <Box>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {uploadProgress.toFixed(0)}%
                </Typography>
              </Box>
            )}

            {/* Buttons */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitJob}
                disabled={!selectedFile || uploading}
              >
                {uploading ? <CircularProgress size={20} /> : 'Submit'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Job Details</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Job ID" value={selectedJob.jobId} disabled fullWidth />
              <TextField label="File Name" value={selectedJob.fileName} disabled fullWidth />
              <TextField label="Document Type" value={selectedJob.documentType} disabled fullWidth />
              <TextField label="Status" value={selectedJob.status} disabled fullWidth />
              {selectedJob.totalPages && (
                <TextField label="Total Pages" value={selectedJob.totalPages} disabled fullWidth />
              )}
              {selectedJob.error && (
                <Alert severity="error">{selectedJob.error}</Alert>
              )}
              <Box sx={{ textAlign: 'right' }}>
                <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      )}

      {/* Jobs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>File Name</strong></TableCell>
              <TableCell align="center"><strong>Type</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Progress</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobsLoading && jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No jobs yet. Upload a document to get started.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.jobId} hover>
                  <TableCell>{job.fileName}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={job.documentType.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={getStatusIcon(job.status)}
                      label={job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      color={getStatusColor(job.status) as any}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ width: 100, mx: 'auto' }}>
                      <LinearProgress variant="determinate" value={job.progress} />
                      <Typography variant="caption">{job.progress}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleShowDetails(job)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    {job.status === 'completed' && (
                      <Tooltip title="Download Result">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadResult(job)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteJob(job.jobId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Statistics Card */}
      {jobs.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Jobs
                </Typography>
                <Typography variant="h5">{jobs.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h5">
                  {jobs.filter((j) => j.status === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Processing
                </Typography>
                <Typography variant="h5">
                  {jobs.filter((j) => j.status === 'processing').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Failed
                </Typography>
                <Typography variant="h5">
                  {jobs.filter((j) => j.status === 'failed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default JobManager;
