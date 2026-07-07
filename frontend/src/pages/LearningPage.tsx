/**
 * LearningPage Component
 * Phase 14d: Dedicated route for Learning & Feedback workflow
 * 
 * Route: /learning?result=result-001
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LearningWorkflowContainer,
  ExtractionResult,
} from '@/components/learning';

/**
 * Learning Page
 * Displays the complete learning & feedback workflow
 * 
 * Query params:
 * - result: result ID (required)
 * - docType: document type (auto-detected from result if not provided)
 */
export const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resultId = searchParams.get('result');

  // Load extraction result
  useEffect(() => {
    if (!resultId) {
      setError('No result ID provided. Use ?result=xxx to specify a result.');
      setLoading(false);
      return;
    }

    loadExtractionResult(resultId);
  }, [resultId]);

  const loadExtractionResult = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from results/json directory (backend API)
      const response = await fetch(
        `/api/extract/results/${id}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        // Fallback: Try from local storage or session
        const cached = sessionStorage.getItem(`extraction-result-${id}`);
        if (cached) {
          setResult(JSON.parse(cached));
          return;
        }

        throw new Error(`Failed to load result: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        // Cache in session for quick reload
        sessionStorage.setItem(`extraction-result-${id}`, JSON.stringify(data.data));
      } else {
        throw new Error(data.error || 'Failed to load result');
      }
    } catch (err: any) {
      const message = err.message || 'Unknown error loading result';
      setError(message);
      console.error('Failed to load extraction result:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmitted = (feedbackId: string) => {
    console.log('Feedback submitted:', feedbackId);
    // Could show toast notification here
  };

  const handleImprovementsApplied = (count: number) => {
    console.log('Improvements applied:', count);
    // Reload result to show updated info
    if (resultId) {
      loadExtractionResult(resultId);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
        </Box>

        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'No extraction result available'}
        </Alert>

        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 2 }}>
      {/* Navigation */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="text"
        >
          Back to Results
        </Button>
      </Box>

      {/* Main Content */}
      <LearningWorkflowContainer
        result={result}
        onFeedbackSubmitted={handleFeedbackSubmitted}
        onImprovementsApplied={handleImprovementsApplied}
      />
    </Box>
  );
};

export default LearningPage;
